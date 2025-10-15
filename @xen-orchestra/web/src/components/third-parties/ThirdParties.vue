<template>
  <MenuList placement="bottom-end">
    <template #trigger="{ open }">
      <UiDropdownButton @click="open($event)">{{ t('third-parties') }}</UiDropdownButton>
    </template>
    <DropdownTitle>
      <UiEasyvirtLogo class="logo" />{{ t('provider-solutions', { provider: 'EasyVirt' }) }}
    </DropdownTitle>

    <MenuItem>
      <UiLink
        v-if="dcScopeIp !== undefined"
        size="medium"
        :href="`https://${dcScopeIp}`"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ t('open-app', { name: 'DC Scope' }) }}
      </UiLink>
      <UiLink v-else size="medium" href="/#/hub/recipes" rel="noopener noreferrer" target="_blank">
        {{ t('install-app', { name: 'DC Scope' }) }}
      </UiLink>
    </MenuItem>

    <MenuItem>
      <UiLink
        v-if="dcNetscopeIp !== undefined"
        size="medium"
        :href="`https://${dcNetscopeIp}`"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ t('open-app', { name: 'DC Netscope' }) }}
      </UiLink>
      <UiLink v-else size="medium" href="/#/hub/recipes" rel="noopener noreferrer" target="_blank">
        {{ t('install-app', { name: 'DC Netscope' }) }}
      </UiLink>
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import { type XoVm } from '@/types/xo/vm.type'
import DropdownTitle from '@core/components/dropdown/DropdownTitle.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiEasyvirtLogo from '@core/components/ui/easyvirt-logo/UiEasyvirtLogo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'

import { useI18n } from 'vue-i18n'

type Product = 'dcscope' | 'dcnetscope'

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

const { t } = useI18n()

const { vms } = useXoVmCollection()

const dcScopeVms = computed(() => vms.value.filter(vm => vm.other['xo:dcscope:installTime'] !== undefined))
const dcNetscopeVms = computed(() => vms.value.filter(vm => vm.other['xo:dcnetscope:installTime'] !== undefined))

const dcScopeIp = computed(() => getLatestVmIp(dcScopeVms.value, 'dcscope'))
const dcNetscopeIp = computed(() => getLatestVmIp(dcNetscopeVms.value, 'dcnetscope'))
</script>

<style lang="postcss" scoped>
.ui-link {
  text-decoration: none;
  padding-block: 1.15rem;
  flex-grow: 1;
}
.dropdown-title {
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 4%;
  height: 3.6rem;
  margin: -0.4rem -0.4rem 0 -0.4rem;
}
.logo {
  vertical-align: middle;
  margin-right: 0.8rem;
}
</style>
