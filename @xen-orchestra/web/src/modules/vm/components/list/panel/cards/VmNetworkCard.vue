<template>
  <UiPanelCard class="vm-network-card">
    <UiCardTitle>
      {{ t('networks') }}
      <UiLink v-if="ipAddresses.length > 0" size="medium" :to="{ name: '/vm/[id]/networks', params: { id: vm.id } }">
        {{ t('see-details') }}
      </UiLink>
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

<script lang="ts" setup>
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmIpAddresses } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyAllMenuItem from '@core/components/copy-all-menu-item/VtsCopyAllMenuItem.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const ipAddresses = computed(() => getVmIpAddresses(vm))
</script>

<style scoped lang="postcss">
.vm-network-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
