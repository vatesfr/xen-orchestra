import _ from 'intl'
import assign from 'lodash/assign'
import Component from 'base-component'
import find from 'lodash/find'
import flatten from 'lodash/flatten'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import Link from 'link'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import Page from '../page'
import pick from 'lodash/pick'
import React, { cloneElement } from 'react'
import SrActionBar from './action-bar'
import { Container, Row, Col } from 'grid'
import { editSr } from 'xo'
import { NavLink, NavTabs } from 'nav'
import { Text } from 'editable'
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
import TabXosan from './tab-xosan'

// ===================================================================

@routes('general', {
  advanced: TabAdvanced,
  general: TabGeneral,
  logs: TabLogs,
  hosts: TabHosts,
  disks: TabDisks,
  xosan: TabXosan
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

// -----------------------------------------------------------------------------

  const getVdis = createGetObjectsOfType('VDI').pick(
    createSelector(getSr, sr => sr.VDIs),
  ).sort()

  const getLogs = createGetObjectMessages(getSr)

  const getVbdsByVdi = createGetObjectsOfType('VBD').pick(
    createSelector(
      getVdis,
      vdis => flatten(map(vdis, vdi => vdi.$VBDs))
    )
  ).groupBy('VDI')

// -----------------------------------------------------------------------------

  const getVdiSnapshots = createGetObjectsOfType('VDI-snapshot').pick(
    createSelector(getSr, sr => sr.VDIs),
  ).sort()

  const getVdiSnapshotToVdi = createSelector(
    getVdis,
    getVdiSnapshots,
    (vdis, vdiSnapshots) => {
      const vdiSnapshotToVdi = {}
      forEach(vdiSnapshots, vdiSnapshot => {
        vdiSnapshotToVdi[vdiSnapshot.id] = vdiSnapshot.$snapshot_of && find(vdis, vdi => vdi.id === vdiSnapshot.$snapshot_of)
      })

      return vdiSnapshotToVdi
    }
  )

  const getVbdsByVdiSnapshot = createSelector(
    getVbdsByVdi,
    getVdiSnapshots,
    getVdiSnapshotToVdi,
    (vbdsByVdi, vdiSnapshots, vdiSnapshotToVdi) => {
      const vbdsByVdiSnapshot = {}
      forEach(vdiSnapshots, vdiSnapshot => {
        const vdi = vdiSnapshotToVdi[vdiSnapshot.id]
        vbdsByVdiSnapshot[vdiSnapshot.id] = vdi && vbdsByVdi[vdi.id]
      })

      return vbdsByVdiSnapshot
    }
  )

// -----------------------------------------------------------------------------

  const getVdisToVmIds = createSelector(
    getVbdsByVdi,
    getVbdsByVdiSnapshot,
    (vbdsByVdi, vbdsByVdiSnapshot) => mapValues({ ...vbdsByVdi, ...vbdsByVdiSnapshot }, vbds => {
      const vbd = find(vbds, 'VM')
      if (vbd) {
        return vbd.VM
      }
    })
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
      vdiSnapshots: getVdiSnapshots(state, props),
      vdisToVmIds: getVdisToVmIds(state, props),
      sr
    }
  }
})
export default class Sr extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }

  componentWillReceiveProps (props) {
    if (this.props.sr && !props.sr) {
      this.context.router.push('/')
    }
  }

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
            {container &&
              <span className='text-muted'>
                {' - '}<Link to={`/${container.type}s/${container.id}`}>{container.name_label}</Link>
              </span>
            }
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
            {sr.SR_type === 'xosan' &&
              <NavLink to={`/srs/${sr.id}/xosan`}>XOSAN</NavLink>
            }
            <NavLink to={`/srs/${sr.id}/hosts`}>{_('hostsTabName')}</NavLink>
            <NavLink to={`/srs/${sr.id}/logs`}>{_('logsTabName')}</NavLink>
            <NavLink to={`/srs/${sr.id}/advanced`}>{_('advancedTabName')}</NavLink>
          </NavTabs>
        </Col>
      </Row>
    </Container>
  }

  render () {
    const { container, sr } = this.props
    if (!sr) {
      return <h1>{_('statusLoading')}</h1>
    }
    const childProps = assign(pick(this.props, [
      'hosts',
      'logs',
      'pbds',
      'sr',
      'vdis',
      'vdiSnapshots',
      'vdisToVmIds'
    ]))
    return <Page header={this.header()} title={`${sr.name_label}${container ? ` (${container.name_label})` : ''}`}>
      {cloneElement(this.props.children, childProps)}
    </Page>
  }
}
