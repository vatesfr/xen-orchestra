import React from 'react'
import { adminOnly } from 'utils'
import { createPredicate } from 'value-matcher'

import Overview from '../backup/overview'

const BackupTab = adminOnly(({ vm }) => (
  <Overview
    // Smart mode: ignore transient properties
    jobPredicate={({ vms }) =>
      vms !== undefined &&
      createPredicate({ ...vms, power_state: vm.power_state })(vm)
    }
  />
))

export default BackupTab
