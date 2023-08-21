import { useContext } from "@/composables/context.composable";
import { ColorContext } from "@/context";
import type { Color } from "@/types";
import { computed, type MaybeRefOrGetter } from "vue";

export const useColorContext = (
  newColor?: MaybeRefOrGetter<Color | undefined>
) => {
  const name = useContext(ColorContext, newColor);

  const textColor = computed(() => `context-color-${name.value}`);

  const backgroundColor = computed(
    () => `context-background-color-${name.value}`
  );

  const borderColor = computed(() => `context-border-color-${name.value}`);

  return {
    name,
    textColor,
    backgroundColor,
    borderColor,
  };
};
