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
   * Export a member's full profile as a PPTX deck
   */
  exportUserProfilePptx: (id) => adminClient.get(`/api/admin/users/${id}/export-pptx`, { responseType: 'blob' }),

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
   * Mark the member's ID proof as verified (gives the Verified tick)
   */
  verifyIdProof: (id) => adminClient.put(`/api/admin/users/${id}/verify-id-proof`),

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
  /** IDs of every user matching the Users-list filters ("Select all N matching"). */
  getMatchingUserIds: (params) => adminClient.get('/api/admin/users/ids', { params }),

  /**
   * Preview how many users a re-engagement blast would reach
   */
  getInactiveUserCount: (inactiveDays) =>
    adminClient.get('/api/admin/users/inactive-count', { params: { inactiveDays } }),

  /**
   * Re-engagement blast to every user inactive for N+ days
   */
  bulkEmailInactiveUsers: (inactiveDays, subject, message) =>
    adminClient.post('/api/admin/users/bulk-email-inactive', { inactiveDays, subject, message }),

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

  // ==================== Contact & Chat Unlocks (read-only log) ====================
  // Replaces the old admin-approval phone-request workflow — contact/chat
  // access is now a purely self-service, credit-charged unlock, so there's
  // nothing left to approve/deny, only to observe and report on.

  /**
   * List PHONE_CHAT_UNLOCK activity log entries, paginated/date-filterable
   */
  getPhoneChatUnlocks: (params) => adminClient.get('/api/admin/phone-chat-unlocks', { params }),

  /**
   * Download the consolidated contact/chat-unlocks PDF report
   */
  downloadPhoneChatUnlockReport: (params) =>
    adminClient.get('/api/admin/phone-chat-unlocks/report.pdf', { params, responseType: 'blob' }),

  /**
   * List "started filling" registration leads — people who cleared the
   * registration wizard's Quick Start step but haven't finished yet.
   */
  getRegistrationLeads: (params) => adminClient.get('/api/admin/registration-leads', { params }),
  getAllianceRegistrations: (params) => adminClient.get('/api/admin/alliance-meet/registrations', { params }),

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
   * Credit packs (top-ups during an active plan) + gateway charges passed on to members
   */
  getPaymentSettings: () => adminClient.get('/api/admin/settings/payments'),
  updatePaymentSettings: (data) => adminClient.put('/api/admin/settings/payments', data),

  /**
   * Update membership enforcement toggle state
   */
  updateEnforcementSettings: (data) => adminClient.put('/api/admin/settings/enforcement', data),

  /**
   * Get the Alliance Meet price + open/closed toggle
   */
  getAllianceMeetSettings: () => adminClient.get('/api/admin/settings/alliance-meet'),

  /**
   * Update the Alliance Meet price and/or open/closed toggle
   */
  updateAllianceMeetSettings: (data) => adminClient.put('/api/admin/settings/alliance-meet', data),

  // Horoscope documents: visibility to members + one-time fee per horoscope
  getHoroscopeSettings: () => adminClient.get('/api/admin/settings/horoscope'),
  updateHoroscopeSettings: (data) => adminClient.put('/api/admin/settings/horoscope', data),

  /**
   * Get "ID proof required" toggle state
   */
  getIdProofSettings: () => adminClient.get('/api/admin/settings/id-proof-required'),

  /**
   * Update "ID proof required" toggle state
   */
  updateIdProofSettings: (data) => adminClient.put('/api/admin/settings/id-proof-required', data),

  /**
   * Get the automated 7-day inactivity reminder email toggle state
   */
  getAutomatedInactivityEmailSettings: () => adminClient.get('/api/admin/settings/automated-inactivity-emails'),

  /**
   * Pause/resume the automated 7-day inactivity reminder job
   */
  updateAutomatedInactivityEmailSettings: (data) =>
    adminClient.put('/api/admin/settings/automated-inactivity-emails', data),

  // ==================== Admin Management ====================

  /**
   * Get all admins
   */
  getAllAdmins: () => adminClient.get('/api/admin/admins'),

  /**
   * Create new admin
   */
  createAdmin: (data) => adminClient.post('/api/admin/admins', data),

  /**
   * Toggle whether an admin receives automated alert emails
   */
  updateAdminAlertPreference: (id, receiveAlertEmails) =>
    adminClient.patch(`/api/admin/admins/${id}/alert-preference`, { receiveAlertEmails }),

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

  // ==================== Transactions ====================

  /**
   * Get all membership transactions, optionally filtered by status/userId
   */
  getAllTransactions: (params) => adminClient.get('/api/admin/transactions', { params }),

  /**
   * Initiate a refund for a transaction
   */
  refundTransaction: (transactionId, data) => adminClient.post(`/api/membership/refund/${transactionId}`, data),
};
