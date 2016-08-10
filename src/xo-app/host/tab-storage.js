import ActionRowButton from 'action-row-button'
import React from 'react'
import _ from 'intl'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import Tooltip from 'tooltip'
import { BlockLink } from 'link'
import { TabButtonLink } from 'tab-button'
import { formatSize } from 'utils'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { Container, Row, Col } from 'grid'
import { Text } from 'editable'
import { connectPbd, disconnectPbd, deletePbd, editSr } from 'xo'

export default ({
  host,
  srs,
  pbds
}) => <Container>
  <Row>
    <Col className='text-xs-right'>
      <TabButtonLink
        icon='add'
        labelId='addSrDeviceButton'
        to={`/new/sr?host=${host.id}`}
      />
    </Col>
  </Row>
  <Row>
    <Col>
      {!isEmpty(pbds)
        ? <span>
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('srNameLabel')}</th>
                <th>{_('srFormat')}</th>
                <th>{_('srSize')}</th>
                <th>{_('srUsage')}</th>
                <th>{_('srType')}</th>
                <th>{_('pdbStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {map(pbds, pbd => {
                const sr = srs[pbd.SR]
                return <BlockLink key={pbd.id} to={`/srs/${sr.id}/general`} tagName='tr'>
                  <td>
                    <Text value={sr.name_label} onChange={nameLabel => editSr(sr, { nameLabel })} useLongClick />
                  </td>
                  <td>{sr.SR_type}</td>
                  <td>{formatSize(sr.size)}</td>
                  <td>
                    {sr.size > 1 &&
                      <Tooltip content={_('spaceLeftTooltip', {used: Math.round((sr.physical_usage / sr.size) * 100), free: formatSize(sr.size - sr.physical_usage)})}>
                        <meter value={(sr.physical_usage / sr.size) * 100} min='0' max='100' optimum='40' low='80' high='90'></meter>
                      </Tooltip>
                    }
                  </td>
                  <td>
                    {sr.$PBDs.length > 1
                      ? _('srShared')
                      : _('srNotShared')
                    }
                  </td>
                  <td>
                    {pbd.attached
                      ? <span>
                        <span className='tag tag-success'>
                            {_('pbdStatusConnected')}
                        </span>
                        <ButtonGroup className='pull-xs-right'>
                          <ActionRowButton
                            btnStyle='default'
                            icon='disconnect'
                            handler={disconnectPbd}
                            handlerParam={pbd}
                          />
                        </ButtonGroup>
                      </span>
                      : <span>
                        <span className='tag tag-default'>
                          {_('pbdStatusDisconnected')}
                        </span>
                        <ButtonGroup className='pull-xs-right'>
                          <ActionRowButton
                            btnStyle='default'
                            icon='connect'
                            handler={connectPbd}
                            handlerParam={pbd}
                          />
                          <ActionRowButton
                            btnStyle='default'
                            icon='sr-forget'
                            handler={deletePbd}
                            handlerParam={pbd}
                          />
                        </ButtonGroup>
                      </span>
                    }
                  </td>
                </BlockLink>
              })}
            </tbody>
          </table>
        </span>
        : <h4 className='text-xs-center'>{_('pbdNoSr')}</h4>
      }
    </Col>
  </Row>
</Container>
