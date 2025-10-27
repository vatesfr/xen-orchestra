<template>
  <UiCard>
    <UiCardTitle>
      {{ t('network') }}
      <UiLink size="medium" :to="`/vm/${vm.id}/networks`">
        {{ t('see-all') }}
      </UiLink>
    </UiCardTitle>
    <div class="content">
      <template v-if="ipAddresses.length">
        <VtsCardRowKeyValue v-for="(ip, index) in ipAddresses" :key="ip">
          {{ ip }}
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
              v-tooltip="t('coming-soon')"
              disabled
              icon="fa:ellipsis"
              size="medium"
              accent="brand"
            />
          </template>
        </VtsCardRowKeyValue>
      </template>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoVmUtils } from '@/composables/xo-vm-utils.composable.ts'
import type { XoVm } from '@/types/xo/vm.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { getIpAddresses } = useXoVmUtils()

const ipAddresses = computed(() => getIpAddresses(vm))
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
</style>
