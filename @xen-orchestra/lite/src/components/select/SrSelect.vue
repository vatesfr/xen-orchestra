<template>
  <VtsSelect :id accent="brand" />
</template>

<script setup lang="ts">
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { disabled } = defineProps<{
  disabled?: boolean
}>()

const model = defineModel<XenApiSr['$ref']>()

const { t } = useI18n()
const { records: srs } = useSrStore().subscribe()
const filteredSrs = computed(() => srs.value.filter(sr => sr.content_type !== 'iso' && sr.physical_size > 0))

const bytesToGiB = (bytes: number) => Math.floor(bytes / 1024 ** 3)

const getGbLeft = (sr: XenApiSr) => t('n-gb-left', { n: bytesToGiB(sr.physical_size - sr.physical_utilisation) })

const { id } = useFormSelect(filteredSrs, {
  model,
  disabled: () => disabled,
  option: {
    id: '$ref',
    label: sr => `${sr.name_label} - ${getGbLeft(sr)}`,
    value: '$ref',
  },
})
</script>
