import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import Page from '../page'
import React from 'react'
import { Container, Col, Row } from 'grid'
import { addSubscriptions, connectStore } from 'utils'
import {
  areObjectsFetched,
  createCounter,
  createFilter,
  createGetObjectsOfType,
  createPager,
  createSelector,
  createSort,
  getIsPoolAdmin,
  getUser,
  isAdmin,
} from 'selectors'
import { subscribePlugins, subscribeAllResourceCatalog } from 'xo'
import { filter, map, mapValues, orderBy } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { DropdownButton, MenuItem } from 'react-bootstrap-4/lib'

import Resource from './resource'
import './style.css'

// ==================================================================

const SORT_OPTIONS = [
  {
    labelId: 'hubSortByPopularity',
    sortBy: 'popularity',
    sortOrder: 'desc',
  },
  {
    labelId: 'hubSortByName',
    sortBy: 'name',
    sortOrder: 'asc',
  },
]

const HEADER = (
  <Container>
    <h2>
      <Icon icon='menu-hub' /> {_('hubPage')}
    </h2>
  </Container>
)

export default decorate([
  addSubscriptions({
    catalog: subscribeAllResourceCatalog,
    plugins: subscribePlugins,
  }),
  connectStore(() => {
    return {
      isAdmin,
      isPoolAdmin: getIsPoolAdmin,
      items: createGetObjectsOfType('VM-template').filter(
        createSelector(
          (_, props) => props.item.id,
          poolId => obj => obj.$pool === poolId
        )
      ),
      type: 'VM-template',
      user: getUser,
    }
  }),
  provideState({
    initialState: () => ({
      sortBy: undefined,
      sortOrder: undefined,
    }),
    effects: {
      setSort(
        _,
        {
          currentTarget: {
            dataset: { sortBy, sortOrder },
          },
        }
      ) {
        return { sortBy, sortOrder }
      },
    },
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
      sortTitle: ({ sortBy }) =>
        sortBy === undefined ? _('hubSortBy') : sortBy,
    },
  }),
  injectState,
  ({ effects, state: { resources, sortTitle }, items }) => (
    <Page
      header={HEADER}
      title='hubPage'
      formatTitle
      className='background-page'
    >
      <Row>
        <Col>
          <span className='pull-right'>
            <DropdownButton bsStyle='link' id='sort' title={sortTitle}>
              {map(SORT_OPTIONS, ({ labelId, sortBy, sortOrder }, key) => (
                <MenuItem
                  data-sort-by={sortBy}
                  data-sort-order={sortOrder}
                  key={key}
                  onClick={effects.setSort}
                >
                  {_(labelId)}
                </MenuItem>
              ))}
            </DropdownButton>
          </span>
        </Col>
      </Row>
      <br />
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
