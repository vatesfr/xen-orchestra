import _, { messages } from 'intl'
import map from 'lodash/map'
import React from 'react'
import { injectIntl } from 'react-intl'

import BaseComponent from 'base-component'
import SingleLineRow from 'single-line-row'
import Upgrade from 'xoa-upgrade'
import { Col } from 'grid'
import { createGetObjectsOfType } from 'selectors'
import { SelectSr } from 'select-objects'
import { Toggle } from 'form'
import { buildTemplate, connectStore } from 'utils'

@connectStore(
  () => {
    const getVms = createGetObjectsOfType('VM').pick((_, props) => props.vms)
    return {
      vms: getVms,
    }
  },
  { withRef: true }
)
class CopyVmsModalBody extends BaseComponent {
  get value () {
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
      compress: state.compress,
      names,
      sr: state.sr.id,
    }
  }

  componentWillMount () {
    this.setState({
      compress: false,
      namePattern: '{name}_COPY',
    })
  }

  _onChangeSr = sr => this.setState({ sr })
  _onChangeNamePattern = event =>
    this.setState({ namePattern: event.target.value })
  _onChangeCompress = compress => this.setState({ compress })

  render () {
    const { formatMessage } = this.props.intl
    const { compress, namePattern, sr } = this.state
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
          <Col size={6}>{_('copyVmCompress')}</Col>
          <Col size={6}>
            <Toggle onChange={this.linkState('compress')} value={compress} />
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
