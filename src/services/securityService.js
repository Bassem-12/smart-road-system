/**
 * Enterprise Security Service
 * Implements 2FA, Device Tracking, JWT Rotation, Permissions, and SIEM Logging
 */

import { jwtDecode } from "jwt-decode";

// ============================================
// STORAGE KEYS
// ============================================
const SECURITY_KEYS = {
  DEVICES: "user_devices",
  REFRESH_TOKENS: "refresh_tokens",
  PERMISSIONS: "user_permissions",
  AUDIT_LOGS: "audit_logs",
  TWO_FA_SECRETS: "2fa_secrets",
  RECOVERY_CODES: "recovery_codes",
};

// ============================================
// PERMISSION MATRIX
// ============================================
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: "view_dashboard",
  
  // Users
  MANAGE_USERS: "manage_users",
  APPROVE_ROLE_CHANGE: "approve_role_change",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  
  // Alerts
  MANAGE_ALERTS: "manage_alerts",
  
  // Reports
  VIEW_REPORTS: "view_reports",
  
  // Devices
  MANAGE_DEVICES: "manage_devices",
  
  // Settings
  MANAGE_SETTINGS: "manage_settings",
};

// Permission Matrix - defines which permissions each role has
export const PERMISSION_MATRIX = {
  Admin: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.APPROVE_ROLE_CHANGE,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_ALERTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_DEVICES,
    PERMISSIONS.MANAGE_SETTINGS,
  ],
  Officer: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_ALERTS,
    PERMISSIONS.VIEW_REPORTS,
  ],
  User: [
    PERMISSIONS.VIEW_DASHBOARD,
  ],
};

// ============================================
// 2FA SERVICE (TOTP)
// ============================================
export const TwoFactorService = {
  // Generate TOTP secret
  generateSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  },

  // Generate TOTP code (compatible with Google Authenticator)
  generateTOTP(secret) {
    // Simplified TOTP implementation
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(epoch / 30);
    
    // Use a simple hash for demo - in production use proper HOTP/TOTP
    const code = this.hotp(secret, timeStep);
    return code.toString().padStart(6, '0');
  },

  // HMAC-based One-Time Password
  hotp(secret, counter) {
    let hash = 0;
    const str = secret + counter;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 1000000;
  },

  // Verify TOTP code
  verifyTOTP(secret, code) {
    const currentCode = this.generateTOTP(secret);
    return currentCode === code;
  },

  // Generate recovery codes
  generateRecoveryCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push({ code, used: false });
    }
    return codes;
  },

// Get 2FA settings for user
  get2FASettings(userId) {
    const secrets = JSON.parse(localStorage.getItem(SECURITY_KEYS.TWO_FA_SECRETS) || '{}');
    const userSecrets = secrets[userId] || {};
    return {
      enabled: userSecrets.enabled || false,
      method: userSecrets.method || null,
      secret: userSecrets.secret || null,
      recoveryCodes: userSecrets.recoveryCodes || [],
    };
  },

// Enable 2FA for user
  enable2FA(userId, method = 'totp') {
    const secrets = JSON.parse(localStorage.getItem(SECURITY_KEYS.TWO_FA_SECRETS) || '{}');
    const secret = this.generateSecret();
    const recoveryCodes = this.generateRecoveryCodes();
    
    secrets[userId] = {
      enabled: true,
      method,
      secret,
      recoveryCodes,
      enabledAt: new Date().toISOString(),
    };
    
localStorage.setItem(SECURITY_KEYS.TWO_FA_SECRETS, JSON.stringify(secrets));
    
    return { secret, recoveryCodes };
  },

  // Disable 2FA for user
  disable2FA(userId) {
    const secrets = JSON.parse(localStorage.getItem(SECURITY_KEYS.TWO_FA_SECRETS) || '{}');
    if (secrets[userId]) {
      delete secrets[userId];
localStorage.setItem(SECURITY_KEYS.TWO_FA_SECRETS, JSON.stringify(secrets));
    }
    return true;
  },

  // Verify recovery code
  verifyRecoveryCode(userId, code) {
    const secrets = JSON.parse(localStorage.getItem(SECURITY_KEYS.TWO_FA_SECRETS) || '{}');
    const userSecrets = secrets[userId];
    
    if (!userSecrets || !userSecrets.recoveryCodes) {
      return false;
    }
    
    const recoveryCode = userSecrets.recoveryCodes.find(
      rc => rc.code === code && !rc.used
    );
    
    if (recoveryCode) {
      recoveryCode.used = true;
localStorage.setItem(SECURITY_KEYS.TWO_FA_SECRETS, JSON.stringify(secrets));
      return true;
    }
    
    return false;
  },
};

