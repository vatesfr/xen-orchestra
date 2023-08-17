import _ from 'intl'
import Icon from 'icon'
import React from 'react'
import { Container } from 'grid'

import Page from '../page'
import NewXostorForm from './new-xostor-form'

const HEADER = (
  <Container>
    <h2>
      <Icon icon='menu-xostor' /> {_('xostor')}
    </h2>
  </Container>
)

const Xostor = () => (
  <Page header={HEADER}>
    <NewXostorForm />
  </Page>
)

export default Xostor
