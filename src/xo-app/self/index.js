import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ChartistGraph from 'react-chartist'
import Collapse from 'collapse'
import Component from 'base-component'
import differenceBy from 'lodash/differenceBy'
import filter from 'lodash/filter'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import intersection from 'lodash/intersection'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import propTypes from 'prop-types'
import React from 'react'
import reduce from 'lodash/reduce'
import renderXoItem from 'render-xo-item'
import Upgrade from 'xoa-upgrade'
import { Container, Row, Col } from 'grid'
import { createGetObjectsOfType } from 'selectors'
import { injectIntl } from 'react-intl'
import { SizeInput } from 'form'

import {
  createResourceSet,
  deleteResourceSet,
  editRessourceSet,
  recomputeResourceSetsLimits,
  subscribeResourceSets
} from 'xo'

import {
  connectStore,
  formatSize,
  resolveResourceSets
} from 'utils'

import {
  Card,
  CardBlock,
  CardHeader
} from 'card'

import {
  SelectNetwork,
  SelectPool,
  SelectSr,
  SelectSubject,
  SelectVmTemplate
} from 'select-objects'

import {
  Subjects
} from './helpers'

import Page from '../page'

// ===================================================================

const HEADER = <Container>
  <Row>
    <Col mediumSize={12}>
      <h2><Icon icon='menu-self-service' /> {_('selfServicePage')}</h2>
    </Col>
  </Row>
</Container>

// ===================================================================

const Hosts = propTypes({
  eligibleHosts: propTypes.array.isRequired,
  excludedHosts: propTypes.array.isRequired
})(({ eligibleHosts, excludedHosts }) => (
  <div>
    <Row>
      <Col mediumSize={6}>
        <h5>{_('availableHosts')}</h5>
        <p className='text-muted'>{_('availableHostsDescription')}</p>
      </Col>
      <Col mediumSize={6}>
        <h5>{_('excludedHosts')}</h5>
      </Col>
    </Row>
    <Row>
      <Col mediumSize={6}>
        <ul className='list-group'>
          {eligibleHosts.length
            ? map(eligibleHosts, (host, key) => (
              <li key={key} className='list-group-item'>
                {renderXoItem(host)}
              </li>
            ))
            : (
              <li className='list-group-item'>
                {_('noHostsAvailable')}
              </li>
            )
          }
        </ul>
      </Col>
      <Col mediumSize={6}>
        <ul className='list-group'>
          {excludedHosts.length
            ? map(excludedHosts, (host, key) => (
              <li key={key} className='list-group-item'>
                {renderXoItem(host)}
              </li>
            ))
            : (
              <li className='list-group-item'>
                <s>{_('noHostsAvailable')}</s>
              </li>
            )
          }
        </ul>
      </Col>
    </Row>
  </div>
))

@propTypes({
  onSave: propTypes.func,
  resourceSet: propTypes.object
})
@connectStore(() => {
  const getHosts = createGetObjectsOfType('host').sort()
  const getHostsByPool = getHosts.groupBy('$pool')

  return {
    hosts: getHosts,
    hostsByPool: getHostsByPool
  }
})
@injectIntl
export class Edit extends Component {
  constructor (props) {
    super(props)
    this.state = {
      eligibleHosts: [],
      excludedHosts: props.hosts
    }
  }

  componentDidMount () {
    const { resourceSet } = this.props

    if (resourceSet) {
      let selectedPools = {}
      forEach(resourceSet.objectsByType, (objects, type) => {
        forEach(objects, object => {
          selectedPools[object.$pool] = true
        })
      })
      selectedPools = keyBy(Object.keys(selectedPools))

      const { refs } = this
      const { objectsByType } = resourceSet

      const selectedSrs = objectsByType.SR
      const selectedNetworks = objectsByType.network

      this._updateSelectedPools(selectedPools, selectedSrs, selectedNetworks, () => {
        refs.selectPool.value = selectedPools
        refs.inputName.value = resourceSet.name
        refs.selectSubject.value = resourceSet.subjects
        refs.selectVmTemplate.value = objectsByType['VM-template']
        refs.selectSr.value = selectedSrs
        refs.selectNetwork.value = selectedNetworks

        const { limits } = resourceSet

        if (!limits) {
          refs.inputMaxCpus.value = refs.inputMaxDiskSpace.value = refs.inputMaxRam.value = ''
        } else {
          refs.inputMaxCpus.value = (limits.cpus && limits.cpus.total) || ''
          refs.inputMaxDiskSpace.value = (limits.disk && limits.disk.total) || ''
          refs.inputMaxRam.value = (limits.memory && limits.memory.total) || ''
        }
      })
    }
  }

