import _ from 'intl'
import Component from 'base-component'
import Copiable from 'copiable'
import Icon from 'icon'
import Link from 'link'
import Page from '../page'
import React from 'react'
import { getUser } from 'selectors'
import { serverVersion } from 'xo'
import { Container, Row, Col } from 'grid'
import { connectStore, getXoaPlan } from 'utils'

import pkg from '../../../package'

const COMMIT_ID = process.env.GIT_HEAD

const HEADER = (
  <Container>
    <Row>
      <Col mediumSize={12}>
        <h2>
          <Icon icon='menu-about' /> {_('aboutXoaPlan', { xoaPlan: getXoaPlan() })}
        </h2>
      </Col>
    </Row>
  </Container>
)

@connectStore(() => ({
  user: getUser,
}))
export default class About extends Component {
  componentWillMount() {
    serverVersion.then(serverVersion => {
      this.setState({ serverVersion })
    })
  }
  render() {
    const { user } = this.props
    const isAdmin = user && user.permission === 'admin'

    return (
      <Page header={HEADER} title='aboutPage' formatTitle>
        <Container className='text-xs-center'>
          {isAdmin && [
            process.env.XOA_PLAN > 4 && COMMIT_ID !== '' && (
              <Row key='0'>
                <Col>
                  <Icon icon='git' size={4} />
                  <h4>
                    Xen Orchestra, commit{' '}
                    <a href={'https://github.com/vatesfr/xen-orchestra/commit/' + COMMIT_ID}>{COMMIT_ID.slice(0, 5)}</a>
                  </h4>
                </Col>
              </Row>
            ),
            <Row key='1'>
              <Col mediumSize={6}>
                <Icon icon='host' size={4} />
                <Copiable tagName='h4' data={`xo-server ${this.state.serverVersion}`}>
                  xo-server {this.state.serverVersion || 'unknown'}
                </Copiable>
                <p className='text-muted'>{_('xenOrchestraServer')}</p>
              </Col>
              <Col mediumSize={6}>
                <Icon icon='vm' size={4} />
                <Copiable tagName='h4' data={`xo-web ${pkg.version}`}>
                  xo-web {pkg.version}
                </Copiable>
                <p className='text-muted'>{_('xenOrchestraWeb')}</p>
              </Col>
            </Row>,
          ]}
          {process.env.XOA_PLAN > 4 ? (
            <div>
              <Row>
                <Col>
                  <h2 className='text-info'>{_('productionUse')}</h2>
                  <h4 className='text-info'>
                    {_('getSupport', {
                      website: (
                        <a href='https://xen-orchestra.com/#!/pricing?pk_campaign=xoa_source_upgrade&pk_kwd=about'>
                          https://xen-orchestra.com
                        </a>
                      ),
                    })}
                  </h4>
                </Col>
              </Row>
              <Row>
                <Col mediumSize={6}>
                  <a href='https://github.com/vatesfr/xen-orchestra/issues/new/choose'>
                    <Icon icon='bug' size={4} />
                    <h4>{_('bugTracker')}</h4>
                  </a>
                  <p className='text-muted'>{_('bugTrackerText')}</p>
                </Col>
                <Col mediumSize={6}>
                  <a href='https://xcp-ng.org/forum/category/12/xen-orchestra'>
                    <Icon icon='group' size={4} />
                    <h4>{_('community')}</h4>
                  </a>
                  <p className='text-muted'>{_('communityText')}</p>
                </Col>
              </Row>
            </div>
          ) : +process.env.XOA_PLAN === 1 ? (
            <div>
              <Row>
                <Col>
                  <Link to='/xoa/update'>
                    <h2>{_('freeTrial')}</h2>
                    {_('freeTrialNow')}
                  </Link>
                </Col>
              </Row>
              <Row>
                <Col mediumSize={6}>
                  <a href='https://xen-orchestra.com/'>
                    <Icon icon='help' size={4} />
                    <h4>{_('issues')}</h4>
                  </a>
                  <p className='text-muted'>{_('issuesText')}</p>
                </Col>
                <Col mediumSize={6}>
                  <a href='https://xen-orchestra.com/docs'>
                    <Icon icon='user' size={4} />
                    <h4>{_('documentation')}</h4>
                  </a>
                  <p className='text-muted'>{_('documentationText')}</p>
                </Col>
              </Row>
            </div>
          ) : (
            <div>
              <Row>
                <Col>
                  <h2 className='text-success'>{_('proSupportIncluded')}</h2>
                  <a href='https://xen-orchestra.com/#!/member/products'>{_('xoAccount')}</a>
                </Col>
              </Row>
              <Row>
                <Col mediumSize={6}>
                  <a href='https://xen-orchestra.com/#!/member/support'>
                    <Icon icon='help' size={4} />
                    <h4>{_('openTicket')}</h4>
                  </a>
                  <p className='text-muted'>{_('openTicketText')}</p>
                </Col>
                <Col mediumSize={6}>
                  <a href='https://xen-orchestra.com/docs'>
                    <Icon icon='user' size={4} />
                    <h4>{_('documentation')}</h4>
                  </a>
                  <p className='text-muted'>{_('documentationText')}</p>
                </Col>
              </Row>
            </div>
          )}
        </Container>
      </Page>
    )
  }
}
