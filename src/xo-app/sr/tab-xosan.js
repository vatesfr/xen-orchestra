import _ from 'intl'
import ActionButton from 'action-button'
import Collapse from 'collapse'
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

  async _replaceBrick ({ brick, newSr, brickSize }) {
    await replaceXosanBrick(this.props.sr.id, brick, newSr.id, brickSize)
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

  _getSrPredicate = createSelector(
    underlyingSr => this.props.sr.$pool,
    underlyingSr => underlyingSr,
    (poolId, underlyingSr) => sr => sr.SR_type === 'lvm' && sr.$pool === poolId
  )

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

  render () {
    const { volumeHeal, volumeInfo, volumeStatus, xosanConfig, volumeStatusDetail } = this.state
    const { vms, srs } = this.props

    if (!xosanConfig) {
      return null
    }

    if (!xosanConfig.version) {
      return <div>
        This version of XOSAN SR is from the first beta phase. You can keep using it, but to modify it you ll have to save your disks and re-create it.
      </div>
    }

    const brickByName = {}
    forEach(xosanConfig.nodes, node => {
      const size = this.nodeSize(node)
      brickByName[node.brickName] = {
        config: node,
        uuid: '-',
        size,
        vm: vms[node.vm.id]
      }
    })

    const brickByUuid = {}
    const strippedVolumeInfo = volumeInfo && volumeInfo.commandStatus ? volumeInfo.result : null
    let subvolumeSize = null
    let subVolumes = []
    if (strippedVolumeInfo) {
      forEach(strippedVolumeInfo.bricks, brick => {
        brickByName[brick.name] = brickByName[brick.name] || {}
        brickByName[brick.name].info = brick
        brickByName[brick.name].uuid = brick.hostUuid
        brickByUuid[brick.hostUuid] = brickByUuid[brick.hostUuid] || brickByName[brick.name]
      })
      subvolumeSize = +strippedVolumeInfo.disperseCount || +strippedVolumeInfo.replicaCount
      for (let i = 0; i < strippedVolumeInfo.bricks.length; i += subvolumeSize) {
        subVolumes.push(strippedVolumeInfo.bricks.slice(i, i + subvolumeSize))
      }
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
      for (let key in brickByUuid) {
        brickByUuid[key].status = volumeStatus.result.nodes[key]
      }
    }

    if (volumeStatusDetail && volumeStatusDetail.commandStatus) {
      for (let key in brickByUuid) {
        if (key in volumeStatusDetail.result.nodes) {
          brickByUuid[key].statusDetail = volumeStatusDetail.result.nodes[key][0]
        }
      }
    }
    const orderedBrickList = map(xosanConfig.nodes, node => brickByName[node.brickName])
    const issues = []
    if (reduce(orderedBrickList, (hasStopped, node) => hasStopped || (node.vm && node.vm.power_state.toLowerCase() !== 'running'), false)) {
      issues.push('Some XOSAN Virtual Machines are not running')
    }
    if (reduce(orderedBrickList, (hasNotFound, node) => hasNotFound || node.vm === undefined, false)) {
      issues.push('Some XOSAN Virtual Machines could not be found')
    }
    if (reduce(orderedBrickList, (hasFileToHeal, node) => hasFileToHeal || (node['heal'] && node['heal']['file'] && node['heal']['file'].length !== 0), false)) {
      issues.push('Some XOSAN Virtual Machines have files needing healing')
    }
    return <Container>
      {map(issues, (issue, i) => <div key={i}><Icon icon='alarm' />{issue}</div>)}
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
        {map(orderedBrickList, (node, i) =>
          <Collapse key={node.config.brickName} className='mb-1' buttonText={<span><Icon icon='disk' size='md' color={node.heal ? node.heal.status === 'Connected' ? 'text-success' : 'text-warning' : 'text-danger'} /> {node.config.brickName}</span>}>
            <div className='m-1'>
              <Row>
                <Col size={2}>Virtual Machine: </Col>
                <Col size={4}>
                  {(node.vm !== undefined && <span
                    title={node.vm.power_state}>
              <Icon icon={node.vm.power_state.toLowerCase()}/><Link
                    to={`/vms/${node.config.vm.id}`}>{node.vm.name_label}</Link>{node.vm.power_state.toLowerCase() !== 'running' && <ActionButton  title="Start Virtual Machine" handler={()=>startVm(node.vm)} icon="vm-start">Run</ActionButton>}</span>) || <span
                    style={{color: 'red'}}><Icon icon='alarm'/>Could not find VM</span>}
                </Col>
              </Row>
              <Row>
                <Col size={2}>Underlying Storage: </Col>
                <Col size={4}>
                  <Link to={`/srs/${node.config.underlyingSr}`}>{srs[node.config.underlyingSr].name_label}</Link> - Using {formatSize(node.size)}
                </Col>
              </Row>
              <Row>
                <Col size={2}>Replace: </Col>
                <Col size={3}>
                  <SelectSr
                    onChange={this.linkState(`sr-${i}`)}
                    predicate={this._getSrPredicate(node.config.underlyingSr)}
                    value={this.state[`sr-${i}`]}
                  />
                </Col>
                <Col size={2}>
                  <SizeInput
                    onChange={this.linkState(`brickSize-${i}`)}
                    required
                    value={this.state[`brickSize-${i}`]}
                  />
                </Col>
                <Col size={3}>
                  <ActionButton
                    btnStyle='success'
                    icon='refresh'
                    handler={::this._replaceBrick}
                    handlerParam={{ brick: node.config.brickName, newSr: this.state[`sr-${i}`], brickSize: this.state[`brickSize-${i}`] }}
                  >
                    Replace
                  </ActionButton>
                </Col>
              </Row>
              <Row>
                <Col size={2} title='gluster UUID'>Brick UUID: </Col>
                <Col size={4}>{node.uuid}</Col>
              </Row>
              <Row>
                <Col size={2}>Status: </Col>
                <Col size={4}>{node.heal ? node.heal.status : 'unknown'}</Col>
              </Row>
              <Row>
                <Col size={2}>Arbiter: </Col>
                <Col size={4}>{node.config.arbiter ? 'True' : 'False' }</Col>
              </Row>
              {node.statusDetail && <Container>
                <Row>
                  <Col size={2}>Used Space: </Col>
                  <Col size={4}>
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
                  </Col>
                </Row>
                <Row>
                  <Col size={2}>Used Inodes: </Col>
                  <Col size={4}>
                    <Tooltip content={_('spaceLeftTooltip', {
                      used: String(Math.round(100 - (+node.statusDetail.inodesFree / +node.statusDetail.inodesTotal) * 100)),
                      free: node.statusDetail.inodesFree
                    })}>
                      <progress className='progress' max='100' value={100 - (+node.statusDetail.inodesFree / +node.statusDetail.inodesTotal) * 100}
                      />
                    </Tooltip>
                  </Col>
                </Row>
                <Row><Col size={2}>blockSize: </Col><Col size={4}>{ node.statusDetail.blockSize}</Col></Row>
                <Row><Col size={2}>device: </Col><Col size={4}>{ node.statusDetail.device}</Col></Row>
                <Row><Col size={2}>fsName: </Col><Col size={4}>{ node.statusDetail.fsName}</Col></Row>
                <Row><Col size={2}>mntOptions: </Col><Col size={4}>{ node.statusDetail.mntOptions}</Col></Row>
                <Row><Col size={2}>path: </Col><Col size={4}>{ node.statusDetail.path}</Col></Row>
              </Container>}

              {node.status && node.status.length !== 0 && <table style={{border: 'solid black 1px'}}>
                <thead>
                  <tr style={{border: 'solid black 1px'}}>
                    <th style={{border: 'solid black 1px'}}>Job</th>
                    <th style={{border: 'solid black 1px'}}>Path</th>
                    <th style={{border: 'solid black 1px'}}>Status</th>
                    <th style={{border: 'solid black 1px'}}>PID</th>
                    <th style={{border: 'solid black 1px'}}>Port</th>
                  </tr>
                </thead>
                <tbody>
                  {map(node.status, (job, j) => <tr key={`${node.uuid}-${job.pid}`} style={{border: 'solid black 1px'}}>
                    <td style={{border: 'solid black 1px'}}>{job.hostname}</td>
                    <td style={{border: 'solid black 1px'}}>{job.path}</td>
                    <td style={{border: 'solid black 1px'}}>{job.status}</td>
                    <td style={{border: 'solid black 1px'}}>{job.pid}</td>
                    <td style={{border: 'solid black 1px'}}>{job.port}</td>
                  </tr>)}
                </tbody>
              </table>}
              {node.heal && node.heal.file && node.heal.file.length !== 0 && <div>
                <h4>Files needing healing</h4>
                {map(node.heal.file, file => <Row key={file.gfid}>
                  <Col size={5}>{file._}</Col >
                  <Col size={4}>{file.gfid}</Col>
                </Row>)}
              </div>}
            </div>
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
                predicate={this._getSrPredicate(null)}
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
