// the VMX file contains the VM  metadata

function set(obj, keyPath, val) {
  let [key, ...other] = keyPath

  if (key.includes(':')) {
    // it's an array
    let index
    ;[key, index] = key.split(':')
    index = parseInt(index)
    if (!obj[key]) {
      // first time on this array
      obj[key] = []
    }
    if (!other.length) {
      // without descendant
      if (typeof obj[key][index] !== 'object') {
        // sometimes there are additional properties on a string (like guestOS="ubuntu" and then guestOS.detailed =)
        // we ignore these data for now
        obj[key][index] = val
      }
    } else {
      // with descendant
      if (!obj[key][index]) {
        // first time on this descendant
        obj[key][index] = {}
      }
      set(obj[key][index], other, val)
    }
  } else {
    // it's an object
    if (!other.length) {
      // without descendant
      obj[key] = val
    } else {
      if (obj[key] === undefined) {
        // first time
        obj[key] = {}
      }
      // with descendant
      if (typeof obj[key] !== 'object') {
        // sometimes there is additional properties on a string ( like guestOS="ubuntu " and then guestOS.detailed =)
        // we ignore these data for now
        return
      }
      set(obj[key], other, val)
    }
  }
}

// this file contains the vm configuration
export default function parseVmx(text) {
  const vmx = {}
  text.split('\n').forEach(line => {
    const [key, val] = line.split(' = ')
    set(vmx, key.split('.'), val?.substring(1, val.length - 1))
  })
  return vmx
}

/**
 * example data files :
 .encoding = "UTF-8"
config.version = "8"
virtualHW.version = "11"
nvram = "test flo.nvram"
pciBridge0.present = "TRUE"
svga.present = "TRUE"
pciBridge4.present = "TRUE"
pciBridge4.virtualDev = "pcieRootPort"
pciBridge4.functions = "8"
pciBridge5.present = "TRUE"
pciBridge5.virtualDev = "pcieRootPort"
pciBridge5.functions = "8"
pciBridge6.present = "TRUE"
pciBridge6.virtualDev = "pcieRootPort"
pciBridge6.functions = "8"
pciBridge7.present = "TRUE"
pciBridge7.virtualDev = "pcieRootPort"
pciBridge7.functions = "8"
vmci0.present = "TRUE"
hpet0.present = "TRUE"
floppy0.present = "FALSE"
RemoteDisplay.maxConnections = "-1"
numvcpus = "2"
memSize = "1024"
bios.bootRetry.delay = "10"
sched.cpu.units = "mhz"
sched.cpu.affinity = "all"
sched.cpu.latencySensitivity = "normal"
powerType.powerOff = "soft"
powerType.suspend = "soft"
powerType.reset = "soft"
tools.upgrade.policy = "manual"
scsi0.virtualDev = "lsilogic"
scsi0.present = "TRUE"
sata0.present = "TRUE"
usb.present = "TRUE"
ehci.present = "TRUE"
scsi0:0.deviceType = "scsi-hardDisk"
scsi0:0.fileName = "test flo_0-000004.vmdk"
sched.scsi0:0.shares = "normal"
sched.scsi0:0.throughputCap = "off"
scsi0:0.present = "TRUE"
ethernet0.virtualDev = "vmxnet3"
ethernet0.networkName = "VM Network"
ethernet0.addressType = "generated"
ethernet0.wakeOnPcktRcv = "FALSE"
ethernet0.uptCompatibility = "TRUE"
ethernet0.present = "TRUE"
sata0:0.deviceType = "cdrom-image"
sata0:0.fileName = "/vmfs/volumes/636a25ed-0b37afee-60ef-3cfdfe75e770/ISO/ubuntu-22.04.1-live-server-amd64.iso"
sata0:0.present = "TRUE"
displayName = "test flo"
guestOS = "ubuntu-64"
toolScripts.afterPowerOn = "TRUE"
toolScripts.afterResume = "TRUE"
toolScripts.beforeSuspend = "TRUE"
toolScripts.beforePowerOff = "TRUE"
tools.syncTime = "FALSE"
uuid.bios = "56 4d fd 52 65 f4 71 df-e4 c8 66 8e b1 27 c4 8b"
uuid.location = "56 4d fd 52 65 f4 71 df-e4 c8 66 8e b1 27 c4 8b"
vc.uuid = "52 53 bd 47 4e a1 ba 91-dd c2 15 04 b1 06 35 92"
sched.cpu.min = "0"
sched.cpu.shares = "normal"
sched.mem.min = "0"
sched.mem.minSize = "0"
sched.mem.shares = "normal"
virtualHW.productCompatibility = "hosted"
sched.swap.derivedName = "/vmfs/volumes/636a25ed-0b37afee-60ef-3cfdfe75e770/test flo/test flo-988abbf8.vswp"
replay.supported = "FALSE"
replay.filename = ""
migrate.hostlog = "./test flo-988abbf8.hlog"
scsi0:0.redo = ""
pciBridge0.pciSlotNumber = "17"
pciBridge4.pciSlotNumber = "21"
pciBridge5.pciSlotNumber = "22"
pciBridge6.pciSlotNumber = "23"
pciBridge7.pciSlotNumber = "24"
scsi0.pciSlotNumber = "16"
usb.pciSlotNumber = "32"
ethernet0.pciSlotNumber = "160"
ehci.pciSlotNumber = "33"
vmci0.pciSlotNumber = "34"
sata0.pciSlotNumber = "35"
ethernet0.generatedAddress = "00:0c:29:27:c4:8b"
ethernet0.generatedAddressOffset = "0"
vmci0.id = "-1322793845"
monitor.phys_bits_used = "42"
vmotion.checkpointFBSize = "4194304"
vmotion.checkpointSVGAPrimarySize = "4194304"
cleanShutdown = "TRUE"
softPowerOff = "FALSE"
usb:1.speed = "2"
usb:1.present = "TRUE"
usb:1.deviceType = "hub"
usb:1.port = "1"
usb:1.parent = "-1"
svga.guestBackedPrimaryAware = "TRUE"
extendedConfigFile = "test flo.vmxf"
tools.remindInstall = "TRUE"
usb:0.present = "TRUE"
usb:0.deviceType = "hid"
usb:0.port = "0"
usb:0.parent = "-1"
 */
