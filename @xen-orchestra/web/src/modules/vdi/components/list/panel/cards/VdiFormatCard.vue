<template>
  <VtsCardRowKeyValue>
    <template #key>
      {{ t('format') }}
    </template>
    <template #value>{{ format }}</template>
    <template v-if="imageFormat" #addons>
      <VtsCopyButton :value="format" />
    </template>
  </VtsCardRowKeyValue>
</template>

<script setup lang="ts">
import { getVdiFormat } from '@/modules/vdi/utils/xo-vdi.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { imageFormat } = defineProps<{ imageFormat?: string }>()

const { t } = useI18n()

const format = computed(() => getVdiFormat(imageFormat))
</script>
