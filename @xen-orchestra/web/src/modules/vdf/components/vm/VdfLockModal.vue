<template>
  <VdfContentModal accent="info" :size="isBulk ? 'large' : 'medium'" @confirm="submit()" @dismiss="emit('cancel')">
    <template #title>
      <template v-if="isBulk">{{ t('firewall:lock:title:group', { group, n: targets.length }) }}</template>
      <template v-else-if="isRelock">
        {{ t('firewall:lock:title:relock', { device: targets[0].device, vm: targets[0].vmName }) }}
      </template>
      <template v-else>{{ t('firewall:lock:title', { device: targets[0].device, vm: targets[0].vmName }) }}</template>
    </template>
    <template #content>
      <div class="vdf-lock-modal">
        <p v-if="isRelock">
          {{
            t(isWithVdf(rows[0]) ? 'firewall:lock:relock:message:vdf' : 'firewall:lock:relock:message', {
              allowed: formatAddressList(targets[0].lockedTo ?? []) || t('none'),
              reported: formatAddressList(newAddresses),
            })
          }}
        </p>
        <p>{{ t(isBulk ? 'firewall:lock:message:group' : 'firewall:lock:message') }}</p>

        <ul class="rows">
          <li v-for="row of rows" :key="row.target.vifId" class="row">
            <div class="row-head">
              <UiCheckbox
                v-if="isBulk"
                v-model="row.selected"
                accent="brand"
                :disabled="isLocked(row)"
                :aria-label="rowLabel(row.target)"
              />
              <span class="typo-body-bold">{{ row.target.vmName }}</span>
              <span class="secondary typo-body-regular-small">
                {{
                  t('firewall:live:interface', { device: row.target.device, network: row.target.networkName ?? '?' })
                }}
              </span>
              <UiInfo v-if="isLocked(row)" accent="success">
                {{ t(isWithVdf(row) ? 'firewall:lock:locked:vdf' : 'firewall:lock:locked') }}
              </UiInfo>
              <UiTag v-else-if="isBulk && isWithVdf(row)" accent="info" variant="secondary">
                {{ t('firewall:lock:with-vdf') }}
              </UiTag>
            </div>
            <UiTextarea
              v-if="!isLocked(row)"
              v-model="row.text"
              :accent="rowMessage(row)?.accent ?? 'brand'"
              :disabled="isBulk && !row.selected"
              :rows="Math.max(isBulk ? 1 : 2, row.target.addresses.length)"
              :aria-label="t('firewall:lock:addresses-of', { label: rowLabel(row.target) })"
              :placeholder="t('firewall:lock:addresses:placeholder')"
              class="addresses"
              @input="isBulk && row.text.trim() !== '' && (row.selected = true)"
            >
              <template v-if="!isBulk">{{ t('firewall:lock:addresses') }}</template>
            </UiTextarea>
            <!-- UiTextarea's own message doesn't wrap -->
            <UiInfo v-if="!isLocked(row) && rowMessage(row)" :accent="rowMessage(row)!.accent" wrap>
              {{ rowMessage(row)!.content }}
            </UiInfo>
            <div v-if="!isLocked(row) && row.target.optional.length > 0" class="optional">
              <span class="typo-body-regular-small">{{ t('firewall:lock:temporary') }}</span>
              <UiCheckbox
                v-for="ip of row.target.optional"
                :key="ip"
                v-model="row.extras[ip]"
                accent="brand"
                :disabled="isBulk && !row.selected"
                @update:model-value="checked => isBulk && checked && (row.selected = true)"
              >
                <code>{{ ip }}</code>
              </UiCheckbox>
              <span class="secondary typo-body-regular-small">{{ t('firewall:lock:temporary:note') }}</span>
            </div>
            <UiInfo v-if="state.errors[row.target.vifId] && !isLocked(row)" accent="danger" wrap>
              {{ t('firewall:lock:failed', { error: state.errors[row.target.vifId] }) }}
            </UiInfo>
            <!-- vdf#41: XAPI refused because an SDN controller is registered -->
            <template v-if="isSdnRefused(row) && !isLocked(row)">
              <UiInfo v-if="row.target.vdfUnavailable === undefined" accent="info" wrap>
                {{ t('firewall:lock:vdf-offer', { host: row.target.hostName ?? '?' }) }}
              </UiInfo>
              <UiInfo v-else accent="warning" wrap>
                {{
                  t(`firewall:lock:vdf-unavailable:${row.target.vdfUnavailable}`, { host: row.target.hostName ?? '?' })
                }}
              </UiInfo>
            </template>
          </li>
        </ul>

        <UiAlert accent="warning">
          {{ t(rows.every(row => isWithVdf(row)) ? 'firewall:lock:dhcp-warning:vdf' : 'firewall:lock:dhcp-warning') }}
        </UiAlert>
        <UiAlert v-if="rows.some(row => isWithVdf(row))" accent="info">
          {{ t('firewall:lock:vdf-note') }}
          <template #description>{{ t('firewall:lock:vdf-link-local') }}</template>
        </UiAlert>
        <UiAlert v-if="state.error" accent="danger">{{ state.error }}</UiAlert>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">
        {{ state.locked.length > 0 ? t('action:close') : t('cancel') }}
      </VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>
        {{
          isBulk
            ? t('firewall:lock:confirm:group', { n: toLock.length })
            : t(isWithVdf(rows[0]) ? 'firewall:lock:confirm:vdf' : 'firewall:lock:confirm')
        }}
      </VtsOverlayConfirmButton>
    </template>
  </VdfContentModal>
