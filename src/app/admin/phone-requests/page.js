'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toastError, toastSuccess } from '@/lib/toast';
import { ChevronLeft, ChevronRight, Check, X, MessageCircle } from 'lucide-react';

const STATUS_BADGE_CLASS = {
  pending: 'bg-[#F5E6C3] text-[#8A6215] border-[#D4A843]/40',
  approved: 'bg-[#E3F1E4] text-[#2E7D32] border-[#2E7D32]/30',
  denied: 'bg-[#FBEAE5] text-[#C75B39] border-[#E8B4A0]',
};

export default function AdminPhoneRequestsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(initialStatus);
  const [threadRequest, setThreadRequest] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const queryParams = { page, limit: 20, status };

  const { data, isLoading } = useQuery({
    queryKey: ['adminPhoneRequests', queryParams],
    queryFn: async () => {
      const response = await adminApi.getPhoneRequests(queryParams);
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 15 * 1000,
  });

  const { data: requests = [], pagination = {} } = data || {};

  const handleApprove = async (id) => {
    try {
      await adminApi.approvePhoneRequest(id);
      toastSuccess('Request approved — the member can now see this number');
      queryClient.invalidateQueries({ queryKey: ['adminPhoneRequests'] });
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleDeny = async (id) => {
    try {
      await adminApi.denyPhoneRequest(id);
      toastSuccess('Request denied');
      queryClient.invalidateQueries({ queryKey: ['adminPhoneRequests'] });
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to deny request');
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !threadRequest) return;
    setIsSubmittingReply(true);
    try {
      const response = await adminApi.sendPhoneRequestMessage(threadRequest._id, replyText.trim());
      setThreadRequest(response.data.data);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['adminPhoneRequests'] });
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-[#1A1A1A]">Phone Number Requests</h1>
        <p className="font-sans text-sm text-[#2C3E50]/70 mt-1">
          Free-tier members asking for approval to view another member&apos;s phone number.
        </p>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="denied">Denied</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-[#D4A843]/15">
        <CardHeader>
          <CardTitle className="font-serif text-[#1A1A1A]">
            {pagination.total || 0} {pagination.total === 1 ? 'request' : 'requests'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FDF8F0]">
                  <TableHead>Requester</TableHead>
                  <TableHead>Wants to view</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan="5" className="text-center py-8 font-sans text-[#2C3E50]/60">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : requests.length > 0 ? (
                  requests.map((req) => (
                    <TableRow key={req._id} className="hover:bg-[#FDF8F0]/60">
                      <TableCell className="font-sans">
                        <div className="font-medium text-[#1A1A1A]">{req.requesterId?.fullName || 'Unknown'}</div>
                        <div className="text-xs text-[#2C3E50]/60">{req.requesterId?.email}</div>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-[#2C3E50]">
                        {req.targetId?.fullName || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_BADGE_CLASS[req.status] || ''}>
                          {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-sans text-[#2C3E50]">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {req.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[#2E7D32] hover:text-white hover:bg-[#2E7D32] border-[#2E7D32]/30"
                                onClick={() => handleApprove(req._id)}
                                title="Approve"
                              >
                                <Check size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-white hover:bg-destructive"
                                onClick={() => handleDeny(req._id)}
                                title="Deny"
                              >
                                <X size={16} />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setThreadRequest(req)}
                            title="Message"
                          >
                            <MessageCircle size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="5" className="text-center py-8 font-sans text-[#2C3E50]/60">
                      No requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {requests.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#D4A843]/15">
              <div className="text-sm font-sans text-[#2C3E50]/70">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note thread dialog */}
      <Dialog open={!!threadRequest} onOpenChange={(open) => !open && setThreadRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-[#1A1A1A]">
              {threadRequest?.requesterId?.fullName} &rarr; {threadRequest?.targetId?.fullName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {threadRequest?.thread?.length > 0 ? (
              threadRequest.thread.map((msg, idx) => (
                <p
                  key={idx}
                  className={`font-sans text-sm p-2 rounded-lg ${
                    msg.from === 'admin' ? 'bg-[#F5E6C3]/40 text-[#1A1A1A]' : 'bg-[#FDF8F0] text-[#2C3E50]'
                  }`}
                >
                  <span className="font-semibold">{msg.from === 'admin' ? 'Admin' : 'Member'}:</span> {msg.text}
                </p>
              ))
            ) : (
              <p className="font-sans text-sm text-[#2C3E50]/60">No messages yet.</p>
            )}
          </div>

          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a message to the requester..."
            className="font-sans text-sm min-h-20"
          />

          <DialogFooter>
            <Button onClick={handleSendReply} disabled={isSubmittingReply || !replyText.trim()}>
              {isSubmittingReply ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
