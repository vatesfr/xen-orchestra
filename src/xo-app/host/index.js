import Icon from 'icon'
import React, { Component } from 'react'
import xo from 'xo'
import { Row, Col } from 'grid'
import { Text } from 'editable'

import {
  autobind,
  connectStore
} from 'utils'

import {
  createGetObject
} from 'selectors'

const isRunning = (host) => host && host.power_state === 'Running'

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
      host,
      pool: getPool(state, props)
    }
  }
})
export default class Host extends Component {
  @autobind
  loop (host = this.props.host) {
    if (this.cancel) {
      this.cancel()
    }

    if (!isRunning(host)) {
      return
    }

    let cancelled = false
    this.cancel = () => { cancelled = true }

    xo.call('host.stats', { host: host.id }).then((stats) => {
      if (cancelled) {
        return
      }
      this.cancel = null

      clearTimeout(this.timeout)
      this.setState({
        statsOverview: stats
      }, () => {
        this.timeout = setTimeout(this.loop, stats.interval * 1000)
      })
    })
  }

  componentWillMount () {
    this.loop()
  }

  componentWillUnmount () {
    clearTimeout(this.timeout)
  }

  componentWillReceiveProps (props) {
    const hostCur = this.props.host
    const hostNext = props.host

    if (!isRunning(hostCur) && isRunning(hostNext)) {
      this.loop(hostNext)
    } else if (isRunning(hostCur) && !isRunning(hostNext)) {
      this.setState({
        statsOverview: undefined
      })
    }
  }
  render () {
    const { host, pool } = this.props
    if (!host) {
      return <h1>Loading…</h1>
    }
    return <div>
      <Row>
        <Col smallSize={6}>
          <h1>
            <Icon icon={`host-${host.power_state.toLowerCase()}`} />&nbsp;
            <Text
              onChange={(value) => xo.call('host.set', { id: host.id, name_label: value })}
            >{host.name_label}</Text>
            <small className='text-muted'> - {pool.name_label}</small>
          </h1>
          <p className='lead'>
            <Text
              onChange={(value) => xo.call('host.set', { id: host.id, name_description: value })}
            >{host.name_description}</Text>
          </p>
        </Col>
        <Col smallSize={6}>
          <div className='pull-xs-right'>
            {/* <HostActionBar host={host} handlers={this.props}/> */}
          </div>
        </Col>
      </Row>
    </div>
  }
}
