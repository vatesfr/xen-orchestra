import React from 'react'
import SelectLicense from 'select-license'
import { forEach } from 'lodash'

import BaseComponent from '../../base-component'
import { Host } from '../../render-xo-item'

export default class PoolBindLicenseModal extends BaseComponent {
  get value() {
    return this.state.licenseIdToBindByHost
  }

  _handleXcpngLicenseSelection = hostId => event => {
    const { licenseIdToBindByHost } = this.state
    const licenseId = event.target.value
    forEach(licenseIdToBindByHost, (_licenseId, _hostId) => {
      if (_licenseId === licenseId) {
        delete licenseIdToBindByHost[_hostId]
      }
    })

    this.setState({
      licenseIdToBindByHost: { ...licenseIdToBindByHost, [hostId]: licenseId },
    })
  }

  render() {
    const { hosts } = this.props
    return (
      <div>
        {hosts.map(({ id }) => (
          <div key={id}>
            <Host id={id} link newTab />
            <SelectLicense productType='xcpng' withBounded onChange={this._handleXcpngLicenseSelection(id)} />
          </div>
        ))}
      </div>
    )
  }
}
