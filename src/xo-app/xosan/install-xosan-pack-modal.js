import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { connectStore, compareVersions } from 'utils'
import { subscribeResourceCatalog, subscribePlugins } from 'xo'
import { createGetObjectsOfType, createSelector } from 'selectors'
import {
  filter,
  forEach,
  map
} from 'lodash'

const findLatestPack = packs => {
  let latestPack = packs[0]

  forEach(packs, pack => {
    if (compareVersions(pack.version, latestPack.version) > 0) {
      latestPack = pack
    }
  })

  return latestPack
}

@connectStore({
  hosts: createGetObjectsOfType('host').filter(
    (_, { pool }) => host => pool && host.$pool === pool.id && !host.supplementalPacks['vates:XOSAN']
  )
}, { withRef: true })
export default class InstallXosanPackModal extends Component {
  componentDidMount () {
    this._unsubscribePlugins = subscribePlugins(plugins => this.setState({ plugins }))
    this._unsubscribeResourceCatalog = subscribeResourceCatalog(catalog => this.setState({ catalog }))
  }

  componentWillUnmount () {
    this._unsubscribePlugins()
    this._unsubscribeResourceCatalog()
  }

  _getXosanLatestPack = createSelector(
    () => this.state.catalog && this.state.catalog.xosan,
    xosanCatalog => findLatestPack(
      filter(xosanCatalog, (value, key) => key !== '_token' && value.type === 'iso')
    )
  )

  get value () {
    return this._getXosanLatestPack()
  }

  render () {
    const { hosts } = this.props
    const latestPack = this._getXosanLatestPack()

    return <div>
      {_('xosanInstallPackOnHosts')}
      <ul>
        {map(hosts, host => <li key={host.id}>{host.name_label}</li>)}
      </ul>
      {latestPack && <div className='mt-1'>
        {_('xosanInstallPack', { pack: latestPack.name, version: latestPack.version })}
      </div>}
    </div>
  }
}
