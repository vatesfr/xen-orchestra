<template>
  <div
    v-if="masterSessionStorage !== null"
    class="warning warning-not-current-pool"
    @click="resetPoolMasterIp"
    v-tooltip="
      displayTooltip
        ? {
            placement: 'right',
            content: `
      ${$t('you-are-currently-on', [masterSessionStorage])}.
      ${$t('click-to-return-default-pool')}
      `,
          }
        : undefined
    "
  >
    <div class="wrapper">
      <UiIcon :icon="faWarning" />
      <p v-if="!displayTooltip">
        <i18n-t keypath="you-are-currently-on">
          <strong>{{ masterSessionStorage }}</strong>
        </i18n-t>
        <br />
        {{ $t("click-to-return-default-pool") }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { faWarning } from "@fortawesome/free-solid-svg-icons";

import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { useXenApiStore } from "@/stores/xen-api.store";
import { vTooltip } from "@/directives/tooltip.directive";
import { useSessionStorage } from "@vueuse/core";

defineProps<{
  displayTooltip?: boolean;
}>();

const xenApi = useXenApiStore();
const masterSessionStorage = useSessionStorage("master", null);

const resetPoolMasterIp = () => {
  console.log(vTooltip);
  void xenApi.resetPoolMasterIp();
};
</script>

<style lang="postcss" scoped>
.wrapper {
  display: flex;

  p {
    margin-bottom: 1rem;
  }

  svg {
    margin: auto 1rem;
  }
}
.warning {
  color: var(--color-orange-world-base);
  cursor: pointer;

  transition:
    opacity 0.3s ease-in-out,
    color 0.3s ease-in-out;
  animation: infinite;
}
</style>
