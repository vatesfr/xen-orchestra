<template>
  <div class="vts-clipboard-console">
    <UiCardTitle>{{ $t('console-clipboard') }}</UiCardTitle>
    <UiTextarea v-tooltip="$t('coming-soon')" accent="brand" disabled :model-value="modelValue" />
    <div class="buttons-container">
      <UiButton v-tooltip="$t('coming-soon')" accent="brand" variant="primary" size="medium" disabled>
        {{ $t('send') }}
      </UiButton>
      <UiButton v-tooltip="$t('coming-soon')" accent="brand" variant="secondary" size="medium" disabled>
        {{ $t('receive') }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { ref } from 'vue'

const modelValue = ref('')
</script>

<style lang="postcss" scoped>
.vts-clipboard-console {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;

  .buttons-container {
    display: flex;
    gap: 0.8rem;
  }
}
</style>
