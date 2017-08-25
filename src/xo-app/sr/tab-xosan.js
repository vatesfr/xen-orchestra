import _ from 'intl'
import ActionButton from 'action-button'
import Collapse from 'collapse'
import Copiable from 'copiable'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import Tooltip from 'tooltip'
import { SizeInput } from 'form'
import { Container, Col, Row } from 'grid'
import { SelectSr } from 'select-objects'
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
  getVolumeInfo,
  removeXosanBricks,
  replaceXosanBrick,
  startVm
} from 'xo'

const GIGABYTE = 1024 * 1024 * 1024

const ISSUE_CODE_TO_MESSAGE = {
  VMS_DOWN: _('xosanVmsNotRunning'),
  VMS_NOT_FOUND: _('xosanVmsNotFound'),
  FILES_NEED_HEALING: _('xosanFilesNeedHealing')
}

const Issues = ({ issues }) => <div>
  {map(issues, code => <div key={code} className='alert alert-danger mb-1' role='alert'>
    <Icon icon='error' /> <strong>{ISSUE_CODE_TO_MESSAGE[code]}</strong>
  </div>)}
</div>

const Field = ({ title, children }) => <Row>
  <Col size={3}><strong>{title}</strong></Col>
  <Col size={9}>{children}</Col>
</Row>

@connectStore(() => ({
  vms: createGetObjectsOfType('VM'),
  srs: createGetObjectsOfType('SR'),
  vbds: createGetObjectsOfType('VBD'),
  vdis: createGetObjectsOfType('VDI')
}))
export default class TabXosan extends Component {
  // State ---------------------------------------------------------------------

