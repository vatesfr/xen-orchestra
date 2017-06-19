import _ from 'intl'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import React from 'react'
import xml2js from 'xml2js'
import { Card, CardHeader, CardBlock } from 'card'
import { confirm } from 'modal'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { fromCallback } from 'promise-toolbox'
import { Container, Row, Col } from 'grid'
import {
  deleteMessage,
  deleteOrphanedVdis,
  deleteVbd,
  deleteVdi,
  deleteVm,
  isSrWritable
} from 'xo'
import {
  flatten,
  get,
  isEmpty,
  map,
  mapValues
} from 'lodash'
import {
  createCollectionWrapper,
  createGetObject,
  createGetObjectsOfType,
  createSelector
} from 'selectors'
import {
  connectStore,
  formatSize,
  mapPlus,
  noop
} from 'utils'

const SrColContainer = connectStore(() => ({
  container: createGetObject()
}))(({ container }) => <Link to={`${container.type}s/${container.id}`}>{container.name_label}</Link>)

const VdiColSr = connectStore(() => ({
  sr: createGetObject()
}))(({ sr }) => <Link to={`srs/${sr.id}`}>{sr.name_label}</Link>)

const VmColContainer = connectStore(() => ({
  container: createGetObject()
}))(({ container }) => <span>{container.name_label}</span>)

const AlarmColObject = connectStore(() => ({
  object: createGetObject()
}))(({ object }) => {
  if (!object) {
    return null
  }

  switch (object.type) {
    case 'VM':
      return <Link to={`vms/${object.id}`}>{object.name_label}</Link>
    case 'VM-controller':
      return <Link to={`hosts/${object.$container}`}>{object.name_label}</Link>
    case 'host':
      return <Link to={`hosts/${object.id}`}>{object.name_label}</Link>
    default:
      return null
  }
})

const AlarmColPool = connectStore(() => ({
  pool: createGetObject()
}))(({ pool }) => {
  if (!pool) {
    return null
  }
  return <Link to={`pools/${pool.id}`}>{pool.name_label}</Link>
})

const SR_COLUMNS = [
  {
    name: _('srName'),
    itemRenderer: sr => sr.name_label,
    sortCriteria: sr => sr.name_label
  },
  {
    name: _('srPool'),
    itemRenderer: sr => <SrColContainer id={sr.$container} />
  },
  {
    name: _('srFormat'),
    itemRenderer: sr => sr.SR_type,
    sortCriteria: sr => sr.SR_type
  },
  {
    name: _('srSize'),
    itemRenderer: sr => formatSize(sr.size),
    sortCriteria: sr => sr.size
  },
  {
    default: true,
    name: _('srUsage'),
    itemRenderer: sr => sr.size > 1 &&
      <Tooltip content={_('spaceLeftTooltip', {used: Math.round((sr.physical_usage / sr.size) * 100), free: formatSize(sr.size - sr.physical_usage)})}>
        <meter value={(sr.physical_usage / sr.size) * 100} min='0' max='100' optimum='40' low='80' high='90' />
      </Tooltip>,
    sortCriteria: sr => sr.physical_usage / sr.size,
    sortOrder: 'desc'
  }
]

const ORPHANED_VDI_COLUMNS = [
  {
    name: _('snapshotDate'),
    itemRenderer: vdi => <span>
      <FormattedTime
        day='numeric'
        hour='numeric'
        minute='numeric'
        month='long'
        value={vdi.snapshot_time * 1000}
        year='numeric'
      />
      {' '}
      (<FormattedRelative value={vdi.snapshot_time * 1000} />)
    </span>,
    sortCriteria: vdi => vdi.snapshot_time,
    sortOrder: 'desc'
  },
  {
    name: _('vdiNameLabel'),
    itemRenderer: vdi => vdi.name_label,
    sortCriteria: vdi => vdi.name_label
  },
  {
    name: _('vdiNameDescription'),
    itemRenderer: vdi => vdi.name_description,
    sortCriteria: vdi => vdi.name_description
  },
  {
    name: _('vdiSize'),
    itemRenderer: vdi => formatSize(vdi.size),
    sortCriteria: vdi => vdi.size
  },
  {
    name: _('vdiSr'),
    itemRenderer: vdi => <VdiColSr id={vdi.$SR} />
  },
  {
    name: _('logAction'),
    itemRenderer: vdi => (
      <ActionRowButton
        btnStyle='danger'
        handler={deleteVdi}
        handlerParam={vdi}
        icon='delete'
      />
    )
  }
]

