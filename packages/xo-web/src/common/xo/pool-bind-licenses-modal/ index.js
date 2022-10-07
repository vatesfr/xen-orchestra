import React from 'react'
import { forEach } from 'lodash'

import BaseComponent from '../../base-component'
import { SelectXcpngLicense } from '../../select-objects'
import { Host } from '../../render-xo-item'

export default class PoolBindLicenseModal extends BaseComponent {
  get value() {
    return this.state.licenseToBindByHost
  }

  _handleXcpngLicenseSelection = hostId => license => {
    const { licenseToBindByHost } = this.state
    forEach(licenseToBindByHost, (_license, _hostId) => {
      if (_license.id === license.id) {
        delete licenseToBindByHost[_hostId]
      }
    })

    this.setState({
      licenseToBindByHost: { ...licenseToBindByHost, [hostId]: license },
    })
  }

  render() {
    const { hosts } = this.props
    return (
      <div>
        {hosts.map(({ id }) => (
          <div key={id}>
            <Host id={id} link newTab />
            <SelectXcpngLicense
              onChange={this._handleXcpngLicenseSelection(id)}
              value={this.state.licenseToBindByHost?.[id]}
              xcpngLicenses={this.props.xcpngLicenses}
            />
          </div>
        ))}
      </div>
    )
  }
}
