import XapiStats from "@/libs/xapi-stats";
import XenApi from "@/libs/xen-api/xen-api";
import { useLocalStorage, useSessionStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { watch } from "vue";
import { computed, ref, watchEffect } from "vue";
import { useRouter } from "vue-router";
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
  // undefined not correctly handled. See https://github.com/vueuse/vueuse/issues/3595

  // const foo = useSessionStorage("some", null);

  watchEffect(() => {
    // console.log(foo.value);
  });

  const masterSessionStorage = useSessionStorage<null | string>(
    "master",
    null,
    { deep: true, shallow: true }
  );
  const router = useRouter();
  const route = useRoute();

  const masterQueryParam = computed(
    () => route.query["master"] as string | undefined
  );

  watchEffect(() => {
    if (masterQueryParam.value !== undefined) {
      masterSessionStorage.value = masterQueryParam.value;
    }
  });

  const hostUrl = computed(() => {
    const url = new URL(HOST_URL);
    if (masterSessionStorage.value !== null) {
      url.hostname = masterSessionStorage.value;
    }
    return url.origin;
  });

  watch(hostUrl, () => window.location.reload());

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

  async function resetPoolMasterIp() {
    if (masterQueryParam.value !== undefined) {
      const query = Object.assign({}, route.query);
      delete query["master"];
      await router.replace({ query });
    }
    masterSessionStorage.value = null;
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
    resetPoolMasterIp,
  };
});
