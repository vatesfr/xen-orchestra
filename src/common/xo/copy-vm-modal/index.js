import React, { Component } from 'react'

import _, { messages } from '../../intl'
import SingleLineRow from '../../single-line-row'
import Upgrade from 'xoa-upgrade'
import { Col } from '../../grid'
import { SelectSr } from '../../select-objects'
import { Toggle } from '../../form'
import { injectIntl } from 'react-intl'

class CopyVmModalBody extends Component {
  state = { compress: false }

  get value () {
    const { state } = this
    return {
      compress: state.compress,
      name: this.state.name || this.props.vm.name_label,
      sr: state.sr.id
    }
  }

  _onChangeSr = sr => this.setState({ sr })
  _onChangeName = event => this.setState({ name: event.target.value })
  _onChangeCompress = compress => this.setState({ compress })

  render () {
    const { formatMessage } = this.props.intl
    return process.env.XOA_PLAN > 2 ? (
      <div>
        <SingleLineRow>
          <Col size={6}>{_('copyVmSelectSr')}</Col>
          <Col size={6}>
            <SelectSr onChange={this._onChangeSr} />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('copyVmName')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              onChange={this._onChangeName}
              placeholder={formatMessage(messages.copyVmNamePlaceholder)}
              type='text'
            />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('copyVmCompress')}</Col>
          <Col size={6}>
            <Toggle onChange={this._onChangeCompress} />
          </Col>
        </SingleLineRow>
      </div>
    ) : (
      <div>
        <Upgrade place='vmCopy' available={3} />
      </div>
    )
  }
}
export default injectIntl(CopyVmModalBody, { withRef: true })