// ============================================
// DEVICE TRACKING SERVICE
// ============================================
export const DeviceService = {
  // Get current device info
  getCurrentDevice() {
    const ua = navigator.userAgent;
    return {
      deviceId: this.generateDeviceId(),
      deviceName: this.getDeviceName(ua),
      browser: this.getBrowser(ua),
      os: this.getOS(ua),
      ipAddress: "127.0.0.1", // Mock IP for frontend
      firstLogin: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      isTrusted: false,
    };
  },

  generateDeviceId() {
    return 'device_' + Math.random().toString(36).substring(2, 15);
  },

  getDeviceName(ua) {
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'Mobile';
    return 'Desktop';
  },

  getBrowser(ua) {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  },

  getOS(ua) {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  },

  // Get all devices for a user
  getUserDevices(userId) {
    const allDevices = JSON.parse(localStorage.getItem(SECURITY_KEYS.DEVICES) || '{}');
    return allDevices[userId] || [];
  },

  // Add device for user
  addDevice(userId, device) {
    const allDevices = JSON.parse(localStorage.getItem(SECURITY_KEYS.DEVICES) || '{}');
    
    if (!allDevices[userId]) {
      allDevices[userId] = [];
    }
    
    // Check if device already exists
    const existingIndex = allDevices[userId].findIndex(
      d => d.deviceId === device.deviceId
    );
    
    if (existingIndex >= 0) {
      // Update last active
      allDevices[userId][existingIndex].lastActive = new Date().toISOString();
    } else {
      // Add new device
      allDevices[userId].push(device);
    }
    
    localStorage.setItem(SECURITY_KEYS.DEVICES, JSON.stringify(allDevices));
    return allDevices[userId];
  },

  // Remove device
  removeDevice(userId, deviceId) {
    const allDevices = JSON.parse(localStorage.getItem(SECURITY_KEYS.DEVICES) || '{}');
    
    if (allDevices[userId]) {
      allDevices[userId] = allDevices[userId].filter(d => d.deviceId !== deviceId);
      localStorage.setItem(SECURITY_KEYS.DEVICES, JSON.stringify(allDevices));
    }
    
    return true;
  },

  // Trust device
  trustDevice(userId, deviceId) {
    const allDevices = JSON.parse(localStorage.getItem(SECURITY_KEYS.DEVICES) || '{}');
    
    if (allDevices[userId]) {
      const device = allDevices[userId].find(d => d.deviceId === deviceId);
      if (device) {
        device.isTrusted = true;
        localStorage.setItem(SECURITY_KEYS.DEVICES, JSON.stringify(allDevices));
      }
    }
    
    return true;
  },

  // Untrust device
  untrustDevice(userId, deviceId) {
    const allDevices = JSON.parse(localStorage.getItem(SECURITY_KEYS.DEVICES) || '{}');
    
    if (allDevices[userId]) {
      const device = allDevices[userId].find(d => d.deviceId === deviceId);
      if (device) {
        device.isTrusted = false;
        localStorage.setItem(SECURITY_KEYS.DEVICES, JSON.stringify(allDevices));
      }
    }
    
    return true;
  },
};

