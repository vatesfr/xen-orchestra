<template>
  <UiCard v-if="pifsCount && pifsCount > 0" class="card-container">
    <UiCardTitle>
      {{ t('pifs') }}
      <UiCounter :value="pifsCount" variant="primary" size="small" accent="neutral" />
    </UiCardTitle>
    <table class="simple-table">
      <thead>
        <tr>
          <th class="text-left typo-body-regular-small">
            {{ t('host') }}
          </th>
          <th class="text-left typo-body-regular-small">
            {{ t('device') }}
          </th>
          <th class="text-left typo-body-regular-small">
            {{ t('pifs-status') }}
          </th>
          <th />
        </tr>
      </thead>
      <tbody>
        <PifRow v-for="pif in pifs" :key="pif.id" :pif />
      </tbody>
    </table>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import PifRow from '@/modules/pif/components/PifRow.vue'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network: FrontXoNetwork
}>()

const { getPifsByNetworkId } = useXoPifCollection()

const pifs = computed(() => getPifsByNetworkId(network.id))

const pifsCount = computed(() => pifs.value.length)

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.simple-table {
  border-spacing: 0;
  padding: 0.4rem;
  thead tr th {
    color: var(--color-neutral-txt-secondary);
  }

  .text-left {
    text-align: left;
  }
}
</style>
