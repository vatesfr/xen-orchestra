import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import Page from '../page'
import React from 'react'
import { getUser } from 'selectors'
import { compareCommits, getMasterCommit, serverVersion } from 'xo'
import { Container, Row, Col } from 'grid'
import { connectStore, getXoaPlan } from 'utils'

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
  async componentWillMount() {
    serverVersion.then(serverVersion => {
      this.setState({ serverVersion })
    })

    if (process.env.XOA_PLAN > 4 && COMMIT_ID !== '') {
      try {
        const commit = await getMasterCommit()
        const isOnLatest = commit.sha === COMMIT_ID
        const diff = {
          nAhead: 0,
          nBehind: 0,
        }
        if (!isOnLatest) {
          try {
            const { ahead_by, behind_by } = await compareCommits(commit.sha, COMMIT_ID)
            diff.nAhead = ahead_by
            diff.nBehind = behind_by
          } catch (err) {
            console.error(err)
            diff.nBehind = 'unknown'
          }
        }

        this.setState({
          commit: {
            isOnLatest,
            master: commit,
            diffWithMaster: diff,
            fetched: true,
          },
        })
      } catch (err) {
        console.error(err)
        this.setState({
          commit: {
            fetched: false,
          },
        })
      }
    }
  }
  render() {
    const { user } = this.props
    const { commit } = this.state
    const isAdmin = user && user.permission === 'admin'

    return (
      <Page header={HEADER} title='aboutPage' formatTitle>
        <Container className='text-xs-center'>
          {isAdmin && [
            process.env.XOA_PLAN > 4 && COMMIT_ID !== '' && (
              <Col>
                <Row key='0'>
                  <Col mediumSize={6}>
                    <Icon icon='git' size={4} />
                    <h4>
                      Xen Orchestra, commit{' '}
                      <a
                        href={'https://github.com/vatesfr/xen-orchestra/commit/' + COMMIT_ID}
                        target='_blank'
                        rel='noreferrer'
                      >
                        {COMMIT_ID.slice(0, 5)}
                      </a>
                    </h4>
                  </Col>
                  <Col mediumSize={6} className={commit?.fetched === false ? 'text-warning' : ''}>
                    <Icon icon='git' size={4} />
                    <h4>
                      {commit === undefined ? (
                        _('statusLoading')
                      ) : commit.fetched ? (
                        <span>
                          Master, commit{' '}
                          <a href={commit.master.html_url} target='_blank' rel='noreferrer'>
                            {commit.master.sha.slice(0, 5)}
                          </a>
                        </span>
                      ) : (
                        _('failedToFetchLatestMasterCommit')
                      )}
                    </h4>
                  </Col>
                </Row>
                {commit?.fetched && (
                  <Row className={`mt-1 ${commit.isOnLatest ? '' : 'text-warning '}`}>
                    <h4>
                      {commit.isOnLatest ? (
                        <span>
                          {_('xoUpToDate')} <Icon icon='check' color='text-success' />
                        </span>
                      ) : (
                        <span>
                          {_('xoFromSourceNotUpToDate', {
                            nBehind: commit.diffWithMaster.nBehind,
                            nAhead: commit.diffWithMaster.nAhead,
                          })}{' '}
                          <Icon icon='alarm' color='text-warning' />
                        </span>
                      )}
                    </h4>
                  </Row>
                )}
              </Col>
            ),
          ]}
          {process.env.XOA_PLAN > 4 ? (
            <div>
              <Row>
                <Col>
                  <h2 className='text-info'>{_('productionUse')}</h2>
                  <h4 className='text-info'>
                    {_('getSupport', {
                      website: (
                        <a
                          href='https://vates.tech/pricing-and-support/?pk_campaign=xoa_source_upgrade&pk_kwd=about'
                          target='_blank'
                          rel='noreferrer'
                        >
                          https://xen-orchestra.com
                        </a>
                      ),
                    })}
                  </h4>
                </Col>
              </Row>
              <Row>
                <Col mediumSize={6}>
                  <a href='https://github.com/vatesfr/xen-orchestra/issues/new/choose' target='_blank' rel='noreferrer'>
                    <Icon icon='bug' size={4} />
                    <h4>{_('bugTracker')}</h4>
                  </a>
                  <p className='text-muted'>{_('bugTrackerText')}</p>
                </Col>
                <Col mediumSize={6}>
                  <a href='https://xcp-ng.org/forum/category/12/xen-orchestra' target='_blank' rel='noreferrer'>
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
                  <a href='https://xen-orchestra.com/' target='_blank' rel='noreferrer'>
                    <Icon icon='help' size={4} />
                    <h4>{_('issues')}</h4>
                  </a>
                  <p className='text-muted'>{_('issuesText')}</p>
                </Col>
                <Col mediumSize={6}>
                  <a href='https://xen-orchestra.com/docs' target='_blank' rel='noreferrer'>
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
                  <a href='https://xen-orchestra.com/#!/member/products' target='_blank' rel='noreferrer'>
                    {_('xoAccount')}
                  </a>
                </Col>
              </Row>
              <Row>
                <Col mediumSize={6}>
                  <a href='https://xen-orchestra.com/#!/member/support' target='_blank' rel='noreferrer'>
                    <Icon icon='help' size={4} />
                    <h4>{_('openTicket')}</h4>
                  </a>
                  <p className='text-muted'>{_('openTicketText')}</p>
                </Col>
                <Col mediumSize={6}>
                  <a href='https://xen-orchestra.com/docs' target='_blank' rel='noreferrer'>
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
