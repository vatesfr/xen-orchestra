import BaseComponent from 'base-component'
import React from 'react'
import SelectLicense from 'select-license'
import { Host } from 'render-xo-item'

class BindXostorLicensesModal extends BaseComponent {
  licenseByHost = {}

  get value() {
    return this.licenseByHost
  }

  onSelectLicense = hostId => event => (this.licenseByHost[hostId] = event.target.value)

  render() {
    return (
      <div>
        {this.props.hosts.map(({ id }) => (
          <div className='mb-1' key={id}>
            <Host id={id} link newTab />
            <SelectLicense onChange={this.onSelectLicense(id)} productType='xostor' showBoundLicenses />
          </div>
        ))}
      </div>
    )
  }
}

export default BindXostorLicensesModal
