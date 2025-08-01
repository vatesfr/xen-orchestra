<template>
  <VtsSelect :id accent="brand" />
</template>

<script lang="ts" setup>
import type { XoSr } from '@/types/xo/sr.type.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { useI18n } from 'vue-i18n'

const { srs } = defineProps<{
  srs: XoSr[]
}>()

const model = defineModel<XoSr['id']>()

const { t } = useI18n()

const { id } = useFormSelect(srs, {
  model,
  option: {
    label: sr => {
      const gbLeft = Math.floor((sr.size - sr.physical_usage) / 1024 ** 3)
      return `${sr.name_label} - ${t('n-gb-left', { n: gbLeft })}`
    },
    value: 'id',
  },
})
</script>
