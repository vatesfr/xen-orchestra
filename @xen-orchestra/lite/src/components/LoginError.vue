<template>
  <div class="error" v-if="error !== undefined">
    <UiIcon :icon="faExclamationCircle" />
    <span v-if="error.message === 'SESSION_AUTHENTICATION_FAILED'">
      {{ $t("password-invalid") }}
    </span>
    <span v-else-if="isHostIsSlaveErr(error)">
      {{ $t("cannot-login-from-slave") }}
      <a :href="masterUrl.href">{{ $t("go-to-master") }}</a>
    </span>
    <span v-else>
      {{ $t("error-occurred") }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import type { XenApiError } from "@/libs/xen-api/xen-api.types";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { whenever } from "@vueuse/core";
import { ref } from "vue";

const masterUrl = ref(new URL(window.origin));

const isHostIsSlaveErr = (err: XenApiError | undefined) =>
  err?.message === "HOST_IS_SLAVE";

const props = defineProps<{
  error: XenApiError | undefined;
}>();

whenever(
  () => isHostIsSlaveErr(props.error),
  () => (masterUrl.value.hostname = props.error!.data)
);
</script>

<style lang="postcss">
.error {
  font-size: 1.3rem;
  line-height: 150%;
  margin: 0.5rem 0;
  color: var(--color-red-vates-base);

  & svg {
    margin-right: 0.5rem;
  }
}
</style>
