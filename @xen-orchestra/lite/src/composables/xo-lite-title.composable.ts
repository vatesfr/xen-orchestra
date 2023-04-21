import { useHostStore } from "@/stores/host.store";
import { usePoolStore } from "@/stores/pool.store";
import { useVmStore } from "@/stores/vm.store";
import { useTitle } from "@vueuse/core";
import { ref, watch, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

export const XOLITE_SUFFIX = " - XO Lite";

export type XoLiteTitleComposable = {
  setComplementary: (complementary: string | number) => void;
  setTitle: (title: string | null) => void;
};

const storeByType = {
  vm: useVmStore,
  host: useHostStore,
};

export default function useXoLiteTitle(): XoLiteTitleComposable {
  const { currentRoute } = useRouter();
  const { t } = useI18n();

  const complementary = ref<string | number>();

  function setComplementary(_complementary: string | number) {
    complementary.value = _complementary;
  }

  function setTitle(title: string | null) {
    useTitle(title);
  }

  watch(currentRoute, () => {
    complementary.value = undefined;
  });

  watchEffect(() => {
    const [objectType, tab] = (
      currentRoute.value.name?.toString() ?? "unknown.unknown"
    ).split(".");

    if (objectType !== "pool" && objectType !== "vm" && objectType !== "host") {
      useTitle(t(objectType).concat(XOLITE_SUFFIX));
      return;
    }

    const object =
      objectType === "pool"
        ? usePoolStore().pool
        : storeByType[objectType]().getRecordByUuid(
            currentRoute.value.params.uuid as string
          );
    let title = `${object?.name_label ?? t("unknown")}/${t(tab)}`;
    if (complementary.value !== undefined) {
      title = title.concat(` (${complementary.value})`);
    }

    useTitle(title.concat(XOLITE_SUFFIX));
  });

  return {
    setComplementary,
    setTitle,
  };
}
