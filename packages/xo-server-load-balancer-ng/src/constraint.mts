import type { XoHost, XoVm } from '@vates/types'

/**
 * Immutable snapshot of running VM placements.
 * Maps each running VM id to the id of its current host.
 *
 * Note: this reflects the *simulated* state after higher-priority
 * constraints have already been applied — not the live XAPI state.
 */
export type Placement = ReadonlyMap<XoVm['id'], XoHost['id']>

/**
 * The output of a plan: maps VMs that must move to their destination host.
 * VMs already in the correct position are absent.
 */
export type MigrationPlan = Map<XoVm['id'], XoHost['id']>

/**
 * A single placement constraint.
 *
 * Constraints are applied in descending priority order by the solver.
 * Each `apply()` receives the placement already updated by all higher-priority
 * constraints, so each constraint sees the committed result of earlier ones.
 *
 * `apply()` must be a pure computation: no I/O, no side effects.
 */
export interface Constraint {
  readonly priority: number
  apply(placement: Placement, hosts: ReadonlyArray<XoHost>): MigrationPlan
}
