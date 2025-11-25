<template>
  <VtsSpaceCard :used="sr.physical_usage" :total="sr.size" :name="sr.name_label" :total-size-label="t('total-space')" />
</template>

<script lang="ts" setup>
import VtsSpaceCard from '@core/components/space-card/VtsSpaceCard.vue'
import type { XoSr } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{
  sr: XoSr
}>()

const { t } = useI18n()
</script>
