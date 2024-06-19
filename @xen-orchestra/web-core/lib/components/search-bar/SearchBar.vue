<!-- v1.1 -->
<template>
  <form class="search-bar" @submit.prevent="emit('search', value)">
    <label :for="id" class="typo p2-regular label" :class="uiStore.desktopOnlyClass">
      {{ $t('core.search-bar.label') }}
    </label>
    <UiInput
      :id
      v-model="value"
      :icon="uiStore.isDesktop ? faMagnifyingGlass : undefined"
      :placeholder="$t('core.search-bar.placeholder')"
    />
    <template v-if="uiStore.isDesktop">
      <UiButton type="submit">{{ $t('core.search') }}</UiButton>
      <UiSeparator class="separator" />
      <UiButton v-tooltip="$t('core.coming-soon')" level="secondary" :left-icon="faFilter" disabled>
        {{ $t('core.search-bar.use-query-builder') }}
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
import UiInput from '@core/components/input/UiInput.vue'
import UiSeparator from '@core/components/UiSeparator.vue'
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
  color: var(--color-grey-200);
}

.separator {
  border: 0;
  width: 0.1rem;
  background-color: var(--color-grey-500);
  align-self: stretch;
}
</style>
