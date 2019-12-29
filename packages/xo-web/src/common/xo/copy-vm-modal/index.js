import BaseComponent from 'base-component'
import React from 'react'
import Upgrade from 'xoa-upgrade'
import { injectIntl } from 'react-intl'

import _, { messages } from '../../intl'
import SelectCompression from '../../select-compression'
import SingleLineRow from '../../single-line-row'
import { Col } from '../../grid'
import { connectStore } from '../../utils'
import { createGetObject, createSelector } from '../../selectors'
import { SelectSr } from '../../select-objects'

@connectStore(
  {
    isZstdSupported: createSelector(
      createGetObject((_, { vm }) => vm.$container),
      container => container === undefined || container.zstdSupported
    ),
  },
  { withRef: true }
)
class CopyVmModalBody extends BaseComponent {
  state = {
    compression: '',
    copyMode: 'fullCopy',
  }

  get value() {
    const { props, state } = this
    return {
      compress:
        state.compression === 'zstd' ? 'zstd' : state.compression === 'native',
      copyMode: state.copyMode,
      name: state.name || props.vm.name_label,
      sr: state.sr && state.sr.id,
    }
  }

  render() {
    const {
      intl: { formatMessage },
      isZstdSupported,
    } = this.props
    const { compression, copyMode, name, sr } = this.state

    return process.env.XOA_PLAN > 2 ? (
      <div>
        <div>
          <SingleLineRow>
            <Col size={4}>{_('copyVmName')}</Col>
            <Col size={6} className='ml-2'>
              <input
                className='form-control'
                onChange={this.linkState('name')}
                placeholder={formatMessage(messages.copyVmNamePlaceholder)}
                type='text'
                value={name}
              />
            </Col>
          </SingleLineRow>
        </div>
        <div className='mt-1'>
          <SingleLineRow>
            <Col>
              <label>
                <input
                  checked={copyMode === 'fullCopy'}
                  name='copyMode'
                  onChange={this.linkState('copyMode')}
                  type='radio'
                  value='fullCopy'
                />
                <span> {_('fullCopyMode')} </span>
              </label>
            </Col>
          </SingleLineRow>
          <SingleLineRow className='mt-1'>
            <Col size={4} className='ml-2'>
              {_('copyVmSelectSr')}
            </Col>
            <Col size={6}>
              <SelectSr
                disabled={copyMode !== 'fullCopy'}
                onChange={this.linkState('sr')}
                value={sr}
              />
            </Col>
          </SingleLineRow>
          <SingleLineRow className='mt-1'>
            <Col size={4} className='ml-2'>
              {_('compression')}
            </Col>
            <Col size={6}>
              <SelectCompression
                disabled={copyMode !== 'fullCopy'}
                onChange={this.linkState('compression')}
                showZstd={isZstdSupported}
                value={compression}
              />
            </Col>
          </SingleLineRow>
        </div>
        <div>
          <SingleLineRow className='mt-1'>
            <Col>
              <label>
                <input
                  checked={copyMode === 'fastClone'}
                  name='copyMode'
                  onChange={this.linkState('copyMode')}
                  type='radio'
                  value='fastClone'
                />
                <span> {_('fastCloneMode')} </span>
              </label>
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
