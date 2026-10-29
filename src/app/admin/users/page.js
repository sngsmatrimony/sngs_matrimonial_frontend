'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { missingPhotoParts } from '@/lib/profilePhotos';
import { formatDateDDMMYYYY } from '@/lib/time';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toastError, toastSuccess } from '@/lib/toast';
import { Eye, Trash2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Search, Mail, ImageOff, Crown, ShieldCheck, X } from 'lucide-react';

const MISSING_DATA_FILTERS = [
  { key: 'missingProfilePicture', label: 'Missing Profile Picture' },
  { key: 'missingGalleryPhotos', label: 'Missing Gallery Photos' },
  { key: 'missingHoroscope', label: 'Missing Horoscope' },
  { key: 'missingIdProof', label: 'Missing ID Proof' },
];

const CANNED_SUBJECTS = {
  missingProfilePicture: 'Please add your profile picture',
  missingGalleryPhotos: 'Add a few more photos to your profile',
  missingHoroscope: 'Complete your horoscope details',
  missingIdProof: 'Add your ID proof to get the Verified badge',
};

const CANNED_MESSAGES = {
  missingProfilePicture: "We noticed your profile doesn't have a photo yet. Adding one helps other members recognize and connect with you — profiles with a photo get far more interest.\n\nPlease log in and add your profile picture when you get a chance.",
  missingGalleryPhotos: "A few more photos on your profile go a long way in helping potential matches get to know you better.\n\nPlease log in and add some gallery photos when you get a chance.",
  missingHoroscope: "Adding your horoscope details helps us find more compatible matches for you.\n\nPlease log in and complete your horoscope information when you get a chance.",
  missingIdProof: "Families feel more confident reaching out to profiles they know are genuine. Once you upload a government ID (Aadhaar, Passport, Driving Licence or Voter ID) and our team verifies it, your profile shows the Verified badge.\n\nYour ID is seen only by our team — never by other members. Please log in, open your profile and choose Upload ID Proof when you get a chance.",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialApprovalFilter = searchParams.get('approvalFilter') || 'all';
  // Drill-down filters from dashboard chart clicks (e.g. "Top Cities" bar ->
  // /admin/users?city=Kochi) — no dedicated UI control for these, just a
  // clearable chip shown when one is active via a deep link.
  const initialDrillDown = {
    gender: searchParams.get('gender') || '',
    maritalStatus: searchParams.get('maritalStatus') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
  };
  const [page, setPage] = useState(1);
  const [approvalFilter, setApprovalFilter] = useState(initialApprovalFilter);
  const [drillDown, setDrillDown] = useState(initialDrillDown);
  const activeDrillDown = Object.entries(drillDown).find(([, v]) => v);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [missingFilters, setMissingFilters] = useState({
    missingProfilePicture: false,
    missingGalleryPhotos: false,
    missingHoroscope: false,
    missingIdProof: false,
  });
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [idProofPendingOnly, setIdProofPendingOnly] = useState(searchParams.get('idProofPending') === 'true');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pageSize, setPageSize] = useState(20);
  const [selectingAll, setSelectingAll] = useState(false);
  // Set when "Select all matching" hit the per-email maximum.
  const [selectionCapped, setSelectionCapped] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingUserId, setRejectingUserId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [showBulkEmailDialog, setShowBulkEmailDialog] = useState(false);
  const [bulkEmailSubject, setBulkEmailSubject] = useState('');
  const [bulkEmailMessage, setBulkEmailMessage] = useState('');
  const [isBulkEmailSubmitting, setIsBulkEmailSubmitting] = useState(false);
  const [showReengageDialog, setShowReengageDialog] = useState(false);
  const [showReengageConfirm, setShowReengageConfirm] = useState(false);
  const [reengageInactiveDays, setReengageInactiveDays] = useState(30);
  const [reengageSubject, setReengageSubject] = useState('');
  const [reengageMessage, setReengageMessage] = useState('');
  const [isReengageSubmitting, setIsReengageSubmitting] = useState(false);

  // The pending-approvals banner and dashboard chart links navigate here with
  // query params; when the page is already open Next keeps it mounted, so
  // re-read them instead of relying on the initial useState values only.
  const searchParamsKey = searchParams.toString();
  useEffect(() => {
    setApprovalFilter(searchParams.get('approvalFilter') || 'all');
    setDrillDown({
      gender: searchParams.get('gender') || '',
      maritalStatus: searchParams.get('maritalStatus') || '',
      city: searchParams.get('city') || '',
      state: searchParams.get('state') || '',
    });
    setIdProofPendingOnly(searchParams.get('idProofPending') === 'true');
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsKey]);

  // Debounce the search box so we don't fire a request on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Clear the selection when the filters change (a different set of users).
  // Moving between pages keeps it, so ticks on page 1 survive going to page 2.
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectionCapped(null);
  }, [approvalFilter, search, missingFilters, premiumOnly, idProofPendingOnly, drillDown]);

  // Build query params
  const queryParams = {
    page,
    limit: pageSize,
    approvalStatus: approvalFilter === 'all' ? '' : approvalFilter,
    search,
    ...(missingFilters.missingProfilePicture && { missingProfilePicture: 'true' }),
    ...(missingFilters.missingGalleryPhotos && { missingGalleryPhotos: 'true' }),
    ...(missingFilters.missingHoroscope && { missingHoroscope: 'true' }),
    ...(missingFilters.missingIdProof && { missingIdProof: 'true' }),
    ...(premiumOnly && { premium: 'true' }),
    ...(idProofPendingOnly && { idProofPending: 'true' }),
    ...(drillDown.gender && { gender: drillDown.gender }),
    ...(drillDown.maritalStatus && { maritalStatus: drillDown.maritalStatus }),
    ...(drillDown.city && { city: drillDown.city }),
    ...(drillDown.state && { state: drillDown.state }),
  };

  const queryClient = useQueryClient();

  // Shares the admin header badge's query (same key), so no extra polling.
  const { data: pendingCounts } = useQuery({
    queryKey: ['adminPendingApprovalCount'],
    queryFn: async () => (await adminApi.getPendingApprovalCount()).data,
    refetchInterval: 60 * 1000,
  });
  const idProofPendingCount = pendingCounts?.data?.idProofPendingCount || 0;

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminUsers', queryParams],
    queryFn: async () => {
      const response = await adminApi.getAllUsers(queryParams);
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  const handleViewUser = (userId) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleDeleteUser = async () => {
    try {
      await adminApi.deleteUser(deletingUserId);
      toastSuccess('User deleted successfully');
      setShowDeleteDialog(false);
      setDeletingUserId(null);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await adminApi.approveUser(userId);
      toastSuccess('User approved successfully');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to approve user');
    }
  };

  const handleOpenRejectDialog = (userId) => {
    setRejectingUserId(userId);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleRejectUser = async () => {
    if (!rejectionReason.trim()) {
      toastError('Please provide a rejection reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.rejectUser(rejectingUserId, rejectionReason);
      toastSuccess('User rejected successfully');
      setShowRejectDialog(false);
      setRejectingUserId(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to reject user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilterChange = (value) => {
    setApprovalFilter(value);
    setPage(1); // Reset to first page when filter changes
  };

  const toggleMissingFilter = (key) => {
    setMissingFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    setPage(1);
  };

  const { data: users = [], pagination = {} } = data || {};

  const allOnPageSelected = users.length > 0 && users.every((u) => selectedIds.has(u._id));

  // Header checkbox: tick / untick this page's users, keeping other pages' ticks.
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      users.forEach((u) => (allOnPageSelected ? next.delete(u._id) : next.add(u._id)));
      return next;
    });
  };

  const totalMatching = pagination.total || 0;
  const allMatchingSelected = totalMatching > 0 && selectedIds.size >= Math.min(totalMatching, selectionCapped?.max || Infinity);

  // "Select all N users matching these filters" — every page, not just this one.
  const selectAllMatching = async () => {
    setSelectingAll(true);
    try {
      const { page: _p, limit: _l, ...filters } = queryParams;
      const res = await adminApi.getMatchingUserIds(filters);
      const { ids = [], capped, max, total } = res.data.data || {};
      setSelectedIds(new Set(ids));
      setSelectionCapped(capped ? { max, total } : null);
    } catch (error) {
      toastError(error.response?.data?.message || 'Could not select all matching users');
    } finally {
      setSelectingAll(false);
    }
  };

  const toggleSelectRow = (userId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const openBulkEmailDialog = () => {
    // Pre-fill with a canned nudge if exactly one missing-data filter is active
    const activeFilterKeys = Object.entries(missingFilters).filter(([, v]) => v).map(([k]) => k);
    if (activeFilterKeys.length === 1 && CANNED_SUBJECTS[activeFilterKeys[0]]) {
      setBulkEmailSubject(CANNED_SUBJECTS[activeFilterKeys[0]]);
      setBulkEmailMessage(CANNED_MESSAGES[activeFilterKeys[0]]);
    } else {
      setBulkEmailSubject('');
      setBulkEmailMessage('');
    }
    setShowBulkEmailDialog(true);
  };

  const handleSendBulkEmail = async () => {
    if (!bulkEmailSubject.trim() || !bulkEmailMessage.trim()) {
      toastError('Please provide a subject and message');
      return;
    }

    setIsBulkEmailSubmitting(true);
    try {
      const response = await adminApi.bulkEmailUsers(
        Array.from(selectedIds),
        bulkEmailSubject.trim(),
        bulkEmailMessage.trim()
      );
      toastSuccess(response.data.message || 'Sending emails…');
      setShowBulkEmailDialog(false);
      setSelectedIds(new Set());
      setSelectionCapped(null);
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to send emails');
    } finally {
      setIsBulkEmailSubmitting(false);
    }
  };

  const openReengageDialog = () => {
    setReengageSubject("We'd love to have you back");
    setReengageMessage("We noticed you haven't been active on SNGS Matrimonial in a while. Your matches are waiting — log in and continue your search for the perfect partner whenever you're ready.");
    setShowReengageDialog(true);
  };

  const { data: inactiveCountData, isFetching: isInactiveCountLoading } = useQuery({
    queryKey: ['inactiveUserCount', reengageInactiveDays],
    queryFn: async () => {
      const response = await adminApi.getInactiveUserCount(reengageInactiveDays);
      return response.data.data;
    },
    enabled: showReengageDialog && reengageInactiveDays > 0,
    staleTime: 30 * 1000,
  });

  const handleSendReengageEmail = () => {
    if (!reengageSubject.trim() || !reengageMessage.trim()) {
      toastError('Please provide a subject and message');
      return;
    }
    setShowReengageConfirm(true);
  };

  const confirmSendReengageEmail = async () => {
    setIsReengageSubmitting(true);
    try {
      const response = await adminApi.bulkEmailInactiveUsers(
        reengageInactiveDays,
        reengageSubject.trim(),
        reengageMessage.trim()
      );
      toastSuccess(response.data.message || 'Emails sent');
      setShowReengageConfirm(false);
      setShowReengageDialog(false);
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to send emails');
    } finally {
      setIsReengageSubmitting(false);
    }
  };

  const completionColor = (percent) =>
    percent >= 80 ? '#2E7D32' : percent >= 50 ? '#D4A843' : '#C75B39';

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary font-sans">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FBEAE5] border border-[#E8B4A0] border-l-4 border-l-[#C75B39] rounded-xl p-4">
        <p className="text-[#8A3B22] font-sans">Error loading users. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif text-secondary mb-2">User Management</h1>
        <p className="font-sans text-[#2C3E50]/70">Manage user accounts and approve new registrations</p>
      </div>

      {/* Approval Filter Tabs + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <Tabs value={approvalFilter} onValueChange={handleFilterChange} className="max-w-full overflow-x-auto">
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              <Clock size={14} />
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1">
              <CheckCircle size={14} />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1">
              <XCircle size={14} />
              Rejected
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2C3E50]/40" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or mobile"
            className="font-sans pl-9"
          />
        </div>
      </div>

      {/* Premium Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-sans text-xs text-[#2C3E50]/60 uppercase tracking-wide mr-1">Membership:</span>
        <button
          type="button"
          onClick={() => { setPremiumOnly((prev) => !prev); setPage(1); }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-colors ${
            premiumOnly
              ? 'bg-[#D4A843] border-[#D4A843] text-[#1A1A1A]'
              : 'bg-white border-[#D4A843]/30 text-[#2C3E50] hover:border-[#D4A843]'
          }`}
        >
          <Crown size={13} />
          Premium (bought any plan)
        </button>
        <span className="font-sans text-xs text-[#2C3E50]/60 uppercase tracking-wide ml-3 mr-1">ID proof:</span>
        <button
          type="button"
          onClick={() => { setIdProofPendingOnly((prev) => !prev); setPage(1); }}
          aria-pressed={idProofPendingOnly}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-colors ${
            idProofPendingOnly
              ? 'bg-[#D4A843] border-[#D4A843] text-[#1A1A1A]'
              : 'bg-white border-[#D4A843]/30 text-[#2C3E50] hover:border-[#D4A843]'
          }`}
        >
          <ShieldCheck size={13} />
          Awaiting verification{idProofPendingCount > 0 ? ` (${idProofPendingCount})` : ''}
        </button>
      </div>

      {/* Drill-down filter — set only via a dashboard chart click (e.g. Top
          Cities -> /admin/users?city=Kochi), no dedicated dropdown for it. */}
      {activeDrillDown && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-xs text-[#2C3E50]/60 uppercase tracking-wide mr-1">Filtered by:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-medium bg-[#2C3E50] text-white">
            {activeDrillDown[0]}: {activeDrillDown[1]}
            <button
              type="button"
              onClick={() => { setDrillDown({ gender: '', maritalStatus: '', city: '', state: '' }); setPage(1); router.replace('/admin/users'); }}
              aria-label="Clear filter"
              className="hover:text-[#D4A843]"
            >
              <X size={13} />
            </button>
          </span>
        </div>
      )}

      {/* Missing Data Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-sans text-xs text-[#2C3E50]/60 uppercase tracking-wide mr-1">Missing data:</span>
        {MISSING_DATA_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleMissingFilter(key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-colors ${
              missingFilters[key]
                ? 'bg-[#D4A843] border-[#D4A843] text-[#1A1A1A]'
                : 'bg-white border-[#D4A843]/30 text-[#2C3E50] hover:border-[#D4A843]'
            }`}
          >
            <ImageOff size={13} />
            {label}
          </button>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={openReengageDialog}
          className="ml-auto gap-1.5 border-[#D4A843]/40 text-[#1A1A1A]"
        >
          <Mail size={14} />
          Re-engage Inactive Users
        </Button>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-[#D4A843]/30 bg-gradient-to-r from-[#F5E6C3]/40 to-[#FDF8F0]">
          <div className="font-sans text-sm text-[#1A1A1A]">
            <p>
              <span className="font-semibold">{selectedIds.size}</span> user{selectedIds.size === 1 ? '' : 's'} selected
              {totalMatching > users.length && !allMatchingSelected && ' (across pages)'}
              {allMatchingSelected && totalMatching > users.length && ' — all users matching these filters'}
            </p>
            {selectionCapped && (
              <p className="text-xs text-[#C75B39] mt-0.5">
                The first {selectionCapped.max} of {selectionCapped.total} are selected — one email can go to at most {selectionCapped.max} people. Send, then narrow the filters for the rest.
              </p>
            )}
            {allOnPageSelected && totalMatching > users.length && !allMatchingSelected && (
              <button
                type="button"
                onClick={selectAllMatching}
                disabled={selectingAll}
                className="mt-0.5 text-sm font-semibold text-[#B8860B] underline underline-offset-2 hover:text-[#1A1A1A] disabled:opacity-60"
              >
                {selectingAll ? 'Selecting…' : `Select all ${totalMatching} users matching these filters`}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setSelectedIds(new Set()); setSelectionCapped(null); }}>
              Clear
            </Button>
            <Button size="sm" onClick={openBulkEmailDialog} className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A] gap-1.5">
              <Mail size={14} />
              Send Email
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <Card className="border-[#D4A843]/15">
        <CardHeader>
          <CardTitle className="font-serif text-[#1A1A1A]">Users ({pagination.total || 0} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FDF8F0]">
                  <TableHead className="w-10">
                    <Checkbox checked={allOnPageSelected} onCheckedChange={toggleSelectAll} aria-label="Select all on page" />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user._id} className="hover:bg-[#FDF8F0]/60" data-state={selectedIds.has(user._id) ? 'selected' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(user._id)}
                          onCheckedChange={() => toggleSelectRow(user._id)}
                          aria-label={`Select ${user.fullName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium font-sans text-[#1A1A1A]">{user.fullName}</TableCell>
                      <TableCell className="text-sm font-sans text-[#2C3E50]">{user.email}</TableCell>
                      <TableCell className="text-sm font-sans text-[#2C3E50]">{user.mobileNumber}</TableCell>
                      <TableCell className="font-sans text-[#2C3E50] capitalize">{user.gender || '-'}</TableCell>
                      <TableCell>
                        {(() => {
                          const m = user.membership;
                          const isCurrentlyValid = m?.isActive && (!m?.expiryDate || new Date(m.expiryDate) > new Date());
                          if (!isCurrentlyValid) {
                            return <span className="text-xs font-sans text-[#2C3E50]/40">No plan</span>;
                          }
                          return (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-sans font-medium text-[#1A1A1A]">{m.planId?.name || 'Plan'}</span>
                              <span className="text-[10px] font-sans text-[#2C3E50]/60">{m.credits} credits</span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.approvalStatus === 'approved'
                              ? 'default'
                              : user.approvalStatus === 'rejected'
                                ? 'destructive'
                                : 'outline'
                          }
                          className={
                            user.approvalStatus === 'pending'
                              ? 'bg-[#F5E6C3] text-[#8A6215] border-[#D4A843]/40'
                              : user.approvalStatus === 'approved'
                                ? 'bg-[#E3F1E4] text-[#2E7D32] border-[#2E7D32]/30'
                                : ''
                          }
                        >
                          {user.approvalStatus === 'pending' && <Clock size={12} className="mr-1" />}
                          {user.approvalStatus === 'approved' && <CheckCircle size={12} className="mr-1" />}
                          {user.approvalStatus === 'rejected' && <XCircle size={12} className="mr-1" />}
                          {user.approvalStatus?.charAt(0).toUpperCase() + user.approvalStatus?.slice(1) || 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[90px]" title={user.missingFields?.length ? `Missing: ${user.missingFields.join(', ')}` : undefined}>
                          <div className="flex-1 h-1.5 bg-[#2C3E50]/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${user.profileCompletion || 0}%`, backgroundColor: completionColor(user.profileCompletion || 0) }}
                            />
                          </div>
                          <span className="text-xs font-sans text-[#2C3E50]/70 tabular-nums">{user.profileCompletion || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-sans text-[#2C3E50]">
                        {formatDateDDMMYYYY(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          {user.approvalStatus === 'pending' && (
                            <>
                              {missingPhotoParts(user).length > 0 ? (
                                // The server refuses approval without both photos; say so up front.
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                  title={`Can't approve yet: missing ${missingPhotoParts(user).join(' and ')}`}
                                  className="text-[#C75B39] border-[#C75B39]/30 disabled:opacity-100"
                                >
                                  Needs Photos
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-[#2E7D32] hover:text-white hover:bg-[#2E7D32] border-[#2E7D32]/30"
                                  onClick={() => handleApproveUser(user._id)}
                                >
                                  <CheckCircle size={14} className="mr-1" />
                                  Approve
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-white hover:bg-destructive"
                                onClick={() => handleOpenRejectDialog(user._id)}
                              >
                                <XCircle size={14} className="mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewUser(user._id)}
                            title="View Details"
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingUserId(user._id);
                              setShowDeleteDialog(true);
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="11" className="text-center py-8 font-sans text-[#2C3E50]/60">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {users.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#D4A843]/15">
              <div className="flex flex-wrap items-center gap-3 text-sm font-sans text-[#2C3E50]/70">
                <span>Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)</span>
                <label className="flex items-center gap-2">
                  Rows per page
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="h-8 rounded-md border border-[#D4A843]/30 bg-white px-2 text-[#1A1A1A]"
                  >
                    {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
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

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Reject User Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this user. This will be sent to the user via email.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium font-sans text-[#2C3E50] mb-2">
              Rejection Reason <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              className="min-h-[120px]"
              maxLength={500}
            />
            <p className="text-xs font-sans text-[#2C3E50]/50 mt-1">{rejectionReason.length}/500 characters</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectUser}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              {isSubmitting ? 'Rejecting...' : 'Reject User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[#C75B39]">
              Delete User?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUserId(null)}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
            >
              Delete User
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Email Dialog */}
      <Dialog open={showBulkEmailDialog} onOpenChange={setShowBulkEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Send Email to {selectedIds.size} User{selectedIds.size === 1 ? '' : 's'}</DialogTitle>
            <DialogDescription>
              Each recipient gets their own individual email — no one sees anyone else&apos;s address.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div>
              <label className="block text-sm font-medium font-sans text-[#2C3E50] mb-2">
                Subject <span className="text-destructive">*</span>
              </label>
              <Input
                value={bulkEmailSubject}
                onChange={(e) => setBulkEmailSubject(e.target.value)}
                placeholder="Email subject"
                maxLength={150}
                className="font-sans"
              />
            </div>
            <div>
              <label className="block text-sm font-medium font-sans text-[#2C3E50] mb-2">
                Message <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={bulkEmailMessage}
                onChange={(e) => setBulkEmailMessage(e.target.value)}
                placeholder="Write your message..."
                className="min-h-[160px] font-sans"
                maxLength={2000}
              />
              <p className="text-xs font-sans text-[#2C3E50]/50 mt-1">{bulkEmailMessage.length}/2000 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkEmailDialog(false)} disabled={isBulkEmailSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSendBulkEmail}
              disabled={isBulkEmailSubmitting || !bulkEmailSubject.trim() || !bulkEmailMessage.trim()}
              className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A]"
            >
              {isBulkEmailSubmitting ? 'Sending...' : `Send to ${selectedIds.size} User${selectedIds.size === 1 ? '' : 's'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-engage Inactive Users Dialog */}
      <Dialog open={showReengageDialog} onOpenChange={setShowReengageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Re-engage Inactive Users</DialogTitle>
            <DialogDescription>
              Sends an individual email to every approved user who hasn&apos;t been active in the given window — using the same activity data shown as &quot;Last Active&quot; on their profiles.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div>
              <label className="block text-sm font-medium font-sans text-[#2C3E50] mb-2">
                Inactive for at least (days)
              </label>
              <Input
                type="number"
                min={1}
                value={reengageInactiveDays}
                onChange={(e) => setReengageInactiveDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="font-sans w-32"
              />
              <p className="text-xs font-sans text-[#2C3E50]/60 mt-2">
                {isInactiveCountLoading
                  ? 'Counting matching users...'
                  : inactiveCountData
                    ? `${inactiveCountData.count} user${inactiveCountData.count === 1 ? '' : 's'} will receive this email${inactiveCountData.willBeCapped ? ' (capped at 500 per send — run again for the rest)' : ''}.`
                    : ''}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium font-sans text-[#2C3E50] mb-2">
                Subject <span className="text-destructive">*</span>
              </label>
              <Input
                value={reengageSubject}
                onChange={(e) => setReengageSubject(e.target.value)}
                placeholder="Email subject"
                maxLength={150}
                className="font-sans"
              />
            </div>
            <div>
              <label className="block text-sm font-medium font-sans text-[#2C3E50] mb-2">
                Message <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={reengageMessage}
                onChange={(e) => setReengageMessage(e.target.value)}
                placeholder="Write your message..."
                className="min-h-[160px] font-sans"
                maxLength={2000}
              />
              <p className="text-xs font-sans text-[#2C3E50]/50 mt-1">{reengageMessage.length}/2000 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReengageDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendReengageEmail}
              disabled={!reengageSubject.trim() || !reengageMessage.trim() || !inactiveCountData?.count}
              className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A]"
            >
              Review &amp; Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-engage confirmation — a mass, irreversible send to real users deserves an explicit second step */}
      <AlertDialog open={showReengageConfirm} onOpenChange={setShowReengageConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              Send to {inactiveCountData?.count || 0} Inactive User{inactiveCountData?.count === 1 ? '' : 's'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately email every approved user inactive for {reengageInactiveDays}+ days. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReengageSubmitting}>Cancel</AlertDialogCancel>
            <Button
              onClick={confirmSendReengageEmail}
              disabled={isReengageSubmitting}
              className="bg-[#D4A843] hover:bg-[#B8860B] text-[#1A1A1A]"
            >
              {isReengageSubmitting ? 'Sending...' : 'Send Now'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
