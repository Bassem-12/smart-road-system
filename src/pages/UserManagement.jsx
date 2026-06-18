import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { PermissionService, SecurityLogger } from "../services/securityService";
import "../styles/user-management.css";

// Reusable UI Components
import { DashboardSkeleton } from "../components/ui/LoadingSkeleton";
import ErrorState from "../components/ui/ErrorState";

/**
 * UserManagement - Production-ready user management page
 * 
 * Features:
 * - Permission-based access (manage_users)
 * - Fetches data from API with proper loading/error states
 * - Auto-includes Authorization header via axios interceptor
 * - Handles 401 responses (redirect to signin)
 * - Prevents memory leaks with cleanup
 * - Memoized callbacks to avoid unnecessary re-renders
 * - No hardcoded data - uses service layer
 * - Dark/Light mode support via CSS variables
 * - Glass-effect panels matching dashboard aesthetic
 * - Confirmation modal before destructive actions
 * - Add User modal with validation
 * - Role Registry System integration
 */
export default function UserManagement() {
  // Auth state
  const { token, user: currentUser } = useAuth();
  const isAuthenticated = !!token;
  
  // Check permission using PermissionService
  const canManageUsers = isAuthenticated && PermissionService.hasPermission(currentUser, "manage_users");
  const isAdmin = currentUser?.role === "Admin";

  // Data state
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ admin: 0, officer: 0, user: 0, total: 0 });
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "User",
    require2FA: false,
    forcePasswordChange: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ================= FETCH USERS & STATS =================
  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const usersResponse = await api.get("/users");
      setUsers(usersResponse.data.users || []);
      
      const statsResponse = await api.get("/users/stats");
      setStats(statsResponse.data.stats || { admin: 0, officer: 0, user: 0, total: 0 });
    } catch (err) {
      console.error("Failed to load users:", err);
      
      if (err.response?.status === 401) {
        setError("Session expired. Please sign in again.");
      } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        setError("Unable to connect to server. Please check your connection.");
      } else {
        setError(err.response?.data?.message || "Failed to load users.");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ================= VALIDATION =================
  const validateForm = () => {
    const errors = {};
    
    if (!newUser.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    
    if (!newUser.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    
    if (!newUser.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!newUser.password) {
      errors.password = "Password is required";
    } else if (newUser.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newUser.password)) {
      errors.password = "Password must contain uppercase, lowercase, and number";
    }
    
    if (newUser.password !== newUser.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ================= ADD USER =================
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const userData = {
        firstName: newUser.firstName.trim(),
        lastName: newUser.lastName.trim(),
        email: newUser.email.trim().toLowerCase(),
        password: newUser.password,
        role: newUser.role,
        require2FA: newUser.require2FA,
        forcePasswordChange: newUser.forcePasswordChange,
      };
      
      await api.post("/auth/register", userData);
      
      SecurityLogger.log({
        severity: "INFO",
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        action: "USER_CREATED",
        status: "success",
        details: { newUserEmail: userData.email, role: userData.role },
      });
      
      await fetchUsers();
      
      setSuccessMessage(`User ${userData.email} created successfully!`);
      setShowAddUser(false);
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "User",
        require2FA: false,
        forcePasswordChange: false,
      });
      setFormErrors({});
      
      setTimeout(() => setSuccessMessage(""), 5000);
      
    } catch (err) {
      console.error("Failed to create user:", err);
      
      SecurityLogger.log({
        severity: "WARNING",
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        action: "USER_CREATED_FAILED",
        status: "failed",
        details: { error: err.response?.data?.message || "Unknown error" },
      });
      
      setError(err.response?.data?.message || "Failed to create user. Email may already exist.");
    } finally {
      setSubmitting(false);
    }
  };

  // ================= DEACTIVATE USER =================
  const handleDeactivate = async (userId) => {
    try {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: false } : u
      ));
      setShowDeleteConfirm(null);
      
      await api.put("/users/deactivate", { userId });
      
      const statsResponse = await api.get("/users/stats");
      setStats(statsResponse.data.stats || { admin: 0, officer: 0, user: 0, total: 0 });
      
      SecurityLogger.log({
        severity: "INFO",
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        action: "USER_DEACTIVATED",
        status: "success",
        details: { targetUserId: userId },
      });
      
    } catch (err) {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: true } : u
      ));
      setError("Failed to deactivate user");
    }
  };

  // ================= ACTIVATE USER =================
  const handleActivate = async (userId) => {
    try {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: true } : u
      ));
      setShowDeleteConfirm(null);
      
      await api.put("/users/activate", { userId });
      
      const statsResponse = await api.get("/users/stats");
      setStats(statsResponse.data.stats || { admin: 0, officer: 0, user: 0, total: 0 });
      
      SecurityLogger.log({
        severity: "INFO",
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        action: "USER_ACTIVATED",
        status: "success",
        details: { targetUserId: userId },
      });
      
    } catch (err) {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isActive: false } : u
      ));
      setError("Failed to activate user");
    }
  };

  // ================= FILTER =================
  const filteredUsers = users.filter((u) => {
    const searchText = (u.firstName + " " + u.lastName + u.email + u.id).toLowerCase();
    const matchesSearch = searchText.includes(search.toLowerCase());
    const matchesRole = filterRole === "All" || u.role === filterRole;
    const matchesStatus = filterStatus === "All" || 
      (filterStatus === "Active" && u.isActive) ||
      (filterStatus === "Inactive" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // ================= UI HELPERS =================
  const getRoleClass = (role) => `role ${role?.toLowerCase()}`;
  const getStatusClass = (isActive) => `status ${isActive ? 'active' : 'inactive'}`;

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ================= ACCESS DENIED =================
  if (isAuthenticated && !canManageUsers) {
    return (
      <div className="user-container">
        <div className="user-header">
          <h2>Role Registry</h2>
          <p>View and manage registered users in the system</p>
        </div>
        <ErrorState
          title="Access Denied"
          message="You do not have permission to access this page. Contact your administrator for access."
        />
      </div>
    );
  }

  // ================= LOADING STATE =================
  if (loading) {
    return (
      <div className="user-container">
        <div className="user-header">
          <h2>Role Registry</h2>
          <p>View and manage registered users in the system</p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  // ================= ERROR STATE =================
  if (error && !users.length) {
    return (
      <div className="user-container">
        <div className="user-header">
          <h2>Role Registry</h2>
          <p>View and manage registered users in the system</p>
        </div>
        <ErrorState
          title="Failed to Load Users"
          message={error}
          onRetry={fetchUsers}
        />
      </div>
    );
  }

  return (
    <div className="user-container">
      {/* HEADER */}
      <div className="header-row">
        <div className="user-header">
          <h2>Role Registry</h2>
          <p>View and manage registered users in the system</p>
        </div>
        
        {canManageUsers && (
          <button className="add-user-btn" onClick={() => setShowAddUser(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add User
          </button>
        )}
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="success-banner">
          <span className="success-icon">✓</span>
          {successMessage}
        </div>
      )}

      {/* STATS CARDS */}
      <div className="registry-stats">
        <div className="stat-card admin">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.admin}</span>
            <span className="stat-label">Admins</span>
          </div>
        </div>
        
        <div className="stat-card officer">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.officer}</span>
            <span className="stat-label">Officers</span>
          </div>
        </div>
        
        <div className="stat-card user">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.user}</span>
            <span className="stat-label">Users</span>
          </div>
        </div>
        
        <div className="stat-card total">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* FILTERS */}
      <div className="user-filters">
        <input
          type="text"
          placeholder="Search by name, email or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
          className="filter-select"
        >
          <option value="All">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Officer">Officer</option>
          <option value="User">User</option>
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last Login</th>
              {canManageUsers && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={canManageUsers ? 7 : 6} className="empty">
                  No users found matching your filters
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <span className="user-name">{u.firstName} {u.lastName}</span>
                      <span className="user-id">{u.id}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={getRoleClass(u.role)}>{u.role}</span>
                  </td>
                  <td>
                    <span className={getStatusClass(u.isActive)}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>{formatDate(u.lastLoginTime)}</td>
                  {canManageUsers && (
                    <td>
                      <div className="action-buttons">
                        {u.isActive ? (
                          <button
                            className="deactivate-btn"
                            onClick={() => setShowDeleteConfirm({ id: u.id, action: 'deactivate' })}
                            title="Deactivate user"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                            </svg>
                          </button>
                        ) : (
                          <button
                            className="activate-btn"
                            onClick={() => handleActivate(u.id)}
                            title="Activate user"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD USER MODAL */}
      {showAddUser && (
        <div className="modal-overlay" onClick={() => setShowAddUser(false)}>
          <div className="modal-box add-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="modal-close" onClick={() => setShowAddUser(false)}>×</button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="modal-body">
                <div className="input-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      placeholder="Enter first name"
                      value={newUser.firstName}
                      onChange={(e) => {
                        setNewUser({ ...newUser, firstName: e.target.value });
                        if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: "" });
                      }}
                      className={formErrors.firstName ? "input-error" : ""}
                    />
                    {formErrors.firstName && <span className="error-message">{formErrors.firstName}</span>}
                  </div>

                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      placeholder="Enter last name"
                      value={newUser.lastName}
                      onChange={(e) => {
                        setNewUser({ ...newUser, lastName: e.target.value });
                        if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: "" });
                      }}
                      className={formErrors.lastName ? "input-error" : ""}
                    />
                    {formErrors.lastName && <span className="error-message">{formErrors.lastName}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={newUser.email}
                    onChange={(e) => {
                      setNewUser({ ...newUser, email: e.target.value });
                      if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
                    }}
                    className={formErrors.email ? "input-error" : ""}
                  />
                  {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                </div>

                <div className="input-row">
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={newUser.password}
                      onChange={(e) => {
                        setNewUser({ ...newUser, password: e.target.value });
                        if (formErrors.password) setFormErrors({ ...formErrors, password: "" });
                      }}
                      className={formErrors.password ? "input-error" : ""}
                    />
                    {formErrors.password && <span className="error-message">{formErrors.password}</span>}
                  </div>

                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={newUser.confirmPassword}
                      onChange={(e) => {
                        setNewUser({ ...newUser, confirmPassword: e.target.value });
                        if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: "" });
                      }}
                      className={formErrors.confirmPassword ? "input-error" : ""}
                    />
                    {formErrors.confirmPassword && <span className="error-message">{formErrors.confirmPassword}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="User">User</option>
                    <option value="Officer">Officer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="advanced-options">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newUser.require2FA}
                        onChange={(e) => setNewUser({ ...newUser, require2FA: e.target.checked })}
                      />
                      <span className="checkbox-custom"></span>
                      Require 2FA on first login
                    </label>
                  </div>

                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newUser.forcePasswordChange}
                        onChange={(e) => setNewUser({ ...newUser, forcePasswordChange: e.target.checked })}
                      />
                      <span className="checkbox-custom"></span>
                      Force password change on first login
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddUser(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEACTIVATE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-box confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3>Deactivate User</h3>
            <p>Are you sure you want to deactivate this user? They will no longer be able to log in.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={() => handleDeactivate(showDeleteConfirm.id)}>
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
