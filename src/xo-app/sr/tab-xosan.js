import _ from 'intl'
import ActionButton from 'action-button'
import Collapse from 'collapse'
import Copiable from 'copiable'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import Tooltip from 'tooltip'
import SingleLineRow from 'single-line-row'
import { confirm } from 'modal'
import { error } from 'notification'
import { Toggle } from 'form'
import { Container, Col, Row } from 'grid'
import {
  forEach,
  isEmpty,
  map,
  reduce,
  sum
} from 'lodash'
import {
  createGetObjectsOfType,
  createSelector
} from 'selectors'
import {
  addSubscriptions,
  connectStore,
  formatSize
} from 'utils'
import {
  addXosanBricks,
  fixHostNotInXosanNetwork,
  // TODO: uncomment when implementing subvolume deletion
  // removeXosanBricks,
  replaceXosanBrick,
  startVm,
  subscribeVolumeInfo
} from 'xo'

import { INFO_TYPES } from '../xosan'

import ReplaceBrickModalBody from './replace-brick-modal'
import AddSubvolumeModalBody from './add-subvolume-modal'

const ISSUE_CODE_TO_MESSAGE = {
  VMS_DOWN: 'xosanVmsNotRunning',
  VMS_NOT_FOUND: 'xosanVmsNotFound',
  FILES_NEED_HEALING: 'xosanFilesNeedHealing',
  HOST_NOT_IN_NETWORK: 'xosanHostNotInNetwork'
}

const BORDERS = {
  border: 'solid 2px #ccc',
  borderRadius: '5px',
  borderTop: 'none',
  padding: '1em'
}

const Issues = ({ issues }) => <div>
  {map(issues, issue => <div key={issue.key || issue.code} className='alert alert-danger mb-1' role='alert'>
    <Icon icon='error' /> <strong>{_(ISSUE_CODE_TO_MESSAGE[issue.code], issue.params)}</strong>
    {issue.fix && <Tooltip content={issue.fix.title}>
      <ActionButton
        btnStyle='danger'
        className='ml-1'
        handler={issue.fix.action}
        icon='fix'
        size='small'
      >
        {_('xosanFixIssue')}
      </ActionButton>
    </Tooltip>}
  </div>)}
</div>

const Field = ({ title, children }) => <SingleLineRow>
  <Col size={3}><strong>{title}</strong></Col>
  <Col size={9}>{children}</Col>
</SingleLineRow>

@connectStore({
  srs: createGetObjectsOfType('SR'),
  vms: createGetObjectsOfType('VM')
})
class Node extends Component {
  _replaceBrick = async ({ brick, vm }) => {
    const { sr, brickSize, onSameVm = false } = await confirm({
      icon: 'refresh',
      title: _('xosanReplace'),
      body: <ReplaceBrickModalBody vm={vm} />
    })

    if (sr == null || brickSize == null) {
      return error(_('xosanReplaceBrickErrorTitle'), _('xosanReplaceBrickErrorMessage'))
    }

    await replaceXosanBrick(this.props.sr, brick, sr, brickSize, onSameVm)
  }

