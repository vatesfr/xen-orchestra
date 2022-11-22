import { useColorMode } from "@vueuse/core";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useUiStore = defineStore("ui", () => {
  const currentHostOpaqueRef = ref();

  const colorMode = useColorMode({ emitAuto: true, initialValue: "dark" });

  return {
    colorMode,
    currentHostOpaqueRef,
  };
});
