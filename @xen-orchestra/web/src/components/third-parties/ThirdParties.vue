<template>
  <MenuList placement="bottom-end">
    <template #trigger="{ open }">
      <UiDropdownButton @click="open($event)">{{ t('third-parties') }}</UiDropdownButton>
    </template>
    <VtsDropdownTitle>
      <EasyvirtLogo class="logo" />{{ t('provider-solutions', { provider: 'EasyVirt' }) }}
    </VtsDropdownTitle>

    <MenuItem>
      <UiLink v-if="dcScopeIp !== undefined" class="link" size="medium" :href="`https://${dcScopeIp}`">
        {{ t('open-app', { name: 'DC Scope' }) }}
      </UiLink>
      <UiLink v-else class="link" size="medium" :href="hubLink">
        {{ t('install-app', { name: 'DC Scope' }) }}
      </UiLink>
    </MenuItem>

    <MenuItem>
      <UiLink v-if="dcNetscopeIp !== undefined" class="link" size="medium" :href="`https://${dcNetscopeIp}`">
        {{ t('open-app', { name: 'DC Netscope' }) }}
      </UiLink>
      <UiLink v-else class="link" size="medium" :href="hubLink">
        {{ t('install-app', { name: 'DC Netscope' }) }}
      </UiLink>
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import EasyvirtLogo from '@/components/third-parties/easyvirt/EasyvirtLogo.vue'
import { useXoRoutes } from '@/remote-resources/use-xo-routes'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import { formatIpToHostName, type IpAddress } from '@/utils/ip.utils'
import VtsDropdownTitle from '@core/components/dropdown/VtsDropdownTitle.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoVm } from '@vates/types'
import { computed } from 'vue'

import { useI18n } from 'vue-i18n'

type Product = 'dcscope' | 'dcnetscope'

const { t } = useI18n()

const { vms } = useXoVmCollection()
const { routes } = useXoRoutes()

function getInstallTime(vm: XoVm, product: Product): string | undefined {
  return vm.other[`xo:${product}:installTime`]
}

function getLatestVmIp(vms: XoVm[], product: Product): string | undefined {
  if (vms.length === 0) {
    return
  }

  let latestVm: XoVm | undefined
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

const dcScopeVms = computed(() => vms.value.filter(vm => vm.other['xo:dcscope:installTime'] !== undefined))
const dcNetscopeVms = computed(() => vms.value.filter(vm => vm.other['xo:dcnetscope:installTime'] !== undefined))

const dcScopeIp = computed(() => getFormattedIp(getLatestVmIp(dcScopeVms.value, 'dcscope')))
const dcNetscopeIp = computed(() => getFormattedIp(getLatestVmIp(dcNetscopeVms.value, 'dcnetscope')))

const hubLink = computed(() => `${routes.value?.xo5}#/hub/recipes`)
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
