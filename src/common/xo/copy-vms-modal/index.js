import map from 'lodash/map'
import React, { Component } from 'react'
import size from 'lodash/size'
import { injectIntl } from 'react-intl'
import {
  connectStore,
  generateStrings
} from 'utils'

import SingleLineRow from '../../single-line-row'
import Upgrade from 'xoa-upgrade'
import _, { messages } from '../../intl'
import { Col } from '../../grid'
import { createGetObjectsOfType } from '../../selectors'
import { SelectSr } from '../../select-objects'
import { Toggle } from '../../form'

@connectStore(() => {
  const getVms = createGetObjectsOfType('VM').pick(
    (_, props) => props.vms
  )
  return {
    vms: getVms
  }
}, { withRef: true })
class CopyVmsModalBody extends Component {
  get value () {
    const { state } = this
    if (!state || !state.sr) {
      return {}
    }
    const { vms } = this.props
    const names = state.namePattern
      ? generateStrings(state.namePattern, size(vms), {
        '{name}': map(vms, vm => vm.name_label),
        '{id}': map(vms, vm => vm.id),
        '%': 1
      })
      : generateStrings('{name}_COPY', size(vms), { '{name}': map(vms, vm => vm.name_label) })
    return {
      compress: state.compress,
      names,
      sr: state.sr.id
    }
  }

  _onChangeSr = sr =>
    this.setState({ sr })
  _onChangeNamePattern = event =>
    this.setState({ namePattern: event.target.value })
  _onChangeCompress = compress =>
    this.setState({ compress })

  render () {
    const { formatMessage } = this.props.intl
    return process.env.XOA_PLAN > 2
      ? <div>
        <SingleLineRow>
          <Col size={6}>{_('copyVmSelectSr')}</Col>
          <Col size={6}>
            <SelectSr
              onChange={this._onChangeSr}
            />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('copyVmName')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              onChange={this._onChangeNamePattern}
              placeholder={formatMessage(messages.copyVmNamePatternPlaceholder)}
              type='text'
            />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('copyVmCompress')}</Col>
          <Col size={6}>
            <Toggle
              onChange={this._onChangeCompress}
            />
          </Col>
        </SingleLineRow>
      </div>
      : <div><Upgrade place='vmCopy' available={3} /></div>
  }
}
export default injectIntl(CopyVmsModalBody, { withRef: true })
