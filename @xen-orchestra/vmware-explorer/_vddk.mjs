// the vddk library is not redistributable: it has to be downloaded from Broadcom and extracted
// there by `esxi.installVddkLib`
export const VDDK_LIB_DIR = '/usr/local/lib/vddk'
export const VDDK_LIB_PATH = `${VDDK_LIB_DIR}/vmware-vix-disklib-distrib`
export const VDDK_LIB_FILE = `${VDDK_LIB_PATH}/lib64/libvixDiskLib.so`
