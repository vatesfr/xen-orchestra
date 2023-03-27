<template>
  <Teleport to="body">
    <form
      :class="className"
      class="ui-modal"
      v-bind="$attrs"
      @click.self="emit('close')"
    >
      <div class="container">
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
        <UiButtonGroup :color="color">
          <slot name="buttons" />
        </UiButtonGroup>
      </div>
    </form>
  </Teleport>
</template>

<script lang="ts" setup>
import UiButtonGroup from "@/components/ui/UiButtonGroup.vue";
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useMagicKeys, whenever } from "@vueuse/core";
import { computed } from "vue";

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

const { escape } = useMagicKeys();
whenever(escape, () => emit("close"));

const className = computed(() => {
  return [`color-${props.color}`, { "has-icon": props.icon !== undefined }];
});
</script>

<style lang="postcss" scoped>
.ui-modal {
  position: fixed;
  z-index: 2;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  overflow: auto;
  align-items: center;
  justify-content: center;
  background-color: #00000080;
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
  padding: 4.2rem;
  text-align: center;
  border-radius: 1rem;
  background-color: var(--modal-background-color);
  box-shadow: var(--shadow-400);
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

.container :slotted(.accent) {
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
