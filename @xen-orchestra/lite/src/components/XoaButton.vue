<template>
  <UiButton
    v-if="xoaFound"
    size="medium"
    accent="brand"
    variant="primary"
    :left-icon="faArrowUpRightFromSquare"
    class="xoa-button"
    @click="openXoa()"
  >
    {{ t('access-xoa') }}
  </UiButton>
  <UiButton
    v-else
    size="medium"
    accent="brand"
    variant="primary"
    :left-icon="faDownload"
    class="xoa-button"
    @click="openXoaDeploy()"
  >
    {{ t('deploy-xoa') }}
  </UiButton>
</template>

<script lang="ts" setup>
import type { PRIMARY_ADDRESS_TYPE } from '@/libs/xen-api/xen-api.enums'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { faDownload, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()

const router = useRouter()
const { pool } = usePoolStore().subscribe()
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
  networkInterfaces?: Record<string, InterfaceInfo[]>
  publicUrl?: string
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

  const { networkInterfaces, publicUrl } = xoaInfo.value

  if (publicUrl !== undefined) {
    return publicUrl
  }

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
</script>
