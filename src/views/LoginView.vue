<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { Lock, Mail, AlertCircle } from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = "Please enter both email and password";
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  const result = await authStore.signIn(email.value, password.value);

  if (result.error) {
    errorMessage.value = result.error;
    isLoading.value = false;
  } else {
    router.push("/dashboard");
  }
};

const handleGoogleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  const result = await authStore.signInWithGoogle();

  if (result.error) {
    errorMessage.value = result.error;
    isLoading.value = false;
  } else {
    router.push("/dashboard");
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-light-grey p-4">
    <div class="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          MMS Admin Portal
        </h1>
        <div
          class="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-navy/10 text-navy rounded-full text-xs sm:text-sm font-medium"
        >
          <Lock :size="16" />
          <span>Admin Access Only</span>
        </div>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">

        <!-- Google Sign In Button -->
        <button
          @click="handleGoogleLogin"
          :disabled="isLoading"
          type="button"
          class="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>{{ isLoading ? "Signing In..." : "Sign in with Google" }}</span>
        </button>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <!-- Email Field -->
        <div>
          <label
            for="email"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Address
          </label>
          <div class="relative">
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <Mail :size="20" class="text-gray-400" />
            </div>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
              placeholder="admin@example.com"
            />
          </div>
        </div>

        <!-- Password Field -->
        <div>
          <label
            for="password"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <div class="relative">
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <Lock :size="20" class="text-gray-400" />
            </div>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
              placeholder="••••••••"
            />
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle :size="20" class="text-muted-red flex-shrink-0 mt-0.5" />
          <p class="text-sm text-red-700">{{ errorMessage }}</p>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-navy text-white py-2.5 px-4 rounded-lg font-medium hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? "Signing In..." : "Sign In" }}
        </button>
      </form>



      
    </div>
  </div>
</template>
