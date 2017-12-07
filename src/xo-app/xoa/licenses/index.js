import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Link from 'link'
import React from 'react'
import renderXoItem from 'render-xo-item'
import SortedTable from 'sorted-table'
import { Container, Row, Col } from 'grid'
import { createSelector, createGetObjectsOfType } from 'selectors'
import { forEach } from 'lodash'
import { addSubscriptions, connectStore, Time } from 'utils'
import { subscribePlugins, getLicenses } from 'xo'
import { get } from 'xo-defined'

import Xosan from './xosan'

const openNewLicense = () => {
  window.open('https://xen-orchestra.com/#!/member/purchaser')
}

const openSupport = () => {
  window.open('https://xen-orchestra.com/#!/xosan-home/')
}

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
      expires !== undefined ? <Time timestamp={expires} /> : '-',
    sortCriteria: 'expires',
    sortOrder: 'desc',
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

  return () => <Link to={`srs/${sr.id}`}>{renderXoItem(sr)}</Link>
}

@connectStore({
  xosanSrs: createGetObjectsOfType('SR').filter([
    ({ SR_type }) => SR_type === 'xosan', // eslint-disable-line camelcase
  ]),
  xoaRegistration: state => state.xoaRegisterState,
})
@addSubscriptions(() => ({
  plugins: subscribePlugins,
}))
export default class Licenses extends Component {
  constructor () {
    super()

    this.componentDidMount = this._updateLicenses
  }

  _updateLicenses = () =>
    Promise.all([getLicenses('xosan'), getLicenses('xosan.trial')])
      .then(([xosanLicenses, xosanTrialLicenses]) => {
        this.setState({
          xosanLicenses,
          xosanTrialLicenses,
          licenseError: undefined,
        })
      })
      .catch(error => {
        this.setState({ licenseError: error })
      })

  _getProducts = createSelector(
    () => this.state.xosanLicenses,
    () => this.props.xosanSrs,
    (xosanLicenses, xosanSrs) => {
      const products = []
      if (get(() => xosanLicenses.state) === 'register-needed') {
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
      return (
        <span>
          <em>{_('licensesUnregisteredDisclaimer')}</em>{' '}
          <Link to='xoa/update'>{_('registerNow')}</Link>
        </span>
      )
    }

    if (this.state.licenseError !== undefined) {
      return <span className='text-danger'>{_('xosanGetLicensesError')}</span>
    }

    if (
      this.state.xosanLicenses === undefined &&
      this.state.xosanTrialLicenses === undefined
    ) {
      return <em>{_('statusLoading')}</em>
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
              {_('newLicense')}
            </ActionButton>
            <ActionButton
              btnStyle='primary'
              className='ml-1'
              icon='refresh'
              handler={this._updateLicenses}
            >
              {_('refreshLicenses')}
            </ActionButton>
            <ActionButton className='ml-1' handler={openSupport} icon='bug'>
              {_('productSupport')}
            </ActionButton>
          </Col>
        </Row>
        <Row>
          <Col>
            <SortedTable
              collection={this._getProducts()}
              columns={PRODUCTS_COLUMNS}
              userData={{
                registeredEmail: this.props.xoaRegistration.email,
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <h2>XOSAN</h2>
            <Xosan
              xosanTrialLicenses={this.state.xosanTrialLicenses}
              updateLicenses={this._updateLicenses}
            />
          </Col>
        </Row>
      </Container>
    )
  }
}