  _save = async () => {
    const { refs } = this

    const cpus = refs.inputMaxCpus.value
    const memory = refs.inputMaxRam.value
    const disk = refs.inputMaxDiskSpace.value

    const set = this.props.resourceSet || await createResourceSet(refs.inputName.value)
    const objects = [
      ...refs.selectVmTemplate.value,
      ...refs.selectSr.value,
      ...refs.selectNetwork.value
    ]

    await editRessourceSet(set.id, {
      name: refs.inputName.value,
      limits: {
        cpus: cpus === '' ? undefined : +cpus,
        memory,
        disk
      },
      objects: map(objects, object => object.id),
      subjects: map(refs.selectSubject.value, object => object.id)
    })

    this.props.onSave()
  }

  _reset = () => {
    const { refs } = this

    this._updateSelectedPools([], [], [], () => {
      refs.selectPool.value = undefined
      refs.inputName.value = ''
      refs.selectSubject.value = undefined
      refs.selectVmTemplate.value = undefined
      refs.selectSr.value = undefined
      refs.selectNetwork.value = undefined
      refs.inputMaxCpus.value = ''
      refs.inputMaxDiskSpace.value = ''
      refs.inputMaxRam.value = ''
    })
  }

  _updateSelectedPools = (pools, srs, networks, onChange) => {
    const selectedPools = Array.isArray(pools) ? keyBy(pools, 'id') : pools
    const predicate = object => selectedPools[object.$pool]

    this.setState({
      nPools: Object.keys(selectedPools).length,
      selectedPools,
      srPredicate: predicate,
      vmTemplatePredicate: predicate
    }, () => { this._updateSelectedSrs(srs || this.refs.selectSr.value, networks, onChange) })
  }

  // Helper for handler selected srs.
  _computeAvailableHosts (pools, srs) {
    const validHosts = reduce(
      this.props.hostsByPool,
      (result, value, key) => pools[key] ? result.concat(value) : result,
      []
    )

    return filter(validHosts, host => {
      let kept = false

      forEach(srs, sr =>
        !(kept = intersection(sr.$PBDs, host.$PBDs).length > 0)
      )

      return kept
    })
  }

  _updateSelectedSrs = (srs, networks, onChange) => {
    const selectableHosts = this._computeAvailableHosts(this.state.selectedPools, srs)
    const networkPredicate = network => {
      let kept = false
      forEach(selectableHosts, host => !(kept = intersection(network.PIFs, host.PIFs).length > 0))
      return kept
    }

    this.setState({
      nSrs: srs.length,
      networkPredicate,
      selectableHosts
    }, () => { this._updateSelectedNetworks(networks || this.refs.selectNetwork.value, onChange) })
  }

  _updateSelectedNetworks = (networks, onChange) => {
    const { state } = this
    const eligibleHosts = filter(state.selectableHosts, host => {
      let keptBySr = false
      let keptByNetwork = false

      forEach(this.refs.selectSr.value, sr =>
        !(keptBySr = (intersection(sr.$PBDs, host.$PBDs).length > 0))
      )

      if (keptBySr) {
        forEach(networks, network =>
          !(keptByNetwork = intersection(network.PIFs, host.PIFs).length > 0)
        )
      }

      return keptBySr && keptByNetwork
    })

    this.setState({
      eligibleHosts,
      excludedHosts: differenceBy(this.props.hosts, eligibleHosts, host => host.id),
      selectedNetworks: networks
    }, onChange)
  }

