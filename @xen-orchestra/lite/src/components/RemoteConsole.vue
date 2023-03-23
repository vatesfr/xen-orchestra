<template>
  <div ref="vmConsoleContainer" class="vm-console" />
</template>

<script lang="ts" setup>
import { onBeforeUnmount, ref, watchEffect } from "vue";
import VncClient from "@novnc/novnc/core/rfb";
import { useXenApiStore } from "@/stores/xen-api.store";

const props = defineProps<{
  location: string;
  isConsoleAvailable: boolean;
}>();

const vmConsoleContainer = ref<HTMLDivElement>();
const xenApiStore = useXenApiStore();
let vncClient: VncClient | undefined;

const clearVncClient = () => {
  if (vncClient !== undefined) {
    if (vncClient._rfbConnectionState !== "disconnected") {
      vncClient.disconnect();
    }
    vncClient = undefined;
  }
};

watchEffect(() => {
  if (
    !vmConsoleContainer.value ||
    !xenApiStore.currentSessionId ||
    !props.isConsoleAvailable
  ) {
    return;
  }

  clearVncClient();

  const url = new URL(props.location);
  url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("session_id", xenApiStore.currentSessionId);

  vncClient = new VncClient(vmConsoleContainer.value, url.toString(), {
    wsProtocols: ["binary"],
  });

  vncClient.scaleViewport = true;
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
