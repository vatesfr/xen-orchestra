import type { Directive } from "vue";
import type { TooltipEvents, TooltipOptions } from "@/stores/tooltip.store";
import { useTooltipStore } from "@/stores/tooltip.store";

export const vTooltip: Directive<HTMLElement, TooltipOptions> = {
  mounted(target, binding) {
    const store = useTooltipStore();

    const events: TooltipEvents = binding.modifiers.focus
      ? { on: "focusin", off: "focusout" }
      : { on: "mouseenter", off: "mouseleave" };

    store.register(target, binding.value, events);
  },
  updated(target, binding) {
    const store = useTooltipStore();
    store.updateOptions(target, binding.value);
  },
  beforeUnmount(target) {
    const store = useTooltipStore();
    store.unregister(target);
  },
};
