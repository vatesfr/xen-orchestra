<!-- v1.2 -->
<template>
  <form class="search-bar" @submit.prevent="emit('search', value)">
    <label v-if="uiStore.isDesktop" :for="id" class="typo p2-regular label">
      {{ $t('core.query-search-bar.label') }}
    </label>
    <UiInput
      :id
      v-model="value"
      :aria-label="uiStore.isMobile ? $t('core.query-search-bar.label') : undefined"
      :icon="uiStore.isDesktop ? faMagnifyingGlass : undefined"
      :placeholder="$t('core.query-search-bar.placeholder')"
    />
    <template v-if="uiStore.isDesktop">
      <UiButton size="medium" color="info" level="primary" type="submit">{{ $t('core.search') }}</UiButton>
      <Divider type="stretch" />
      <UiButton
        v-tooltip="$t('coming-soon')"
        size="medium"
        color="info"
        level="secondary"
        :left-icon="faFilter"
        disabled
      >
        {{ $t('core.query-search-bar.use-query-builder') }}
      </UiButton>
    </template>
    <template v-else>
      <ButtonIcon type="submit" :icon="faMagnifyingGlass" />
      <ButtonIcon disabled :icon="faFilter" />
    </template>
  </form>
</template>

<script lang="ts" setup>
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import UiButton from '@core/components/button/UiButton.vue'
import Divider from '@core/components/divider/Divider.vue'
import UiInput from '@core/components/input/UiInput.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useUiStore } from '@core/stores/ui.store'
import { uniqueId } from '@core/utils/unique-id.util'
import { faFilter, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const emit = defineEmits<{
  search: [value: string]
}>()

const id = uniqueId('search-input-')

const uiStore = useUiStore()

const value = ref<string>('')
</script>

<style lang="postcss" scoped>
.search-bar {
  display: flex;
  gap: 1.6rem;
  align-items: center;
}

.label {
  color: var(--color-neutral-txt-secondary);
}
</style>
