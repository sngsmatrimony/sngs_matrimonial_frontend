'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toastError, toastSuccess } from '@/lib/toast';
import { Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  // Build query params
  const queryParams = {
    page,
    limit: 20,
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminUsers', queryParams],
    queryFn: async () => {
      const response = await adminApi.getAllUsers(queryParams);
      return response.data;
    },
    keepPreviousData: true,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  const handleViewUser = (userId) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleDeleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await adminApi.deleteUser(userId);
        toastSuccess('User deleted successfully');
        refetch();
      } catch (error) {
        toastError(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading users. Please try again.</p>
      </div>
    );
  }

  const { data: users = [], pagination = {} } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-viga text-secondary mb-2">User Management</h1>
        <p className="text-gray-600">Manage user accounts and view their details</p>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination.total} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell className="text-sm">{user.mobileNumber}</TableCell>
                      <TableCell>{user.gender || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewUser(user._id)}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="7" className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {users.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
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