  render () {
    const { srs } = this.props
    const { showAdvanced } = this.state

    const {
      config,
      heal,
      size,
      status,
      statusDetail,
      uuid,
      vm
    } = this.props.node

    return <Collapse
      buttonText={<span>
        <Icon
          color={heal
            ? heal.status === 'Connected'
              ? 'text-success'
              : 'text-warning'
            : 'text-danger'
          }
          icon='disk'
        /> {srs[config.underlyingSr].name_label}
      </span>}
      className='mb-1'
    >
      <div style={BORDERS}>
        <Container className='m-1'>
          <Field title={_('xosanVm')}>
            {vm !== undefined
              ? <span>
                <Tooltip content={_(`powerState${vm.power_state}`)}>
                  <Icon icon={vm.power_state.toLowerCase()} />
                </Tooltip> <Link to={`/vms/${config.vm.id}`}>{vm.name_label}</Link>
                {(vm.power_state !== 'Running') &&
                  <Tooltip content={_('xosanRun')}>
                    <ActionButton
                      handler={startVm}
                      handlerParam={vm}
                      icon='vm-start'
                      size='small'
                    />
                  </Tooltip>
                }
              </span>
              : <span style={{color: 'red'}}>
                <Icon icon='alarm' /> {_('xosanCouldNotFindVm')}
              </span>
            }
          </Field>
          <Field title={_('xosanUnderlyingStorage')}>
            <Link to={`/srs/${config.underlyingSr}`}>{srs[config.underlyingSr].name_label}</Link>
            {' - '}
            {size != null && _('xosanUnderlyingStorageUsage', { usage: formatSize(size) })}
          </Field>
          <Field title={_('xosanStatus')}>
            {heal ? heal.status : 'unknown'}
          </Field>
          {statusDetail && <Field title={_('xosanUsedSpace')}>
            <span style={{ display: 'inline-block', width: '20em', height: '1em' }}>
              <Tooltip content={_('spaceLeftTooltip', {
                used: String(Math.round(100 - (+statusDetail.sizeFree / +statusDetail.sizeTotal) * 100)),
                free: formatSize(+statusDetail.sizeFree)
              })}>
                <progress
                  className='progress'
                  max='100'
                  value={100 - (+statusDetail.sizeFree / +statusDetail.sizeTotal) * 100}
                />
              </Tooltip>
            </span>
          </Field>}
          {config.arbiter === 'True' && <Field title={_('xosanArbiter')} />}
          <ActionButton
            btnStyle='success'
            icon='refresh'
            handler={this._replaceBrick}
            handlerParam={{ brick: config.brickName, vm }}
          >
            {_('xosanReplace')}
          </ActionButton>
        </Container>
        <Toggle onChange={this.toggleState('showAdvanced')} value={showAdvanced} />
        {' '}
        {_('xosanAdvanced')}
        {showAdvanced && <Container>
          <Field title={_('xosanBrickName')}>
            <Copiable>{config.brickName}</Copiable>
          </Field>
          <Field title={_('xosanBrickUuid')}>
            <Copiable>{uuid}</Copiable>
          </Field>
          {statusDetail && [
            <Field key='usedInodes' title={_('xosanUsedInodes')}>
              <span style={{ display: 'inline-block', width: '20em', height: '1em' }}>
                <Tooltip content={_('spaceLeftTooltip', {
                  used: String(Math.round(100 - (+statusDetail.inodesFree / +statusDetail.inodesTotal) * 100)),
                  free: statusDetail.inodesFree
                })}>
                  <progress className='progress' max='100' value={100 - (+statusDetail.inodesFree / +statusDetail.inodesTotal) * 100}
                  />
                </Tooltip>
              </span>
            </Field>,
            <Field key='blockSize' title={_('xosanBlockSize')}>{statusDetail.blockSize}</Field>,
            <Field key='device' title={_('xosanDevice')}>{statusDetail.device}</Field>,
            <Field key='fsName' title={_('xosanFsName')}>{statusDetail.fsName}</Field>,
            <Field key='mountOptions' title={_('xosanMountOptions')}>{statusDetail.mntOptions}</Field>,
            <Field key='path' title={_('xosanPath')}>{statusDetail.path}</Field>
          ]}

          {status && status.length !== 0 && <Row className='mt-1'>
            <Col>
              <table className='table' style={{ maxWidth: '50em' }}>
                <thead>
                  <th>{_('xosanJob')}</th>
                  <th>{_('xosanPath')}</th>
                  <th>{_('xosanStatus')}</th>
                  <th>{_('xosanPid')}</th>
                  <th>{_('xosanPort')}</th>
                </thead>
                <tbody>
                  {map(status, job => <tr key={job.pid}>
                    <td>{job.hostname}</td>
                    <td>{job.path}</td>
                    <td>{job.status}</td>
                    <td>{job.pid}</td>
                    <td>{job.port}</td>
                  </tr>)}
                </tbody>
              </table>
            </Col>
          </Row>}
          {heal && heal.file && heal.file.length !== 0 && <div>
            <h4>{_('xosanFilesNeedingHealing')}</h4>
            {map(heal.file, file => <Row key={file.gfid}>
              <Col size={5}>{file._}</Col >
              <Col size={4}>{file.gfid}</Col>
            </Row>)}
          </div>}
        </Container>}
      </div>
    </Collapse>
  }
}

