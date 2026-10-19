<template>
  <div class="plugin-state-toggles" :class="{ vertical }">
    <UiToggle
      v-tooltip="!canToggleLoaded && toggleLoadedErrorMessage"
      :model-value="isLoaded"
      :busy="isTogglingLoaded"
      :disabled="!canToggleLoaded"
      capitalize
      @update:model-value="toggleLoaded()"
    >
      {{ t('loaded') }}
    </UiToggle>
    <UiToggle
      v-tooltip="!canToggleAutoload && toggleAutoloadErrorMessage"
      :model-value="plugin.autoload"
      :busy="isTogglingAutoload"
      :disabled="!canToggleAutoload"
      capitalize
      @update:model-value="toggleAutoload()"
    >
      {{ t('load-at-startup') }}
    </UiToggle>
    <ApiErrorAlert v-if="error !== undefined" :title="t('plugin:action-failed')" :error />
  </div>
</template>

<script lang="ts" setup>
import { useXoPluginState } from '@/modules/plugin/composables/use-xo-plugin-state.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import ApiErrorAlert from '@/shared/components/ApiErrorAlert.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { plugin } = defineProps<{
  plugin: FrontXoPlugin
  vertical?: boolean
}>()

const { t } = useI18n()

const {
  isLoaded,
  toggleLoaded,
  canToggleLoaded,
  isTogglingLoaded,
  toggleLoadedErrorMessage,
  toggleAutoload,
  canToggleAutoload,
  isTogglingAutoload,
  toggleAutoloadErrorMessage,
  error,
} = useXoPluginState(() => plugin)
</script>

<style lang="postcss" scoped>
.plugin-state-toggles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.6rem;

  &.vertical {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
  }
}
</style>
