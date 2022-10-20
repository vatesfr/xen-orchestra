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
    const { licenseToBindByHost } = this.state
    const licenseId = event.target.value
    forEach(licenseToBindByHost, (_licenseId, _hostId) => {
      if (_licenseId === licenseId) {
        delete licenseToBindByHost[_hostId]
      }
    })

    this.setState({
      licenseIdToBindByHost: { ...licenseToBindByHost, [hostId]: licenseId },
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
