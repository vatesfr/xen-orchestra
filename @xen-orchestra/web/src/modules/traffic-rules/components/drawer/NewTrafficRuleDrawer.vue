<template>
  <UiDrawer class="new-traffic-rule-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('new-traffic-rule:add') }}</template>

    <template #content>
      <UiTitle class="section-title">
        {{ t('general-information') }}
      </UiTitle>

      <VtsRequiredHint />

      <NewTrafficRuleForm ref="form" class="form" :pool-id :vif-id />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:create-traffic-rule') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import NewTrafficRuleForm from '@/modules/traffic-rules/components/form/new/NewTrafficRuleForm.vue'
import type { TrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  poolId: FrontXoPool['id']
  vifId?: FrontXoVif['id']
}>()

const emit = defineEmits<{
  confirm: [payload: TrafficRulePayload]
  cancel: []
}>()

const { t } = useI18n()

const form = useTemplateRef('form')

async function handleConfirm() {
  const payload = await form.value?.validate()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.new-traffic-rule-drawer {
  .section-title {
    margin-block-end: 2.4rem;
  }

  .form {
    margin-block-start: 2.4rem;
  }
}
</style>
