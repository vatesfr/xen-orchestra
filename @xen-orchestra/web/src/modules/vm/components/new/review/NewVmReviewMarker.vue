<template>
  <UiOverridden v-if="marker !== undefined">{{ label }}</UiOverridden>
</template>

<script lang="ts" setup>
import type { NewVmReviewMarker } from '@/modules/vm/composables/use-new-vm-review.composable.ts'
import UiOverridden from '@core/components/ui/overridden/UiOverridden.vue'
import { useMapper } from '@core/packages/mapper'
import { useI18n } from 'vue-i18n'

const { marker } = defineProps<{
  marker: NewVmReviewMarker
}>()

const { t } = useI18n()

const label = useMapper<NonNullable<NewVmReviewMarker>, string>(
  () => marker,
  {
    added: t('added'),
    overridden: t('overridden'),
  },
  'overridden'
)
</script>
