'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import client from '@/lib/api/client';
import { formatRupees } from '@/lib/money';
import ReceiptDownloadButton from '@/components/payment/ReceiptDownloadButton';

const fetchReceipts = async (from, to) => {
  const res = await client.get('/api/receipts', { params: { ...(from && { from }), ...(to && { to }) } });
  return res.data.data || [];
};

const dateLabel = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const inputClass = 'h-12 w-full rounded-xl border border-[#D4A843]/30 bg-white px-3 font-sans text-[15px] text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#D4A843]/40';

/**
 * My Profile → Payment receipts: every paid plan, credit pack and Alliance
 * Meet registration, filterable by date, each with a PDF download.
 * Hidden for members who have never paid.
 */
export default function PaymentReceiptsSection() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const filtered = !!(from || to);

  const all = useQuery({ queryKey: ['myReceipts', '', ''], queryFn: () => fetchReceipts('', '') });
  const view = useQuery({
    queryKey: ['myReceipts', from, to],
    queryFn: () => fetchReceipts(from, to),
    enabled: filtered,
  });

  if (all.isLoading || !all.data?.length) return null;
  const receipts = filtered ? view.data : all.data;
  const loading = filtered && view.isLoading;

  return (
    <section aria-labelledby="receipts-heading" className="bg-white rounded-2xl shadow-sm mt-6 p-4 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="shrink-0 w-10 h-10 rounded-full bg-[#F5E6C3] flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#B8860B]" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div>
          <h2 id="receipts-heading" className="font-serif text-xl sm:text-2xl font-semibold text-[#1A1A1A]">Payment receipts</h2>
          <p className="font-sans text-[15px] text-[#2C3E50]/75 leading-relaxed">
            Download a PDF receipt for any of your payments. Pick dates to find one quickly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end mb-4">
        <div>
          <label htmlFor="receipts-from" className="block font-sans text-sm font-medium text-[#1A1A1A] mb-1">From date</label>
          <input id="receipts-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="receipts-to" className="block font-sans text-sm font-medium text-[#1A1A1A] mb-1">To date</label>
          <input id="receipts-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputClass} />
        </div>
        {filtered && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setFrom(''); setTo(''); }}
            className="h-12 font-sans text-[#2C3E50] hover:bg-[#FDF8F0]"
          >
            Clear dates
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[#B8860B]" /></div>
      ) : !receipts?.length ? (
        <p className="font-sans text-[15px] text-[#2C3E50]/70 py-4 text-center">No payments in these dates.</p>
      ) : (
        <ul className="divide-y divide-[#D4A843]/15 border-y border-[#D4A843]/15">
          {receipts.map((r) => (
            <li key={r.orderId} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[15px] font-semibold text-[#1A1A1A]">{r.title}</p>
                <p className="font-sans text-sm text-[#2C3E50]/70">
                  {dateLabel(r.date)} · Receipt {r.receiptNumber || '—'}
                  {r.refunded && <span className="ml-2 inline-block rounded-full bg-[#2C3E50]/10 px-2 py-0.5 text-xs font-medium text-[#2C3E50]">Refunded</span>}
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="font-sans text-[15px] font-semibold text-[#1A1A1A] tabular-nums">{formatRupees(r.amount)}</span>
                <ReceiptDownloadButton orderId={r.orderId} label="Download PDF" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
