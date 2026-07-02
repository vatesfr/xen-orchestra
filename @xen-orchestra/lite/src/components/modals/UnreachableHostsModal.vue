<template>
  <VtsOverlay type="modal" accent="danger" icon="object:host">
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
      <VtsOverlayCancelButton />
      <VtsOverlayConfirmButton>
        {{ t('unreachable-hosts-reload-page') }}
      </VtsOverlayConfirmButton>
    </template>
  </VtsOverlay>
</template>

<script lang="ts" setup>
import VtsOverlay from '@core/components/overlay/VtsOverlay.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
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
