<template>
  <VtsStateHero :type class="vts-no-selection-hero" image="no-selection">
    {{ t('select-to-see-details') }}
  </VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  type: StateHeroType
}>()

const { t } = useI18n()
</script>
