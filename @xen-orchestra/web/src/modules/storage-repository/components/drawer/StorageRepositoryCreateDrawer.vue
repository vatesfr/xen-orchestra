<template>
  <UiDrawer @dismiss="emit('cancel')" @confirm="handleConfirm()">
    <template #title>{{ t('action:create-sr') }}</template>

    <template #content>
      <div class="new-storage-repository-form">
        <UiTitle>{{ t('general-information') }}</UiTitle>
        <div class="row">
          <NewSrFormTextInput v-bind="nameInputBindings" />
          <NewSrFormTextarea v-bind="descriptionInputBindings" />
        </div>
        <div class="row">
          <!-- ACCESS MODE -->
          <NewSrAccessModeSelector v-bind="accessModeInputBindings" />

          <div class="pool-host-dropdowns">
            <!-- POOL -->
            <NewSrFormSelect v-bind="poolSelectBindings">
              <template #option="{ option }">
                <VtsOption :option>
                  <span class="option-content">
                    <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
                    {{ option.properties.label }}
                  </span>
                </VtsOption>
              </template>
            </NewSrFormSelect>

            <!-- HOST -->
            <NewSrFormSelect v-bind="hostSelectBindings">
              <template #option="{ option }">
                <VtsOption :option>
                  <span class="option-content">
                    <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
                    {{ option.properties.label }}
                  </span>
                </VtsOption>
              </template>
            </NewSrFormSelect>
          </div>
        </div>
        <div class="row">
          <!-- TYPE -->
          <NewSrTypeSelect v-bind="typeSelectBindings" />

          <!-- LVM or EXT -->
          <NewSrFormTextInput v-if="type === 'lvm' || type === 'ext'" v-bind="deviceInputBindings" />

          <!-- SMB or SMBISO -->
          <div v-else-if="type === 'smb' || type === 'smbiso'">
            <NewSrFormTextInput v-bind="serverInputBindings" />
            <UiCheckbox v-model="useAuth" accent="brand">{{ t('with-auth') }}</UiCheckbox>
          </div>

          <!-- LOCAL -->
          <NewSrFormTextInput v-else-if="type === 'local'" v-bind="pathInputBindings" />
        </div>

        <!-- SMB or SMBISO with auth -->
        <div v-if="(type === 'smb' || type === 'smbiso') && useAuth" class="row">
          <NewSrFormTextInput v-bind="usernameInputBindings" />
          <NewSrFormTextInput v-bind="passwordInputBindings" />
        </div>

        <!-- PREFERRED IMAGE FORMATS -->
        <div v-if="supportsPreferredImageFormats" class="row">
          <NewSrFormSelect v-bind="preferredImageFormatsSelectBindings" />
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:create') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import NewSrFormSelect from '@/modules/storage-repository/components/form/new/inputs/NewSrFormSelect.vue'
import NewSrFormTextarea from '@/modules/storage-repository/components/form/new/inputs/NewSrFormTextarea.vue'
import NewSrFormTextInput from '@/modules/storage-repository/components/form/new/inputs/NewSrFormTextInput.vue'
import NewSrAccessModeSelector from '@/modules/storage-repository/components/form/new/NewSrAccessModeSelector.vue'
import NewSrTypeSelect from '@/modules/storage-repository/components/form/new/NewSrTypeSelect.vue'
import { useNewSrForm } from '@/modules/storage-repository/form/new/use-new-sr-form.ts'
import type { NewSrRestPayload } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { useI18n } from 'vue-i18n'

const { poolId, hostId } = defineProps<{
  poolId: FrontXoPool['id']
  hostId?: FrontXoHost['id']
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [NewSrRestPayload]
}>()

const { t } = useI18n()

const {
  poolSelectBindings,
  hostSelectBindings,
  accessModeInputBindings,
  nameInputBindings,
  descriptionInputBindings,
  typeSelectBindings,
  type,
  deviceInputBindings,
  serverInputBindings,
  pathInputBindings,
  usernameInputBindings,
  passwordInputBindings,
  useAuth,
  supportsPreferredImageFormats,
  preferredImageFormatsSelectBindings,
  requiresEraseConfirm,
  validateAndBuildPayload,
} = useNewSrForm(
  () => poolId,
  () => hostId
)

const { open: openEraseConfirmModal } = useOverlay({
  component: () => import('@/modules/storage-repository/components/modal/SrCreateEraseConfirmModal.vue'),
  events: { onConfirm: true, onCancel: true },
})

async function handleConfirm() {
  const restPayload = await validateAndBuildPayload()

  if (!restPayload) {
    return
  }

  if (requiresEraseConfirm.value) {
    const response = await openEraseConfirmModal({ props: { device: restPayload.device_config.device ?? '' } })

    if (response.event !== 'onConfirm') {
      return
    }
  }

  emit('confirm', restPayload)
}
</script>

<style lang="postcss" scoped>
.new-storage-repository-form {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

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
      max-width: 88rem;

      & > * {
        width: calc(50% - 1.2rem);
      }
    }
  }

  .pool-host-dropdowns {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  .option-content {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
