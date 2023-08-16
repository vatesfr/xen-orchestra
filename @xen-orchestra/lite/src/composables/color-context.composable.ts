import { useContext } from "@/composables/context.composable";
import { ColorContext } from "@/context";
import type { Color } from "@/types";
import { computed, type MaybeRefOrGetter } from "vue";

export const useColorContext = (
  newColor?: MaybeRefOrGetter<Color | undefined>
) => {
  const name = useContext(ColorContext, newColor);

  const textClass = computed(() => `context-color-${name.value}`);

  const backgroundClass = computed(
    () => `context-background-color-${name.value}`
  );

  const borderClass = computed(() => `context-border-color-${name.value}`);

  return {
    name,
    textClass,
    backgroundClass,
    borderClass,
  };
};
