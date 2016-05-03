import Icon from 'icon'
import React, { Component } from 'react'
import { editHost } from 'xo'
import { Container, Row, Col } from 'grid'
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
    return <Container>
      <Row>
        <Col smallSize={6}>
          <h2>
            <Icon icon={`host-${host.power_state.toLowerCase()}`} />&nbsp;
            <Text
              onChange={nameLabel => editHost(host, { nameLabel })}
            >{host.name_label}</Text>
          </h2>
          <span>
            <Text
              onChange={nameDescription => editHost(host, { nameDescription })}
            >{host.name_description}</Text>
            <span className='text-muted'> - {pool.name_label}</span>
          </span>
        </Col>
        <Col smallSize={6}>
          <div className='pull-xs-right'>
            <HostActionBar host={host} handlers={this.props} />
          </div>
        </Col>
      </Row>
    </Container>
  }
}
