

// ============================================
// ROLE REGISTRY STRUCTURE
// ============================================
// Stores users grouped by role for efficient lookup
// {
//   admin: [],
//   officer: [],
//   user: []
// }

// Default demo accounts
const DEFAULT_USERS = {
  admin: [
    {
      id: "1",
      firstName: "Ahmed",
      lastName: "Hassan",
      email: "ahmed.hassan@protonmail.com",
      password: "Admin@123",
      role: "Admin",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: "2",
      firstName: "Sara",
      lastName: "Mostafa",
      email: "sara.mostafa@gmail.com",
      password: "Admin@456",
      role: "Admin",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: "3",
      firstName: "Mohamed",
      lastName: "Elsayed",
      email: "mohamed.elsayed@outlook.com",
      password: "Admin@789",
      role: "Admin",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
  ],
  officer: [
    {
      id: "4",
      firstName: "Karim",
      lastName: "Fathy",
      email: "karim.fathy@gmail.com",
      password: "Officer@123",
      role: "Officer",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: "5",
      firstName: "Yasmine",
      lastName: "Ali",
      email: "yasmine.ali@icloud.com",
      password: "Officer@456",
      role: "Officer",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: "6",
      firstName: "Omar",
      lastName: "Samir",
      email: "omar.samir@yahoo.com",
      password: "Officer@789",
      role: "Officer",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
  ],
  user: [
    {
      id: "7",
      firstName: "Nour",
      lastName: "Hamed",
      email: "nour.hamed@gmail.com",
      password: "User@123",
      role: "User",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: "8",
      firstName: "Salma",
      lastName: "Ashraf",
      email: "salma.ashraf@outlook.com",
      password: "User@456",
      role: "User",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: "9",
      firstName: "Tarek",
      lastName: "Nabil",
      email: "tarek.nabil@gmail.com",
      password: "User@789",
      role: "User",
      createdAt: new Date().toISOString(),
      isActive: true,
    },
  ],
};

// ============================================
// AUTH LOGS STRUCTURE
// ============================================
// Stores login history
// {
//   userId: [
//     { loginTime, logoutTime, ipAddress }
//   ]
// }

// Storage keys
const USERS_REGISTRY_KEY = "users_registry";
const AUTH_LOGS_KEY = "auth_logs";

// ============================================
// UTILITY FUNCTIONS
// ============================================

// JWT Token Generator
function generateToken(user) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    })
  );
  const signature = btoa("mock-signature");
  return `${header}.${payload}.${signature}`;
}

// Initialize users registry
function getUsersRegistry() {
  const stored = localStorage.getItem(USERS_REGISTRY_KEY);
  if (!stored) {
    // Initialize with default users
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  return JSON.parse(stored);
}

// Save users registry
function saveUsersRegistry(registry) {
  localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
}

// Get auth logs
function getAuthLogs() {
  const stored = localStorage.getItem(AUTH_LOGS_KEY);
  return stored ? JSON.parse(stored) : {};
}

// Save auth logs
function saveAuthLogs(logs) {
  localStorage.setItem(AUTH_LOGS_KEY, JSON.stringify(logs));
}

// Add login log entry
function addLoginLog(userId) {
  const logs = getAuthLogs();
  if (!logs[userId]) {
    logs[userId] = [];
  }
  logs[userId].push({
    loginTime: new Date().toISOString(),
    logoutTime: null,
    ipAddress: "127.0.0.1", // Mock IP
  });
  saveAuthLogs(logs);
}

// Add logout log entry
function addLogoutLog(userId) {
  const logs = getAuthLogs();
  if (logs[userId] && logs[userId].length > 0) {
    const lastEntry = logs[userId][logs[userId].length - 1];
    if (!lastEntry.logoutTime) {
      lastEntry.logoutTime = new Date().toISOString();
      saveAuthLogs(logs);
    }
  }
}

// Get last login time for a user
function getLastLoginTime(userId) {
  const logs = getAuthLogs();
  if (logs[userId] && logs[userId].length > 0) {
    // Find the most recent login that hasn't been logged out
    for (let i = logs[userId].length - 1; i >= 0; i--) {
      if (logs[userId][i].logoutTime) {
        return logs[userId][i].loginTime;
      }
    }
    return logs[userId][logs[userId].length - 1].loginTime;
  }
  return null;
}

// Find user by email across all roles
function findUserByEmail(email) {
  const registry = getUsersRegistry();
  const normalizedEmail = email.toLowerCase();
  
  for (const role of Object.keys(registry)) {
    const user = registry[role].find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (user) {
      return user;
    }
  }
  return null;
}

// Find user by ID
function findUserById(id) {
  const registry = getUsersRegistry();
  
  for (const role of Object.keys(registry)) {
    const user = registry[role].find((u) => u.id === id);
    if (user) {
      return user;
    }
  }
  return null;
}

// Check if email exists in any role
function emailExists(email) {
  return findUserByEmail(email) !== null;
}

// Get all users (for admin view)
function getAllUsers() {
  const registry = getUsersRegistry();
  const allUsers = [];
  
  for (const role of Object.keys(registry)) {
    for (const user of registry[role]) {
      allUsers.push({
        ...user,
        lastLoginTime: getLastLoginTime(user.id),
      });
    }
  }
  
  return allUsers.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Get users by role
function getUsersByRole(role) {
  const registry = getUsersRegistry();
  const roleKey = role.toLowerCase();
  return registry[roleKey] || [];
}

// Get user count per role
function getRoleStats() {
  const registry = getUsersRegistry();
  return {
    admin: registry.admin?.length || 0,
    officer: registry.officer?.length || 0,
    user: registry.user?.length || 0,
    total: (registry.admin?.length || 0) + (registry.officer?.length || 0) + (registry.user?.length || 0),
  };
}

// Deactivate user
function deactivateUser(userId) {
  const registry = getUsersRegistry();
  let found = false;
  
  for (const role of Object.keys(registry)) {
    const userIndex = registry[role].findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      registry[role][userIndex].isActive = false;
      found = true;
      break;
    }
  }
  
  if (found) {
    saveUsersRegistry(registry);
  }
  return found;
}

// Activate user
function activateUser(userId) {
  const registry = getUsersRegistry();
  let found = false;
  
  for (const role of Object.keys(registry)) {
    const userIndex = registry[role].findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      registry[role][userIndex].isActive = true;
      found = true;
      break;
    }
  }
  
  if (found) {
    saveUsersRegistry(registry);
  }
  return found;
}

