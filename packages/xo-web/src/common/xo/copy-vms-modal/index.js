import _, { messages } from 'intl'
import map from 'lodash/map'
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
import { createGetObjectsOfType } from '../../selectors'

@connectStore(
  () => {
    const getVms = createGetObjectsOfType('VM').pick((_, props) => props.vms)
    return {
      resolvedVms: getVms,
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
    const { resolvedVms } = this.props
    const { namePattern } = state

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

  render() {
    const {
      intl: { formatMessage },
      vms,
    } = this.props
    const { compression, namePattern, sr } = this.state

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
            {compression === 'zstd' && <ZstdChecker vms={vms} />}
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
