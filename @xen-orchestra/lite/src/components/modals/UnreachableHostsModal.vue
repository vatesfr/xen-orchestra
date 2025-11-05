<template>
  <VtsModal accent="danger" icon="fa:server">
    <template #title>{{ t('unreachable-hosts') }}</template>
    <template #content>
      <div class="description">
        <p>{{ t('following-hosts-unreachable') }}</p>
        <p>{{ t('allow-self-signed-ssl') }}</p>
        <ul>
          <li v-for="url in urls" :key="url">
            <UiLink size="medium" :href="url">{{ url }}</UiLink>
          </li>
        </ul>
      </div>
    </template>
    <template #buttons>
      <VtsModalCancelButton />
      <VtsModalConfirmButton>
        {{ t('unreachable-hosts-reload-page') }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  urls: string[]
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.description {
  text-align: center;

  p {
    margin: 1rem 0;
  }
}
</style>
