<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('backed-up-pools') }}
      <UiCounter :value="backedUpPools.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <div>
      <UiCollapsibleList tag="ul" :total-items="backedUpPools.length">
        <li v-for="pool in backedUpPools" :key="pool.id">
          <UiLink size="small" icon="object:pool" :to="{ name: '/pool/[id]/dashboard', params: { id: pool.id } }">
            {{ pool.name_label }}
          </UiLink>
        </li>
      </UiCollapsibleList>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

const { backedUpPools } = defineProps<{
  backedUpPools: FrontXoPool[]
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;
}
</style>
