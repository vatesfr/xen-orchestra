<template>
  <UiDrawer
    class="traffic-rule-edit-drawer"
    :on-dismiss="() => emit('cancel')"
    @dismiss="emit('cancel')"
    @confirm="onConfirm()"
  >
    <template #title>{{ t('action:edit-traffic-rule') }}</template>

    <template #content>
      <UiTitle class="section-title">
        {{ t('general-information') }}
      </UiTitle>

      <span class="typo-body-regular-small required-hint">{{ t('field:required') }}</span>

      <EditTrafficRuleForm ref="form" class="form" :rule />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:save') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import EditTrafficRuleForm from '@/modules/traffic-rules/components/form/edit/EditTrafficRuleForm.vue'
import type { TrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { TrafficRule } from '@vates/types'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  rule: TrafficRule
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [payload: TrafficRulePayload | undefined]
}>()

const { t } = useI18n()

const form = useTemplateRef('form')

async function onConfirm() {
  emit('confirm', await form.value?.validate())
}
</script>

<style lang="postcss" scoped>
.traffic-rule-edit-drawer {
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
