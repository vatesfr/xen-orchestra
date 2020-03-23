import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import constructQueryString from 'construct-query-string'
import decorate from 'apply-decorators'
import React from 'react'
import { adminOnly } from 'utils'
import { createPredicate } from 'value-matcher'
import { injectState, provideState } from 'reaclette'
import { some } from 'lodash'
import { subscribeJobs } from 'xo'

import LegacyOverview from '../backup/overview-legacy'
import { JobsTable } from '../backup/overview'

const ACTIONS = [
  {
    handler: (selectedJobs, { goTo }) =>
      goTo({
        pathname: '/backup/overview',
        query: { s: `id: |(${selectedJobs.map(_ => _.id)})` },
      }),
    label: _('redirectToBackupJobs'),
    icon: 'redirect',
    individualLabel: _('redirectToBackupJob'),
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: (job, { goTo }) =>
      goTo({
        pathname: '/home',
        query: { t: 'VM', s: constructQueryString(job.vms) },
      }),
    label: _('redirectToMatchingVms'),
    icon: 'preview',
  },
]

const legacyJobKey = [
  'continuousReplication',
  'deltaBackup',
  'disasterRecovery',
  'backup',
  'rollingSnapshot',
]

const BackupTab = decorate([
  adminOnly,
  addSubscriptions({
    legacyJobs: subscribeJobs,
  }),
  provideState({
    computed: {
      haveLegacyBackups: (_, { legacyJobs }) =>
        some(legacyJobs, job => legacyJobKey.includes(job.key)),
      predicate: (_, { vm }) => ({ vms }) =>
        vms !== undefined &&
        createPredicate({
          ...vms,
          // ignore transient properties
          power_state: vm.power_state,
        })(vm),
    },
  }),
  injectState,
  ({ state: { haveLegacyBackups, predicate } }) => {
    return (
      <div>
        {haveLegacyBackups && (
          <LegacyOverview jobPredicate={predicate} showCard={false} />
        )}
        <div className='mt-2 mb-1'>
          {haveLegacyBackups && <h3>{_('backup')}</h3>}
          <JobsTable
            actions={ACTIONS}
            individualActions={INDIVIDUAL_ACTIONS}
            predicate={predicate}
          />
        </div>
      </div>
    )
  },
])

export default BackupTab
