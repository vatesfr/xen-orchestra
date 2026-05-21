export namespace VHDFOOTER {
  let cookie: string
  let features: number
  let fileFormatVersion: number
  let dataOffset: number
  let timestamp: number
  let creatorApplication: string
  let creatorVersion: number
  let creatorHostOs: number
  let originalSize: number
  let currentSize: number
  namespace diskGeometry {
    let cylinders: number
    let heads: number
    let sectorsPerTrackCylinder: number
  }
  let diskType: number
  let checksum: number
  let uuid: Buffer<ArrayBuffer>
  let saved: string
  let hidden: string
  let reserved: string
}
export namespace VHDHEADER {
  let cookie_1: string
  export { cookie_1 as cookie }
  let dataOffset_1: any
  export { dataOffset_1 as dataOffset }
  export let tableOffset: number
  export let headerVersion: number
  export let maxTableEntries: number
  export let blockSize: number
  let checksum_1: number
  export { checksum_1 as checksum }
  export let parentUuid: any
  export let parentTimestamp: number
  export let reserved1: number
  export let parentUnicodeName: string
  export let parentLocatorEntry: {
    platformCode: number
    platformDataSpace: number
    platformDataLength: number
    reserved: number
    platformDataOffset: number
  }[]
  export let reserved2: string
}
