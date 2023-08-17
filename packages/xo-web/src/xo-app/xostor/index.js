import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { injectState, provideState } from 'reaclette'
import { Container, Col, Row } from 'grid'

import Page from '../page'
import NewXostorForm from './new-xostor-form'

const HEADER = (
  <Container>
    <h2>
      <Icon icon='menu-xostor' /> {_('xostor')}
    </h2>
  </Container>
)

const Xostor = decorate([
  provideState({
    initialState: () => ({ showNewXostorForm: false }),
    effects: {
      _toggleShowNewXostorForm() {
        this.state.showNewXostorForm = !this.state.showNewXostorForm
      },
    },
  }),
  injectState,
  ({ effects, state }) => (
    <Page header={HEADER}>
      <Row className='mb-1'>
        <Col>
          <ActionButton
            btnStyle='primary'
            handler={effects._toggleShowNewXostorForm}
            icon={state.showNewXostorForm ? 'minus' : 'plus'}
          >
            {_('new')}
          </ActionButton>
        </Col>
      </Row>
      {state.showNewXostorForm && <NewXostorForm />}
    </Page>
  ),
])

export default Xostor
