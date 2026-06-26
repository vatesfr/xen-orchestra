<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <div class="title">
        {{ t('vdis') }}
        <UiCounter :value="vdis.length + vdiSnapshots.length" accent="neutral" size="small" variant="primary" />
      </div>
    </UiCardTitle>

    <div v-if="vdis.length > 0 || vdiSnapshots.length > 0" class="content">
      <template v-if="vdis.length > 0">
        <div class="subsection">
          <span class="subtitle typo-body-bold-small">{{ t('vdis') }}</span>
          <UiCounter :value="vdis.length" accent="neutral" size="small" variant="primary" />
        </div>

        <UiCollapsibleList tag="ul" :total-items="vdis.length">
          <li v-for="vdi in vdis" :key="vdi.uuid" v-tooltip class="text-ellipsis">
            <UiLink size="small" :icon="getVdiIcon(getVbdsForVdi(vdi, getVbdByOpaqueRef))">
              {{ vdi.name_label || t('unknown') }}
            </UiLink>
          </li>
        </UiCollapsibleList>
      </template>

      <VtsDivider v-if="vdis.length > 0 && vdiSnapshots.length > 0" type="stretch" />

      <template v-if="vdiSnapshots.length > 0">
        <div class="subsection">
          <span class="subtitle typo-body-bold-small">{{ t('snapshot-vdis') }}</span>
          <UiCounter :value="vdiSnapshots.length" accent="neutral" size="small" variant="primary" />
        </div>

        <UiCollapsibleList tag="ul" :total-items="vdiSnapshots.length">
          <li v-for="vdiSnapshot in vdiSnapshots" :key="vdiSnapshot.uuid" v-tooltip class="text-ellipsis">
            <UiLink size="small" icon="object:vdi-snapshot">
              {{ vdiSnapshot.name_label || t('unknown') }}
            </UiLink>
          </li>
        </UiCollapsibleList>
      </template>
    </div>

    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-vdi-attached') }}
    </VtsStateHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { getVdiIcon, getVbdsForVdi } from '@/libs/vdi.ts'
import type { XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import { useVbdStore } from '@/stores/xen-api/vbd.store.ts'
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
  vdis: XenApiVdi[]
  vdiSnapshots: XenApiVdi[]
}>()

const { t } = useI18n()

const { getByOpaqueRef: getVbdByOpaqueRef } = useVbdStore().subscribe()
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .title {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

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
