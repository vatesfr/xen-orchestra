<template>
  <UiDrawer class="new-private-network-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('action:create-private-network') }}</template>

    <template #content>
      <UiTitle>{{ t('general-information') }}</UiTitle>
      <span class="required-hint typo-body-regular-small">{{ t('field:required') }}</span>
      <div class="row">
        <div class="column">
          <NetworkFormTextInput v-bind="nameInputBindings" />
          <VtsNumberInput v-bind="mtuInputBindings" />
          <NetworkFormSelect v-bind="encapsulationSelectBindings" />
        </div>
        <NewNetworkDescriptionTextarea v-bind="descriptionInputBindings" />
      </div>

      <UiTitle class="section-title">{{ t('interfaces') }}</UiTitle>
      <PrivateNetworkInterfacesTable
        :can-add="canAddInterface"
        :errors="interfaceErrors"
        :get-excluded-pool-ids
        :interfaces
        :show-errors="showInterfaceErrors"
        @add="addInterface()"
        @remove="index => removeInterface(index)"
      />

      <UiTitle class="section-title">{{ t('options') }}</UiTitle>
      <NetworkFormSelect class="preferred-center" v-bind="preferredCenterSelectBindings" />
      <div class="encryption">
        <FormCheckbox v-bind="encryptedCheckboxBindings" />
        <UiInfo accent="info" wrap>{{ t('new-network:encryption-limit-info') }}</UiInfo>
        <UiInfo accent="info" wrap>{{ t('new-network:encryption-ipsec-info') }}</UiInfo>
        <UiInfo v-if="encryptionUnavailableMessage" accent="info" wrap>
          {{ encryptionUnavailableMessage }}
        </UiInfo>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:create') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import NetworkFormSelect from '@/modules/network/components/form/new/inputs/NetworkFormSelect.vue'
import NetworkFormTextInput from '@/modules/network/components/form/new/inputs/NetworkFormTextInput.vue'
import NewNetworkDescriptionTextarea from '@/modules/network/components/form/new/inputs/NewNetworkDescriptionTextarea.vue'
import PrivateNetworkInterfacesTable from '@/modules/network/components/form/new/PrivateNetworkInterfacesTable.vue'
import { useNewPrivateNetworkForm } from '@/modules/network/form/new-private/use-new-private-network-form.ts'
import type { NewPrivateNetworkPayload } from '@/modules/network/jobs/xo-private-network-create.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import VtsNumberInput from '@core/components/number-input/VtsNumberInput.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { poolId } = defineProps<{
  poolId: FrontXoPool['id']
}>()

const emit = defineEmits<{
  confirm: [payload: NewPrivateNetworkPayload]
  cancel: []
}>()

const { t } = useI18n()

const {
  interfaces,
  canAddInterface,
  addInterface,
  removeInterface,
  getExcludedPoolIds,
  showInterfaceErrors,
  interfaceErrors,
  encryptionUnavailableMessage,
  nameInputBindings,
  mtuInputBindings,
  descriptionInputBindings,
  encapsulationSelectBindings,
  preferredCenterSelectBindings,
  encryptedCheckboxBindings,
  validateAndBuildPayload,
} = useNewPrivateNetworkForm(() => poolId)

async function handleConfirm() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.new-private-network-drawer {
  .required-hint {
    display: block;
    margin-block: 2.4rem;

    &::before {
      content: '* ';
      color: var(--color-brand-txt-base);
    }
  }

  .section-title {
    margin-block: 4rem 2.4rem;
  }

  .row {
    display: flex;
    align-items: start;
    flex-direction: column;
    gap: 2.4rem;

    & > * {
      width: 100%;
      min-width: 0;
    }

    @media (--medium-or-large) {
      flex-direction: row;
    }

    .column {
      display: flex;
      flex-direction: column;
      gap: 2.4rem;
    }
  }

  .preferred-center {
    @media (--medium-or-large) {
      max-width: calc((100% - 2.4rem) / 2);
    }
  }

  .encryption {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-block-start: 2.4rem;
  }
}
</style>
