import { areCollectionsReady, sortRecordsByNameLabel } from "@/libs/utils";
import { VBD_TYPE, VM_OPERATION } from "@/libs/xen-api/xen-api.enums";
import type {
  XenApiHost,
  XenApiNetwork,
  XenApiSr,
  XenApiVdi,
  XenApiVm,
} from "@/libs/xen-api/xen-api.types";
import { useXenApiStore } from "@/stores/xen-api.store";
import { useHostCollection } from "@/stores/xen-api/host.store";
import { useNetworkCollection } from "@/stores/xen-api/network.store";
import { usePbdCollection } from "@/stores/xen-api/pbd.store";
import { usePifCollection } from "@/stores/xen-api/pif.store";
import { usePoolCollection } from "@/stores/xen-api/pool.store";
import { useSrCollection } from "@/stores/xen-api/sr.store";
import { useVbdCollection } from "@/stores/xen-api/vbd.store";
import { useVdiCollection } from "@/stores/xen-api/vdi.store";
import { useVmCollection } from "@/stores/xen-api/vm.store";
import type { MaybeArray } from "@/types";
import type { VmMigrationData } from "@/types/xen-api";
import { useMemoize } from "@vueuse/core";
import { castArray } from "lodash-es";
import type { MaybeRefOrGetter } from "vue";
import { computed, ref, toValue, watch } from "vue";
import { useI18n } from "vue-i18n";

