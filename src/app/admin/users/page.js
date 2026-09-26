'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
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
import { Eye, Trash2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Search, Mail, ImageOff } from 'lucide-react';

const MISSING_DATA_FILTERS = [
  { key: 'missingProfilePicture', label: 'Missing Profile Picture' },
  { key: 'missingGalleryPhotos', label: 'Missing Gallery Photos' },
  { key: 'missingHoroscope', label: 'Missing Horoscope' },
];

const CANNED_SUBJECTS = {
  missingProfilePicture: 'Please add your profile picture',
  missingGalleryPhotos: 'Add a few more photos to your profile',
  missingHoroscope: 'Complete your horoscope details',
};

const CANNED_MESSAGES = {
  missingProfilePicture: "We noticed your profile doesn't have a photo yet. Adding one helps other members recognize and connect with you — profiles with a photo get far more interest.\n\nPlease log in and add your profile picture when you get a chance.",
  missingGalleryPhotos: "A few more photos on your profile go a long way in helping potential matches get to know you better.\n\nPlease log in and add some gallery photos when you get a chance.",
  missingHoroscope: "Adding your horoscope details helps us find more compatible matches for you.\n\nPlease log in and complete your horoscope information when you get a chance.",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialApprovalFilter = searchParams.get('approvalFilter') || 'all';
  const [page, setPage] = useState(1);
  const [approvalFilter, setApprovalFilter] = useState(initialApprovalFilter);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [missingFilters, setMissingFilters] = useState({
    missingProfilePicture: false,
    missingGalleryPhotos: false,
    missingHoroscope: false,
  });
  const [selectedIds, setSelectedIds] = useState(new Set());
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

  // Debounce the search box so we don't fire a request on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Clear the current selection whenever the underlying result set changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, approvalFilter, search, missingFilters]);

  // Build query params
  const queryParams = {
    page,
    limit: 20,
    approvalStatus: approvalFilter === 'all' ? '' : approvalFilter,
    search,
    ...(missingFilters.missingProfilePicture && { missingProfilePicture: 'true' }),
    ...(missingFilters.missingGalleryPhotos && { missingGalleryPhotos: 'true' }),
    ...(missingFilters.missingHoroscope && { missingHoroscope: 'true' }),
  };

  const queryClient = useQueryClient();

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

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allOnPageSelected) return new Set();
      return new Set(users.map((u) => u._id));
    });
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
      toastSuccess(response.data.message || 'Emails sent');
      setShowBulkEmailDialog(false);
      setSelectedIds(new Set());
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to send emails');
    } finally {
      setIsBulkEmailSubmitting(false);
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
        <Tabs value={approvalFilter} onValueChange={handleFilterChange}>
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
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-[#D4A843]/30 bg-gradient-to-r from-[#F5E6C3]/40 to-[#FDF8F0]">
          <p className="font-sans text-sm text-[#1A1A1A]">
            {selectedIds.size} user{selectedIds.size === 1 ? '' : 's'} selected
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
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
                      <TableCell className="font-sans text-[#2C3E50]">{user.gender || '-'}</TableCell>
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
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.approvalStatus === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[#2E7D32] hover:text-white hover:bg-[#2E7D32] border-[#2E7D32]/30"
                                onClick={() => handleApproveUser(user._id)}
                                title="Approve"
                              >
                                <CheckCircle size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-white hover:bg-destructive"
                                onClick={() => handleOpenRejectDialog(user._id)}
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewUser(user._id)}
                            title="View Details"
                          >
                            <Eye size={16} />
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
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="10" className="text-center py-8 font-sans text-[#2C3E50]/60">
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
    </div>
  );
}
