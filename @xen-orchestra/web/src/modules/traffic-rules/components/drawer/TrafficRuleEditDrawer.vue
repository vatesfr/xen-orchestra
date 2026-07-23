<template>
  <VtsDrawer class="container" dismissible @dismiss="emit('cancel')">
    <template #title>{{ t('action:edit-traffic-rule') }}</template>

    <template #content>
      <UiTitle class="section-title">
        {{ t('general-information') }}
      </UiTitle>

      <span class="typo-body-regular-small required-hint">{{ t('field:required') }}</span>

      <EditTrafficRuleForm ref="form" class="form" :rule @confirm="emit('confirm', $event)" />
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
import type { TrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import VtsDrawer from '@core/components/drawer/VtsDrawer.vue'
import VtsDrawerCancelButton from '@core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@core/components/drawer/VtsDrawerConfirmButton.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { TrafficRule } from '@vates/types'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  rule: TrafficRule
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [payload: TrafficRulePayload]
}>()

const { t } = useI18n()

const form = useTemplateRef('form')
</script>

<style lang="postcss" scoped>
.container {
  .section-title {
    margin-block-end: 2.4rem;
  }

  .form {
    margin-block-start: 2.4rem;
  }

  .required-hint::before {
    content: '* ';
    color: var(--color-brand-txt-base);
  }
}
</style>
