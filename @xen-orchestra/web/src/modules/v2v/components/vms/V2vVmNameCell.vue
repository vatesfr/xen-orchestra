<template>
  <UiTableCell>
    <div class="v2v-vm-name-cell">
      <span>{{ name }}</span>
      <UiTag v-if="isInList" accent="info" variant="secondary">{{ t('in-list') }}</UiTag>
    </div>
  </UiTableCell>
</template>

<script lang="ts" setup>
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  name: string
  isInList: boolean
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-vm-name-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
