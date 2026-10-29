import { getV2vLaunchGroupType, getV2vLaunchPlan } from '@/modules/v2v/utils/v2v-launch-plan.util.ts'
import { createV2vLaunchPlanItem } from '@/test/create-v2v-launch.ts'
import { getV2vVmIds } from '@/test/create-v2v-vm-row.ts'
import { V2V_SELECTED_VM_CHECK } from '@/test/v2v-selected-vm-checks.ts'
import type { XoV2vVm } from '@vates/types'

const { ready, notFound, unsupported, running, partialOnOtherPool, mappingIncomplete, alreadyMigrated } =
  V2V_SELECTED_VM_CHECK

const NO_CONFIRMATION = new Set<XoV2vVm['id']>()

function createItem(id: string, overrides: Parameters<typeof createV2vLaunchPlanItem>[0] = {}) {
  return createV2vLaunchPlanItem({ id: id as XoV2vVm['id'], ...overrides })
}

describe('getV2vLaunchGroupType', () => {
  it.each([
    ['not found', notFound],
    ['unsupported', unsupported],
    ['running', running],
    ['partially imported on another pool', partialOnOtherPool],
    ['of an incomplete mapping', mappingIncomplete],
  ])('excludes a VM %s', (_, check) => {
    expect(getV2vLaunchGroupType({ kind: 'new', check })).toBe('excluded')
  })

  it('excludes a resumed VM that is blocked', () => {
    expect(getV2vLaunchGroupType({ kind: 'resume', check: running })).toBe('excluded')
  })

  it('groups an already migrated VM apart', () => {
    expect(getV2vLaunchGroupType({ kind: 'new', check: alreadyMigrated })).toBe('migrated')
  })

  it('groups a ready VM by its kind', () => {
    expect(getV2vLaunchGroupType({ kind: 'resume', check: ready })).toBe('resumed')
    expect(getV2vLaunchGroupType({ kind: 'new', check: ready })).toBe('new')
  })
})

describe('getV2vLaunchPlan', () => {
  const items = [
    createItem('new-1'),
    createItem('excluded-1', { check: running }),
    createItem('resumed-1', { kind: 'resume' }),
    createItem('migrated-1', { check: alreadyMigrated }),
    createItem('new-2'),
    createItem('migrated-2', { check: alreadyMigrated }),
  ]

  it('groups the VMs in list order', () => {
    const plan = getV2vLaunchPlan(items, NO_CONFIRMATION)

    expect(getV2vVmIds(plan.excluded)).toEqual(['excluded-1'])
    expect(getV2vVmIds(plan.migrated)).toEqual(['migrated-1', 'migrated-2'])
    expect(getV2vVmIds(plan.resumed)).toEqual(['resumed-1'])
    expect(getV2vVmIds(plan.new)).toEqual(['new-1', 'new-2'])
  })

  it('launches the resumed and new VMs in list order, not the unconfirmed already migrated ones', () => {
    expect(getV2vVmIds(getV2vLaunchPlan(items, NO_CONFIRMATION).launchable)).toEqual(['new-1', 'resumed-1', 'new-2'])
  })

  it('launches an already migrated VM once confirmed, in list order', () => {
    const plan = getV2vLaunchPlan(items, new Set(['migrated-1' as XoV2vVm['id']]))

    expect(getV2vVmIds(plan.launchable)).toEqual(['new-1', 'resumed-1', 'migrated-1', 'new-2'])
    expect(getV2vVmIds(plan.migrated)).toEqual(['migrated-1', 'migrated-2'])
  })

  it('never launches a confirmed VM that is excluded', () => {
    expect(getV2vVmIds(getV2vLaunchPlan(items, new Set(['excluded-1' as XoV2vVm['id']])).launchable)).not.toContain(
      'excluded-1'
    )
  })

  it('plans nothing for an empty list', () => {
    expect(getV2vLaunchPlan([], NO_CONFIRMATION)).toEqual({
      excluded: [],
      migrated: [],
      resumed: [],
      new: [],
      launchable: [],
    })
  })
})
