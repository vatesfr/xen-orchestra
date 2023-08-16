import { usePropagatedProp } from "@/composables/propagated-prop.composable";
import type { Color } from "@/types";
import { IK_PROPAGATED_COLOR } from "@/types/injection-keys";
import { computed, type MaybeRefOrGetter } from "vue";

export const usePropagatedColor = (
  color?: MaybeRefOrGetter<Color | undefined>
) => {
  const name = usePropagatedProp(IK_PROPAGATED_COLOR, color);
  const textClass = computed(() => `propagated-color-${name.value}`);
  const bgClass = computed(() => `propagated-background-color-${name.value}`);

  return {
    name,
    textClass,
    bgClass,
  };
};
