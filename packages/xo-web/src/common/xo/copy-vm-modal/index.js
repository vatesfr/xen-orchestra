import React, { Component } from 'react'

import _, { messages } from '../../intl'
import SingleLineRow from '../../single-line-row'
import Upgrade from 'xoa-upgrade'
import { Col } from '../../grid'
import { SelectSr } from '../../select-objects'
import { Toggle } from '../../form'
import { injectIntl } from 'react-intl'

class CopyVmModalBody extends Component {
  state = {
    compress: false,
    copyMode: 'fastClone',
  }

  get value () {
    const { props, state } = this
    return {
      compress: state.compress,
      copyMode: state.copyMode,
      name: state.name || props.vm.name_label,
      sr: state.sr && state.sr.id,
    }
  }

  _onChangeCompress = compress => this.setState({ compress })
  _onChangeCopyMode = event =>
    this.setState({
      compress: false,
      copyMode: event.target.value,
      name: '',
      sr: '',
    })
  _onChangeName = event => this.setState({ name: event.target.value })
  _onChangeSr = sr => this.setState({ sr })

  render () {
    const { formatMessage } = this.props.intl
    const { compress, copyMode, name, sr } = this.state

    return process.env.XOA_PLAN > 2 ? (
      <div>
        <div>
          <SingleLineRow>
            <Col>
              <input
                checked={copyMode === 'fastClone'}
                name='copyMode'
                onChange={this._onChangeCopyMode}
                type='radio'
                value='fastClone'
              />
              <span> {_('fastCloneMode')} </span>
            </Col>
          </SingleLineRow>
        </div>
        <div className='mt-1'>
          <SingleLineRow>
            <Col>
              <input
                checked={copyMode === 'fullCopy'}
                name='copyMode'
                onChange={this._onChangeCopyMode}
                type='radio'
                value='fullCopy'
              />
              <span> {_('fullCopyMode')} </span>
            </Col>
          </SingleLineRow>
          <SingleLineRow className='mt-1'>
            <Col size={4} className='ml-2'>
              {_('copyVmSelectSr')}
            </Col>
            <Col size={6}>
              <SelectSr
                disabled={copyMode !== 'fullCopy'}
                onChange={this._onChangeSr}
                value={sr}
              />
            </Col>
          </SingleLineRow>
          <SingleLineRow className='mt-1'>
            <Col size={4} className='ml-2'>
              {_('copyVmName')}
            </Col>
            <Col size={6}>
              <input
                className='form-control'
                disabled={copyMode !== 'fullCopy'}
                onChange={this._onChangeName}
                placeholder={formatMessage(messages.copyVmNamePlaceholder)}
                type='text'
                value={name}
              />
            </Col>
          </SingleLineRow>
          <SingleLineRow className='mt-1'>
            <Col size={4} className='ml-2'>
              {_('copyVmCompress')}
            </Col>
            <Col size={6}>
              <Toggle
                disabled={copyMode !== 'fullCopy'}
                onChange={this._onChangeCompress}
                value={compress}
              />
            </Col>
          </SingleLineRow>
        </div>
      </div>
    ) : (
      <div>
        <Upgrade place='vmCopy' available={3} />
      </div>
    )
  }
}
export default injectIntl(CopyVmModalBody, { withRef: true })
