<template>
  <div class="new-vm-review-step">
    <NewVmEnvironmentSummary />
    <NewVmSection :title="t('install-settings')">
      <VtsTabularKeyValueList>
        <NewVmReviewRow :label="t('new-vm:install-source')" :value="installSourceLabel" />
        <NewVmReviewRow v-if="vmState.installMode === 'cdrom'" :label="t('new-vm:iso-file')" :value="isoLabel" />
        <template v-else-if="vmState.installMode === 'ssh-key'">
          <VtsTabularKeyValueRow
            v-for="(key, index) of vmState.sshKeys"
            :key
            :label="index === 0 ? t('ssh-keys') : ''"
            :value="key"
          />
        </template>
      </VtsTabularKeyValueList>
      <template v-if="vmState.installMode === 'cloud-init-config'">
        <UiLogEntryViewer
          v-if="vmState.cloudConfig !== ''"
          :label="t('user-config')"
          :content="vmState.cloudConfig"
          size="small"
          accent="info"
        />
        <UiLogEntryViewer
          v-if="vmState.networkConfig !== ''"
          :label="t('network-config')"
          :content="vmState.networkConfig"
          size="small"
          accent="info"
        />
      </template>
    </NewVmSection>
    <NewVmSection :title="t('general-information')">
      <VtsColumns>
        <VtsColumn>
          <VtsTabularKeyValueList>
            <NewVmReviewRow :label="t('new-vm:name')" :value="vmState.name" />
            <NewVmReviewRow
              :label="t('boot-firmware')"
              :value="bootFirmwareLabel"
              :overridden="overridden.bootFirmware"
            />
            <NewVmReviewRow
              v-if="canCopyBiosStrings"
              :label="t('copy-host-bios-strings')"
              :overridden="overridden.copyHostBiosStrings"
            >
              <VtsStatus :status="vmState.copyHostBiosStrings" />
            </NewVmReviewRow>
            <template v-else>
              <NewVmReviewRow :label="t('vtpm')" :overridden="overridden.createVtpm">
                <VtsStatus :status="vmState.createVtpm === true" />
              </NewVmReviewRow>
              <NewVmReviewRow :label="t('secure-boot')" :overridden="overridden.secureBoot">
                <VtsStatus :status="vmState.secureBoot" />
              </NewVmReviewRow>
            </template>
          </VtsTabularKeyValueList>
        </VtsColumn>
        <VtsColumn>
          <VtsTabularKeyValueList>
            <NewVmReviewRow :label="t('new-vm:description')" :value="vmState.description" />
            <NewVmReviewRow :label="t('affinity-host')">
              <template v-if="affinityHost" #default>
                <UiLink size="medium" icon="object:host" :to="affinityHostRoute">
                  {{ affinityHost.name_label }}
                </UiLink>
              </template>
            </NewVmReviewRow>
            <NewVmReviewRow
              :label="t('high-availability')"
              :value="highAvailabilityLabel"
              :overridden="overridden.highAvailability"
            />
          </VtsTabularKeyValueList>
        </VtsColumn>
      </VtsColumns>
    </NewVmSection>
    <NewVmSection :title="t('resource-management')">
      <VtsColumns>
        <VtsColumn>
          <VtsTabularKeyValueList>
            <NewVmReviewRow :label="t('vcpus')" :value="vmState.vCPU" :overridden="overridden.vCPU" />
          </VtsTabularKeyValueList>
        </VtsColumn>
        <VtsColumn>
          <VtsTabularKeyValueList>
            <NewVmReviewRow :label="t('ram')" :value="ramLabel" :overridden="overridden.ram" />
          </VtsTabularKeyValueList>
        </VtsColumn>
      </VtsColumns>
    </NewVmSection>
    <NewVmSection :title="t('vifs')">
      <NewVmReviewVifsTable :vifs :deleted-count="deletedVifsCount" />
    </NewVmSection>
    <NewVmSection :title="t('vdis')">
      <NewVmReviewVdisTable :vdis :deleted-count="deletedVdisCount" />
    </NewVmSection>
    <NewVmSection :title="t('settings')">
      <VtsColumns>
        <VtsColumn>
          <VtsTabularKeyValueList>
            <NewVmReviewRow :label="t('action:boot-vm')" :overridden="overridden.bootVm">
              <VtsStatus :status="vmState.boot_vm" />
            </NewVmReviewRow>
            <NewVmReviewRow v-if="isDiskTemplate" :label="t('fast-clone')" :overridden="overridden.clone">
              <VtsStatus :status="vmState.clone" />
            </NewVmReviewRow>
          </VtsTabularKeyValueList>
        </VtsColumn>
        <VtsColumn>
          <VtsTabularKeyValueList>
            <NewVmReviewRow :label="t('auto-power')" :overridden="overridden.autoPoweron">
              <VtsStatus :status="vmState.autoPoweron" />
            </NewVmReviewRow>
          </VtsTabularKeyValueList>
        </VtsColumn>
      </VtsColumns>
    </NewVmSection>
  </div>
</template>

<script lang="ts" setup>
import NewVmEnvironmentSummary from '@/modules/vm/components/new/NewVmEnvironmentSummary.vue'
import NewVmSection from '@/modules/vm/components/new/NewVmSection.vue'
import NewVmReviewRow from '@/modules/vm/components/new/review/NewVmReviewRow.vue'
import NewVmReviewVdisTable from '@/modules/vm/components/new/review/NewVmReviewVdisTable.vue'
import NewVmReviewVifsTable from '@/modules/vm/components/new/review/NewVmReviewVifsTable.vue'
import { useNewVmReview } from '@/modules/vm/composables/use-new-vm-review.composable.ts'
import { useNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { vmState, isDiskTemplate, canCopyBiosStrings } = useNewVmForm()

const {
  installSourceLabel,
  isoLabel,
  affinityHost,
  affinityHostRoute,
  bootFirmwareLabel,
  highAvailabilityLabel,
  ramLabel,
  overridden,
  vifs,
  deletedVifsCount,
  vdis,
  deletedVdisCount,
} = useNewVmReview()
</script>

<style lang="postcss" scoped>
.new-vm-review-step {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}
</style>
