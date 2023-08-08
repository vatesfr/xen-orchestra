import { useXenApiCollectionManager } from "@/composables/xen-api-collection.composable";
import { buildXoObject } from "@/libs/utils";
import XapiStats from "@/libs/xapi-stats";
import XenApi, { getRawObjectType } from "@/libs/xen-api";
import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

const HOST_URL = import.meta.env.PROD
  ? window.origin
  : import.meta.env.VITE_XO_HOST;

enum STATUS {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
}

export const useXenApiStore = defineStore("xen-api", () => {
  const xenApi = new XenApi(HOST_URL);
  const xapiStats = new XapiStats(xenApi);
  const currentSessionId = useLocalStorage<string | undefined>(
    "sessionId",
    undefined
  );
  const status = ref(STATUS.DISCONNECTED);
  const isConnected = computed(() => status.value === STATUS.CONNECTED);
  const isConnecting = computed(() => status.value === STATUS.CONNECTING);
  const getXapi = () => xenApi;
  const getXapiStats = () => xapiStats;

  xenApi.registerWatchCallBack((results) => {
    results.forEach((result) => {
      const collectionManager = useXenApiCollectionManager(
        getRawObjectType(result.class)
      );

      if (!collectionManager.hasSubscriptions.value) {
        return;
      }

      const buildObject = () =>
        buildXoObject(result.snapshot, { opaqueRef: result.ref }) as any;

      switch (result.operation) {
        case "add":
          return collectionManager.add(buildObject());
        case "mod":
          return collectionManager.update(buildObject());
        case "del":
          return collectionManager.remove(result.ref as any);
      }
    });
  });

  const connect = async (username: string, password: string) => {
    status.value = STATUS.CONNECTING;

    try {
      currentSessionId.value = await xenApi.connectWithPassword(
        username,
        password
      );
      const success = currentSessionId.value !== undefined;
      status.value = success ? STATUS.CONNECTED : STATUS.DISCONNECTED;
      return success;
    } catch (error) {
      status.value = STATUS.DISCONNECTED;
      throw error;
    }
  };

  const reconnect = async () => {
    if (currentSessionId.value === undefined) {
      return false;
    }

    status.value = STATUS.CONNECTING;

    try {
      const success = await xenApi.connectWithSessionId(currentSessionId.value);
      status.value = success ? STATUS.CONNECTED : STATUS.DISCONNECTED;
      return success;
    } catch (error) {
      status.value = STATUS.DISCONNECTED;
      throw error;
    }
  };

  async function disconnect() {
    await xenApi.disconnect();
    currentSessionId.value = null;
    status.value = STATUS.DISCONNECTED;
  }

  return {
    isConnected,
    isConnecting,
    connect,
    reconnect,
    disconnect,
    getXapi,
    getXapiStats,
    currentSessionId,
  };
});
