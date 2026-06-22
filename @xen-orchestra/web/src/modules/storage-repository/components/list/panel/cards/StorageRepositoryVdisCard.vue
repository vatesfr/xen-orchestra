<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('vdis') }}
      <UiCounter :value="vdis.length + snapshots.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>

    <div v-if="vdis.length > 0 || snapshots.length > 0" class="content">
      <div v-if="vdis.length > 0" class="subsection">
        <span class="subtitle typo-body-bold-small">{{ t('vdis') }}</span>
        <UiCounter :value="vdis.length" accent="neutral" size="small" variant="primary" />
      </div>
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

      <VtsDivider v-if="vdis.length > 0 && snapshots.length > 0" type="stretch" />

      <div v-if="snapshots.length > 0" class="subsection">
        <span class="subtitle typo-body-bold-small">{{ t('snapshot-vdis') }}</span>
        <UiCounter :value="snapshots.length" accent="neutral" size="small" variant="primary" />
      </div>
      <UiCollapsibleList tag="ul" :total-items="snapshots.length">
        <li v-for="snapshot in snapshots" :key="snapshot.id" v-tooltip class="text-ellipsis">
          <UiLink
            :to="{
              name: '/vdi/[id]/general',
              params: { id: snapshot.id },
              query: { from: VDI_PAGE_CONTEXT.VDI_SNAPSHOT },
            }"
            size="small"
            icon="object:vdi-snapshot"
          >
            {{ snapshot.name_label || t('unknown') }}
          </UiLink>
        </li>
      </UiCollapsibleList>
    </div>

    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-vdi-attached') }}
    </VtsStateHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { getVdiIcon } from '@/modules/vdi/utils/xo-vdi.util.ts'
import { VDI_PAGE_CONTEXT } from '@/shared/constants.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  vdis: FrontXoVdi[]
  snapshots: FrontXoVdiSnapshot[]
}>()

const { t } = useI18n()

const { getVbdsByIds } = useXoVbdCollection()
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;

    .subsection {
      display: flex;
      align-items: center;
      gap: 0.8rem;

      .subtitle {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }
    }
  }
}
</style>