// -----------------------------------------------------------------------------

@connectStore(() => ({
  vms: createGetObjectsOfType('VM'),
  hosts: createGetObjectsOfType('host'),
  vbds: createGetObjectsOfType('VBD'),
  vdis: createGetObjectsOfType('VDI')
}))
@addSubscriptions(({ sr }) => {
  const subscriptions = {}
  forEach(INFO_TYPES, infoType => {
    subscriptions[`${infoType}_`] = cb => subscribeVolumeInfo({ sr, infoType }, cb)
  })

  return subscriptions
})
export default class TabXosan extends Component {
  _addSubvolume = async () => {
    const { srs, brickSize } = await confirm({
      icon: 'add',
      title: _('xosanAddSubvolume'),
      body: <AddSubvolumeModalBody sr={this.props.sr} subvolumeSize={this._getSubvolumeSize()} />
    })

    if (brickSize == null || (srs && srs.length) !== this._getSubvolumeSize()) {
      return error(_('xosanAddSubvolumeErrorTitle'), _('xosanAddSubvolumeErrorMessage', { nSrs: this._getSubvolumeSize() }))
    }

    return this._addBricks({ srs, brickSize })
  }

  // TODO: uncomment when implementing subvolume deletion
  // async _removeSubVolume (bricks) {
  //   await removeXosanBricks(this.props.sr.id, bricks)
  // }

  async _addBricks ({srs, brickSize}) {
    await addXosanBricks(this.props.sr.id, srs.map(sr => sr.id), brickSize)
  }

  _getStrippedVolumeInfo = createSelector(
    () => this.props.info_,
    info => info && info.commandStatus ? info.result : null
  )

  _getSubvolumeSize = createSelector(
    this._getStrippedVolumeInfo,
    strippedVolumeInfo => strippedVolumeInfo
      ? +strippedVolumeInfo.disperseCount || +strippedVolumeInfo.replicaCount
      : null
  )

  // TODO: uncomment when implementing subvolume deletion
  // _getSubvolumes = createSelector(
  //   this._getStrippedVolumeInfo,
  //   this._getSubvolumeSize,
  //   (strippedVolumeInfo, subvolumeSize) => {
  //     const subVolumes = []
  //     if (strippedVolumeInfo) {
  //       for (let i = 0; i < strippedVolumeInfo.bricks.length; i += subvolumeSize) {
  //         subVolumes.push(strippedVolumeInfo.bricks.slice(i, i + subvolumeSize))
  //       }
  //     }
  //
  //     return subVolumes
  //   }
  // )

  _getConfig = createSelector(
    () => this.props.sr && this.props.sr.other_config['xo:xosan_config'],
    otherConfig => otherConfig ? JSON.parse(otherConfig) : null
  )

