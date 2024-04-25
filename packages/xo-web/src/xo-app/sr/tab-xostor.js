import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Icon from 'icon'
import PifsColumn from 'sorted-table/pifs-column'
import React from 'react'
import SortedTable from 'sorted-table'
import { addSubscriptions, connectStore } from 'utils'
import { Card, CardHeader, CardBlock } from 'card'
import { Container, Row, Col } from 'grid'
import { createCollectionWrapper, createSelector, createGetObjectsOfType } from 'selectors'
import {
  createXostorInterface,
  destroyXostorInterfaces,
  setXostor,
  subscribeXostorHealthCheck,
  subscribeXostorInterfaces,
} from 'xo'
import { find } from 'lodash'
import { generateId } from 'reaclette-utils'
import { Host, Vdi } from 'render-xo-item'

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
    itemRenderer: ({ vdiId }) => vdiId !== '' && <Vdi id={vdiId} />,
  },
  {
    name: _('inUse'),
    itemRenderer: ({ inUse }) => <Icon icon={String(inUse)} />,
    sortCriteria: ({ inUse }) => inUse,
  },
  {
    name: _('diskState'),
    itemRenderer: ({ volume }) => volume['disk-state'],
    sortCriteria: ({ volume }) => volume['disk-state'],
  },
]

const INTERFACES_COLUMNS = [
  {
    name: _('name'),
    itemRenderer: iface => iface.name,
    sortCriteria: iface => iface.name,
  },
  {
    name: _('pifs'),
    itemRenderer: (iface, { pifIdsByIfaceName }) => <PifsColumn pifs={pifIdsByIfaceName[iface.name]} />,
  },
]

@connectStore({
  hostByHostname: createGetObjectsOfType('host')
    .filter((_, props) => host => host.$pool === props.sr.$pool)
    .groupBy('hostname'),
  pifs: createGetObjectsOfType('PIF').filter((_, props) => pif => pif.$pool === props.sr.$pool),
})
@addSubscriptions(({ sr }) => ({
  healthCheck: subscribeXostorHealthCheck(sr),
  interfaces: subscribeXostorInterfaces(sr),
}))
export default class TabXostor extends Component {
  _actions = [
    {
      handler: ifaces =>
        destroyXostorInterfaces(
          this.props.sr,
          ifaces.map(iface => iface.name)
        ),
      icon: 'delete',
      label: _('delete'),
      level: 'danger',
      individualDisabled: ifaces => ifaces[0].name === 'default',
    },
  ]

  _individualActions = [
    {
      handler: iface => setXostor(this.props.sr, { preferredInterface: iface.name }),
      icon: 'favorite',
      label: _('setAsPreferred'),
      level: 'primary',
    },
  ]

  getComputedIfaces = createCollectionWrapper(
    createSelector(
      () => this.props.interfaces,
      ifaces => {
        if (ifaces === undefined) {
          return {}
        }
        const computedIfaces = {}
        for (const ifaceName in ifaces) {
          computedIfaces[ifaceName] = {
            id: generateId(),
            name: ifaceName,
            nodeIfaces: ifaces[ifaceName],
          }
        }
        return computedIfaces
      }
    )
  )

  getPifsByIfaceName = createCollectionWrapper(
    createSelector(
      () => this.props.interfaces,
      () => this.props.pifs,
      (ifaces, pifs) => {
        if (ifaces === undefined) {
          return {}
        }
        const pifsByIfaceName = {}
        for (const ifaceName in ifaces) {
          pifsByIfaceName[ifaceName] = ifaces[ifaceName].map(
            iface => find(pifs, pif => pif.ip === iface.address || pif.ipv6 === iface.address)?.id
          )
        }
        return pifsByIfaceName
      }
    )
  )

  getResourceInfos = createSelector(
    () => this.props.healthCheck,
    healthCheck => {
      if (healthCheck === undefined) {
        return []
      }

      return Object.keys(healthCheck.resources).flatMap(resourceName => {
        return Object.entries(healthCheck.resources[resourceName].nodes).reduce((acc, [hostname, nodeInfo]) => {
          const volume = nodeInfo.volumes[0] // Max only one volume
          if (volume !== undefined) {
            const nodeStatus = healthCheck.nodes[hostname]
            const host = this.props.hostByHostname[hostname][0]

            acc.push({
              inUse: nodeInfo['in-use'],
              vdiId: healthCheck.resources[resourceName].uuid,
              volume,
              nodeStatus,
              host,
              resourceName,
            })
          }
          return acc
        }, [])
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
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='network' /> {_('interfaces')}
              </CardHeader>
              <CardBlock>
                <ActionButton
                  btnStyle='primary'
                  handler={createXostorInterface}
                  handlerParam={this.props.sr}
                  icon='add'
                >
                  {_('createInterface')}
                </ActionButton>
                <SortedTable
                  actions={this._actions}
                  collection={this.getComputedIfaces()}
                  columns={INTERFACES_COLUMNS}
                  data-pifIdsByIfaceName={this.getPifsByIfaceName()}
                  individualActions={this._individualActions}
                  stateUrlParam='s'
                />
              </CardBlock>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }
}
