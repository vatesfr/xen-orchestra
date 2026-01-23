<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('networks') }}
      <UiLink v-if="ipAddresses.length > 0" size="medium" :to="`/vm/${vm.id}/networks`">
        {{ t('see-details') }}
      </UiLink>
    </UiCardTitle>
    <div class="content">
      <template v-if="ipAddresses.length > 0">
        <VtsCardRowKeyValue v-for="(ip, index) in ipAddresses" :key="ip">
          <template #key>
            <div v-if="index === 0">{{ t('ip-addresses') }}</div>
          </template>
          <template #value>
            <span class="text-ellipsis">{{ ip }}</span>
          </template>
          <template #addons>
            <VtsCopyButton :value="ip" />
            <UiButtonIcon
              v-if="index === 0 && ipAddresses.length > 1"
              v-tooltip="t('coming-soon!')"
              disabled
              icon="fa:ellipsis"
              size="small"
              accent="brand"
            />
          </template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue v-else>
        <template #key>{{ t('ip-addresses') }}</template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { getVmIpAddresses } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const ipAddresses = computed(() => getVmIpAddresses(vm))
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
