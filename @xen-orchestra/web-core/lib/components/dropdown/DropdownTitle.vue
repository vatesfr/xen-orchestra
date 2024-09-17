<!--
 "Select all" / "Deselect all" spans are temporary, until we have a tertiary button
 TODO: Replace `span` with `UiButton` when new version (with tertiary) is available
 -->
<template>
  <div class="dropdown-title">
    <UiIcon :icon />
    <div class="label c3 semi-bold">
      <slot />
    </div>
    <div v-if="onToggleSelectAll" class="buttons">
      <span v-if="selected !== 'all'" @click="emit('toggleSelectAll', true)">
        {{ $t('core.select.all') }}
      </span>
      <span v-if="selected !== 'none'" @click="emit('toggleSelectAll', false)">
        {{ $t('core.select.none') }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

withDefaults(
  defineProps<{
    icon?: IconDefinition
    selected?: 'all' | 'some' | 'none'
    onToggleSelectAll?: (value: boolean) => void
  }>(),
  { selected: 'none' }
)

const emit = defineEmits<{
  toggleSelectAll: [value: boolean]
}>()
</script>

<style lang="postcss" scoped>
.dropdown-title {
  display: flex;
  align-items: center;
  padding: 0.4rem 1.6rem;
  gap: 0.8rem;
  height: 2.6rem;
  background: var(--color-neutral-background-secondary);
}

.buttons {
  display: flex;
  gap: 0.8rem;
  margin-left: auto;

  span {
    cursor: pointer;
    text-decoration: underline;
    color: var(--color-normal-txt-base);

    &:hover {
      color: var(--color-normal-item-hover);
    }

    &:active {
      color: var(--color-normal-item-active);
    }
  }
}
</style>
