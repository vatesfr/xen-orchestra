import forEach from 'lodash/forEach'
import frLocaleData from 'react-intl/locale-data/fr'
import isFunction from 'lodash/isFunction'
import isString from 'lodash/isString'
import moment from 'moment'
import React, {
  Component,
  PropTypes
} from 'react'
import {
  connect
} from 'react-redux'
import {
  addLocaleData,
  FormattedMessage,
  IntlProvider as IntlProvider_
} from 'react-intl'

import 'moment/locale/fr' // See bug mentionned in // http://momentjs.com/docs/#/use-it/browserify/

// ===================================================================

export const messages = {
  ok: {
    defaultMessage: 'OK'
  },
  cancel: {
    defaultMessage: 'Cancel'
  },
  editableLongClickPlaceholder: {
    defaultMessage: 'Long click to edit'
  },
  editableClickPlaceholder: {
    defaultMessage: 'Click to edit'
  },

  // ----- Titles -----
  homePage: {
    defaultMessage: 'Home'
  },
  dashboardPage: {
    defaultMessage: 'Dashboard'
  },
  overviewDashboardPage: {
    defaultMessage: 'Overview'
  },
  overviewVisualizationDashboardPage: {
    defaultMessage: 'Visualizations'
  },
  overviewStatsDashboardPage: {
    defaultMessage: 'Statistics'
  },
  overviewHealthDashboardPage: {
    defaultMessage: 'Health'
  },
  selfServicePage: {
    defaultMessage: 'Self service'
  },
  selfServiceDashboardPage: {
    defaultMessage: 'Dashboard'
  },
  selfServiceAdminPage: {
    defaultMessage: 'Administration'
  },
  backupPage: {
    defaultMessage: 'Backup'
  },
  updatePage: {
    defaultMessage: 'Updates'
  },
  settingsPage: {
    defaultMessage: 'Settings'
  },
  settingsServersPage: {
    defaultMessage: 'Servers'
  },
  settingsUsersPage: {
    defaultMessage: 'Users'
  },
  settingsGroupsPage: {
    defaultMessage: 'Groups'
  },
  settingsAclsPage: {
    defaultMessage: 'ACLs'
  },
  settingsPluginsPage: {
    defaultMessage: 'Plugins'
  },
  aboutPage: {
    defaultMessage: 'About'
  },
  newMenu: {
    defaultMessage: 'New'
  },
  taskMenu: {
    defaultMessage: 'Tasks'
  },
  newVmPage: {
    defaultMessage: 'VM'
  },
  newSrPage: {
    defaultMessage: 'Storage'
  },
  newServerPage: {
    defaultMessage: 'Server'
  },
  newImport: {
    defaultMessage: 'Import'
  },
  backupOverviewPage: {
    defaultMessage: 'Overview'
  },
  backupNewPage: {
    defaultMessage: 'New'
  },
  backupRemotesPage: {
    defaultMessage: 'Remotes'
  },
  backupRestorePage: {
    defaultMessage: 'Restore'
  },
  schedule: {
    defaultMessage: 'Schedule'
  },
  newVmBackup: {
    defaultMessage: 'New VM backup'
  },
  backup: {
    defaultMessage: 'Backup'
  },
  rollingSnapshot: {
    defaultMessage: 'Rolling Snapshot'
  },
  deltaBackup: {
    defaultMessage: 'Delta Backup'
  },
  disasterRecovery: {
    defaultMessage: 'Disaster Recovery'
  },
  continuousReplication: {
    defaultMessage: 'Continuous Replication'
  },

  // ----- Languages -----
  enLang: {
    defaultMessage: 'EN'
  },
  frLang: {
    defaultMessage: 'FR'
  },

  // ----- Sign in/out -----
  usernameLabel: {
    defaultMessage: 'Username:'
  },
  passwordLabel: {
    defaultMessage: 'Password:'
  },
  signInButton: {
    defaultMessage: 'Sign in'
  },
  signOut: {
    defaultMessage: 'Sign out'
  },

  // ----- Home view ------
  homeFilters: {
    defaultMessage: 'Filters'
  },
  homeTypePool: {
    defaultMessage: 'Pool'
  },
  homeTypeHost: {
    defaultMessage: 'Host'
  },
  homeTypeVm: {
    defaultMessage: 'VM'
  },
  homeTypeSr: {
    defaultMessage: 'SR'
  },
  homeTypeVdi: {
    defaultMessage: 'VDI'
  },
  homeSort: {
    defaultMessage: 'Sort'
  },
  homeAllPools: {
    defaultMessage: 'Pools'
  },
  homeAllHosts: {
    defaultMessage: 'Hosts'
  },
  homeAllTags: {
    defaultMessage: 'Tags'
  },
  homeNewVm: {
    defaultMessage: 'New VM'
  },
  homeFilterRunningVms: {
    defaultMessage: 'Running VMs'
  },
  homeFilterNonRunningVms: {
    defaultMessage: 'Non running VMs'
  },
  homeFilterPendingVms: {
    defaultMessage: 'Pending VMs'
  },
  homeFilterHvmGuests: {
    defaultMessage: 'HVM guests'
  },
  homeFilterTags: {
    defaultMessage: 'Tags'
  },
  homeSortBy: {
    defaultMessage: 'Sort by'
  },
  homeSortByName: {
    defaultMessage: 'Name'
  },
  homeSortByPowerstate: {
    defaultMessage: 'Power state'
  },
  homeSortByRAM: {
    defaultMessage: 'RAM'
  },
  homeSortByvCPUs: {
    defaultMessage: 'vCPUs'
  },
  homeDisplayedVms: {
    defaultMessage: '{displayed, number}x {vmIcon} (on {total, number})'
  },
  homeSelectedVms: {
    defaultMessage: '{selected, number}x {vmIcon} selected (on {total, number})'
  },
  homeMore: {
    defaultMessage: 'More'
  },

  // ----- Forms -----
  add: {
    defaultMessage: 'Add'
  },
  remove: {
    defaultMessage: 'Remove'
  },
  preview: {
    defaultMessage: 'Aperçu'
  },
  item: {
    defaultMessage: 'Item'
  },
  noSelectedValue: {
    defaultMessage: 'No selected value'
  },
  selectSubjects: {
    defaultMessage: 'Choose user(s) and/or group(s)'
  },
  selectHosts: {
    defaultMessage: 'Select Host(s)...'
  },
  selectNetworks: {
    defaultMessage: 'Select Network(s)...'
  },
  selectPools: {
    defaultMessage: 'Select Pool(s)...'
  },
  selectRemotes: {
    defaultMessage: 'Select Remote(s)...'
  },
  selectSrs: {
    defaultMessage: 'Select SR(s)...'
  },
  selectVms: {
    defaultMessage: 'Select VM(s)...'
  },
  selectVmTemplates: {
    defaultMessage: 'Select VM template(s)...'
  },
  selectTags: {
    defaultMessage: 'Select tag(s)...'
  },
  fillRequiredInformations: {
    defaultMessage: 'Fill required informations.'
  },
  fillOptionalInformations: {
    defaultMessage: 'Fill informations (optional)'
  },
  selectTableReset: {
    defaultMessage: 'Reset'
  },

  // --- Dates/Scheduler ---

  schedulingMonth: {
    defaultMessage: 'Month'
  },
  schedulingEveryMonth: {
    defaultMessage: 'Every month'
  },
  schedulingEachSelectedMonth: {
    defaultMessage: 'Each selected month'
  },
  schedulingMonthDay: {
    defaultMessage: 'Day of the month'
  },
  schedulingEveryMonthDay: {
    defaultMessage: 'Every day'
  },
  schedulingEachSelectedMonthDay: {
    defaultMessage: 'Each selected day'
  },
  schedulingWeekDay: {
    defaultMessage: 'Day of the week'
  },
  schedulingEveryWeekDay: {
    defaultMessage: 'Every day'
  },
  schedulingEachSelectedWeekDay: {
    defaultMessage: 'Each selected day'
  },
  schedulingHour: {
    defaultMessage: 'Hour'
  },
  schedulingEveryHour: {
    defaultMessage: 'Every hour'
  },
  schedulingEveryNHour: {
    defaultMessage: 'Every N hour'
  },
  schedulingEachSelectedHour: {
    defaultMessage: 'Each selected hour'
  },
  schedulingMinute: {
    defaultMessage: 'Minute'
  },
  schedulingEveryMinute: {
    defaultMessage: 'Every minute'
  },
  schedulingEveryNMinute: {
    defaultMessage: 'Every N minute'
  },
  schedulingEachSelectedMinute: {
    defaultMessage: 'Each selected minute'
  },
  schedulingReset: {
    defaultMessage: 'Reset'
  },
  unknownSchedule: {
    defaultMessage: 'Unknown'
  },
  job: {
    defaultMessage: 'Job'
  },
  jobTag: {
    defaultMessage: 'Tag'
  },
  jobScheduling: {
    defaultMessage: 'Scheduling'
  },
  jobState: {
    defaultMessage: 'State'
  },
  runJob: {
    defaultMessage: 'Run job'
  },
  runJobVerbose: {
    defaultMessage: 'One shot running started. See overview for logs.'
  },
  jobStarted: {
    defaultMessage: 'Started'
  },
  jobFinished: {
    defaultMessage: 'Finished'
  },

  // ------ New backup -----
  newBackupSelection: {
    defaultMessage: 'Select your backup type:'
  },

  // ------ New Remote -----
  remoteList: {
    defaultMessage: 'Remote stores for backup'
  },
  newRemote: {
    defaultMessage: 'New File System Remote'
  },
  remoteTypeLocal: {
    defaultMessage: 'Local'
  },
  remoteTypeNfs: {
    defaultMessage: 'NFS'
  },
  remoteTypeSmb: {
    defaultMessage: 'SMB'
  },
  remoteType: {
    defaultMessage: 'Type'
  },

  // ------ New Storage -----
  newSrGeneral: {
    defaultMessage: 'General'
  },
  newSrTypeSelection: {
    defaultMessage: 'Select Strorage Type:'
  },
  newSrSettings: {
    defaultMessage: 'Settings'
  },
  newSrUsage: {
    defaultMessage: 'Storage Usage'
  },
  newSrSummary: {
    defaultMessage: 'Summary'
  },
  newSrHost: {
    defaultMessage: 'Host'
  },
  newSrType: {
    defaultMessage: 'Type'
  },
  newSrName: {
    defaultMessage: 'Name'
  },
  newSrDescription: {
    defaultMessage: 'Description'
  },
  newSrServer: {
    defaultMessage: 'Server'
  },
  newSrPath: {
    defaultMessage: 'Path'
  },
  newSrIqn: {
    defaultMessage: 'IQN'
  },
  newSrLun: {
    defaultMessage: 'LUN'
  },
  newSrAuth: {
    defaultMessage: 'with auth.'
  },
  newSrUsername: {
    defaultMessage: 'User Name'
  },
  newSrPassword: {
    defaultMessage: 'Password'
  },
  newSrDevice: {
    defaultMessage: 'Device'
  },
  newSrInUse: {
    defaultMessage: 'in use'
  },
  newSrSize: {
    defaultMessage: 'Size'
  },
  newSrCreate: {
    defaultMessage: 'Create'
  },

  // ----- Plugins ------
  autoloadPlugin: {
    defaultMessage: 'Auto-load at server start'
  },
  savePluginConfiguration: {
    defaultMessage: 'Save configuration'
  },
  deletePluginConfiguration: {
    defaultMessage: 'Delete configuration'
  },
  pluginError: {
    defaultMessage: 'Plugin error'
  },
  unknownPluginError: {
    defaultMessage: 'Unknown error'
  },
  purgePluginConfiguration: {
    defaultMessage: 'Purge plugin configuration'
  },
  purgePluginConfigurationQuestion: {
    defaultMessage: 'Are you sure you want to purge this configuration ?'
  },
  editPluginConfiguration: {
    defaultMessage: 'Edit'
  },
  cancelPluginEdition: {
    defaultMessage: 'Cancel'
  },
  pluginConfigurationSuccess: {
    defaultMessage: 'Plugin configuration'
  },
  pluginConfigurationChanges: {
    defaultMessage: 'Plugin configuration successfully saved!'
  },

  // ----- VM actions ------
  startVmLabel: {
    defaultMessage: 'Start'
  },
  recoveryModeLabel: {
    defaultMessage: 'Recovery start'
  },
  suspendVmLabel: {
    defaultMessage: 'Suspend'
  },
  stopVmLabel: {
    defaultMessage: 'Stop'
  },
  forceShutdownVmLabel: {
    defaultMessage: 'Force shutdown'
  },
  rebootVmLabel: {
    defaultMessage: 'Reboot'
  },
  forceRebootVmLabel: {
    defaultMessage: 'Force reboot'
  },
  deleteVmLabel: {
    defaultMessage: 'Delete'
  },
  migrateVmLabel: {
    defaultMessage: 'Migrate'
  },
  snapshotVmLabel: {
    defaultMessage: 'Snapshot'
  },
  exportVmLabel: {
    defaultMessage: 'Export'
  },
  resumeVmLabel: {
    defaultMessage: 'Resume'
  },
  copyVmLabel: {
    defaultMessage: 'Copy'
  },
  cloneVmLabel: {
    defaultMessage: 'Clone'
  },
  fastCloneVmLabel: {
    defaultMessage: 'Fast clone'
  },
  convertVmToTemplateLabel: {
    defaultMessage: 'Convert to template'
  },
  vmConsoleLabel: {
    defaultMessage: 'Console'
  },

  // ----- SR tabs -----
  // ----- SR actions -----
  srRescan: {
    defaultMessage: 'Rescan all disks'
  },
  srReconnectAll: {
    defaultMessage: 'Connect to all hosts'
  },
  srDisconnectAll: {
    defaultMessage: 'Disconnect to all hosts'
  },
  srForget: {
    defaultMessage: 'Forget this SR'
  },
  srRemoveButton: {
    defaultMessage: 'Remove this SR'
  },
  srNoVdis: {
    defaultMessage: 'No VDIs in this storage'
  },
  // ----- Pool tabs -----
  hostsTabName: {
    defaultMessage: 'Hosts'
  },
  // ----- Pool advanced tab -----
  poolHaStatus: {
    defaultMessage: 'High Availability'
  },
  poolHaEnabled: {
    defaultMessage: 'Enabled'
  },
  poolHaDisabled: {
    defaultMessage: 'Disabled'
  },
  // ----- Pool host tab -----
  hostNameLabel: {
    defaultMessage: 'Name'
  },
  hostDescription: {
    defaultMessage: 'Description'
  },
  hostMemory: {
    defaultMessage: 'Memory'
  },
  noHost: {
    defaultMessage: 'No hosts'
  },
  // ----- Pool network tab -----
  poolNetworkNameLabel: {
    defaultMessage: 'Name'
  },
  poolNetworkDescription: {
    defaultMessage: 'Description'
  },
  poolNetworkPif: {
    defaultMessage: 'PIFs'
  },
  poolNoNetwork: {
    defaultMessage: 'No networks'
  },
  poolNetworkMTU: {
    defaultMessage: 'MTU'
  },
  poolNetworkPifAttached: {
    defaultMessage: 'Connected'
  },
  poolNetworkPifDetached: {
    defaultMessage: 'Disconnected'
  },
  // ----- Pool actions ------
  addSrLabel: {
    defaultMessage: 'Add SR'
  },
  addVmLabel: {
    defaultMessage: 'Add VM'
  },
  addHostLabel: {
    defaultMessage: 'Add Host'
  },
  disconnectServer: {
    defaultMessage: 'Disconnect'
  },

  // ----- Host actions ------
  startHostLabel: {
    defaultMessage: 'Start'
  },
  stopHostLabel: {
    defaultMessage: 'Stop'
  },
  enableHostLabel: {
    defaultMessage: 'Enable'
  },
  disableHostLabel: {
    defaultMessage: 'Disable'
  },
  restartHostAgent: {
    defaultMessage: 'Restart toolstack'
  },
  forceRebootHostLabel: {
    defaultMessage: 'Force reboot'
  },
  rebootHostLabel: {
    defaultMessage: 'Reboot'
  },
  emergencyModeLabel: {
    defaultMessage: 'Emergency mode'
  },
  // ----- Host tabs -----
  storageTabName: {
    defaultMessage: 'Storage'
  },
  patchesTabName: {
    defaultMessage: 'Patches'
  },
    // ----- host stat tab -----
  statLoad: {
    defaultMessage: 'Load average'
  },
    // ----- host advanced tab -----
  hardwareHostSettingsLabel: {
    defaultMessage: 'Hardware'
  },
  hostAddress: {
    defaultMessage: 'Address'
  },
  hostStatus: {
    defaultMessage: 'Status'
  },
  hostBuildNumber: {
    defaultMessage: 'Build number'
  },
  hostIscsiName: {
    defaultMessage: 'iSCSI name'
  },
  hostXenServerVersion: {
    defaultMessage: 'Version'
  },
  hostStatusEnabled: {
    defaultMessage: 'Enabled'
  },
  hostStatusDisabled: {
    defaultMessage: 'Disabled'
  },
  hostPowerOnMode: {
    defaultMessage: 'Power on mode'
  },
  hostStartedSince: {
    defaultMessage: 'Host uptime'
  },
  hostStackStartedSince: {
    defaultMessage: 'Toolstack uptime'
  },
  hostCpusModel: {
    defaultMessage: 'CPU model'
  },
  hostCpusNumber: {
    defaultMessage: 'Core (socket)'
  },
  hostManufacturerinfo: {
    defaultMessage: 'Manufacturer info'
  },
  hostBiosinfo: {
    defaultMessage: 'BIOS info'
  },
  licenseHostSettingsLabel: {
    defaultMessage: 'Licence'
  },
  hostLicenseType: {
    defaultMessage: 'Type'
  },
  hostLicenseSocket: {
    defaultMessage: 'Socket'
  },
  hostLicenseExpiry: {
    defaultMessage: 'Expiry'
  },
  // ----- Host net tabs -----
  networkCreateButton: {
    defaultMessage: 'Add a network'
  },
  pifDeviceLabel: {
    defaultMessage: 'Device'
  },
  pifNetworkLabel: {
    defaultMessage: 'Network'
  },
  pifVlanLabel: {
    defaultMessage: 'VLAN'
  },
  pifAddressLabel: {
    defaultMessage: 'Address'
  },
  pifMacLabel: {
    defaultMessage: 'MAC'
  },
  pifMtuLabel: {
    defaultMessage: 'MTU'
  },
  pifStatusLabel: {
    defaultMessage: 'Status'
  },
  pifStatusConnected: {
    defaultMessage: 'Connected'
  },
  pifStatusDisconnected: {
    defaultMessage: 'Disconnected'
  },
  pifNoInterface: {
    defaultMessage: 'No physical interface detected'
  },
  // ----- Host storage tabs -----
  addSrDeviceButton: {
    defaultMessage: 'Add a storage'
  },
  srNameLabel: {
    defaultMessage: 'Name'
  },
  srType: {
    defaultMessage: 'Type'
  },
  pdbStatus: {
    defaultMessage: 'Status'
  },
  pbdStatusConnected: {
    defaultMessage: 'Connected'
  },
  pbdStatusDisconnected: {
    defaultMessage: 'Disconnected'
  },
  srShared: {
    defaultMessage: 'Shared'
  },
  srNotShared: {
    defaultMessage: 'Not shared'
  },
  pbdNoSr: {
    defaultMessage: 'No storage detected'
  },
  // ----- Host patch tabs -----
  patchNameLabel: {
    defaultMessage: 'Name'
  },
  patchUpdateButton: {
    defaultMessage: 'Install all patches'
  },
  patchDescription: {
    defaultMessage: 'Description'
  },
  patchApplied: {
    defaultMessage: 'Release date'
  },
  patchSize: {
    defaultMessage: 'Size'
  },
  patchStatus: {
    defaultMessage: 'Status'
  },
  patchStatusApplied: {
    defaultMessage: 'Applied'
  },
  patchStatusNotApplied: {
    defaultMessage: 'Missing patches'
  },
  patchNothing: {
    defaultMessage: 'No patch detected'
  },
  patchReleaseDate: {
    defaultMessage: 'Release date'
  },
  patchGuidance: {
    defaultMessage: 'Guidance'
  },
  patchAction: {
    defaultMessage: 'Action'
  },
  hostInstalledPatches: {
    defaultMessage: 'Downloaded patches'
  },
  hostMissingPatches: {
    defaultMessage: 'Missing patches'
  },
  hostUpToDate: {
    defaultMessage: 'Host up-to-date!'
  },

  // ----- VM tabs -----
  generalTabName: {
    defaultMessage: 'General'
  },
  statsTabName: {
    defaultMessage: 'Stats'
  },
  consoleTabName: {
    defaultMessage: 'Console'
  },
  snapshotsTabName: {
    defaultMessage: 'Snapshots'
  },
  logsTabName: {
    defaultMessage: 'Logs'
  },
  advancedTabName: {
    defaultMessage: 'Advanced'
  },
  networkTabName: {
    defaultMessage: 'Network'
  },
  disksTabName: {
    defaultMessage: 'Disk{disks, plural, one {} other {s}}'
  },

  powerStateHalted: {
    defaultMessage: 'halted'
  },
  powerStateRunning: {
    defaultMessage: 'running'
  },
  powerStateSuspended: {
    defaultMessage: 'suspended'
  },

  // ----- VM home -----
  vmStatus: {
    defaultMessage: 'No Xen tools detected'
  },
  vmName: {
    defaultMessage: 'No IPv4 record'
  },
  vmDescription: {
    defaultMessage: 'No IP record'
  },
  vmSettings: {
    defaultMessage: 'Started {ago}'
  },
  vmCurrentStatus: {
    defaultMessage: 'Current status:'
  },
  vmNotRunning: {
    defaultMessage: 'Not running'
  },

  // ----- VM general tab -----
  noToolsDetected: {
    defaultMessage: 'No Xen tools detected'
  },
  noIpv4Record: {
    defaultMessage: 'No IPv4 record'
  },
  noIpRecord: {
    defaultMessage: 'No IP record'
  },
  started: {
    defaultMessage: 'Started {ago}'
  },
  paraVirtualizedMode: {
    defaultMessage: 'Paravirtualization (PV)'
  },
  hardwareVirtualizedMode: {
    defaultMessage: 'Hardware virtualization (HVM)'
  },

  // ----- VM stat tab -----
  statsCpu: {
    defaultMessage: 'CPU usage'
  },
  statsMemory: {
    defaultMessage: 'Memory usage'
  },
  statsNetwork: {
    defaultMessage: 'Network throughput'
  },
  statDisk: {
    defaultMessage: 'Disk throughput'
  },
  statLastTenMinutes: {
    defaultMessage: 'Last 10 minutes'
  },
  statLastTwoHours: {
    defaultMessage: 'Last 2 hours'
  },
  statLastWeek: {
    defaultMessage: 'Last week'
  },
  statLastYear: {
    defaultMessage: 'Last year'
  },

  // ----- VM console tab -----
  copyToClipboardLabel: {
    defaultMessage: 'Copy'
  },
  ctrlAltDelButtonLabel: {
    defaultMessage: 'Ctrl+Alt+Del'
  },
  tipLabel: {
    defaultMessage: 'Tip:'
  },
  tipConsoleLabel: {
    defaultMessage: 'non-US keyboard could have issues with console: switch your own layout to US.'
  },

  // ----- VM disk tab -----
  vdiAction: {
    defaultMessage: 'Action'
  },
  vdiAttachDeviceButton: {
    defaultMessage: 'Attach disk'
  },
  vbdCreateDeviceButton: {
    defaultMessage: 'New disk'
  },
  vdiBootOrder: {
    defaultMessage: 'Boot order'
  },
  vdiNameLabel: {
    defaultMessage: 'Name'
  },
  vdiNameDescription: {
    defaultMessage: 'Description'
  },
  vdiTags: {
    defaultMessage: 'Tags'
  },
  vdiSize: {
    defaultMessage: 'Size'
  },
  vdiSr: {
    defaultMessage: 'SR'
  },
  vdbBootableStatus: {
    defaultMessage: 'Boot flag'
  },
  vdbBootable: {
    defaultMessage: 'Bootable'
  },
  vdbNotBootable: {
    defaultMessage: 'Not bootable'
  },
  vdbStatus: {
    defaultMessage: 'Status'
  },
  vbdStatusConnected: {
    defaultMessage: 'Connected'
  },
  vbdStatusDisconnected: {
    defaultMessage: 'Disconnected'
  },
  vbdNoVbd: {
    defaultMessage: 'No disks'
  },

  // ----- VM network tab -----
  vifCreateDeviceButton: {
    defaultMessage: 'New device'
  },
  vifNoInterface: {
    defaultMessage: 'No interface'
  },
  vifDeviceLabel: {
    defaultMessage: 'Device'
  },
  vifMacLabel: {
    defaultMessage: 'MAC address'
  },
  vifMtuLabel: {
    defaultMessage: 'MTU'
  },
  vifNetworkLabel: {
    defaultMessage: 'Network'
  },
  vifStatusLabel: {
    defaultMessage: 'Status'
  },
  vifStatusConnected: {
    defaultMessage: 'Connected'
  },
  vifStatusDisconnected: {
    defaultMessage: 'Disconnected'
  },
  vifIpAddresses: {
    defaultMessage: 'IP addresses'
  },

  // ----- VM snapshot tab -----
  noSnapshots: {
    defaultMessage: 'No snapshots'
  },
  snapshotCreateButton: {
    defaultMessage: 'New snapshot'
  },
  tipCreateSnapshotLabel: {
    defaultMessage: 'Just click on the snapshot button to create one!'
  },
  snapshotDate: {
    defaultMessage: 'Creation date'
  },
  snapshotName: {
    defaultMessage: 'Name'
  },
  snapshotAction: {
    defaultMessage: 'Action'
  },

  // ----- VM log tab -----
  logRemoveAll: {
    defaultMessage: 'Remove all logs'
  },
  noLogs: {
    defaultMessage: 'No logs so far'
  },
  logDate: {
    defaultMessage: 'Creation date'
  },
  logName: {
    defaultMessage: 'Name'
  },
  logContent: {
    defaultMessage: 'Content'
  },
  logAction: {
    defaultMessage: 'Action'
  },

  // ----- VM advanced tab -----
  vmRemoveButton: {
    defaultMessage: 'Remove'
  },
  vmConvertButton: {
    defaultMessage: 'Convert'
  },
  xenSettingsLabel: {
    defaultMessage: 'Xen settings'
  },
  guestOsLabel: {
    defaultMessage: 'Guest OS'
  },
  miscLabel: {
    defaultMessage: 'Misc'
  },
  uuid: {
    defaultMessage: 'UUID'
  },
  virtualizationMode: {
    defaultMessage: 'Virtualization mode'
  },
  cpuWeightLabel: {
    defaultMessage: 'CPU weight'
  },
  defaultCpuWeight: {
    defaultMessage: 'Default'
  },
  pvArgsLabel: {
    defaultMessage: 'PV args'
  },
  xenToolsStatus: {
    defaultMessage: 'Xen tools status'
  },
  xenToolsStatusValue: {
    defaultMessage: '{status}',
    description: 'status can be `not-installed`, `unknown`, `out-of-date` & `up-to-date`'
  },
  osName: {
    defaultMessage: 'OS name'
  },
  osKernel: {
    defaultMessage: 'OS kernel'
  },
  autoPowerOn: {
    defaultMessage: 'Auto power on'
  },
  ha: {
    defaultMessage: 'HA'
  },
  originalTemplate: {
    defaultMessage: 'Original template'
  },
  unknownOsName: {
    defaultMessage: 'Unknown'
  },
  unknownOsKernel: {
    defaultMessage: 'Unknown'
  },
  unknownOriginalTemplate: {
    defaultMessage: 'Unknown'
  },
  vmLimitsLabel: {
    defaultMessage: 'VM limits'
  },
  vmCpuLimitsLabel: {
    defaultMessage: 'CPU limits'
  },
  vmMemoryLimitsLabel: {
    defaultMessage: 'Memory limits (min/max)'
  },
  vmMaxVcpus: {
    defaultMessage: 'vCPUs max:'
  },
  vmMaxRam: {
    defaultMessage: 'Memory max:'
  },

  // ----- VM placeholders -----

  vmHomeNamePlaceholder: {
    defaultMessage: 'Long click to add a name'
  },
  vmHomeDescriptionPlaceholder: {
    defaultMessage: 'Long click to add a description'
  },
  vmViewNamePlaceholder: {
    defaultMessage: 'Click to add a name'
  },
  vmViewDescriptionPlaceholder: {
    defaultMessage: 'Click to add a description'
  },

  // ----- Dashboard -----
  poolPanel: {
    defaultMessage: 'Pool{pools, plural, one {} other {s}}'
  },
  hostPanel: {
    defaultMessage: 'Host{hosts, plural, one {} other {s}}'
  },
  vmPanel: {
    defaultMessage: 'VM{vms, plural, one {} other {s}}'
  },
  memoryStatePanel: {
    defaultMessage: 'RAM Usage'
  },
  cpuStatePanel: {
    defaultMessage: 'CPUs Usage'
  },
  vmStatePanel: {
    defaultMessage: 'VMs Power state'
  },
  taskStatePanel: {
    defaultMessage: 'Pending tasks'
  },
  usersStatePanel: {
    defaultMessage: 'Users'
  },
  srStatePanel: {
    defaultMessage: 'Storage state'
  },
  ofUsage: {
    defaultMessage: 'of'
  },
  noSrs: {
    defaultMessage: 'No storage'
  },
  srName: {
    defaultMessage: 'Name'
  },
  srPool: {
    defaultMessage: 'Pool'
  },
  srHost: {
    defaultMessage: 'Host'
  },
  srFormat: {
    defaultMessage: 'Type'
  },
  srSize: {
    defaultMessage: 'Size'
  },
  srUsage: {
    defaultMessage: 'Usage'
  },
  srUsed: {
    defaultMessage: 'used'
  },
  srFree: {
    defaultMessage: 'free'
  },
  srUsageStatePanel: {
    defaultMessage: 'Storage Usage'
  },
  srTopUsageStatePanel: {
    defaultMessage: 'Top 5 SR Usage (in %)'
  },

  // ----- Health -----
  orphanedVdis: {
    defaultMessage: 'Orphaned VDIs'
  },
  orphanedVms: {
    defaultMessage: 'Orphaned VMs'
  },
  noOrphanedObject: {
    defaultMessage: 'No orphans'
  },
  vmNameLabel: {
    defaultMessage: 'Name'
  },
  vmNameDescription: {
    defaultMessage: 'Description'
  },
  vmContainer: {
    defaultMessage: 'Resident on'
  },
  alarmMessage: {
    defaultMessage: 'Alarms'
  },
  noAlarms: {
    defaultMessage: 'No alarms'
  },
  alarmDate: {
    defaultMessage: 'Date'
  },
  alarmContent: {
    defaultMessage: 'Content'
  },
  alarmObject: {
    defaultMessage: 'Issue on'
  },
  alarmPool: {
    defaultMessage: 'Pool'
  },
  alarmRemoveAll: {
    defaultMessage: 'Remove all alarms'
  },

  // ----- New VM -----
  newVmCreateNewVmOn: {
    defaultMessage: 'Create a new VM on {host}'
  },
  newVmInfoPanel: {
    defaultMessage: 'Infos'
  },
  newVmNameLabel: {
    defaultMessage: 'Name'
  },
  newVmTemplateLabel: {
    defaultMessage: 'Template'
  },
  newVmDescriptionLabel: {
    defaultMessage: 'Description'
  },
  newVmPerfPanel: {
    defaultMessage: 'Performances'
  },
  newVmVcpusLabel: {
    defaultMessage: 'vCPUs'
  },
  newVmRamLabel: {
    defaultMessage: 'RAM'
  },
  newVmInstallSettingsPanel: {
    defaultMessage: 'Install settings'
  },
  newVmIsoDvdLabel: {
    defaultMessage: 'ISO/DVD'
  },
  newVmNetworkLabel: {
    defaultMessage: 'Network'
  },
  newVmPvArgsLabel: {
    defaultMessage: 'PV Args'
  },
  newVmInterfacesPanel: {
    defaultMessage: 'Interfaces'
  },
  newVmMacLabel: {
    defaultMessage: 'MAC'
  },
  newVmAddInterface: {
    defaultMessage: 'Add interface'
  },
  newVmDisksPanel: {
    defaultMessage: 'Disks'
  },
  newVmSrLabel: {
    defaultMessage: 'SR'
  },
  newVmBootableLabel: {
    defaultMessage: 'Bootable'
  },
  newVmSizeLabel: {
    defaultMessage: 'Size'
  },
  newVmAddDisk: {
    defaultMessage: 'Add disk'
  },
  newVmSummaryPanel: {
    defaultMessage: 'Summary'
  },
  newVmCreate: {
    defaultMessage: 'Create'
  },
  newVmReset: {
    defaultMessage: 'Reset'
  },
  resourceSets: {
    defaultMessage: 'Resource sets'
  },
  resourceSetName: {
    defaultMessage: 'Resource set name'
  },
  resourceSetCreation: {
    defaultMessage: 'Creation and edition'
  },
  saveResourceSet: {
    defaultMessage: 'Save'
  },
  resetResourceSet: {
    defaultMessage: 'Reset'
  },
  editResourceSet: {
    defaultMessage: 'Edit'
  },
  deleteResourceSet: {
    defaultMessage: 'Delete'
  },
  deleteResourceSetWarning: {
    defaultMessage: 'Delete resource set'
  },
  deleteResourceSetQuestion: {
    defaultMessage: 'Are you sure you want to delete this resource set?'
  },
  resourceSetMissingObjects: {
    defaultMessage: 'Missing objects:'
  },
  resourceSetVcpus: {
    defaultMessage: 'vCPUs'
  },
  resourceSetMemory: {
    defaultMessage: 'Memory'
  },
  resourceSetStorage: {
    defaultMessage: 'Storage'
  },
  unknownResourceSetValue: {
    defaultMessage: 'Unknown'
  },
  availableHosts: {
    defaultMessage: 'Available hosts'
  },
  excludedHosts: {
    defaultMessage: 'Excluded hosts'
  },
  noHostsAvailable: {
    defaultMessage: 'No hosts available.'
  },
  availableHostsDescription: {
    defaultMessage: 'VMs created from this resource set shall run on the following hosts.'
  },
  maxCpus: {
    defaultMessage: 'Maximum CPUs'
  },
  maxRam: {
    defaultMessage: 'Maximum RAM (GiB)'
  },
  maxDiskSpace: {
    defaultMessage: 'Maximum disk space'
  },
  noResourceSetLimits: {
    defaultMessage: 'No limits.'
  },
  totalResource: {
    defaultMessage: 'Total:'
  },
  remainingResource: {
    defaultMessage: 'Remaining:'
  },
  usedResource: {
    defaultMessage: 'Used:'
  },

  // ----- Modals -----
  startVmsModalTitle: {
    defaultMessage: 'Start VM{vms, plural, one {} other {s}}'
  },
  startVmsModalMessage: {
    defaultMessage: 'Are you sure you want to start {vms} VM{vms, plural, one {} other {s}}?'
  },
  stopVmsModalTitle: {
    defaultMessage: 'Stop VM{vms, plural, one {} other {s}}'
  },
  stopVmsModalMessage: {
    defaultMessage: 'Are you sure you want to stop {vms} VM{vms, plural, one {} other {s}}?'
  },
  restartVmsModalTitle: {
    defaultMessage: 'Restart VM{vms, plural, one {} other {s}}'
  },
  restartVmsModalMessage: {
    defaultMessage: 'Are you sure you want to restart {vms} VM{vms, plural, one {} other {s}}?'
  },
  snapshotVmsModalTitle: {
    defaultMessage: 'Snapshot VM{vms, plural, one {} other {s}}'
  },
  snapshotVmsModalMessage: {
    defaultMessage: 'Are you sure you want to snapshot {vms} VM{vms, plural, one {} other {s}}?'
  },
  deleteVmModalTitle: {
    defaultMessage: 'Delete VM'
  },
  deleteVmsModalTitle: {
    defaultMessage: 'Delete VM{vms, plural, one {} other {s}}'
  },
  deleteVmModalMessage: {
    defaultMessage: 'Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED'
  },
  deleteVmsModalMessage: {
    defaultMessage: 'Are you sure you want to delete {vms} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED'
  },
  migrateVmModalTitle: {
    defaultMessage: 'Migrate VM'
  },
  migrateVmModalBody: {
    defaultMessage: 'Are you sure you want to migrate this VM to {hostName}?'
  },
  migrateVmAdvancedModalSelectHost: {
    defaultMessage: 'Select a destination host:'
  },
  migrateVmAdvancedModalSelectNetwork: {
    defaultMessage: 'Select a migration network:'
  },
  migrateVmAdvancedModalSelectSrs: {
    defaultMessage: 'For each VDI, select an SR:'
  },
  migrateVmAdvancedModalSelectNetworks: {
    defaultMessage: 'For each VIF, select a network:'
  },
  migrateVmAdvancedModalName: {
    defaultMessage: 'Name'
  },
  migrateVmAdvancedModalSr: {
    defaultMessage: 'SR'
  },
  migrateVmAdvancedModalVif: {
    defaultMessage: 'VIF'
  },
  migrateVmAdvancedModalNetwork: {
    defaultMessage: 'Network'
  },

  // ----- Servers -----
  serverHost: 'Host',
  serverUsername: 'Username',
  serverPassword: 'Password',
  serverAction: 'Action'
}
forEach(messages, (message, id) => {
  if (isString(message)) {
    messages[id] = {
      id,
      defaultMessage: message
    }
  } else if (!message.id) {
    message.id = id
  }
})

