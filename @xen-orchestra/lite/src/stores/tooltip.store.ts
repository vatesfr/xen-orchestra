import { defineStore } from "pinia";
import type { Options } from "placement.js";
import { type EffectScope, computed, effectScope, ref } from "vue";
import { type WindowEventName, useEventListener } from "@vueuse/core";

export type TooltipOptions =
  | string
  | {
      content: string;
      placement: Options["placement"];
      disabled?: boolean | ((target: HTMLElement) => boolean);
    };

export type TooltipEvents = { on: WindowEventName; off: WindowEventName };

export const useTooltipStore = defineStore("tooltip", () => {
  const elementsScopes = new WeakMap<HTMLElement, EffectScope>();
  const targets = ref(new Set<HTMLElement>());
  const elementsOptions = ref(new Map<HTMLElement, TooltipOptions>());

  const register = (
    target: HTMLElement,
    options: TooltipOptions,
    events: TooltipEvents
  ) => {
    const scope = effectScope();

    elementsScopes.set(target, scope);
    elementsOptions.value.set(target, options);

    scope.run(() => {
      useEventListener(target, events.on, () => {
        targets.value.add(target);

        scope.run(() => {
          useEventListener(
            target,
            events.off,
            () => {
              targets.value.delete(target);
            },
            { once: true }
          );
        });
      });
    });
  };

  const updateOptions = (element: HTMLElement, options: TooltipOptions) => {
    elementsOptions.value.set(element, options);
  };

  const unregister = (target: HTMLElement) => {
    targets.value.delete(target);
    elementsOptions.value.delete(target);
    elementsScopes.get(target)?.stop();
    elementsScopes.delete(target);
  };

  return {
    register,
    unregister,
    updateOptions,
    tooltips: computed(() => {
      return Array.from(targets.value.values()).map((target) => {
        return {
          target,
          options: elementsOptions.value.get(target),
        };
      });
    }),
  };
});
