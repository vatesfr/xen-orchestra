<template>
  <div class="vts-clipboard-console">
    <UiCardTitle>{{ $t('console-clipboard') }}</UiCardTitle>
    <UiTextarea accent="info" :model-value="modelValue" />
    <div class="btn">
      <UiButton v-tooltip="$t('coming-soon')" accent="info" variant="primary" size="medium" disabled>
        {{ $t('send') }}
      </UiButton>
      <UiButton v-tooltip="$t('coming-soon')" accent="info" variant="secondary" size="medium" disabled>
        {{ $t('receive') }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiTextarea from '@core/components/ui/input/UiTextarea.vue'
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
}
.btn {
  display: flex;
  gap: 0.8rem;
}
</style>
