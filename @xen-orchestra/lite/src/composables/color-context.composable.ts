import { useContext } from "@/composables/context.composable";
import type { Color } from "@/types";
import { ColorContext } from "@/context";
import { computed, type MaybeRefOrGetter } from "vue";

export const useColorContext = (
  newColor?: MaybeRefOrGetter<Color | undefined>
) => {
  const name = useContext(ColorContext, newColor);
  const textClass = computed(() => `context-color-${name.value}`);
  const bgClass = computed(() => `context-background-color-${name.value}`);

  return {
    name,
    textClass,
    bgClass,
  };
};
