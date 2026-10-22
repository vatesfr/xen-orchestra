<template>
  <VtsStateHero v-if="pool === undefined" format="page" type="busy" size="medium" />
  <div v-else class="vm-firewall">
    <div class="column main">
      <UiCard class="status-card" :class="`status--${protection}`">
        <div class="status">
          <span class="status-icon"><VtsIcon :name="statusIcon" size="large" /></span>
          <div class="status-text">
            <span class="typo-h4">{{ t(`firewall:vm:status:${protection}`) }}</span>
            <span class="typo-body-regular">{{ statusDetail }}</span>
          </div>
          <UiButton
            v-if="isQuarantined"
            variant="primary"
            accent="brand"
            size="medium"
            left-icon="fa:lock-open"
            :busy="isUpdatingTags"
            @click="confirmQuarantine(false)"
          >
            {{ t('firewall:vm:release') }}
          </UiButton>
          <UiButton
            v-else
            variant="secondary"
            accent="danger"
            size="medium"
            left-icon="fa:lock"
            :busy="isUpdatingTags"
            @click="confirmQuarantine(true)"
          >
            {{ t('firewall:vm:quarantine') }}
          </UiButton>
        </div>
      </UiCard>

      <UiCard>
        <UiTitle>
          {{ t('firewall:vm:effective') }}
          <template #action>
            <UiLink :to="{ name: '/pool/[id]/firewall/policies', params: { id: pool.id } }" size="medium">
              {{ t('firewall:manage-policies') }}
            </UiLink>
          </template>
        </UiTitle>
        <UiInfo accent="info" wrap>{{ t('firewall:vm:effective:info') }}</UiInfo>
        <VdfEffectivePolicy :pool-id="pool.id" :document :vm-tags="vm.tags" :quarantined="isQuarantined" />
      </UiCard>

      <UiCard>
        <UiTitle>{{ t('firewall:vm:log') }}</UiTitle>
        <VdfRuleLogTable :pool-id="pool.id" :vm-name="vm.name_label" />
      </UiCard>
    </div>

    <div class="column side">
      <UiCard>
        <UiTitle>{{ t('firewall:groups') }}</UiTitle>
        <div v-if="vmGroups.length > 0" class="chips">
          <span v-for="name of vmGroups" :key="name" class="group">
            <VdfGroupChip :pool-id="pool.id" :group="name" />
            <UiButtonIcon
              v-tooltip="t('firewall:remove-from-group')"
              icon="fa:circle-minus"
              accent="danger"
              size="small"
              :disabled="isUpdatingTags"
              @click="removeVmFromGroup(vm, document.groups[name])"
            />
          </span>
        </div>
        <UiInfo v-else accent="muted" wrap>{{ t('firewall:vm:no-group') }}</UiInfo>
        <div v-if="joinableGroups.length > 0" class="join">
          <VtsSelect :id="joinSelectId" accent="brand" />
          <UiButton
            variant="secondary"
            accent="brand"
            size="medium"
            left-icon="fa:plus"
            :disabled="groupToJoin === ''"
            :busy="isUpdatingTags"
            @click="joinGroup()"
          >
            {{ t('firewall:add') }}
          </UiButton>
        </div>
        <UiInfo accent="muted" wrap>{{ t('firewall:vm:groups:info') }}</UiInfo>
      </UiCard>

      <UiCard>
        <UiTitle>{{ t('firewall:vm:interfaces') }}</UiTitle>
        <div v-for="vif of vmVifs" :key="vif.id" class="vif">
          <div class="vif-head">
            <span class="typo-body-bold">{{ t('vif-device', { device: vif.device }) }}</span>
            <span class="secondary typo-body-regular-small">{{ getNetworkById(vif.$network)?.name_label }}</span>
          </div>
          <div class="vif-details typo-body-regular-small">
            <code>{{ vif.MAC }}</code>
            <code v-for="ip of vifIps(vif.device)" :key="ip">{{ ip }}</code>
          </div>
          <UiInfo :accent="lockingAccent(vif.lockingMode)" wrap>
            {{ t(`firewall:vm:locking:${vif.lockingMode}`) }}
          </UiInfo>
        </div>
      </UiCard>

      <UiCard>
        <UiTitle>{{ t('firewall:vm:test') }}</UiTitle>
        <UiInfo accent="muted" wrap>{{ t('firewall:vm:test:info') }}</UiInfo>
        <div class="links">
          <UiLink
            :to="{ name: '/pool/[id]/firewall/trace', params: { id: pool.id }, query: { to: vm.id } }"
            size="medium"
            icon="fa:route"
          >
            {{ t('firewall:vm:test:to') }}
          </UiLink>
          <UiLink
            :to="{ name: '/pool/[id]/firewall/trace', params: { id: pool.id }, query: { from: vm.id } }"
            size="medium"
            icon="fa:route"
          >
            {{ t('firewall:vm:test:from') }}
          </UiLink>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfEffectivePolicy from '@/modules/vdf/components/VdfEffectivePolicy.vue'
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import VdfRuleLogTable from '@/modules/vdf/components/VdfRuleLogTable.vue'
import { useVdfMembership } from '@/modules/vdf/composables/vdf-membership.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { VDF_QUARANTINE_TAG } from '@/modules/vdf/types.ts'
import { effectiveTiers, vmGroupNames } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { useGetPoolById } = useXoPoolCollection()

