import _ from 'messages'
import assign from 'lodash/assign'
import Icon from 'icon'
import map from 'lodash/map'
import PoolActionBar from './action-bar'
import Page from '../page'
import pick from 'lodash/pick'
import React, { cloneElement, Component } from 'react'
import { NavLink, NavTabs } from 'nav'
import { Text } from 'editable'
import { editPool } from 'xo'
import { Container, Row, Col } from 'grid'
import {
  connectStore,
  routes
} from 'utils'
import {
  create as createSelector,
  createFilter,
  createGetObject,
  createGetObjects,
  createSort,
  hosts,
  messages,
  userSrs,
  vms
} from 'selectors'

import TabAdvanced from './tab-advanced'
import TabGeneral from './tab-general'
import TabLogs from './tab-logs'
import TabNetwork from './tab-network'
import TabHosts from './tab-host'
import TabPatches from './tab-patches'
import TabStorage from './tab-storage'

// ===================================================================

@routes('general', {
  advanced: TabAdvanced,
  general: TabGeneral,
  logs: TabLogs,
  network: TabNetwork,
  patches: TabPatches,
  hosts: TabHosts,
  storage: TabStorage
})
@connectStore(() => {
  const getPool = createGetObject()

  const getMaster = createGetObject(
    (...args) => getPool(...args).master
  )

  const getPifs = createSort(
    createGetObjects(
      createSelector(getMaster, host => host.PIFs),
    ),
    'device'
  )

  const getNetworks = createGetObjects(
    createSelector(
      getPifs,
      pifs => map(pifs, pif => pif.$network)
    )
  )

  const getPoolHosts = createFilter(
    hosts,
    createSelector(
      getPool,
      ({ id }) => obj => obj.$pool === id
    ),
    true
  )

  const getPoolSrs = createFilter(
    userSrs,
    createSelector(
      getPool,
      ({ id }) => obj => obj.$pool === id
    ),
    true
  )

  const getPoolVms = createFilter(
    vms,
    createSelector(
      getPool,
      ({ id }) => obj => obj.$pool === id
    ),
    true
  )

  const getLogs = createFilter(
    messages,
    createSelector(
      getPool,
      (pool) => ({ $object }) => $object === pool.id
    ),
    true
  )

  return (state, props) => {
    const pool = getPool(state, props)
    if (!pool) {
      return {}
    }

    return {
      hosts: getPoolHosts(state, props),
      logs: getLogs(state, props),
      srs: getPoolSrs(state, props),
      master: getMaster(state, props),
      networks: getNetworks(state, props),
      vms: getPoolVms(state, props),
      pool
    }
  }
})
export default class Pool extends Component {

  header () {
    const { pool } = this.props
    if (!pool) {
      return <Icon icon='loading' />
    }
    return <Container>
      <Row className='header-title'>
        <Col smallSize={6}>
          <h2>
            <Icon icon='pool' />&nbsp;
            <Text
              onChange={nameLabel => editPool(pool, { nameLabel })}
            >{pool.name_label}</Text>
          </h2>
          <span>
            <Text
              onChange={nameDescription => editPool(pool, { nameDescription })}
            >{pool.name_description}</Text>
          </span>
        </Col>
        <Col smallSize={6}>
          <div className='pull-xs-right'>
            <PoolActionBar pool={pool} handlers={this.props} />
          </div>
        </Col>
      </Row>
      <Row>
        <Col size={12}>
          <NavTabs>
            <NavLink to={`/pools/${pool.id}/general`}>{_('generalTabName')}</NavLink>
            <NavLink to={`/pools/${pool.id}/hosts`}>{_('hostsTabName')}</NavLink>
            <NavLink to={`/pools/${pool.id}/network`}>{_('networkTabName')}</NavLink>
            <NavLink to={`/pools/${pool.id}/storage`}>{_('storageTabName')}</NavLink>
            <NavLink to={`/pools/${pool.id}/patches`}>{_('patchesTabName')}</NavLink>
            <NavLink to={`/pools/${pool.id}/logs`}>{_('logsTabName')}</NavLink>
            <NavLink to={`/pools/${pool.id}/advanced`}>{_('advancedTabName')}</NavLink>
          </NavTabs>
        </Col>
      </Row>
    </Container>
  }

  render () {
    const { pool } = this.props
    if (!pool) {
      return <h1>Loading…</h1>
    }
    const childProps = assign(pick(this.props, [
      'hosts',
      'logs',
      'networks',
      'pool',
      'master',
      'srs',
      'vms'
    ])
   )
    return <Page header={this.header()}>
      {cloneElement(this.props.children, childProps)}
    </Page>
  }
}
