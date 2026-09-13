<template>
  <UiPanelCard class="storage-repository-vdis-card">
    <UiPanelCardTitle size="medium" :label="t('vdis')" :counter="vdis.length + vdiSnapshots.length" />

    <div v-if="vdis.length > 0 || vdiSnapshots.length > 0" class="content">
      <template v-if="vdis.length > 0">
        <UiPanelCardTitle size="small" :label="t('vdis')" :counter="vdis.length" />

        <UiCollapsibleList tag="ul" :total-items="vdis.length">
          <li v-for="vdi in vdis" :key="vdi.id" v-tooltip class="text-ellipsis">
            <UiLink
              :to="{ name: '/vdi/[id]/general', params: { id: vdi.id }, query: { from: VDI_PAGE_CONTEXT.SR } }"
              size="small"
              :icon="getVdiIcon(getVbdsByIds(vdi.$VBDs))"
            >
              {{ vdi.name_label || t('unknown') }}
            </UiLink>
          </li>
        </UiCollapsibleList>
      </template>

      <VtsDivider v-if="vdis.length > 0 && vdiSnapshots.length > 0" type="stretch" />

      <template v-if="vdiSnapshots.length > 0">
        <UiPanelCardTitle size="small" :label="t('snapshot-vdis')" :counter="vdiSnapshots.length" />

        <UiCollapsibleList tag="ul" :total-items="vdiSnapshots.length">
          <li v-for="vdiSnapshot in vdiSnapshots" :key="vdiSnapshot.id" v-tooltip class="text-ellipsis">
            <UiLink
              :to="{
                name: '/vdi/[id]/general',
                params: { id: vdiSnapshot.id },
                query: { from: VDI_PAGE_CONTEXT.VDI_SNAPSHOT },
              }"
              size="small"
              icon="object:vdi-snapshot"
            >
              {{ vdiSnapshot.name_label || t('unknown') }}
            </UiLink>
          </li>
        </UiCollapsibleList>
      </template>
    </div>

    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-vdi-attached') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { getVdiIcon } from '@/modules/vdi/utils/xo-vdi.util.ts'
import { VDI_PAGE_CONTEXT } from '@/shared/constants.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  vdis: FrontXoVdi[]
  vdiSnapshots: FrontXoVdiSnapshot[]
}>()

const { t } = useI18n()

const { getVbdsByIds } = useXoVbdCollection()
</script>

<style scoped lang="postcss">
.storage-repository-vdis-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
