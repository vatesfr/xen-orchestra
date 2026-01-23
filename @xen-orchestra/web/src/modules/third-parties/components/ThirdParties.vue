<template>
  <MenuList placement="bottom-end">
    <template #trigger="{ open }">
      <UiDropdownButton @click="open($event)">{{ t('third-parties') }}</UiDropdownButton>
    </template>
    <VtsDropdownTitle>
      <EasyVirtLogo class="logo" />{{ t('provider-solutions', { provider: 'EasyVirt' }) }}
    </VtsDropdownTitle>

    <MenuItem v-for="(easyVirtSolution, index) in easyVirtSolutions" :key="index">
      <UiLink class="link" size="medium" :href="easyVirtSolution.href">
        {{ easyVirtSolution.label }}
      </UiLink>
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import EasyVirtLogo from '@/modules/third-parties/components/easyvirt/EasyVirtLogo.vue'
import { useXoVmCollection, type FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { formatIpToHostName, type IpAddress } from '@/shared/utils/ip.utils.ts'
import VtsDropdownTitle from '@core/components/dropdown/VtsDropdownTitle.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'

import { useI18n } from 'vue-i18n'

type Product = 'dcscope' | 'dcnetscope'

const { t } = useI18n()

const { vms } = useXoVmCollection()
const { buildXo5Route } = useXoRoutes()

const hubLink = computed(() => buildXo5Route(`/hub/recipes`))

const dcScopeVms = computed(() => vms.value.filter(vm => vm.other['xo:dcscope:installTime'] !== undefined))
const dcNetscopeVms = computed(() => vms.value.filter(vm => vm.other['xo:dcnetscope:installTime'] !== undefined))

const dcScopeIp = computed(() => getFormattedIp(getLatestVmIp(dcScopeVms.value, 'dcscope')))
const dcNetscopeIp = computed(() => getFormattedIp(getLatestVmIp(dcNetscopeVms.value, 'dcnetscope')))

const dcScopeLabel = computed(() =>
  dcScopeIp.value !== undefined
    ? t('action:open-app', { name: 'DC Scope' })
    : t('action:install-app', { name: 'DC Scope' })
)
const dcNetscopeLabel = computed(() =>
  dcNetscopeIp.value !== undefined
    ? t('action:open-app', { name: 'DC Netscope' })
    : t('action:install-app', { name: 'DC Netscope' })
)

const dcScopeLink = computed(() => (dcScopeIp.value !== undefined ? `https://${dcScopeIp.value}` : hubLink.value))
const dcNetscopeLink = computed(() =>
  dcNetscopeIp.value !== undefined ? `https://${dcNetscopeIp.value}` : hubLink.value
)

const easyVirtSolutions = computed(() => [
  { label: dcScopeLabel.value, href: dcScopeLink.value },
  { label: dcNetscopeLabel.value, href: dcNetscopeLink.value },
])

function getInstallTime(vm: FrontXoVm, product: Product): string | undefined {
  return vm.other[`xo:${product}:installTime`]
}

function getLatestVmIp(vms: FrontXoVm[], product: Product): string | undefined {
  if (vms.length === 0) {
    return
  }

  let latestVm: FrontXoVm | undefined
  Object.values(vms).forEach(vm => {
    if (vm.mainIpAddress === undefined || getInstallTime(vm, product) === undefined) {
      return
    }

    if (latestVm === undefined || getInstallTime(vm, product)! > getInstallTime(latestVm, product)!) {
      latestVm = vm
    }
  })

  return latestVm?.mainIpAddress
}

function getFormattedIp(ip: string | undefined): string | undefined {
  if (ip === undefined) {
    return
  }

  return formatIpToHostName(ip as IpAddress)
}
</script>

<style lang="postcss" scoped>
.link {
  text-decoration: none;
  color: var(--color-brand-txt-base);
  padding-block: 1.2rem;
  flex-grow: 1;
}

.logo {
  vertical-align: middle;
  margin-right: 0.8rem;
}
</style>
