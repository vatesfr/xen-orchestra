<template>
  <Teleport :disabled="isNested" to="body">
    <component
      :is="isNested ? 'div' : 'form'"
      :class="className"
      class="ui-modal"
      v-bind="$attrs"
      @click.self="!isNested && emit('close')"
    >
      <div :class="{ nested: isNested }" class="container">
        <span v-if="onClose" class="close-icon" @click="emit('close')">
          <UiIcon :icon="faXmark" />
        </span>
        <div v-if="icon || $slots.icon" class="modal-icon">
          <slot name="icon">
            <UiIcon :icon="icon" />
          </slot>
        </div>
        <UiTitle v-if="$slots.title" type="h4">
          <slot name="title" />
        </UiTitle>
        <div v-if="$slots.subtitle" class="subtitle">
          <slot name="subtitle" />
        </div>
        <div v-if="$slots.default" class="content">
          <slot />
        </div>
        <UiButtonGroup v-if="!isNested" :color="color">
          <slot name="buttons" />
        </UiButtonGroup>
      </div>
    </component>
  </Teleport>
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import UiButtonGroup from "@/components/ui/UiButtonGroup.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
import { IK_MODAL_NESTED } from "@/types/injection-keys";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useMagicKeys, whenever } from "@vueuse/core";
import { computed, inject, provide } from "vue";

const props = withDefaults(
  defineProps<{
    icon?: IconDefinition;
    color?: "info" | "warning" | "error" | "success";
    onClose?: () => void;
  }>(),
  { color: "info" }
);

const emit = defineEmits<{
  (event: "close"): void;
}>();

const isNested = inject(IK_MODAL_NESTED, false);
provide(IK_MODAL_NESTED, true);

const { escape } = useMagicKeys();
whenever(escape, () => emit("close"));

const className = computed(() => {
  return [
    `color-${props.color}`,
    {
      "has-icon": props.icon !== undefined,
      nested: isNested,
    },
  ];
});
</script>

<style lang="postcss" scoped>
.ui-modal {
  display: flex;
  overflow: auto;
  align-items: center;
  justify-content: center;

  &:not(.nested) {
    background-color: #00000080;
    position: fixed;
    z-index: 2;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}

.color-success {
  --modal-color: var(--color-green-infra-base);
  --modal-background-color: var(--background-color-green-infra);
}

.color-info {
  --modal-color: var(--color-extra-blue-base);
  --modal-background-color: var(--background-color-extra-blue);
}

.color-warning {
  --modal-color: var(--color-orange-world-base);
  --modal-background-color: var(--background-color-orange-world);
}

.color-error {
  --modal-color: var(--color-red-vates-base);
  --modal-background-color: var(--background-color-red-vates);
}

.container {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  min-width: 40rem;
  text-align: center;
  border-radius: 1rem;
  background-color: var(--modal-background-color);
  margin: 1rem 2rem;

  &.nested {
    width: 100%;
  }

  &:not(.nested) {
    box-shadow: var(--shadow-400);
    padding: 4.2rem;
  }
}

.container > div:last-child {
  padding-bottom: 1rem;
}

.close-icon {
  font-size: 2rem;
  position: absolute;
  top: 1.5rem;
  right: 2rem;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  color: var(--modal-color);
}

.container :deep(.accent) {
  color: var(--modal-color);
}

.modal-icon {
  font-size: 4.8rem;
  margin: 2rem 0;
  color: var(--modal-color);
}

.ui-title {
  margin-top: 4rem;

  .has-icon & {
    margin-top: 0;
  }
}

.subtitle {
  font-size: 1.6rem;
  font-weight: 400;
  color: var(--color-blue-scale-200);
}

.content {
  overflow: auto;
  font-size: 1.6rem;
  max-height: calc(100vh - 40rem);
  margin-top: 2rem;
}

.ui-button-group {
  margin-top: 4rem;
}
</style>
