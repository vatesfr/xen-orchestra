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
  map,
  reduce
} from 'lodash'
import {
  createGetObjectsOfType,
  createSelector
} from 'selectors'
import {
  connectStore,
  formatSize
} from 'utils'
import {
  addXosanBricks,
  fixHostNotInXosanNetwork,
  getVolumeInfo,
  // TODO: uncomment when implementing subvolume deletion
  // removeXosanBricks,
  replaceXosanBrick,
  startVm
} from 'xo'

import ReplaceBrickModalBody from './replace-brick-modal'
import AddSubvolumeModalBody from './add-subvolume-modal'

const GIGABYTE = 1024 * 1024 * 1024

const ISSUE_CODE_TO_MESSAGE = {
  VMS_DOWN: 'xosanVmsNotRunning',
  VMS_NOT_FOUND: 'xosanVmsNotFound',
  FILES_NEED_HEALING: 'xosanFilesNeedHealing',
  HOST_NOT_IN_NETWORK: 'xosanHostNotInNetwork'
}

const Issues = ({ issues }) => <div>
  {map(issues, issue => <div key={issue.key || issue.code} className='alert alert-danger mb-1' role='alert'>
    <Icon icon='error' /> <strong>{_(ISSUE_CODE_TO_MESSAGE[issue.code], issue.params)}</strong>
    {issue.fix && <ActionButton icon='edit' handler={issue.fix.action} title={issue.fix.title}>Fix</ActionButton>}
  </div>)}
</div>

const Field = ({ title, children }) => <SingleLineRow>
  <Col size={3}><strong>{title}</strong></Col>
  <Col size={9}>{children}</Col>
</SingleLineRow>

@connectStore(() => ({
  vms: createGetObjectsOfType('VM'),
  hosts: createGetObjectsOfType('host'),
  srs: createGetObjectsOfType('SR'),
  vbds: createGetObjectsOfType('VBD'),
  vdis: createGetObjectsOfType('VDI')
}))
export default class TabXosan extends Component {
  state = {
    showAdvancedNodes: {}
  }

  async componentDidMount () {
    await this._refreshInfo()
  }

  async _refreshAspect (infoType, statusVariable) {
    const val = {}
    val[statusVariable] = null
    this.setState(val)
    val[statusVariable] = await getVolumeInfo(this.props.sr.id, infoType)
    this.setState(val)
  }

  async _refreshInfo () {
    const otherConfig = this.props.sr.other_config['xo:xosan_config']
    const xosanConfig = otherConfig ? JSON.parse(otherConfig) : null
    const newState = { xosanConfig }
    if (xosanConfig) {
      forEach(xosanConfig.nodes, (node, i) => {
        newState[`sr-${i}`] = null
        newState[`brickSize-${i}`] = this.nodeSize(node)
      })
    }
    this.setState(newState)
    await Promise.all([
      ::this._refreshAspect('heal', 'volumeHeal'),
      ::this._refreshAspect('status', 'volumeStatus'),
      ::this._refreshAspect('info', 'volumeInfo'),
      ::this._refreshAspect('statusDetail', 'volumeStatusDetail'),
      // TODO: that thing should probably be a selector.
      ::this._refreshAspect('hosts', 'hostStatus')
    ])
  }

  // Actions -------------------------------------------------------------------

  _replaceBrick = async ({ brick, vm }) => {
    const { sr, brickSize, onSameVm = false } = await confirm({
      icon: 'refresh',
      title: _('xosanReplace'),
      body: <ReplaceBrickModalBody vm={vm} />
    })

    if (sr == null || brickSize == null) {
      return error(_('xosanReplaceBrickErrorTitle'), _('xosanReplaceBrickErrorMessage'))
    }

    await replaceXosanBrick(this.props.sr.id, brick, sr.id, brickSize, onSameVm)
    const newState = {}
    forEach(this.state.xosanConfig.nodes, (node, i) => {
      newState[`sr-${i}`] = null
    })
    this.setState(newState)
    await this._refreshInfo()
  }

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
  //   await this._refreshInfo()
  // }

  async _addBricks ({srs, brickSize}) {
    await addXosanBricks(this.props.sr.id, srs.map(sr => sr.id), brickSize)
    await this._refreshInfo()
  }

  // Helpers -------------------------------------------------------------------

  nodeSize (node) {
    const { vms, vbds, vdis } = this.props
    const vm = vms[node.vm.id]

    return vm
      ? reduce(
        vm.$VBDs,
        (sum, vbd) => {
          const vdi = vdis[vbds[vbd].VDI]
          return vdi === undefined ? sum : sum + vdi.size
        },
        0
      ) : 100 * GIGABYTE
  }

  // Selectors -----------------------------------------------------------------

