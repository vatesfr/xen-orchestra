import _ from 'intl'
import Copiable from 'copiable'
import React from 'react'
import SelectFiles from 'select-files'
import Upgrade from 'xoa-upgrade'
import { Container, Row, Col } from 'grid'
import { installSupplementalPackOnAllHosts } from 'xo'

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
  <Upgrade place='poolSupplementalPacks' required={2}>
    <SelectFiles onChange={file => installSupplementalPackOnAllHosts(pool, file)} />
  </Upgrade>
</div>
