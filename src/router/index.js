import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";
import AdminManagementView from "../views/AdminManagementView.vue";
import HelpView from "../views/HelpView.vue";
import EventsView from "../views/EventsView.vue";
import AnalyticsView from "../views/AnalyticsView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/dashboard",
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { requiresGuest: true },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: "/admin-management",
      name: "admin-management",
      component: AdminManagementView,
      meta: { requiresAuth: true },
    },
    {
      path: "/help",
      name: "help",
      component: HelpView,
      meta: { requiresAuth: true },
    },
    {
      path: "/events",
      component: EventsView,
      meta: { requiresAuth: true },
    },
    {
      path: "/analytics",
      name: "analytics",
      component: AnalyticsView,
      meta: { requiresAuth: true },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/dashboard",
    },
  ],
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Wait for auth to be loaded if still loading
  if (authStore.loading) {
    // Wait a bit for auth state to resolve
    await new Promise((resolve) => {
      const unwatch = authStore.$subscribe((mutation, state) => {
        if (!state.loading) {
          unwatch();
          resolve();
        }
      });
      // Timeout after 2 seconds to prevent infinite wait
      setTimeout(() => {
        unwatch();
        resolve();
      }, 2000);
    });
  }

  // Check auth requirements after loading is complete
  if (to.meta.requiresAuth && !authStore.user) {
    next("/login");
  } else if (to.meta.requiresGuest && authStore.user) {
    next("/dashboard");
  } else {
    next();
  }
});

export default router;
