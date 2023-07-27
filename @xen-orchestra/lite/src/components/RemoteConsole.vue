<template>
  <div ref="consoleContainer" class="remote-console">
    <div v-if="!isConsoleAvailable">
      {{ $t("console-unavailable") }}
    </div>
    <div v-else-if="vncClient === undefined">
      <UiCardSpinner />
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiCardSpinner from "@/components/ui/UiCardSpinner.vue";
import { useXenApiStore } from "@/stores/xen-api.store";
import VncClient from "@novnc/novnc/core/rfb";
import { promiseTimeout } from "@vueuse/shared";
import { fibonacci } from "iterable-backoff";
import {
  computed,
  onBeforeUnmount,
  ref,
  type ShallowRef,
  shallowRef,
  watchEffect,
} from "vue";

const N_TOTAL_TRIES = 8;
const FIBONACCI_MS_ARRAY: number[] = Array.from(
  fibonacci().toMs().take(N_TOTAL_TRIES)
);

const props = defineProps<{
  location: string;
  isConsoleAvailable: boolean;
}>();

const consoleContainer = ref<HTMLDivElement>();
const xenApiStore = useXenApiStore();
const url = computed(() => {
  if (xenApiStore.currentSessionId == null) {
    return;
  }
  const _url = new URL(props.location);
  _url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  _url.searchParams.set("session_id", xenApiStore.currentSessionId);
  return _url;
});

const vncClient = shallowRef() as ShallowRef<VncClient | undefined>;
let nConnectionAttempts = 0;

const handleDisconnectionEvent = () => {
  clearVncClient();

  if (props.isConsoleAvailable) {
    nConnectionAttempts++;

    if (nConnectionAttempts > N_TOTAL_TRIES) {
      console.error(
        "The number of reconnection attempts has been exceeded for:",
        props.location
      );
      return;
    }

    console.error(
      `Connection lost for the remote console: ${
        props.location
      }. New attempt in ${FIBONACCI_MS_ARRAY[nConnectionAttempts - 1]}ms`
    );
    createVncConnection();
  }
};
const handleConnectionEvent = () => (nConnectionAttempts = 0);

const clearVncClient = () => {
  if (vncClient.value === undefined) {
    return;
  }

  vncClient.value.removeEventListener("disconnect", handleDisconnectionEvent);
  vncClient.value.removeEventListener("connect", handleConnectionEvent);

  if (vncClient.value._rfbConnectionState !== "disconnected") {
    vncClient.value.disconnect();
  }

  vncClient.value = undefined;
};

const createVncConnection = async () => {
  if (nConnectionAttempts !== 0) {
    await promiseTimeout(FIBONACCI_MS_ARRAY[nConnectionAttempts - 1]);
  }

  vncClient.value = new VncClient(
    consoleContainer.value!,
    url.value!.toString(),
    {
      wsProtocols: ["binary"],
    }
  );
  vncClient.value.scaleViewport = true;

  vncClient.value.addEventListener("disconnect", handleDisconnectionEvent);
  vncClient.value.addEventListener("connect", handleConnectionEvent);
};

watchEffect(() => {
  if (
    url.value === undefined ||
    consoleContainer.value === undefined ||
    !props.isConsoleAvailable
  ) {
    return;
  }

  nConnectionAttempts = 0;

  clearVncClient();
  createVncConnection();
});

onBeforeUnmount(() => {
  clearVncClient();
});
</script>

<style lang="postcss" scoped>
.remote-console > :deep(div) {
  background-color: transparent !important;
}
</style>
