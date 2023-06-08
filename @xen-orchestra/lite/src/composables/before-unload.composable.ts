import { computed, onBeforeUnmount, ref, watchEffect } from "vue";

const beforeUnloadListener = function (e: BeforeUnloadEvent) {
  e.preventDefault();
  e.returnValue = ""; // Required to trigger the modal on some browser. https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#browser_compatibility
};

export default function useBeforeUnload() {
  const confirmBeforeLeave = ref(false);

  const eventMethod = computed(() =>
    confirmBeforeLeave.value ? "addEventListener" : "removeEventListener"
  );

  watchEffect(() => {
    window[eventMethod.value]("beforeunload", beforeUnloadListener);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", beforeUnloadListener);
  });

  return {
    confirmBeforeLeave,
  };
}
