import _ from 'intl'
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
  createGetObject,
  createGetObjectMessages,
  createGetObjectsOfType,
  createSelector
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
    (state, props) => getSr(state, props).$container
  )

  const getPbds = createGetObjectsOfType('PBD').pick(
    createSelector(getSr, sr => sr.$PBDs),
  )

  const getSrHosts = createGetObjectsOfType('host').pick(
    createSelector(
      getPbds,
      pbds => map(pbds, pbd => pbd.host)
    )
  )

  const getVdis = createGetObjectsOfType('VDI').pick(
    createSelector(getSr, sr => sr.VDIs),
  ).sort()

  const getLogs = createGetObjectMessages(getSr)

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
      <Row>
        <Col mediumSize={6} className='header-title'>
          <h2>
            <Icon icon='sr' />
            {' '}
            <Text
              value={sr.name_label}
              onChange={nameLabel => editSr(sr, { nameLabel })}
            />
          </h2>
          <span>
            <Text
              value={sr.name_description}
              onChange={nameDescription => editSr(sr, { nameDescription })}
            />
            <span className='text-muted'>
              {' - '}{container.name_label}
            </span>
          </span>
        </Col>
        <Col mediumSize={6}>
          <div className='text-xs-center'>
            <SrActionBar sr={sr} />
          </div>
        </Col>
      </Row>
      <br />
      <Row>
        <Col>
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
