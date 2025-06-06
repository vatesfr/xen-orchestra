<template>
  <VtsStateHero class="vts-object-not-found-hero" image="no-result" :type>
    {{ t('object-not-found', { id }) }}
  </VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  id: string
  type: StateHeroType
}>()

const { t } = useI18n()
</script>
