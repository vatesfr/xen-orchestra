import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import Page from '../page'
import React from 'react'
import { Container, Col, Row } from 'grid'
import { addSubscriptions } from 'utils'
import { injectState, provideState } from 'reaclette'
import { map, mapValues, orderBy } from 'lodash'
import { subscribeResourceCatalog } from 'xo'

import Resource from './resource'

// ==================================================================

const DEFAULT_SORT_OPTION = {
  labelId: 'hubSortByName',
  sortBy: 'name',
  sortOrder: 'asc',
}

const HEADER = (
  <Container>
    <h2>
      <Icon icon='menu-hub' /> {_('hubPage')}
    </h2>
  </Container>
)

export default decorate([
  addSubscriptions({
    catalog: subscribeResourceCatalog({ hub: true }),
  }),
  provideState({
    initialState: () => ({
      sortBy: DEFAULT_SORT_OPTION.sortBy,
      sortOrder: DEFAULT_SORT_OPTION.sortOrder,
    }),
    computed: {
      resources: ({ availableResources, sortBy, sortOrder }) =>
        orderBy(availableResources, res => res[sortBy], sortOrder),
      availableResources: (_, { catalog }) => {
        if (catalog !== undefined) {
          delete catalog._namespaces
        }
        return map(mapValues(catalog, 'xva'), (info, namespace) => ({
          ...info,
          namespace,
        }))
      },
    },
  }),
  injectState,
  ({ state: { resources } }) => (
    <Page
      header={HEADER}
      title='hubPage'
      formatTitle
      className='background-page'
    >
      <Row>
        {map(resources, (info, namespace) => (
          <Col key={namespace} mediumSize={3}>
            <Resource className='card-style' namespace={namespace} {...info} />
          </Col>
        ))}
      </Row>
    </Page>
  ),
])
