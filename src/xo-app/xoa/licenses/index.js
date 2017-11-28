// import _ from 'intl'
// import Icon from 'icon'
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

import Xosan from './xosan'

const openNewLicense = product => {
  if (product === undefined) {
    window.open('https://beta.xen-orchestra.com/#!/member/purchaser')
  } else {
    window.open('https://beta.xen-orchestra.com/#!/member/purchaser')
    // window.open(
    //   `http://xen-orchestra.com/?boundObjectId=${encodeURIComponent(
    //     product.boundObjectId
    //   )}`
    // )
  }
}

const openSupport = product => {
  window.open('https://beta.xen-orchestra.com/#!/member/purchaser')
}

const PRODUCTS = ['xoa', 'xosan']

const PRODUCTS_COLUMNS = [
  {
    name: 'Product',
    itemRenderer: ({ product, id }) => (
      <span>
        {product} <span className='text-muted'>({id.slice(-4)})</span>
      </span>
    ),
    sortCriteria: 'product',
    default: true,
  },
  {
    name: 'Attached to',
    itemRenderer: ({ renderBoundObject }) =>
      renderBoundObject && renderBoundObject(),
  },
  {
    name: 'Purchaser',
    itemRenderer: ({ buyer }) => (buyer ? buyer.email : '-'),
    sortCriteria: 'buyer.email',
  },
  {
    name: 'Expires',
    itemRenderer: ({ expires }) =>
      expires !== undefined && <Time time={expires} />,
    sortCriteria: 'expires',
  },
]

const PRODUCTS_INDIVIDUAL_ACTIONS = [
  {
    handler: openSupport,
    icon: 'support',
    label: 'Support',
  },
]

const getBoundXosanRenderer = (boundObjectId, xosanSrs) => {
  if (boundObjectId === undefined) {
    return () => 'License not bound to any XOSAN SR'
  }

  const sr = xosanSrs[boundObjectId]
  if (sr === undefined) {
    return () => 'License bound to an unknown XOSAN SR'
  }

  return () => <Link to={`srs/${sr.id}`}>{sr.name_label}</Link>
}

@connectStore({
  xosanSrs: createGetObjectsOfType('SR').filter([
    ({ SR_type }) => SR_type === 'xosan', // eslint-disable-line camelcase
  ]),
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

      // TODO: REMOVE
      // const products = [
      //   {
      //     product: 'XOA',
      //     purchaser: 'Toto'
      //   },
      //   {
      //     product: 'XOSAN',
      //     purchaser: 'Titi',
      //     boundObjectId: '123'
      //   },
      //   {
      //     product: 'XOSAN',
      //     purchaser: 'Tata',
      //     boundObjectId: '031f416a-4183-73ab-d1fc-f9f0c53177d1'
      //   }
      // ]

      // Either:
      // - find object bound to license
      // - or overload products array with potential products
      // forEach(xosanSrs, sr => {
      //   const index = findIndex(xosanLicenses, [ 'boundObjectId', sr.id ])
      //   if (index !== undefined) {
      //     products[index].renderBoundObject = getBoundXosanRenderer(sr)
      //   } else {
      //     products.push({
      //       product: 'XOSAN',
      //       renderBoundObject: getBoundXosanRenderer(sr),
      //       boundObjectId: sr.id
      //     })
      //   }
      // })
      console.log('xoaLicenses', xoaLicenses)
      console.log('xosanLicenses', xosanLicenses)

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

      console.log('products', products)
      return products
    }
  )

  render () {
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
              userData={this.props.licenses}
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
