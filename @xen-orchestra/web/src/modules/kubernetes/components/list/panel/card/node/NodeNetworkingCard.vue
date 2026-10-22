<template>
  <UiPanelCard class="node-networking-card">
    <UiCardTitle>
      {{ t('networking') }}
    </UiCardTitle>
    <div class="content">
      <template v-if="ipAddresses.length > 0">
        <VtsCardRowKeyValue v-for="(ip, index) in ipAddresses" :key="ip">
          <template #key>
            <div v-if="index === 0">{{ t('ip-addresses') }}</div>
          </template>
          <template #value>{{ ip }}</template>
          <template #addons>
            <VtsCopyButton :value="ip" />
            <VtsCopyAllMenuItem v-if="index === 0 && ipAddresses.length > 1" :values="ipAddresses" />
          </template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue v-else>
        <template #key>{{ t('ip-addresses') }}</template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyAllMenuItem from '@core/components/copy-all-menu-item/VtsCopyAllMenuItem.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { node } = defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()

const ipAddresses = computed(() => node.ips ?? [])
</script>

<style scoped lang="postcss">
.node-networking-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
