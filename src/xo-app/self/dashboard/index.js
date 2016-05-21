import ChartistGraph from 'react-chartist'
import Icon from 'icon'
import React, { Component } from 'react'
import _ from 'messages'
import forEach from 'lodash/forEach'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import store from 'store'
import { Panel } from 'react-bootstrap-4/lib'
import { Row, Col } from 'grid'
import { createGetObject } from 'selectors'

import {
  connectStore,
  formatSize,
  propTypes
} from 'utils'

import {
  subscribeGroups,
  subscribeUsers,
  subscribeResourceSets
} from 'xo'

// ===================================================================

const getObject = createGetObject((_, id) => id)

// ===================================================================

export const resolveResourceSets = resourceSets => (
  map(resourceSets, resourceSet => {
    const { objects, ...attrs } = resourceSet
    const resolvedObjects = {}
    const resolvedSet = {
      ...attrs,
      missing: [],
      objects: resolvedObjects
    }
    const state = store.getState()

    forEach(objects, id => {
      const object = getObject(state, id)

      // Error, missing resource.
      if (!object) {
        resolvedSet.missing.push(id)
        return
      }

      const { type } = object

      if (!resolvedObjects[type]) {
        resolvedObjects[type] = [ object ]
      } else {
        resolvedObjects[type].push(object)
      }
    })

    return resolvedSet
  })
)

// ===================================================================

@propTypes({
  entities: propTypes.array.isRequired
})
export class Entities extends Component {
  constructor (props) {
    super(props)
    this.state = {
      groups: [],
      users: []
    }
  }

  componentWillMount () {
    const unsubscribeGroups = subscribeGroups(groups => {
      this.setState({
        groups: keyBy(groups, 'id')
      })
    })
    const unsubscribeUsers = subscribeUsers(users => {
      this.setState({
        users: keyBy(users, 'id')
      })
    })

    this.componentWillUnmount = () => {
      unsubscribeGroups()
      unsubscribeUsers()
    }
  }

  render () {
    const { state } = this

    return (
      <div>
        {map(this.props.entities, id => {
          const entity = state.users[id] || state.groups[id]
          if (!entity) {
            return <span key={id} className='m-r-1'>{_('unknownResourceSetValue')}</span>
          }

          if (entity.email) {
            return (
              <span key={id} className='m-r-1'>
                <Icon icon='user' /> {entity.email}
              </span>
            )
          }

          return (
            <span key={id} className='m-r-1'>
              <Icon icon='group' /> {entity.name}
            </span>
          )
        })}
      </div>
    )
  }
}

// ===================================================================

const OBJECT_TYPE_TO_ICON = {
  'VM-template': 'vm',
  'network': 'network',
  'SR': 'sr'
}

export const ObjectP = propTypes({
  object: propTypes.object.isRequired
})(connectStore(() => {
  const getPool = createGetObject(
    (_, props) => props.object.$pool
  )

  return (state, props) => ({
    pool: getPool(state, props)
  })
})(({ object, pool }) => {
  const icon = OBJECT_TYPE_TO_ICON[object.type]
  const { id } = object

  return (
    <span key={id} className='m-r-1'>
      <Icon icon={icon} /> {object.name_label || id} {pool && `(${pool.name_label || pool.id})`}
    </span>
  )
}))

// ===================================================================

class ResourceSet extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  _updateOpen = () => {
    this.setState({
      open: !this.state.open
    })
  }

  render () {
    const { open } = this.state
    const { resourceSet } = this.props
    const {
      limits: {
        cpus,
        disk,
        memory
      } = {}
    } = resourceSet

    return (
      <div className='p-b-1'>
        <button className='card-header btn btn-lg btn-block' onClick={this._updateOpen}>
          {resourceSet.name} <Icon icon={`chevron-${open ? 'up' : 'down'}`} />
        </button>
        <Panel className='p-t-1' collapsible expanded={open}>
          <ul className='list-group p-b-1'>
            <li className='list-group-item'>
              <Entities entities={resourceSet.subjects} />
            </li>
            {map(resourceSet.objects, (objectsSet, type) => (
              <li key={type} className='list-group-item'>
                {map(objectsSet, object => <ObjectP key={object.id} object={object} />)}
              </li>
            ))}
          </ul>
        </Panel>
        {resourceSet.missing.length > 0 &&
          <div className='alert alert-danger' role='alert'>
            <strong>{_('resourceSetMissingObjects')}</strong> {resourceSet.missing.join(', ')}
          </div>
        }
        <Row>
          <Col mediumSize={4}>
            <div className='card'>
              <div className='card-header text-xs-center'>
                <strong><Icon icon='cpu' /> {_('resourceSetVcpus')}</strong>
              </div>
              <div className='card-block text-center' style={{ height: '236px' }}>
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
              </div>
            </div>
          </Col>
          <Col mediumSize={4}>
            <div className='card'>
              <div className='card-header text-xs-center'>
                <strong><Icon icon='memory' /> {_('resourceSetMemory')}</strong>
              </div>
              <div className='card-block text-center' style={{ height: '236px' }}>
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
              </div>
            </div>
          </Col>
          <Col mediumSize={4}>
            <div className='card'>
              <div className='card-header text-xs-center'>
                <strong><Icon icon='disk' /> {_('resourceSetStorage')}</strong>
              </div>
              <div className='card-block text-center' style={{ height: '236px' }}>
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
              </div>
            </div>
          </Col>
        </Row>
      </div>
    )
  }
}

// ===================================================================

export default class Dashboard extends Component {
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
    return (
      <div>
        <div className='card'>
          <div className='card-header text-xs-center'>
            <h5><Icon icon='resource-set' /> {_('selfServiceDashboardPage')}</h5>
          </div>
          <div className='card-block'>
            {map(this.state.resourceSets, (resourceSet, key) => <ResourceSet key={key} resourceSet={resourceSet} />)}
          </div>
        </div>
      </div>
    )
  }
}