  _getBrickByName = createSelector(
    this._getConfig,
    () => this.props.vms,
    () => this.props.vdis,
    () => this.props.vbds,
    () => this.props.heal_,
    () => this.props.status_,
    () => this.props.statusDetail_,
    this._getStrippedVolumeInfo,
    (xosanConfig, vms, vdis, vbds, heal, status, statusDetail, strippedVolumeInfo) => {
      const nodes = xosanConfig && xosanConfig.nodes

      const brickByName = {}
      forEach(nodes, node => {
        const vm = vms[node.vm.id]

        brickByName[node.brickName] = {
          config: node,
          uuid: '-',
          size: isEmpty(vm && vm.$VBDs)
            ? null
            : sum(map(vm.$VBDs, vbdId => {
              const vdi = vdis[vbds[vbdId].VDI]
              return vdi === undefined ? 0 : vdi.size
            })),
          vm
        }
      })

      const brickByUuid = {}
      if (strippedVolumeInfo) {
        forEach(strippedVolumeInfo.bricks, brick => {
          brickByName[brick.name] = brickByName[brick.name] || {}
          brickByName[brick.name].info = brick
          brickByName[brick.name].uuid = brick.hostUuid
          brickByUuid[brick.hostUuid] = brickByUuid[brick.hostUuid] || brickByName[brick.name]
        })
      }

      if (heal && heal.commandStatus) {
        forEach(heal.result.bricks, brick => {
          brickByName[brick.name] = brickByName[brick.name] || {}
          brickByName[brick.name].heal = brick
          brickByName[brick.name].uuid = brick.hostUuid
          brickByUuid[brick.hostUuid] = brickByUuid[brick.hostUuid] || brickByName[brick.name]
        })
      }

      if (status && status.commandStatus) {
        forEach(brickByUuid, (brick, uuid) => {
          brick.status = status.result.nodes[uuid]
        })
      }

      if (statusDetail && statusDetail.commandStatus) {
        forEach(brickByUuid, (brick, uuid) => {
          if (uuid in statusDetail.result.nodes) {
            brick.statusDetail = statusDetail.result.nodes[uuid][0]
          }
        })
      }

      return brickByName
    }
  )

  _getOrderedBrickList = createSelector(
    this._getConfig,
    this._getBrickByName,
    (xosanConfig, brickByName) => {
      if (!xosanConfig || !xosanConfig.nodes) {
        return
      }

      return map(xosanConfig.nodes, node => brickByName[node.brickName])
    }
  )

  _getIssues = createSelector(
    this._getOrderedBrickList,
    orderedBrickList => {
      if (orderedBrickList == null) {
        return
      }

      const issues = []
      if (reduce(orderedBrickList,
        (hasStopped, node) => hasStopped || (node.vm && node.vm.power_state !== 'Running'),
        false
      )) { issues.push({ code: 'VMS_DOWN' }) }

      if (reduce(orderedBrickList,
        (hasNotFound, node) => hasNotFound || node.vm === undefined,
        false
      )) { issues.push({ code: 'VMS_NOT_FOUND' }) }

      if (reduce(orderedBrickList,
        (hasFileToHeal, node) => hasFileToHeal || (node.heal && node.heal.file && node.heal.file.length !== 0),
        false
      )) { issues.push({ code: 'FILES_NEED_HEALING' }) }

      return issues
    }
  )