  _getStrippedVolumeInfo = createSelector(
    () => this.state.volumeInfo,
    volumeInfo => volumeInfo && volumeInfo.commandStatus ? volumeInfo.result : null
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

  _getBrickByName = createSelector(
    () => this.state.xosanConfig && this.state.xosanConfig.nodes,
    () => this.props.vms,
    () => this.state.volumeHeal,
    () => this.state.volumeStatus,
    () => this.state.volumeStatusDetail,
    this._getStrippedVolumeInfo,
    (nodes, vms, volumeHeal, volumeStatus, volumeStatusDetail, strippedVolumeInfo) => {
      const brickByName = {}
      forEach(nodes, node => {
        brickByName[node.brickName] = {
          config: node,
          uuid: '-',
          size: this.nodeSize(node),
          vm: vms[node.vm.id]
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

      if (volumeHeal && volumeHeal.commandStatus) {
        forEach(volumeHeal.result.bricks, brick => {
          brickByName[brick.name] = brickByName[brick.name] || {}
          brickByName[brick.name].heal = brick
          brickByName[brick.name].uuid = brick.hostUuid
          brickByUuid[brick.hostUuid] = brickByUuid[brick.hostUuid] || brickByName[brick.name]
        })
      }

      if (volumeStatus && volumeStatus.commandStatus) {
        forEach(brickByUuid, (brick, uuid) => {
          brick.status = volumeStatus.result.nodes[uuid]
        })
      }

      if (volumeStatusDetail && volumeStatusDetail.commandStatus) {
        forEach(brickByUuid, (brick, uuid) => {
          if (uuid in volumeStatusDetail.result.nodes) {
            brick.statusDetail = volumeStatusDetail.result.nodes[uuid][0]
          }
        })
      }

      return brickByName
    }
  )

  _getOrderedBrickList = createSelector(
    () => this.state.xosanConfig,
    this._getBrickByName,
    (xosanConfig, brickByName) => {
      if (!xosanConfig && xosanConfig.nodes) {
        return
      }

      return map(xosanConfig.nodes, node => brickByName[node.brickName])
    }
  )

  _getIssues = createSelector(
    this._getOrderedBrickList,
    orderedBrickList => {
      if (!orderedBrickList) {
        return
      }

      const issues = []
      if (reduce(orderedBrickList, (hasStopped, node) => hasStopped || (node.vm && node.vm.power_state.toLowerCase() !== 'running'), false)) {
        issues.push({code: 'VMS_DOWN'})
      }
      if (reduce(orderedBrickList, (hasNotFound, node) => hasNotFound || node.vm === undefined, false)) {
        issues.push({code: 'VMS_NOT_FOUND'})
      }
      if (reduce(orderedBrickList, (hasFileToHeal, node) => hasFileToHeal || (node.heal && node.heal.file && node.heal.file.length !== 0), false)) {
        issues.push({code: 'FILES_NEED_HEALING'})
      }

      return issues
    }
  )

  render () {
    const { volumeHeal, volumeInfo, volumeStatus, xosanConfig, volumeStatusDetail, showAdvanced, showAdvancedNodes,
      hostStatus } = this.state
    const { srs, hosts } = this.props

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
    if (hostStatus) {
      hostStatus.forEach(status => {
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
    }

    return <Container>
      <Row className='text-xs-center'>
        <Col mediumSize={3}>
          <h2><Icon icon='sr' size='lg' color={volumeStatus ? (volumeStatus.commandStatus ? 'text-success' : volumeStatus.error) : 'text-info'} /></h2>
        </Col>
        <Col mediumSize={3}>
          <h2><Icon icon='health' size='lg' color={volumeHeal ? (volumeHeal.commandStatus ? 'text-success' : volumeHeal.error) : 'text-info'} /></h2>
        </Col>
        <Col mediumSize={3}>
          <h2><Icon icon='settings' size='lg' color={volumeStatusDetail ? (volumeStatusDetail.commandStatus ? 'text-success' : volumeStatusDetail.error) : 'text-info'} /></h2>
        </Col>
        <Col mediumSize={3}>
          <h2><Icon icon='info' size='lg' color={volumeInfo ? (volumeInfo.commandStatus ? 'text-success' : volumeInfo.error) : 'text-info'} /></h2>
        </Col>
      </Row>
      <Row>
        <Issues issues={issues} />
      </Row>
      <Row>
        {map(orderedBrickList, (node, i) =>
          <Collapse
            buttonText={<span>
              <Icon
                color={node.heal
                  ? node.heal.status === 'Connected'
                    ? 'text-success'
                    : 'text-warning'
                  : 'text-danger'
                }
                icon='disk'
                size='md'
              /> {srs[node.config.underlyingSr].name_label}
            </span>}
            className='mb-1'
            key={node.config.brickName}
          >
            <Container className='m-1'>
              <Field title={_('xosanVm')}>
                {node.vm !== undefined
                  ? <span title={node.vm.power_state}>
                    <Icon icon={node.vm.power_state.toLowerCase()} />
                    {' '}
                    <Link to={`/vms/${node.config.vm.id}`}>{node.vm.name_label}</Link>
                    {node.vm.power_state.toLowerCase() !== 'running' &&
                      <ActionButton
                        handler={startVm}
                        handlerParam={node.vm}
                        icon='vm-start'
                      >
                        {_('xosanRun')}
                      </ActionButton>
                    }
                  </span>
                  : <span style={{color: 'red'}}>
                    <Icon icon='alarm' /> Could not find VM
                  </span>
                }
              </Field>
              <Field title={_('xosanUnderlyingStorage')}>
                <Link to={`/srs/${node.config.underlyingSr}`}>{srs[node.config.underlyingSr].name_label}</Link> - Using {formatSize(node.size)}
              </Field>
              <Field title={_('xosanStatus')}>
                {node.heal ? node.heal.status : 'unknown'}
              </Field>
              {node.statusDetail && <Field title={_('xosanUsedSpace')}>
                <span style={{ display: 'inline-block', width: '20em', height: '1em' }}>
                  <Tooltip content={_('spaceLeftTooltip', {
                    used: String(Math.round(100 - (+node.statusDetail.sizeFree / +node.statusDetail.sizeTotal) * 100)),
                    free: formatSize(+node.statusDetail.sizeFree)
                  })}>
                    <progress
                      className='progress'
                      max='100'
                      value={100 - (+node.statusDetail.sizeFree / +node.statusDetail.sizeTotal) * 100}
                    />
                  </Tooltip>
                </span>
              </Field>}
              {node.config.arbiter === 'True' && <Field title={_('xosanArbiter')} />}
              <ActionButton
                btnStyle='success'
                icon='refresh'
                handler={this._replaceBrick}
                handlerParam={{ brick: node.config.brickName, vm: node.vm }}
              >
                {_('xosanReplace')}
              </ActionButton>
            </Container>
            <Toggle onChange={this.toggleState(`showAdvancedNodes.${node.vm.id}`)} value={showAdvancedNodes && showAdvancedNodes[node.vm.id]} />
            {' '}
            {_('xosanAdvanced')}
            {showAdvancedNodes[node.vm.id] && <Container>
              <Field title={_('xosanBrickUuid')}>
                <Copiable>{node.uuid}</Copiable>
              </Field>
              {node.statusDetail && [
                <Field key='usedInodes' title={_('xosanUsedInodes')}>
                  <span style={{ display: 'inline-block', width: '20em', height: '1em' }}>
                    <Tooltip content={_('spaceLeftTooltip', {
                      used: String(Math.round(100 - (+node.statusDetail.inodesFree / +node.statusDetail.inodesTotal) * 100)),
                      free: node.statusDetail.inodesFree
                    })}>
                      <progress className='progress' max='100' value={100 - (+node.statusDetail.inodesFree / +node.statusDetail.inodesTotal) * 100}
                      />
                    </Tooltip>
                  </span>
                </Field>,
                <Field key='blockSize' title={_('xosanBlockSize')}>{node.statusDetail.blockSize}</Field>,
                <Field key='device' title={_('xosanDevice')}>{node.statusDetail.device}</Field>,
                <Field key='fsName' title={_('xosanFsName')}>{node.statusDetail.fsName}</Field>,
                <Field key='mountOptions' title={_('xosanMountOptions')}>{node.statusDetail.mntOptions}</Field>,
                <Field key='path' title={_('xosanPath')}>{node.statusDetail.path}</Field>
              ]}

              {node.status && node.status.length !== 0 && <Row>
                <Col>
                  <table className='table'>
                    <thead>
                      <th>{_('xosanJob')}</th>
                      <th>{_('xosanPath')}</th>
                      <th>{_('xosanStatus')}</th>
                      <th>{_('xosanPid')}</th>
                      <th>{_('xosanPort')}</th>
                    </thead>
                    <tbody>
                      {map(node.status, (job, j) => <tr key={`${node.uuid}-${job.pid}`}>
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
              {node.heal && node.heal.file && node.heal.file.length !== 0 && <div>
                <h4>Files needing healing</h4>
                {map(node.heal.file, file => <Row key={file.gfid}>
                  <Col size={5}>{file._}</Col >
                  <Col size={4}>{file.gfid}</Col>
                </Row>)}
              </div>}
            </Container>}
          </Collapse>
        )}
        <hr />
        <h2>{_('xosanAddSubvolume')}</h2>
        <ActionButton
          btnStyle='success'
          handler={this._addSubvolume}
          icon='add'
        >
          {_('xosanAdd')}
        </ActionButton>
        {/* We will implement this later */}
        {/* <h2>{_('xosanRemoveSubvolumes')}</h2>
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
        </table> */}
        <br />
        <Toggle onChange={this.toggleState('showAdvanced')} value={showAdvanced} /> {_('xosanAdvanced')}
        {strippedVolumeInfo && showAdvanced && <div>
          <h2>{_('xosanVolume')}</h2>
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
      </Row>
    </Container>
  }
}
