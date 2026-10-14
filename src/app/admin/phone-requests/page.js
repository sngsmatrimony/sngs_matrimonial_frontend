'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toastError } from '@/lib/toast';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

/**
 * Read-only log of every PHONE_CHAT_UNLOCK activity — replaces the old
 * admin-approval phone-request workflow. Contact/chat access is now a
 * purely self-service, credit-charged unlock (see
 * profile.controller.js's unlockContact), so there's nothing left for an
 * admin to approve or deny here, only to observe.
 */
export default function AdminPhoneChatUnlocksPage() {
  const [page, setPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['adminPhoneChatUnlocks', page],
    queryFn: async () => {
      const response = await adminApi.getPhoneChatUnlocks({ page, limit: 20 });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const { data: entries = [], pagination = {} } = data || {};

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const response = await adminApi.downloadPhoneChatUnlockReport();
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'contact-chat-unlocks.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toastError('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl text-[#1A1A1A]">Contact &amp; Chat Unlocks</h1>
          <p className="font-sans text-sm text-[#2C3E50]/70 mt-1">
            Every time a member spends credits to unlock a profile&apos;s phone number and chat access.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleDownloadReport}
          disabled={isDownloading}
          className="font-sans"
        >
          <Download className="w-4 h-4 mr-2" />
          {isDownloading ? 'Downloading...' : 'Download Report (PDF)'}
        </Button>
      </div>

      <Card className="border-[#D4A843]/15">
        <CardHeader>
          <CardTitle className="font-serif text-[#1A1A1A]">
            {pagination.total || 0} {pagination.total === 1 ? 'unlock' : 'unlocks'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FDF8F0]">
                  <TableHead>Member</TableHead>
                  <TableHead>Unlocked Contact Of</TableHead>
                  <TableHead>Credits Spent</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan="4" className="text-center py-8 font-sans text-[#2C3E50]/60">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : entries.length > 0 ? (
                  entries.map((entry) => (
                    <TableRow key={entry._id} className="hover:bg-[#FDF8F0]/60">
                      <TableCell className="font-sans">
                        <div className="font-medium text-[#1A1A1A]">{entry.userId?.fullName || 'Deleted user'}</div>
                        <div className="text-xs text-[#2C3E50]/60">{entry.userId?.email}</div>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-[#2C3E50]">
                        {entry.targetId?.fullName || 'Deleted user'}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-[#1A1A1A] font-medium">
                        {entry.metadata?.creditsSpent ?? '-'}
                      </TableCell>
                      <TableCell className="text-sm font-sans text-[#2C3E50]">
                        {new Date(entry.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="4" className="text-center py-8 font-sans text-[#2C3E50]/60">
                      No contact/chat unlocks yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {entries.length > 0 && (
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
    </div>
  );
}
