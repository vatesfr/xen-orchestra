import { VDF_QUARANTINE_TAG, VDF_TAG_PREFIX } from '@/modules/vdf/types.ts'

// A group's VM tags start with vdf:, which XO reserves to pool administrators
// (xo-server-vdf global.mjs refuses to publish any other): a group on a tag
// anyone may set is open to whoever organises VMs. The quarantine tag isn't
// a group criterion.
export const isGroupTag = (tag: string) => tag.startsWith(VDF_TAG_PREFIX) && tag !== VDF_QUARANTINE_TAG
