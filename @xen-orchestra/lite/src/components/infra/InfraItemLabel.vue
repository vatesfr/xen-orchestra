<template>
  <RouterLink v-slot="{ isExactActive, href, navigate }" :to="route" custom>
    <div
      :class="
        isExactActive ? 'exact-active' : $props.active ? 'active' : undefined
      "
      class="infra-item-label"
      v-bind="$attrs"
    >
      <a :href="href" class="link" @click="navigate">
        <UiIcon :icon="icon" class="icon" />
        <div class="text">
          <slot />
        </div>
      </a>
      <div class="actions">
        <slot name="actions" />
      </div>
    </div>
  </RouterLink>
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import type { RouteLocationRaw } from "vue-router";

defineProps<{
  icon: IconDefinition;
  route: RouteLocationRaw;
  active?: boolean;
}>();
</script>

<style lang="postcss" scoped>
.infra-item-label {
  display: flex;
  align-items: stretch;
  color: var(--color-blue-scale-100);
  border-radius: 0.8rem;
  background-color: var(--background-color-primary);

  &:hover {
    color: var(--color-blue-scale-100);
    background-color: var(--background-color-secondary);
  }

  &:active,
  &.active {
    color: var(--color-extra-blue-base);
    background-color: var(--background-color-primary);
  }

  &.exact-active {
    color: var(--color-blue-scale-100);
    background-color: var(--background-color-extra-blue);

    .icon {
      color: var(--color-extra-blue-base);
    }
  }
}

.link {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  gap: 1rem;
  font-weight: 500;
  font-size: 2rem;
}

.text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 1.6rem;
}

.actions {
  display: flex;
  align-items: center;
}
</style>
