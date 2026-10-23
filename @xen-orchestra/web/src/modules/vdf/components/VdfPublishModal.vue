<template>
  <UiModal :accent icon="fa:shield" @confirm="canPublish && emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      {{ isGlobalScope(scopeId) ? t('firewall:global:publish:title') : t('firewall:publish:title') }}
    </template>
    <template #content>
      <div class="vdf-publish-modal">
        <UiAlert v-if="isOutdated" accent="warning">
          {{ t('firewall:publish:outdated') }}
          <template #description>
            <UiButton variant="secondary" accent="warning" size="small" @click="emit('rebase')">
              {{ t('firewall:draft:rebase') }}
            </UiButton>
          </template>
        </UiAlert>

        <section class="section">
          <h3 class="typo-body-bold">{{ t('firewall:draft:changes', { n: changeCount }, changeCount) }}</h3>
          <div class="changes">
            <VdfChangeList :details :member-count :is-global="isGlobalScope(scopeId)" />
          </div>
        </section>

        <section v-if="warnings.length > 0" class="section">
          <h3 class="typo-body-bold">{{ t('firewall:publish:warnings') }}</h3>
          <UiInfo v-for="warning of warnings" :key="warning.key" accent="warning" wrap>{{ warning.text }}</UiInfo>
        </section>

        <section v-if="!isOutdated" class="section">
          <h3 class="typo-body-bold">{{ t('firewall:publish:validation') }}</h3>
          <UiInfo v-if="checkResult === undefined && checkError === undefined" accent="muted">
            <span class="checking"><VtsIcon name="fa:spinner" size="small" />{{ t('firewall:publish:checking') }}</span>
          </UiInfo>
          <UiInfo v-else-if="checkError !== undefined" accent="danger" wrap>
            {{ t('firewall:publish:validation-failed', { error: checkError }) }}
          </UiInfo>
          <template v-else-if="checkResult?.pools !== undefined">
            <UiInfo v-if="checkResult.error" accent="danger" wrap>
              {{ t('firewall:publish:validation-failed', { error: checkResult.error }) }}
            </UiInfo>
            <div v-for="pool of checkResult.pools" :key="pool.id" class="pool-result">
              <span class="typo-body-bold-small pool-name">{{ pool.name }}</span>
              <UiInfo v-if="pool.skipped" accent="muted" wrap>{{ t('firewall:global:check:out-of-scope') }}</UiInfo>
              <UiInfo v-else-if="pool.unreachable" accent="warning" wrap>
                {{ t('firewall:global:check:unreachable') }}
              </UiInfo>
              <UiInfo v-else-if="pool.otherXo" accent="warning" wrap>
                {{ t('firewall:global:check:other-xo', { xo: pool.owner }) }}
              </UiInfo>
              <UiInfo
                v-else-if="pool.ok"
                v-tooltip="t('firewall:publish:valid:details', { version: pool.version, keys: pool.keys?.join(', ') })"
                accent="success"
                wrap
              >
                {{ pool.inScope ? t('firewall:publish:valid') : t('firewall:global:check:removed') }}
              </UiInfo>
              <UiInfo v-else accent="danger" wrap>
                {{ t('firewall:publish:validation-failed', { error: pool.error }) }}
              </UiInfo>
              <UiInfo v-for="warning of pool.warnings ?? []" :key="warning" accent="warning" wrap>
                {{ warning }}
              </UiInfo>
            </div>
          </template>
          <template v-else-if="checkResult !== undefined">
            <UiInfo
              v-if="checkResult.ok"
              v-tooltip="
                t('firewall:publish:valid:details', {
                  version: checkResult.version,
                  keys: checkResult.keys?.join(', '),
                })
              "
              accent="success"
              wrap
            >
              {{ t('firewall:publish:valid') }}
            </UiInfo>
            <UiInfo v-else accent="danger" wrap>
              {{ t('firewall:publish:validation-failed', { error: checkResult.error }) }}
            </UiInfo>
            <UiInfo v-for="warning of checkResult.warnings ?? []" :key="warning" accent="warning" wrap>
              {{ warning }}
            </UiInfo>
          </template>
        </section>

        <UiAlert v-if="publishError" accent="danger">{{ publishError }}</UiAlert>
        <UiAlert v-else-if="!isOutdated" accent="info">
          {{ isGlobalScope(scopeId) ? t('firewall:global:publish:effect') : t('firewall:publish:effect') }}
        </UiAlert>
        <UiInfo v-if="isRejected" accent="danger" wrap>{{ t('firewall:publish:fix-errors') }}</UiInfo>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton :disabled="!canPublish">{{ t('firewall:publish') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VdfChangeList from '@/modules/vdf/components/history/VdfChangeList.vue'
import { checkVdfDocument, fetchVdfOpenConnections } from '@/modules/vdf/jobs/vdf-publish.job.ts'
import type { VdfCheckResult, VdfDocument, VdfScopeId } from '@/modules/vdf/types.ts'
import { changeDetails, publishWarnings } from '@/modules/vdf/utils/vdf-change.util.ts'
import { displayName, globalRuleId, isGlobalScope } from '@/modules/vdf/utils/vdf-global.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiModal, { type ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { scopeId, document, baseDocument, changeCount, isOutdated, memberCounts } = defineProps<{
  scopeId: VdfScopeId
  document: VdfDocument
  // the published document the draft started from
  baseDocument: VdfDocument
  changeCount: number
  // someone published since: the draft must be rebased first
  isOutdated: boolean
  // VMs per group; undefined while VMs load
  memberCounts?: Record<string, number>
  publishError?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
  rebase: []
}>()

const { t, n } = useI18n()

// the draft's own changes, never what others published meanwhile
const details = computed(() => changeDetails(baseDocument, document))

const memberCount = (group: string) => memberCounts?.[group]

// open connections per rule, for the rules the draft removes (one sample
// of the pool's live stats)
const openConnections = ref<Map<number, number>>()

const warnings = computed(() =>
  publishWarnings(details.value, {
    memberCount,
    openConnections: id => openConnections.value?.get(id),
  }).map(warning => {
    const policy = displayName(warning.policy)

    if (warning.type === 'open-connections') {
      return {
        key: `${warning.type}:${warning.rule}`,
        text: t(
          'firewall:publish:warning:open-connections',
          { rule: globalRuleId(warning.rule), policy, n: n(warning.count) },
          warning.count
        ),
      }
    }

    return {
      key: `${warning.type}:${warning.policy}`,
      text: t(`firewall:publish:warning:${warning.type}`, { policy, group: displayName(warning.group) }),
    }
  })
)

const isRisky = computed(
  () =>
    warnings.value.length > 0 ||
    details.value.groups.some(change => change.type === 'removed') ||
    details.value.policies.some(
      change => change.type === 'removed' || change.rules.some(rule => rule.type === 'removed')
    )
)

const accent = computed<ModalAccent>(() => (isOutdated || isRisky.value ? 'warning' : 'info'))

// what the pool master's agent makes of the draft, before anything is written
const checkResult = ref<VdfCheckResult>()

const checkError = ref<string>()

const isRejected = computed(() => checkError.value !== undefined || checkResult.value?.ok === false)

const canPublish = computed(() => !isOutdated && changeCount > 0 && checkResult.value?.ok === true)

onMounted(async () => {
  if (!isGlobalScope(scopeId) && details.value.policies.some(change => change.rules.some(r => r.type === 'removed'))) {
    fetchVdfOpenConnections(scopeId).then(
      counts => (openConnections.value = counts),
      () => undefined
    )
  }

  if (isOutdated) {
    return
  }

  try {
    checkResult.value = await checkVdfDocument(scopeId, document)
  } catch (error) {
    checkError.value = (error as Error).message
  }
})
</script>

<style lang="postcss" scoped>
.vdf-publish-modal {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  text-align: start;
  min-width: min(64rem, 80vw);

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .changes {
    max-height: 32rem;
    overflow: auto;
  }

  .pool-result {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .pool-name {
    color: var(--color-neutral-txt-secondary);
  }

  .checking {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
