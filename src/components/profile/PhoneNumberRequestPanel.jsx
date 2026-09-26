'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { Lock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toastSuccess, toastError } from '@/lib/toast';

/**
 * Replaces the masked "upgrade your membership" notice for a specific
 * profile's contact section with a 3-state flow: no request yet (button to
 * ask an admin to approve), pending (shows the note thread + a reply box),
 * or denied (lets the viewer send a new request). An approved request makes
 * the backend stop masking the number entirely, so this panel never
 * needs to render an "approved" state itself.
 */
export default function PhoneNumberRequestPanel({ profileId }) {
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['phoneRequestStatus', profileId],
    queryFn: async () => {
      const response = await client.get(`/api/profiles/${profileId}/phone-request-status`);
      return response.data.data;
    },
    enabled: !!profileId,
  });

  const requestMutation = useMutation({
    mutationFn: () => client.post(`/api/profiles/${profileId}/request-phone`),
    onSuccess: () => {
      toastSuccess('Request sent — an admin will review it shortly.');
      queryClient.invalidateQueries({ queryKey: ['phoneRequestStatus', profileId] });
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to send request');
    },
  });

  const replyMutation = useMutation({
    mutationFn: (text) => client.post(`/api/profiles/phone-requests/${data?._id}/message`, { text }),
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['phoneRequestStatus', profileId] });
    },
    onError: (error) => {
      toastError(error.response?.data?.message || 'Failed to send message');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-2 text-[#2C3E50]/70">
        <Lock size={16} className="text-[#D4A843]" />
        <span className="font-sans text-sm">Loading...</span>
      </div>
    );
  }

  const status = data?.status || 'none';

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 py-2 text-[#2C3E50]/70">
        <Lock size={16} className="text-[#D4A843] shrink-0 mt-0.5" />
        <span className="font-sans text-sm">
          {status === 'none' &&
            'Contact details are available after upgrading your membership, or you can ask an admin to approve access to this number.'}
          {status === 'pending' && 'Your request to view this number is awaiting admin approval.'}
          {status === 'denied' &&
            'Your previous request for this number was not approved. You can send a new request below.'}
        </span>
      </div>

      {(status === 'none' || status === 'denied') && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => requestMutation.mutate()}
          disabled={requestMutation.isPending}
          className="border-[#D4A843]/40 text-[#1A1A1A] hover:bg-[#F5E6C3]/40 font-sans"
        >
          {requestMutation.isPending ? 'Sending...' : 'Request Phone Number'}
        </Button>
      )}

      {status === 'pending' && data?.thread?.length > 0 && (
        <div className="space-y-2 p-3 bg-[#FDF8F0] border border-[#D4A843]/15 rounded-xl">
          {data.thread.map((msg, idx) => (
            <p key={idx} className={`font-sans text-xs ${msg.from === 'admin' ? 'text-[#1A1A1A]' : 'text-[#2C3E50]/70'}`}>
              <span className="font-semibold">{msg.from === 'admin' ? 'Admin' : 'You'}:</span> {msg.text}
            </p>
          ))}
        </div>
      )}

      {status === 'pending' && (
        <div className="flex gap-2 items-end">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Add a note for the admin (optional)"
            className="font-sans text-sm min-h-16"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => replyText.trim() && replyMutation.mutate(replyText)}
            disabled={replyMutation.isPending || !replyText.trim()}
          >
            <Send size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
