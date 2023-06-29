import { saveAs } from "file-saver";
import { useVmStore } from "@/stores/vm.store";
import type { XenApiVm } from "@/libs/xen-api";

function stringifyCsvValue(value: any) {
  let res = "";
  if (Array.isArray(value)) {
    res = value.join(";");
  } else if (typeof value === "object") {
    res = JSON.stringify(value);
  } else {
    res = String(value);
  }
  return `"${res.replace(/"/g, '""')}"`;
}

export function exportVmsAsCsvFile(
  vmRefs: XenApiVm["$ref"][],
  fileName: string
) {
  const { getByOpaqueRef: getVm } = useVmStore().subscribe();
  const vms = vmRefs
    .map(getVm)
    .filter((vm): vm is XenApiVm => vm !== undefined);

  const csvHeaders = Object.keys(vms[0]);

  const csvRows = vms.map((vm) =>
    csvHeaders.map((header) => stringifyCsvValue(vm[header]))
  );

  saveAs(
    new Blob(
      [[csvHeaders, ...csvRows].map((row) => row.join(",")).join("\n")],
      {
        type: "text/csv;charset=utf-8",
      }
    ),
    fileName
  );
}
