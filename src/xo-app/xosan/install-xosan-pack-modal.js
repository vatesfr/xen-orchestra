import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import { connectStore, compareVersions } from 'utils'
import { subscribeResourceCatalog, subscribePlugins, registerXosan } from 'xo'
import { createGetObjectsOfType, createSelector } from 'selectors'
import {
  filter,
  find,
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
    const { plugins, catalog } = this.state
    console.log('catalog', catalog)
    const { hosts } = this.props
    const latestPack = this._getXosanLatestPack()

    const cloudPlugin = find(plugins, { id: 'cloud' })
    if (!cloudPlugin) {
      return _('xosanInstallCloudPlugin')
    }

    if (!cloudPlugin.loaded) {
      return _('xosanLoadCloudPlugin')
    }

    if (!catalog) {
      return _('xosanLoading')
    }

    const { xosan } = catalog._namespaces

    if (!xosan) {
      return <span><Icon icon='error' /> {_('xosanNotAvailable')}</span>
    }

    if (xosan.available) {
      return <ActionButton handler={registerXosan} btnStyle='primary' icon='add'>{_('xosanRegisterBeta')}</ActionButton>
    }

    if (xosan.pending) {
      return _('xosanSuccessfullyRegistered')
    }

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
