<template>
  <UiLink
    :to="to ?? { name: '/host/[id]/dashboard', params: { id: host.id } }"
    :size
    :icon
    :icon-tooltip
    :is-primary="isMaster"
    :primary-tooltip="t('master')"
  >
    <slot>{{ host.name_label }}</slot>
  </UiLink>
</template>

<script lang="ts" setup>
import { useXoHostOperationLabel } from '@/modules/host/composables/xo-host-operation-label.composable.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostIcon } from '@/modules/host/utils/xo-host.util.ts'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host, to } = defineProps<{
  host: FrontXoHost
  size: 'small' | 'medium'
  to?: LinkOptions['to']
}>()

const { t } = useI18n()
const { isMasterHost } = useXoHostCollection()

const { getHostIconTooltip } = useXoHostOperationLabel()

const icon = computed(() => getHostIcon(host))
const iconTooltip = computed(() => getHostIconTooltip(host))
const isMaster = computed(() => isMasterHost(host.id))
</script>
