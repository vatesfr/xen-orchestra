<template>
  <div class="new-vm-configuration-step">
    <NewVmEnvironmentSummary />
    <NewVmInstallSettingsSection />
    <NewVmGeneralInformationSection />
    <NewVmResourceManagementSection />
    <NewVmSection :title="t('vifs')">
      <NewVmNetworkTable :networks="poolNetworks" :vm-state @add="addVif()" @remove="key => removeVif(key)" />
    </NewVmSection>
    <NewVmSection :title="t('vdis')">
      <NewVmSrTable
        :srs="poolSrs"
        :vm-state
        :can-resize-existing-disks
        :default-existing-vdis
        :invalid-fields="invalidVdiFields"
        :error-field-id="fieldIds.vdis"
        @add="addVdi()"
        @remove="key => removeVdi(key)"
      />
      <UiInfo v-for="error in vdiSizeErrors" :key="error.key" accent="danger" wrap>
        {{ error.message }}
      </UiInfo>
      <UiInfo v-if="errors.vdis !== undefined" accent="danger" wrap>{{ errors.vdis }}</UiInfo>
    </NewVmSection>
    <NewVmSettingsSection />
  </div>
</template>

<script lang="ts" setup>
import NewVmEnvironmentSummary from '@/modules/vm/components/new/NewVmEnvironmentSummary.vue'
import NewVmGeneralInformationSection from '@/modules/vm/components/new/NewVmGeneralInformationSection.vue'
import NewVmInstallSettingsSection from '@/modules/vm/components/new/NewVmInstallSettingsSection.vue'
import NewVmNetworkTable from '@/modules/vm/components/new/NewVmNetworkTable.vue'
import NewVmResourceManagementSection from '@/modules/vm/components/new/NewVmResourceManagementSection.vue'
import NewVmSection from '@/modules/vm/components/new/NewVmSection.vue'
import NewVmSettingsSection from '@/modules/vm/components/new/NewVmSettingsSection.vue'
import NewVmSrTable from '@/modules/vm/components/new/NewVmSrTable.vue'
import { useNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const {
  vmState,
  poolNetworks,
  poolSrs,
  canResizeExistingDisks,
  defaultExistingVdis,
  vdiSizeErrors,
  errors,
  invalidVdiFields,
  fieldIds,
  addVif,
  removeVif,
  addVdi,
  removeVdi,
} = useNewVmForm()
</script>

<style lang="postcss" scoped>
.new-vm-configuration-step {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}
</style>
