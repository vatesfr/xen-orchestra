<template>
  <NewVmSection :title="t('install-settings')" class="new-vm-install-settings-section">
    <UiRadioButtonGroup
      :label="t('new-vm:install-source')"
      accent="brand"
      :vertical="uiStore.isSmall"
      :gap="uiStore.isSmall ? 'narrow' : 'wide'"
    >
      <UiRadioButton
        v-for="option of installModeOptions"
        :key="option.value"
        v-model="vmState.installMode"
        accent="brand"
        :value="option.value"
      >
        {{ option.label }}
      </UiRadioButton>
    </UiRadioButtonGroup>
    <div v-if="vmState.installMode === 'cdrom'" :id="fieldIds.iso" class="iso" :class="{ mobile: uiStore.isSmall }">
      <VtsSelect :id="isoSelectId" :accent="errors.iso === undefined ? 'brand' : 'danger'" />
      <UiInfo v-if="errors.iso !== undefined" accent="danger">{{ errors.iso }}</UiInfo>
    </div>
    <div v-if="vmState.installMode === 'cloud-init-config'" class="custom-config" :class="{ mobile: uiStore.isSmall }">
      <UiTextarea v-model="vmState.cloudConfig" accent="brand" :placeholder="DEFAULT_CLOUD_CONFIG_PLACEHOLDER">
        {{ t('user-config') }}
        <template #info>
          {{ t('new-vm:user-config-variables') }}
          <ul class="variables">
            <li>{{ t('new-vm:user-config-variables-name') }}</li>
            <li>{{ t('new-vm:user-config-variables-index') }}</li>
          </ul>
          {{ t('new-vm:user-config-variables-escape') }}
        </template>
      </UiTextarea>
      <UiTextarea v-model="vmState.networkConfig" accent="brand" :placeholder="DEFAULT_NETWORK_CONFIG_PLACEHOLDER">
        {{ t('network-config') }}
        <template #info>
          <I18nT keypath="new-vm:network-config" scope="global">
            <template #noCloudLink>
              <UiLink href="https://cloudinit.readthedocs.io/en/latest/reference/datasources/nocloud.html" size="small">
                {{ t('new-vm:network-config-nocloud-datasource') }}
              </UiLink>
            </template>
          </I18nT>
          <br />
          <I18nT keypath="new-vm:network-config-more" scope="global">
            <template #documentationLink>
              <UiLink
                href="https://cloudinit.readthedocs.io/en/latest/reference/network-config-format-v1.html#networking-config-version-1"
                size="small"
              >
                {{ t('new-vm:network-config-documentation') }}
              </UiLink>
            </template>
          </I18nT>
        </template>
      </UiTextarea>
    </div>
    <div v-if="vmState.installMode === 'ssh-key'" class="ssh-key">
      <div class="public-key">
        <UiTextarea v-model="vmState.ssh_key" required :accent="isSshKeyError ? 'danger' : 'brand'">
          {{ t('public-key') }}
          <template v-if="isSshKeyError" #message>
            {{ sshKeyErrorMessage }}
          </template>
        </UiTextarea>
      </div>
      <UiButton accent="brand" size="medium" variant="secondary" @click="addSshKey()">
        {{ t('action:add') }}
      </UiButton>
      <div v-if="vmState.sshKeys.length > 0" class="chips">
        <div v-for="(key, index) in vmState.sshKeys" :key="index" class="chip-wrapper">
          <UiChip v-tooltip="key" accent="info" @remove="removeSshKey(index)">
            {{ key }}
          </UiChip>
        </div>
      </div>
    </div>
  </NewVmSection>
</template>

<script lang="ts" setup>
import NewVmSection from '@/modules/vm/components/new/NewVmSection.vue'
import { useNewVmInstallModes } from '@/modules/vm/composables/use-new-vm-install-modes.composable.ts'
import { useNewVmSshKeys } from '@/modules/vm/composables/use-new-vm-ssh-keys.composable.ts'
import { useNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useUiStore } from '@core/stores/ui.store.ts'
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const DEFAULT_CLOUD_CONFIG_PLACEHOLDER = `#cloud-config
#hostname: {name}{index}
#ssh_authorized_keys:
#  - ssh-rsa <myKey>
#packages:
#  - htop
`

const DEFAULT_NETWORK_CONFIG_PLACEHOLDER = `#network:
#  version: 1
#  config:
#  - type: physical
#    name: eth0
#    subnets:
#      - type: dhcp`

const { t } = useI18n()

const uiStore = useUiStore()

const { vmState, isDiskTemplate, isoVdis, getIsoLabel, errors, fieldIds } = useNewVmForm()

const { installModeOptions } = useNewVmInstallModes(isDiskTemplate)

const { isSshKeyError, sshKeyErrorMessage, addSshKey, removeSshKey } = useNewVmSshKeys(vmState)

const { id: isoSelectId } = useFormSelect(isoVdis, {
  model: toRef(vmState, 'selectedVdi'),
  searchable: true,
  option: {
    value: 'id',
    label: vdi => getIsoLabel(vdi),
  },
})
</script>

<style lang="postcss" scoped>
.new-vm-install-settings-section {
  .iso {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 40%;

    &.mobile {
      width: 100%;
    }
  }

  .custom-config {
    display: flex;
    gap: 4.2rem;

    & > * {
      flex: 1;
      min-width: 0;
    }

    &.mobile {
      flex-direction: column;
      gap: 2.4rem;
    }
  }

  .variables {
    margin: 0.8rem 0;
    list-style-type: disc;
    list-style-position: inside;
  }

  .ssh-key {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.6rem;

    .public-key {
      width: 100%;
    }
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    width: 100%;

    .chip-wrapper {
      min-width: 0;
      max-width: 40rem;
      display: flex;

      .ui-chip {
        min-width: 0;
      }
    }
  }
}
</style>
