import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { connectStore, compareVersions } from 'utils'
import { subscribeResourceCatalog, subscribePlugins } from 'xo'
import { createGetObjectsOfType, createSelector, createCollectionWrapper } from 'selectors'
import { satisfies as versionSatisfies } from 'semver'
import {
  every,
  forEach,
  map
} from 'lodash'

const findLatestPack = (packs, hostsVersions) => {
  const checkVersion = version =>
    every(hostsVersions, hostVersion => versionSatisfies(hostVersion, version))

  let latestPack = { version: '0' }
  forEach(packs, pack => {
    const xsVersionRequirement = pack.requirements && pack.requirements.xenserver

    if (
      pack.type === 'iso' &&
      compareVersions(pack.version, latestPack.version) > 0 &&
      (!xsVersionRequirement || checkVersion(xsVersionRequirement))
    ) {
      latestPack = pack
    }
  })

  if (latestPack.version === '0') {
    // No compatible pack was found
    return
  }

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
    createSelector(
      () => this.props.hosts,
      createCollectionWrapper(hosts => map(hosts, 'version'))
    ),
    findLatestPack
  )

  get value () {
    return this._getXosanLatestPack()
  }

  render () {
    const { hosts } = this.props
    const latestPack = this._getXosanLatestPack()

    return <div>
      {latestPack
        ? <div>
          {_('xosanInstallPackOnHosts')}
          <ul>
            {map(hosts, host => <li key={host.id}>{host.name_label}</li>)}
          </ul>
          <div className='mt-1'>
            {_('xosanInstallPack', { pack: latestPack.name, version: latestPack.version })}
          </div>
        </div>
        : _('xosanNoPackFound')
      }
    </div>
  }
}
