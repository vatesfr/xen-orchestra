<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('networks')">
      <template v-if="ipAddresses.length > 0" #action>
        <UiLink size="small" :to="{ name: '/vm/[id]/networks', params: { id: vm.id } }">
          {{ t('see-details') }}
        </UiLink>
      </template>
    </UiPanelCardTitle>
    <VtsCardRowList>
      <VtsCardRowKeyValue :values="ipAddresses">
        <template #key>{{ t('ip-addresses') }}</template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmIpAddresses } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const ipAddresses = computed(() => getVmIpAddresses(vm))
</script>
