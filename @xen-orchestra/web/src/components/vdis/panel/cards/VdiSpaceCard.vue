<template>
  <VtsSpaceCard :used="vdi.usage" :total="vdi.size" :name="vdi.name_label" :total-size-label="t('size')" />
</template>

<script setup lang="ts">
import VtsSpaceCard from '@core/components/space-card/VtsSpaceCard.vue'
import type { XoVdi } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{
  vdi: XoVdi
}>()

const { t } = useI18n()
</script>
