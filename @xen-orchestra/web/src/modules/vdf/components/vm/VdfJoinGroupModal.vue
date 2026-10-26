<template>
  <UiModal accent="info" icon="status:info-picto" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      <I18nT keypath="firewall:vm:join:title" scope="global" tag="div">
        <template #vm>
          <strong>{{ vmName }}</strong>
        </template>
        <template #group>
          <strong>{{ groupName }}</strong>
        </template>
      </I18nT>
    </template>
    <template #content>
      <div class="vdf-join-group-modal">
        <div class="tags typo-body-regular-small">
          <span>{{ t('firewall:vm:join:tags') }}</span>
          <UiTagsList>
            <VtsTag v-for="tag of tags" :key="tag" :value="tag" />
          </UiTagsList>
        </div>
        <UiAlert v-if="protectedBy.length > 0" accent="warning">
          {{ t('firewall:vm:join:protected-by', { n: protectedBy.length, policies }) }}
        </UiAlert>
        <UiAlert v-else accent="info">{{ t('firewall:vm:join:no-policy') }}</UiAlert>
        <!-- vdf#86: a monitored policy of the group an enforced one decides first for -->
        <UiAlert v-for="text of monitorBlind" :key="text" accent="warning">{{ text }}</UiAlert>
        <UiAlert v-if="protectedBy.length > 0 && trafficRules > 0" accent="warning">
          {{ t('firewall:vm:join:traffic-rules', { n: trafficRules }, trafficRules) }}
        </UiAlert>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>{{ t('firewall:vm:join') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'

// Joining a group tags the VM right away, without publishing: the group's
// policies then decide its inbound traffic
const {
  protectedBy,
  trafficRules = 0,
  monitorBlind = [],
} = defineProps<{
  vmName: string
  groupName: string
  tags: string[]
  // published policies protecting the group
  protectedBy: string[]
  // XO's Traffic Rules on the VM (vdf#40)
  trafficRules?: number
  // the group's monitored policies an enforced one decides first for on
  // the VM (vdf#86): why their report won't show its traffic
  monitorBlind?: string[]
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t, locale } = useI18n()

const policies = computed(() => new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(protectedBy))
</script>

<style lang="postcss" scoped>
.vdf-join-group-modal {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  max-width: 56rem;
  text-align: start;

  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
