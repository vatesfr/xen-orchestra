<template>
  <UiModal accent="info" icon="fa:traffic-rule" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>{{ t('firewall:publish:title') }}</template>
    <template #content>
      <div class="vdf-publish-modal">
        <section class="section">
          <div class="typo-body-bold">{{ t('firewall:draft:changes', { n: changes.length }) }}</div>
          <ul class="changes">
            <li v-for="(change, index) of changes" :key="index" class="change typo-body-regular-small">
              <UiTag :accent="changeAccents[change.type]" variant="secondary" class="change-type">
                {{ t(`firewall:change:${change.type}`) }}
              </UiTag>
              <span>{{ describeChange(change) }}</span>
            </li>
          </ul>
        </section>

        <section class="section">
          <div class="typo-body-bold">{{ t('firewall:publish:validation') }}</div>
          <UiInfo v-if="checkResult === undefined && checkError === undefined" accent="muted">
            <span class="checking"><VtsIcon name="fa:spinner" size="small" />{{ t('firewall:publish:checking') }}</span>
          </UiInfo>
          <UiInfo v-else-if="checkError !== undefined" accent="danger" wrap>{{ checkError }}</UiInfo>
          <template v-else-if="checkResult !== undefined">
            <UiInfo v-if="checkResult.ok" accent="success" wrap>
              {{ t('firewall:publish:valid', { version: checkResult.version, keys: checkResult.keys?.join(', ') }) }}
            </UiInfo>
            <UiInfo v-else accent="danger" wrap>{{ checkResult.error }}</UiInfo>
            <UiInfo v-for="warning of checkResult.warnings ?? []" :key="warning" accent="warning" wrap>
              {{ warning }}
            </UiInfo>
          </template>
        </section>

        <UiAlert v-if="publishError" accent="danger">{{ publishError }}</UiAlert>
        <UiAlert v-else accent="info">{{ t('firewall:publish:effect') }}</UiAlert>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton v-if="checkResult?.ok">{{ t('firewall:publish') }}</VtsOverlayConfirmButton>
      <UiButton v-else variant="primary" accent="brand" size="medium" disabled>{{ t('firewall:publish') }}</UiButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import { checkVdfDocument } from '@/modules/vdf/jobs/vdf-publish.job.ts'
import type { VdfCheckResult, VdfDocument } from '@/modules/vdf/types.ts'
import { serializeDocument, type VdfChange } from '@/modules/vdf/utils/vdf-policy.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolId, document } = defineProps<{
  poolId: string
  document: VdfDocument
  changes: VdfChange[]
  publishError?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

const changeAccents: Record<VdfChange['type'], TagAccent> = {
  added: 'success',
  removed: 'danger',
  modified: 'info',
  moved: 'neutral',
}

function describeChange(change: VdfChange) {
  if (change.kind === 'rule') {
    return change.type === 'moved'
      ? t('firewall:change:rules-reordered', { policy: change.context })
      : t('firewall:change:rule', { id: change.label, policy: change.context })
  }

  if (change.kind === 'policy') {
    if (change.type === 'moved') {
      return t('firewall:change:policies-reordered')
    }

    return change.label === '' ? t('firewall:change:settings') : t('firewall:change:policy', { name: change.label })
  }

  return t('firewall:change:group', { name: change.label })
}

// what the pool master's agent makes of the draft, before anything is written
const checkResult = ref<VdfCheckResult>()

const checkError = ref<string>()

onMounted(async () => {
  try {
    checkResult.value = await checkVdfDocument(poolId, serializeDocument(document))
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
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-height: 24rem;
    overflow: auto;
  }

  .change {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .change-type {
    min-width: 8rem;
  }

  .checking {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
