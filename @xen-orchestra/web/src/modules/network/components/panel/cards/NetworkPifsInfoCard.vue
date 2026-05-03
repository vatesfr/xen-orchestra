<template>
  <UiCard v-if="pifsCount && pifsCount > 0" class="card-container">
    <div class="typo-body-bold">
      {{ t('pifs') }}
      <UiCounter :value="pifsCount" variant="primary" size="small" accent="neutral" />
    </div>
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
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network: FrontXoNetwork
}>()

const { t } = useI18n()

const { getPifsByNetworkId } = useXoPifCollection()

const pifs = computed(() => getPifsByNetworkId(network.id))

const pifsCount = computed(() => pifs.value.length)
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .value:empty::before {
      content: '-';
    }
  }

  .text-left {
    text-align: left;
  }

  .simple-table {
    border-spacing: 0;
    padding: 0.4rem;

    thead tr th {
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
