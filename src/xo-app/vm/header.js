import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import React, { Component } from 'react'
import { editVm } from 'xo'
import { Container, Row, Col } from 'grid'
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
    return <Container>
      <Row>
        <Col smallSize={6}>
          <h2>
            {isEmpty(vm.current_operations)
              ? <Icon icon={`vm-${vm.power_state.toLowerCase()}`} />
              : <Icon icon='vm-busy' />
            }
            &nbsp;
            <Text
              onChange={value => editVm(vm, { name_label: value })}
            >{vm.name_label}</Text>
          </h2>
          <span>
            <Text
              onChange={value => editVm(vm, { name_description: value })}
            >{vm.name_description}</Text>
            <span className='text-muted'>
              {vm.power_state === 'Running' ? ' - ' + container.name_label : null}
              {' '}({pool.name_label})
            </span>
          </span>
        </Col>
        <Col smallSize={6}>
          <div className='pull-xs-right'>
            <VmActionBar vm={vm} handlers={this.props} />
          </div>
        </Col>
      </Row>
    </Container>
  }
}