  render () {
    const { showAdvanced, hostStatus } = this.state
    const {
      heal_,
      hosts,
      info_,
      status_,
      statusDetail_
    } = this.props

    const xosanConfig = this._getConfig()

    if (!xosanConfig) {
      return null
    }

    if (!xosanConfig.version) {
      return <div>
        {_('xosanWarning')}
      </div>
    }

    const strippedVolumeInfo = this._getStrippedVolumeInfo()
    // const subVolumes = this._getSubvolumes() // TODO: uncomment when implementing subvolume deletion
    const orderedBrickList = this._getOrderedBrickList()
    const issues = this._getIssues()
    forEach(hostStatus, status => {
      issues.push({
        code: 'HOST_NOT_IN_NETWORK',
        key: 'HOST_NOT_IN_NETWORK' + status.host,
        params: {hostName: hosts[status.host].name_label},
        fix: {
          action: () => fixHostNotInXosanNetwork(this.props.sr.id, status.host),
          title: 'Will configure the host xosan network device with a static IP address and plug it in.'
        }
      })
    })

    return <Container>
      <Row className='text-xs-center mb-1 mt-1'>
        <Col size={3}>
          <h2><Icon icon='sr' size='lg' color={status_ ? (status_.commandStatus ? 'text-success' : status_.error) : 'text-info'} /></h2>
        </Col>
        <Col size={3}>
          <h2><Icon icon='health' size='lg' color={heal_ ? (heal_.commandStatus ? 'text-success' : heal_.error) : 'text-info'} /></h2>
        </Col>
        <Col size={3}>
          <h2><Icon icon='settings' size='lg' color={statusDetail_ ? (statusDetail_.commandStatus ? 'text-success' : statusDetail_.error) : 'text-info'} /></h2>
        </Col>
        <Col size={3}>
          <h2><Icon icon='info' size='lg' color={info_ ? (info_.commandStatus ? 'text-success' : info_.error) : 'text-info'} /></h2>
        </Col>
      </Row>
      <Row className='mb-1'>
        <Issues issues={issues} />
      </Row>
      <Row>
        {map(orderedBrickList, node => <Col key={node.config.brickName}>
          <Node
            node={node}
            heal_={heal_}
            status_={status_}
            statusDetail_={statusDetail_}
            info_={info_}
            vdis={this.props.vdis}
            vbds={this.props.vbds}
            sr={this.props.sr}
          />
        </Col>)}
      </Row>
      <Row>
        <Col>
          <ActionButton
            btnStyle='success'
            handler={this._addSubvolume}
            icon='add'
          >
            {_('xosanAddSubvolume')}
          </ActionButton>
          <hr />
        </Col>
      </Row>
      {/* We will implement this later */}
      {/* <Row>
        <Col>
          <h2>{_('xosanRemoveSubvolumes')}</h2>
          <table className='table'>
            {map(subVolumes, (subvolume, i) => <tr key={i}>
              <td>
                <ul>{map(subvolume, (brick, j) => <li key={j}>{brick.name}</li>)}</ul>
              </td>
              <td>
                <ActionButton
                  btnStyle='danger'
                  icon='remove'
                  handler={::this._removeSubVolume}
                  handlerParam={map(subvolume, brick => brick.name)}
                >
                  {_('xosanRemove')}
                </ActionButton>
              </td>
            </tr>)}
          </table>
          <hr />
        </Col>
      </Row> */}
      <Row>
        <Col>
          <h2><Toggle iconSize={1} onChange={this.toggleState('showAdvanced')} value={showAdvanced} /> {_('xosanAdvanced')}</h2>
          {strippedVolumeInfo && showAdvanced && <div>
            <h3>{_('xosanVolume')}</h3>
            <Container>
              <Field title={'Name'}>{strippedVolumeInfo.name}</Field>
              <Field title={'Status'}>{strippedVolumeInfo.statusStr}</Field>
              <Field title={'Type'}>{strippedVolumeInfo.typeStr}</Field>
              <Field title={'Brick Count'}>{strippedVolumeInfo.brickCount}</Field>
              <Field title={'Stripe Count'}>{strippedVolumeInfo.stripeCount}</Field>
              <Field title={'Replica Count'}>{strippedVolumeInfo.replicaCount}</Field>
              <Field title={'Arbiter Count'}>{strippedVolumeInfo.arbiterCount}</Field>
              <Field title={'Disperse Count'}>{strippedVolumeInfo.disperseCount}</Field>
              <Field title={'Redundancy Count'}>{strippedVolumeInfo.redundancyCount}</Field>
            </Container>
            <h3>{_('xosanVolumeOptions')}</h3>
            <Container>
              {map(strippedVolumeInfo.options, option =>
                <Field key={option.name} title={option.name}>{option.value}</Field>
              )}
            </Container>
          </div>}
        </Col>
      </Row>
    </Container>
  }
}
