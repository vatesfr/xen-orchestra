import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import React from 'react'
import SelectLicense from 'select-license'
import { bindLicense, rebindObjectLicense } from 'xo'

import BulkIcons from '../../../common/bulk-icons'

export default class LicenseForm extends Component {
  state = {
    licenseId: 'none',
  }

  bind = async () => {
    const { userData, item, itemUuidPath = 'uuid', license } = this.props
    if (license !== undefined) {
      await rebindObjectLicense(item[itemUuidPath], this.state.licenseId, license.productId)
    } else {
      await bindLicense(this.state.licenseId, item[itemUuidPath])
    }
    userData.updateLicenses()
    this.setState({ licenseId: 'none' })
  }

  render() {
    const { license } = this.props
    return (
      <div className='d-flex'>
        <div>
          {license !== undefined && license.id.slice(-4)}
          <BulkIcons alerts={this.props.alerts} />
        </div>
        <form className='form-inline ml-1'>
          <SelectLicense
            onChange={this.linkState('licenseId')}
            productType={this.props.productType}
            value={this.state.licenseId}
          />
          <ActionButton
            btnStyle='primary'
            className='ml-1'
            disabled={this.state.licenseId === 'none'}
            handler={this.bind}
            icon='connect'
          >
            {_(license === undefined ? 'bindLicense' : 'update')}
          </ActionButton>
        </form>
      </div>
    )
  }
}