const CONTROL_DOMAIN_VDI_COLUMNS = [
  {
    name: _('vdiNameLabel'),
    itemRenderer: vdi => vdi && vdi.name_label,
    sortCriteria: vdi => vdi && vdi.name_label
  },
  {
    name: _('vdiNameDescription'),
    itemRenderer: vdi => vdi && vdi.name_description,
    sortCriteria: vdi => vdi && vdi.name_description
  },
  {
    name: _('vdiPool'),
    itemRenderer: vdi => vdi && vdi.pool && <Link to={`pools/${vdi.pool.id}`}>{vdi.pool.name_label}</Link>,
    sortCriteria: vdi => vdi && vdi.pool && vdi.pool.name_label
  },
  {
    name: _('vdiSize'),
    itemRenderer: vdi => vdi && formatSize(vdi.size),
    sortCriteria: vdi => vdi && vdi.size
  },
  {
    name: _('vdiSr'),
    itemRenderer: vdi => vdi && vdi.sr && <Link to={`srs/${vdi.sr.id}`}>{vdi.sr.name_label}</Link>,
    sortCriteria: vdi => vdi && vdi.sr && vdi.sr.name_label
  },
  {
    name: _('vdiAction'),
    itemRenderer: vdi => vdi && vdi.vbd && <ActionRowButton
      btnStyle='danger'
      handler={deleteVbd}
      handlerParam={vdi.vbd}
      icon='delete'
    />
  }
]

const VM_COLUMNS = [
  {
    name: _('snapshotDate'),
    itemRenderer: vm => <span>
      <FormattedTime
        day='numeric'
        hour='numeric'
        minute='numeric'
        month='long'
        value={vm.snapshot_time * 1000}
        year='numeric'
      />
      {' '}
      (<FormattedRelative value={vm.snapshot_time * 1000} />)
    </span>,
    sortCriteria: vm => vm.snapshot_time,
    sortOrder: 'desc'
  },
  {
    name: _('vmNameLabel'),
    itemRenderer: vm => vm.name_label,
    sortCriteria: vm => vm.name_label
  },
  {
    name: _('vmNameDescription'),
    itemRenderer: vm => vm.name_description,
    sortCriteria: vm => vm.name_description
  },
  {
    name: _('vmContainer'),
    itemRenderer: vm => <VmColContainer id={vm.$container} />
  },
  {
    name: _('logAction'),
    itemRenderer: vm => (
      <ActionRowButton
        btnStyle='danger'
        handler={deleteVm}
        handlerParam={vm}
        icon='delete'
      />
    )
  }
]

const ALARM_COLUMNS = [
  {
    name: _('alarmDate'),
    itemRenderer: message => <span>
      <FormattedTime
        day='numeric'
        hour='numeric'
        minute='numeric'
        month='long'
        value={message.time * 1000}
        year='numeric'
      />
      {' '}
      (<FormattedRelative value={message.time * 1000} />)
    </span>,
    sortCriteria: message => message.time,
    sortOrder: 'desc'
  },
  {
    name: _('alarmContent'),
    itemRenderer: ({ formatted, body }) => formatted
      ? <div>
        <Row>
          <Col mediumSize={6}><strong>{formatted.name}</strong></Col>
          <Col mediumSize={6}>{formatted.value}</Col>
        </Row>
        <br />
        {map(formatted.alarmAttributes, (value, label) => <Row>
          <Col mediumSize={6}>{label}</Col>
          <Col mediumSize={6}>{value}</Col>
        </Row>)}
      </div>
      : <pre style={{ whiteSpace: 'pre-wrap' }}>{body}</pre>,
    sortCriteria: message => message.body
  },
  {
    name: _('alarmObject'),
    itemRenderer: message => <AlarmColObject id={message.$object} />
  },
  {
    name: _('alarmPool'),
    itemRenderer: message => <AlarmColPool id={message.$pool} />
  },
  {
    name: _('logAction'),
    itemRenderer: message => (
      <ActionRowButton
        btnStyle='danger'
        handler={deleteMessage}
        handlerParam={message}
        icon='delete'
      />
    )
  }
]

@connectStore(() => {
  const getOrphanVdiSnapshots = createGetObjectsOfType('VDI-snapshot')
    .filter([ _ => !_.$snapshot_of && _.$VBDs.length === 0 ])
    .sort()
  const getControlDomainVbds = createGetObjectsOfType('VBD')
    .pick(
      createSelector(
        createGetObjectsOfType('VM-controller'),
        createCollectionWrapper(
          vmControllers => flatten(map(vmControllers, '$VBDs'))
        )
      )
    )
    .sort()
  const getControlDomainVdis = createSelector(
    getControlDomainVbds,
    createGetObjectsOfType('VDI'),
    createGetObjectsOfType('pool'),
    createGetObjectsOfType('SR'),
    (vbds, vdis, pools, srs) =>
      mapPlus(vbds, (vbd, push) => {
        const vdi = vdis[vbd.VDI]

        if (vdi == null) {
          return
        }

        push({
          ...vdi,
          pool: pools[vbd.$pool],
          sr: srs[vdi.$SR],
          vbd
        })
      }
    )
  )
  const getOrphanVmSnapshots = createGetObjectsOfType('VM-snapshot')
    .filter([ snapshot => !snapshot.$snapshot_of ])
    .sort()
  const getUserSrs = createGetObjectsOfType('SR')
    .filter([ isSrWritable ])
  const getVdiSrs = createGetObjectsOfType('SR')
    .pick(createSelector(
      getOrphanVdiSnapshots,
      snapshots => map(snapshots, '$SR')
    ))
  const getAlertMessages = createGetObjectsOfType('message')
    .filter([ message => message.name === 'ALARM' ])

  return {
    alertMessages: getAlertMessages,
    controlDomainVdis: getControlDomainVdis,
    userSrs: getUserSrs,
    vdiOrphaned: getOrphanVdiSnapshots,
    vdiSr: getVdiSrs,
    vmOrphaned: getOrphanVmSnapshots
  }
})
export default class Health extends Component {
  componentWillReceiveProps (props) {
    if (props.alertMessages !== this.props.alertMessages) {
      this._updateAlarms(props)
    }
  }