const pool = useGetPoolById(() => vm.$pool)

// the pool is known by the time this tab is shown: the page waits for it
const { document } = useVdfPolicy(() => pool.value!)

const { setTags, removeVmFromGroup, setQuarantine, isUpdatingTags } = useVdfMembership()

const { vifs } = useXoVifCollection()

const { getNetworkById } = useXoNetworkCollection()

const isQuarantined = computed(() => vm.tags.includes(VDF_QUARANTINE_TAG))

const tiers = computed(() => effectiveTiers(vm.tags, document.value))

const protection = computed(() => {
  if (isQuarantined.value) {
    return 'quarantined'
  }

  return tiers.value.length > 0 ? 'protected' : 'unprotected'
})

const statusIcon = computed<IconName>(
  () => ({ quarantined: 'fa:lock', protected: 'fa:shield', unprotected: 'fa:lock-open' })[protection.value] as IconName
)

const statusDetail = computed(() => {
  if (protection.value === 'protected') {
    const policies = tiers.value.flatMap(tier => tier.policies.map(policy => policy.name))

    return t('firewall:vm:status:protected:detail', { n: policies.length, policies: policies.join(', ') })
  }

  return t(`firewall:vm:status:${protection.value}:detail`)
})

const vmGroups = computed(() => vmGroupNames(vm.tags, document.value))

const joinableGroups = computed(() =>
  Object.entries(document.value.groups)
    .filter(([name, group]) => (group.tags ?? []).length > 0 && !vmGroups.value.includes(name))
    .map(([name, group]) => ({ name, label: `${name} (${(group.tags ?? []).join(', ')})` }))
)

const groupToJoin = ref('')

const { id: joinSelectId } = useFormSelect(joinableGroups, {
  model: groupToJoin,
  placeholder: t('firewall:vm:join-group'),
  option: { id: 'name', value: 'name', label: 'label' },
})

async function joinGroup() {
  const group = document.value.groups[groupToJoin.value]

  if (group !== undefined) {
    await setTags([vm], group.tags ?? [], true)
    groupToJoin.value = ''
  }
}

const vmVifs = computed(() =>
  vifs.value.filter(vif => vif.$VM === vm.id).sort((vifA, vifB) => Number(vifA.device) - Number(vifB.device))
)

function vifIps(device: string) {
  return Object.entries(vm.addresses ?? {})
    .filter(([key, ip]) => key.startsWith(`${device}/`) && !ip.startsWith('fe80:'))
    .map(([, ip]) => ip)
}

function lockingAccent(mode: string): InfoAccent {
  return ({ locked: 'success', unlocked: 'warning', disabled: 'danger' } as Record<string, InfoAccent>)[mode] ?? 'muted'
}

const { open: openConfirm } = useOverlay({
  component: () => import('@/modules/vdf/components/VdfConfirmModal.vue'),
  events: { onConfirm: true, onCancel: true },
})

async function confirmQuarantine(quarantine: boolean) {
  const response = await openConfirm({
    props: quarantine
      ? {
          accent: 'danger',
          icon: 'fa:lock',
          title: t('firewall:vm:quarantine:title', { vm: vm.name_label }),
          message: t('firewall:vm:quarantine:message'),
          confirmLabel: t('firewall:vm:quarantine'),
        }
      : {
          accent: 'info',
          icon: 'fa:lock-open',
          title: t('firewall:vm:release:title', { vm: vm.name_label }),
          message: t('firewall:vm:release:message'),
          confirmLabel: t('firewall:vm:release'),
        },
  })

  if (response.event === 'onConfirm') {
    await setQuarantine(vm, quarantine)
  }
}
</script>

<style lang="postcss" scoped>
.vm-firewall {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(32rem, 1fr);
  gap: 0.8rem;
  margin: 0.8rem;
  align-items: start;

  @media (--small) {
    grid-template-columns: 1fr;
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .status-card {
    border: 0.1rem solid var(--vdf-status-item);
    background-color: var(--vdf-status-background);

    &.status--protected {
      --vdf-status-item: var(--color-success-item-base);
      --vdf-status-background: var(--color-success-background-selected);
    }

    &.status--quarantined {
      --vdf-status-item: var(--color-danger-item-base);
      --vdf-status-background: var(--color-danger-background-selected);
    }

    &.status--unprotected {
      --vdf-status-item: var(--color-neutral-txt-secondary);
      --vdf-status-background: var(--color-neutral-background-primary);
    }
  }

  .status {
    display: flex;
    align-items: center;
    gap: 2.4rem;
  }

  .status-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 5.6rem;
    height: 5.6rem;
    border-radius: 50%;
    color: var(--color-neutral-background-primary);
    background-color: var(--vdf-status-item);
  }

  .status-text {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1;
  }

  .chips,
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem 1.6rem;
  }

  .group {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .join {
    display: flex;
    gap: 0.8rem;

    & > :first-child {
      flex: 1;
    }
  }

  .vif {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;

    & + .vif {
      padding-block-start: 1.2rem;
      border-block-start: 0.1rem solid var(--color-neutral-border);
    }
  }

  .vif-head,
  .vif-details {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.8rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  code {
    font-family: monospace;
  }
}
</style>
