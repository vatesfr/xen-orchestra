import React from 'react'
import SelectLicense from 'select-license'

import BaseComponent from '../../base-component'
import { Host } from '../../render-xo-item'

export default class PoolBindLicenseModal extends BaseComponent {
  licenseByHost = {}

  get value() {
    return this.licenseByHost
  }

  onSelectLicense = hostId => event => (this.licenseByHost[hostId] = event.target.value)

  render() {
    const { hosts } = this.props
    return (
      <div>
        {hosts.map(({ id }) => (
          <div key={id}>
            <Host id={id} link newTab />
            <SelectLicense productType='xcpng' showBoundLicenses onChange={this.onSelectLicense(id)} />
          </div>
        ))}
      </div>
    )
  }
}
