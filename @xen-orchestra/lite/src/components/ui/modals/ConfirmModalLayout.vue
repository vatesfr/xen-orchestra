<template>
  <BasicModalLayout>
    <UiAccent class="icon">
      <UiIcon :icon="icon" />
    </UiAccent>
    <div v-if="$slots.title || $slots.subtitle">
      <UiTitle v-if="$slots.title" type="h4">
        <slot name="title" />
      </UiTitle>
      <div v-if="$slots.subtitle" class="subtitle">
        <slot name="subtitle" />
      </div>
    </div>
    <div v-if="$slots.default">
      <slot name="default" />
    </div>
    <UiButtonGroup v-if="$slots.buttons">
      <slot name="buttons" />
    </UiButtonGroup>
  </BasicModalLayout>
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import BasicModalLayout from "@/components/ui/modals/BasicModalLayout.vue";
import UiAccent from "@/components/ui/UiAccent.vue";
import UiButtonGroup from "@/components/ui/UiButtonGroup.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
import { usePropagatedColor } from "@/composables/propagated-color.composable";
import type { Color } from "@/types";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

const props = defineProps<{
  icon: IconDefinition;
  color?: Color;
}>();

usePropagatedColor(() => props.color);
</script>

<style lang="postcss" scoped>
.icon {
  font-size: 4.8rem;
  line-height: 0;
}

.subtitle {
  font-size: 1.6rem;
  font-weight: 400;
  color: var(--color-blue-scale-200);
}
</style>
