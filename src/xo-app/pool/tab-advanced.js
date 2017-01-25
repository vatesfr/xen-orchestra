import _ from 'intl'
import Copiable from 'copiable'
import React from 'react'
import { Container, Row, Col } from 'grid'
import { installSupplementalPackOnAllHosts } from 'xo'
import SelectFiles from 'select-files'

export default ({
  pool
}) => <div>
  <h3 className='mb-1'>{_('xenSettingsLabel')}</h3>
  <Container>
    <Row>
      <Col size={3}>
        <strong>{_('uuid')}</strong>
      </Col>
      <Col size={9}>
        <Copiable tagName='div'>
          {pool.uuid}
        </Copiable>
      </Col>
    </Row>
    <Row>
      <Col size={3}>
        <strong>{_('poolHaStatus')}</strong>
      </Col>
      <Col size={9}>
        {pool.HA_enabled
          ? _('poolHaEnabled')
          : _('poolHaDisabled')
        }
      </Col>
    </Row>
  </Container>
  <h3 className='mt-1 mb-1'>{_('supplementalPackPoolNew')}</h3>
  <div>
    <SelectFiles onChange={file => installSupplementalPackOnAllHosts(pool, file)} />
  </div>
</div>