  render () {
    const { state } = this
    const { formatMessage } = this.props.intl
    const { resourceSet } = this.props

    return <div>
      <li className='list-group-item'>
        <form id='resource-set-form' className='card-block'>
          <div className='form-group'>
            <Row>
              <Col mediumSize={4}>
                <input
                  className='form-control'
                  placeholder={formatMessage(messages.resourceSetName)}
                  ref='inputName'
                  required
                  type='text'
                />
              </Col>
              <Col mediumSize={4}>
                <SelectSubject
                  multi
                  ref='selectSubject'
                  required
                />
              </Col>
              <Col mediumSize={4}>
                <SelectPool
                  multi
                  onChange={this._updateSelectedPools}
                  ref='selectPool'
                  required
                />
              </Col>
            </Row>
          </div>
          <div className='form-group'>
            <Row>
              <Col mediumSize={4}>
                <SelectVmTemplate
                  disabled={!state.nPools}
                  multi
                  predicate={state.vmTemplatePredicate}
                  ref='selectVmTemplate'
                  required
                />
              </Col>
              <Col mediumSize={4}>
                <SelectSr
                  disabled={!state.nPools}
                  multi
                  onChange={this._updateSelectedSrs}
                  predicate={state.srPredicate}
                  ref='selectSr'
                  required
                />
              </Col>
              <Col mediumSize={4}>
                <SelectNetwork
                  disabled={!state.nSrs}
                  multi
                  onChange={this._updateSelectedNetworks}
                  predicate={state.networkPredicate}
                  ref='selectNetwork'
                  required
                />
              </Col>
            </Row>
          </div>
          <div className='form-group'>
            <Row>
              <Col mediumSize={4}>
                <input
                  className='form-control'
                  min={0}
                  placeholder={formatMessage(messages.maxCpus)}
                  ref='inputMaxCpus'
                  type='number'
                />
              </Col>
              <Col mediumSize={4}>
                <SizeInput
                  placeholder={formatMessage(messages.maxRam)}
                  ref='inputMaxRam'
                />
              </Col>
              <Col mediumSize={4}>
                <SizeInput
                  placeholder={formatMessage(messages.maxDiskSpace)}
                  ref='inputMaxDiskSpace'
                />
              </Col>
            </Row>
          </div>
          <hr />
          <Hosts excludedHosts={state.excludedHosts} eligibleHosts={state.eligibleHosts} />
        </form>
      </li>
      <li className='list-group-item text-xs-center'>
        <div className='btn-toolbar'>
          <ActionButton btnStyle='primary' icon='save' handler={this._save} type='submit'>{_('saveResourceSet')}</ActionButton>
          <ActionButton btnStyle='secondary' icon='reset' handler={this._reset}>{_('resetResourceSet')}</ActionButton>
          <ActionButton btnStyle='danger' icon='delete' handler={deleteResourceSet} handlerParam={resourceSet}>{_('deleteResourceSet')}</ActionButton>
        </div>
      </li>
    </div>
  }
}

