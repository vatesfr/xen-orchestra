import type { VdfOutsideChange } from '@/modules/vdf/types.ts'

// A change of a pool's document or owner made outside this XO (vdf#32), as
// the UI words it:
// - same-identity: another XO with this XO's identity wrote it, a copy of
//   this XO's data such as a cloned XO VM (vdf#20);
// - taken-over: another XO now owns the pool's global part;
// - owner: the owner key was removed;
// - document: the document changed (another XO, xe, `vdf-agent publish`).
export type VdfOutsideKind = 'same-identity' | 'taken-over' | 'owner' | 'document'

export function outsideKind(change: VdfOutsideChange): VdfOutsideKind {
  if (change.sameIdentity) {
    return 'same-identity'
  }

  if (change.ownerChanged) {
    return change.owner === null ? 'owner' : 'taken-over'
  }

  return 'document'
}

// seen again within this time: two writers still alternate
export const VDF_OUTSIDE_RECENT_MS = 60 * 60 * 1000

// Worth a banner: the pool still holds it, or it keeps coming back
export function isOutsideNotable(change: VdfOutsideChange | null | undefined, now = Date.now()) {
  if (change == null) {
    return false
  }

  return change.current === true || now - Date.parse(change.lastSeenAt) < VDF_OUTSIDE_RECENT_MS
}
