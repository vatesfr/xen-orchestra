import React from 'react'
import { adminOnly } from 'utils'

import JobsTable from '../backup/overview/tab-jobs'

const BackupTab = adminOnly(({ vm }) => <JobsTable vm={vm.id} />)
export default BackupTab
