import { defineStore } from "pinia";
import { ref } from "vue";
import { authService } from "../services/authService";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const loading = ref(true);
  const error = ref(null);

  const signIn = async (email, password) => {
    loading.value = true;
    error.value = null;
    const result = await authService.signIn(email, password);
    if (result.error) {
      error.value = result.error;
    } else {
      user.value = result.user;
    }
    loading.value = false;
    return result;
  };

  const signOut = async () => {
    loading.value = true;
    error.value = null;
    const result = await authService.signOut();
    if (result.error) {
      error.value = result.error;
    } else {
      user.value = null;
    }
    loading.value = false;
    return result;
  };

  const setUser = (newUser) => {
    user.value = newUser;
    loading.value = false;
  };

  const signInWithGoogle = async () => {
    loading.value = true;
    error.value = null;
    const result = await authService.signInWithGoogle();
    if (result.error) {
      error.value = result.error;
    } else {
      user.value = result.user;
    }
    loading.value = false;
    return result;
  };

  const approveAdmin = async (email) => {
    const currentUserEmail = user.value?.email;
    if (!currentUserEmail) {
      return { error: "You must be logged in to approve admins" };
    }
    return await authService.approveAdmin(email, currentUserEmail);
  };

  const getAllAdmins = async () => {
    return await authService.getAllAdmins();
  };

  const removeAdmin = async (email) => {
    const currentUserEmail = user.value?.email;
    if (!currentUserEmail) {
      return { error: "You must be logged in to remove admins" };
    }
    // Prevent removing yourself
    if (email === currentUserEmail) {
      return { error: "You cannot remove your own admin access" };
    }
    return await authService.removeAdmin(email);
  };

  const initAuth = () => {
    return authService.onAuthStateChanged((newUser) => {
      setUser(newUser);
    });
  };

  return {
    user,
    loading,
    error,
    signIn,
    signInWithGoogle,
    approveAdmin,
    getAllAdmins,
    removeAdmin,
    signOut,
    setUser,
    initAuth,
  };
});
