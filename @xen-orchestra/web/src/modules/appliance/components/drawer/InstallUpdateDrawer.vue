<template>
  <UiDrawer class="install-update-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ title }}</template>

    <template #content>
      <UiAlert accent="info">
        <span class="typo-body-bold">{{ t('appliance:install-restart-title') }}</span>
        <template #description>{{ t('appliance:restart-interrupts-warning') }}</template>
      </UiAlert>

      <UiCard class="summary">
        <UiCardTitle>{{ t('summary') }}</UiCardTitle>
        <VtsTabularKeyValueList>
          <VtsTabularKeyValueRow :label="t('appliance:installed-version')" :value="currentVersion" />
          <VtsTabularKeyValueRow :label="t('appliance:new-version')" :value="nextVersion" />
          <VtsTabularKeyValueRow :label="t('appliance:release-channel')" :value="channel" />
        </VtsTabularKeyValueList>
        <UiLink v-if="nextVersion !== undefined" :href="XO_LINKS.CHANGELOG" size="small">
          {{ t('appliance:whats-new-in', { version: nextVersion }) }}
        </UiLink>
      </UiCard>

      <InstallUpdateForm ref="form" class="form" />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:install-update') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import InstallUpdateForm from '@/modules/appliance/components/form/install-update/InstallUpdateForm.vue'
import type { InstallUpdatePayload } from '@/modules/appliance/form/install-update/use-install-update-form.ts'
import { XO_LINKS } from '@/shared/constants.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { nextVersion } = defineProps<{
  channel: string
  currentVersion?: string
  nextVersion?: string
}>()

const emit = defineEmits<{
  confirm: [payload: InstallUpdatePayload]
  cancel: []
}>()

const { t } = useI18n()

const form = useTemplateRef('form')

const title = computed(() => {
  if (nextVersion === undefined) {
    return t('action:install-update')
  }

  return t('appliance:install-version', { version: nextVersion })
})

function handleConfirm() {
  const payload = form.value?.validate()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.install-update-drawer {
  .summary {
    margin-block-start: 2.4rem;
  }

  .form {
    margin-block-start: 2.4rem;
  }
}
</style>
