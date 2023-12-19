<template>
  <UiStatusPanel
    :image-source="underConstruction"
    :subtitle="$t('new-features-are-coming')"
    :title="$t('xo-lite-under-construction')"
  >
    <p class="contact">
      {{ $t("do-you-have-needs") }}
      <a
        href="https://xcp-ng.org/forum/topic/5018/xo-lite-building-an-embedded-ui-in-xcp-ng"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ $t("here") }} →
      </a>
    </p>
  </UiStatusPanel>
</template>

<script lang="ts" setup>
import underConstruction from "@/assets/under-construction.svg";
import UiStatusPanel from "@/components/ui/UiStatusPanel.vue";
</script>

<style lang="postcss" scoped>
.contact {
  font-weight: 400;
  font-size: 20px;
  color: var(--color-blue-scale-100);

  & a {
    text-transform: lowercase;
  }
}
</style>
