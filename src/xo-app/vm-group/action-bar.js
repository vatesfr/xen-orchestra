import ActionBar from 'action-bar'
import React from 'react'
import { connectStore } from 'utils'
import { includes } from 'lodash'
import { isAdmin } from 'selectors'
import {
  rebootVmGroup,
  startVmGroup,
  shutdownVmGroup
} from 'xo'

const vmGroupActionBarByState = ({ isAdmin, vmGroup }) => {
  const actions = []
  if (vmGroup.allowed_operations.includes('start') || vmGroup.allowed_operations.length === 0) {
    actions.push({
      icon: 'vm-start',
      label: 'startVmLabel',
      handler: startVmGroup,
      pending: includes(vmGroup.current_operations, 'start')
    })
  }
  if (vmGroup.allowed_operations.includes('shutdown') || vmGroup.allowed_operations.length === 0) {
    actions.push({
      icon: 'vm-stop',
      label: 'stopVmLabel',
      handler: shutdownVmGroup,
      pending: includes(vmGroup.current_operations, 'shutdown')
    })
  }
  actions.push({
    icon: 'vm-reboot',
    label: 'rebootVmLabel',
    handler: rebootVmGroup,
    pending: includes(vmGroup.current_operations, 'shutdown') || includes(vmGroup.current_operations, 'start')
  })
  return <ActionBar
    actions={actions}
    display='icon'
    param={vmGroup}
  />
}

const VmGroupActionBar = connectStore({
  isAdmin
})(({ isAdmin, vmGroup }) => {
  const ActionBar = vmGroupActionBarByState
  if (!ActionBar) {
    return <p>No action bar for state</p>
  }

  return <ActionBar isAdmin={isAdmin} vmGroup={vmGroup} />
})
export default VmGroupActionBar
