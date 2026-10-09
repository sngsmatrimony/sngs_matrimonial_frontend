'use client';

import { useState } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { formatDateDDMMYYYY } from '@/lib/time';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toastError, toastSuccess } from '@/lib/toast';
import { ChevronLeft, ChevronRight, IndianRupee } from 'lucide-react';

const STATUS_BADGE = {
  success: { variant: 'default', className: 'bg-[#E3F1E4] text-[#2E7D32] border-[#2E7D32]/30' },
  pending: { variant: 'outline', className: 'bg-[#F5E6C3] text-[#8A6215] border-[#D4A843]/40' },
  failed: { variant: 'destructive', className: '' },
};

export default function AdminTransactionsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['adminTransactions', statusFilter, page],
    queryFn: async () => {
      const params = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await adminApi.getAllTransactions(params);
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const transactions = data?.data || [];
  const pages = data?.pages || 1;
  const total = data?.total || 0;

  const handleRefund = async () => {
    if (!refundTarget) return;
    setIsRefunding(true);
    try {
      await adminApi.refundTransaction(refundTarget._id, { reason: refundReason || undefined });
      toastSuccess('Refund initiated successfully');
      setRefundTarget(null);
      setRefundReason('');
      queryClient.invalidateQueries({ queryKey: ['adminTransactions'] });
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to initiate refund');
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#1A1A1A]">Transactions</h1>
        <p className="font-sans text-[#2C3E50]/70 mt-1">Every membership purchase across all members</p>
      </div>

      <Card className="border-[#D4A843]/15">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="font-serif text-[#1A1A1A]">
              {total} {total === 1 ? 'Transaction' : 'Transactions'}
            </CardTitle>
            <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="success">Success</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="failed">Failed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 font-sans text-[#2C3E50]/60">Loading transactions...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FDF8F0]">
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((txn) => (
                      <TableRow key={txn._id} className="hover:bg-[#FDF8F0]/60">
                        <TableCell className="text-sm font-sans text-[#2C3E50]">
                          {formatDateDDMMYYYY(txn.createdAt)}
                        </TableCell>
                        <TableCell className="font-sans">
                          <div className="font-medium text-[#1A1A1A]">{txn.userId?.fullName || 'Deleted user'}</div>
                          <div className="text-xs text-[#2C3E50]/60">{txn.userId?.email}</div>
                        </TableCell>
                        <TableCell className="text-sm font-sans text-[#2C3E50]">{txn.planId?.name || '—'}</TableCell>
                        <TableCell className="text-sm font-sans text-[#1A1A1A] font-medium">
                          ₹{txn.amount?.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-sm font-sans text-[#2C3E50]">{txn.creditsGranted}</TableCell>
                        <TableCell>
                          <Badge
                            variant={STATUS_BADGE[txn.status]?.variant || 'secondary'}
                            className={`capitalize ${STATUS_BADGE[txn.status]?.className || ''}`}
                          >
                            {txn.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {txn.refundStatus ? (
                            <Badge variant="outline" className="capitalize">
                              {txn.refundStatus} · ₹{txn.refundAmount?.toLocaleString('en-IN')}
                            </Badge>
                          ) : (
                            <span className="text-xs font-sans text-[#2C3E50]/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {txn.status === 'success' && !txn.refundStatus && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[#C75B39] hover:text-white hover:bg-[#C75B39] border-[#C75B39]/30"
                              onClick={() => setRefundTarget(txn)}
                            >
                              <IndianRupee size={14} className="mr-1" />
                              Refund
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan="8" className="text-center py-8 font-sans text-[#2C3E50]/60">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#D4A843]/10">
              <p className="text-sm font-sans text-[#2C3E50]/60">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={16} className="mr-1" /> Previous
                </Button>
                <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!refundTarget} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Refund this transaction?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              This refunds ₹{refundTarget?.amount?.toLocaleString('en-IN')} to {refundTarget?.userId?.fullName} via Razorpay
              and deducts {refundTarget?.creditsGranted} credits from their account. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="font-sans text-sm">Reason (optional)</Label>
            <Textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Why is this being refunded?"
              className="font-sans"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRefunding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={isRefunding}
              className="bg-[#C75B39] hover:bg-[#C75B39]/90"
            >
              {isRefunding ? 'Processing...' : 'Confirm Refund'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