// Mock delay to simulate network request
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// API METHODS
// ============================================

export const mockApi = {
  // Login endpoint - searches in role-based registry
  async login(email, password) {
    await delay(500);

    const user = findUserByEmail(email);

    if (!user) {
      throw {
        response: {
          status: 401,
          data: { message: "Invalid email or password" },
        },
      };
    }

    // Check if user is active
    if (!user.isActive) {
      throw {
        response: {
          status: 403,
          data: { message: "Your account has been deactivated. Contact admin." },
        },
      };
    }

    // Validate password
    if (user.password !== password) {
      throw {
        response: {
          status: 401,
          data: { message: "Invalid email or password" },
        },
      };
    }

    // Add login log
    addLoginLog(user.id);

    // Generate token
    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    return {
      data: {
        token,
        user: userWithoutPassword,
      },
    };
  },

  // Register endpoint - adds to role-based registry
  async register(userData) {
    await delay(500);

    // Check if email already exists
    if (emailExists(userData.email)) {
      throw {
        response: {
          status: 400,
          data: { message: "Email already registered" },
        },
      };
    }

    // Get registry and add new user
    const registry = getUsersRegistry();
    const roleKey = (userData.role || "user").toLowerCase();

    if (!registry[roleKey]) {
      registry[roleKey] = [];
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      role: userData.role || "User",
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    registry[roleKey].push(newUser);
    saveUsersRegistry(registry);

    // Generate token
    const { password: _, ...userWithoutPassword } = newUser;
    const token = generateToken(userWithoutPassword);

    return {
      data: {
        message: "Account created successfully",
        token,
        user: userWithoutPassword,
      },
    };
  },

  // Logout - records logout time
  async logout(userId) {
    await delay(100);
    addLogoutLog(userId);
    return { data: { success: true } };
  },

  // Get all users (admin only)
  async getAllUsers() {
    await delay(300);
    return { data: { users: getAllUsers() } };
  },

  // Get role stats (admin only)
  async getRoleStats() {
    await delay(200);
    return { data: { stats: getRoleStats() } };
  },

  // Get users by role (admin only)
  async getUsersByRole(role) {
    await delay(300);
    const users = getUsersByRole(role);
    return { 
      data: { 
        users: users.map(u => ({
          ...u,
          lastLoginTime: getLastLoginTime(u.id)
        }))
      } 
    };
  },

  // Deactivate user (admin only)
  async deactivateUser(userId) {
    await delay(300);
    const success = deactivateUser(userId);
    return { 
      data: { 
        success,
        message: success ? "User deactivated" : "User not found"
      } 
    };
  },

  // Activate user (admin only)
  async activateUser(userId) {
    await delay(300);
    const success = activateUser(userId);
    return { 
      data: { 
        success,
        message: success ? "User activated" : "User not found"
      } 
    };
  },

  // Get login history for a user
  async getUserLoginHistory(userId) {
    await delay(200);
    const logs = getAuthLogs();
    return { data: { logs: logs[userId] || [] } };
  },

  // Get demo accounts (for reference)
  getDemoAccounts() {
    return DEFAULT_USERS;
  },
};

export default mockApi;
