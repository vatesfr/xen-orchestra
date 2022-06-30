import _ from 'intl'
import Component from 'base-component'
import Copiable from 'copiable'
import Icon from 'icon'
import Link from 'link'
import Page from '../page'
import PropTypes from 'prop-types'
import React, { cloneElement } from 'react'
import SrActionBar from './action-bar'
import { Container, Row, Col } from 'grid'
import { editSr } from 'xo'
import { NavLink, NavTabs } from 'nav'
import { Text } from 'editable'
import { map, pick } from 'lodash'
import { connectStore, routes } from 'utils'
import { createGetObject, createGetObjectMessages, createGetObjectsOfType, createSelector } from 'selectors'

import TabAdvanced from './tab-advanced'
import TabDisks from './tab-disks'
import TabGeneral from './tab-general'
import TabHosts from './tab-host'
import TabLogs from './tab-logs'
import TabStats from './tab-stats'
import TabXosan from './tab-xosan'

// ===================================================================

@routes('general', {
  advanced: TabAdvanced,
  disks: TabDisks,
  general: TabGeneral,
  hosts: TabHosts,
  logs: TabLogs,
  stats: TabStats,
  xosan: TabXosan,
})
@connectStore(() => {
  const getSr = createGetObject()

  const getContainer = createGetObject((state, props) => getSr(state, props).$container)

  const getPbds = createGetObjectsOfType('PBD').pick(createSelector(getSr, sr => sr.$PBDs))

  const getSrHosts = createGetObjectsOfType('host').pick(createSelector(getPbds, pbds => map(pbds, pbd => pbd.host)))

  // -----------------------------------------------------------------

  const getLogs = createGetObjectMessages(getSr)

  // -----------------------------------------------------------------

  const getVdiIds = (state, props) => getSr(state, props).VDIs

  const getVdis = createGetObjectsOfType('VDI').pick(getVdiIds).sort()
  const getVdiSnapshots = createGetObjectsOfType('VDI-snapshot').pick(getVdiIds).sort()
  const getUnmanagedVdis = createGetObjectsOfType('VDI-unmanaged').pick(createSelector(getSr, sr => sr.VDIs))

  // -----------------------------------------------------------------

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
      unmanagedVdis: getUnmanagedVdis(state, props),
      vdiSnapshots: getVdiSnapshots(state, props),
      sr,
    }
  }
})
export default class Sr extends Component {
  static contextTypes = {
    router: PropTypes.object,
  }

  componentWillReceiveProps(props) {
    if (this.props.sr && !props.sr) {
      this.context.router.push('/')
    }
  }

  header() {
    const { sr, container } = this.props
    if (!sr) {
      return <Icon icon='loading' />
    }
    return (
      <Container>
        <Row>
          <Col mediumSize={6} className='header-title'>
            <h2>
              <Icon icon='sr' /> <Text value={sr.name_label} onChange={nameLabel => editSr(sr, { nameLabel })} />
              {sr.inMaintenanceMode && <span className='tag tag-pill tag-warning ml-1'>{_('maintenanceMode')}</span>}
            </h2>
            <Copiable tagName='pre' className='text-muted mb-0'>
              {sr.uuid}
            </Copiable>
            <span>
              <Text value={sr.name_description} onChange={nameDescription => editSr(sr, { nameDescription })} />
              {container && (
                <span className='text-muted'>
                  {' - '}
                  <Link to={`/${container.type}s/${container.id}`}>{container.name_label}</Link>
                </span>
              )}
            </span>
          </Col>
          <Col mediumSize={6}>
            <div className='text-xs-center'>
              <SrActionBar sr={sr} />
            </div>
          </Col>
        </Row>
        <Row>
          <Col>
            <NavTabs>
              <NavLink to={`/srs/${sr.id}/general`}>{_('generalTabName')}</NavLink>
              <NavLink to={`/srs/${sr.id}/stats`}>{_('statsTabName')}</NavLink>
              <NavLink to={`/srs/${sr.id}/disks`}>{_('disksTabName', { disks: sr.VDIs.length })}</NavLink>
              {sr.SR_type === 'xosan' && <NavLink to={`/srs/${sr.id}/xosan`}>XOSAN</NavLink>}
              <NavLink to={`/srs/${sr.id}/hosts`}>{_('hostsTabName')}</NavLink>
              <NavLink to={`/srs/${sr.id}/logs`}>{_('logsTabName')}</NavLink>
              <NavLink to={`/srs/${sr.id}/advanced`}>{_('advancedTabName')}</NavLink>
            </NavTabs>
          </Col>
        </Row>
      </Container>
    )
  }

  render() {
    const { container, sr } = this.props
    if (!sr) {
      return <h1>{_('statusLoading')}</h1>
    }
    const childProps = Object.assign(
      pick(this.props, ['hosts', 'logs', 'pbds', 'sr', 'vdis', 'unmanagedVdis', 'vdiSnapshots'])
    )
    return (
      <Page header={this.header()} title={`${sr.name_label}${container ? ` (${container.name_label})` : ''}`}>
        {cloneElement(this.props.children, childProps)}
      </Page>
    )
  }
}
