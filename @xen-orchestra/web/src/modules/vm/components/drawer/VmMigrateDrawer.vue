<template>
  <UiDrawer class="vm-migrate-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:migrate-n-vms', 1) }}
    </template>

    <template #content>
      <div v-if="currentStep === 'general'" class="form">
        <UiTitle>{{ t('general-information') }}</UiTitle>
        <div class="fields">
          <VmMigrateFormSelect v-bind="poolSelectBindings" />
          <VmMigrateFormSelect v-bind="hostSelectBindings" />
          <VmMigrateFormSelect v-bind="migrationNetworkSelectBindings" />
        </div>
      </div>

      <div v-else class="form">
        <div class="section">
          <UiTitle>{{ t('storage-repositories') }}</UiTitle>
          <UiAlert v-if="hasNoDiskToMigrate" accent="warning">
            {{ t('vm-not-running-no-disk-nothing-to-migrate') }}
          </UiAlert>
          <UiAlert v-else-if="isNothingToMigrate" accent="warning">
            {{ t('vm-not-running-intra-pool-nothing-to-migrate') }}
          </UiAlert>
          <UiAlert v-else-if="areAllSrsShared && !isOnlyStorageMigratable" accent="info">
            {{ t('all-srs-shared-storage-migration-optional') }}
          </UiAlert>
          <VmMigrateMappingToolbar
            :id="destinationSrSelectId"
            :fill-disabled="missingSrRows.length === 0"
            :fill-disabled-tooltip="t('no-empty-sr-to-fill')"
            :fill-label="t('action:fill-empty-srs')"
            :label="t('destination-sr')"
            :reset-label="t('action:reset-all-srs')"
            @fill="fillEmptySrs()"
            @reset="resetSrs()"
          />
          <VmMigrateVdisTable
            :flagged-rows="missingSrRows"
            :rows="vdiRows"
            :show-errors="showMappingErrors"
            :srs="availableSrs"
            @select-sr="setTargetSrId"
          />
        </div>

        <div class="section">
          <UiTitle>{{ t('vifs') }}</UiTitle>
          <UiAlert v-if="areAllVifsFollowing" accent="info">
            {{ t('all-vifs-follow-vm') }}
          </UiAlert>
          <template v-else>
            <VmMigrateMappingToolbar
              :id="destinationNetworkSelectId"
              :fill-disabled="missingNetworkRows.length === 0"
              :fill-disabled-tooltip="t('no-empty-network-to-fill')"
              :fill-label="t('action:fill-empty-networks')"
              :label="t('destination-network')"
              :reset-label="t('action:reset-all-networks')"
              @fill="fillEmptyNetworks()"
              @reset="resetNetworks()"
            />
            <VmMigrateVifsTable
              :flagged-rows="missingNetworkRows"
              :networks="availableNetworks"
              :rows="vifRows"
              :show-errors="showMappingErrors"
              @select-network="setTargetNetworkId"
            />
          </template>
        </div>
      </div>
    </template>

    <template #buttons>
      <template v-if="currentStep === 'general'">
        <VtsOverlayCancelButton @click="emit('cancel')" />
        <VtsOverlayConfirmButton>{{ t('action:continue') }}</VtsOverlayConfirmButton>
      </template>
      <template v-else>
        <VtsOverlayButton type="button" variant="secondary" @click="goBack()">{{ t('action:back') }}</VtsOverlayButton>
        <VtsOverlayConfirmButton>{{ t('action:migrate') }}</VtsOverlayConfirmButton>
      </template>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import VmMigrateFormSelect from '@/modules/vm/components/form/migrate/VmMigrateFormSelect.vue'
import VmMigrateMappingToolbar from '@/modules/vm/components/form/migrate/VmMigrateMappingToolbar.vue'
import VmMigrateVdisTable from '@/modules/vm/components/form/migrate/VmMigrateVdisTable.vue'
import VmMigrateVifsTable from '@/modules/vm/components/form/migrate/VmMigrateVifsTable.vue'
import { useVmMigrateForm, type VmMigratePayload } from '@/modules/vm/form/migrate/use-vm-migrate-form.ts'
import { useVmMigrateMappingForm } from '@/modules/vm/form/migrate/use-vm-migrate-mapping-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsOverlayButton from '@core/components/overlay/VtsOverlayButton.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useFormSelect } from '@core/packages/form-select'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const emit = defineEmits<{
  confirm: [payload: VmMigratePayload]
  cancel: []
}>()

const { t } = useI18n()

const currentStep = ref<'general' | 'mapping'>('general')

const generalPayload = ref<VmMigratePayload | undefined>(undefined)

const showMappingErrors = ref(false)

const { formData, poolSelectBindings, hostSelectBindings, migrationNetworkSelectBindings, validateAndBuildPayload } =
  useVmMigrateForm(() => vm)

const {
  availableSrs,
  availableNetworks,
  vdiRows,
  vifRows,
  destinationSrId,
  destinationNetworkId,
  areAllSrsShared,
  areAllVifsFollowing,
  missingSrRows,
  missingNetworkRows,
  isOnlyStorageMigratable,
  isNothingToMigrate,
  hasNoDiskToMigrate,
  setTargetSrId,
  setTargetNetworkId,
  fillEmptySrs,
  resetSrs,
  fillEmptyNetworks,
  resetNetworks,
  buildPayload: buildMappingPayload,
} = useVmMigrateMappingForm(
  () => vm,
  () => formData.pool,
  () => formData.host
)

const { id: destinationSrSelectId } = useFormSelect(availableSrs, {
  model: destinationSrId,
  searchable: true,
  placeholder: () => t('action:select-storage'),
  option: {
    label: 'name_label',
    value: 'id',
  },
})

const { id: destinationNetworkSelectId } = useFormSelect(availableNetworks, {
  model: destinationNetworkId,
  searchable: true,
  placeholder: () => t('action:select-network'),
  option: {
    label: 'name_label',
    value: 'id',
  },
})

async function handleConfirm() {
  if (currentStep.value === 'general') {
    const payload = await validateAndBuildPayload()

    if (payload === undefined) {
      return
    }

    generalPayload.value = payload
    currentStep.value = 'mapping'
    return
  }

  const mappingPayload = buildMappingPayload()

  if (mappingPayload === undefined || generalPayload.value === undefined) {
    showMappingErrors.value = true
    return
  }

  emit('confirm', { ...generalPayload.value, ...mappingPayload })
}

function goBack() {
  showMappingErrors.value = false
  currentStep.value = 'general'
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

  .section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
