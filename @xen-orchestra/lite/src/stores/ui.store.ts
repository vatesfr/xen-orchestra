import { useBreakpoints, useColorMode } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useUiStore = defineStore("ui", () => {
  const currentHostOpaqueRef = ref();

  const colorMode = useColorMode({ emitAuto: true, initialValue: "dark" });

  const { desktop: isDesktop } = useBreakpoints({
    desktop: 1024,
  });

  const isMobile = computed(() => !isDesktop.value);

  return {
    colorMode,
    currentHostOpaqueRef,
    isDesktop,
    isMobile,
  };
});
