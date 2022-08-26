import { isString } from "lodash-es";
import type { Options } from "placement.js";
import type { DirectiveBinding } from "vue";
import { useEventListener } from "@vueuse/core";
import { useTooltipStore } from "@/stores/tooltip.store";

export type TooltipOptions =
  | string
  | {
      content: string;
      placement: Options["placement"];
      disabled?: boolean | ((target: HTMLElement) => boolean);
    };

export type TooltipProps = {
  content: string;
  placement: Options["placement"];
  disabled?: boolean | ((target: HTMLElement) => boolean);
  target: HTMLElement;
};

const optionsToProps = (
  target: HTMLElement,
  userOptions: TooltipOptions
): TooltipProps => {
  if (isString(userOptions)) {
    return {
      content: userOptions,
      disabled: false,
      placement: "top",
      target,
    };
  }

  return {
    ...userOptions,
    target,
  };
};

export default function vTooltip(
  target: HTMLElement,
  binding: DirectiveBinding<TooltipOptions>
) {
  const tooltipStore = useTooltipStore();
  const props = optionsToProps(target, binding.value);
  tooltipStore.registerTooltip(target, props);

  const events = binding.modifiers.focus
    ? { on: "focusin", off: "focusout" }
    : { on: "mouseenter", off: "mouseleave" };

  useEventListener(target, events.on, () => {
    tooltipStore.activate(target);
    useEventListener(
      target,
      events.off,
      () => {
        tooltipStore.deactivate(target);
      },
      { once: true }
    );
  });
}
