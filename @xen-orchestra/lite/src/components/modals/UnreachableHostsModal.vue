<template>
  <UiModal color="error" @submit="modal.approve()">
    <ConfirmModalLayout :icon="faServer">
      <template #title>{{ t('unreachable-hosts') }}</template>

      <template #default>
        <div class="description">
          <p>{{ t('following-hosts-unreachable') }}</p>
          <p>{{ t('allow-self-signed-ssl') }}</p>
          <ul>
            <li v-for="url in urls" :key="url">
              <a :href="url" class="link" rel="noopener noreferrer" target="_blank">
                {{ url }}
              </a>
            </li>
          </ul>
        </div>
      </template>

      <template #buttons>
        <ModalDeclineButton />
        <ModalApproveButton>
          {{ t('unreachable-hosts-reload-page') }}
        </ModalApproveButton>
      </template>
    </ConfirmModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import ConfirmModalLayout from '@/components/ui/modals/layouts/ConfirmModalLayout.vue'
import ModalApproveButton from '@/components/ui/modals/ModalApproveButton.vue'
import ModalDeclineButton from '@/components/ui/modals/ModalDeclineButton.vue'
import UiModal from '@/components/ui/modals/UiModal.vue'
import { IK_MODAL } from '@/types/injection-keys'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  urls: string[]
}>()

const { t } = useI18n()

const modal = inject(IK_MODAL)!
</script>

<style lang="postcss" scoped>
.description {
  text-align: center;

  p {
    margin: 1rem 0;
  }
}
</style>
