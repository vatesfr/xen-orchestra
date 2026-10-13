<template>
  <UiDrawer class="vm-migrate-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:migrate-n-vms', 1) }}
    </template>

    <template #content>
      <div class="form">
        <UiTitle>{{ t('general-information') }}</UiTitle>
        <div class="fields">
          <VmMigrateFormSelect v-bind="poolSelectBindings" />
          <VmMigrateFormSelect v-bind="hostSelectBindings" />
          <VmMigrateFormSelect v-bind="migrationNetworkSelectBindings" />
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:continue') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import VmMigrateFormSelect from '@/modules/vm/components/form/migrate/VmMigrateFormSelect.vue'
import { useVmMigrateForm, type VmMigratePayload } from '@/modules/vm/form/migrate/use-vm-migrate-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const emit = defineEmits<{
  confirm: [payload: VmMigratePayload]
  cancel: []
}>()

const { t } = useI18n()

const { poolSelectBindings, hostSelectBindings, migrationNetworkSelectBindings, validateAndBuildPayload } =
  useVmMigrateForm(() => vm)

async function handleConfirm() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.vm-migrate-drawer {
  .form {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    width: 100%;
    text-align: left;
  }

  .fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.6rem 2.4rem;
  }
}
</style>
