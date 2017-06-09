import _ from 'intl'
import Component from 'base-component'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import map from 'lodash/map'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import { BlockLink } from 'link'
import { Col } from 'grid'
import { connectStore } from 'utils'
import { createGetObject } from 'selectors'
import { editVmGroup } from 'xo'
import { Text } from 'editable'

import styles from './index.css'

@connectStore(() => {
  return (state, props) => {
    const vms = {}
    forEach(props.item.$VMs, vmId => {
      const getVM = createGetObject(() => vmId)
      vms[vmId] = getVM(state, props)
    })
    return {
      vms
    }
  }
})
export default class VmGroupItem extends Component {
  toggleState = stateField => () => this.setState({ [stateField]: !this.state[stateField] })
  _onSelect = () => this.props.onSelect(this.props.item.id)
  _setNameDescription = description => editVmGroup(this.props.item, {name_description: description})
  _setNameLabel = label => editVmGroup(this.props.item, {name_label: label})
  _getVmGroupState = (vmGroup) => {
    const states = map(this.props.vms, vm => vm.power_state)
    return (states.length === 0
    ? 'Busy'
    : states.indexOf('Halted') === -1
      ? states[0]
      : states.indexOf('Running') === -1
        ? states[0]
        : 'Busy')
  }

  render () {
    const { item: vmGroup, selected } = this.props
    return <div className={styles.item}>
      <BlockLink to={`/vm-group/${vmGroup.id}`}>
        <SingleLineRow>
          <Col smallSize={10} mediumSize={9} largeSize={3}>
            <EllipsisContainer>
              <input type='checkbox' checked={selected} onChange={this._onSelect} value={vmGroup.id} />
              &nbsp;&nbsp;
              <Ellipsis>
                <Text value={vmGroup.name_label} onChange={this._setNameLabel} useLongClick />
              </Ellipsis>
              &nbsp;&nbsp;
            </EllipsisContainer>
          </Col>
          <Col mediumSize={4} className='hidden-md-down'>
            <EllipsisContainer>
              <Ellipsis>
                <Text value={vmGroup.name_description} onChange={this._setNameDescription} useLongClick />
              </Ellipsis>
            </EllipsisContainer>
          </Col>
        </SingleLineRow>
      </BlockLink>
    </div>
  }
}
