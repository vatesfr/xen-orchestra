import { getFirst } from "@/libs/utils";
import XapiStats from "@/libs/xapi-stats";
import XenApi from "@/libs/xen-api/xen-api";
import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { watch } from "vue";
import { computed, ref, watchEffect } from "vue";
import { useRoute } from "vue-router";

const HOST_URL = import.meta.env.PROD
  ? window.origin
  : import.meta.env.VITE_XO_HOST;

enum STATUS {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
}

export const useXenApiStore = defineStore("xen-api", () => {
  const route = useRoute();

  const hostUrl = computed(() => {
    const url = new URL(HOST_URL);
    const masterQueryUrl = getFirst(route.query["master"]);
    if (masterQueryUrl != undefined) {
      url.hostname = masterQueryUrl;
    }
    return url.origin;
  });

  const xenApi = new XenApi(hostUrl.value);
  const xapiStats = new XapiStats(xenApi);
  const storedSessionId = useLocalStorage<string | undefined>(
    "sessionId",
    undefined
  );
  const currentSessionId = ref(storedSessionId.value);
  const rememberMe = useLocalStorage("rememberMe", false);
  const status = ref(STATUS.DISCONNECTED);
  const isConnected = computed(() => status.value === STATUS.CONNECTED);
  const isConnecting = computed(() => status.value === STATUS.CONNECTING);
  const getXapi = () => xenApi;
  const getXapiStats = () => xapiStats;

  watch(hostUrl, async (hostUrl) => {
    if (xenApi.listenedTypes.length === 0) {
      xenApi.setHostUrl(hostUrl);
      await reconnect();
    } else {
      window.location.reload();
    }
  });

  watchEffect(() => {
    storedSessionId.value = rememberMe.value
      ? currentSessionId.value
      : undefined;
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
    currentSessionId.value = undefined;
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
