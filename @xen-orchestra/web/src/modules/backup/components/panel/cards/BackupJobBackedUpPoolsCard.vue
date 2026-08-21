<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('backed-up-pools')" :counter="backedUpPools.length" />
    <div>
      <UiCollapsibleList tag="ul" :total-items="backedUpPools.length">
        <li v-for="pool in backedUpPools" :key="pool.id">
          <UiLink size="small" icon="object:pool" :to="{ name: '/pool/[id]/dashboard', params: { id: pool.id } }">
            {{ pool.name_label }}
          </UiLink>
        </li>
      </UiCollapsibleList>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

const { backedUpPools } = defineProps<{
  backedUpPools: FrontXoPool[]
}>()

const { t } = useI18n()
</script>