</template>

<script lang="ts" setup>
import VdfContentModal from '@/modules/vdf/components/VdfContentModal.vue'
import type { VdfLockState, VdfLockTarget } from '@/modules/vdf/composables/vdf-lock.composable.ts'
import type { VdfLockRequest } from '@/modules/vdf/jobs/vdf-lock.job.ts'
import { formatAddressList, isAllowed, parseAddressList } from '@/modules/vdf/utils/vdf-locking.util.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// Locking interfaces to their addresses (vdf#15): the addresses the guest
// reports are proposed, and can be edited. An interface locked to none
// would be cut off, so one without reported addresses asks for them. In a
// group's confirmation, each row can be left out; one with no address
// starts left out. One XAPI refuses to lock while an SDN controller is
// registered is offered a VDF lock (vdf#41): confirming again locks it
// with VDF, where the agent of its host supports it.
const { targets, group, state } = defineProps<{
  targets: VdfLockTarget[]
  // a group's interfaces at once
  group?: string
  // filled in by the caller as the lock runs
  state: VdfLockState
}>()

// confirm only with valid addresses for every interface to lock
const emit = defineEmits<{
  confirm: [requests: VdfLockRequest[]]
  cancel: []
}>()

const { t } = useI18n()

const isBulk = computed(() => group !== undefined)

const isRelock = computed(() => !isBulk.value && targets[0].lockedTo !== undefined)

// a relock: the addresses its guest moved to
const newAddresses = computed(() => targets[0].addresses.filter(ip => !isAllowed(ip, targets[0].lockedTo ?? [])))

type Row = {
  target: VdfLockTarget
  text: string
  selected: boolean
  // the temporary IPv6 addresses ticked
  extras: Record<string, boolean>
}

const rows = reactive<Row[]>(
  targets.map(target => ({
    target,
    text: target.addresses.join('\n'),
    selected: !isBulk.value || target.addresses.length > 0,
    extras: Object.fromEntries(target.optional.map(ip => [ip, false])),
  }))
)

const isLocked = (row: Row) => state.locked.includes(row.target.vifId)

// vdf#41: XAPI refused to lock it, an SDN controller being registered
const isSdnRefused = (row: Row) => state.sdnRefused.includes(row.target.vifId)

// locked with VDF: a relock of a VDF lock, or one XAPI refused that VDF
// can lock (confirming again is the user's choice)
const isWithVdf = (row: Row) =>
  row.target.lock === 'vdf' ||
  row.target.lock === 'vdf-unenforced' ||
  (isSdnRefused(row) && row.target.vdfUnavailable === undefined)

// the rows confirming sends: selected, and not locked yet
const toLock = computed(() => rows.filter(row => row.selected && !isLocked(row)))

// set once confirming was tried: a missing address is then an error
const isSubmitted = ref(false)

const rowLabel = (target: VdfLockTarget) =>
  t('firewall:overview:lock-issue', { vm: target.vmName, device: target.device, network: target.networkName ?? '?' })

// what's typed, and the temporary addresses ticked
const rowAddresses = (row: Row) =>
  parseAddressList([row.text, ...row.target.optional.filter(ip => row.extras[ip])].join('\n'))

function rowError(row: Row) {
  if (!row.selected || isLocked(row)) {
    return undefined
  }

  const { ipv4, ipv6, invalid } = rowAddresses(row)

  if (invalid.length > 0) {
    return t('firewall:lock:invalid', { addresses: invalid.join(', '), n: invalid.length })
  }

  if (ipv4.length + ipv6.length === 0 && isSubmitted.value) {
    return t('firewall:lock:required')
  }

  return undefined
}

function rowMessage(row: Row): { content: string; accent: 'danger' | 'warning' } | undefined {
  const error = rowError(row)

  if (error !== undefined) {
    return { content: error, accent: 'danger' }
  }

  if (row.target.addresses.length === 0) {
    return {
      content: t(row.target.optional.length > 0 ? 'firewall:lock:none-stable' : 'firewall:lock:none-reported'),
      accent: 'warning',
    }
  }

  return undefined
}

function submit() {
  isSubmitted.value = true

  if (toLock.value.length === 0 || toLock.value.some(row => rowError(row) !== undefined)) {
    return
  }

  emit(
    'confirm',
    toLock.value.map(row => {
      const { ipv4, ipv6 } = rowAddresses(row)

      return {
        vifId: row.target.vifId,
        ipv4,
        ipv6,
        withVdf: isWithVdf(row),
        xapiLocked: row.target.lock === 'xapi',
      }
    })
  )
}
</script>

<style lang="postcss" scoped>
.vdf-lock-modal {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .rows {
    display: flex;
    flex-direction: column;
  }

  .row {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding-block: 1.2rem;

    & + .row {
      border-block-start: 0.1rem solid var(--color-neutral-border);
    }

    &:first-child {
      padding-block-start: 0;
    }
  }

  .optional {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .row-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.8rem;
    min-width: 0;
  }

  /* as high as its addresses, not the textarea's fixed height */
  .addresses:deep(.textarea) {
    height: auto;
    resize: vertical;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