// ============================================
// TOKEN SERVICE (JWT + Refresh Rotation)
// ============================================
export const TokenService = {
  // Generate access token
  generateAccessToken(user) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role,
        permissions: PERMISSION_MATRIX[user.role] || [],
        firstName: user.firstName,
        lastName: user.lastName,
        type: "access",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
      })
    );
    const signature = btoa("mock-signature");
    return `${header}.${payload}.${signature}`;
  },

  // Generate refresh token
  generateRefreshToken(user) {
    const tokenId = Math.random().toString(36).substring(2, 15);
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: user.id,
        tokenId,
        type: "refresh",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      })
    );
    const signature = btoa("mock-signature");
    return `${header}.${payload}.${signature}`;
  },

  // Store refresh token
  storeRefreshToken(userId, refreshToken) {
    const tokens = JSON.parse(localStorage.getItem(SECURITY_KEYS.REFRESH_TOKENS) || '{}');
    
    if (!tokens[userId]) {
      tokens[userId] = [];
    }
    
    const decoded = jwtDecode(refreshToken);
    
    tokens[userId].push({
      tokenId: decoded.tokenId,
      token: refreshToken,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      revoked: false,
    });
    
    // Keep only last 5 tokens per user
    if (tokens[userId].length > 5) {
      tokens[userId] = tokens[userId].slice(-5);
    }
    
    localStorage.setItem(SECURITY_KEYS.REFRESH_TOKENS, JSON.stringify(tokens));
    return true;
  },

  // Validate refresh token
  validateRefreshToken(userId, refreshToken) {
    const tokens = JSON.parse(localStorage.getItem(SECURITY_KEYS.REFRESH_TOKENS) || '{}');
    
    if (!tokens[userId]) {
      return { valid: false, reason: "No tokens found" };
    }
    
    const decoded = jwtDecode(refreshToken);
    const storedToken = tokens[userId].find(
      t => t.tokenId === decoded.tokenId && !t.revoked
    );
    
    if (!storedToken) {
      // Token might be reused - suspicious!
      SecurityLogger.log({
        severity: "CRITICAL",
        action: "TOKEN_REUSE_DETECTED",
        userId,
        status: "failed",
        details: "Potential token replay attack",
      });
      this.revokeAllUserTokens(userId);
      return { valid: false, reason: "Token revoked or invalid" };
    }
    
    if (new Date(decoded.exp * 1000) < new Date()) {
      return { valid: false, reason: "Token expired" };
    }
    
    return { valid: true };
  },

  // Revoke refresh token
  revokeRefreshToken(userId, refreshToken) {
    const tokens = JSON.parse(localStorage.getItem(SECURITY_KEYS.REFRESH_TOKENS) || '{}');
    
    if (tokens[userId]) {
      const decoded = jwtDecode(refreshToken);
      const token = tokens[userId].find(t => t.tokenId === decoded.tokenId);
      if (token) {
        token.revoked = true;
        localStorage.setItem(SECURITY_KEYS.REFRESH_TOKENS, JSON.stringify(tokens));
      }
    }
    
    return true;
  },

  // Revoke all user tokens
  revokeAllUserTokens(userId) {
    const tokens = JSON.parse(localStorage.getItem(SECURITY_KEYS.REFRESH_TOKENS) || '{}');
    tokens[userId] = [];
    localStorage.setItem(SECURITY_KEYS.REFRESH_TOKENS, JSON.stringify(tokens));
    return true;
  },

  // Rotate tokens (invalidate old refresh, issue new)
  rotateTokens(user, refreshToken) {
    // Validate current token
    const validation = this.validateRefreshToken(user.id, refreshToken);
    if (!validation.valid) {
      return null;
    }
    
    // Revoke old token
    this.revokeRefreshToken(user.id, refreshToken);
    
    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);
    
    // Store new refresh token
    this.storeRefreshToken(user.id, newRefreshToken);
    
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },
};

// ============================================
// PERMISSION SERVICE
// ============================================
export const PermissionService = {
  // Get all permissions for a role
  getRolePermissions(role) {
    return PERMISSION_MATRIX[role] || [];
  },

  // Get permissions for a user from token
  getUserPermissions(user) {
    return user.permissions || PERMISSION_MATRIX[user.role] || [];
  },

  // Check if user has permission
  hasPermission(user, permission) {
    const permissions = this.getUserPermissions(user);
    return permissions.includes(permission);
  },

  // Check if user has any of the permissions
  hasAnyPermission(user, requiredPermissions) {
    const permissions = this.getUserPermissions(user);
    return requiredPermissions.some(p => permissions.includes(p));
  },

  // Check if user has all permissions
  hasAllPermissions(user, requiredPermissions) {
    const permissions = this.getUserPermissions(user);
    return requiredPermissions.every(p => permissions.includes(p));
  },

  // Check role
  hasRole(user, role) {
    return user.role === role;
  },

  // Check any role
  hasAnyRole(user, roles) {
    return roles.includes(user.role);
  },
};

