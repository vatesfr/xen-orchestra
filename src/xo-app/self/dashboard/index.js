import BaseComponent from 'base-component'
import ChartistGraph from 'react-chartist'
import Icon from 'icon'
import React, { Component } from 'react'
import _ from 'messages'
import map from 'lodash/map'
import { Panel } from 'react-bootstrap-4/lib'
import { Row, Col } from 'grid'
import { formatSize } from 'utils'
import { subscribeResourceSets } from 'xo'

import {
  Card,
  CardBlock,
  CardHeader
} from 'card'

import {
  ObjectP,
  Subjects,
  resolveResourceSets
} from '../helpers'

// ===================================================================

class ResourceSet extends BaseComponent {
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
        <button className='btn btn-lg btn-primary btn-block' onClick={this._updateOpen}>
          {resourceSet.name} <Icon icon={`chevron-${open ? 'up' : 'down'}`} />
        </button>
        <Panel className='p-t-1' collapsible expanded={open}>
          <ul className='list-group p-b-1'>
            <li className='list-group-item'>
              <Subjects subjects={resourceSet.subjects} />
            </li>
            {map(resourceSet.objectsByType, (objectsSet, type) => (
              <li key={type} className='list-group-item'>
                {map(objectsSet, object => <ObjectP key={object.id} object={object} />)}
              </li>
            ))}
          </ul>
        </Panel>
        {resourceSet.missingObjects.length > 0 &&
          <div className='alert alert-danger' role='alert'>
            <strong>{_('resourceSetMissingObjects')}</strong> {resourceSet.missingObjects.join(', ')}
          </div>
        }
        <Row>
          <Col mediumSize={4}>
            <Card>
              <CardHeader>
                <strong><Icon icon='cpu' /> {_('resourceSetVcpus')}</strong>
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
                <strong><Icon icon='memory' /> {_('resourceSetMemory')}</strong>
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
                <strong><Icon icon='disk' /> {_('resourceSetStorage')}</strong>
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
        <Card>
          <CardHeader>
            <h5><Icon icon='resource-set' /> {_('selfServiceDashboardPage')}</h5>
          </CardHeader>
          <CardBlock>
            {map(this.state.resourceSets, (resourceSet, key) => <ResourceSet key={key} resourceSet={resourceSet} />)}
          </CardBlock>
        </Card>
      </div>
    )
  }
}
