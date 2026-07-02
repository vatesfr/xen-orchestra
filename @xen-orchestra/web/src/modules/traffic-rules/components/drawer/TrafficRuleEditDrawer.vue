<template>
  <VtsDrawer class="container" dismissible @dismiss="emit('cancel')">
    <template #title>{{ t('action:edit-traffic-rule') }}</template>

    <template #content>
      <UiTitle class="section-title">
        {{ t('general-information') }}
      </UiTitle>

      <span class="typo-form-info required-hint">{{ t('field-required') }}</span>

      <EditTrafficRuleForm ref="form" :rule @confirm="emit('confirm', $event)" />
    </template>

    <template #buttons>
      <VtsDrawerCancelButton />
      <VtsDrawerConfirmButton :on-click="() => form?.submit()">
        {{ t('action:save') }}
      </VtsDrawerConfirmButton>
    </template>
  </VtsDrawer>
</template>

<script setup lang="ts">
import EditTrafficRuleForm from '@/modules/traffic-rules/components/form/edit/EditTrafficRuleForm.vue'
import type { NewTrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import VtsDrawer from '@core/components/drawer/VtsDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { TrafficRule } from '@vates/types'
import VtsDrawerCancelButton from '@xen-orchestra/web-core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@xen-orchestra/web-core/components/drawer/VtsDrawerConfirmButton.vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  rule: TrafficRule
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [payload: NewTrafficRulePayload]
}>()

const { t } = useI18n()

const form = useTemplateRef('form')
</script>

<style lang="postcss" scoped>
.container {
  .section-title {
    margin-block-end: 2.4rem;
  }

  .required-hint::before {
    content: '* ';
    color: var(--color-brand-txt-base);
  }
}
</style>
