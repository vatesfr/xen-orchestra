<!-- v3 -->
<template>
  <form class="ui-query-search-bar" @submit.prevent="emit('search')">
    <label v-if="uiStore.isLarge" :for="id" class="typo-body-regular-small label">
      {{ t('query-search-bar:label') }}
    </label>
    <UiInput
      :id
      v-model="value"
      type="text"
      accent="brand"
      :busy
      :aria-label="uiStore.isSmall ? t('query-search-bar:label') : undefined"
      :placeholder="t('query-search-bar:placeholder')"
      enterkeyhint="search"
    />
    <UiButtonIcon v-if="uiStore.isSmall" accent="brand" size="small" disabled icon="fa:filter" class="action-button" />
  </form>
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { uniqueId } from '@core/utils/unique-id.util.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  busy?: boolean
}>()

const emit = defineEmits<{
  search: []
}>()

const value = defineModel<string>({ required: true })

const { t } = useI18n()

const id = uniqueId('search-input-')

const uiStore = useUiStore()
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
