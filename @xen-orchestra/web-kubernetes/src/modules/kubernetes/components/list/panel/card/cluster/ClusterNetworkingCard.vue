<template>
  <UiPanelCard class="cluster-networking-card">
    <UiCardTitle>
      {{ t('networking') }}
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('cp-endpoint') }}</template>
        <template v-if="cluster.control_plane_endpoint" #value>{{ cluster.control_plane_endpoint }}</template>
        <template v-if="cluster.control_plane_endpoint" #addons>
          <VtsCopyButton :value="cluster.control_plane_endpoint" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('api-server-port') }}</template>
        <template #value>{{ cluster.api_server_port }}</template>
        <template #addons>
          <VtsCopyButton :value="String(cluster.api_server_port)" />
        </template>
      </VtsCardRowKeyValue>
      <template v-if="podCidrBlocks.length > 0">
        <VtsCardRowKeyValue v-for="(block, index) in podCidrBlocks" :key="block">
          <template #key>
            <div v-if="index === 0">{{ t('pod-cidr-blocks') }}</div>
          </template>
          <template #value>{{ block }}</template>
          <template #addons>
            <VtsCopyButton :value="block" />
            <VtsCopyAllMenuItem v-if="index === 0 && podCidrBlocks.length > 1" :values="podCidrBlocks" />
          </template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue v-else>
        <template #key>{{ t('pod-cidr-blocks') }}</template>
      </VtsCardRowKeyValue>
      <template v-if="serviceCidrBlocks.length > 0">
        <VtsCardRowKeyValue v-for="(block, index) in serviceCidrBlocks" :key="block">
          <template #key>
            <div v-if="index === 0">{{ t('service-cidr-blocks') }}</div>
          </template>
          <template #value>{{ block }}</template>
          <template #addons>
            <VtsCopyButton :value="block" />
            <VtsCopyAllMenuItem v-if="index === 0 && serviceCidrBlocks.length > 1" :values="serviceCidrBlocks" />
          </template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue v-else>
        <template #key>{{ t('service-cidr-blocks') }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('service-domain') }}</template>
        <template v-if="cluster.service_domain" #value>{{ cluster.service_domain }}</template>
        <template v-if="cluster.service_domain" #addons>
          <VtsCopyButton :value="cluster.service_domain" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyAllMenuItem from '@core/components/copy-all-menu-item/VtsCopyAllMenuItem.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const podCidrBlocks = computed(() => cluster.pod_cidr_blocks ?? [])

const serviceCidrBlocks = computed(() => cluster.service_cidr_blocks ?? [])
</script>

<style scoped lang="postcss">
.cluster-networking-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
