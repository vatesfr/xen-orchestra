<template>
  <VtsSidePanel :has-selection="name !== undefined" @close="emit('close')">
    <template v-if="name !== undefined && group !== undefined" #actions>
      <UiButton size="medium" variant="tertiary" accent="brand" left-icon="action:edit" @click="emit('edit')">
        {{ t('action:edit') }}
      </UiButton>
    </template>

    <template v-if="name !== undefined && group !== undefined" #default>
      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="name" icon="fa:object-group" />
        <VtsCardRowKeyValue align-top>
          <template #key>{{ t('firewall:group-form:tags') }}</template>
          <template #value>
            <div class="chips">
              <VtsTag v-for="tag of group.tags ?? []" :key="tag" :value="tag" />
              <span v-if="!group.tags?.length" class="secondary">{{ t('none') }}</span>
            </div>
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue align-top>
          <template #key>{{ t('firewall:group-form:ips') }}</template>
          <template #value>
            <div class="chips">
              <code v-for="ip of group.ips ?? []" :key="ip">{{ ip }}</code>
              <span v-if="!group.ips?.length" class="secondary">{{ t('none') }}</span>
            </div>
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue align-top>
          <template #key>{{ t('firewall:used-by') }}</template>
          <template #value>
            <div class="usage">
              <RouterLink
                v-for="policy of usage.appliedTo"
                :key="`applied:${policy}`"
                :to="{ name: '/pool/[id]/firewall/policies', params: { id: poolId }, query: { policy } }"
              >
                {{ t('firewall:used-by:protected', { policy }) }}
              </RouterLink>
              <RouterLink
                v-for="policy of usage.sourceOf"
                :key="`source:${policy}`"
                :to="{ name: '/pool/[id]/firewall/policies', params: { id: poolId }, query: { policy } }"
              >
                {{ t('firewall:used-by:source', { policy }) }}
              </RouterLink>
              <span v-if="usage.appliedTo.length + usage.sourceOf.length === 0" class="secondary">
                {{ t('firewall:used-by:none') }}
              </span>
            </div>
          </template>
        </VtsCardRowKeyValue>
      </UiPanelCard>

      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="t('vms')" icon="object:vm" :counter="members.length">
          <template v-if="group.tags?.length" #action>
            <UiButton
              size="small"
              variant="tertiary"
              accent="brand"
              left-icon="fa:plus"
              :busy="isUpdatingTags"
              @click="emit('addVms')"
            >
              {{ t('firewall:add-vms') }}
            </UiButton>
          </template>
        </UiPanelCardTitle>
        <UiInfo v-if="!group.tags?.length" accent="muted" wrap>{{ t('firewall:group-form:preview:no-tags') }}</UiInfo>
        <UiInfo v-else-if="members.length === 0" accent="muted" wrap>{{ t('firewall:group:no-member') }}</UiInfo>
        <div v-for="vm of members" :key="vm.id" class="member">
          <div class="member-head">
            <UiObjectLink :route="{ name: '/vm/[id]/firewall', params: { id: vm.id } }" :icon="vmIcon(vm)">
              {{ vm.name_label }}
            </UiObjectLink>
            <UiButtonIcon
              v-tooltip="t('firewall:remove-from-group')"
              icon="fa:circle-minus"
              accent="danger"
              size="small"
              :disabled="isUpdatingTags"
              @click="emit('removeVm', vm)"
            />
          </div>
          <div class="member-details typo-body-regular-small">
            <code v-for="ip of vmIps(vm)" :key="ip">{{ ip }}</code>
            <UiInfo :accent="isLocked(vm) ? 'success' : 'warning'">
              {{ isLocked(vm) ? t('firewall:vif-locked') : t('firewall:vif-unlocked') }}
            </UiInfo>
            <span v-if="vm.power_state !== 'Running'" class="secondary">{{ t('firewall:not-running') }}</span>
          </div>
        </div>
      </UiPanelCard>
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import type { VdfGroup } from '@/modules/vdf/types.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { IconName } from '@core/icons'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  poolId: string
  name: string | undefined
  group: VdfGroup | undefined
  members: FrontXoVm[]
  usage: { appliedTo: string[]; sourceOf: string[] }
  isUpdatingTags: boolean
}>()

const emit = defineEmits<{
  close: []
  edit: []
  addVms: []
  removeVm: [vm: FrontXoVm]
}>()

const { t } = useI18n()

const { vifs } = useXoVifCollection()

function vmIcon(vm: FrontXoVm) {
  return `object:vm:${vm.power_state.toLowerCase()}` as IconName
}

function vmIps(vm: FrontXoVm) {
  return [...new Set(Object.values(vm.addresses ?? {}))].filter(ip => !ip.startsWith('fe80:')).slice(0, 3)
}

function isLocked(vm: FrontXoVm) {
  const vmVifs = vifs.value.filter(vif => vif.$VM === vm.id)

  return vmVifs.length > 0 && vmVifs.every(vif => vif.lockingMode === 'locked')
}
</script>

<style lang="postcss" scoped>
.chips,
.usage,
.member-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
}

.usage {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}

.member {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-block: 0.8rem;
  border-block-start: 0.1rem solid var(--color-neutral-border);
}

.member-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.secondary {
  color: var(--color-neutral-txt-secondary);
}

code {
  font-family: monospace;
}
</style>