// ============================================
// SIEM-READY SECURITY LOGGER
// ============================================
export const SecurityLogger = {
  LOG_LEVELS: {
    INFO: "INFO",
    WARNING: "WARNING",
    CRITICAL: "CRITICAL",
  },

  // Generate unique event ID
  generateEventId() {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  },

  // Log security event
  log(event) {
    const logs = JSON.parse(localStorage.getItem(SECURITY_KEYS.AUDIT_LOGS) || '[]');
    
    const logEntry = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      severity: event.severity || this.LOG_LEVELS.INFO,
      userId: event.userId || null,
      userEmail: event.userEmail || null,
      permissionUsed: event.permissionUsed || null,
      action: event.action,
      resource: event.resource || null,
      status: event.status || "success",
      ip: event.ip || "127.0.0.1",
      userAgent: navigator.userAgent,
      deviceId: event.deviceId || null,
      geoLocation: null,
      details: event.details || {},
    };
    
    // Add to beginning (most recent first)
    logs.unshift(logEntry);
    
    // Keep only last 1000 logs
    if (logs.length > 1000) {
      logs.length = 1000;
    }
    
    localStorage.setItem(SECURITY_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    
    // Console log for development
    console.log(`[SECURITY ${logEntry.severity}] ${logEntry.action}:`, logEntry);
    
    return logEntry;
  },

  // Get logs with filters
  getLogs(filters = {}) {
    let logs = JSON.parse(localStorage.getItem(SECURITY_KEYS.AUDIT_LOGS) || '[]');
    
    if (filters.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }
    
    if (filters.severity) {
      logs = logs.filter(l => l.severity === filters.severity);
    }
    
    if (filters.action) {
      logs = logs.filter(l => l.action.includes(filters.action));
    }
    
    if (filters.startDate) {
      logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.endDate));
    }
    
    return logs;
  },

  // Export logs in SIEM-compatible format
  exportLogs(format = "json") {
    const logs = JSON.parse(localStorage.getItem(SECURITY_KEYS.AUDIT_LOGS) || '[]');
    
    if (format === "json") {
      return JSON.stringify(logs, null, 2);
    }
    
    // CSV format
    if (logs.length === 0) return "";
    
    const headers = Object.keys(logs[0]);
    const csvRows = [headers.join(',')];
    
    for (const log of logs) {
      const values = headers.map(header => {
        const val = log[header];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  },

  // Clear logs
  clearLogs() {
    localStorage.setItem(SECURITY_KEYS.AUDIT_LOGS, JSON.stringify([]));
    return true;
  },

  // Log common events
  logLogin(user, status, details = {}) {
    return this.log({
      severity: status === "success" ? this.LOG_LEVELS.INFO : this.LOG_LEVELS.WARNING,
      userId: user?.id,
      userEmail: user?.email,
      action: "USER_LOGIN",
      status,
      details,
    });
  },

  logLogout(user) {
    return this.log({
      severity: this.LOG_LEVELS.INFO,
      userId: user?.id,
      userEmail: user?.email,
      action: "USER_LOGOUT",
      status: "success",
    });
  },

  logPermissionDenied(user, permission, resource) {
    return this.log({
      severity: this.LOG_LEVELS.WARNING,
      userId: user?.id,
      userEmail: user?.email,
      permissionUsed: permission,
      action: "PERMISSION_DENIED",
      resource,
      status: "failed",
    });
  },

  log2FA(user, status, method) {
    return this.log({
      severity: status === "success" ? this.LOG_LEVELS.INFO : this.LOG_LEVELS.WARNING,
      userId: user?.id,
      userEmail: user?.email,
      action: "2FA_" + (status === "success" ? "SUCCESS" : "FAILED"),
      status,
      details: { method },
    });
  },

  logDeviceAdded(user, device) {
    return this.log({
      severity: this.LOG_LEVELS.INFO,
      userId: user?.id,
      userEmail: user?.email,
      action: "DEVICE_ADDED",
      deviceId: device?.deviceId,
      status: "success",
      details: { deviceName: device?.deviceName },
    });
  },
};

// ============================================
// RATE LIMITING
// ============================================
export const RateLimiter = {
  limits: {
    login: { attempts: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    otp: { attempts: 3, window: 5 * 60 * 1000 }, // 3 OTP attempts per 5 minutes
    refresh: { attempts: 10, window: 60 * 1000 }, // 10 refresh per minute
  },

  // Check if action is rate limited
  isRateLimited(action, identifier) {
    const limit = this.limits[action];
    if (!limit) return false;
    
    const key = `rate_limit_${action}_${identifier}`;
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    const now = Date.now();
    const windowStart = now - limit.window;
    
    // Filter attempts within window
    const recentAttempts = attempts.filter(t => t > windowStart);
    
    return recentAttempts.length >= limit.attempts;
  },

  // Record attempt
  recordAttempt(action, identifier) {
    const limit = this.limits[action];
    if (!limit) return;
    
    const key = `rate_limit_${action}_${identifier}`;
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    attempts.push(Date.now());
    
    // Clean old attempts
    const windowStart = Date.now() - limit.window;
    const recentAttempts = attempts.filter(t => t > windowStart);
    
    localStorage.setItem(key, JSON.stringify(recentAttempts));
  },

  // Get remaining attempts
  getRemainingAttempts(action, identifier) {
    const limit = this.limits[action];
    if (!limit) return Infinity;
    
    const key = `rate_limit_${action}_${identifier}`;
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    const now = Date.now();
    const windowStart = now - limit.window;
    
    const recentAttempts = attempts.filter(t => t > windowStart);
    return Math.max(0, limit.attempts - recentAttempts.length);
  },
};

export default {
  PERMISSIONS,
  PERMISSION_MATRIX,
  TwoFactorService,
  DeviceService,
  TokenService,
  PermissionService,
  SecurityLogger,
  RateLimiter,
};
