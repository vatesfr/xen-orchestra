<template>
  <UiLink
    :to="{ name: '/host/[id]/dashboard', params: { id: host.id } }"
    :size
    :icon
    :is-primary="isMaster"
    :primary-tooltip="t('master')"
  >
    <slot>{{ host.name_label }}</slot>
  </UiLink>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostIcon } from '@/modules/host/utils/xo-host.util.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
  size: 'small' | 'medium'
}>()

const { t } = useI18n()
const { isMasterHost } = useXoHostCollection()

const icon = computed(() => getHostIcon(host))
const isMaster = computed(() => isMasterHost(host.id))
</script>
