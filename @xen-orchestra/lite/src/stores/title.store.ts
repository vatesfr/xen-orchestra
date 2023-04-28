import { useTitle } from "@vueuse/core";
import { useHostStore } from "@/stores/host.store";
import { usePoolStore } from "@/stores/pool.store";
import { useVmStore } from "@/stores/vm.store";
import { ref, watch, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { defineStore } from "pinia";

const XOLITE_SUFFIX = " - XO Lite";

const STORE_BY_TYPE = {
  host: useHostStore,
  vm: useVmStore,
};

export const useTitleStore = defineStore("title", () => {
  const { currentRoute } = useRouter();
  const { t } = useI18n();

  const complementary = ref<number | string>();
  const customTitle = ref<string>();

  function init() {
    watch(currentRoute, () => {
      complementary.value = undefined;
      customTitle.value = undefined;
    });

    watchEffect(() => {
      if (customTitle.value !== undefined) {
        useTitle(customTitle.value.concat(XOLITE_SUFFIX));
        return;
      }

      const [objectType, tab] = (
        currentRoute.value.name?.toString() ?? "unknown.unknown"
      ).split(".");

      if (
        objectType !== "pool" &&
        objectType !== "vm" &&
        objectType !== "host"
      ) {
        useTitle(t(objectType).concat(XOLITE_SUFFIX));
        return;
      }

      const object =
        objectType === "pool"
          ? usePoolStore().pool
          : STORE_BY_TYPE[objectType]().getRecordByUuid(
              currentRoute.value.params.uuid as string
            );
      let title = `${object?.name_label ?? t("unknown")}/${t(tab)}`;
      if (complementary.value !== undefined) {
        title = title.concat(` (${complementary.value})`);
      }

      useTitle(title.concat(XOLITE_SUFFIX));
    });
  }

  return {
    complementary,
    customTitle,
    init,
  };
});