const localizedMessages = {}

addLocaleData(frLocaleData)
localizedMessages.fr = {
  ok: 'OK',
  cancel: 'Annuler',
  editableLongClickPlaceholder: 'Clic long pour éditer',
  editableClickPlaceholder: 'Cliquer pour éditer',
  // ----- General Menu -----
  dashboardPage: 'Tableau de bord',
  overviewDashboardPage: 'Vue d\'ensemble',
  overviewVisualizationDashboardPage: 'Visualisations',
  overviewStatsDashboardPage: 'Statistiques',
  overviewHealthDashboardPage: 'État de santé',
  selfServicePage: 'Self service',
  selfServiceDashboardPage: 'Tableau de bord',
  settingsServersPage: 'Serveurs',
  settingsUsersPage: 'Utilisateurs',
  settingsGroupsPage: 'Groupes',
  settingsAclsPage: 'ACLs',
  settingsPluginsPage: 'Extensions',
  selfServiceAdminPage: 'Administration',
  backupPage: 'Sauvegarde',
  backupOverviewPage: 'Vue d\'ensemble',
  backupNewPage: 'Créer',
  backupRemotesPage: 'Emplacement',
  backupRestorePage: 'Restaurer',
  updatePage: 'Mises à jour',
  settingsPage: 'Paramètres',
  aboutPage: 'À propos',
  newMenu: 'Nouveau',
  newVmPage: 'VM',
  newServerPage: 'Serveur',
  newSrPage: 'Stockage',
  newImport: 'Importer',
  // ----- Home view -----
  homeDisplayedVms: '{displayed}x {vmIcon} (sur {total})',
  homeSelectedVms: '{selected}x {vmIcon} sélectionnée{selected, plural, zero {} one {} other {s}} (sur {total})',
  // ----- General Stuff -----
  homePage: 'Accueil',
  usernameLabel: 'Nom :',
  passwordLabel: 'Mot de passe :',
  signInButton: 'Connexion',
  signOut: 'Déconnexion',
  add: 'Ajouter',
  remove: 'Supprimer',
  schedule: 'Plan',
  newVmBackup: 'Nouvelle sauvegarde de VM',
  backup: 'Sauvegarde',
  rollingSnapshot: 'Sauvegarde continue',
  deltaBackup: 'Sauvegarde différentielle',
  disasterRecovery: 'Reprise après panne',
  continuousReplication: 'Réplication continue',
  preview: 'Aperçu',
  item: 'Objet',
  noSelectedValue: 'Pas de valeur sélectionnée',
  selectSubjects: 'Select. utilisateurs et/ou groupe(s)',
  selectHosts: 'Selectionner Hôte(s)...',
  selectNetworks: 'Selectionner Network(s)...',
  selectPools: 'Selectionner Pool(s)...',
  selectRemotes: 'Selectionner Remote(s)...',
  selectSrs: 'Selectionner Stockages(s)...',
  selectVms: 'Selectionner VM(s)...',
  selectVmTemplates: 'Selectionner patrons de VM...',
  selectTags: 'Selectionner tag(s)...',
  fillRequiredInformations: 'Remplir les champs requis.',
  fillOptionalInformations: 'Remplir informations (optionnel)',
  selectTableReset: 'Réinitialiser',
  schedulingMonth: 'Mois',
  schedulingEveryMonth: 'Tous les mois',
  schedulingEachSelectedMonth: 'Chaque mois sélectionné',
  schedulingMonthDay: 'Jour du mois',
  schedulingEveryMonthDay: 'Tous les jours',
  schedulingEachSelectedMonthDay: 'Chaque jour sélectionné',
  schedulingWeekDay: 'Jour de la semaine',
  schedulingEveryWeekDay: 'Tous les jours',
  schedulingEachSelectedWeekDay: 'Chaque jour sélectionné',
  schedulingHour: 'Heure',
  schedulingEveryHour: 'Toutes les heures',
  schedulingEveryNHour: 'Toutes les N heures',
  schedulingEachSelectedHour: 'Chaque heure sélectionnée',
  schedulingMinute: 'Minute',
  schedulingEveryMinute: 'Toutes les minutes',
  schedulingEveryNMinute: 'Toutes les N minutes',
  schedulingEachSelectedMinute: 'Chaque minute sélectionnée',
  schedulingReset: 'Reset',
  unknownSchedule: 'Inconnu',
  job: 'Job',
  jobTag: 'Tag',
  jobScheduling: 'Plan d\'exécution',
  jobState: 'Etat',
  runJob: 'Execution d\'un job',
  runJobVerbose: 'Une exécution a été lancée. Voir l\'overview pour plus de détails.',
  newBackupSelection: 'Sélectionner votre type de sauvegarde :',
  autoloadPlugin: 'Charger au démarrage du serveur',
  savePluginConfiguration: 'Sauvegarder config.',
  deletePluginConfiguration: 'Supprimer config.',
  pluginError: 'Erreur plugin',
  unknownPluginError: 'Erreur inconnue',
  purgePluginConfiguration: 'Suppression de la config. du plugin',
  purgePluginConfigurationQuestion: 'Etes-vous sûr de vouloir supprimer la configuration de ce plugin ?',
  editPluginConfiguration: 'Editer',
  cancelPluginEdition: 'Annuler',
  pluginConfigurationSuccess: 'Configuration du plugin',
  pluginConfigurationChanges: 'La configuration du plugin a été sauvegardée !',
  startVmLabel: 'Démarrer',
  recoveryModeLabel: 'Démarrer en mode sans échec',
  suspendVmLabel: 'Suspendre',
  stopVmLabel: 'Arrêter',
  forceShutdownVmLabel: 'Forcer l\'arrêt',
  rebootVmLabel: 'Redémarrer',
  forceRebootVmLabel: 'Forcer le redémarrage',
  deleteVmLabel: 'Supprimer',
  migrateVmLabel: 'Migrer',
  snapshotVmLabel: 'Prendre un instantané',
  exportVmLabel: 'Exporter',
  copyVmLabel: 'Copier',
  cloneVmLabel: 'Cloner',
  convertToTemplateLabel: 'Convertir en modèle',
  // ----- host tab names -----
  storageTabName: 'Stockage',
  patchesTabName: 'Patches',
  // ----- host advanced tab -----
  hardwareHostSettingsLabel: 'Matériel',
  hostAddress: 'Adresse',
  hostStatus: 'Statut',
  hostBuildNumber: 'Numéro de build',
  hostIscsiName: 'Nom iSCSI',
  hostXenServerVersion: 'Version',
  hostStatusEnabled: 'Activé',
  hostStatusDisabled: 'Désactivé',
  hostPowerOnMode: 'Mode d\'allumage',
  powerOnDisabled: 'Désactivé',
  hostStartedSince: 'Système',
  hostStackStartedSince: 'XAPI',
  hostCpusModel: 'Modèle de processeur',
  hostCpusNumber: 'Cœur (socket)',
  hostManufacturerinfo: 'Informations constructeur',
  hostBiosinfo: 'Informations BIOS',
  licenseHostSettingsLabel: 'Licence',
  hostLicenseType: 'Type de licence',
  hostLicenseSocket: 'Nombre de socket',
  hostLicenseExpiry: 'Expiration',
  // ----- VM stat tab -----
  statLoad: 'Charge système',
  // ----- VM tab names -----
  vmConsoleLabel: 'Console',
  generalTabName: 'Général',
  statsTabName: 'Stats',
  consoleTabName: 'Console',
  snapshotsTabName: 'Instantanés',
  logsTabName: 'Journaux',
  advancedTabName: 'Avancé',
  networkTabName: 'Réseau',
  disksTabName: 'Disque{disks, plural, zero {} one {} other {s}}',
  powerStateHalted: 'arrêtée',
  powerStateRunning: 'en marche',
  started: 'Démarrée {ago}',
  noToolsDetected: 'Pas d\'outils Xen détectés',
  noIpv4Record: 'Aucune IPv4',
  noIpRecord: 'Aucune IP',
  virtualizationMode: 'Mode de virtualisation',
  // ----- VM stat tab -----
  statsCpu: 'Utilisation processeur',
  statsMemory: 'Utilisation mémoire',
  statsNetwork: 'Débit réseau',
  statDisk: 'Débit disque',
  statLastTenMinutes: 'Il y a 10 minutes',
  statLastTwoHours: 'Il y a 2 heures',
  statLastWeek: 'La semaine dernière',
  statLastYear: 'L\'année dernière',
  // ----- VM console tab -----
  copyToClipboardLabel: 'Copier',
  ctrlAltDelButtonLabel: 'Ctrl+Alt+Suppr',
  tipLabel: 'Conseil :',
  tipConsoleLabel: 'Les agencements de clavier hors États-Unis ont des problèmes avec la console: passez le votre en "US".',
  // ----- VM disk tab -----
  vdiAttachDeviceButton: 'Brancher un disque',
  vbdCreateDeviceButton: 'Nouveau disque',
  vdiBootOrder: 'Ordre de démarrage',
  vdiNameLabel: 'Nom',
  vdiNameDescription: 'Déscription',
  vdiTags: 'Tags',
  vdiSize: 'Taille',
  vdiSr: 'Stockage',
  vdbBootableStatus: 'Démarrable ?',
  vdbBootable: 'Démarrable',
  vdbNotBootable: 'Non démarrable',
  vdbStatus: 'Statut',
  vbdStatusConnected: 'Connecté',
  vbdStatusDisconnected: 'Déconnecté',
  vbdNoVbd: 'Pas de disque',
  // ----- VM network tab -----
  vifCreateDeviceButton: 'Nouvelle interface',
  vifNoInterface: 'Aucune interface',
  vifDeviceLabel: 'Interface',
  vifMacLabel: 'Adresse physique',
  vifMtuLabel: 'MTU',
  vifNetworkLabel: 'Réseau',
  vifStatusLabel: 'Statut',
  vifStatusConnected: 'Connecté',
  vifStatusDisconnected: 'Déconnecté',
  // ----- VM snapshot tab -----
  noSnapshot: 'Aucun instantané',
  snapshotCreateButton: 'Nouvel instantané',
  tipCreateSnapshotLabel: 'Cliquez sur le bouton pour en créer un !',
  snapshotDate: 'Date de l\'instantané',
  snapshotName: 'Nom',
  snapshotAction: 'Action',
  // ----- VM log tab -----
  logRemoveAll: 'Supprimer tous les journaux',
  noLogs: 'Aucun journal pour l\'instant',
  logDate: 'Date du journal',
  logName: 'Nom',
  logContent: 'Contenu',
  logAction: 'Action',
  // ----- VM advanced tab -----
  uuid: 'Identifiant unique',
  miscLabel: 'Divers',
  xenSettingsLabel: 'Paramètres Xen',
  guestOsLabel: 'Système d\'exploitatation',
  paraVirtualizedMode: 'Paravirtualisation (PV)',
  hardwareVirtualizedMode: 'Virtualisation matérielle (HVM)',
  xenToolsStatus: 'État des outils Xen',
  xenToolsStatusValue: `{status, select,
    unknown {Inconnu}
    up-to-date {À jour}
    out-of-date {Obsolètes}
    not-installed {Pas installés}
  }`,
  osName: 'Nom du système d\'exploitation',
  cpuWeightLabel: 'Poids CPU',
  defaultCpuWeight: 'Par défaut',
  osKernel: 'Noyau du système d\'exploitation',
  autoPowerOn: 'Démarrage automatique',
  ha: 'Haute disponibilité',
  originalTemplate: 'Modèle d\'origine',
  unknownOsName: 'Inconnu',
  unknownOsKernel: 'Inconnu',
  vmLimitsLabel: 'Limites',
  vmCpuLimitsLabel: 'Limites processeur',
  vmMemoryLimitsLabel: 'Limites mémoire',
  unknownOriginalTemplate: 'Inconnu',
  // ----- VM placholders -----
  vmHomeNamePlaceholder: 'Clic long pour ajouter un nom',
  vmHomeDescriptionPlaceholder: 'Clic long pour ajouter une description',
  vmViewNamePlaceholder: 'Cliquer pour ajouter un nom',
  vmViewDescriptionPlaceholder: 'Cliquer pour ajouter une description',

  // ----- Dashboard -----
  poolPanel: 'Pool{pools, plural, zero {} one {} other {s}}',
  hostPanel: 'Hôte{hosts, plural, zero {} one {} other {s}}',
  vmPanel: 'VM{vms, plural, zero {} one {} other {s}}',
  memoryStatePanel: 'Utilisation mémoire',
  cpuStatePanel: 'Attribution CPU',
  srUsageStatePanel: 'Utilisation du stockage',
  vmStatePanel: 'État des VMs',
  srStatePanel: 'État du stockage',
  taskStatePanel: 'Tâches en cours',
  usersStatePanel: 'Utilisateurs',
  ofUsage: 'sur',
  noSrs: 'Aucun stockage',
  srName: 'Nom',
  srPool: 'Pool',
  srHost: 'Hôte',
  srFormat: 'Type',
  srSize: 'Taille',
  srUsage: 'Utilisation',
  srTopUsageStatePanel: 'Top 5 d\'utilisation des stockages (en %)',
  // ----- Health -----
  orphanedVdis: 'Disques orphelins',
  orphanedVms: 'VM orphelines',
  noOrphanedObject: 'Pas d\'orphelin',
  vmNameLabel: 'Nom',
  vmNameDescription: 'Description',
  vmContainer: 'Présent sur',
  alarmMessage: 'Alarmes',
  noAlarms: 'Aucune alarme',
  alarmDate: 'Date',
  alarmContent: 'Contenu',
  alarmObject: 'Concernant',
  alarmPool: 'Pool',
  alarmRemoveAll: 'Supprimer toutes les alarmes',
  // ----- New VM -----
  newVmCreateNewVmOn: 'Créer une nouvelle VM sur {host}',
  newVmInfoPanel: 'Informations',
  newVmNameLabel: 'Nom',
  newVmTemplateLabel: 'Modèle',
  newVmDescriptionLabel: 'Description',
  newVmPerfPanel: 'Performances',
  newVmVcpusLabel: 'vCPUs',
  newVmRamLabel: 'RAM',
  newVmInstallSettingsPanel: 'Paramètres d\'installation',
  newVmIsoDvdLabel: 'ISO/DVD',
  newVmNetworkLabel: 'Network',
  newVmPvArgsLabel: 'PV Args',
  newVmInterfacesPanel: 'Interfaces',
  newVmMacLabel: 'MAC',
  newVmAddInterface: 'Ajouter une interface',
  newVmDisksPanel: 'Disques',
  newVmSrLabel: 'SR',
  newVmBootableLabel: 'Amorçable',
  newVmSizeLabel: 'Taille',
  newVmAddDisk: 'Ajouter un disque',
  newVmSummaryPanel: 'Résumé',
  newVmCreate: 'Créer',
  newVmReset: 'Effacer',
  // ----- Modals -----
  startVmsModalTitle: 'Démarrer {vms, plural, one {la} other {les}} VM{vms, plural, one {} other {s}}',
  startVmsModalMessage: 'Voulez-vous vraiment démarrer {vms} VM{vms, plural, one {} other {s}} ?',
  stopVmsModalTitle: 'Arrêter {vms, plural, one {la} other {les}} VM{vms, plural, one {} other {s}}',
  stopVmsModalMessage: 'Voulez-vous vraiment arrêter {vms} VM{vms, plural, one {} other {s}} ?',
  restartVmsModalTitle: 'Redémarrer {vms, plural, one {la} other {les}} VM{vms, plural, one {} other {s}}',
  restartVmsModalMessage: 'Voulez-vous vraiment redémarrer {vms} VM{vms, plural, one {} other {s}} ?',
  migrateVmModalTitle: 'Migrer la VM',
  migrateVmModalBody: 'Voulez-vous vraiment migrer cette VM sur {hostName} ?',
  migrateVmAdvancedModalSelectHost: 'Sélectionnez un hôte de destination:',
  migrateVmAdvancedModalSelectNetwork: 'Sélectionnez un réseau pour la migration:',
  migrateVmAdvancedModalSelectSrs: 'Pour chaque VDI, sélectionnez un SR:',
  migrateVmAdvancedModalSelectNetworks: 'Pour chaque VIF, sélectionnez un réseau:',
  migrateVmAdvancedModalName: 'Nom',
  migrateVmAdvancedModalSr: 'SR',
  migrateVmAdvancedModalVif: 'VIF',
  migrateVmAdvancedModalNetwork: 'Réseau',
  migrateVmAdvancedModalNoRemapping: 'Migration intra-pool : le re-mappage n\'est pas requis',
  // ------ Self ------
  resourceSets: 'Ensemble de ressources',
  resourceSetName: 'Nom de l\'ensemble de ressources',
  resourceSetCreation: 'Création and édition',
  saveResourceSet: 'Sauvegarder',
  resetResourceSet: 'Effacer',
  editResourceSet: 'Editer',
  deleteResourceSet: 'Supprimer',
  deleteResourceSetWarning: 'Suppression d\'un ensemble de ressources.',
  deleteResourceSetQuestion: 'Etes-vous sûr de vouloir supprimer cet ensemble ?',
  resourceSetMissingObjects: 'Objets manquants :',
  resourceSetVcpus: 'vCPUs',
  resourceSetMemory: 'Mémoire',
  resourceSetStorage: 'Stockage',
  unknownResourceSetValue: 'Inconnu',
  availableHosts: 'Hôtes disponibles',
  excludedHosts: 'Hôtes exclus',
  noHostsAvailable: 'Pas d\'hôtes disponibles.',
  availableHostsDescription: 'Les VMs crées par cet ensemble de ressources doivent tourner sur les hôtes suivants.',
  maxCpus: 'Nombre max de CPUs',
  maxRam: 'Maximum RAM (GiB)',
  maxDiskSpace: 'Maximum d\'espace disque',
  totalResource: 'Total :',
  remainingResource: 'Restants :',
  usedResource: 'Utilisés :',
  noResourceSetLimits: 'Pas de limites.'
}

