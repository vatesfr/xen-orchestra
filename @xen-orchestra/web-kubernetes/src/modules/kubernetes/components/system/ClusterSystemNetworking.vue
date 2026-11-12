<template>
  <UiCard>
    <UiTitle>
      {{ t('networking') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('control-plane-endpoint')" :value="cluster.control_plane_endpoint" />
      <VtsTabularKeyValueRow :label="t('api-server-port')" :value="String(cluster.api_server_port)" />
      <VtsTabularKeyValueRow :label="t('pod-cidr-blocks')">
        <template v-if="podCidrBlocks.length > 0" #value>
          <ul>
            <li v-for="block in podCidrBlocks" :key="block">{{ block }}</li>
          </ul>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('service-cidr-blocks')">
        <template v-if="serviceCidrBlocks.length > 0" #value>
          <ul>
            <li v-for="block in serviceCidrBlocks" :key="block">{{ block }}</li>
          </ul>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('service-domain')" :value="cluster.service_domain" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const podCidrBlocks = computed(() => cluster.pod_cidr_blocks ?? [])

const serviceCidrBlocks = computed(() => cluster.service_cidr_blocks ?? [])
</script>
