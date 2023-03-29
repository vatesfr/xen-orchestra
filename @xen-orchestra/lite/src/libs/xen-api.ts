import { JSONRPCClient } from "json-rpc-2.0";
import { buildXoObject, parseDateTime } from "@/libs/utils";
import { useVmStore } from "@/stores/vm.store";

export type RawObjectType =
  | "Bond"
  | "Certificate"
  | "Cluster"
  | "Cluster_host"
  | "DR_task"
  | "Feature"
  | "GPU_group"
  | "PBD"
  | "PCI"
  | "PGPU"
  | "PIF"
  | "PIF_metrics"
  | "PUSB"
  | "PVS_cache_storage"
  | "PVS_proxy"
  | "PVS_server"
  | "PVS_site"
  | "SDN_controller"
  | "SM"
  | "SR"
  | "USB_group"
  | "VBD"
  | "VBD_metrics"
  | "VDI"
  | "VGPU"
  | "VGPU_type"
  | "VIF"
  | "VIF_metrics"
  | "VLAN"
  | "VM"
  | "VMPP"
  | "VMSS"
  | "VM_appliance"
  | "VM_guest_metrics"
  | "VM_metrics"
  | "VUSB"
  | "blob"
  | "console"
  | "crashdump"
  | "host"
  | "host_cpu"
  | "host_crashdump"
  | "host_metrics"
  | "host_patch"
  | "network"
  | "network_sriov"
  | "pool"
  | "pool_patch"
  | "pool_update"
  | "role"
  | "secret"
  | "subject"
  | "task"
  | "tunnel";

export type PowerState = "Running" | "Paused" | "Halted" | "Suspended";

export type ObjectType = Lowercase<RawObjectType>;

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
  snapshot: object;
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

  disconnect() {
    this.#call("session.logout", [this.#sessionId]);
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

  async loadRecords<T extends XenApiRecord>(
    type: RawObjectType
  ): Promise<Map<string, T>> {
    const result = await this.#call<{ [key: string]: RawXenApiRecord<T> }>(
      `${type}.get_all_records`,
      [this.sessionId]
    );

    const entries = Object.entries(result).map<[string, T]>(([key, entry]) => [
      key,
      buildXoObject(entry, { opaqueRef: key }) as T,
    ]);

    return new Map(entries);
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
    this.#watch();
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
    type VmsRef =
      | {
          vmRef: XenApiVm["$ref"];
          vmsRef?: undefined;
        }
      | {
          vmRef?: undefined;
          vmsRef: XenApiVm["$ref"][];
        };

    return {
      start: ({ vmRef, vmsRef }: VmsRef) => {
        const _vmsRef = vmsRef ?? [vmRef];
        return Promise.all(
          _vmsRef.map((vmRef) => this._call("VM.start", [vmRef, false, false]))
        );
      },
      startOn: ({ vmRef, vmsRef, hostRef }: VmsRef & { hostRef: string }) => {
        const _vmsRef = vmsRef ?? [vmRef];
        return Promise.all(
          _vmsRef.map((vmRef) =>
            this._call("VM.start_on", [vmRef, hostRef, false, false])
          )
        );
      },
      pause: ({ vmRef, vmsRef }: VmsRef) => {
        const _vmsRef = vmsRef ?? [vmRef];
        return Promise.all(
          _vmsRef.map((vmRef) => this._call("VM.pause", [vmRef]))
        );
      },
      suspend: ({ vmRef, vmsRef }: VmsRef) => {
        const _vmsRef = vmsRef ?? [vmRef];
        return Promise.all(
          _vmsRef.map((vmRef) => this._call("VM.suspend", [vmRef]))
        );
      },
      resume: ({ vmRef, vmsRef }: VmsRef) => {
        const _vmsRef = vmsRef ?? [vmRef];
        const vmStore = useVmStore();
        return Promise.all(
          _vmsRef.map((ref) => {
            const isSuspended =
              vmStore.getRecord(ref).power_state === "Suspended";
            return this._call(
              `VM.${isSuspended ? "resume" : "unpause"}`,
              isSuspended ? [ref, false, false] : [ref]
            );
          })
        );
      },
      reboot: ({
        vmRef,
        vmsRef,
        force = false,
      }: VmsRef & { force?: boolean }) => {
        const _vmsRef = vmsRef ?? [vmRef];
        return Promise.all(
          _vmsRef.map((vmRef) =>
            this._call(`VM.${force ? "hard" : "clean"}_reboot`, [vmRef])
          )
        );
      },
      shutdown: ({
        vmRef,
        vmsRef,
        force = false,
      }: VmsRef & { force?: boolean }) => {
        const _vmsRef = vmsRef ?? [vmRef];
        return Promise.all(
          _vmsRef.map((vmRef) =>
            this._call(`VM.${force ? "hard" : "clean"}_shutdown`, [vmRef])
          )
        );
      },
    };
  }
}
