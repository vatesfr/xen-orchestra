import { useBreakpoints, useColorMode } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

export const useUiStore = defineStore("ui", () => {
  const currentHostOpaqueRef = ref();

  const { store: colorMode } = useColorMode({ initialValue: "dark" });

  const { desktop: isDesktop } = useBreakpoints({
    desktop: 1024,
  });

  const isMobile = computed(() => !isDesktop.value);

  const route = useRoute();
  const hasUi = computed(() => route.query.ui !== "0");

  return {
    colorMode,
    currentHostOpaqueRef,
    isDesktop,
    isMobile,
    hasUi,
  };
});
