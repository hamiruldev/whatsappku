// Import PocketBase instance
import { pb } from "../lib/pocketbase";
import { superuserClient } from "../lib/superuserClient";

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
        filter: `${field} = "${value}"`,
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
      ...options,
    }),

  validateReferralCode: async (code) =>
    !!(await fetchFirstItem("usersku", `kodku="${code}"`)),

  getUserDetailsByCode: (code) => fetchFirstItem("usersku", `kodku="${code}"`),

  getUserDetails: async (userId) => {
    if (!userId) return null;
    return pb.collection("usersku").getOne(userId, {
      fields: "id,username,name,email,avatar_url",
    });
  },

  getUsername: async (userId) => {
    const record = await userAPI.getProfile(userId);
    return record?.name || record?.username || null;
  },
};

// Authentication API
export const authAPI = {
  checkUserRole: async (userId) => {
    try {
      const roleRecord = await fetchFirstItem(
        "tenant_roles",
        `user="${userId}"`
      );
      const roleDetails = roleRecord
        ? await fetchFirstItem("roles", `id="${roleRecord.role}"`)
        : null;

      return {
        role: roleDetails?.name || "guest",
        tenantId: "rb0s8fazmuf44ac",
      };
    } catch (error) {
      console.error("Error checking user role:", error);
      return { role: "guest", tenantId: "rb0s8fazmuf44ac" };
    }
  },

  login: async (email, password) => {
    try {
      const authData = await pb
        .collection("usersku")
        .authWithPassword(email, password);
      if (authData?.record) {
        const { role, tenantId } = await authAPI.checkUserRole(
          authData.record.id
        );

        localStorage.setItem("userRole", role);
        localStorage.setItem("isAdmin", role === "admin");

        window.location.href = role === "admin" ? "/dashboard" : "/bilikku";
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  register: async (email, password, name, username) => {
    const userData = {
      email,
      password,
      passwordConfirm: password,
      full_name: name,
      username,
    };
    await userAPI.register(userData);
    return authAPI.login(email, password);
  },

  logout: () => {
    pb.authStore.clear();
    superuserClient.authStore.clear();
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("userRole");
    document.cookie = "pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
  },

  isValidSession: () =>
    pb.authStore.isValid || superuserClient.authStore.isValid,

  getCurrentUser: async () => {
    if (pb.authStore.isValid && pb.authStore.model) {
      const authModel = pb.authStore.model;
      const { role, tenantId } = await authAPI.checkUserRole(authModel.id);
      return {
        id: authModel.id,
        email: authModel.email,
        role,
        username: authModel.username,
        isAdmin: role === "admin",
        isSuperAdmin: false,
        tenantId,
      };
    }
    return null;
  },
};

// List of Values (LOV) API
export const LOV = {
  getUsers: (page = 1, perPage = 50, options = {}) =>
    pb.collection("userku_lov").getFullList(page, perPage, {
      sort: "-created",
      ...options,
    }),
};
