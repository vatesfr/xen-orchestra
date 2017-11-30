import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Link from 'link'
import React from 'react'
import SortedTable from 'sorted-table'
import { Container, Row, Col } from 'grid'
import { createSelector, createGetObjectsOfType } from 'selectors'
import { forEach } from 'lodash'
import { addSubscriptions, connectStore, Time } from 'utils'
import { subscribeLicenses, subscribePlugins } from 'xo'
import { get } from 'xo-defined'

import Xosan from './xosan'

const openNewLicense = productId => {
  if (productId === undefined) {
    window.open('https://beta.xen-orchestra.com/#!/member/purchaser')
  } else {
    window.open(
      `https://xen-orchestra.com/?productId=${encodeURIComponent(productId)}`
    )
  }
}

const openSupport = product => {
  window.open('https://beta.xen-orchestra.com/#!/member/purchaser')
}

const PRODUCTS = ['xoa', 'xosan']

const PRODUCTS_COLUMNS = [
  {
    name: _('licenseProduct'),
    itemRenderer: ({ product, id }) => (
      <span>
        {product} <span className='text-muted'>({id.slice(-4)})</span>
      </span>
    ),
    sortCriteria: 'product',
    default: true,
  },
  {
    name: _('licenseBoundObject'),
    itemRenderer: ({ renderBoundObject }) =>
      renderBoundObject && renderBoundObject(),
  },
  {
    name: _('licensePurchaser'),
    itemRenderer: ({ buyer }, { registeredEmail }) =>
      buyer ? (
        buyer.email === registeredEmail ? (
          _('licensePurchaserYou')
        ) : (
          <a href={`mailto:${buyer.email}`}>{buyer.email}</a>
        )
      ) : (
        '-'
      ),
    sortCriteria: 'buyer.email',
  },
  {
    name: _('licenseExpires'),
    itemRenderer: ({ expires }) =>
      expires !== undefined && <Time timestamp={expires} />,
    sortCriteria: 'expires',
  },
]

const PRODUCTS_INDIVIDUAL_ACTIONS = [
  {
    handler: openSupport,
    icon: 'support',
    label: _('productSupport'),
  },
]

const getBoundXosanRenderer = (boundObjectId, xosanSrs) => {
  if (boundObjectId === undefined) {
    return () => _('licenseNotBoundXosan')
  }

  const sr = xosanSrs[boundObjectId]
  if (sr === undefined) {
    return () => _('licenseBoundUnknownXosan')
  }

  return () => <Link to={`srs/${sr.id}`}>{sr.name_label}</Link>
}

@connectStore({
  xosanSrs: createGetObjectsOfType('SR').filter([
    ({ SR_type }) => SR_type === 'xosan', // eslint-disable-line camelcase
  ]),
  xoaRegistration: state => state.xoaRegisterState,
})
@addSubscriptions(() => ({
  licenses: cb => subscribeLicenses(PRODUCTS, cb),
  plugins: subscribePlugins,
}))
export default class Licenses extends Component {
  _getProducts = createSelector(
    () => this.props.licenses,
    () => this.props.xosanSrs,
    (rawLicenses, xosanSrs) => {
      if (rawLicenses === undefined) {
        return []
      }

      const [xoaLicenses, xosanLicenses] = rawLicenses
      const products = []
      if (xoaLicenses.state === 'register-needed') {
        // Should not happen
        return
      }

      // XOSAN
      const boundSrs = []
      forEach(xosanLicenses, license => {
        if (license.boundObjectId !== undefined) {
          boundSrs.push(license.boundObjectId)
        }
        products.push({
          product: 'XOSAN',
          renderBoundObject: getBoundXosanRenderer(
            license.boundObjectId,
            xosanSrs
          ),
          buyer: license.buyer,
          expires: license.expires,
          id: license.id,
        })
      })

      return products
    }
  )

  render () {
    if (get(() => this.props.xoaRegistration.state) !== 'registered') {
      return <em>{_('licensesUnregisteredDisclaimer')}</em>
    }

    return (
      <Container>
        <Row className='mb-1'>
          <Col>
            <ActionButton
              btnStyle='success'
              icon='add'
              handler={openNewLicense}
            >
              New license
            </ActionButton>
          </Col>
        </Row>
        <Row>
          <Col>
            <SortedTable
              collection={this._getProducts()}
              columns={PRODUCTS_COLUMNS}
              individualActions={PRODUCTS_INDIVIDUAL_ACTIONS}
              userData={{
                registeredEmail: this.props.xoaRegistration.email,
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <h2>XOSAN</h2>
            <Xosan />
          </Col>
        </Row>
      </Container>
    )
  }
}
