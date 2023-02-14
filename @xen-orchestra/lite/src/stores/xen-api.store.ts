import { defineStore } from "pinia";
import { ref, watchEffect } from "vue";
import { useLocalStorage } from "@vueuse/core";
import XapiStats from "@/libs/xapi-stats";
import type { XenApiRecord } from "@/libs/xen-api";
import XenApi from "@/libs/xen-api";
import { useConsoleStore } from "@/stores/console.store";
import { useHostMetricsStore } from "@/stores/host-metrics.store";
import { useHostStore } from "@/stores/host.store";
import { usePoolStore } from "@/stores/pool.store";
import { useRecordsStore } from "@/stores/records.store";
import { useSrStore } from "@/stores/storage.store";
import { useTaskStore } from "@/stores/task.store";
import { useVmGuestMetricsStore } from "@/stores/vm-guest-metrics.store";
import { useVmMetricsStore } from "@/stores/vm-metrics.store";
import { useVmStore } from "@/stores/vm.store";

export const useXenApiStore = defineStore("xen-api", () => {
  const xenApi = new XenApi(
    import.meta.env.PROD ? window.origin : import.meta.env.VITE_XO_HOST
  );
  const xapiStats = new XapiStats(xenApi);
  const currentSessionId = useLocalStorage<string | null>("sessionId", null);
  const isConnected = ref(false);
  const isConnecting = ref(false);

  async function getXapi() {
    if (!currentSessionId.value) {
      throw new Error("Not connected to xapi");
    }

    return xenApi;
  }

  function getXapiStats() {
    if (!currentSessionId.value) {
      throw new Error("Not connected to xapi");
    }

    return xapiStats;
  }

  async function init() {
    const poolStore = usePoolStore();
    await poolStore.init();

    const xapi = await getXapi();

    watchEffect(async () => {
      if (!poolStore.poolOpaqueRef) {
        return;
      }

      await xapi.injectWatchEvent(poolStore.poolOpaqueRef);

      xapi.registerWatchCallBack((results) => {
        const recordsStore = useRecordsStore();
        results.forEach((result) => {
          if (result.operation === "del") {
            recordsStore.removeRecord(result.class, result.ref);
          } else {
            recordsStore.addOrReplaceRecord(
              result.class,
              result.ref,
              result.snapshot as XenApiRecord
            );
          }
        });
      });
      xapi.startWatch();
    });

    const hostStore = useHostStore();
    const vmStore = useVmStore();

    await Promise.all([hostStore.init(), vmStore.init()]);

    const hostMetricsStore = useHostMetricsStore();
    const vmMetricsStore = useVmMetricsStore();
    const vmGuestMetricsStore = useVmGuestMetricsStore();
    const srStore = useSrStore();

    await Promise.all([
      hostMetricsStore.init(),
      vmMetricsStore.init(),
      vmGuestMetricsStore.init(),
      srStore.init(),
    ]);

    const taskStore = useTaskStore();
    taskStore.init();

    const consoleStore = useConsoleStore();
    consoleStore.init();
  }

  async function connect(username: string, password: string) {
    isConnecting.value = true;
    try {
      currentSessionId.value = await xenApi.connectWithPassword(
        username,
        password
      );
      isConnected.value = true;
    } finally {
      isConnecting.value = false;
    }
  }

  async function reconnect() {
    if (!currentSessionId.value) {
      return;
    }

    try {
      isConnecting.value = true;
      isConnected.value = await xenApi.connectWithSessionId(
        currentSessionId.value
      );
    } finally {
      isConnecting.value = false;
    }
  }

  function disconnect() {
    currentSessionId.value = null;
    xenApi.disconnect();
    isConnected.value = false;
  }

  return {
    isConnected,
    isConnecting,
    connect,
    reconnect,
    disconnect,
    init,
    getXapi,
    getXapiStats,
    currentSessionId,
  };
});
