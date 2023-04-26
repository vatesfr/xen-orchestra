import { buildXoObject, parseDateTime } from "@/libs/utils";
import { JSONRPCClient } from "json-rpc-2.0";
import { castArray } from "lodash-es";

const OBJECT_TYPES = {
  bond: "Bond",
  certificate: "Certificate",
  cluster: "Cluster",
  cluster_host: "Cluster_host",
  dr_task: "DR_task",
  feature: "Feature",
  gpu_group: "GPU_group",
  pbd: "PBD",
  pci: "PCI",
  pgpu: "PGPU",
  pif: "PIF",
  pif_metrics: "PIF_metrics",
  pusb: "PUSB",
  pvs_cache_storage: "PVS_cache_storage",
  pvs_proxy: "PVS_proxy",
  pvs_server: "PVS_server",
  pvs_site: "PVS_site",
  sdn_controller: "SDN_controller",
  sm: "SM",
  sr: "SR",
  usb_group: "USB_group",
  vbd: "VBD",
  vbd_metrics: "VBD_metrics",
  vdi: "VDI",
  vgpu: "VGPU",
  vgpu_type: "VGPU_type",
  vif: "VIF",
  vif_metrics: "VIF_metrics",
  vlan: "VLAN",
  vm: "VM",
  vmpp: "VMPP",
  vmss: "VMSS",
  vm_guest_metrics: "VM_guest_metrics",
  vm_metrics: "VM_metrics",
  vusb: "VUSB",
  blob: "blob",
  console: "console",
  crashdump: "crashdump",
  host: "host",
  host_cpu: "host_cpu",
  host_crashdump: "host_crashdump",
  host_metrics: "host_metrics",
  host_patch: "host_patch",
  network: "network",
  network_sriov: "network_sriov",
  pool: "pool",
  pool_patch: "pool_patch",
  pool_update: "pool_update",
  role: "role",
  secret: "secret",
  subject: "subject",
  task: "task",
  tunnel: "tunnel",
} as const;

export type ObjectType = keyof typeof OBJECT_TYPES;
export type RawObjectType = (typeof OBJECT_TYPES)[ObjectType];

export const getRawObjectType = (type: ObjectType): RawObjectType => {
  return OBJECT_TYPES[type];
};

export type PowerState = "Running" | "Paused" | "Halted" | "Suspended";

export interface XenApiRecord {
  $ref: string;
  uuid: string;
}

export type RawXenApiRecord<T extends XenApiRecord> = Omit<T, "$ref">;

export interface XenApiPool extends XenApiRecord {
  cpu_info: {
    cpu_count: string;
  };
  master: string;
  name_label: string;
}

export interface XenApiHost extends XenApiRecord {
  address: string;
  name_label: string;
  metrics: string;
  resident_VMs: string[];
  cpu_info: { cpu_count: string };
  software_version: { product_version: string };
}

export interface XenApiSr extends XenApiRecord {
  name_label: string;
  physical_size: number;
  physical_utilisation: number;
}

export interface XenApiVm extends XenApiRecord {
  current_operations: Record<string, string>;
  guest_metrics: string;
  metrics: string;
  name_label: string;
  name_description: string;
  power_state: PowerState;
  resident_on: string;
  consoles: string[];
  is_control_domain: boolean;
  is_a_snapshot: boolean;
  is_a_template: boolean;
  VCPUs_at_startup: number;
}

export interface XenApiConsole extends XenApiRecord {
  protocol: string;
  location: string;
}

export interface XenApiHostMetrics extends XenApiRecord {
  live: boolean;
  memory_free: number;
  memory_total: number;
}

export interface XenApiVmMetrics extends XenApiRecord {
  VCPUs_number: number;
}

export type XenApiVmGuestMetrics = XenApiRecord;

export interface XenApiTask extends XenApiRecord {
  name_label: string;
  resident_on: string;
  created: string;
  finished: string;
  status: string;
  progress: number;
}

type WatchCallbackResult = {
  id: string;
  class: ObjectType;
  operation: "add" | "mod" | "del";
  ref: string;
  snapshot: RawXenApiRecord<XenApiRecord>;
};

type WatchCallback = (results: WatchCallbackResult[]) => void;

export default class XenApi {
  #client: JSONRPCClient;
  #sessionId: string | undefined;

  #types: string[] = [];

  #watchCallBack: WatchCallback | undefined;
  #watching = false;
  #fromToken: string | undefined;

