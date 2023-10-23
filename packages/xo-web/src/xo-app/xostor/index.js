import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { injectState, provideState } from 'reaclette'
import { Container, Col, Row } from 'grid'
import { TryXoa } from 'utils'

import NewXostorForm from './new-xostor-form'
import XostorList from './xostor-list'

import Page from '../page'

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
      {process.env.XOA_PLAN < 5 ? (
        <Container>
          <XostorList />
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
        </Container>
      ) : (
        <Container>
          <h2 className='text-info'>{_('xostorCommunity')}</h2>
          <p>
            <TryXoa page='xosan' />
          </p>
        </Container>
      )}
    </Page>
  ),
])

export default Xostor
