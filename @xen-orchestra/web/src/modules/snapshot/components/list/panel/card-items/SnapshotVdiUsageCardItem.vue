<template>
  <VtsCardRowKeyValue>
    <template #key>
      {{ t('used-space-on-sr') }}
    </template>
    <template #value>{{ formattedSize }}</template>
    <template #addons>
      <VtsCopyButton :value="formattedSize" />
    </template>
  </VtsCardRowKeyValue>
</template>

<script setup lang="ts">
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { usage } = defineProps<{ usage: number }>()

const { t } = useI18n()

const formattedSize = computed(() => formatSize(usage, 2))
</script>
