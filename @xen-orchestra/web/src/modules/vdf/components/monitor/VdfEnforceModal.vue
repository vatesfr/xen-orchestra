<template>
  <UiModal
    :accent="total > 0 ? 'warning' : 'info'"
    icon="fa:shield"
    class="vdf-enforce-modal"
    @confirm="emit('confirm')"
    @dismiss="emit('cancel')"
  >
    <template #title>{{ t('firewall:enforce:title', { policy }) }}</template>
    <template #content>
      <div class="content">
        <p v-if="total === 0">{{ t('firewall:enforce:clean') }}</p>
        <template v-else>
          <p>{{ t('firewall:enforce:would-drop', { n: total }, total) }}</p>
          <ul class="flows typo-body-regular-small">
            <li v-for="flow of flows" :key="flow.key">
              <span>{{ flow.text }}</span>
              <span class="secondary">{{ t('firewall:enforce:times', { n: n(flow.count) }, flow.count) }}</span>
            </li>
          </ul>
          <p v-if="total > flows.length" class="secondary typo-body-regular-small">
            {{ t('firewall:more', { n: total - flows.length }) }}
          </p>
        </template>
        <p class="secondary typo-body-regular-small">{{ t('firewall:enforce:draft') }}</p>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>{{ t('firewall:mode:switch-enforce') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

// Before a monitored policy enforces: what it would have dropped in the
// last day, as its report counts it (the flows not expected nor allowed by
// a published rule since), the busiest first. Nothing: say it's clean.
defineProps<{
  policy: string
  // flows it would have dropped
  total: number
  // the busiest of them (count: packets the hosts sampled, a lower bound)
  flows: { key: string; text: string; count: number }[]
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t, n } = useI18n()
</script>

<style lang="postcss" scoped>
.vdf-enforce-modal {
  .content {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    max-width: 56rem;
    text-align: start;
  }

  .flows {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin: 0;
    padding-inline-start: 1.6rem;

    li {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;
    }
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
