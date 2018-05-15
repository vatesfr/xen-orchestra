import _ from 'intl'
import React from 'react'
import Component from 'base-component'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { map } from 'lodash'
import { subscribeResourceCatalog } from 'xo'
import {
  addSubscriptions,
  isLatestXosanPackInstalled,
  connectStore,
  findLatestPack,
} from 'utils'

@connectStore(
  {
    hosts: createGetObjectsOfType('host').filter((_, { pool }) => host =>
      host.$pool === pool.id
    ),
  },
  { withRef: true }
)
@addSubscriptions(() => ({
  catalog: subscribeResourceCatalog,
}))
export default class UpdateXosanPacksModal extends Component {
  state = {
    status: 'checking',
  }

  get value () {
    return this.state.pack
  }

  _getStatus = createSelector(
    () => this.props.catalog,
    () => this.props.hosts,
    (catalog, hosts) => {
      if (catalog === undefined) {
        return { status: 'error' }
      }

      if (catalog._namespaces.xosan === undefined) {
        return { status: 'unavailable' }
      }

      if (!catalog._namespaces.xosan.registered) {
        return { status: 'unregistered' }
      }

      const pack = findLatestPack(catalog.xosan, map(hosts, 'version'))

      if (pack === undefined) {
        return { status: 'noPack' }
      }

      if (isLatestXosanPackInstalled(pack, hosts)) {
        return { status: 'upToDate' }
      }

      return { status: 'packFound', pack }
    }
  )

  render () {
    const { status, pack } = this._getStatus()
    switch (status) {
      case 'checking':
        return <em>{_('xosanPackUpdateChecking')}</em>
      case 'error':
        return <em>{_('xosanPackUpdateError')}</em>
      case 'unavailable':
        return <em>{_('xosanPackUpdateUnavailable')}</em>
      case 'unregistered':
        return <em>{_('xosanPackUpdateUnregistered')}</em>
      case 'noPack':
        return <em>{_('xosanNoPackFound')}</em>
      case 'upToDate':
        return <em>{_('xosanPackUpdateUpToDate')}</em>
      case 'packFound':
        return (
          <div>
            {_('xosanPackUpdateVersion', {
              version: pack.version,
            })}
          </div>
        )
    }
  }
}
