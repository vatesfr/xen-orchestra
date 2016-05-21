import _ from 'messages'
import assign from 'lodash/assign'
import Icon from 'icon'
import map from 'lodash/map'
import Page from '../page'
import pick from 'lodash/pick'
import SrActionBar from './action-bar'
import React, { cloneElement, Component } from 'react'
import { NavLink, NavTabs } from 'nav'
import { Text } from 'editable'
import { editSr } from 'xo'
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
  messages
} from 'selectors'

import TabAdvanced from './tab-advanced'
import TabGeneral from './tab-general'
import TabLogs from './tab-logs'
import TabHosts from './tab-host'
import TabDisks from './tab-disks'

// ===================================================================

@routes('general', {
  advanced: TabAdvanced,
  general: TabGeneral,
  logs: TabLogs,
  hosts: TabHosts,
  disks: TabDisks
})
@connectStore(() => {
  const getSr = createGetObject()

  const getContainer = createGetObject(
    (...args) => getSr(...args).$container
  )

  const getPbds = createGetObjects(
    createSelector(getSr, sr => sr.$PBDs),
  )

  const getSrHosts = createGetObjects(
    createSelector(
      getPbds,
      pbds => map(pbds, pbd => pbd.host)
    )
  )

  const getVdis = createSort(
    createGetObjects(
      createSelector(getSr, sr => sr.VDIs),
    ),
    'name_label'
  )

  const getLogs = createFilter(
    messages,
    createSelector(
      getSr,
      (sr) => ({ $object }) => $object === sr.id
    )
  )

  return (state, props) => {
    const sr = getSr(state, props)
    if (!sr) {
      return {}
    }

    return {
      container: getContainer(state, props),
      hosts: getSrHosts(state, props),
      pbds: getPbds(state, props),
      logs: getLogs(state, props),
      vdis: getVdis(state, props),
      sr
    }
  }
})
export default class Sr extends Component {
  header () {
    const { sr, container } = this.props
    if (!sr) {
      return <Icon icon='loading' />
    }
    return <Container>
      <Row className='header-title'>
        <Col smallSize={6}>
          <h2>
            <Icon icon='sr' />
            {' '}
            <Text
              onChange={nameLabel => editSr(sr, { nameLabel })}
            >{sr.name_label}</Text>
          </h2>
          <span>
            <Text
              onChange={nameDescription => editSr(sr, { nameDescription })}
            >{sr.name_description}</Text>
            <span className='text-muted'>
              {' - '}{container.name_label}
            </span>
          </span>
        </Col>
        <Col smallSize={6}>
          <div className='pull-xs-right'>
            <SrActionBar sr={sr} />
          </div>
        </Col>
      </Row>
      <Row>
        <Col size={12}>
          <NavTabs>
            <NavLink to={`/srs/${sr.id}/general`}>{_('generalTabName')}</NavLink>
            <NavLink to={`/srs/${sr.id}/disks`}>{_('disksTabName', { disks: sr.VDIs.length })}</NavLink>
            <NavLink to={`/srs/${sr.id}/hosts`}>{_('hostsTabName')}</NavLink>
            <NavLink to={`/srs/${sr.id}/logs`}>{_('logsTabName')}</NavLink>
            <NavLink to={`/srs/${sr.id}/advanced`}>{_('advancedTabName')}</NavLink>
          </NavTabs>
        </Col>
      </Row>
    </Container>
  }

  render () {
    const { sr } = this.props
    if (!sr) {
      return <h1>Loading…</h1>
    }
    const childProps = assign(pick(this.props, [
      'hosts',
      'logs',
      'pbds',
      'sr',
      'vdis'
    ])
   )
    return <Page header={this.header()}>
      {cloneElement(this.props.children, childProps)}
    </Page>
  }
}
