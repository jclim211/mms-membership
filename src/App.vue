<script setup>
import { onMounted } from "vue";
import { RouterView } from "vue-router";
import { useAuthStore } from "./stores/authStore";

const authStore = useAuthStore();

onMounted(() => {
  // Initialize auth state listener
  authStore.initAuth();
});
</script>

<template>
  <RouterView />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, sans-serif;
}
</style>
