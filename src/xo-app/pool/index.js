import _ from 'intl'
import assign from 'lodash/assign'
import Icon from 'icon'
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
  createGetObject,
  createGetObjectMessages,
  createGetObjectsOfType,
  createSelector
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
    (state, props) => getPool(state, props).master
  )

  const getNetworks = createGetObjectsOfType('network').filter(
    createSelector(
      getPool,
      ({ id }) => network => network.$pool === id
    )
  ).sort()

  const getVifsByNetwork = createGetObjectsOfType('VIF').groupBy('$network')

  const getHosts = createGetObjectsOfType('host').filter(
    createSelector(
      getPool,
      ({ id }) => obj => obj.$pool === id
    )
  ).sort()

  const getPoolSrs = createGetObjectsOfType('SR').filter(
    createSelector(
      getPool,
      ({ id }) => sr => sr.$pool === id
    )
  ).sort()

  const getNumberOfVms = createGetObjectsOfType('VM').count(
    createSelector(
      getPool,
      ({ id }) => obj => obj.$pool === id
    )
  )

  const getLogs = createGetObjectMessages(getPool)

  return (state, props) => {
    const pool = getPool(state, props)
    if (!pool) {
      return {}
    }

    return {
      hosts: getHosts(state, props),
      logs: getLogs(state, props),
      master: getMaster(state, props),
      networks: getNetworks(state, props),
      nVms: getNumberOfVms(state, props),
      pool,
      srs: getPoolSrs(state, props),
      vifsByNetwork: getVifsByNetwork(state, props)
    }
  }
})
export default class Pool extends Component {

  _setNameDescription = nameDescription => editPool(this.props.pool, { name_description: nameDescription })
  _setNameLabel = nameLabel => editPool(this.props.pool, { name_label: nameLabel })

  header () {
    const { pool } = this.props
    if (!pool) {
      return <Icon icon='loading' />
    }
    return <Container>
      <Row>
        <Col mediumSize={6} className='header-title'>
          <h2>
            <Icon icon='pool' />
            {' '}
            <Text
              value={pool.name_label}
              onChange={this._setNameLabel}
            />
          </h2>
          <span>
            <Text
              value={pool.name_description}
              onChange={this._setNameDescription}
            />
          </span>
        </Col>
        <Col mediumSize={6}>
          <div className='text-xs-center'>
            <PoolActionBar pool={pool} />
          </div>
        </Col>
      </Row>
      <br />
      <Row>
        <Col>
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
      'master',
      'networks',
      'nVms',
      'pool',
      'srs',
      'vifsByNetwork'
    ])
   )
    return <Page header={this.header()} title={pool.name_label}>
      {cloneElement(this.props.children, childProps)}
    </Page>
  }
}
