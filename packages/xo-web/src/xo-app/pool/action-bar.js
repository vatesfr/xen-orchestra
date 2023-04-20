import _ from 'intl'
import ActionBar, { Action } from 'action-bar'
import Component from 'base-component'
import React from 'react'
import { createGetObjectsOfType, createSelector, isAdmin } from 'selectors'
import find from 'lodash/find.js'
import { addSubscriptions, connectStore, noop } from 'utils'
import { addHostsToPool, disableServer, subscribeServers } from 'xo'

@connectStore({
  hosts: createGetObjectsOfType('host'),
  isAdmin,
})
@addSubscriptions(
  ({ isAdmin }) =>
    isAdmin && {
      servers: subscribeServers,
    }
)
export default class PoolActionBar extends Component {
  _getMasterAddress = createSelector(
    () => this.props.pool && this.props.pool.master,
    () => this.props.hosts,
    (poolMaster, hosts) => {
      const master = find(hosts, { id: poolMaster })

      return master && master.address
    }
  )

  _getServer = createSelector(
    this._getMasterAddress,
    () => this.props.servers,
    (masterAddress, servers) => find(servers, { host: masterAddress })
  )

  _disconnectServer = () => disableServer(this._getServer())

  render() {
    const { pool } = this.props

    return (
      <ActionBar display='icon' handlerParam={pool}>
        <Action handler={noop} icon='add-sr' label={_('addSrLabel')} redirectOnSuccess={`new/sr?host=${pool.master}`} />
        <Action handler={noop} icon='add-vm' label={_('addVmLabel')} redirectOnSuccess={`vms/new?pool=${pool.id}`} />
        <Action handler={addHostsToPool} icon='add-host' label={_('addHostsLabel')} />
        <Action
          handler={this._disconnectServer}
          icon='disconnect'
          label={_('disconnectServer')}
          redirectOnSuccess='/home'
        />
      </ActionBar>
    )
  }
}
