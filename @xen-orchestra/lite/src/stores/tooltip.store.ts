import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { TooltipProps } from "@/directives/tooltip.directive";

export const useTooltipStore = defineStore("tooltip", () => {
  const registeredTooltips = ref(
    new Map<HTMLElement, { active: boolean; props: TooltipProps }>()
  );

  const registerTooltip = (target: HTMLElement, props: TooltipProps) => {
    if (!registeredTooltips.value.has(target)) {
      registeredTooltips.value.set(target, { active: false, props });
    } else {
      const tooltip = registeredTooltips.value.get(target)!;
      tooltip.props = props;
    }
  };

  const activeTooltips = computed(() =>
    Array.from(registeredTooltips.value.values())
      .filter((tooltip) => tooltip.active)
      .map((tooltip) => tooltip.props)
  );

  const activate = (target: HTMLElement) => {
    const tooltip = registeredTooltips.value.get(target);
    if (tooltip) {
      tooltip.active = true;
    }
  };

  const deactivate = (target: HTMLElement) => {
    const tooltip = registeredTooltips.value.get(target);
    if (tooltip) {
      tooltip.active = false;
    }
  };

  return {
    tooltips: activeTooltips,
    registerTooltip,
    activate,
    deactivate,
  };
});
