import ActionBar from 'action-bar'
import React from 'react'
import { connectStore } from 'utils'
import { isAdmin } from 'selectors'

const vmGroupActionBarByState = ({ isAdmin, vmGroup }) => (
  <ActionBar
    actions={[
      {
        icon: 'vm-stop',
        label: 'stopVmLabel',
        handler: '',
        pending: ''
      },
      {
        icon: 'vm-reboot',
        label: 'rebootVmLabel',
        handler: '',
        pending: ''
      }
    ]}
    display='icon'
    param={vmGroup}
  />
)

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
