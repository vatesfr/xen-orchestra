import _ from 'intl'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import Link from 'link'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import { Container, Row, Col } from 'grid'
import { editHost, connectPbd, disconnectPbd, deletePbd } from 'xo'
import { Text } from 'editable'

const HOST_COLUMNS = [
  {
    name: _('hostNameLabel'),
    itemRenderer: (pbd, hosts) => {
      const host = hosts[pbd.host]
      return (
        <Link to={`/hosts/${host.id}`}>
          <Text value={host.name_label} onChange={value => editHost(host, { name_label: value })} useLongClick />
        </Link>
      )
    },
    sortCriteria: (pbd, hosts) => hosts[pbd.host].name_label
  },
  {
    name: _('hostDescription'),
    itemRenderer: (pbd, hosts) => {
      const host = hosts[pbd.host]
      return (
        <Text value={host.name_description} onChange={value => editHost(host, { name_description: value })} />
      )
    },
    sortCriteria: (pbd, hosts) => hosts[pbd.host].name_description
  },
  {
    name: _('pbdStatus'),
    itemRenderer: pbd => <StateButton
      disabledLabel={_('pbdStatusDisconnected')}
      disabledHandler={connectPbd}
      disabledTooltip={_('pbdConnect')}

      enabledLabel={_('pbdStatusConnected')}
      enabledHandler={disconnectPbd}
      enabledTooltip={_('pbdDisconnect')}

      handlerParam={pbd}
      state={pbd.attached}
    />,
    sortCriteria: 'attached'
  },
  {
    name: _('pbdAction'),
    itemRenderer: pbd => !pbd.attached &&
      <ActionRowButton
        btnStyle='default'
        handler={deletePbd}
        handlerParam={pbd}
        icon='sr-forget'
        tooltip={_('pbdForget')}
      />,
    textAlign: 'right'
  }
]

export default ({
  hosts,
  pbds
}) => <Container>
  <Row>
    <Col>
      {!isEmpty(hosts)
        ? <SortedTable collection={pbds} userData={hosts} columns={HOST_COLUMNS} />
        : <h4 className='text-xs-center'>{_('noHost')}</h4>
      }
    </Col>
  </Row>
</Container>
