<template>
  <UiPanelCard class="vm-info-card">
    <UiPanelCardTitle
      :id="vm.uuid"
      size="medium"
      :label="vm.name_label"
      :icon="vmIcon"
      :to="{ name: '/vm/[uuid]/dashboard', params: { uuid: vm.uuid } }"
    />
    <VtsCardRowList class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('state') }}</template>
        <template #value>
          <span class="value">
            <VtsIcon :name="powerState.icon" size="medium" />
            {{ powerState.text }}
          </span>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ vm.name_description }}</template>
        <template v-if="vm.name_description" #addons>
          <VtsCopyButton :value="vm.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue align-top>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="vm.tags.length > 0">
            <VtsTag v-for="tag in vm.tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
        <template v-if="vm.tags.length > 0" #addons>
          <VtsCopyButton :value="vm.tags.join(', ')" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('pool') }}</template>
        <template #value>
          <div v-if="pool !== undefined" class="value">
            <UiLink
              :to="{ name: '/pool/[uuid]/dashboard', params: { uuid: pool.uuid } }"
              size="small"
              icon="object:pool"
            >
              {{ pool.name_label }}
            </UiLink>
          </div>
        </template>
        <template v-if="pool !== undefined" #addons>
          <VtsCopyButton :value="pool.uuid" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('host') }}</template>
        <template #value>
          <div v-if="host !== undefined" class="value">
            <HostLink :host size="small" />
          </div>
        </template>
        <template v-if="host !== undefined" #addons>
          <VtsCopyButton :value="host.uuid" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('os-name') }}</template>
        <template #value>{{ osName }}</template>
        <template v-if="osName" #addons>
          <VtsCopyButton :value="osName" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('guest-tools') }}</template>
        <template #value>{{ guestTools }}</template>
        <template v-if="guestTools" #addons>
          <VtsCopyButton :value="guestTools" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('template') }}</template>
        <template #value>
          <div v-if="templateName" class="value">
            <VtsIcon name="fa:template" size="medium" />
            {{ templateName }}
          </div>
        </template>
        <template v-if="templateName" #addons>
          <VtsCopyButton :value="templateName" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('created-on') }}</template>
        <template #value>{{ installDateFormatted }}</template>
        <template v-if="installTime !== undefined" #addons>
          <VtsCopyButton :value="installDateFormatted" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('started') }}</template>
        <template #value>{{ relativeStartTime }}</template>
        <template v-if="startTime !== undefined" #addons>
          <VtsCopyButton :value="relativeStartTime" />
        </template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import HostLink from '@/modules/host/components/HostLink.vue'
import { useVmMetricsInfo } from '@/modules/vm/composables/vm-metrics-info.composable.ts'
import { useVmUtils } from '@/modules/vm/composables/vm-utils.composable.ts'
import { getVmIcon } from '@/modules/vm/utils/vm.util.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XenApiVm
}>()

const { t } = useI18n()

const { getVmHost } = useVmStore().subscribe()
const { pool } = usePoolStore().subscribe()

const { powerState } = useVmUtils(() => vm)

const vmIcon = computed(() => getVmIcon(vm))

const host = computed(() => getVmHost(vm))

const { osName, guestTools, startTime, relativeStartTime, installTime, installDateFormatted } = useVmMetricsInfo(
  () => vm
)

const templateName = computed(() => vm.other_config.base_template_name)
</script>

<style lang="postcss" scoped>
.vm-info-card {
  .content {
    .value {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
  }
}
</style>
