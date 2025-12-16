import { RandomAccessDisk } from "@xen-orchestra/disk-transform"

export class RemoteDisk extends RandomAccessDisk {
    // Abstract
    writeBlock() {

    }

    // Abstract
    hasBlock(index) {

    }
}