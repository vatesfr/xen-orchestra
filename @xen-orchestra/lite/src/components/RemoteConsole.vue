<template>
  <div ref="vmConsoleContainer" class="vm-console" />
</template>

<script lang="ts" setup>
import { fibonacci } from "iterable-backoff";
import { computed, onBeforeUnmount, ref, watch, watchEffect } from "vue";
import VncClient from "@novnc/novnc/core/rfb";
import { useXenApiStore } from "@/stores/xen-api.store";

const N_TOTAL_TRIES = 8;
const FIBONACCI_MS_ARRAY: number[] = Array.from(
  fibonacci().toMs().take(N_TOTAL_TRIES)
);
const INITIAL_VALUE_N_CONNECTION_ATTEMPTS = 0;

const props = defineProps<{
  location: string;
  isConsoleAvailable: boolean;
}>();

const vmConsoleContainer = ref<HTMLDivElement>();
const xenApiStore = useXenApiStore();
const url = computed(() => {
  if (xenApiStore.currentSessionId === null) {
    return;
  }
  const _url = new URL(props.location);
  _url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  _url.searchParams.set("session_id", xenApiStore.currentSessionId);
  return _url;
});

let vncClient: VncClient | undefined;
let nConnectionAttempts = INITIAL_VALUE_N_CONNECTION_ATTEMPTS;

const handleDisconnectionEvent = () => {
  clearVncClient();
  if (props.isConsoleAvailable) {
    console.error(
      `Connection lost for the remote console: ${
        props.location
      }. New attempt in ${FIBONACCI_MS_ARRAY[nConnectionAttempts - 1]}ms`
    );
    createVncConnection();
  }
};
const handleConnectionEvent = () =>
  (nConnectionAttempts = INITIAL_VALUE_N_CONNECTION_ATTEMPTS);

const clearVncClient = () => {
  vncClient?.removeEventListener("disconnect", handleDisconnectionEvent);
  vncClient?.removeEventListener("connect", handleConnectionEvent);
  if (vncClient?._rfbConnectionState !== "disconnected") {
    vncClient?.disconnect();
  }
  vncClient = undefined;
};
const createVncConnection = async () => {
  if (nConnectionAttempts > N_TOTAL_TRIES) {
    console.error(
      "The number of reconnection attempts has been exceeded for:",
      props.location
    );
    return;
  }
  await new Promise((resolve) =>
    setTimeout(resolve, FIBONACCI_MS_ARRAY[nConnectionAttempts++ - 1])
  );

  vncClient = new VncClient(vmConsoleContainer.value!, url.value!.toString(), {
    wsProtocols: ["binary"],
  });
  vncClient.scaleViewport = true;

  vncClient.addEventListener("disconnect", handleDisconnectionEvent);
  vncClient.addEventListener("connect", handleConnectionEvent);
};

watch(url, clearVncClient);
watchEffect(() => {
  if (
    url.value === undefined ||
    vmConsoleContainer.value === undefined ||
    !props.isConsoleAvailable
  ) {
    return;
  }

  nConnectionAttempts = INITIAL_VALUE_N_CONNECTION_ATTEMPTS;
  createVncConnection();
});

onBeforeUnmount(() => {
  clearVncClient();
});
</script>

<style lang="postcss" scoped>
.vm-console {
  height: 80rem;

  & > :deep(div) {
    background-color: transparent !important;
  }
}
</style>
