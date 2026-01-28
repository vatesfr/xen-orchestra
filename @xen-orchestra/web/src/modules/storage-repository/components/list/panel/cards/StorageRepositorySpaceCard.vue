<template>
  <VtsSpaceCard
    :used="sr.physical_usage"
    :total="sr.size"
    :label="sr.name_label"
    :total-size-label="t('total-space')"
  />
</template>

<script lang="ts" setup>
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsSpaceCard from '@core/components/space-card/VtsSpaceCard.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()
</script>
