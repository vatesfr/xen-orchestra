import _, { messages } from 'intl'
import map from 'lodash/map'
import PropTypes from 'prop-types'
import React from 'react'
import { compileTemplate } from '@xen-orchestra/template'
import { injectIntl } from 'react-intl'

import BaseComponent from 'base-component'
import SingleLineRow from 'single-line-row'
import Upgrade from 'xoa-upgrade'
import { Col } from 'grid'
import { SelectSr } from 'select-objects'
import { connectStore } from 'utils'

import SelectCompression from '../../select-compression'
import ZstdChecker from '../../zstd-checker'
import {
  createGetObject,
  createGetObjectsOfType,
  createSelector,
} from '../../selectors'

@connectStore(
  () => {
    const getVms = createGetObjectsOfType('VM').pick((_, props) => props.vms)

    const getIsZstdSupported = createSelector(
      createGetObject(
        createSelector(getVms, vms =>
          vms.length === 1 ? Object.values(vms)[0].$container : undefined
        )
      ),
      container => container === undefined || container.zstdSupported
    )

    return {
      resolvedVms: getVms,
      isZstdSupported: getIsZstdSupported,
    }
  },
  { withRef: true }
)
class CopyVmsModalBody extends BaseComponent {
  get value() {
    const { state } = this
    if (!state || (state.copyMode === 'fullCopy' && state.sr == null)) {
      return {}
    }

    const { resolvedVms } = this.props
    const { compression, copyMode, namePattern, sr } = state

    const names = namePattern
      ? map(
          resolvedVms,
          compileTemplate(namePattern, {
            '{name}': vm => vm.name_label,
            '{id}': vm => vm.id,
          })
        )
      : map(resolvedVms, vm => vm.name_label)

    return {
      compression: compression === 'zstd' ? 'zstd' : compression === 'native',
      copyMode,
      names,
      sr: sr == null ? undefined : sr.id,
    }
  }

  componentWillMount() {
    this.setState({
      compression: '',
      copyMode: 'fullCopy',
      namePattern: '{name}_COPY',
    })
  }

  _onChangeSr = sr => this.setState({ sr })
  _onChangeNamePattern = event =>
    this.setState({ namePattern: event.target.value })

  render() {
    const {
      intl: { formatMessage },
      isZstdSupported,
      vms,
    } = this.props
    const { compression, copyMode, namePattern, sr } = this.state

    return process.env.XOA_PLAN > 2 ? (
      <div>
        <SingleLineRow>
          <Col size={6}>{_('copyVmName')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              onChange={this.linkState('namePattern')}
              placeholder={formatMessage(messages.copyVmNamePatternPlaceholder)}
              type='text'
              value={namePattern}
            />
          </Col>
        </SingleLineRow>
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
              {vms.length > 1 && compression === 'zstd' && (
                <ZstdChecker vms={vms} />
              )}
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

CopyVmsModalBody.PropTypes = {
  vms: PropTypes.arrayOf(PropTypes.string).isRequired,
}

export default injectIntl(CopyVmsModalBody, { withRef: true })
