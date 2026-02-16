import { ref } from "vue";

const isVisible = ref(!document.hidden);
const isInactive = ref(false);
let inactivityTimer = null;

const INACTIVITY_DELAY = 10 * 60 * 1000; // 10 minutes
const listeners = new Set(); // Store all active listeners

// Track page visibility
document.addEventListener("visibilitychange", () => {
  isVisible.value = !document.hidden;

  if (document.hidden) {
    // Tab hidden - start countdown
    console.log("[Visibility] Tab hidden, starting inactivity timer (10 min)");
    startInactivityTimer();
  } else {
    // Tab visible - cancel countdown and reconnect
    console.log("[Visibility] Tab visible, canceling inactivity timer");
    clearInactivityTimer();
    reconnectListeners();
  }
});

// Track user activity (mouse, keyboard, touch)
let activityTimer = null;
const resetActivityTimer = () => {
  clearTimeout(activityTimer);

  if (isInactive.value) {
    console.log("[Visibility] User activity detected, reconnecting...");
    isInactive.value = false;
    reconnectListeners();
  }

  // Reset inactivity timer if tab is hidden
  if (document.hidden) {
    startInactivityTimer();
  }
};

["mousedown", "keydown", "touchstart", "scroll"].forEach((event) => {
  document.addEventListener(event, resetActivityTimer, { passive: true });
});

function startInactivityTimer() {
  clearInactivityTimer();

  inactivityTimer = setTimeout(() => {
    console.log(
      "[Visibility] Tab inactive for 10 min, disconnecting listeners",
    );
    isInactive.value = true;
    disconnectListeners();
  }, INACTIVITY_DELAY);
}

function clearInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
}

function disconnectListeners() {
  listeners.forEach((callback) => callback("disconnect"));
}

function reconnectListeners() {
  isInactive.value = false;
  listeners.forEach((callback) => callback("reconnect"));
}

// Register a listener to be managed
export function registerListener(callback) {
  listeners.add(callback);

  // Return unregister function
  return () => {
    listeners.delete(callback);
  };
}

export function useVisibility() {
  return {
    isVisible,
    isInactive,
  };
}
