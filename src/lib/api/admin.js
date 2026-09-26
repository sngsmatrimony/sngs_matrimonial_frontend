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
   * Approve a user registration
   */
  approveUser: (id) => adminClient.put(`/api/admin/users/${id}/approve`),

  /**
   * Reject a user registration (requires reason)
   */
  rejectUser: (id, reason) => adminClient.put(`/api/admin/users/${id}/reject`, { reason }),

  /**
   * Get count of pending approvals
   */
  getPendingApprovalCount: () => adminClient.get('/api/admin/users/pending-count'),

  /**
   * Permanently delete user (hard delete)
   */
  deleteUser: (id) => adminClient.delete(`/api/admin/users/${id}`),

  /**
   * Send a notification email to a specific set of users by id
   */
  bulkEmailUsers: (userIds, subject, message) =>
    adminClient.post('/api/admin/users/bulk-email', { userIds, subject, message }),

  // ==================== Analytics ====================

  /**
   * Get dashboard analytics (overview)
   */
  getDashboardAnalytics: () => adminClient.get('/api/admin/analytics/overview'),

  /**
   * Get user demographics
   */
  getDemographics: () => adminClient.get('/api/admin/analytics/demographics'),

  // ==================== Activity Logs ====================

  /**
   * Get activity log entries with pagination, search, and filters
   */
  getActivityLogs: (params) => adminClient.get('/api/admin/activity-logs', { params }),

  // ==================== Phone Number Requests ====================

  /**
   * Get phone-number requests, filterable by status, paginated
   */
  getPhoneRequests: (params) => adminClient.get('/api/admin/phone-requests', { params }),

  /**
   * Approve a phone-number request
   */
  approvePhoneRequest: (id) => adminClient.put(`/api/admin/phone-requests/${id}/approve`),

  /**
   * Deny a phone-number request
   */
  denyPhoneRequest: (id) => adminClient.put(`/api/admin/phone-requests/${id}/deny`),

  /**
   * Reply on a phone-number request's note thread
   */
  sendPhoneRequestMessage: (id, text) => adminClient.post(`/api/admin/phone-requests/${id}/message`, { text }),

  // ==================== Settings ====================

  /**
   * Update contact information
   */
  updateContactInfo: (data) => adminClient.put('/api/admin/settings/contact-info', data),

  /**
   * Get How It Works section content
   */
  getHowItWorksContent: () => adminClient.get('/api/admin/how-it-works'),

  /**
   * Update How It Works section content
   */
  updateHowItWorksContent: (data) => adminClient.put('/api/admin/how-it-works', data),

  /**
   * Get Hero section content
   */
  getHeroContent: () => adminClient.get('/api/admin/hero-content'),

  /**
   * Update Hero section content
   */
  updateHeroContent: (data) => adminClient.put('/api/admin/hero-content', data),

  /**
   * Get membership enforcement toggle state
   */
  getEnforcementSettings: () => adminClient.get('/api/admin/settings/enforcement'),

  /**
   * Update membership enforcement toggle state
   */
  updateEnforcementSettings: (data) => adminClient.put('/api/admin/settings/enforcement', data),

  /**
   * Get "ID proof required" toggle state
   */
  getIdProofSettings: () => adminClient.get('/api/admin/settings/id-proof-required'),

  /**
   * Update "ID proof required" toggle state
   */
  updateIdProofSettings: (data) => adminClient.put('/api/admin/settings/id-proof-required', data),

  // ==================== Admin Management ====================

  /**
   * Get all admins
   */
  getAllAdmins: () => adminClient.get('/api/admin/admins'),

  /**
   * Create new admin
   */
  createAdmin: (data) => adminClient.post('/api/admin/admins', data),

  // ==================== Media Upload for Users ====================

  /**
   * Upload profile picture for a specific user
   */
  uploadUserProfilePicture: (userId, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    // Don't set Content-Type explicitly - let axios auto-generate with boundary
    return adminClient.post(`/api/admin/users/${userId}/upload-profile-picture`, formData);
  },

  /**
   * Upload gallery photo for a specific user
   */
  uploadUserPhoto: (userId, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    // Don't set Content-Type explicitly - let axios auto-generate with boundary
    return adminClient.post(`/api/admin/users/${userId}/upload-photo`, formData);
  },

  /**
   * Delete gallery photo for a specific user
   */
  deleteUserPhoto: (userId, photoIndex) => adminClient.delete(`/api/admin/users/${userId}/photos/${photoIndex}`),

  /**
   * Upload horoscope document for a specific user
   */
  uploadUserHoroscope: (userId, file) => {
    const formData = new FormData();
    formData.append('document', file);
    // Don't set Content-Type explicitly - let axios auto-generate with boundary
    return adminClient.post(`/api/admin/users/${userId}/upload-horoscope`, formData);
  },

  /**
   * Delete horoscope document for a specific user
   */
  deleteUserHoroscope: (userId) => adminClient.delete(`/api/admin/users/${userId}/horoscope`),
};
