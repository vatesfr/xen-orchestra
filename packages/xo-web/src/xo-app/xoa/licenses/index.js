import _ from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Component from 'base-component'
import CopyToClipboard from 'react-copy-to-clipboard'
import decorate from 'apply-decorators'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import renderXoItem, { Host, Proxy } from 'render-xo-item'
import SortedTable from 'sorted-table'
import { addSubscriptions, adminOnly, connectStore, ShortDate } from 'utils'
import { CURRENT, productId2Plan, getXoaPlan } from 'xoa-plans'
import { Container, Row, Col } from 'grid'
import { createSelector, createGetObjectsOfType } from 'selectors'
import { find, forEach, groupBy } from 'lodash'
import { get } from '@xen-orchestra/defined'
import { getLicenses, selfBindLicense, subscribePlugins, subscribeProxies, subscribeSelfLicenses } from 'xo'

import Proxies from './proxies'
import Xostor from './xostor'

// -----------------------------------------------------------------------------

const CopyToClipboardButton = ({ value }) => (
  <CopyToClipboard text={value}>
    <Button size='small'>
      <Icon icon='clipboard' />
    </Button>
  </CopyToClipboard>
)

// -----------------------------------------------------------------------------

const ProxyLicense = decorate([
  addSubscriptions(({ license }) => ({
    proxy: cb => subscribeProxies(proxies => cb(license.vmId && proxies.find(({ vmUuid }) => vmUuid === license.vmId))),
  })),
  ({ license, proxy }) =>
    license.vmId === undefined ? (
      _('licenseNotBoundProxy')
    ) : (
      <span>
        {proxy !== undefined ? <Proxy id={proxy.id} link newTab /> : _('licenseBoundUnknownProxy')}{' '}
        <CopyToClipboardButton value={license.vmId} />
      </span>
    ),
])

const LicenseManager = ({ item, userData }) => {
  const { type } = item

  if (type === 'xosan') {
    const { srId } = item

    if (srId === undefined) {
      return _('licenseNotBoundXosan')
    }

    const sr = userData.xosanSrs[srId]
    return (
      <span>
        {sr === undefined ? _('licenseBoundUnknownXosan') : <Link to={`srs/${sr.id}`}>{renderXoItem(sr)}</Link>}{' '}
        <CopyToClipboardButton value={srId} />
      </span>
    )
  }

  if (type === 'xoa') {
    const { id, xoaId, productId } = item
    const { selfLicenses } = userData

    if (Array.isArray(selfLicenses)) {
      if (selfLicenses.some(license => license.id === id)) {
        return (
          <span>
            {_('licenseBoundToThisXoa')}{' '}
            {productId2Plan[productId] !== CURRENT.value && <span className='text-muted'>({_('notInstalled')})</span>}{' '}
            <CopyToClipboardButton value={xoaId} />
          </span>
        )
      }
    }

    if (xoaId === undefined) {
      return (
        <ActionButton
          btnStyle='success'
          data-id={item.id}
          data-plan={item.product}
          handler={selfBindLicense}
          icon='unlock'
        >
          {_('bindXoaLicense')}
        </ActionButton>
      )
    }

    return (
      <span>
        {_('licenseBoundToOtherXoa')} <CopyToClipboardButton value={xoaId} />
        <br />
        <ActionButton
          btnStyle='danger'
          data-id={item.id}
          data-plan={item.product}
          data-oldXoaId={item.xoaId}
          handler={selfBindLicense}
          icon='unlock'
        >
          {_('rebindXoaLicense')}
        </ActionButton>
      </span>
    )
  }

  if (type === 'proxy') {
    return <ProxyLicense license={item} />
  }

  if (type === 'xcpng' || type === 'xostor') {
    if (item.hostId !== undefined) {
      return (
        <span>
          <Host id={item.hostId} link newTab /> <CopyToClipboardButton value={item.hostId} />
        </span>
      )
    }
  }

  console.warn( `encountered unsupported license type ${type}`)
  return null
}

// -----------------------------------------------------------------------------

const PRODUCTS_COLUMNS = [
  {
    name: _('licenseProduct'),
    itemRenderer: ({ product, id }) => (
      <span>
        {product} <span className='text-muted'>({id.slice(-4)})</span> <CopyToClipboardButton value={id} />
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
    itemRenderer: ({ expires }) => (expires !== undefined ? <ShortDate timestamp={+expires} /> : '-'),
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
  selfLicenses: subscribeSelfLicenses,
}))
export default class Licenses extends Component {
  constructor() {
    super()

    this.componentDidMount = this._updateLicenses
  }

