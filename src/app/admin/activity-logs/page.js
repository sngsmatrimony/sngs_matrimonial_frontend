'use client';

import { useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const ACTION_OPTIONS = [
  { value: 'LOGIN', label: 'Login' },
  { value: 'PROFILE_VIEW', label: 'Profile View' },
  { value: 'PDF_DOWNLOAD', label: 'PDF Download' },
  { value: 'EXPRESS_INTEREST', label: 'Express Interest' },
  { value: 'HOROSCOPE_DOWNLOAD', label: 'Horoscope Download' },
];

const ACTION_LABELS = Object.fromEntries(ACTION_OPTIONS.map((o) => [o.value, o.label]));

// Simple threshold-based highlighting — not a rules engine, just a scannable
// visual cue for admins reviewing recent activity per user.
function activityBadgeClass(count) {
  if (count > 20) return 'bg-[#FBEAE5] text-[#C75B39] border-[#E8B4A0]';
  if (count > 10) return 'bg-[#F5E6C3] text-[#8A6215] border-[#D4A843]/40';
  return 'bg-[#F5E6C3]/40 text-[#2C3E50]/70 border-[#D4A843]/20';
}

export default function AdminActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = {
    page,
    limit: 20,
    action: action === 'all' ? '' : action,
    search,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['adminActivityLogs', queryParams],
    queryFn: async () => {
      const response = await adminApi.getActivityLogs(queryParams);
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const { data: logs = [], pagination = {} } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-[#1A1A1A]">Activity Logs</h1>
        <p className="font-sans text-sm text-[#2C3E50]/70 mt-1">
          Audit trail of member logins, profile views, downloads, and express-interest actions —
          use it to spot unusually high activity from a single account (a common sign of a broker
          scraping the platform rather than a genuine member browsing).
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2C3E50]/40" />
          <Input
            placeholder="Search by member name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 font-sans"
          />
        </div>
        <Select value={action} onValueChange={(value) => { setAction(value); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-56 font-sans">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-[#D4A843]/15">
        <CardHeader>
          <CardTitle className="font-serif text-[#1A1A1A]">
            {pagination.total || 0} logged {pagination.total === 1 ? 'action' : 'actions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FDF8F0]">
                  <TableHead>Member</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target Profile</TableHead>
                  <TableHead>Actions (last 24h)</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan="5" className="text-center py-8 font-sans text-[#2C3E50]/60">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log._id} className="hover:bg-[#FDF8F0]/60">
                      <TableCell className="font-sans">
                        <div className="font-medium text-[#1A1A1A]">{log.userId?.fullName || 'Unknown'}</div>
                        <div className="text-xs text-[#2C3E50]/60">{log.userId?.email}</div>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-[#2C3E50]">
                        {ACTION_LABELS[log.action] || log.action}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-[#2C3E50]">
                        {log.targetId?.fullName || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={activityBadgeClass(log.userActionsLast24h)}>
                          {log.userActionsLast24h}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-sans text-[#2C3E50]">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="5" className="text-center py-8 font-sans text-[#2C3E50]/60">
                      No activity logged yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {logs.length > 0 && (
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
