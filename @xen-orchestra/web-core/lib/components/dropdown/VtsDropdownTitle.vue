<!--
 "Select all" / "Deselect all" spans are temporary, until we have a tertiary button
 TODO: Replace `span` with `UiButton` when new version (with tertiary) is available
 -->
<template>
  <div class="vts-dropdown-title">
    <VtsIcon :name="icon" size="medium" />
    <div class="typo-caption-small">
      <slot />
    </div>
    <div v-if="onToggleSelectAll" class="buttons">
      <span v-if="selected !== 'all'" @click="emit('toggleSelectAll', true)">
        {{ t('action:select-all') }}
      </span>
      <span v-if="selected !== 'none'" @click="emit('toggleSelectAll', false)">
        {{ t('action:select-none') }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { IconName } from '@core/icons'
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    icon?: IconName
    selected?: 'all' | 'some' | 'none'
    onToggleSelectAll?: (value: boolean) => void
  }>(),
  { selected: 'none' }
)

const emit = defineEmits<{
  toggleSelectAll: [value: boolean]
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vts-dropdown-title {
  display: flex;
  align-items: center;
  padding: 0.4rem 1.6rem;
  gap: 0.8rem;
  height: 2.9rem;
  background: var(--color-neutral-background-secondary);
}

.buttons {
  display: flex;
  gap: 0.8rem;
  margin-left: auto;

  span {
    cursor: pointer;
    text-decoration: underline;
    color: var(--color-info-txt-base);

    &:hover {
      color: var(--color-info-item-hover);
    }

    &:active {
      color: var(--color-info-item-active);
    }
  }
}
</style>
