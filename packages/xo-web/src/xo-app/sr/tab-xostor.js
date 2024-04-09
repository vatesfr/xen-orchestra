import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'

import { addSubscriptions, connectStore } from 'utils'
import { Card, CardHeader, CardBlock } from 'card'
import { Container, Row, Col } from 'grid'
import { createSelector, createGetObjectsOfType } from 'selectors'
import { Host, Vdi } from 'render-xo-item'
import { subscribeXostorHealthCheck } from 'xo'

const RESOURCE_COLUMNS = [
  {
    name: 'Resource name',
    itemRenderer: ({ resourceName }) => resourceName,
    sortCriteria: ({ resourceName }) => resourceName,
  },
  {
    name: _('node'),
    itemRenderer: ({ host }) => <Host id={host.id} link />,
    sortCriteria: ({ host }) => host.name_label,
  },
  {
    name: _('nodeStatus'),
    itemRenderer: ({ nodeStatus }) => nodeStatus,
    sortCriteria: ({ nodeStatus }) => nodeStatus,
  },
  {
    name: _('vdi'),
    itemRenderer: ({ volume }) => <Vdi id={volume.uuid} />,
  },
  {
    name: _('inUse'),
    itemRenderer: resource => <Icon icon={String(resource['in-use'])} />,
    sortCriteria: resource => resource['in-use'],
  },
  {
    name: _('diskState'),
    itemRenderer: ({ volume }) => volume['disk-state'],
    sortCriteria: ({ volume }) => volume['disk-state'],
  },
]

@connectStore({
  hostByHostname: createGetObjectsOfType('host')
    .filter((_, props) => host => host.$pool === props.sr.$pool)
    .groupBy('hostname'),
})
@addSubscriptions(({ sr }) => ({
  healthCheck: subscribeXostorHealthCheck(sr),
}))
export default class TabXostor extends Component {
  getResourceInfos = createSelector(
    () => this.props.healthCheck,
    healthCheck => {
      if (healthCheck === undefined) {
        return []
      }

      return Object.entries(healthCheck.resources).flatMap(([resourceName, resourceByHostname]) => {
        return Object.entries(resourceByHostname).map(([hostname, resource]) => {
          const host = this.props.hostByHostname[hostname][0]
          const nodeStatus = healthCheck.nodes[hostname]
          const volume = resource.volumes[0] // Always only one volume

          return {
            ...resource,
            host,
            nodeStatus,
            resourceName,
            volume,
          }
        })
      })
    }
  )

  render() {
    const resourceInfos = this.getResourceInfos()

    return (
      <Container>
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='disk' /> {_('resourceList')}
              </CardHeader>
              <CardBlock>
                <SortedTable collection={resourceInfos} columns={RESOURCE_COLUMNS} stateUrlParam='r' />
              </CardBlock>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }
}
