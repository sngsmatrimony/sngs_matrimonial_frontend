'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Receipt, Loader2, ShoppingBag } from 'lucide-react';
import { client } from '@/lib/api/client';
import { toastError } from '@/lib/toast';

const STATUS_STYLES = {
  success: 'bg-[#2E7D32] text-white',
  pending: 'bg-[#D4A843] text-[#1A1A1A]',
  failed: 'bg-[#C75B39] text-white',
};

export default function TransactionHistory() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await client.get('/api/membership/transactions');
        setTransactions(res.data.data || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toastError('Failed to load your purchase history');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push('/settings')}
        className="flex items-center gap-1.5 font-sans text-sm text-[#2C3E50]/70 hover:text-[#1A1A1A] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </button>

      <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-2">Purchase History</h1>
      <p className="font-sans text-[#2C3E50]/70 mb-8">
        Your membership purchases — most recent 20 transactions.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#D4A843] animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <Card className="border-2 border-[#D4A843]/15">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <Receipt className="w-14 h-14 text-[#2C3E50]/30" />
              <div>
                <h3 className="font-serif text-lg text-[#1A1A1A] mb-1">No purchases yet</h3>
                <p className="font-sans text-sm text-[#2C3E50]/70">
                  Once you buy a membership plan, it&apos;ll show up here.
                </p>
              </div>
              <Button
                onClick={() => router.push('/membership/purchase')}
                className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] font-sans font-semibold"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                View Membership Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((txn) => (
            <Card key={txn._id} className="border-2 border-[#D4A843]/15">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                        {txn.planId?.name || 'Membership Plan'}
                      </h3>
                      <Badge className={`font-sans text-xs capitalize ${STATUS_STYLES[txn.status] || 'bg-gray-400 text-white'}`}>
                        {txn.status}
                      </Badge>
                    </div>
                    <p className="font-sans text-sm text-[#2C3E50]/70">
                      {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-2xl font-bold text-[#1A1A1A]">
                      ₹{txn.amount?.toLocaleString('en-IN')}
                    </p>
                    {txn.status === 'success' && (
                      <p className="font-sans text-xs text-[#2C3E50]/60">
                        {txn.creditsGranted} credits · {txn.validityDays === null ? 'unlimited validity' : `${txn.validityDays}-day validity`}
                      </p>
                    )}
                  </div>
                </div>

                {txn.status === 'failed' && txn.failureReason && (
                  <p className="font-sans text-sm text-[#C75B39] mt-3 pt-3 border-t border-[#D4A843]/10">
                    {txn.failureReason}
                  </p>
                )}

                {txn.refundStatus && (
                  <div className="mt-3 pt-3 border-t border-[#D4A843]/10">
                    <Badge className="bg-[#2C3E50] text-white font-sans text-xs capitalize mb-1">
                      Refund {txn.refundStatus}
                    </Badge>
                    <p className="font-sans text-sm text-[#2C3E50]/70">
                      ₹{txn.refundAmount?.toLocaleString('en-IN')} refunded
                      {txn.refundReason ? ` — ${txn.refundReason}` : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
