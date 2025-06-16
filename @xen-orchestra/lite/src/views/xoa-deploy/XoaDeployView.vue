<template>
  <TitleBar :icon="faDownload">{{ t('deploy-xoa') }}</TitleBar>
  <div v-if="deploying" class="status">
    <img src="@/assets/xo.svg" width="300" alt="Xen Orchestra" />

    <!-- Error -->
    <template v-if="error !== undefined">
      <div>
        <h2>{{ t('xoa-deploy-failed') }}</h2>
        <UiIcon :icon="faExclamationCircle" class="danger" />
      </div>
      <div class="error">
        <strong>{{ t('check-errors') }}</strong>
        <UiRaw>{{ error }}</UiRaw>
      </div>
      <UiButton size="medium" accent="brand" variant="primary" :left-icon="faDownload" @click="resetValues()">
        {{ t('xoa-deploy-retry') }}
      </UiButton>
    </template>

    <!-- Success -->
    <template v-else-if="url !== undefined">
      <div>
        <h2>{{ t('xoa-deploy-successful') }}</h2>
        <UiIcon :icon="faCircleCheck" class="success" />
      </div>
      <UiButton size="medium" accent="brand" variant="primary" :left-icon="faArrowUpRightFromSquare" @click="openXoa">
        {{ t('access-xoa') }}
      </UiButton>
    </template>

    <!-- Deploying -->
    <template v-else>
      <div>
        <h2>{{ t('xoa-deploy') }}</h2>
        <!-- TODO: add progress bar -->
        <p>{{ status }}</p>
      </div>
      <p class="warning">
        <UiIcon :icon="faExclamationCircle" />
        {{ t('keep-page-open') }}
      </p>
      <UiButton size="medium" :disabled="vmRef === undefined" accent="danger" variant="secondary" @click="cancel()">
        {{ t('cancel') }}
      </UiButton>
    </template>
  </div>

  <div v-else-if="uiStore.isMobile" class="not-available">
    <p>{{ t('deploy-xoa-available-on-desktop') }}</p>
  </div>

  <div v-else class="card-view">
    <UiCard>
      <form @submit.prevent="deploy">
        <FormSection :label="t('configuration')">
          <div class="row">
            <FormInputWrapper :label="t('storage')" :help="t('n-gb-required', { n: REQUIRED_GB })">
              <FormSelect v-model="selectedSr" required>
                <option disabled :value="undefined">
                  {{ t('select.storage') }}
                </option>
                <option
                  v-for="sr in filteredSrs"
                  :key="sr.uuid"
                  :value="sr"
                  :class="sr.physical_size - sr.physical_utilisation < REQUIRED_GB * 1024 ** 3 ? 'warning' : 'success'"
                >
                  {{ `${sr.name_label} -` }}
                  {{
                    t('n-gb-left', {
                      n: Math.round((sr.physical_size - sr.physical_utilisation) / 1024 ** 3),
                    })
                  }}
                  <template v-if="sr.physical_size - sr.physical_utilisation < REQUIRED_GB * 1024 ** 3">⚠️</template>
                </option>
              </FormSelect>
            </FormInputWrapper>
          </div>
          <div class="row">
            <FormInputWrapper :label="t('network')" required>
              <FormSelect v-model="selectedNetwork" required>
                <option disabled :value="undefined">
                  {{ t('select.network') }}
                </option>
                <option v-for="network in filteredNetworks" :key="network.uuid" :value="network">
                  {{ network.name_label }}
                </option>
              </FormSelect>
            </FormInputWrapper>
            <FormInputWrapper
              :label="t('deploy-xoa-custom-ntp-servers')"
              learn-more-url="https://docs.xen-orchestra.com/xoa#setting-a-custom-ntp-server"
            >
              <FormInput v-model="ntp" placeholder="xxx.xxx.xxx.xxx" />
            </FormInputWrapper>
          </div>
          <div class="row">
            <FormInputWrapper>
              <div class="radio-group">
                <label>
                  <FormRadio v-model="ipStrategy" value="static" />
                  {{ t('static-ip') }}</label
                >
                <label>
                  <FormRadio v-model="ipStrategy" value="dhcp" />
                  {{ t('dhcp') }}</label
                >
              </div>
            </FormInputWrapper>
          </div>
          <div class="row">
            <FormInputWrapper
              :label="t('xoa-ip')"
              learn-more-url="https://docs.xen-orchestra.com/xoa#network-configuration"
            >
              <FormInput v-model="ip" :disabled="!requireIpConf" placeholder="xxx.xxx.xxx.xxx" />
            </FormInputWrapper>
            <FormInputWrapper
              :label="t('netmask')"
              learn-more-url="https://xen-orchestra.com/docs/xoa.html#network-configuration"
            >
              <FormInput v-model="netmask" :disabled="!requireIpConf" placeholder="255.255.255.0" />
            </FormInputWrapper>
          </div>
          <div class="row">
            <FormInputWrapper
              :label="t('dns')"
              learn-more-url="https://xen-orchestra.com/docs/xoa.html#network-configuration"
            >
              <FormInput v-model="dns" :disabled="!requireIpConf" placeholder="8.8.8.8" />
            </FormInputWrapper>
            <FormInputWrapper
              :label="t('gateway')"
              learn-more-url="https://xen-orchestra.com/docs/xoa.html#network-configuration"
            >
              <FormInput v-model="gateway" :disabled="!requireIpConf" placeholder="xxx.xxx.xxx.xxx" />
            </FormInputWrapper>
          </div>
        </FormSection>

        <FormSection :label="t('xoa-admin-account')">
          <div class="row">
            <FormInputWrapper
              :label="t('admin-login')"
              learn-more-url="https://xen-orchestra.com/docs/xoa.html#default-xo-account"
            >
              <FormInput v-model="xoaUser" required placeholder="email@example.com" />
            </FormInputWrapper>
          </div>
          <div class="row">
            <FormInputWrapper
              :label="t('admin-password')"
              learn-more-url="https://xen-orchestra.com/docs/xoa.html#default-xo-account"
            >
              <FormInput v-model="xoaPwd" type="password" required :placeholder="t('password')" />
            </FormInputWrapper>
            <FormInputWrapper
              :label="t('admin-password-confirm')"
              learn-more-url="https://xen-orchestra.com/docs/xoa.html#default-xo-account"
            >
              <FormInput v-model="xoaPwdConfirm" type="password" required :placeholder="t('password')" />
            </FormInputWrapper>
          </div>
        </FormSection>

        <FormSection :label="t('xoa-ssh-account')">
          <div class="row">
            <FormInputWrapper :label="t('ssh-account')">
              <label
                ><span>{{ t('disabled') }}</span>
                <FormToggle v-model="enableSshAccount" />
                <span>{{ t('enabled') }}</span></label
              >
            </FormInputWrapper>
          </div>
          <div class="row">
            <FormInputWrapper :label="t('ssh-login')">
              <FormInput value="xoa" placeholder="xoa" disabled />
            </FormInputWrapper>
          </div>
          <div class="row">
            <FormInputWrapper :label="t('ssh-password')">
              <FormInput
                v-model="sshPwd"
                type="password"
                :placeholder="t('password')"
                :disabled="!enableSshAccount"
                :required="enableSshAccount"
              />
            </FormInputWrapper>
            <FormInputWrapper :label="t('ssh-password-confirm')">
              <FormInput
                v-model="sshPwdConfirm"
                type="password"
                :placeholder="t('password')"
                :disabled="!enableSshAccount"
                :required="enableSshAccount"
              />
            </FormInputWrapper>
          </div>
        </FormSection>

        <VtsButtonGroup>
          <UiButton size="medium" accent="brand" variant="secondary" @click="router.back()">
            {{ t('cancel') }}
          </UiButton>
          <UiButton size="medium" accent="brand" variant="primary" type="submit">
            {{ t('deploy') }}
          </UiButton>
        </VtsButtonGroup>
      </form>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import FormInput from '@/components/form/FormInput.vue'
