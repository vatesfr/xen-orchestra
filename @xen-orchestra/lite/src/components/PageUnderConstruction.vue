<template>
  <UiStatusPanel
    :image-source="underConstruction"
    :subtitle="t('new-features-are-coming')"
    :title="t('xo-lite-under-construction')"
  >
    <p class="contact typo-body-regular">
      {{ t('do-you-have-needs') }}
      <a
        href="https://xcp-ng.org/forum/topic/5018/xo-lite-building-an-embedded-ui-in-xcp-ng"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ `${t('here')} →` }}
      </a>
    </p>
  </UiStatusPanel>
</template>

<script lang="ts" setup>
import underConstruction from '@/assets/under-construction.svg'
import UiStatusPanel from '@/components/ui/UiStatusPanel.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.contact {
  color: var(--color-neutral-txt-primary);

  & a {
    text-transform: lowercase;
  }
}
</style>
