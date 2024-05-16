<template>
  <header class="app-header">
    <UiIcon v-if="isMobile" ref="navigationTrigger" :icon="faBars" class="toggle-navigation" />
    <RouterLink :to="{ name: 'home' }">
      <img v-if="isMobile" alt="XO Lite" src="../assets/logo.svg" />
      <TextLogo v-else />
    </RouterLink>
    <slot />
    <div class="right">
      <PoolOverrideWarning as-tooltip />
      <template v-if="isDesktop">
        <UiButton v-if="xoaFound" :left-icon="faArrowUpRightFromSquare" @click="openXoa">
          {{ $t('access-xoa') }}
        </UiButton>
        <UiButton v-else :left-icon="faDownload" @click="openXoaDeploy">
          {{ $t('deploy-xoa') }}
        </UiButton>
      </template>
      <AccountButton />
    </div>
  </header>
</template>

<script lang="ts" setup>
import AccountButton from '@/components/AccountButton.vue'
import PoolOverrideWarning from '@/components/PoolOverrideWarning.vue'
import TextLogo from '@/components/TextLogo.vue'
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import { useNavigationStore } from '@/stores/navigation.store'
import { usePoolCollection } from '@/stores/xen-api/pool.store'
import UiButton from '@core/components/button/UiButton.vue'
import { useUiStore } from '@core/stores/ui.store'
import { faBars, faDownload, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { PRIMARY_ADDRESS_TYPE } from '@/libs/xen-api/xen-api.enums'

const router = useRouter()
const { pool } = usePoolCollection()
const XOA_INFO_KEY_PREFIX = 'xo:clientInfo:'

interface InterfaceInfo {
  address: string
  netmask: string
  mac: string
  cidr: string
  family: PRIMARY_ADDRESS_TYPE
  internal: boolean
}

interface ClientInfo {
  lastConnected: number
  networkInterfaces: Record<string, InterfaceInfo[]>
}

const xoasInfo = computed(() => {
  if (pool.value === undefined) {
    return
  }

  return Object.fromEntries(
    Object.entries(pool.value.other_config)
      .filter(([key]) => key.startsWith(XOA_INFO_KEY_PREFIX))
      .map(([key, json]) => [key.slice(XOA_INFO_KEY_PREFIX.length), JSON.parse(json)])
  ) as Record<string, ClientInfo>
})

const xoaInfo = computed(() => {
  if (xoasInfo.value === undefined) {
    return
  }

  return Object.values(xoasInfo.value).reduce((lastXoaInfo, info) =>
    lastXoaInfo === undefined || info.lastConnected > lastXoaInfo.lastConnected ? info : lastXoaInfo
  )
})

const xoaAddress = computed(() => {
  if (xoaInfo.value === undefined) {
    return
  }

  const { networkInterfaces } = xoaInfo.value
  if (networkInterfaces === undefined || Object.keys(networkInterfaces).length === 0) {
    return
  }

  const ifName = 'eth0' in networkInterfaces ? 'eth0' : Object.keys(networkInterfaces)[0]
  const xoaAddress = networkInterfaces[ifName][0].address

  return `https://${xoaAddress}`
})

const xoaFound = computed(() => xoaAddress.value !== undefined)

const openXoaDeploy = () => router.push({ name: 'xoa.deploy' })
const openXoa = () => window.open(xoaAddress.value, '_blank', 'noopener')

const uiStore = useUiStore()
const { isMobile, isDesktop } = storeToRefs(uiStore)

const navigationStore = useNavigationStore()
const { trigger: navigationTrigger } = storeToRefs(navigationStore)
</script>

<style lang="postcss" scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 5.5rem;
  padding: 1rem;
  border-bottom: 0.1rem solid var(--color-grey-500);
  background-color: var(--background-color-secondary);

  img {
    width: 4rem;
  }

  .text-logo {
    margin-left: 1rem;
    vertical-align: middle;
  }

  .warning-not-current-pool {
    font-size: 2.4rem;
  }
}

.right {
  display: flex;
  align-items: center;
  gap: 2rem;
}
</style>
