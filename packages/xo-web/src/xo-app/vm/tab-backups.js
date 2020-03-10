import React from 'react'
import { adminOnly } from 'utils'

import Overview from '../backup/overview'

const BackupTab = adminOnly(({ vm }) => <Overview vm={vm.id} />)

export default BackupTab