import FormInputWrapper from '@/components/form/FormInputWrapper.vue'
import FormRadio from '@/components/form/FormRadio.vue'
import FormSection from '@/components/form/FormSection.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormToggle from '@/components/form/FormToggle.vue'
import TitleBar from '@/components/TitleBar.vue'
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiRaw from '@/components/ui/UiRaw.vue'
import { useModal } from '@/composables/modal.composable'
import type { XenApiNetwork, XenApiSr } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { useSrStore } from '@/stores/xen-api/sr.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import VtsButtonGroup from '@core/components/button-group/VtsButtonGroup.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useUiStore } from '@core/stores/ui.store'
import {
  faArrowUpRightFromSquare,
  faCircleCheck,
  faDownload,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const REQUIRED_GB = 20

const { t } = useI18n()
const router = useRouter()

usePageTitleStore().setTitle(() => t('deploy-xoa'))

const invalidField = (message: string) =>
  useModal(() => import('@/components/modals/InvalidFieldModal.vue'), {
    message,
  })

const uiStore = useUiStore()

const xapi = useXenApiStore().getXapi()

const { records: srs } = useSrStore().subscribe()
const filteredSrs = computed(() =>
  srs.value
    .filter(sr => sr.content_type !== 'iso' && sr.physical_size > 0)
    // Sort: shared first then largest free space first
    .sort((sr1, sr2) => {
      if (sr1.shared === sr2.shared) {
        return sr2.physical_size - sr2.physical_utilisation - (sr1.physical_size - sr1.physical_utilisation)
      } else {
        return sr1.shared ? -1 : 1
      }
    })
)

const { records: networks } = useNetworkStore().subscribe()
const filteredNetworks = computed(() =>
  [...networks.value].sort((network1, network2) => (network1.name_label < network2.name_label ? -1 : 1))
)

const deploying = ref(false)
const status = ref<string | undefined>()
const error = ref<string | undefined>()
const url = ref<string | undefined>()
const vmRef = ref<string | undefined>()

const resetValues = () => {
  deploying.value = false
  status.value = undefined
  error.value = undefined
  url.value = undefined
  vmRef.value = undefined
}

const openXoa = () => {
  window.open(url.value, '_blank', 'noopener')
}

const selectedSr = ref<XenApiSr>()
const selectedNetwork = ref<XenApiNetwork>()
const ntp = ref('')
const ipStrategy = ref<'static' | 'dhcp'>('dhcp')
const requireIpConf = computed(() => ipStrategy.value === 'static')

const ip = ref('')
const netmask = ref('')
const dns = ref('')
const gateway = ref('')
const xoaUser = ref('')
const xoaPwd = ref('')
const xoaPwdConfirm = ref('')
const enableSshAccount = ref(true)
const sshPwd = ref('')
const sshPwdConfirm = ref('')

async function deploy() {
  if (selectedSr.value === undefined || selectedNetwork.value === undefined) {
    // Should not happen
    console.error('SR or network is undefined')
    return
  }

  if (
    ipStrategy.value === 'static' &&
    (ip.value === '' || netmask.value === '' || dns.value === '' || gateway.value === '')
  ) {
    // Should not happen
    console.error('Missing IP config')
    return
  }

  if (xoaUser.value === '' || xoaPwd.value === '') {
    // Should not happen
    console.error('Missing XOA credentials')
    return
  }

  if (xoaPwd.value !== xoaPwdConfirm.value) {
    // TODO: use formal validation system
    invalidField(t('xoa-password-confirm-different'))
    return
  }

  if (enableSshAccount.value && sshPwd.value === '') {
    // Should not happen
    console.error('Missing XOA credentials')
    return
  }

  if (enableSshAccount.value && sshPwd.value !== sshPwdConfirm.value) {
    // TODO: use form validation system
    invalidField(t('xoa-ssh-password-confirm-different'))
    return
  }

  deploying.value = true

  try {
    status.value = t('deploy-xoa-status.importing')

    vmRef.value = (
      (await xapi.call('VM.import', [
        'http://xoa.io/xva',
        selectedSr.value.$ref,
        false, // full_restore
        false, // force
      ])) as string[]
    )[0]

    status.value = t('deploy-xoa-status.configuring')

    const [vifRef] = (await xapi.call('VM.get_VIFs', [vmRef.value])) as string[]
    await xapi.call('VIF.destroy', [vifRef])

    if (!deploying.value) {
      return
    }

    const [device] = (await xapi.call('VM.get_allowed_VIF_devices', [vmRef.value])) as string[]
    await xapi.call('VIF.create', [
      {
        device,
        MAC: '',
        MTU: selectedNetwork.value.MTU,
        network: selectedNetwork.value.$ref,
        other_config: {},
        qos_algorithm_params: {},
        qos_algorithm_type: '',
        VM: vmRef.value,
      },
    ])

    if (!deploying.value) {
      return
    }

    const promises = [
      xapi.call('VM.add_to_xenstore_data', [
        vmRef.value,
        'vm-data/admin-account',
        JSON.stringify({ email: xoaUser.value, password: xoaPwd.value }),
      ]),
    ]

    if (ntp.value !== '') {
      promises.push(xapi.call('VM.add_to_xenstore_data', [vmRef.value, 'vm-data/ntp', ntp.value]))
    }

    // TODO: add host to servers with session token?

    if (ipStrategy.value === 'static') {
      promises.push(
        xapi.call('VM.add_to_xenstore_data', [vmRef.value, 'vm-data/ip', ip.value]),
        xapi.call('VM.add_to_xenstore_data', [vmRef.value, 'vm-data/netmask', netmask.value]),
        xapi.call('VM.add_to_xenstore_data', [vmRef.value, 'vm-data/gateway', gateway.value]),
        xapi.call('VM.add_to_xenstore_data', [vmRef.value, 'vm-data/dns', dns.value])
      )
    }

    if (enableSshAccount.value) {
      promises.push(
        xapi.call('VM.add_to_xenstore_data', [vmRef.value, 'vm-data/system-account-xoa-password', sshPwd.value])
      )
    }

    await Promise.all(promises)

    if (!deploying.value) {
      return
    }

    status.value = t('deploy-xoa-status.starting')

    await xapi.call('VM.start', [
      vmRef.value,
      false, // start_paused
      false, // force
    ])

    if (!deploying.value) {
      return
    }

    status.value = t('deploy-xoa-status.waiting')

    const metricsRef = await xapi.call('VM.get_guest_metrics', [vmRef.value])
    let attempts = 120
    let networks: { '0/ip': string } | undefined
    await new Promise(resolve => setTimeout(resolve, 10e3)) // Sleep 10s
    do {
      await new Promise(resolve => setTimeout(resolve, 1e3)) // Sleep 1s
      networks = await xapi.call('VM_guest_metrics.get_networks', [metricsRef])
      if (!deploying.value) {
        return
      }
    } while (--attempts > 0 && networks?.['0/ip'] === undefined)

    if (attempts === 0 || networks === undefined) {
      status.value = t('deploy-xoa-status.not-responding')
      return
    }

    await Promise.all(
      ['admin-account', 'dns', 'gateway', 'ip', 'netmask', 'xoa-updater-credentials'].map(key =>
        xapi.call('VM.remove_from_xenstore_data', [vmRef.value, `vm-data/${key}`])
      )
    )

    status.value = t('deploy-xoa-status.ready')

    // TODO: handle IPv6
    url.value = `https://${networks['0/ip']}`
  } catch (err: any) {
    console.error(err)
    error.value = err?.message ?? err?.code ?? 'Unknown error'
  }
}

async function cancel() {
  const _vmRef = vmRef.value
  resetValues()
  if (_vmRef !== undefined) {
    try {
      await xapi.call('VM.destroy', [_vmRef])
    } catch (err) {
      console.error(err)
    }
  }
}
</script>

<style lang="postcss" scoped>
.card-view {
  flex-direction: column;
}

.row {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  column-gap: 10rem;
}

.form-toggle {
  margin: 0 1.5rem;
}

.form-input-wrapper {
  flex-grow: 1;
  min-width: 60rem;
}

.input-container * {
  vertical-align: middle;
}

.radio-group {
  display: flex;
  flex-direction: row;
  margin: 1.67rem 0;

  & > * {
    min-width: 20rem;
  }
}

.form-radio {
  margin-right: 1rem;
}

.not-available,
.status {
  display: flex;
  flex-direction: column;
  gap: 42px;
  justify-content: center;
  align-items: center;
  min-height: 76.5vh;
  color: var(--color-brand-txt-base);
  text-align: center;
  padding: 5rem;
  margin: auto;

  h2 {
    margin-bottom: 1rem;
  }

  * {
    max-width: 100%;
  }
}

.not-available {
  font-size: 2rem;
}

.status {
  color: var(--color-neutral-txt-primary);
}

.success {
  color: var(--color-success-txt-base);
}

.danger {
  color: var(--color-danger-txt-base);
}

.success,
.danger {
  &.ui-icon {
    font-size: 3rem;
  }
}

.error {
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: 0.5em;
}

.warning {
  color: var(--color-warning-txt-base);
}
</style>
