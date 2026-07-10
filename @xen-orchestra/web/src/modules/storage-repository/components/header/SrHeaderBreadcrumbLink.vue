<template>
  <div class="breadcrumb-container">
    <UiBreadcrumb v-if="fromContext === SR_PAGE_CONTEXT.HOST && host" :size>
      <UiLink :size :to="{ name: '/host/[id]/dashboard', params: { id: host.id } }">
        <VtsObjectIcon type="host" :state="toLower(host.power_state)" size="current" />
        {{ host.name_label }}
      </UiLink>
      <UiLink :size :to="{ name: '/host/[id]/storage', params: { id: host.id } }">
        {{ t('storage') }}
      </UiLink>
      <span class="sr-name">
        <VtsObjectIcon type="sr" :state="srConnectionStatus" size="current" />
        {{ sr.name_label }}
      </span>
    </UiBreadcrumb>
    <UiBreadcrumb v-else-if="fromContext === SR_PAGE_CONTEXT.POOL && pool" :size>
      <UiLink :size :to="{ name: '/pool/[id]/dashboard', params: { id: pool.id } }">
        <VtsIcon name="object:pool" size="current" />
        {{ pool.name_label }}
      </UiLink>
      <UiLink :size :to="{ name: '/pool/[id]/storage', params: { id: pool.id } }">
        {{ t('storage') }}
      </UiLink>
      <span class="sr-name">
        <VtsObjectIcon type="sr" :state="srConnectionStatus" size="current" />
        {{ sr.name_label }}
      </span>
    </UiBreadcrumb>
  </div>
</template>

<script setup lang="ts">
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { SR_PAGE_CONTEXT, type SrPageContext } from '@/shared/constants.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr, host, fromContext } = defineProps<{ sr: FrontXoSr; host?: FrontXoHost; fromContext?: SrPageContext }>()

const { t } = useI18n()

const uiStore = useUiStore()

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))

const { useGetPoolById } = useXoPoolCollection()

const pool = useGetPoolById(() => sr.$pool)

const { srConnectionStatus } = useXoSrUtils(() => sr)
</script>

<style lang="postcss" scoped>
.breadcrumb-container {
  min-height: 5.6rem;
  padding: 1.2rem 1.6rem;
  display: flex;
  gap: 1.6rem;
  align-items: center;
  border-bottom: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  justify-content: space-between;
  overflow-y: auto;
}

.sr-name {
  display: flex;
  align-items: center;
  gap: 1rem;
}
</style>
