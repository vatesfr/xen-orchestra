<template>
  <VtsModal accent="warning" icon="status:warning-picto">
    <template #title>
      <I18nT keypath="confirm-delete" scope="global" tag="div">
        <span class="n-delete">{{ modalTexts.n }}</span>
      </I18nT>
    </template>
    <template #content>
      {{ t('please-confirm-to-continue') }}
    </template>
    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ modalTexts.action }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { useMapper } from '@core/packages/mapper'
import type { ObjectType } from '@core/types/object.type.ts'
import { useI18n } from 'vue-i18n'

const { object, count } = defineProps<{
  count: number
  object: ObjectType
}>()

const { t } = useI18n()

const modalTexts = useMapper(
  () => object,
  {
    vm: {
      n: t('n-vms', { n: count }),
      action: t('action:delete-vms', { n: count }),
    },
  },
  'vm'
)
</script>

<style lang="postcss" scoped>
.n-delete {
  color: var(--color-warning-item-base);
}
</style>
