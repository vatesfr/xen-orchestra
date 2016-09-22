import _ from 'intl'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import Link from 'link'
import React from 'react'
import SortedTable from 'sorted-table'
import { ButtonGroup } from 'react-bootstrap-4/lib'
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
    name: _('pdbStatus'),
    itemRenderer: pbd => {
      if (pbd.attached) {
        return (
          <span>
            <span className='tag tag-success'>
              {_('pbdStatusConnected')}
            </span>
            <ButtonGroup className='pull-xs-right'>
              <ActionRowButton
                btnStyle='warning'
                handler={disconnectPbd}
                handlerParam={pbd}
                icon='disconnect'
                tooltip={_('pbdDisconnect')}
              />
            </ButtonGroup>
          </span>
        )
      }

      return (
        <span>
          <span className='tag tag-default'>
            {_('pbdStatusDisconnected')}
          </span>
          <ButtonGroup className='pull-xs-right'>
            <ActionRowButton
              btnStyle='default'
              handler={connectPbd}
              handlerParam={pbd}
              icon='connect'
              tooltip={_('pbdConnect')}
            />
            <ActionRowButton
              btnStyle='default'
              handler={deletePbd}
              handlerParam={pbd}
              icon='sr-forget'
              tooltip={_('pbdForget')}
            />
          </ButtonGroup>
        </span>
      )
    },
    sortCriteria: 'attached'
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
