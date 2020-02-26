import _ from 'intl'
import Icon from 'icon'
import Page from '../page'
import React from 'react'
import { adminOnly, routes } from 'utils'
import { Container, Row, Col } from 'grid'
import { NavLink, NavTabs } from 'nav'

import Acls from './acls'
import Audit from './audit'
import CloudConfigs from './cloud-configs'
import Config from './config'
import Groups from './groups'
import Ips from './ips'
import Logs from './logs'
import Plugins from './plugins'
import Remotes from './remotes'
import Servers from './servers'
import Users from './users'

const HEADER = (
  <Container>
    <Row>
      <Col mediumSize={3}>
        <h2>
          <Icon icon='menu-settings' /> {_('settingsPage')}
        </h2>
      </Col>
      <Col mediumSize={9}>
        <NavTabs className='pull-right'>
          <NavLink to='/settings/servers'>
            <Icon icon='menu-settings-servers' /> {_('settingsServersPage')}
          </NavLink>
          <NavLink to='/settings/users'>
            <Icon icon='menu-settings-users' /> {_('settingsUsersPage')}
          </NavLink>
          <NavLink to='/settings/groups'>
            <Icon icon='menu-settings-groups' /> {_('settingsGroupsPage')}
          </NavLink>
          <NavLink to='/settings/acls'>
            <Icon icon='menu-settings-acls' /> {_('settingsAclsPage')}
          </NavLink>
          <NavLink to='/settings/remotes'>
            <Icon icon='menu-backup-remotes' /> {_('backupRemotesPage')}
          </NavLink>
          <NavLink to='/settings/plugins'>
            <Icon icon='menu-settings-plugins' /> {_('settingsPluginsPage')}
          </NavLink>
          <NavLink to='/settings/logs'>
            <Icon icon='menu-settings-logs' /> {_('settingsLogsPage')}
          </NavLink>
          <NavLink to='/settings/audit'>
            <Icon icon='audit' /> {_('settingsAuditPage')}
          </NavLink>
          <NavLink to='/settings/ips'>
            <Icon icon='ip' /> {_('settingsIpsPage')}
          </NavLink>
          <NavLink to='/settings/cloud-configs'>
            <Icon icon='template' /> {_('settingsCloudConfigsPage')}
          </NavLink>
          <NavLink to='/settings/config'>
            <Icon icon='menu-settings-config' /> {_('settingsConfigPage')}
          </NavLink>
        </NavTabs>
      </Col>
    </Row>
  </Container>
)

const Settings = routes('servers', {
  acls: Acls,
  audit: Audit,
  'cloud-configs': CloudConfigs,
  config: Config,
  groups: Groups,
  ips: Ips,
  logs: Logs,
  plugins: Plugins,
  remotes: Remotes,
  servers: Servers,
  users: Users,
})(
  adminOnly(({ children }) => (
    <Page header={HEADER} title='settingsPage' formatTitle>
      {children}
    </Page>
  ))
)

export default Settings
