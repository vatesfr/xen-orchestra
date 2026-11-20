<template>
  <UiDrawer @dismiss="emit('cancel')" @confirm="handleConfirm()">
    <template #title>{{ t('action:create-sr') }}</template>

    <template #content>
      <div class="new-storage-repository-form">
        <UiTitle>{{ t('general-information') }}</UiTitle>
        <div class="row">
          <FormTextInput v-bind="nameInputBindings" />
          <FormTextarea v-bind="descriptionInputBindings" />
        </div>
        <div class="row">
          <!-- ACCESS MODE -->
          <NewSrAccessModeSelector v-bind="accessModeInputBindings" />

          <div class="pool-host-dropdowns">
            <!-- POOL -->
            <FormSelect v-bind="poolSelectBindings">
              <template #option="{ option }">
                <VtsOption :option>
                  <span class="option-content">
                    <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
                    {{ option.properties.label }}
                  </span>
                </VtsOption>
              </template>
            </FormSelect>

            <!-- HOST -->
            <FormSelect v-bind="hostSelectBindings">
              <template #option="{ option }">
                <VtsOption :option>
                  <span class="option-content">
                    <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
                    {{ option.properties.label }}
                  </span>
                </VtsOption>
              </template>
            </FormSelect>
          </div>
        </div>
        <div class="row">
          <!-- TYPE -->
          <NewSrTypeSelect v-bind="typeSelectBindings" />

          <!-- LVM or EXT -->
          <FormTextInput v-if="type === 'lvm' || type === 'ext'" v-bind="deviceInputBindings" />

          <!-- SMB or SMBISO -->
          <div v-else-if="type === 'smb' || type === 'smbiso'">
            <FormTextInput v-bind="serverInputBindings" />
            <UiCheckbox v-model="useAuth" accent="brand">{{ t('with-auth') }}</UiCheckbox>
          </div>

          <!-- LOCAL -->
          <FormTextInput v-else-if="type === 'local'" v-bind="pathInputBindings" />
        </div>

        <!-- SMB or SMBISO with auth -->
        <div v-if="(type === 'smb' || type === 'smbiso') && useAuth" class="row">
          <FormTextInput v-bind="usernameInputBindings" />
          <FormPasswordInput v-bind="passwordInputBindings" />
        </div>

        <!-- PREFERRED IMAGE FORMATS -->
        <div v-if="supportsPreferredImageFormats" class="row">
          <FormSelect v-bind="preferredImageFormatsSelectBindings" />
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
import NewSrAccessModeSelector from '@/modules/storage-repository/components/form/new/NewSrAccessModeSelector.vue'
import NewSrTypeSelect from '@/modules/storage-repository/components/form/new/NewSrTypeSelect.vue'
import { useNewSrForm } from '@/modules/storage-repository/form/new/use-new-sr-form.ts'
import type { NewSrRestPayload } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import FormPasswordInput from '@/shared/components/form/FormPasswordInput.vue'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import FormTextarea from '@/shared/components/form/FormTextarea.vue'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
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
  submit,
} = useNewSrForm(
  () => poolId,
  () => hostId
)

async function handleConfirm() {
  const restPayload = await submit()

  if (restPayload !== undefined) {
    emit('confirm', restPayload)
  }
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
