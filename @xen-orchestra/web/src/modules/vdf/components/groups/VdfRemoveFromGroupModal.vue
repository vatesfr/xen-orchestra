<template>
  <UiModal accent="danger" icon="action:remove" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      <I18nT v-if="groupName" keypath="firewall:remove-vm:title" scope="global" tag="div">
        <template #vm>
          <strong>{{ vmName }}</strong>
        </template>
        <template #group>
          <strong>{{ groupName }}</strong>
        </template>
      </I18nT>
      <I18nT v-else keypath="firewall:remove-vm:title:any" scope="global" tag="div">
        <template #vm>
          <strong>{{ vmName }}</strong>
        </template>
      </I18nT>
    </template>
    <template #content>
      <div class="vdf-remove-from-group-modal">
        <div class="tags">
          <span>{{ t('firewall:remove-vm:tags', { n: tags.length }) }}</span>
          <UiTagsList>
            <VtsTag v-for="tag of tags" :key="tag" :value="tag" />
          </UiTagsList>
        </div>
        <UiAlert v-if="losesProtection" accent="danger">{{ t('firewall:remove-vm:unprotected') }}</UiAlert>
        <ul v-if="protectedBy.length > 0 || sourceIn.length > 0 || alsoLeaves.length > 0" class="effects">
          <li v-if="protectedBy.length > 0">
            {{ t('firewall:remove-vm:protected-by', { policies: list(protectedBy) }) }}
          </li>
          <li v-if="sourceIn.length > 0">{{ t('firewall:remove-vm:source-in', { policies: list(sourceIn) }) }}</li>
          <li v-if="alsoLeaves.length > 0">
            {{ t('firewall:remove-vm:also-leaves', { groups: list(alsoLeaves) }) }}
          </li>
        </ul>
        <UiAlert v-for="item of takesOver" :key="item.policy" accent="warning">
          {{
            t(item.monitored ? 'firewall:remove-vm:takes-over:monitored' : 'firewall:remove-vm:takes-over', {
              policy: item.policy,
              policies: list(item.instead),
            })
          }}
        </UiAlert>
        <UiAlert accent="warning">{{ t('firewall:remove-vm:effect') }}</UiAlert>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>{{ t('firewall:remove-from-group') }}</VtsOverlayConfirmButton>
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
import { I18nT, useI18n } from 'vue-i18n'

const { takesOver = [] } = defineProps<{
  vmName: string
  // unknown when the caller didn't give the scope's document
  groupName?: string
  // the tags removed: only those no other group of the VM needs
  tags: string[]
  // groups the VM leaves too, sharing the only tags it could lose
  alsoLeaves: string[]
  protectedBy: string[]
  sourceIn: string[]
  // no policy protects the VM anymore once it has left
  losesProtection: boolean
  // policies of the same tier still applying whose default drop then
  // decides what the policies it leaves allowed (vdf#86)
  takesOver?: { policy: string; monitored: boolean; instead: string[] }[]
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t, locale } = useI18n()

function list(items: string[]) {
  return new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(items)
}
</script>

<style lang="postcss" scoped>
.vdf-remove-from-group-modal {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  min-width: min(56rem, 80vw);
  text-align: start;

  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  .effects {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-inline-start: 2rem;
    list-style: disc;
  }
}
</style>
