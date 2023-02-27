import _ from 'intl'
import Icon from 'icon'
import Page from '../page'
import React from 'react'
import { Col, Container, Row } from 'grid'
import { NavLink, NavTabs } from 'nav'
import { routes } from 'utils'

import DiskImport from '../disk-import'
import EsxiImport from '../vm-import/esxi/esxi-import'
import VmImport from '../vm-import'

const HEADER = (
  <Container>
    <Row>
      <Col mediumSize={3}>
        <h2>
          <Icon icon='import' /> {_('newImport')}
        </h2>
      </Col>
      <Col mediumSize={9}>
        <NavTabs className='pull-right'>
          <NavLink to='/import/vm'>
            <Icon icon='vm' /> {_('labelVm')}
          </NavLink>
          <NavLink to='/import/disk'>
            <Icon icon='disk' /> {_('labelDisk')}
          </NavLink>
          <NavLink to='/import/vmware'>
            <Icon icon='vm' /> {_('fromVmware')}
          </NavLink>
        </NavTabs>
      </Col>
    </Row>
  </Container>
)

const Import = routes('vm', {
  disk: DiskImport,
  vm: VmImport,
  vmware: EsxiImport,
})(({ children }) => (
  <Page header={HEADER} title='newImport' formatTitle>
    {children}
  </Page>
))

export default Import
