<template>
  <UiModal
    :accent="draftChangeCount > 0 ? 'warning' : 'info'"
    icon="action:undo"
    @confirm="emit('confirm')"
    @dismiss="emit('cancel')"
  >
    <template #title>{{ t('firewall:history:restore:title') }}</template>
    <template #content>
      <div class="vdf-restore-version-modal">
        <p>{{ t('firewall:history:restore:message', { date: publishedLabel }) }}</p>
        <p v-if="draftChangeCount > 0">
          {{ t('firewall:history:restore:replaces', { n: draftChangeCount }, draftChangeCount) }}
        </p>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>{{ t('firewall:history:restore') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { publishedAt } = defineProps<{
  // null: what the pool held before XO kept a history
  publishedAt: string | null
  // unpublished changes the restore replaces
  draftChangeCount: number
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t, d } = useI18n()

const publishedLabel = computed(() =>
  publishedAt === null
    ? t('firewall:history:before-history')
    : d(publishedAt, { dateStyle: 'medium', timeStyle: 'short' })
)
</script>

<style lang="postcss" scoped>
.vdf-restore-version-modal {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
