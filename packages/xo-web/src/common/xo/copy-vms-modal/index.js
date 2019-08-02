import _, { messages } from 'intl'
import map from 'lodash/map'
import React from 'react'
import { injectIntl } from 'react-intl'

import BaseComponent from 'base-component'
import SingleLineRow from 'single-line-row'
import Upgrade from 'xoa-upgrade'
import { Col } from 'grid'
import { SelectSr } from 'select-objects'
import { buildTemplate, connectStore } from 'utils'

import constructQueryString from '../../construct-query-string'
import Icon from '../../icon'
import Link from '../../link'
import SelectCompression from '../../select-compression'
import Tooltip from '../../tooltip'
import {
  createCollectionWrapper,
  createGetObjectsOfType,
  createSelector,
} from '../../selectors'

@connectStore(
  () => {
    const getVms = createGetObjectsOfType('VM').pick((_, props) => props.vms)
    return {
      containers: createSelector(
        createGetObjectsOfType('pool'),
        createGetObjectsOfType('host'),
        (pools, hosts) => ({ ...pools, ...hosts })
      ),
      vms: getVms,
    }
  },
  { withRef: true }
)
class CopyVmsModalBody extends BaseComponent {
  get value() {
    const { state } = this
    if (!state || !state.sr) {
      return {}
    }
    const { vms } = this.props
    const { namePattern } = state

    const names = namePattern
      ? map(
          vms,
          buildTemplate(namePattern, {
            '{name}': vm => vm.name_label,
            '{id}': vm => vm.id,
          })
        )
      : map(vms, vm => vm.name_label)
    return {
      compression:
        state.compression === 'zstd' ? 'zstd' : state.compression === 'native',
      names,
      sr: state.sr.id,
    }
  }

  componentWillMount() {
    this.setState({
      compression: '',
      namePattern: '{name}_COPY',
    })
  }

  _onChangeSr = sr => this.setState({ sr })
  _onChangeNamePattern = event =>
    this.setState({ namePattern: event.target.value })

  _getVmsWithoutZstd = createSelector(
    () => this.props.vms,
    () => this.props.containers,
    createCollectionWrapper((vms, containers) => {
      const vmIds = []
      for (const id in vms) {
        const container = containers[vms[id].$container]
        if (container !== undefined && !container.zstdSupported) {
          vmIds.push(id)
        }
      }
      return vmIds
    })
  )

  _getVmsWithoutZstdLink = createSelector(
    this._getVmsWithoutZstd,
    vms => ({
      pathname: '/home',
      query: {
        t: 'VM',
        s: constructQueryString({
          id: {
            __or: vms,
          },
        }),
      },
    })
  )

  render() {
    const { formatMessage } = this.props.intl
    const { compression, namePattern, sr } = this.state
    const nVmsWithoutZstd =
      compression === 'zstd' ? this._getVmsWithoutZstd().length : 0
    return process.env.XOA_PLAN > 2 ? (
      <div>
        <SingleLineRow>
          <Col size={6}>{_('copyVmSelectSr')}</Col>
          <Col size={6}>
            <SelectSr onChange={this.linkState('sr')} value={sr} />
          </Col>
        </SingleLineRow>
        &nbsp;
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
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('compression')}</Col>
          <Col size={6}>
            <SelectCompression
              onChange={this.linkState('compression')}
              value={compression}
            />
            {compression === 'zstd' && nVmsWithoutZstd > 0 && (
              <Tooltip content={_('notSupportedZstdTooltip')}>
                <Link
                  className='text-warning'
                  target='_blank'
                  to={this._getVmsWithoutZstdLink()}
                >
                  <Icon icon='alarm' />{' '}
                  {_('notSupportedZstdWarning', {
                    nVms: nVmsWithoutZstd,
                  })}
                </Link>
              </Tooltip>
            )}
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
export default injectIntl(CopyVmsModalBody, { withRef: true })