  componentDidMount () {
    this._updateAlarms(this.props)
  }

  _updateAlarms = props => {
    Promise.all(
      map(props.alertMessages, ({ body }, id) => {
        const matches = /^value:\s*([0-9.]+)\s+config:\s*([^]*)$/.exec(body)
        if (!matches) {
          return
        }

        const [ , value, xml ] = matches
        return fromCallback(cb =>
          xml2js.parseString(xml, cb)
        ).then(
          result => {
            const object = mapValues(result && result.variable, value => get(value, '[0].$.value'))
            if (!object || !object.name) {
              return
            }

            const { name, ...alarmAttributes } = object

            return { name, value, alarmAttributes, id }
          },
          noop
        )
      })
    ).then(
      formattedMessages => {
        this.setState({
          messages: map(formattedMessages, ({ ...formattedMessage, id }) => ({
            formatted: formattedMessage,
            ...props.alertMessages[id]
          }))
        })
      },
      noop
    )
  }

  _deleteOrphanedVdis = () =>
    deleteOrphanedVdis(this.props.vdiOrphaned)

  _deleteAllLogs = () => (
    confirm({
      title: _('removeAllLogsModalTitle'),
      body: <div>
        <p>{_('removeAllLogsModalWarning')}</p>
        <p>{_('definitiveMessageModal')}</p>
      </div>
    }).then(
      () => Promise.all(map(this.props.alertMessages, deleteMessage)),
      noop
    )
  )

  _getSrUrl = sr => `srs/${sr.id}`

  render () {
    return process.env.XOA_PLAN > 3
      ? <Container>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='disk' /> {_('srStatePanel')}
              </CardHeader>
              <CardBlock>
                {isEmpty(this.props.userSrs)
                  ? <p className='text-xs-center'>{_('noSrs')}</p>
                  : <Row>
                    <Col>
                      <SortedTable
                        collection={this.props.userSrs}
                        columns={SR_COLUMNS}
                        rowLink={this._getSrUrl}
                      />
                    </Col>
                  </Row>
                }
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='disk' /> {_('orphanedVdis')}
              </CardHeader>
              <CardBlock>
                {isEmpty(this.props.vdiOrphaned)
                  ? <p className='text-xs-center'>{_('noOrphanedObject')}</p>
                  : <div>
                    <Row>
                      <Col className='text-xs-right'>
                        <TabButton
                          btnStyle='danger'
                          handler={this._deleteOrphanedVdis}
                          icon='delete'
                          labelId='removeAllOrphanedObject'
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <SortedTable collection={this.props.vdiOrphaned} columns={ORPHANED_VDI_COLUMNS} />
                      </Col>
                    </Row>
                  </div>
                }
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='disk' /> {_('vdisOnControlDomain')}
              </CardHeader>
              <CardBlock>
                {isEmpty(this.props.controlDomainVdis)
                  ? <p className='text-xs-center'>{_('noControlDomainVdis')}</p>
                  : <SortedTable collection={this.props.controlDomainVdis} columns={CONTROL_DOMAIN_VDI_COLUMNS} />
                }
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='vm' /> {_('orphanedVms')}
              </CardHeader>
              <CardBlock>
                {isEmpty(this.props.vmOrphaned)
                  ? <p className='text-xs-center'>{_('noOrphanedObject')}</p>
                  : <SortedTable collection={this.props.vmOrphaned} columns={VM_COLUMNS} />
                }
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='alarm' /> {_('alarmMessage')}
              </CardHeader>
              <CardBlock>
                {isEmpty(this.props.alertMessages)
                  ? <p className='text-xs-center'>{_('noAlarms')}</p>
                  : <div>
                    <Row>
                      <Col className='text-xs-right'>
                        <TabButton
                          btnStyle='danger'
                          handler={this._deleteAllLogs}
                          icon='delete'
                          labelId='logRemoveAll'
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <SortedTable collection={this.state.messages} columns={ALARM_COLUMNS} />
                      </Col>
                    </Row>
                  </div>
                }
              </CardBlock>
            </Card>
          </Col>
        </Row>
      </Container>
      : <Container><Upgrade place='health' available={4} /></Container>
  }
}
