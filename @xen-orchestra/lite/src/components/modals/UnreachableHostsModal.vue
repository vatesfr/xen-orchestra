<template>
  <UiModal accent="danger" icon="object:host" @confirm="emit('confirm')">
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
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('unreachable-hosts-reload-page') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  urls: string[]
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
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
