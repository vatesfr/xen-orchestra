import Icon from 'icon'
import React, { Component } from 'react'
import { editHost } from 'xo'
import { Row, Col } from 'grid'
import { Text } from 'editable'
import {
  connectStore
} from 'utils'
import {
  createGetObject
} from 'selectors'

import HostActionBar from './action-bar'

// ===================================================================

@connectStore(() => {
  const getHost = createGetObject()

  const getPool = createGetObject(
    (...args) => getHost(...args).$pool
  )

  return (state, props) => {
    const host = getHost(state, props)
    if (!host) {
      return {}
    }

    return {
      host: getHost(state, props),
      pool: getPool(state, props)
    }
  }
})
export default class Header extends Component {
  render () {
    const { host, pool } = this.props
    if (!host) {
      return <Icon icon='loading' />
    }
    return <Row>
      <Col smallSize={6}>
        <h1>
          <Icon icon={`host-${host.power_state.toLowerCase()}`} />&nbsp;
          <Text
            onChange={(name_label) => editHost(host, { name_label })}
          >{host.name_label}</Text>
          <small className='text-muted'> - {pool.name_label}</small>
        </h1>
        <p className='lead'>
          <Text
            onChange={(name_description) => editHost(host, { name_description })}
          >{host.name_description}</Text>
        </p>
      </Col>
      <Col smallSize={6}>
        <div className='pull-xs-right'>
          <HostActionBar host={host} handlers={this.props}/>
        </div>
      </Col>
    </Row>
  }
}
