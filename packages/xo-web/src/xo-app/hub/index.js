import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { addSubscriptions } from 'utils'
import { Container, Col, Row } from 'grid'
import { injectState, provideState } from 'reaclette'
import { isEmpty, map, orderBy } from 'lodash'
import { subscribeResourceCatalog } from 'xo'

import Page from '../page'
import Resource from './resource'

// ==================================================================

const HEADER = (
  <h2>
    <Icon icon='menu-hub' /> {_('hubPage')}
  </h2>
)

export default decorate([
  addSubscriptions({
    catalog: subscribeResourceCatalog({ filters: { hub: true } }),
  }),
  provideState({
    initialState: () => ({}),
    computed: {
      resources: ({ availableResources }) =>
        orderBy(availableResources, res => res.name, 'asc'),
      availableResources: (_, { catalog }) =>
        map(catalog, (entry, namespace) => ({
          namespace,
          ...entry.xva,
        })),
    },
  }),
  injectState,
  ({ state: { resources } }) => (
    <Page header={HEADER} title='hubPage' formatTitle>
      <Container>
        <Row>
          {isEmpty(resources) ? (
            <Col>
              <h2 className='text-muted'>
                &nbsp; {_('hubVmNoAvailableMsg')}
                <Icon icon='alarm' color='yellow' />
              </h2>
            </Col>
          ) : (
            resources.map(data => (
              <Col key={data.namespace} mediumSize={3}>
                <Resource {...data} />
              </Col>
            ))
          )}
        </Row>
      </Container>
    </Page>
  ),
])
