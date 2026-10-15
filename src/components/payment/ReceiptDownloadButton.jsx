'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import client from '@/lib/api/client';
import { toastError } from '@/lib/toast';

/**
 * Downloads the PDF receipt for one of the member's paid orders
 * (GET /api/receipts/:orderId/pdf — the server checks it's theirs).
 */
export async function downloadReceipt(orderId) {
  const res = await client.get(`/api/receipts/${orderId}/pdf`, { responseType: 'blob', timeout: 30000 });
  const disposition = res.headers?.['content-disposition'] || '';
  const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || `SNGS-Receipt-${orderId}.pdf`;
  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ReceiptDownloadButton({ orderId, label = 'Download receipt (PDF)', variant = 'outline', className = '' }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      await downloadReceipt(orderId);
    } catch {
      toastError('Could not download the receipt. Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleClick}
      disabled={busy || !orderId}
      className={`h-11 gap-2 font-sans font-semibold border-[#D4A843]/60 text-[#1A1A1A] hover:bg-[#F5E6C3]/40 ${className}`}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {busy ? 'Preparing...' : label}
    </Button>
  );
}
