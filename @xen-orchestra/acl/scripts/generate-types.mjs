#!/usr/bin/env node
// AUTO-GENERATES dist/generated/privilege-types.d.mts
// Run via `npm run build` (after tsc).

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SUPPORTED_ACTIONS_BY_RESOURCE } from '../dist/actions/index.mjs'
import { getActionStrings } from '../dist/index.mjs'

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

const resources = Object.keys(SUPPORTED_ACTIONS_BY_RESOURCE)

const typeBlocks = resources.map(resource => {
  const actionUnion = getActionStrings(resource)
    .map(action => `'${action}'`)
    .join(' | ')
  return `export type ${toPascalCase(resource)}Privilege = {
  id: XoAclBasePrivilege['id']
  resource: '${resource}'
  action: ${actionUnion}
  selector?: XoAclBasePrivilege['selector']
  effect: XoAclBasePrivilege['effect']
  roleId: XoAclBasePrivilege['roleId']
}`
})

const anyUnion = resources.map(resource => `  | ${toPascalCase(resource)}Privilege`).join('\n')

const types = `\
// -----------------------------------------------------------------------
// AUTO-GENERATED — do not edit manually.
// Regenerated on every \`npm run build\`.
// -----------------------------------------------------------------------
import type { XoAclBasePrivilege } from '@vates/types'


${typeBlocks.join('\n\n')}

export type AnyPrivilege =
${anyUnion}
`

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'dist/generated')

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'privilege-types.d.mts'), types, 'utf-8')