  constructor(hostUrl: string) {
    this.#client = new JSONRPCClient((request) => {
      return fetch(`${hostUrl}/jsonrpc`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      }).then((response) => {
        if (response.status === 200) {
          return response.json().then((json) => this.#client.receive(json));
        } else if (request.id !== undefined) {
          return Promise.reject(new Error(response.statusText));
        }
      });
    });
  }

  async connectWithPassword(username: string, password: string) {
    this.#sessionId = await this.#call("session.login_with_password", [
      username,
      password,
    ]);

    await this.loadTypes();

    return this.#sessionId;
  }

  async connectWithSessionId(sessionId: string) {
    this.#sessionId = sessionId;

    try {
      await this.#call("session.get_all_subject_identifiers", [
        this.#sessionId,
      ]);

      await this.loadTypes();

      return true;
    } catch (error: any) {
      if (error?.message === "SESSION_INVALID") {
        return false;
      } else {
        throw error;
      }
    }
  }

  async disconnect() {
    await this.#call("session.logout", [this.#sessionId]);
    this.stopWatch();
    this.#sessionId = undefined;
  }

  async loadTypes() {
    this.#types = (await this.#call<string[]>("system.listMethods"))
      .filter((method: string) => method.endsWith(".get_all_records"))
      .map((method: string) => method.slice(0, method.indexOf(".")))
      .filter((type: string) => type !== "message");
  }

  get sessionId() {
    return this.#sessionId;
  }

  #call<T = any>(method: string, args: any[] = []): PromiseLike<T> {
    return this.#client.request(method, args);
  }

  _call = (method: string, args: any[] = []) =>
    this.#call(method, [this.sessionId, ...args]);

  async getHostServertime(host: XenApiHost) {
    const serverLocaltime = (await this.#call("host.get_servertime", [
      this.sessionId,
      host.$ref,
    ])) as string;
    return Math.floor(parseDateTime(serverLocaltime) / 1e3);
  }

  async getResource(
    pathname: string,
    { host, query }: { host: XenApiHost; query: any }
  ) {
    const url = new URL("http://localhost");
    url.protocol = window.location.protocol;
    url.hostname = host.address;
    url.pathname = pathname;
    url.search = new URLSearchParams({
      ...query,
      session_id: this.#sessionId,
    }).toString();

    return fetch(url);
  }

  async loadRecords<T extends XenApiRecord>(type: RawObjectType): Promise<T[]> {
    const result = await this.#call<{ [key: string]: RawXenApiRecord<T> }>(
      `${type}.get_all_records`,
      [this.sessionId]
    );

    return Object.entries(result).map(([opaqueRef, record]) =>
      buildXoObject(record, { opaqueRef })
    );
  }

  async #watch() {
    if (!this.#fromToken) {
      throw new Error("call `injectWatchEvent` before startWatch");
    }
    // load pools
    while (this.#watching) {
      if (!this.#watchCallBack) {
        // no callback , skip this call
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      const result: { token: string; events: any } = await this.#call(
        "event.from",
        [this.sessionId, this.#types, this.#fromToken, 5.001]
      );
      this.#fromToken = result.token;
      this.#watchCallBack?.(result.events);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  startWatch() {
    this.#watching = true;
    return this.#watch();
  }

  stopWatch() {
    this.#watchCallBack = undefined;
    this.#watching = false;
  }

  registerWatchCallBack(callback: WatchCallback) {
    this.#watchCallBack = callback;
  }

  async injectWatchEvent(poolRef: string) {
    this.#fromToken = await this.#call("event.inject", [
      this.sessionId,
      "pool",
      poolRef,
    ]);
  }

  get vm() {
    type VmRefs = XenApiVm["$ref"] | XenApiVm["$ref"][];
    type VmRefsWithPowerState = Record<
      XenApiVm["$ref"],
      XenApiVm["power_state"]
    >;

    return {
      start: (vmRefs: VmRefs) =>
        Promise.all(
          castArray(vmRefs).map((vmRef) =>
            this._call("VM.start", [vmRef, false, false])
          )
        ),
      startOn: (vmRefs: VmRefs, hostRef: XenApiHost["$ref"]) =>
        Promise.all(
          castArray(vmRefs).map((vmRef) =>
            this._call("VM.start_on", [vmRef, hostRef, false, false])
          )
        ),
      pause: (vmRefs: VmRefs) =>
        Promise.all(
          castArray(vmRefs).map((vmRef) => this._call("VM.pause", [vmRef]))
        ),
      suspend: (vmRefs: VmRefs) => {
        return Promise.all(
          castArray(vmRefs).map((vmRef) => this._call("VM.suspend", [vmRef]))
        );
      },
      resume: (vmRefsWithPowerState: VmRefsWithPowerState) => {
        const vmRefs = Object.keys(vmRefsWithPowerState);

        return Promise.all(
          vmRefs.map((vmRef) => {
            if (vmRefsWithPowerState[vmRef] === "Suspended") {
              return this._call("VM.resume", [vmRef, false, false]);
            }

            return this._call("VM.unpause", [vmRef]);
          })
        );
      },
      reboot: (vmRefs: VmRefs, force = false) => {
        return Promise.all(
          castArray(vmRefs).map((vmRef) =>
            this._call(`VM.${force ? "hard" : "clean"}_reboot`, [vmRef])
          )
        );
      },
      shutdown: (vmRefs: VmRefs, force = false) => {
        return Promise.all(
          castArray(vmRefs).map((vmRef) =>
            this._call(`VM.${force ? "hard" : "clean"}_shutdown`, [vmRef])
          )
        );
      },
    };
  }
}
