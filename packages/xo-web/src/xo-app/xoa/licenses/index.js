import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import renderXoItem from 'render-xo-item'
import SortedTable from 'sorted-table'
import { addSubscriptions, adminOnly, connectStore, ShortDate } from 'utils'
import { Container, Row, Col } from 'grid'
import { createSelector, createGetObjectsOfType } from 'selectors'
import { get } from '@xen-orchestra/defined'
import {
  subscribePlugins,
  getLicenses,
  productId2Plan,
  selfBindLicense,
  subscribeCurrentLicense,
} from 'xo'
import { find, flatten, forEach, some, pick, toArray, zipObject } from 'lodash'

import Xosan from './xosan'

const PRODUCTS = [
  'xosan',
  'xosan.trial',
  'starter',
  'enterprise',
  'premium',
  'sb-premium',
]

// -----------------------------------------------------------------------------

const LicenseManager = ({ item, userData }) => {
  const { type } = item

  if (type === 'xosan') {
    const { srId } = item

    if (srId === undefined) {
      return _('licenseNotBoundXosan')
    }

    const sr = userData.xosanSrs[srId]
    if (sr === undefined) {
      return _('licenseBoundUnknownXosan')
    }

    return <Link to={`srs/${sr.id}`}>{renderXoItem(sr)}</Link>
  }

  if (type === 'xoa') {
    const { id, xoaId } = item
    const { xoaLicense } = userData

    if (xoaLicense != null) {
      if (xoaLicense.id === id) {
        return (
          <span>
            {_('licenseBoundToThisXoa')}{' '}
            {productId2Plan(xoaLicense.productId) !== process.env.XOA_PLAN && (
              <span className='ml-1'>
                <Icon icon='error' />{' '}
                <Link to='/xoa/update'>{_('updateNeeded')}</Link>
              </span>
            )}
          </span>
        )
      }

      return null // XOA is bound to another license
    }

    if (xoaId === undefined) {
      return (
        <ActionButton
          btnStyle='success'
          data-id={item.licenseId}
          data-plan={item.productId}
          handler={selfBindLicense}
          icon='unlock'
        >
          {_('bindXoaLicense')}
        </ActionButton>
      )
    }

    return <span>{_('licenseBoundToOtherXoa')}</span>
  }

  console.warn('encountered unsupported license type')
  return null
}

// -----------------------------------------------------------------------------

const PRODUCTS_COLUMNS = [
  {
    name: _('licenseProduct'),
    itemRenderer: ({ product, id }) => (
      <span>
        {product} <span className='text-muted'>({id.slice(-4)})</span>
      </span>
    ),
    sortCriteria: ({ product, id }) => product + id.slice(-4),
    default: true,
  },
  {
    name: '',
    component: LicenseManager,
  },
  {
    name: _('licensePurchaser'),
    itemRenderer: ({ buyer }, { registeredEmail }) =>
      buyer !== undefined ? (
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
      expires !== undefined ? <ShortDate timestamp={expires} /> : '-',
    sortCriteria: 'expires',
    sortOrder: 'desc',
  },
]

// -----------------------------------------------------------------------------

@adminOnly
@connectStore({
  xosanSrs: createGetObjectsOfType('SR').filter([
    ({ SR_type }) => SR_type === 'xosan', // eslint-disable-line camelcase
  ]),
  xoaRegistration: state => state.xoaRegisterState,
})
@addSubscriptions(() => ({
  plugins: subscribePlugins,
  xoaLicense: subscribeCurrentLicense,
}))
export default class Licenses extends Component {
  constructor() {
    super()

    this.componentDidMount = this._updateLicenses
  }

  _updateLicenses = () => {
    this.setState({ licenseError: undefined })

    return Promise.all(PRODUCTS.map(getLicenses))
      .then(licenses => {
        this.setState({ licenses: zipObject(PRODUCTS, licenses) })
      })
      .catch(error => {
        this.setState({ licenseError: error })
      })
  }

  _getProducts = createSelector(
    () => this.props.xosanSrs,
    () => this.state.licenses,
    (xosanSrs, licenses) => {
      if (get(() => licenses.xosan.state) === 'register-needed') {
        // Should not happen
        return
      }

      const now = Date.now()
      const products = []

      // --- XOSAN ---
      forEach(licenses.xosan, license => {
        if (!(license.expires < now)) {
          products.push({
            buyer: license.buyer,
            expires: license.expires,
            id: license.id,
            product: 'XOSAN',
            srId: license.boundObjectId,
            type: 'xosan',
          })
        }
      })

      // --- XOA ---
      forEach(
        flatten(
          toArray(
            pick(licenses, ['starter', 'enterprise', 'premium', 'sb-premium'])
          )
        ),
        license => {
          if (!(license.expires < now)) {
            products.push({
              buyer: license.buyer,
              expires: license.expires,
              id: license.id,
              product: `XOA ${license.productId}`,
              type: 'xoa',
              xoaId: license.boundObjectId,
            })
          }
        }
      )

      return products
    }
  )

  _getMissingXoaPlugin = createSelector(
    () => this.props.plugins,
    plugins => {
      if (plugins === undefined) {
        return true
      }

      const xoaPlugin = find(plugins, { id: 'xoa' })
      if (!xoaPlugin) {
        return _('xosanInstallXoaPlugin')
      }

      if (!xoaPlugin.loaded) {
        return _('xosanLoadXoaPlugin')
      }
    }
  )

  render() {
    if (get(() => this.props.xoaRegistration.state) !== 'registered') {
      return (
        <span>
          <em>{_('licensesUnregisteredDisclaimer')}</em>{' '}
          <Link to='xoa/update'>{_('registerNow')}</Link>
        </span>
      )
    }

    const missingXoaPlugin = this._getMissingXoaPlugin()
    if (missingXoaPlugin !== undefined) {
      return <em>{missingXoaPlugin}</em>
    }

    if (this.state.licenseError !== undefined) {
      return <span className='text-danger'>{_('xosanGetLicensesError')}</span>
    }

    if (!some(this.state.licenses)) {
      return <em>{_('statusLoading')}</em>
    }

    const { xoaRegistration, xoaLicense, xosanSrs } = this.props

    return (
      <Container>
        <Row className='mb-1'>
          <Col>
            <a
              className='btn btn-success'
              href='https://xen-orchestra.com/#!/member/purchaser'
              target='_blank'
            >
              <Icon icon='add' /> {_('newLicense')}
            </a>
            <ActionButton
              btnStyle='primary'
              className='ml-1'
              icon='refresh'
              handler={this._updateLicenses}
            >
              {_('refreshLicenses')}
            </ActionButton>
          </Col>
        </Row>
        <Row>
          <Col>
            <SortedTable
              collection={this._getProducts()}
              columns={PRODUCTS_COLUMNS}
              data-registeredEmail={xoaRegistration.email}
              data-xoaLicense={xoaLicense}
              data-xosanSrs={xosanSrs}
              stateUrlParam='s'
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <h2>
              XOSAN
              <a
                className='btn btn-secondary ml-1'
                href='https://xen-orchestra.com/#!/xosan-home'
                target='_blank'
              >
                <Icon icon='bug' /> {_('productSupport')}
              </a>
            </h2>
            <Xosan
              xosanLicenses={this.state.xosan}
              xosanTrialLicenses={this.state['xosan.trial']}
              updateLicenses={this._updateLicenses}
            />
          </Col>
        </Row>
      </Container>
    )
  }
}
