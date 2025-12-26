import adminClient from './adminClient';

export const adminApi = {
  // ==================== User Management ====================

  /**
   * Get all users with pagination, search, and filters
   */
  getAllUsers: (params) => adminClient.get('/api/admin/users', { params }),

  /**
   * Get specific user details
   */
  getUserById: (id) => adminClient.get(`/api/admin/users/${id}`),

  /**
   * Update user profile
   */
  updateUser: (id, data) => adminClient.put(`/api/admin/users/${id}`, data),

  /**
   * Deactivate user (soft delete)
   */
  deactivateUser: (id) => adminClient.put(`/api/admin/users/${id}/deactivate`),

  /**
   * Reactivate user
   */
  activateUser: (id) => adminClient.put(`/api/admin/users/${id}/activate`),

  /**
   * Permanently delete user (hard delete)
   */
  deleteUser: (id) => adminClient.delete(`/api/admin/users/${id}`),

  // ==================== Analytics ====================

  /**
   * Get dashboard analytics (overview)
   */
  getDashboardAnalytics: () => adminClient.get('/api/admin/analytics/overview'),

  /**
   * Get user demographics
   */
  getDemographics: () => adminClient.get('/api/admin/analytics/demographics'),

  // ==================== Settings ====================

  /**
   * Update contact information
   */
  updateContactInfo: (data) => adminClient.put('/api/admin/settings/contact-info', data),

  // ==================== Admin Management ====================

  /**
   * Get all admins
   */
  getAllAdmins: () => adminClient.get('/api/admin/admins'),

  /**
   * Create new admin
   */
  createAdmin: (data) => adminClient.post('/api/admin/admins', data),
};
