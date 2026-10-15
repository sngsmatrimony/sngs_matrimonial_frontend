'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Read-only list of "started filling" registration leads — people who
 * cleared the registration wizard's Quick Start step (name, age, place,
 * verified mobile, preferred partner age range) but haven't finished the
 * rest of the form yet. No automated reminder is sent; admins follow up
 * manually (call/WhatsApp) using the mobile number shown here. A lead drops
 * off this list once that person actually completes registration.
 */
// date_of_birth is a plain Postgres `date` ("1998-03-15"). new Date() would
// read that as UTC midnight and can shift it a day in the viewer's timezone.
function formatDob(value) {
  if (!value) return '—';
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminRegistrationLeadsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminRegistrationLeads', page],
    queryFn: async () => {
      const response = await adminApi.getRegistrationLeads({ page, limit: 20 });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const { data: leads = [], pagination = {} } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-[#1A1A1A]">Started Filling</h1>
        <p className="font-sans text-sm text-[#2C3E50]/70 mt-1">
          People who gave their name, age, place and a verified mobile number but haven&apos;t finished registering yet. Reach out to them directly — there&apos;s no automated reminder.
        </p>
      </div>

      <Card className="border-[#D4A843]/15">
        <CardHeader>
          <CardTitle className="font-serif text-[#1A1A1A]">
            {pagination.total || 0} {pagination.total === 1 ? 'person' : 'people'} waiting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FDF8F0]">
                  <TableHead>Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Place</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Preferred Age Range</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan="8" className="text-center py-8 font-sans text-[#2C3E50]/60">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan="8" className="text-center py-8 font-sans text-[#C75B39]">
                      Couldn&apos;t load this list right now. Please refresh the page to try again.
                    </TableCell>
                  </TableRow>
                ) : leads.length > 0 ? (
                  leads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-[#FDF8F0]/60">
                      <TableCell className="font-sans font-medium text-[#1A1A1A]">
                        {lead.full_name || '—'}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-[#2C3E50] capitalize">
                        {lead.gender && lead.seeking_gender
                          ? `${lead.gender} → ${lead.seeking_gender}`
                          : lead.gender || '—'}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-[#2C3E50]">
                        +91 {lead.mobile_number}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-[#2C3E50]">
                        {[lead.place_city, lead.place_country].filter(Boolean).join(', ') || '—'}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-[#2C3E50]">
                        {formatDob(lead.date_of_birth)}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-[#2C3E50]">
                        {lead.preferred_age_from && lead.preferred_age_to
                          ? `${lead.preferred_age_from} - ${lead.preferred_age_to}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm font-sans text-[#2C3E50] whitespace-nowrap">
                        {lead.steps_completed
                          ? <>
                              <span className="font-semibold text-[#1A1A1A]">{lead.steps_completed} of 7 steps</span>
                              {lead.last_saved_at && (
                                <span className="block text-xs text-[#2C3E50]/60">
                                  saved {new Date(lead.last_saved_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </>
                          : '1 of 7 steps'}
                      </TableCell>
                      <TableCell className="text-sm font-sans text-[#2C3E50]">
                        {new Date(lead.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="8" className="text-center py-8 font-sans text-[#2C3E50]/60">
                      No one has started filling out registration yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {leads.length > 0 && (
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
