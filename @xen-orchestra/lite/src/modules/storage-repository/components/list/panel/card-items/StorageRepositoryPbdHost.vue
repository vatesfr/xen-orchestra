<template>
  <VtsCardRowKeyValue>
    <template #key>
      {{ t('host') }}
    </template>
    <template #value>
      <UiLink
        v-if="host !== undefined"
        size="small"
        icon="object:host"
        :to="{ name: '/host/[uuid]/dashboard', params: { uuid: host.uuid } }"
      >
        {{ host.name_label }}
      </UiLink>
    </template>
  </VtsCardRowKeyValue>
</template>

<script setup lang="ts">
import type { XenApiPbd } from '@/libs/xen-api/xen-api.types.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pbd } = defineProps<{
  pbd: XenApiPbd
}>()

const { t } = useI18n()

const { getByOpaqueRef: getHostByOpaqueRef } = useHostStore().subscribe()

const host = computed(() => getHostByOpaqueRef(pbd.host))
</script>
