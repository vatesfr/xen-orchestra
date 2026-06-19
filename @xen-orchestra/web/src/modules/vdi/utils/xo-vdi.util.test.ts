import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { getVdiFormat, getVdiIcon } from '@/modules/vdi/utils/xo-vdi.util.ts'
import { expect, test } from 'vitest'

function createVbd(attached: boolean): FrontXoVbd {
  return { attached } as FrontXoVbd
}

test('getVdiFormat uppercases the given format', () => {
  expect(getVdiFormat('raw')).toBe('RAW')
})

test('getVdiFormat defaults to VHD when the format is undefined', () => {
  expect(getVdiFormat(undefined)).toBe('VHD')
})

test('getVdiIcon returns the detached icon when there are no VBDs', () => {
  expect(getVdiIcon([])).toBe('object:vdi:detached')
})

test('getVdiIcon returns the detached icon when every VBD is detached', () => {
  expect(getVdiIcon([createVbd(false), createVbd(false)])).toBe('object:vdi:detached')
})

test('getVdiIcon returns the attached icon when every VBD is attached', () => {
  expect(getVdiIcon([createVbd(true), createVbd(true)])).toBe('object:vdi:attached')
})

test('getVdiIcon returns the warning icon when some VBDs are attached and some are not', () => {
  expect(getVdiIcon([createVbd(true), createVbd(false)])).toBe('object:vdi:warning')
})