// ===================================================================

// Params:
//
// - props (optional): properties to add to the FormattedMessage
// - messageId: identifier of the message to format/translate
// - values (optional): values to pass to the message
// - render (optional): a function receiving the React nodes of the
//     translated message and returning the React node to render
const getMessage = (props, messageId, values, render) => {
  if (isString(props)) {
    render = values
    values = messageId
    messageId = props
    props = undefined
  }

  const message = messages[messageId]
  if (process.env.NODE_ENV !== 'production' && !message) {
    throw new Error(`no message defined for ${messageId}`)
  }

  if (isFunction(values)) {
    render = values
    values = undefined
  }

  return <FormattedMessage {...props} {...message} values={values}>
    {render}
  </FormattedMessage>
}

export { getMessage as default }

@connect(({ lang }) => ({ lang }))
export class IntlProvider extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    lang: PropTypes.string.isRequired
  };

  render () {
    const { lang, children } = this.props
    return <IntlProvider_
      locale={lang}
      messages={localizedMessages[lang]}
    >
     {children}
    </IntlProvider_>
  }
}

@connect(({ lang }) => ({ lang }))
export class FormattedDuration extends Component {
  render () {
    const {
      duration,
      lang
    } = this.props
    return <span>{moment.duration(duration).locale(lang).humanize()}</span>
  }
}
