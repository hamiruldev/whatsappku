// Remove the import since we're using CDN
// import { pb } from "../lib/pocketbase";
// import { superuserClient } from "../lib/superuserClient";

// Helper function for PocketBase list queries
const fetchFirstItem = async (collection, filter) => {
  try {
    return await pb.collection(collection).getFirstListItem(filter);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
};

// User API calls
export const userAPI = {
  register: (userData) => pb.collection("usersku").create(userData),

  validateField: async (field, value) => {
    try {
      const result = await pb.collection("usersku").getList(1, 1, {
        filter: `${field} = "${value}"`
      });
      return result.items.length === 0;
    } catch (error) {
      throw error;
    }
  },

  requestPasswordReset: (email) =>
    pb.collection("usersku").requestPasswordReset(email),

  getProfile: (userId) => pb.collection("usersku").getOne(userId),

  updateProfile: (userId, formData) =>
    pb.collection("usersku").update(userId, formData),

  getAllUsers: (page = 1, perPage = 50, options = {}) =>
    pb.collection("usersku").getList(page, perPage, {
      sort: "username",
      ...options
    }),

  validateReferralCode: async (code) =>
    !!(await fetchFirstItem("usersku", `kodku="${code}"`)),

  getUserDetailsByCode: (code) => fetchFirstItem("usersku", `kodku="${code}"`),

  getUserDetails: async (userId) => {
    if (!userId) return null;
    return pb.collection("usersku").getOne(userId, {
      fields: "id,username,name,email,avatar_url"
    });
  },

  getUsername: async (userId) => {
    const record = await userAPI.getProfile(userId);
    return record?.name || record?.username || null;
  }
};

// Authentication API
export const authAPI = {
  checkUserRole: async (userId) => {
    try {
      const roleRecord = await pb.collection("tenant_roles").getFirstListItem(`user="${userId}"`);
      if (!roleRecord) return { role: "guest", tenantId: null };

      const roleDetails = await pb.collection("roles").getOne(roleRecord.role);
      return {
        role: roleDetails?.name || "guest",
        tenantId: roleRecord.tenant
      };
    } catch (error) {
      console.error("Error checking user role:", error);
      return { role: "guest", tenantId: null };
    }
  },

  isValidSession: () => pb.authStore.isValid,

  logout: () => {
    pb.authStore.clear();
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("userRole");
    localStorage.removeItem("tenantId");
    window.location.href = "/login";
  },

  getCurrentUser: () => {
    if (!pb.authStore.isValid) return null;
    return pb.authStore.model;
  }
};

// List of Values (LOV) API
export const LOV = {
  getUsers: (page = 1, perPage = 50, options = {}) =>
    pb.collection("userku_lov").getFullList(page, perPage, {
      sort: "-created",
      ...options
    })
};
