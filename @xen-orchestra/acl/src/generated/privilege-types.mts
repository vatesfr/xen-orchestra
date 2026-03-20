// DO NOT EDIT
// Overwritten by scripts/generate-types.mjs after running npm run build
// scripts/generate-types.mjs will replace this file to automatically generate and export all privileged types.
// This makes external use easier because it's not necessary to resolve the type every time.

import type { Privilege, SupportedResource } from '../index.mjs'

export type AnyPrivilege = {
  [Resource in SupportedResource]: Privilege<Resource>
}[SupportedResource]
