import ActionButton from 'action-button'
import Icon from 'icon'
import React, { Component } from 'react'
import _, { messages } from 'messages'
import differenceBy from 'lodash/differenceBy'
import filter from 'lodash/filter'
import forEach from 'lodash/forEach'
import intersection from 'lodash/intersection'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import renderXoItem from 'render-xo-item'
import { Col, Row } from 'grid'
import { createGetObjectsOfType } from 'selectors'
import { injectIntl } from 'react-intl'
import { SizeInput } from 'form'

import {
  Card,
  CardBlock,
  CardHeader
} from 'card'

import {
  SelectSubject,
  SelectNetwork,
  SelectPool,
  SelectSr,
  SelectVmTemplate
} from 'select-objects'

import {
  connectStore,
  propTypes
} from 'utils'

import {
  createResourceSet,
  deleteResourceSet,
  editRessourceSet,
  subscribeResourceSets
} from 'xo'

import {
  Subjects,
  resolveResourceSets
} from '../helpers'

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

// ===================================================================

@propTypes({
  onReset: propTypes.func.isRequired,
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
class Edit extends Component {
  constructor (props) {
    super(props)
    this.state = {
      eligibleHosts: [],
      excludedHosts: props.hosts
    }
  }

  componentWillReceiveProps (nextProps) {
    const { resourceSet } = nextProps

    if (resourceSet) {
      const oldResourceSet = this.props.resourceSet

      // Same resource set, no changes.
      if (oldResourceSet && oldResourceSet.id === resourceSet.id) {
        return
      }

      // Apply resource set.
      window.scroll(0, 0)

      // Fill form
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

  _saveResourceSet = async () => {
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
      limits: {
        cpus: cpus === '' ? undefined : +cpus,
        memory,
        disk
      },
      objects: map(objects, object => object.id),
      subjects: map(refs.selectSubject.value, object => object.id)
    })

    this._resetResourceSet()
  }

  _resetResourceSet = () => {
    const { refs } = this

    this.props.onReset()
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

  render () {
    const { state } = this
    const { formatMessage } = this.props.intl

    return (
      <Card>
        <CardHeader>
          <Icon icon='administration' /> {_('selfServiceAdminPage')}
        </CardHeader>
        <CardBlock>
          <form id='resource-set-form' className='card-block'>
            <h5><Icon icon='edition' /> {_('resourceSetCreation')}</h5>
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
            <hr />
            <div className='form-group pull-xs-right'>
              <div className='btn-toolbar'>
                <div className='btn-group'>
                  <ActionButton
                    className='btn-primary'
                    form='resource-set-form'
                    handler={this._saveResourceSet}
                    icon='save'
                    type='submit'
                  >
                    {_('saveResourceSet')}
                  </ActionButton>
                </div>
                <div className='btn-group'>
                  <button type='button' className='btn btn-secondary' onClick={this._resetResourceSet}>
                    {_('resetResourceSet')}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </CardBlock>
      </Card>
    )
  }
}

// ===================================================================

const Limits = propTypes({
  limits: propTypes.object.isRequired
})(({ limits: { cpus, memory, disk } }) => (
  <div>
    {cpus && (
      <div>
        <Icon icon='cpu' /> {_('maxCpus')}: {cpus.total} ({_('remainingResource')} {cpus.available})
      </div>
    )}
    {memory && (
      <div>
        <Icon icon='memory' /> {_('maxRam')}: {memory.total} ({_('remainingResource')} {memory.available})
      </div>
    )}
    {disk && (
      <div>
        <Icon icon='disk' /> {_('maxDiskSpace')}: {disk.total} ({_('remainingResource')} {disk.available})
      </div>
    )}
    {cpus === undefined && memory === undefined && disk === undefined && (
      <div>{_('noResourceSetLimits')}</div>
    )}
  </div>
))

// ===================================================================

export default class Administration extends Component {
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

  _editResourceSet = resourceSet => {
    this.setState({
      editingResourceSet: resourceSet
    })
  }

  _deleteResourceSet = async resourceSet => {
    const { id } = resourceSet

    try {
      await deleteResourceSet(id)
      const { editingResourceSet } = this.state

      // Reset form edition if necessary.
      if (editingResourceSet && editingResourceSet.id === id) {
        this._resetEditedResourceSet()
      }
    } catch (_) {}
  }

  _resetEditedResourceSet = () => {
    this.setState({
      editingResourceSet: undefined
    })
  }

  render () {
    const { state } = this

    return (
      <div>
        <Edit resourceSet={state.editingResourceSet} onReset={this._resetEditedResourceSet} />
        <Card>
          <CardHeader>
            <h5><Icon icon='resource-set' /> {_('resourceSets')}</h5>
          </CardHeader>
          <CardBlock>
            {map(state.resourceSets, (resourceSet, key) => (
              <div key={key} className='p-b-1'>
                <h5 className='form-inline clearfix'>
                  {resourceSet.name}
                  <div className='form-group pull-xs-right'>
                    <div className='btn-toolbar'>
                      <div className='btn-group'>
                        <button className='btn btn-primary' type='button' onClick={() => { this._editResourceSet(resourceSet) }}>
                          <Icon icon='edit' /> {_('editResourceSet')}
                        </button>
                      </div>
                      <div className='btn-group'>
                        <button className='btn btn-danger' type='button' onClick={() => { this._deleteResourceSet(resourceSet) }}>
                          <Icon icon='delete' /> {_('deleteResourceSet')}
                        </button>
                      </div>
                    </div>
                  </div>
                </h5>
                <ul key={key} className='list-group'>
                  <li className='list-group-item'>
                    <Subjects subjects={resourceSet.subjects} />
                  </li>
                  {map(resourceSet.objectsByType, (objectsSet, type) => (
                    <li key={type} className='list-group-item'>
                      {map(objectsSet, object => renderXoItem(object, { className: 'm-r-1' }))}
                    </li>
                  ))}
                  <li className='list-group-item'>
                    <Limits limits={resourceSet.limits} />
                  </li>
                </ul>
                {resourceSet.missingObjects.length > 0 &&
                  <div className='alert alert-danger m-t-1' role='alert'>
                    <strong>{_('resourceSetMissingObjects')}</strong> {resourceSet.missingObjects.join(', ')}
                  </div>
                }
                <hr />
              </div>
            ))}
          </CardBlock>
        </Card>
      </div>
    )
  }
}