export const useVmMigration = (
  vmRefsToMigrate: MaybeRefOrGetter<MaybeArray<XenApiVm["$ref"]>>
) => {
  const xapi = useXenApiStore().getXapi();

  const poolCollection = usePoolCollection();
  const hostCollection = useHostCollection();
  const vmCollection = useVmCollection();
  const vbdCollection = useVbdCollection();
  const vdiCollection = useVdiCollection();
  const srCollection = useSrCollection();
  const networkCollection = useNetworkCollection();
  const pbdCollection = usePbdCollection();
  const pifCollection = usePifCollection();

  const isReady = areCollectionsReady(
    poolCollection,
    hostCollection,
    vmCollection,
    vbdCollection,
    vdiCollection,
    srCollection,
    networkCollection,
    pbdCollection,
    pifCollection
  );

  const { pool } = poolCollection;
  const { getByOpaqueRef: getHost, records: hosts } = hostCollection;
  const {
    getByOpaqueRefs: getVms,
    isOperationPending,
    isOperationAllowed,
  } = vmCollection;
  const { getByOpaqueRefs: getVbds } = vbdCollection;
  const { getByOpaqueRef: getVdi } = vdiCollection;
  const { getByOpaqueRef: getSr } = srCollection;
  const {
    getByOpaqueRef: getNetwork,
    getByOpaqueRefs: getNetworks,
    getByUuid: getNetworkByUuid,
  } = networkCollection;
  const { getByOpaqueRefs: getPbds } = pbdCollection;
  const { getByOpaqueRefs: getPifs } = pifCollection;

  const selectedHostRef = ref<XenApiHost["$ref"]>();
  const selectedHost = computed(() => getHost(selectedHostRef.value));
  const selectedMigrationNetworkRef = ref<XenApiNetwork["$ref"]>();
  const selectedMigrationNetwork = computed(() =>
    getNetwork(selectedMigrationNetworkRef.value)
  );
  const selectedSrRef = ref<XenApiSr["$ref"]>();
  const selectedSr = computed(() => getSr(selectedSrRef.value));
  const isSimpleMigration = computed(
    () => selectedMigrationNetworkRef.value === undefined
  );

  const availableHosts = computed(() =>
    hosts.value
      .filter((host) =>
        vmsToMigrate.value.some((vm) => vm.resident_on !== host.$ref)
      )
      .sort(sortRecordsByNameLabel)
  );

  const getPifsForSelectedHost = () =>
    getPifs(selectedHost.value!.PIFs).filter((pif) => pif.IP);

  const availableNetworks = computed(() => {
    if (!selectedHost.value) {
      return [];
    }

    return getNetworks(getPifsForSelectedHost().map((pif) => pif.network));
  });

  const availableSrs = computed(() => {
    if (!selectedHost.value) {
      return [];
    }

    const srs = new Set<XenApiSr>();

    getPbds(selectedHost.value!.PBDs).forEach((pbd) => {
      const sr = getSr(pbd.SR);
      if (
        sr !== undefined &&
        sr.content_type !== "iso" &&
        sr.physical_size > 0
      ) {
        srs.add(sr);
      }
    });

    return Array.from(srs);
  });

  const $isMigrating = ref(false);

  const vmsToMigrate = computed(() =>
    getVms(castArray(toValue(vmRefsToMigrate)))
  );

  const getVmVbds = (vm: XenApiVm) =>
    getVms(vm.snapshots).reduce(
      (acc, vm) => acc.concat(getVbds(vm.VBDs)),
      getVbds(vm.VBDs)
    );

  const getVmVdis = (
    vmToMigrate: XenApiVm,
    destinationHost: XenApiHost,
    forcedSr?: XenApiSr
  ) =>
    getVmVbds(vmToMigrate).reduce(
      (acc, vbd) => {
        if (vbd.type !== VBD_TYPE.DISK) {
          return acc;
        }

        const vdi = getVdi(vbd.VDI);

        if (vdi === undefined || vdi.snapshot_of !== "OpaqueRef:NULL") {
          return acc;
        }

        acc[vdi.$ref] = isSrConnected(vdi.SR, destinationHost)
          ? vdi.SR
          : forcedSr !== undefined
          ? forcedSr.$ref
          : getDefaultSr().$ref;

        return acc;
      },
      {} as Record<XenApiVdi["$ref"], XenApiSr["$ref"]>
    );

  const isSrConnected = useMemoize(
    (srRef: XenApiSr["$ref"], destinationHost: XenApiHost) =>
      getSr(srRef)?.PBDs.some((pbdRef) =>
        destinationHost.PBDs.includes(pbdRef)
      ) ?? false
  );

  const getDefaultMigrationNetwork = () => {
    if (selectedHost.value === undefined) {
      return undefined;
    }

    const migrationNetworkUuid = pool.value!.other_config[
      "xo:migrationNetwork"
    ] as XenApiNetwork["uuid"];

    const migrationNetwork = getNetworkByUuid(migrationNetworkUuid);

    if (migrationNetwork === undefined) {
      return undefined;
    }

    if (
      getPifsForSelectedHost().some(
        (pif) => pif.network === migrationNetwork.$ref
      )
    ) {
      return migrationNetwork;
    }

    return undefined;
  };

  const getDefaultSr = () => {
    const defaultSr = getSr(pool.value?.default_SR);

    if (defaultSr === undefined) {
      throw new Error(
        `This operation requires a default SR to be set on the pool ${
          pool.value!.name_label
        }`
      );
    }

    return defaultSr;
  };

  watch(selectedHost, (host) => {
    if (host === undefined) {
      selectedMigrationNetworkRef.value = undefined;
      return;
    }

    selectedMigrationNetworkRef.value = getDefaultMigrationNetwork()?.$ref;
  });

  watch(selectedMigrationNetworkRef, (networkRef) => {
    if (networkRef === undefined) {
      selectedSrRef.value = undefined;
      return;
    }

    selectedSrRef.value = getDefaultSr().$ref;
  });

  const isMigrating = computed(
    () =>
      $isMigrating.value ||
      isOperationPending(vmsToMigrate.value, [
        VM_OPERATION.MIGRATE_SEND,
        VM_OPERATION.POOL_MIGRATE,
      ])
  );

  const areAllVmsAllowedToMigrate = computed(() =>
    isOperationAllowed(
      vmsToMigrate.value,
      isSimpleMigration.value
        ? VM_OPERATION.POOL_MIGRATE
        : VM_OPERATION.MIGRATE_SEND
    )
  );

  const { t } = useI18n();
  const notMigratableReason = computed(() => {
    if (isMigrating.value) {
      return t("vms-migration-error.already-being-migrated");
    }

    if (!areAllVmsAllowedToMigrate.value) {
      return t("vms-migration-error.not-allowed");
    }

    if (selectedHost.value === undefined) {
      return t("vms-migration-error.no-destination-host");
    }

    if (isSimpleMigration.value) {
      return undefined;
    }

    if (selectedMigrationNetwork.value === undefined) {
      return t("vms-migration-error.no-migration-network");
    }

    if (selectedSr.value === undefined) {
      return t("vms-migration-error.no-destination-sr");
    }

    return undefined;
  });

  const canExecuteMigration = computed(
    () => notMigratableReason.value === undefined
  );

  const migrateSimple = () =>
    xapi.vm.migrate(
      vmsToMigrate.value.map((vm) => vm.$ref),
      selectedHostRef.value!
    );

  const migrateComplex = () => {
    const vmsMigrationMap: Record<XenApiVm["$ref"], VmMigrationData> = {};

    vmsToMigrate.value.forEach((vm) => {
      vmsMigrationMap[vm.$ref] = {
        destinationHost: selectedHostRef.value!,
        destinationSr: selectedSrRef.value!,
        migrationNetwork: selectedMigrationNetworkRef.value!,
        vdisMap: getVmVdis(vm, selectedHost.value!, selectedSr.value!),
      };
    });

    return xapi.vm.migrateComplex(vmsMigrationMap);
  };

  const migrate = async () => {
    if (!canExecuteMigration.value) {
      return;
    }

    try {
      $isMigrating.value = true;
      isSimpleMigration.value ? await migrateSimple() : await migrateComplex();
    } finally {
      $isMigrating.value = false;
    }
  };

  return {
    isReady,
    isMigrating,
    areAllVmsAllowedToMigrate,
    canExecuteMigration,
    notMigratableReason,
    availableHosts,
    availableNetworks,
    availableSrs,
    selectedHostRef,
    selectedMigrationNetworkRef,
    selectedSrRef,
    migrate,
  };
};
