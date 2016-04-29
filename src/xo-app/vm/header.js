import Icon from 'icon'
import React, { Component } from 'react'
import xo from 'xo'
import { Row, Col } from 'grid'
import { Text } from 'editable'
import {
  connectStore
} from 'utils'
import {
  createGetObject
} from 'selectors'

import VmActionBar from './action-bar'

// ===================================================================

@connectStore(() => {
  const getVm = createGetObject()

  const getContainer = createGetObject(
    (...args) => getVm(...args).$container
  )

  const getPool = createGetObject(
    (...args) => getVm(...args).$pool
  )

  return (state, props) => {
    const vm = getVm(state, props)
    if (!vm) {
      return {}
    }

    return {
      container: getContainer(state, props),
      pool: getPool(state, props),
      vm
    }
  }
})
export default class Header extends Component {
  render () {
    const { vm, container, pool } = this.props
    if (!vm || !pool) {
      return <Icon icon='loading' />
    }
    return <Row>
      <Col smallSize={6}>
        <h1>
          <Icon icon={`vm-${vm.power_state.toLowerCase()}`} />&nbsp;
          <Text
            onChange={(value) => xo.call('vm.set', { id: vm.id, name_label: value })}
          >{vm.name_label}</Text>
          <small className='text-muted'> - {container.name_label} ({pool.name_label})</small>
        </h1>
        <p className='lead'>
          <Text
            onChange={(value) => xo.call('vm.set', { id: vm.id, name_description: value })}
          >{vm.name_description}</Text>
        </p>
      </Col>
      <Col smallSize={6}>
        <div className='pull-xs-right'>
          <VmActionBar vm={vm} handlers={this.props}/>
        </div>
      </Col>
    </Row>
  }
}
