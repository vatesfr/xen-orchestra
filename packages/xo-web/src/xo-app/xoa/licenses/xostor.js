import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SelectLicense from 'select-license'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { bindLicense } from 'xo'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { groupBy } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { Pool, Sr } from 'render-xo-item'

class XostorLicensesForm extends Component {
  state = {
    licenseId: 'none',
  }

  onChangeLicense = event => {
    this.setState({ licenseId: event.target.value })
  }

  bind = () => {
    const { item, userData } = this.props
    return bindLicense(this.state.licenseId, item.uuid).then(userData.updateLicenses)
  }

  render() {
    const { item, userData } = this.props
    const { licenseId } = this.state
    const licenses = userData.licensesByXostorUuid[item.id]

    // Xostor bound to multiple licenses
    if (licenses?.length > 1) {
      return (
        <div>
          <span>{licenses.map(license => license.id.slice(-4)).join(',')}</span>{' '}
          <Tooltip content={_('xostorMultipleLicenses')}>
            <Icon color='text-danger' icon='alarm' />
          </Tooltip>
        </div>
      )
    }

    const license = licenses?.[0]
    return license !== undefined ? (
      <span>{license.id.slice(-4)}</span>
    ) : (
      <form className='form-inline'>
        <SelectLicense onChange={this.onChangeLicense} productType='xostor' />
        <ActionButton
          btnStyle='primary'
          className='ml-1'
          disabled={licenseId === 'none'}
          handler={this.bind}
          handlerParam={licenseId}
          icon='connect'
        >
          {_('bindLicense')}
        </ActionButton>
      </form>
    )
  }
}

const INDIVIDUAL_ACTIONS = [
  {
    label: _('productSupport'),
    icon: 'support',
    handler: () => window.open('https://xen-orchestra.com'),
  },
]

const COLUMNS = [
  {
    default: true,
    name: _('name'),
    itemRenderer: sr => <Sr id={sr.id} link container={false} />,
    sortCriteria: 'name_label',
  },
  { name: _('pool'), itemRenderer: sr => <Pool id={sr.$pool} link /> },
  { name: _('license'), component: XostorLicensesForm },
]
const Xostor = decorate([
  connectStore(() => ({
    xostorSrs: createGetObjectsOfType('SR').filter([({ SR_type }) => SR_type === 'linstor']),
  })),
  provideState({
    computed: {
      licensesByXostorUuid: (state, { xostorLicenses }) => groupBy(xostorLicenses, 'boundObjectId'),
    },
  }),
  injectState,
  ({ state, xostorSrs, updateLicenses }) => (
    <SortedTable
      collection={xostorSrs}
      columns={COLUMNS}
      data-updateLicenses={updateLicenses}
      data-licensesByXostorUuid={state.licensesByXostorUuid}
      individualActions={INDIVIDUAL_ACTIONS}
    />
  ),
])

export default Xostor
