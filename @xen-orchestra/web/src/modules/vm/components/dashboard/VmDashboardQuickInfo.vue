<template>
  <VtsQuickInfoCard :loading="!areVmsReady" class="vm-dashboard-quick-info">
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('state')">
        <template #value>
          <span class="value">
            <VtsIcon :name="powerState.icon" size="medium" />
            {{ powerState.text }}
          </span>
        </template>
      </VtsKeyValueRow>
      <VtsKeyValueRow :label="t('ip-address')" :value="vm.mainIpAddress" copy />
      <VtsKeyValueRow :label="t('created-on')" :value="installDateFormatted" />
      <VtsKeyValueRow :label="t('created-by')" :value="userLabel ?? t('unknown')" />
      <VtsKeyValueRow :label="t('started')" :value="relativeStartTime" />
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('uuid')" :value="vm.id" copy />
      <VtsKeyValueRow :label="t('pool')">
        <template #value>
          <UiLink
            v-if="pool"
            :to="{ name: '/pool/[id]/dashboard', params: { id: pool.id } }"
            icon="object:pool"
            size="medium"
          >
            {{ pool.name_label }}
          </UiLink>
          <span v-else>
            {{ t('none') }}
          </span>
        </template>
      </VtsKeyValueRow>
      <VtsKeyValueRow :label="t('host')">
        <template #value>
          <HostLink v-if="host" :host="host" size="medium" />
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsKeyValueRow>
      <VtsKeyValueRow :label="t('storage')">
        <template #value>
          <ul v-if="srs.length > 0" class="storage">
            <li v-for="sr in displayedSrs" :key="sr.id">
              <UiLink :to="{ name: '/sr/[id]/general', params: { id: sr.id } }" icon="object:sr" size="medium">
                {{ sr.name_label }}
              </UiLink>
            </li>
            <li v-if="hiddenSrsCount > 0" class="hidden-srs-count">
              <UiLink :to="{ name: '/vm/[id]/vdis', params: { id: vm.id } }" size="medium">
                {{ t('plus-n', { n: hiddenSrsCount }) }}
              </UiLink>
            </li>
          </ul>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsKeyValueRow>
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('description')" :value="vm.name_description" />
      <VtsKeyValueRow :label="t('os-name')" :value="vm.os_version?.name" />
      <VtsKeyValueRow :label="t('virtualization-type')" :value="virtualizationType" />
      <VtsKeyValueRow :label="t('guest-tools')">
        <template #value>
          <VmGuestToolsStatus :guest-tools-display />
        </template>
      </VtsKeyValueRow>
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('vcpus')" :value="String(vm.CPUs.number)" />
      <VtsKeyValueRow :label="t('ram')" :value="ram" />
    </VtsKeyValueList>
    <template #footer>
      <VmTagsEditor :vm class="typo-body-regular" />
    </template>
  </VtsQuickInfoCard>
</template>

<script lang="ts" setup>
import HostLink from '@/modules/host/components/HostLink.vue'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import VmTagsEditor from '@/modules/vm/components/tags/VmTagsEditor.vue'
import VmGuestToolsStatus from '@/modules/vm/components/VmGuestToolsStatus.vue'
import { useXoVmDisksSrs } from '@/modules/vm/composables/xo-vm-disks-srs.composable.ts'
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsKeyValueList from '@core/components/key-value-list/VtsKeyValueList.vue'
import VtsKeyValueRow from '@core/components/key-value-row/VtsKeyValueRow.vue'
import VtsQuickInfoCard from '@core/components/quick-info-card/VtsQuickInfoCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { areVmsReady } = useXoVmCollection()
const { useGetPoolById } = useXoPoolCollection()
const { getVmHost } = useXoVmCollection()

const { powerState, installDateFormatted, relativeStartTime, guestToolsDisplay } = useXoVmUtils(() => vm)

const { user } = useXoUserResource({}, () => vm.creation?.user)

const userLabel = computed(() => user.value?.name || user.value?.email)

const pool = useGetPoolById(vm.$pool)

const ram = computed(() => formatSize(vm.memory.size, 1))

const virtualizationType = computed(() =>
  vm.virtualizationMode === 'hvm' && vm.pvDriversDetected ? 'pvhvm' : vm.virtualizationMode
)

const host = computed(() => getVmHost(vm))

const MAX_DISPLAYED_SRS = 1

const { srs } = useXoVmDisksSrs(() => vm)

const displayedSrs = computed(() => srs.value.slice(0, MAX_DISPLAYED_SRS))

const hiddenSrsCount = computed(() => srs.value.length - displayedSrs.value.length)
</script>

<style lang="postcss" scoped>
.vm-dashboard-quick-info {
  .storage {
    display: flex;
    align-items: baseline;
    gap: 0.8rem;
  }

  .hidden-srs-count {
    flex-shrink: 0;
  }

  .value {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
