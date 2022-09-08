import type { Directive } from "vue";
import type { TooltipEvents, TooltipOptions } from "@/stores/tooltip.store";
import { useTooltipStore } from "@/stores/tooltip.store";

export const vTooltip: Directive<HTMLElement, TooltipOptions> = {
  mounted(element, binding) {
    const store = useTooltipStore();

    const events: TooltipEvents = binding.modifiers.focus
      ? { on: "focusin", off: "focusout" }
      : { on: "mouseenter", off: "mouseleave" };

    store.register(element, binding.value, events);
  },
  updated(element, binding) {
    const store = useTooltipStore();
    store.updateOptions(element, binding.value);
  },
  beforeUnmount(element) {
    const store = useTooltipStore();
    store.unregister(element);
  },
};
