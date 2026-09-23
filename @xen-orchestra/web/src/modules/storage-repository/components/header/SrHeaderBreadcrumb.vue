<template>
  <div v-if="parent" class="sr-header-breadcrumb">
    <UiBreadcrumb :size>
      <UiLink :size :to="parent.dashboardTo" :icon="parent.icon">
        {{ parent.label }}
      </UiLink>
      <UiLink :size :to="parent.storageTo">
        {{ t('storage') }}
      </UiLink>
      <span class="sr-name">
        <VtsObjectIcon type="sr" :state="srIconState" size="current" />
        {{ sr.name_label }}
      </span>
    </UiBreadcrumb>
  </div>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostIcon } from '@/modules/host/utils/xo-host.util.ts'
import type { PbdsConnectionStatus } from '@/modules/pbd/utils/xo-pbd.util.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { XoSrScope } from '@/modules/storage-repository/utils/sr-scope.util.ts'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { type IconName } from '@core/icons'
import { useUiStore } from '@core/stores/ui.store.ts'
import { SR_SCOPE_TYPE } from '@core/types/storage-repository.type.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

type SrBreadcrumbParent = {
  icon: IconName
  label: string
  dashboardTo: RouteLocationRaw
  storageTo: RouteLocationRaw
}

const { sr, scope } = defineProps<{
  sr: FrontXoSr
  scope: XoSrScope
  srIconState?: PbdsConnectionStatus
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const { useGetHostById } = useXoHostCollection()
const { useGetPoolById } = useXoPoolCollection()

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))

const host = useGetHostById(() => (scope.type === SR_SCOPE_TYPE.HOST ? scope.hostId : undefined))

const pool = useGetPoolById(() => sr.$pool)

const parent = computed<SrBreadcrumbParent | undefined>(() => {
  if (scope.type === SR_SCOPE_TYPE.HOST) {
    const scopedHost = host.value

    if (scopedHost === undefined) {
      return undefined
    }

    return {
      icon: getHostIcon(scopedHost),
      label: scopedHost.name_label,
      dashboardTo: { name: '/host/[id]/dashboard', params: { id: scopedHost.id } },
      storageTo: { name: '/host/[id]/storage', params: { id: scopedHost.id } },
    }
  }

  const srPool = pool.value

  if (srPool === undefined) {
    return undefined
  }

  return {
    icon: 'object:pool',
    label: srPool.name_label,
    dashboardTo: { name: '/pool/[id]/dashboard', params: { id: srPool.id } },
    storageTo: { name: '/pool/[id]/storage', params: { id: srPool.id } },
  }
})
</script>

<style lang="postcss" scoped>
.sr-header-breadcrumb {
  min-height: 5.6rem;
  padding: 1.2rem 1.6rem;
  display: flex;
  gap: 1.6rem;
  align-items: center;
  border-bottom: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  justify-content: space-between;
  overflow-y: auto;

  .sr-name {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
}
</style>