  state = {
    'added-size': 100 * GIGABYTE
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
      ::this._refreshAspect('statusDetail', 'volumeStatusDetail')
    ])
  }

  // Actions -------------------------------------------------------------------

  async _replaceBrick ({ brick, newSr, brickSize, onSameVm = false }) {
    await replaceXosanBrick(this.props.sr.id, brick, newSr.id, brickSize, onSameVm)
    const newState = {}
    forEach(this.state.xosanConfig.nodes, (node, i) => {
      newState[`sr-${i}`] = null
    })
    this.setState(newState)
    await this._refreshInfo()
  }

  async _removeSubVolume (bricks) {
    await removeXosanBricks(this.props.sr.id, bricks)
    await this._refreshInfo()
  }

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

  _getSrPredicate = createSelector(
    () => this.props.sr.$pool,
    poolId => sr => sr.SR_type === 'lvm' && sr.$pool === poolId
  )

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

  _getSubvolumes = createSelector(
    this._getStrippedVolumeInfo,
    this._getSubvolumeSize,
    (strippedVolumeInfo, subvolumeSize) => {
      const subVolumes = []
      if (strippedVolumeInfo) {
        for (let i = 0; i < strippedVolumeInfo.bricks.length; i += subvolumeSize) {
          subVolumes.push(strippedVolumeInfo.bricks.slice(i, i + subvolumeSize))
        }
      }

      return subVolumes
    }
  )

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
        issues.push('VMS_DOWN')
      }
      if (reduce(orderedBrickList, (hasNotFound, node) => hasNotFound || node.vm === undefined, false)) {
        issues.push('VMS_NOT_FOUND')
      }
      if (reduce(orderedBrickList, (hasFileToHeal, node) => hasFileToHeal || (node.heal && node.heal.file && node.heal.file.length !== 0), false)) {
        issues.push('FILES_NEED_HEALING')
      }

      return issues
    }
  )

  render () {
    const { volumeHeal, volumeInfo, volumeStatus, xosanConfig, volumeStatusDetail } = this.state
    const { srs } = this.props

    if (!xosanConfig) {
      return null
    }

    if (!xosanConfig.version) {
      return <div>
        This version of XOSAN SR is from the first beta phase. You can keep using it, but to modify it you ll have to save your disks and re-create it.
      </div>
    }

    const strippedVolumeInfo = this._getStrippedVolumeInfo()
    const subvolumeSize = this._getSubvolumeSize()
    const subVolumes = this._getSubvolumes()
    const orderedBrickList = this._getOrderedBrickList()
    const issues = this._getIssues()

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
              <Field title={'Virtual Machine'}>
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
                        Run
                      </ActionButton>
                    }
                  </span>
                  : <span style={{color: 'red'}}>
                    <Icon icon='alarm' /> Could not find VM
                  </span>
                }
              </Field>
              <Field title={'Underlying Storage'}>
                <Link to={`/srs/${node.config.underlyingSr}`}>{srs[node.config.underlyingSr].name_label}</Link> - Using {formatSize(node.size)}
              </Field>
              <Field title={'Replace'}>
                <div style={{ display: 'flex' }}>
                  <span className='mr-1' style={{ display: 'inline-block', width: '18em' }}>
                    <SelectSr
                      onChange={this.linkState(`sr-${i}`)}
                      predicate={this._getSrPredicate()}
                      value={this.state[`sr-${i}`]}
                    />
                  </span>
                  {' '}
                  <span className='mr-1' style={{ display: 'inline-block', width: '10em' }}>
                    <SizeInput
                      onChange={this.linkState(`brickSize-${i}`)}
                      required
                      value={this.state[`brickSize-${i}`]}
                    />
                  </span>
                  {' '}
                  <span><input
                    checked={this.state[`onSameVm-${i}`] || false}
                    onChange={event => this.setState({[`onSameVm-${i}`]: event.target.checked})}
                    type='checkbox'
                  />On Same VM</span>
                  {' '}
                  <span>
                    <ActionButton
                      btnStyle='success'
                      icon='refresh'
                      handler={::this._replaceBrick}
                      handlerParam={{ brick: node.config.brickName,
                        newSr: this.state[`sr-${i}`],
                        brickSize: this.state[`brickSize-${i}`],
                        onSameVm: this.state[`onSameVm-${i}`] }}
                    >
                      Replace
                    </ActionButton>
                  </span>
                </div>
              </Field>
              <Field title={'Brick UUID'}>
                <Copiable>{node.uuid}</Copiable>
              </Field>
              <Field title={'Status'}>
                {node.heal ? node.heal.status : 'unknown'}
              </Field>
              <Field title={'Arbiter'}>
                {node.config.arbiter ? 'True' : 'False' }
              </Field>
              {node.statusDetail && [
                <Field title={'Used Space'}>
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
                </Field>,
                <Field title={'Used Inodes'}>
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
                <Field title={'Block size'}>{ node.statusDetail.blockSize}</Field>,
                <Field title={'Device'}>{ node.statusDetail.device}</Field>,
                <Field title={'FS name'}>{ node.statusDetail.fsName}</Field>,
                <Field title={'Mount options'}>{ node.statusDetail.mntOptions}</Field>,
                <Field title={'Path'}>{ node.statusDetail.path}</Field>
              ]}

              {node.status && node.status.length !== 0 && <Row>
                <Col>
                  <table className='table'>
                    <thead>
                      <tr>
                        <th>Job</th>
                        <th>Path</th>
                        <th>Status</th>
                        <th>PID</th>
                        <th>Port</th>
                      </tr>
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
            </Container>
          </Collapse>
        )}

        <hr />

        <h2>Add Subvolume</h2>
        <Container>
          <Row>
            <Col size={2}>Select {subvolumeSize} SRs: </Col>
            <Col size={4}>
              <SelectSr
                multi
                onChange={this.linkState('added-srs')}
                predicate={this._getSrPredicate()}
                value={this.state['added-srs']}
              />
            </Col>
            <Col size={2}>
              <SizeInput
                onChange={this.linkState('added-size')}
                required
                value={this.state['added-size']}
              />
            </Col>
            <Col size={1}>
              <ActionButton
                btnStyle='success'
                handler={::this._addBricks}
                handlerParam={{ srs: this.state['added-srs'], brickSize: this.state['added-size'] }}
                icon='add'
              >
                Add
              </ActionButton>
            </Col>
          </Row>
        </Container>
        <h2>Remove Subvolumes</h2>
        {subVolumes.map((subvolume, i) => <div key={i}>
          <ActionButton
            btnStyle='success'
            icon='remove'
            handler={::this._removeSubVolume}
            handlerParam={map(subvolume, brick => brick.name)}
          >
            Remove
          </ActionButton>
          {map(subvolume, brick => brick.name).join(', ')}
        </div>)}
        {strippedVolumeInfo && <div>
          <h2>Volume</h2>
          <Container>
            <Row>
              <Col size={3}><strong>Name</strong></Col>
              <Col size={4}>{strippedVolumeInfo.name}</Col>
            </Row>
            <Row>
              <Col size={3}><strong>Status</strong></Col>
              <Col size={4}>{strippedVolumeInfo.statusStr}</Col>
            </Row>
            <Row>
              <Col size={3}><strong>Type</strong></Col>
              <Col size={4}>{strippedVolumeInfo.typeStr}</Col>
            </Row>
            <Row>
              <Col size={3}><strong>Brick Count</strong></Col>
              <Col size={4}>{strippedVolumeInfo.brickCount}</Col>
            </Row>
            <Row>
              <Col size={3}><strong>Stripe Count</strong></Col>
              <Col size={4}>{strippedVolumeInfo.stripeCount}</Col>
            </Row>
            <Row>
              <Col size={3}><strong>Replica Count</strong></Col>
              <Col size={4}>{strippedVolumeInfo.replicaCount}</Col>
            </Row>
            <Row>
              <Col size={3}><strong>Arbiter Count</strong></Col>
              <Col size={4}>{strippedVolumeInfo.arbiterCount}</Col>
            </Row>
            <Row>
              <Col size={3}><strong>Disperse Count</strong></Col>
              <Col size={4}>{strippedVolumeInfo.disperseCount}</Col>
            </Row>
            <Row>
              <Col size={3}><strong>Redundancy Count</strong></Col>
              <Col size={4}>{strippedVolumeInfo.redundancyCount}</Col>
            </Row>
          </Container>
          <h3>Volume Options</h3>
          {map(strippedVolumeInfo.options, option =>
            <Row key={option.name}>
              <Col size={3}><strong>{option.name}</strong></Col>
              <Col size={4}>{option.value}</Col>
            </Row>
          )}
        </div>}
      </Row>
    </Container>
  }
}
