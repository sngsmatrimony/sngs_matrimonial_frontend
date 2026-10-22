'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { downloadProfilePptx } from '@/lib/adminProfilePptx';
import { formatRupees } from '@/lib/money';
import { toastError, toastSuccess } from '@/lib/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Download, Eye, Loader2, Search } from 'lucide-react';

/**
 * Alliance Meet registrations (stored in Supabase). Paid registrations by
 * default; "Started, not paid" shows people who opened the payment but didn't
 * finish. Each row links to the member's profile and exports it as PPTX —
 * the same export as on the user's admin page.
 */
const STATUS_TABS = [
  { value: 'paid', label: 'Registered (paid)' },
  { value: 'created', label: 'Started, not paid' },
  { value: 'all', label: 'All' },
];

const formatDateTime = (v) => new Date(v).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
});

export default function AdminAllianceRegistrationsPage() {
  const [status, setStatus] = useState('paid');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [exportingId, setExportingId] = useState(null);

  // Search after the admin pauses typing.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['adminAllianceRegistrations', status, page, search],
    queryFn: async () => (await adminApi.getAllianceRegistrations({ status, page, limit: 20, search })).data,
    placeholderData: keepPreviousData,
  });
  const { data: rows = [], pagination = {}, summary = {} } = data || {};

  const handleExport = async (member) => {
    setExportingId(member._id);
    try {
      await downloadProfilePptx(member._id, member.fullName);
      toastSuccess('Profile exported as PPTX.');
    } catch {
      toastError('Failed to export profile as PPTX');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-[#1A1A1A]">Alliance Meet Registrations</h1>
        <p className="font-sans text-sm text-[#2C3E50]/70 mt-1">
          Members who registered for the Alliance Meet. Open a profile or download it as PPTX for the event.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-[#D4A843]/15">
          <CardContent className="pt-6">
            <p className="font-sans text-sm text-[#2C3E50]/70">Registered (paid)</p>
            <p className="font-serif text-3xl font-semibold text-[#1A1A1A]">{summary.paidCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-[#D4A843]/15">
          <CardContent className="pt-6">
            <p className="font-sans text-sm text-[#2C3E50]/70">Collected (incl. gateway charges)</p>
            <p className="font-serif text-3xl font-semibold text-[#1A1A1A]">{formatRupees(summary.totalCollected ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#D4A843]/15">
        <CardHeader className="space-y-4">
          <CardTitle className="font-serif text-[#1A1A1A]">
            {pagination.total || 0} {pagination.total === 1 ? 'registration' : 'registrations'}
            {isFetching && !isLoading && <Loader2 className="inline w-4 h-4 ml-2 animate-spin text-[#D4A843]" />}
          </CardTitle>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by payment status">
              {STATUS_TABS.map((t) => (
                <Button
                  key={t.value}
                  variant={status === t.value ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={status === t.value}
                  onClick={() => { setStatus(t.value); setPage(1); }}
                  className={status === t.value ? 'bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A]' : 'border-[#D4A843]/30'}
                >
                  {t.label}
                </Button>
              ))}
            </div>
            <div className="md:ml-auto w-full md:w-80">
              <label htmlFor="am-search" className="block font-sans text-sm font-medium text-[#1A1A1A] mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2C3E50]/50" />
                <Input
                  id="am-search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Name, email or phone"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FDF8F0]">
                  <TableHead>Member</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-8 font-sans text-[#2C3E50]/60">Loading...</TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-8 font-sans text-[#C75B39]">
                      Couldn&apos;t load registrations right now. Please refresh the page to try again.
                    </TableCell>
                  </TableRow>
                ) : rows.length > 0 ? (
                  rows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-[#FDF8F0]/60">
                      <TableCell className="font-sans">
                        <div className="font-medium text-[#1A1A1A]">{r.member?.fullName || r.full_name || '—'}</div>
                        {r.member ? (
                          <div className="text-xs text-[#2C3E50]/70 capitalize">
                            {[r.member.age ? `${r.member.age} yrs` : null, r.member.gender, r.member.city].filter(Boolean).join(' · ')}
                          </div>
                        ) : (
                          <div className="text-xs text-[#C75B39]">Account deleted</div>
                        )}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-[#2C3E50]">
                        <div>{r.email || '—'}</div>
                        <div className="text-xs">{r.phone ? `+91 ${r.phone}` : ''}</div>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-[#1A1A1A] whitespace-nowrap">{formatRupees(Number(r.amount))}</TableCell>
                      <TableCell>
                        {r.status === 'paid' ? (
                          <div>
                            <Badge className="bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/30">Paid</Badge>
                            {r.receipt_number && <div className="font-sans text-xs text-[#2C3E50]/60 mt-1">{r.receipt_number}</div>}
                          </div>
                        ) : (
                          <Badge variant="secondary">{r.status === 'created' ? 'Not paid' : 'Failed'}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-[#2C3E50] whitespace-nowrap">{formatDateTime(r.created_at)}</TableCell>
                      <TableCell className="text-right">
                        {r.member ? (
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm" className="border-[#D4A843]/30">
                              <Link href={`/admin/users/${r.member._id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View Profile
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleExport(r.member)}
                              disabled={exportingId === r.member._id}
                              className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A]"
                            >
                              {exportingId === r.member._id
                                ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                : <Download className="w-4 h-4 mr-1" />}
                              {exportingId === r.member._id ? 'Exporting...' : 'Download PPTX'}
                            </Button>
                          </div>
                        ) : (
                          <span className="font-sans text-xs text-[#2C3E50]/60">Not available</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-8 font-sans text-[#2C3E50]/60">
                      {search ? 'No registrations match your search.' : status === 'paid' ? 'No one has registered for the Alliance Meet yet.' : 'Nothing to show here.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {rows.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#D4A843]/15">
              <div className="text-sm font-sans text-[#2C3E50]/70">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={!pagination.hasPrevPage}>
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(Math.min(pagination.pages, page + 1))} disabled={!pagination.hasNextPage}>
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