  _updateLicenses = () => {
    this.setState({ licenseError: undefined })

    return getLicenses()
      .then(licenses => {
        const { proxy, xcpng, xoa, xosan, xostor } = groupBy(licenses, license => {
          for (const productType of license.productTypes) {
            if (productType === 'xo') {
              return 'xoa'
            }
            if (productType === 'xosan') {
              return 'xosan'
            }
            if (productType === 'xoproxy') {
              return 'proxy'
            }
            if (productType === 'xcpng') {
              return 'xcpng'
            }
            if (productType === 'xostor') {
              return 'xostor'
            }
          }
          return 'other'
        })
        this.setState({
          licenses: {
            proxy,
            xcpng,
            xoa,
            xosan,
            xostor,
          },
        })
      })
      .catch(error => {
        this.setState({ licenseError: error })
      })
  }

  _getProducts = createSelector(
    () => this.state.licenses,
    licenses => {
      if (get(() => licenses.xosan.state) === 'register-needed') {
        // Should not happen
        return
      }

      const now = Date.now()
      const products = []

      // --- XOSAN ---
      forEach(licenses.xosan, license => {
        // When `expires` is undefined, the license isn't expired
        if (!(license.expires < now) && license.productId === 'xosan') {
          products.push({
            buyer: license.buyer,
            expires: license.expires,
            id: license.id,
            product: 'XOSAN',
            productId: license.productId,
            srId: license.boundObjectId,
            type: 'xosan',
          })
        }
      })

      // --- XOA ---
      forEach(licenses.xoa, license => {
        // When `expires` is undefined, the license isn't expired
        if (!(license.expires < now)) {
          products.push({
            buyer: license.buyer,
            expires: license.expires,
            id: license.id,
            product: 'XOA ' + getXoaPlan(productId2Plan[license.productId]).name,
            productId: license.productId,
            type: 'xoa',
            xoaId: license.boundObjectId,
          })
        }
      })

      // --- proxy ---
      forEach(licenses.proxy, license => {
        // When `expires` is undefined, the license isn't expired
        if (!(license.expires < now)) {
          products.push({
            buyer: license.buyer,
            expires: license.expires,
            id: license.id,
            product: _('proxy'),
            type: 'proxy',
            vmId: license.boundObjectId,
          })
        }
      })

      // --- xcpng
      forEach(licenses.xcpng, license => {
        // When `expires` is undefined, the license isn't expired
        if (!(license.expires < now)) {
          products.push({
            buyer: license.buyer,
            expires: license.expires,
            id: license.id,
            product: 'XCP-ng',
            type: 'xcpng',
            hostId: license.boundObjectId,
          })
        }
      })

      // --- XOSTOR ---
      forEach(licenses.xostor, license => {
        // When `expires` is undefined, the license isn't expired
        if (!(license.expires < now)) {
          products.push({
            buyer: license.buyer,
            expires: license.expires,
            id: license.id,
            product: 'XOSTOR',
            type: 'xostor',
            hostId: license.boundObjectId,
          })
        }
      })

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
          <em>{_('licensesUnregisteredDisclaimer')}</em> <Link to='xoa/update'>{_('registerNow')}</Link>
        </span>
      )
    }

    const missingXoaPlugin = this._getMissingXoaPlugin()
    if (missingXoaPlugin !== undefined) {
      return <em>{missingXoaPlugin}</em>
    }

    if (this.state.licenseError !== undefined) {
      return <span className='text-danger'>{_('getLicensesError')}</span>
    }

    if (this.state.licenses === undefined) {
      return <em>{_('statusLoading')}</em>
    }

    const { xoaRegistration, selfLicenses, xosanSrs } = this.props

    return (
      <Container>
        <Row className='mb-1'>
          <Col>
            <a
              className='btn btn-success'
              href='https://xen-orchestra.com/#!/member/purchaser'
              target='_blank'
              rel='noopener noreferrer'
            >
              <Icon icon='add' /> {_('newLicense')}
            </a>
            <ActionButton btnStyle='primary' className='ml-1' icon='refresh' handler={this._updateLicenses}>
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
              data-selfLicenses={selfLicenses}
              data-xosanSrs={xosanSrs}
              stateUrlParam='s'
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <h2>{_('xostor')}</h2>
            <Xostor xostorLicenses={this.state.licenses.xostor} updateLicenses={this._updateLicenses} />
          </Col>
        </Row>
        <Row>
          <Col>
            <h2>{_('proxies')}</h2>
            <Proxies proxyLicenses={this.state.licenses.proxy} updateLicenses={this._updateLicenses} />
          </Col>
        </Row>
        <Row>
          <Col>
            <h2>{_('xcpNg')}</h2>
            <Link to='home?t=pool' className='text-info'>
              <Icon icon='info' /> <i>{_('xcpngLicensesBindingAvancedView')}</i>
            </Link>
          </Col>
        </Row>
      </Container>
    )
  }
}