class ResourceSet extends Component {
  _renderDisplay = () => {
    const { resourceSet } = this.props
    const {
      limits: {
        cpus,
        disk,
        memory
      } = {}
    } = resourceSet

    return [
      <li className='list-group-item'>
        <Subjects subjects={resourceSet.subjects} />
      </li>,
      ...map(resourceSet.objectsByType, (objectsSet, type) => (
        <li key={type} className='list-group-item'>
          {map(objectsSet, object => renderXoItem(object, { className: 'm-r-1' }))}
        </li>
      )),
      <li className='list-group-item'>
        <Row>
          <Col mediumSize={4}>
            <Card>
              <CardHeader>
                <Icon icon='cpu' /> {_('resourceSetVcpus')}
              </CardHeader>
              <CardBlock className='text-center'>
                {cpus ? (
                  <div>
                    <ChartistGraph
                      data={{
                        labels: [ 'Available', 'Used' ],
                        series: [ cpus.available, cpus.total - cpus.available ]
                      }}
                      options={{ donut: true, donutWidth: 40, showLabel: false }}
                      type='Pie'
                    />
                    <p className='text-xs-center'>
                      {_('usedResource')} {cpus.total - cpus.available} ({_('totalResource')} {cpus.total})
                    </p>
                  </div>
                ) : (
                  <p className='text-xs-center display-1'>&infin;</p>
                )}
              </CardBlock>
            </Card>
          </Col>
          <Col mediumSize={4}>
            <Card>
              <CardHeader>
                <Icon icon='memory' /> {_('resourceSetMemory')}
              </CardHeader>
              <CardBlock className='text-center'>
                {memory ? (
                  <div>
                    <ChartistGraph
                      data={{
                        labels: [ 'Available', 'Used' ],
                        series: [ memory.available, memory.total - memory.available ]
                      }}
                      options={{ donut: true, donutWidth: 40, showLabel: false }}
                      type='Pie'
                    />
                    <p className='text-xs-center'>
                      {_('usedResource')} {formatSize(memory.total - memory.available)} ({_('totalResource')} {formatSize(memory.total)})
                    </p>
                  </div>
                ) : (
                  <p className='text-xs-center display-1'>&infin;</p>
                )}
              </CardBlock>
            </Card>
          </Col>
          <Col mediumSize={4}>
            <Card>
              <CardHeader>
                <Icon icon='disk' /> {_('resourceSetStorage')}
              </CardHeader>
              <CardBlock>
                {disk ? (
                  <div>
                    <ChartistGraph
                      data={{
                        labels: [ 'Available', 'Used' ],
                        series: [ disk.available, disk.total - disk.available ]
                      }}
                      options={{ donut: true, donutWidth: 40, showLabel: false }}
                      type='Pie'
                    />
                    <p className='text-xs-center'>
                      {_('usedResource')} {formatSize(disk.total - disk.available)} ({_('totalResource')} {formatSize(disk.total)})
                    </p>
                  </div>
                ) : (
                  <p className='text-xs-center display-1'>&infin;</p>
                )}
              </CardBlock>
            </Card>
          </Col>
        </Row>
      </li>,
      <li className='list-group-item text-xs-center'>
        <div className='btn-toolbar'>
          <ActionButton btnStyle='primary' icon='edit' handler={this.toggleState('editionMode')}>{_('editResourceSet')}</ActionButton>
          <ActionButton btnStyle='danger' icon='delete' handler={deleteResourceSet} handlerParam={resourceSet}>{_('deleteResourceSet')}</ActionButton>
        </div>
      </li>
    ]
  }

  render () {
    const { resourceSet } = this.props

    return (
      <div className='m-b-1'>
        <Collapse buttonText={resourceSet.name}>
          <ul className='list-group'>
            {this.state.editionMode
              ? <Edit resourceSet={this.props.resourceSet} onSave={this.toggleState('editionMode')} />
              : this._renderDisplay()
            }
          </ul>
        </Collapse>
        {resourceSet.missingObjects.length > 0 &&
          <div className='alert alert-danger m-b-0' role='alert'>
            <strong>{_('resourceSetMissingObjects')}</strong> {resourceSet.missingObjects.join(', ')}
          </div>
        }
      </div>
    )
  }
}

// ===================================================================

export default class Self extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeResourceSets(resourceSets => {
      this.setState({
        resourceSets: resolveResourceSets(resourceSets)
      })
    })
  }

  render () {
    const { resourceSets, showNewResourceSetForm } = this.state

    return <Page
      formatTitle
      header={HEADER}
      title='selfServicePage'
    >
      {process.env.XOA_PLAN > 3
        ? <div>
          <div className='m-b-1'>
            <ActionButton
              btnStyle='primary'
              className='m-r-1'
              handler={this.toggleState('showNewResourceSetForm')}
              icon='add'
            >
              {_('resourceSetNew')}
            </ActionButton>
            <ActionButton
              btnStyle='secondary'
              handler={recomputeResourceSetsLimits}
              icon='refresh'
            >
              {_('recomputeResourceSets')}
            </ActionButton>
          </div>
          {showNewResourceSetForm && [ <Edit onSave={this.toggleState('showNewResourceSetForm')} />, <hr /> ]}
          {resourceSets
            ? (isEmpty(resourceSets)
              ? _('noResourceSets')
              : map(resourceSets, (resourceSet, key) => <ResourceSet key={resourceSet.id} resourceSet={resourceSet} />)
            ) : _('loadingResourceSets')
          }
        </div>
        : <Container><Upgrade place='selfDashboard' available={4} /></Container>
      }
    </Page>
  }
}
