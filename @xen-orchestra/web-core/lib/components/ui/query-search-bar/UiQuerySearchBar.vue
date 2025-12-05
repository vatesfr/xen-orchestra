<!-- v3 -->
<template>
  <form class="ui-query-search-bar" @submit.prevent="emit('search', value)">
    <label v-if="uiStore.isDesktopLarge" :for="id" class="typo-body-regular-small label">
      {{ t('query-search-bar:label') }}
    </label>
    <UiInput
      :id
      v-model="value"
      type="text"
      accent="brand"
      :aria-label="uiStore.isMobile ? t('query-search-bar:label') : undefined"
      :icon="!uiStore.isMobile ? 'fa:magnifying-glass' : undefined"
      :placeholder="t('query-search-bar:placeholder')"
    />
    <template v-if="!uiStore.isMobile">
      <UiButton size="medium" accent="brand" variant="primary" type="submit" class="action-button">
        {{ t('action:search') }}
      </UiButton>
      <VtsDivider type="stretch" />
      <UiButton
        v-tooltip="t('coming-soon')"
        size="medium"
        accent="brand"
        variant="secondary"
        disabled
        class="action-button"
      >
        {{ t('query-search-bar:use-query-builder') }}
      </UiButton>
    </template>

    <!-- Mobile icons: search + filter -->
    <template v-else>
      <UiButtonIcon accent="brand" size="small" type="submit" icon="fa:magnifying-glass" class="action-button" />
      <UiButtonIcon accent="brand" size="small" disabled icon="fa:filter" class="action-button" />
    </template>
  </form>
</template>

<script lang="ts" setup>
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useUiStore } from '@core/stores/ui.store'
import { uniqueId } from '@core/utils/unique-id.util'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  search: [value: string]
}>()

const { t } = useI18n()

const id = uniqueId('search-input-')

const uiStore = useUiStore()

const value = ref<string>('')
</script>

<style lang="postcss" scoped>
.ui-query-search-bar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 1.6rem;
  overflow-x: auto;
  width: 100%;
}

.label {
  color: var(--color-neutral-txt-secondary);
  flex: 0 0 auto;
  white-space: nowrap;
}

.action-button {
  flex: 0 0 auto;
  white-space: nowrap;
}
</style>
