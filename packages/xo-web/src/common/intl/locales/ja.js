// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/ja'

import reactIntlData from 'react-intl/locale-data/ja'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: 'Alpha'
  alpha: undefined,

  // Original text: 'Alerts'
  alerts: undefined,

  // Original text: 'Connected'
  connected: undefined,

  // Original text: 'Description'
  description: undefined,

  // Original text: 'Delete source VM'
  deleteSourceVm: undefined,

  // Original text: 'Disable'
  disable: undefined,

  // Original text: 'Disk state'
  diskState: undefined,

  // Original text: 'Download'
  download: undefined,

  // Original text: 'Enable'
  enable: undefined,

  // Original text: 'Expiration'
  expiration: undefined,

  // Original text: 'Host IP'
  hostIp: undefined,

  // Original text: 'Interfaces'
  interfaces: undefined,

  // Original text: "{key}: {value}"
  keyValue: '{key} : {value}',

  // Original text: 'Skip SSL check'
  esxiImportSslCertificate: undefined,

  // Original text: 'Thin mode'
  esxiImportThin: undefined,

  // Original text: 'Disk created in thin mode (less space used). Data is read twice, no visible task or progress at first'
  esxiImportThinDescription: undefined,

  // Original text: 'Stop the source VM'
  esxiImportStopSource: undefined,

  // Original text: 'Source VM stopped before the last delta transfer (after final snapshot). Needed to fully transfer a running VM'
  esxiImportStopSourceDescription: undefined,

  // Original text: 'Stop on the first error when importing VMs'
  esxiImportStopOnErrorDescription: undefined,

  // Original text: 'In use'
  inUse: undefined,

  // Original text: 'Number of VMs to import in parallel'
  nImportVmsInParallel: undefined,

  // Original text: 'Node'
  node: undefined,

  // Original text: 'PIFs'
  pifs: undefined,

  // Original text: 'Stop on error'
  stopOnError: undefined,

  // Original text: "UUID"
  uuid: 'UUID',

  // Original text: 'VDI'
  vdi: undefined,

  // Original text: 'Storage: {used} used of {total} ({free} free)'
  vmSrUsage: undefined,

  // Original text: 'New'
  new: undefined,

  // Original text: 'Node status'
  nodeStatus: undefined,

  // Original text: 'Not defined'
  notDefined: undefined,

  // Original text: 'Status'
  status: undefined,

  // Original text: "Connecting"
  statusConnecting: '接続中……',

  // Original text: "Disconnected"
  statusDisconnected: '切断',

  // Original text: "Loading…"
  statusLoading: '読み込み中……',

  // Original text: "Page not found"
  errorPageNotFound: 'ページが見つかりません',

  // Original text: "No such item"
  errorNoSuchItem: 'アイテムが見つかりません',

  // Original text: 'Unknown {type}'
  errorUnknownItem: undefined,

  // Original text: 'Generate new MAC addresses'
  generateNewMacAddress: undefined,

  // Original text: '{memoryFree} RAM free'
  memoryFree: undefined,

  // Original text: 'Configured'
  configured: undefined,

  // Original text: 'Not configured'
  notConfigured: undefined,

  // Original text: 'UTC date'
  utcDate: undefined,

  // Original text: 'UTC time'
  utcTime: undefined,

  // Original text: 'Date'
  date: undefined,

  // Original text: 'Notifications'
  notifications: undefined,

  // Original text: 'No notifications so far.'
  noNotifications: undefined,

  // Original text: 'NEW!'
  notificationNew: undefined,

  // Original text: 'More details'
  moreDetails: undefined,

  // Original text: 'Subject'
  messageSubject: undefined,

  // Original text: 'From'
  messageFrom: undefined,

  // Original text: 'Reply'
  messageReply: undefined,

  // Original text: 'SR'
  sr: undefined,

  // Original text: 'Subdirectory'
  subdirectory: undefined,

  // Original text: 'Try XOA for free and deploy it here.'
  tryXoa: undefined,

  // Original text: 'Not installed'
  notInstalled: undefined,

  // Original text: "Long click to edit"
  editableLongClickPlaceholder: '押し続けることで編集',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'クリックで編集',

  // Original text: "Browse files"
  browseFiles: 'ブラウズファイル',

  // Original text: 'Show logs'
  showLogs: undefined,

  // Original text: 'None'
  noValue: undefined,

  // Original text: 'No expiration'
  noExpiration: undefined,

  // Original text: 'Compression'
  compression: undefined,

  // Original text: 'Core'
  core: undefined,

  // Original text: 'CPU'
  cpu: undefined,

  // Original text: 'Multipathing'
  multipathing: undefined,

  // Original text: 'Multipathing disabled'
  multipathingDisabled: undefined,

  // Original text: 'Enable multipathing'
  enableMultipathing: undefined,

  // Original text: 'Disable multipathing'
  disableMultipathing: undefined,

  // Original text: 'Enable multipathing for all hosts'
  enableAllHostsMultipathing: undefined,

  // Original text: 'Disable multipathing for all hosts'
  disableAllHostsMultipathing: undefined,

  // Original text: 'Paths'
  paths: undefined,

  // Original text: 'PBD disconnected'
  pbdDisconnected: undefined,

  // Original text: 'Has an inactive path'
  hasInactivePath: undefined,

  // Original text: 'Pools'
  pools: undefined,

  // Original text: 'Remotes'
  remotes: undefined,

  // Original text: 'Scheduler granularity'
  schedulerGranularity: undefined,

  // Original text: 'Set CBT error'
  setCbtError: undefined,

  // Original text: 'Socket'
  socket: undefined,

  // Original text: 'Type'
  type: undefined,

  // Original text: 'Restore'
  restore: undefined,

  // Original text: 'Delete'
  delete: undefined,

  // Original text: 'VMs'
  vms: undefined,

  // Original text: 'Max vCPUs'
  cpusMax: undefined,

  // Original text: 'Metadata'
  metadata: undefined,

  // Original text: 'Choose a backup'
  chooseBackup: undefined,

  // Original text: 'Temporarily disabled'
  temporarilyDisabled: undefined,

  // Original text: 'Click to show error'
  clickToShowError: undefined,

  // Original text: 'Backup jobs'
  backupJobs: undefined,

  // Original text: '({ nSessions, number }) iSCSI session{nSessions, plural, one {} other {s}}'
  iscsiSessions: undefined,

  // Original text: 'Requires admin permissions'
  requiresAdminPermissions: undefined,

  // Original text: 'Proxy'
  proxy: undefined,

  // Original text: 'Proxies'
  proxies: undefined,

  // Original text: 'Name'
  name: undefined,

  // Original text: 'Value'
  value: undefined,

  // Original text: 'Address'
  address: undefined,

  // Original text: 'VM'
  vm: undefined,

  // Original text: 'Destination SR'
  destinationSR: undefined,

  // Original text: 'Destination network'
  destinationNetwork: undefined,

  // Original text: 'DHCP'
  dhcp: undefined,

  // Original text: 'ID'
  id: undefined,

  // Original text: 'IP'
  ip: undefined,

  // Original text: 'Static'
  static: undefined,

  // Original text: 'User'
  user: undefined,

  // Original text: 'deleted ({ name })'
  deletedUser: undefined,

  // Original text: 'Network configuration'
  networkConfiguration: undefined,

  // Original text: 'Integrity'
  integrity: undefined,

  // Original text: 'Altered'
  altered: undefined,

  // Original text: 'Missing'
  missing: undefined,

  // Original text: 'Verified'
  verified: undefined,

  // Original text: 'Snapshot mode'
  snapshotMode: undefined,

  // Original text: 'Normal'
  normal: undefined,

  // Original text: 'With memory'
  withMemory: undefined,

  // Original text: 'Offline'
  offline: undefined,

  // Original text: 'No license available'
  noLicenseAvailable: undefined,

  // Original text: 'Email address, e.g.: it@company.net'
  emailPlaceholderExample: undefined,

  // Original text: 'Unknown'
  unknown: undefined,

  // Original text: 'Upgrades available'
  upgradesAvailable: undefined,

  // Original text: 'Advanced settings'
  advancedSettings: undefined,

  // Original text: 'Force upgrade'
  forceUpgrade: undefined,

  // Original text: 'TX checksumming'
  txChecksumming: undefined,

  // Original text: 'Thick'
  thick: undefined,

  // Original text: 'Thin'
  thin: undefined,

  // Original text: 'Unknown size'
  unknownSize: undefined,

  // Original text: 'Installed certificates'
  installedCertificates: undefined,

  // Original text: 'Expiry'
  expiry: undefined,

  // Original text: 'Fingerprint'
  fingerprint: undefined,

  // Original text: 'Certificate (PEM)'
  certificate: undefined,

  // Original text: 'Certificate chain (PEM)'
  certificateChain: undefined,

  // Original text: 'Private key (PKCS#8)'
  privateKey: undefined,

  // Original text: 'Install new certificate'
  installNewCertificate: undefined,

  // Original text: 'Replace existing certificate'
  replaceExistingCertificate: undefined,

  // Original text: 'Custom fields'
  customFields: undefined,

  // Original text: 'Add color'
  addColor: undefined,

  // Original text: 'Add custom field'
  addCustomField: undefined,

  // Original text: 'Advanced tag creation'
  advancedTagCreation: undefined,

  // Original text: 'Available in XOA Premium'
  availableXoaPremium: undefined,

  // Original text: 'Detach'
  detach: undefined,

  // Original text: 'Edit custom field'
  editCustomField: undefined,

  // Original text: 'Delete custom field'
  deleteCustomField: undefined,

  // Original text: 'Only available to XOA users'
  onlyAvailableXoaUsers: undefined,

  // Original text: 'Remove color'
  removeColor: undefined,

  // Original text: 'XCP-ng'
  xcpNg: undefined,

  // Original text: 'No file selected'
  noFileSelected: undefined,

  // Original text: 'Number of retries if VM backup fails'
  nRetriesVmBackupFailures: undefined,

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "OK"
  confirmOk: 'OK',

  // Original text: 'OK'
  formOk: undefined,

  // Original text: "Cancel"
  genericCancel: 'キャンセル',

  // Original text: 'Enter the following text to confirm:'
  enterConfirmText: undefined,

  // Original text: "On error"
  onError: 'エラー',

  // Original text: "Successful"
  successful: '成功',

  // Original text: 'Hide short tasks'
  filterOutShortTasks: undefined,

  // Original text: "Managed disks"
  filterOnlyManaged: 'ディスクの管理',

  // Original text: "Orphaned disks"
  filterOnlyOrphaned: '関連するものが存在しないディスク一覧',

  // Original text: "Normal disks"
  filterOnlyRegular: '正常なディスク一覧',

  // Original text: 'Running VMs'
  filterOnlyRunningVms: undefined,

  // Original text: "Snapshot disks"
  filterOnlySnapshots: 'スナップショットのディスク一覧',

  // Original text: "Unmanaged disks"
  filterOnlyUnmanaged: '管理されていないディスク一覧',

  // Original text: 'Save…'
  filterSaveAs: undefined,

  // Original text: 'Explore the search syntax in the documentation'
  filterSyntaxLinkTooltip: undefined,

  // Original text: 'Connected VIFs'
  filterVifsOnlyConnected: undefined,

  // Original text: 'Disconnected VIFs'
  filterVifsOnlyDisconnected: undefined,

  // Original text: 'Connected remotes'
  filterRemotesOnlyConnected: undefined,

  // Original text: 'Disconnected remotes'
  filterRemotesOnlyDisconnected: undefined,

  // Original text: "Copy to clipboard"
  copyToClipboard: 'クリップボードにコピー',

  // Original text: 'Copy VDI UUID'
  copyToClipboardVdiUuid: undefined,

  // Original text: 'Copy {uuid}'
  copyUuid: undefined,

  // Original text: 'Copy {value}'
  copyValue: undefined,

  // Original text: "Master"
  pillMaster: 'マスター',

  // Original text: "Home"
  homePage: 'ホーム',

  // Original text: "VMs"
  homeVmPage: '仮想マシン(VM)',

  // Original text: "Hosts"
  homeHostPage: 'ホスト',

  // Original text: "Pools"
  homePoolPage: 'プール',

  // Original text: "Templates"
  homeTemplatePage: 'テンプレート',

  // Original text: "Storage"
  homeSrPage: 'ストレージ',

  // Original text: "Dashboard"
  dashboardPage: 'ダッシュボード',

  // Original text: "Overview"
  overviewDashboardPage: 'オーバービュー',

  // Original text: "Visualizations"
  overviewVisualizationDashboardPage: '仮想マシン利用量',

  // Original text: "Statistics"
  overviewStatsDashboardPage: '統計情報',

  // Original text: "Health"
  overviewHealthDashboardPage: '状態',

  // Original text: "Self service"
  selfServicePage: 'セルフサービス',

  // Original text: "Backup"
  backupPage: 'バックアップ',

  // Original text: "Jobs"
  jobsPage: 'ジョブ',

  // Original text: 'XOA'
  xoaPage: undefined,

  // Original text: "Updates"
  updatePage: '更新',

  // Original text: 'Licenses'
  licensesPage: undefined,

  // Original text: 'Notifications'
  notificationsPage: undefined,

  // Original text: 'Support'
  supportPage: undefined,

  // Original text: "Settings"
  settingsPage: '設定',

  // Original text: 'Audit'
  settingsAuditPage: undefined,

  // Original text: "Servers"
  settingsServersPage: 'サーバ一覧',

  // Original text: "Users"
  settingsUsersPage: 'ユーザー一覧',

  // Original text: "Groups"
  settingsGroupsPage: 'グループ一覧',

  // Original text: "ACLs"
  settingsAclsPage: 'ACL一覧',

  // Original text: "Plugins"
  settingsPluginsPage: 'プラグイン',

  // Original text: "Logs"
  settingsLogsPage: 'ログ',

  // Original text: 'Cloud configs'
  settingsCloudConfigsPage: undefined,

  // Original text: "IPs"
  settingsIpsPage: 'IPアドレス',

  // Original text: "About"
  aboutPage: 'XOについて',

  // Original text: "About XO {xoaPlan}"
  aboutXoaPlan: 'XO {xoaPlan} プランについて',

  // Original text: "New"
  newMenu: '新規作成',

  // Original text: "Tasks"
  taskMenu: 'タスク',

  // Original text: "Tasks"
  taskPage: 'タスクの一覧',

  // Original text: 'Network'
  newNetworkPage: undefined,

  // Original text: "VM"
  newVmPage: '仮想マシン(VM)',

  // Original text: "Storage"
  newSrPage: 'ストレージ',

  // Original text: "Server"
  newServerPage: 'サーバ',

  // Original text: "Import"
  newImport: 'インポート',

  // Original text: "XOSAN"
  xosan: 'XOSAN',

  // Original text: "Overview"
  backupOverviewPage: 'オーバービュー',

  // Original text: "New"
  backupNewPage: 'バックアップの作成',

  // Original text: "Remotes"
  backupRemotesPage: 'リモート',

  // Original text: "Restore"
  backupRestorePage: '復元',

  // Original text: "File restore"
  backupFileRestorePage: 'ファイル単位の復元',

  // Original text: "Schedule"
  schedule: 'スケジュール',

  // Original text: "Backup"
  backup: 'バックアップ',

  // Original text: "Rolling Snapshot"
  rollingSnapshot: 'Rolling Snapshot',

  // Original text: "Delta Backup"
  deltaBackup: 'Delta Backup',

  // Original text: "Disaster Recovery"
  disasterRecovery: 'Disaster Recovery',

  // Original text: "Continuous Replication"
  continuousReplication: 'Continuous Replication',

  // Original text: 'Backup type'
  backupType: undefined,

  // Original text: 'Pool metadata'
  poolMetadata: undefined,

  // Original text: 'XO config'
  xoConfig: undefined,

  // Original text: 'VM Backup & Replication'
  backupVms: undefined,

  // Original text: 'XO config & Pool metadata Backup'
  backupMetadata: undefined,

  // Original text: 'Backup mode and source remote are required'
  backupModeSourceRemoteRequired: undefined,

  // Original text: 'Mirror backup'
  mirrorBackup: undefined,

  // Original text: 'VM Mirror Backup'
  mirrorBackupVms: undefined,

  // Original text: 'Mirror all {mode} VM backups'
  mirrorAllVmBackups: undefined,

  // Original text: "Overview"
  jobsOverviewPage: 'ジョブの全体',

  // Original text: "New"
  jobsNewPage: 'ジョブの追加',

  // Original text: "Scheduling"
  jobsSchedulingPage: 'ジョブのスケジュール',

  // Original text: "Custom Job"
  customJob: 'カスタムジョブ',

  // Original text: "User"
  userPage: 'ユーザー',

  // Original text: 'XOA'
  xoa: undefined,

  // Original text: "No support"
  noSupport: 'サポート適応外',

  // Original text: "Free upgrade!"
  freeUpgrade: 'フリーアップグレード',

  // Original text: 'Check XOA'
  checkXoa: undefined,

  // Original text: 'XOA check'
  xoaCheck: undefined,

  // Original text: 'Close tunnel'
  closeTunnel: undefined,

  // Original text: 'Create a support ticket'
  createSupportTicket: undefined,

  // Original text: 'Restart XO Server'
  restartXoServer: undefined,

  // Original text: 'Restarting XO Server will interrupt any backup job or XO task that is currently running. Xen Orchestra will also be unavailable for a few seconds. Are you sure you want to restart XO Server?'
  restartXoServerConfirm: undefined,

  // Original text: 'Open tunnel'
  openTunnel: undefined,

  // Original text: 'The XOA check and the support tunnel are available in XOA.'
  supportCommunity: undefined,

  // Original text: 'Support tunnel'
  supportTunnel: undefined,

  // Original text: 'The support tunnel is closed.'
  supportTunnelClosed: undefined,

  // Original text: "Sign out"
  signOut: 'サインアウト',

  // Original text: "Edit my settings {username}"
  editUserProfile: '{username} 設定の変更',

  // Original text: 'XenServer Client ID'
  xsClientId: undefined,

  // Original text: 'Upload Client ID file'
  uploadClientId: undefined,

  // Original text: 'Forget Client ID'
  forgetClientId: undefined,

  // Original text: 'Are you sure you want to forget your XenServer Client ID?'
  forgetXsCredentialsConfirm: undefined,

  // Original text: 'Could not forget Client ID'
  forgetXsCredentialsError: undefined,

  // Original text: 'Client ID forgotten'
  forgetXsCredentialsSuccess: undefined,

  // Original text: 'Could not upload Client ID'
  setXsCredentialsError: undefined,

  // Original text: 'Client ID uploaded'
  setXsCredentialsSuccess: undefined,

  // Original text: 'All VMs'
  allVms: undefined,

  // Original text: 'Backed up VMs'
  backedUpVms: undefined,

  // Original text: 'Not backed up VMs'
  notBackedUpVms: undefined,

  // Original text: "Fetching data…"
  homeFetchingData: 'データ取得中……',

  // Original text: "Welcome to Xen Orchestra!"
  homeWelcome: 'Xen Orchestraへようこそ!',

  // Original text: "Add your XCP-ng hosts or pools"
  homeWelcomeText: 'XCP-ngのホスト、プールの追加',

  // Original text: "Some XCP-ng hosts have been registered but are not connected"
  homeConnectServerText: '追加済みのXCP-ngホストに接続出来ません',

  // Original text: "Want some help?"
  homeHelp: 'サポートが必要ですか？',

  // Original text: "Add server"
  homeAddServer: 'サーバの追加',

  // Original text: "Connect servers"
  homeConnectServer: 'サーバへの接続',

  // Original text: "Online doc"
  homeOnlineDoc: 'オンラインドキュメント',

  // Original text: "Pro support"
  homeProSupport: 'プロフェッショナルサポート',

  // Original text: "There are no VMs!"
  homeNoVms: 'VMがありません!',

  // Original text: "Or…"
  homeNoVmsOr: 'あるいは…',

  // Original text: "Import VM"
  homeImportVm: 'VMのインポート',

  // Original text: "Import an existing VM in xva format"
  homeImportVmMessage: '既存のVMをxvaフォーマットでインポート',

  // Original text: "Restore a backup"
  homeRestoreBackup: 'バックアップからリストア',

  // Original text: "Restore a backup from a remote store"
  homeRestoreBackupMessage: 'リモートからバックアップをリストアする',

  // Original text: "This will create a new VM"
  homeNewVmMessage: 'VMを作成します',

  // Original text: "Filters"
  homeFilters: 'フィルタ',

  // Original text: "No results! Click here to reset your filters"
  homeNoMatches: '何もありません。フィルタを初期化します',

  // Original text: "Pool"
  homeTypePool: 'プール',

  // Original text: "Host"
  homeTypeHost: 'ホスト',

  // Original text: "VM"
  homeTypeVm: 'VM',

  // Original text: "SR"
  homeTypeSr: 'SR',

  // Original text: "Template"
  homeTypeVmTemplate: 'テンプレート',

  // Original text: "Sort"
  homeSort: 'ソート',

  // Original text: "Pools"
  homeAllPools: 'プール',

  // Original text: "Hosts"
  homeAllHosts: 'ホスト',

  // Original text: "Tags"
  homeAllTags: 'タグ',

  // Original text: 'Resource sets'
  homeAllResourceSets: undefined,

  // Original text: "New VM"
  homeNewVm: 'VMの新規作成',

  // Original text: "None"
  homeFilterNone: 'なし',

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: '無効化されたホスト',

  // Original text: "Pending VMs"
  homeFilterPendingVms: 'ペンディング中のVM',

  // Original text: "HVM guests"
  homeFilterHvmGuests: 'HVMゲストVM',

  // Original text: "Sort by"
  homeSortBy: 'ソート',

  // Original text: "CPUs"
  homeSortByCpus: 'CPUs',

  // Original text: 'Install time'
  homeSortByInstallTime: undefined,

  // Original text: 'Start time'
  homeSortByStartTime: undefined,

  // Original text: "Name"
  homeSortByName: '名前',

  // Original text: "Power state"
  homeSortByPowerstate: '電源状態',

  // Original text: "RAM"
  homeSortByRAM: 'RAM',

  // Original text: "Shared/Not shared"
  homeSortByShared: '共有/専有',

  // Original text: "Size"
  homeSortBySize: 'サイズ',

  // Original text: "Type"
  homeSortByType: 'タイプ',

  // Original text: "Usage"
  homeSortByUsage: '使用量',

  // Original text: 'Snapshots'
  homeSortVmsBySnapshots: undefined,

  // Original text: 'Container'
  homeSortByContainer: undefined,

  // Original text: 'Pool'
  homeSortByPool: undefined,

  // Original text: "{displayed, number}x {icon} (of {total, number})"
  homeDisplayedItems: '{displayed, number}x {icon} (on {total, number})',

  // Original text: "{selected, number}x {icon} selected (of {total, number})"
  homeSelectedItems: '{selected, number}x {icon} selected (on {total, number})',

  // Original text: "More"
  homeMore: 'More',

  // Original text: "Migrate to…"
  homeMigrateTo: 'マイグレーション先……',

  // Original text: "Missing patches"
  homeMissingPatches: '未適用のパッチ一覧',

  // Original text: "Master:"
  homePoolMaster: 'マスター:',

  // Original text: "Resource set: {resourceSet}"
  homeResourceSet: 'リソースセット: {resourceSet}',

  // Original text: 'Some VDIs need to be coalesced'
  homeSrVdisToCoalesce: undefined,

  // Original text: "High Availability"
  highAvailability: 'High Availability',

  // Original text: 'Power state'
  powerState: undefined,

  // Original text: "Shared {type}"
  srSharedType: '共有{type}',

  // Original text: 'Host time and XOA time are not consistent with each other'
  warningHostTimeTooltip: undefined,

  // Original text: 'Not all hosts within {pool} have the same version'
  notAllHostsHaveTheSameVersion: undefined,

  // Original text: 'Disks usage'
  sortByDisksUsage: undefined,

  // Original text: 'Name'
  snapshotVmsName: undefined,

  // Original text: 'Description'
  snapshotVmsDescription: undefined,

  // Original text: "All of them are selected ({nItems, number})"
  sortedTableAllItemsSelected: '選択中({nItems, number})',

  // Original text: 'No items found'
  sortedTableNoItems: undefined,

  // Original text: "{nFiltered, number} of {nTotal, number} items"
  sortedTableNumberOfFilteredItems: 'フィルタ中({nFiltered, number}) 全体({nTotal, number})',

  // Original text: "{nTotal, number} items"
  sortedTableNumberOfItems: '{nTotal, number} 個',

  // Original text: "{nSelected, number} selected"
  sortedTableNumberOfSelectedItems: '{nSelected, number} 選択中',

  // Original text: "Click here to select all items"
  sortedTableSelectAllItems: '全てを選択します',

  // Original text: 'GZIP (very slow)'
  chooseCompressionGzipOption: undefined,

  // Original text: 'Zstd (fast, XCP-ng only)'
  chooseCompressionZstdOption: undefined,

  // Original text: 'State'
  state: undefined,

  // Original text: 'Disabled'
  stateDisabled: undefined,

  // Original text: 'Enabled'
  stateEnabled: undefined,

  // Original text: 'Disk'
  labelDisk: undefined,

  // Original text: 'Merge'
  labelMerge: undefined,

  // Original text: 'Size'
  labelSize: undefined,

  // Original text: 'Speed'
  labelSpeed: undefined,

  // Original text: 'SR'
  labelSr: undefined,

  // Original text: 'Transfer'
  labelTransfer: undefined,

  // Original text: 'VM'
  labelVm: undefined,

  // Original text: 'Cancel'
  formCancel: undefined,

  // Original text: 'Create'
  formCreate: undefined,

  // Original text: 'Description'
  formDescription: undefined,

  // Original text: 'Edit'
  formEdit: undefined,

  // Original text: 'ID'
  formId: undefined,

  // Original text: 'Name'
  formName: undefined,

  // Original text: 'Reset'
  formReset: undefined,

  // Original text: 'Save'
  formSave: undefined,

  // Original text: 'Notes'
  formNotes: undefined,

  // Original text: "Add"
  add: '追加',

  // Original text: "Select all"
  selectAll: '全てを選択',

  // Original text: "Remove"
  remove: '除去',

  // Original text: "Preview"
  preview: 'プレビュー',

  // Original text: 'Action'
  action: undefined,

  // Original text: "Item"
  item: 'アイテム',

  // Original text: "No selected value"
  noSelectedValue: '値が未選択',

  // Original text: "Choose user(s) and/or group(s)"
  selectSubjects: 'ユーザとグループの選択',

  // Original text: "Select object(s)…"
  selectObjects: 'オブジェクトを選択……',

  // Original text: "Choose a role"
  selectRole: '権限を選択',

  // Original text: 'Select a host first'
  selectHostFirst: undefined,

  // Original text: "Select host(s)…"
  selectHosts: 'ホストの選択……',

  // Original text: "Select object(s)…"
  selectHostsVms: 'ホストとVMを選択…',

  // Original text: "Select network(s)…"
  selectNetworks: 'ネットワークの選択……',

  // Original text: 'Select PCI(s)…'
  selectPcis: undefined,

  // Original text: "Select PIF(s)…"
  selectPifs: '物理インタフェイスPIFの選択……',

  // Original text: "Select pool(s)…"
  selectPools: 'プールの選択……',

  // Original text: "Select remote(s)…"
  selectRemotes: 'リモートの選択……',

  // Original text: 'Select proxy(ies)…'
  selectProxies: undefined,

  // Original text: 'Select proxy…'
  selectProxy: undefined,

  // Original text: "Select resource set(s)…"
  selectResourceSets: 'リソースセットの選択……',

  // Original text: "Select template(s)…"
  selectResourceSetsVmTemplate: 'リソースセット内のテンプレートの選択……',

  // Original text: "Select SR(s)…"
  selectResourceSetsSr: 'リソースセット内のストレージリソース(SR)の選択……',

  // Original text: "Select network(s)…"
  selectResourceSetsNetwork: 'リソースセット内のネットワークの選択……',

  // Original text: "Select disk(s)…"
  selectResourceSetsVdi: 'リソースセット内のディスクの選択……',

  // Original text: "Select SSH key(s)…"
  selectSshKey: 'SSHの鍵の選択……',

  // Original text: "Select SR(s)…"
  selectSrs: 'ストレージリソース(SR)の選択……',

  // Original text: "Select VM(s)…"
  selectVms: '仮想マシン(VM)の選択……',

  // Original text: 'Select snapshot(s)…'
  selectVmSnapshots: undefined,

  // Original text: "Select VM template(s)…"
  selectVmTemplates: '仮想マシン(VM)テンプレートの選択……',

  // Original text: "Select tag(s)…"
  selectTags: 'タグの選択……',

  // Original text: "Select disk(s)…"
  selectVdis: '仮想ディスク(VDI)の選択……',

  // Original text: "Select timezone…"
  selectTimezone: 'タイムゾーンの選択……',

  // Original text: "Select IP(s)…"
  selectIp: 'IPアドレスの選択……',

  // Original text: "Select IP pool(s)…"
  selectIpPool: 'IPプールの選択……',

  // Original text: 'Select VGPU type(s)…'
  selectVgpuType: undefined,

  // Original text: "Fill information (optional)"
  fillOptionalInformations: '情報を入力してください (オプション)',

  // Original text: "Reset"
  selectTableReset: '設定初期化',

  // Original text: 'Select cloud config(s)…'
  selectCloudConfigs: undefined,

  // Original text: 'Select network config(s)…'
  selectNetworkConfigs: undefined,

  // Original text: "Month"
  schedulingMonth: '月',

  // Original text: "Day"
  schedulingDay: '日',

  // Original text: "Switch to week days"
  schedulingSetWeekDayMode: '週・日モードに変更',

  // Original text: "Switch to month days"
  schedulingSetMonthDayMode: '月・日モードに変更',

  // Original text: "Hour"
  schedulingHour: '時間',

  // Original text: "Minute"
  schedulingMinute: '分',

  // Original text: "Every month"
  selectTableAllMonth: '毎月',

  // Original text: "Every day"
  selectTableAllDay: '毎日',

  // Original text: "Every hour"
  selectTableAllHour: '毎時',

  // Original text: "Every minute"
  selectTableAllMinute: '毎分',

  // Original text: "Web browser timezone"
  timezonePickerUseLocalTime: 'ウェブブラウザのタイムゾーン',

  // Original text: "Server timezone ({value})"
  serverTimezoneOption: 'サーバのタイムゾーン ({value})',

  // Original text: "Cron Pattern:"
  cronPattern: 'Cronのパターン:',

  // Original text: "Successful"
  successfulJobCall: '成功しました',

  // Original text: "Failed"
  failedJobCall: '失敗しました',

  // Original text: 'Skipped'
  jobCallSkipped: undefined,

  // Original text: "In progress"
  jobCallInProgess: '処理中',

  // Original text: "Transfer size:"
  jobTransferredDataSize: 'データ量 :',

  // Original text: "Transfer speed:"
  jobTransferredDataSpeed: '速度 :',

  // Original text: 'Size'
  operationSize: undefined,

  // Original text: 'Speed'
  operationSpeed: undefined,

  // Original text: 'Type'
  exportType: undefined,

  // Original text: 'Merge size:'
  jobMergedDataSize: undefined,

  // Original text: 'Merge speed:'
  jobMergedDataSpeed: undefined,

  // Original text: 'All'
  allJobCalls: undefined,

  // Original text: "Job"
  job: 'ジョブ',

  // Original text: "Job {job}"
  jobModalTitle: 'ジョブ {job}',

  // Original text: "ID"
  jobId: 'ID',

  // Original text: "Type"
  jobType: 'タイプ',

  // Original text: "Name"
  jobName: '名前',

  // Original text: 'Modes'
  jobModes: undefined,

  // Original text: "Name of your job (forbidden: \"_\")"
  jobNamePlaceholder: 'ジョブ名 ("_"は利用不可)',

  // Original text: "Start"
  jobStart: 'ジョブの開始',

  // Original text: "End"
  jobEnd: 'ジョブの終了',

  // Original text: "Duration"
  jobDuration: 'ジョブの感覚',

  // Original text: "Status"
  jobStatus: 'ジョブの状態',

  // Original text: "Action"
  jobAction: 'ジョブのアクション',

  // Original text: "Tag"
  jobTag: 'ジョブのタグ',

  // Original text: "Scheduling"
  jobScheduling: 'スケジュール',

  // Original text: "Timezone"
  jobTimezone: 'タイムゾーン',

  // Original text: "Server"
  jobServerTimezone: 'xo-server',

  // Original text: "Run job"
  runJob: 'ジョブの実行',

  // Original text: 'Cancel job'
  cancelJob: undefined,

  // Original text: "Onetime job started. See overview for logs."
  runJobVerbose: '1回のみ実行しています。ログを確認してください。',

  // Original text: 'Edit job'
  jobEdit: undefined,

  // Original text: 'Delete'
  jobDelete: undefined,

  // Original text: "Finished"
  jobFinished: '終了しました',

  // Original text: 'Interrupted'
  jobInterrupted: undefined,

  // Original text: "Started"
  jobStarted: 'スタートしました',

  // Original text: 'Failed'
  jobFailed: undefined,

  // Original text: 'Skipped'
  jobSkipped: undefined,

  // Original text: 'Successful'
  jobSuccess: undefined,

  // Original text: 'All'
  allTasks: undefined,

  // Original text: 'Start'
  taskStart: undefined,

  // Original text: 'End'
  taskEnd: undefined,

  // Original text: 'Duration'
  taskDuration: undefined,

  // Original text: 'Successful'
  taskSuccess: undefined,

  // Original text: 'Failed'
  taskFailed: undefined,

  // Original text: 'Skipped'
  taskSkipped: undefined,

  // Original text: 'Started'
  taskStarted: undefined,

  // Original text: 'Interrupted'
  taskInterrupted: undefined,

  // Original text: 'Aborted'
  taskAborted: undefined,

  // Original text: 'Transfer size'
  taskTransferredDataSize: undefined,

  // Original text: 'Transfer speed'
  taskTransferredDataSpeed: undefined,

  // Original text: 'Merge size'
  taskMergedDataSize: undefined,

  // Original text: 'Merge speed'
  taskMergedDataSpeed: undefined,

  // Original text: 'Error'
  taskError: undefined,

  // Original text: 'Estimated end'
  taskEstimatedEnd: undefined,

  // Original text: 'Reason'
  taskReason: undefined,

  // Original text: 'Open raw log'
  taskOpenRawLog: undefined,

  // Original text: "Save"
  saveBackupJob: 'バックアップジョブの保存',

  // Original text: "Remove backup job"
  deleteBackupSchedule: 'バックアップジョブを削除',

  // Original text: "Are you sure you want to delete this backup job?"
  deleteBackupScheduleQuestion: 'バックアップジョブを削除しても良いですか？',

  // Original text: 'Delete selected jobs'
  deleteSelectedJobs: undefined,

  // Original text: "Enable immediately after creation"
  scheduleEnableAfterCreation: '作成後、すぐに有効化する',

  // Original text: "You are editing schedule {name} ({id}). Saving will override previous schedule state."
  scheduleEditMessage: 'スケジュール{name}({id})を編集しています。保存は、前回のスケジュール状態を上書きします。',

  // Original text: "You are editing job {name} ({id}). Saving will override previous job state."
  jobEditMessage: 'ジョブ{name} ({id})を編集しています。保存は、前回のジョブ状態を上書きします。',

  // Original text: 'Edit schedule'
  scheduleEdit: undefined,

  // Original text: "A name is required to create the backup's job!"
  missingBackupName: undefined,

  // Original text: 'Missing VMs!'
  missingVms: undefined,

  // Original text: 'You need to choose a backup mode!'
  missingBackupMode: undefined,

  // Original text: 'Missing remote!'
  missingRemote: undefined,

  // Original text: 'Missing remotes!'
  missingRemotes: undefined,

  // Original text: 'Missing SRs!'
  missingSrs: undefined,

  // Original text: 'Missing pools!'
  missingPools: undefined,

  // Original text: 'Missing schedules!'
  missingSchedules: undefined,

  // Original text: 'The modes need at least a schedule with retention higher than 0'
  missingRetentions: undefined,

  // Original text: 'The Backup mode and the Delta Backup mode require backup retention to be higher than 0!'
  missingExportRetention: undefined,

  // Original text: 'The CR mode and The DR mode require replication retention to be higher than 0!'
  missingCopyRetention: undefined,

  // Original text: 'The Rolling Snapshot mode requires snapshot retention to be higher than 0!'
  missingSnapshotRetention: undefined,

  // Original text: 'Either the full backup interval or the backup retention should be lower than 50.'
  deltaChainRetentionWarning: undefined,

  // Original text: 'Requires one retention to be higher than 0!'
  retentionNeeded: undefined,

  // Original text: 'Invalid schedule'
  newScheduleError: undefined,

  // Original text: 'No remotes found, please click on the remotes settings button to create one!'
  createRemoteMessage: undefined,

  // Original text: 'Remotes settings'
  remotesSettings: undefined,

  // Original text: 'Plugins settings'
  pluginsSettings: undefined,

  // Original text: 'To receive the report, the plugins backup-reports and transport-email need to be loaded.'
  pluginsWarning: undefined,

  // Original text: 'Select a schedule…'
  selectSchedule: undefined,

  // Original text: 'Add a schedule'
  scheduleAdd: undefined,

  // Original text: 'Delete'
  scheduleDelete: undefined,

  // Original text: 'Run schedule'
  scheduleRun: undefined,

  // Original text: 'Unnamed schedule'
  unnamedSchedule: undefined,

  // Original text: 'Delete selected schedules'
  deleteSelectedSchedules: undefined,

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'スケジュールジョブがありません。',

  // Original text: 'You can delete all your legacy backup snapshots.'
  legacySnapshotsLink: undefined,

  // Original text: 'New schedule'
  newSchedule: undefined,

  // Original text: "No schedules found"
  noSchedules: 'スケジュールがありません。',

  // Original text: "Select an xo-server API command"
  jobActionPlaceHolder: 'xo-server APIコマンドを選択してください。',

  // Original text: "Timeout (number of seconds after which a VM is considered failed)"
  jobTimeoutPlaceHolder: 'タイムアウト(VMが故障したと見なされるまでの秒数)',

  // Original text: "Schedules"
  jobSchedules: 'スケジュール',

  // Original text: "Name of your schedule"
  jobScheduleNamePlaceHolder: 'スケジュールの名称',

  // Original text: "Select a job"
  jobScheduleJobPlaceHolder: 'ジョブの選択',

  // Original text: "Job owner"
  jobOwnerPlaceholder: 'ジョブのオーナー',

  // Original text: "This job's creator no longer exists"
  jobUserNotFound: 'このジョブの作成者は既にいません。',

  // Original text: 'Click here to see the matching VMs'
  redirectToMatchingVms: undefined,

  // Original text: 'There are no matching VMs!'
  noMatchingVms: undefined,

  // Original text: '{icon} See the matching VMs ({nMatchingVms, number})'
  allMatchingVms: undefined,

  // Original text: 'Are you sure you want to run {name} ({id})?'
  runBackupNgJobConfirm: undefined,

  // Original text: 'This job will backup {nVms, number} VM{nVms, plural, one {} other {s}}.'
  runBackupJobWarningNVms: undefined,

  // Original text: 'Are you sure you want to cancel {name} ({id})?'
  cancelJobConfirm: undefined,

  // Original text: 'If your country participates in DST, it is advised that you avoid scheduling jobs at the time of change. e.g. 2AM to 3AM for US.'
  scheduleDstWarning: undefined,

  // Original text: 'Restore health check'
  checkBackup: undefined,

  // Original text: 'Advanced settings'
  newBackupAdvancedSettings: undefined,

  // Original text: 'Settings'
  newBackupSettings: undefined,

  // Original text: 'Always'
  reportWhenAlways: undefined,

  // Original text: 'Skipped and failure'
  reportWhenSkippedFailure: undefined,

  // Original text: 'Failure'
  reportWhenFailure: undefined,

  // Original text: 'Never'
  reportWhenNever: undefined,

  // Original text: 'Report recipients'
  reportRecipients: undefined,

  // Original text: 'Report when'
  reportWhen: undefined,

  // Original text: 'Concurrency'
  concurrency: undefined,

  // Original text: "Select your backup type:"
  newBackupSelection: 'バックアップタイプ:',

  // Original text: 'Snapshot retention'
  snapshotRetention: undefined,

  // Original text: 'Name'
  backupName: undefined,

  // Original text: 'Checkpoint snapshot'
  checkpointSnapshot: undefined,

  // Original text: 'Offline snapshot'
  offlineSnapshot: undefined,

  // Original text: 'Offline backup'
  offlineBackup: undefined,

  // Original text: 'Export VMs without snapshotting them. The VMs will be shutdown during the export.'
  offlineBackupInfo: undefined,

  // Original text: 'Timeout'
  timeout: undefined,

  // Original text: 'Number of hours after which a job is considered failed'
  timeoutInfo: undefined,

  // Original text: 'Full backup interval'
  fullBackupInterval: undefined,

  // Original text: 'Force full backup'
  forceFullBackup: undefined,

  // Original text: 'In hours'
  timeoutUnit: undefined,

  // Original text: 'Delta Backup and DR require an Enterprise plan'
  dbAndDrRequireEnterprisePlan: undefined,

  // Original text: 'CR requires a Premium plan'
  crRequiresPremiumPlan: undefined,

  // Original text: 'Smart mode'
  smartBackupModeTitle: undefined,

  // Original text: 'Target remotes (for export)'
  backupTargetRemotes: undefined,

  // Original text: 'Target SRs (for replication)'
  backupTargetSrs: undefined,

  // Original text: "Local remote selected"
  localRemoteWarningTitle: '選択されたローカル、リモート',

  // Original text: 'Tip: Using thin-provisioned storage will consume less space. Please click on the icon to get more information'
  crOnThickProvisionedSrWarning: undefined,

  // Original text: 'Tip: Creating VMs on thin-provisioned storage will consume less space. Please click on the icon to get more information'
  vmsOnThinProvisionedSrTip: undefined,

  // Original text: 'Delta Backup and Continuous Replication require at least XenServer 6.5.'
  deltaBackupOnOutdatedXenServerWarning: undefined,

  // Original text: 'Click for more information about the backup methods.'
  backupNgLinkToDocumentationMessage: undefined,

  // Original text: "Warning: Local remotes will use limited XOA disk space. Only for advanced users."
  localRemoteWarningMessage:
    '注意：ローカルリモートは、限定されたXOAディスク空間を利用します。アドバンスユーザのみの機能です。',

  // Original text: "VMs"
  editBackupVmsTitle: 'VMs',

  // Original text: "VMs statuses"
  editBackupSmartStatusTitle: 'VMの状態',

  // Original text: "Resident on"
  editBackupSmartResidentOn: '搭載中：',

  // Original text: 'Not resident on'
  editBackupSmartNotResidentOn: undefined,

  // Original text: "Pools"
  editBackupSmartPools: 'プール',

  // Original text: "Tags"
  editBackupSmartTags: 'スマートタグ',

  // Original text: "VMs with tags in the form of <b>xo:no-bak</b> or <b>xo:no-bak=Reason</b>won't be included in any backup.For example, ephemeral VMs created by health check have this tag"
  editBackupSmartTagsInfo: undefined,

  // Original text: 'Sample of matching VMs'
  sampleOfMatchingVms: undefined,

  // Original text: 'Replicated VMs (VMs with Continuous Replication or Disaster Recovery tag) must be excluded!'
  backupReplicatedVmsInfo: undefined,

  // Original text: "VMs Tags"
  editBackupSmartTagsTitle: 'VMのスマートタグ',

  // Original text: 'Excluded VMs tags'
  editBackupSmartExcludedTagsTitle: undefined,

  // Original text: "Delete first"
  deleteOldBackupsFirst: '古いバックアップを最初に削除する',

  // Original text: 'Delete old backups before backing up the VMs. If the new backup fails, you will lose your old backups.'
  deleteOldBackupsFirstMessage: undefined,

  // Original text: 'Custom tag'
  customTag: undefined,

  // Original text: "The job you're trying to edit wasn't found"
  editJobNotFound: undefined,

  // Original text: 'Use NBD + CBT to transfer disk if available'
  preferNbd: undefined,

  // Original text: 'A network accessible by XO or the proxy must have NBD enabled. Storage must support Change Block Tracking (CBT) to use it in a backup'
  preferNbdInformation: undefined,

  // Original text: 'Number of NBD connection per disk'
  nbdConcurrency: undefined,

  // Original text: 'Purge snapshot data when using CBT'
  cbtDestroySnapshotData: undefined,

  // Original text: "The snapshot won't use any notable space on the SR, won't be shown in the UI and won't be usable to do a rollback"
  cbtDestroySnapshotDataInformation: undefined,

  // Original text: 'Snapshot data can be purged only when NBD is enabled and rolling snapshot is not used'
  cbtDestroySnapshotDataDisabledInformation: undefined,

  // Original text: 'Shorter backup reports'
  shorterBackupReports: undefined,

  // Original text: "New file system remote"
  newRemote: '新規リモートファイルシステム',

  // Original text: "Local"
  remoteTypeLocal: 'ローカル',

  // Original text: "NFS"
  remoteTypeNfs: 'NFS',

  // Original text: "SMB"
  remoteTypeSmb: 'SMB',

  // Original text: 'Amazon Web Services S3'
  remoteTypeS3: undefined,

  // Original text: "Type"
  remoteType: 'タイプ',

  // Original text: 'SMB remotes are meant to work with Windows Server. For other systems (Linux Samba, which means almost all NAS), please use NFS.'
  remoteSmbWarningMessage: undefined,

  // Original text: "Test your remote"
  remoteTestTip: 'リモートのテストをすると良いでしょう',

  // Original text: "Test remote"
  testRemote: 'リモートのテスト',

  // Original text: "Test failed for {name}"
  remoteTestFailure: 'リモートテスト名：{name}',

  // Original text: "Test passed for {name}"
  remoteTestSuccess: 'リモートテストの成功 {name}',

  // Original text: "Error"
  remoteTestError: 'テストエラー',

  // Original text: "Test step"
  remoteTestStep: 'テストステップ',

  // Original text: "Test name"
  remoteTestName: 'テスト名',

  // Original text: "Remote name already exists!"
  remoteTestNameFailure: 'リモートテスト名は既に存在しています。',

  // Original text: "The remote appears to work correctly"
  remoteTestSuccessMessage: 'リモートテストは正常に動作しました',

  // Original text: "Connection failed"
  remoteConnectionFailed: '接続に失敗しました',

  // Original text: 'Delete backup job{nJobs, plural, one {} other {s}}'
  confirmDeleteBackupJobsTitle: undefined,

  // Original text: 'Are you sure you want to delete {nJobs, number} backup job{nJobs, plural, one {} other {s}}?'
  confirmDeleteBackupJobsBody: undefined,

  // Original text: 'Mirror full backup'
  mirrorFullBackup: undefined,

  // Original text: 'Mirror incremental backup'
  mirrorIncrementalBackup: undefined,

  // Original text: 'Run backup job once'
  runBackupJob: undefined,

  // Original text: 'Speed limit (in MiB/s)'
  speedLimit: undefined,

  // Original text: 'Source remote'
  sourceRemote: undefined,

  // Original text: 'Target remotes'
  targetRemotes: undefined,

  // Original text: "Name"
  remoteName: 'リモート名',

  // Original text: "Path"
  remotePath: 'リモートパス',

  // Original text: "State"
  remoteState: 'リモートの状態',

  // Original text: "Device"
  remoteDevice: 'リモートデバイス',

  // Original text: 'Disk (Used / Total)'
  remoteDisk: undefined,

  // Original text: 'Speed (Write / Read)'
  remoteSpeed: undefined,

  // Original text: 'Read and write rate speed performed during latest test'
  remoteSpeedInfo: undefined,

  // Original text: 'Options'
  remoteOptions: undefined,

  // Original text: "Share"
  remoteShare: 'リモート共有',

  // Original text: "Auth"
  remoteAuth: '認証(Auth)',

  // Original text: "Delete"
  remoteDeleteTip: '削除',

  // Original text: 'Delete selected remotes'
  remoteDeleteSelected: undefined,

  // Original text: "Name"
  remoteMyNamePlaceHolder: '名前*',

  // Original text: "/path/to/backup"
  remoteLocalPlaceHolderPath: '/path/to/backup',

  // Original text: "Host"
  remoteNfsPlaceHolderHost: 'host *',

  // Original text: 'Port'
  remoteNfsPlaceHolderPort: undefined,

  // Original text: "path/to/backup"
  remoteNfsPlaceHolderPath: 'path/to/backup',

  // Original text: 'Custom mount options'
  remoteNfsPlaceHolderOptions: undefined,

  // Original text: "Subfolder [path\\\\to\\\\backup]"
  remoteSmbPlaceHolderRemotePath: 'subfolder [path\\to\\backup]',

  // Original text: "Username"
  remoteSmbPlaceHolderUsername: 'ユーザ名',

  // Original text: "Password"
  remoteSmbPlaceHolderPassword: 'パスワード',

  // Original text: "Domain"
  remoteSmbPlaceHolderDomain: 'ドメイン',

  // Original text: "<address>\\\\<share>"
  remoteSmbPlaceHolderAddressShare: '<address>\\<share> *',

  // Original text: 'Custom mount options'
  remoteSmbPlaceHolderOptions: undefined,

  // Original text: "Use HTTPS"
  remoteS3LabelUseHttps: 'HTTPSを利用する',

  // Original text: "Allow unauthorized"
  remoteS3LabelAllowInsecure: 'Insecureを許可する',

  // Original text: "AWS S3 endpoint (ex: s3.us-east-2.amazonaws.com)"
  remoteS3PlaceHolderEndpoint: 'AWS S3 endpoint (ex: s3.us-east-2.amazonaws.com)',

  // Original text: "AWS S3 bucket name"
  remoteS3PlaceHolderBucket: 'AWS S3 bucket name',

  // Original text: "Directory"
  remoteS3PlaceHolderDirectory: 'Directory',

  // Original text: "Access key ID"
  remoteS3PlaceHolderAccessKeyID: 'Access key ID',

  // Original text: "Paste secret here to change it"
  remoteS3PlaceHolderSecret: 'Paste secret here to change it',

  // Original text: "Enter your encryption key here (32 characters)"
  remoteS3PlaceHolderEncryptionKey: 'Enter your encryption key here (32 characters)',

  // Original text: "Region, leave blank for default"
  remoteS3Region: 'Region, leave blank for default',

  // Original text: "Uncheck if you want HTTP instead of HTTPS"
  remoteS3TooltipProtocol: 'Uncheck if you want HTTP instead of HTTPS',

  // Original text: "Check if you want to accept self signed certificates"
  remoteS3TooltipAcceptInsecure: 'Check if you want to accept self signed certificates',

  // Original text: "Password(fill to edit)"
  remotePlaceHolderPassword: 'password(fill to edit)',

  // Original text: 'Store backup as multiple data blocks instead of a whole VHD file. (creates 500-1000 files per backed up GB but allows faster merge)'
  remoteUseVhdDirectory: undefined,

  // Original text: 'Your remote must be able to handle parallel access (up to 16 write processes per backup) and the number of files (500-1000 files per GB of backed up data)'
  remoteUseVhdDirectoryTooltip: undefined,

  // Original text: 'Size of backup is not updated when using encryption.'
  remoteEncryptionBackupSize: undefined,

  // Original text: 'All the files of the remote except the encryption.json are encrypted, that means you can only activate encryption or change key on an empty remote.'
  remoteEncryptionEncryptedfiles: undefined,

  // Original text: 'Delta backup must use VHD saved as blocks (note: should be enforced when saving settings)'
  remoteEncryptionMustUseVhd: undefined,

  // Original text: 'Encrypt all new data sent to this remote'
  remoteEncryptionKey: undefined,

  // Original text: "You won't be able to get your data back if you lose the encryption key. The encryption key is saved in the XO config backup, they should be secured correctly. Be careful, if you saved it on an encrypted remote, then you won't be able to access it without the remote encryption key."
  remoteEncryptionKeyStorageLocation: undefined,

  // Original text: 'Encryption'
  encryption: undefined,

  // Original text: 'A legacy encryption algorithm is used ({algorithm}), please create a new remote with the recommended algorithm {recommendedAlgorithm}'
  remoteEncryptionLegacy: undefined,

  // Original text: 'New SR'
  newSr: undefined,

  // Original text: 'This will erase the entire disk or partition ({name}) to create a new storage repository. Are you sure you want to continue?'
  newSrConfirm: undefined,

  // Original text: 'SR{n, plural, one {} other {s}} already exist on this device, as noted in the Storage Usage section. Creating this SR may erase the content of {path} and cause the loss of existing SR{n, plural, one {} other {s}}. Are you sure you want to continue?'
  newSrExistingSr: undefined,

  // Original text: "Create a new SR"
  newSrTitle: '新規ストレージリソース(SR)を作成します',

  // Original text: "General"
  newSrGeneral: '一般',

  // Original text: "Select storage type:"
  newSrTypeSelection: 'ストレージタイプの選択:',

  // Original text: "Settings"
  newSrSettings: 'SRの設定',

  // Original text: "Storage usage"
  newSrUsage: 'SRの利用量',

  // Original text: "Summary"
  newSrSummary: 'SRの概要',

  // Original text: "Host"
  newSrHost: 'SRホスト',

  // Original text: "Type"
  newSrType: 'SRタイプ',

  // Original text: "Name"
  newSrName: 'SR名',

  // Original text: "Description"
  newSrDescription: 'SRの説明文',

  // Original text: "Server"
  newSrServer: 'SRサーバ',

  // Original text: "Path"
  newSrPath: 'SRパス',

  // Original text: "IQN"
  newSrIqn: 'IQN',

  // Original text: "LUN"
  newSrLun: 'LUN',

  // Original text: 'No HBA devices'
  newSrNoHba: undefined,

  // Original text: "With auth."
  newSrAuth: '(要認証)',

  // Original text: "User name"
  newSrUsername: 'ユーザ名',

  // Original text: "Password"
  newSrPassword: 'パスワード',

  // Original text: "Device"
  newSrDevice: 'デバイス',

  // Original text: "In use"
  newSrInUse: '使用中',

  // Original text: "Size"
  newSrSize: 'サイズ',

  // Original text: "Create"
  newSrCreate: '作成',

  // Original text: "Storage name"
  newSrNamePlaceHolder: 'ストレージ名',

  // Original text: "Storage description"
  newSrDescPlaceHolder: 'ストレージの説明',

  // Original text: 'e.g 93.184.216.34 or iscsi.example.net'
  newSrIscsiAddressPlaceHolder: undefined,

  // Original text: 'e.g 93.184.216.34 or nfs.example.net'
  newSrNfsAddressPlaceHolder: undefined,

  // Original text: 'e.g \\\\server\\sharename'
  newSrSmbAddressPlaceHolder: undefined,

  // Original text: "[port]"
  newSrPortPlaceHolder: '[port]',

  // Original text: "Username"
  newSrUsernamePlaceHolder: 'Username',

  // Original text: "Password"
  newSrPasswordPlaceHolder: 'Password',

  // Original text: "Device, e.g /dev/sda…"
  newSrLvmDevicePlaceHolder: 'Device, e.g /dev/sda…',

  // Original text: "/path/to/directory"
  newSrLocalPathPlaceHolder: '/path/to/directory',

  // Original text: 'Default NFS version'
  newSrNfsDefaultVersion: undefined,

  // Original text: 'Comma delimited NFS options'
  newSrNfsOptions: undefined,

  // Original text: 'NFS version'
  newSrNfs: undefined,

  // Original text: 'No shared ZFS available'
  noSharedZfsAvailable: undefined,

  // Original text: 'Reattach SR'
  reattachNewSrTooltip: undefined,

  // Original text: 'Storage location'
  srLocation: undefined,

  // Original text: 'You do not have permission to create a network'
  createNewNetworkNoPermission: undefined,

  // Original text: 'Create a new network on {select}'
  createNewNetworkOn: undefined,

  // Original text: "Users/Groups"
  subjectName: 'Users/Groups',

  // Original text: "Object"
  objectName: 'Object',

  // Original text: "Role"
  roleName: 'Role',

  // Original text: "Create"
  aclCreate: 'Create',

  // Original text: "New group name"
  newGroupName: 'New Group Name',

  // Original text: "Create group"
  createGroup: 'Create Group',

  // Original text: 'Synchronize LDAP groups'
  syncLdapGroups: undefined,

  // Original text: 'Install and configure the auth-ldap plugin first'
  ldapPluginNotConfigured: undefined,

  // Original text: 'Are you sure you want to synchronize LDAP groups with XO? This may delete XO groups and their ACLs.'
  syncLdapGroupsWarning: undefined,

  // Original text: "Create"
  createGroupButton: 'Create',

  // Original text: "Delete group"
  deleteGroup: 'Delete Group',

  // Original text: "Are you sure you want to delete this group?"
  deleteGroupConfirm: 'Are you sure you want to delete this group?',

  // Original text: 'Delete selected groups'
  deleteSelectedGroups: undefined,

  // Original text: 'Delete group{nGroups, plural, one {} other {s}}'
  deleteGroupsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nGroups, number} group{nGroups, plural, one {} other {s}}?'
  deleteGroupsModalMessage: undefined,

  // Original text: "Remove user from group"
  removeUserFromGroup: 'Remove user from Group',

  // Original text: "Are you sure you want to delete this user?"
  deleteUserConfirm: 'Are you sure you want to delete this user?',

  // Original text: "Delete user"
  deleteUser: 'Delete User',

  // Original text: 'Delete selected users'
  deleteSelectedUsers: undefined,

  // Original text: 'Delete user{nUsers, plural, one {} other {s}}'
  deleteUsersModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nUsers, number} user{nUsers, plural, one {} other {s}}?'
  deleteUsersModalMessage: undefined,

  // Original text: "No user"
  noUser: 'no user',

  // Original text: "Unknown user"
  unknownUser: 'unknown user',

  // Original text: "No group found"
  noGroupFound: 'No group found',

  // Original text: "Name"
  groupNameColumn: 'Name',

  // Original text: "Users"
  groupUsersColumn: 'Users',

  // Original text: "Add user"
  addUserToGroupColumn: 'Add User',

  // Original text: "Username"
  userNameColumn: 'Email',

  // Original text: 'Member of'
  userGroupsColumn: undefined,

  // Original text: '{nGroups, number} group{nGroups, plural, one {} other {s}}'
  userCountGroups: undefined,

  // Original text: "Permissions"
  userPermissionColumn: 'Permissions',

  // Original text: 'Password / Authentication methods'
  userAuthColumn: undefined,

  // Original text: "Username"
  userName: 'Email',

  // Original text: "Password"
  userPassword: 'Password',

  // Original text: "Create"
  createUserButton: 'Create',

  // Original text: "No user found"
  noUserFound: 'No user found',

  // Original text: "User"
  userLabel: 'User',

  // Original text: "Admin"
  adminLabel: 'Admin',

  // Original text: "No user in group"
  noUserInGroup: 'No user in group',

  // Original text: "{users, number} user{users, plural, one {} other {s}}"
  countUsers: '{users, number} user{users, plural, one {} other {s}}',

  // Original text: "Select permission"
  selectPermission: 'Select Permission',

  // Original text: 'Delete ACL'
  deleteAcl: undefined,

  // Original text: 'Delete selected ACLs'
  deleteSelectedAcls: undefined,

  // Original text: 'Delete ACL{nAcls, plural, one {} other {s}}'
  deleteAclsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nAcls, number} ACL{nAcls, plural, one {} other {s}}?'
  deleteAclsModalMessage: undefined,

  // Original text: "No plugins found"
  noPlugins: 'No plugins found',

  // Original text: "Auto-load at server start"
  autoloadPlugin: 'Auto-load at server start',

  // Original text: "Save configuration"
  savePluginConfiguration: 'Save configuration',

  // Original text: "Delete configuration"
  deletePluginConfiguration: 'Delete configuration',

  // Original text: 'The test appears to be working.'
  pluginConfirmation: undefined,

  // Original text: "Plugin error"
  pluginError: 'Plugin error',

  // Original text: 'Plugin test'
  pluginTest: undefined,

  // Original text: "Unknown error"
  unknownPluginError: 'Unknown error',

  // Original text: "Purge plugin configuration"
  purgePluginConfiguration: 'Purge plugin configuration',

  // Original text: "Are you sure you want to purge this configuration?"
  purgePluginConfigurationQuestion: 'Are you sure you want to purge this configuration ?',

  // Original text: "Cancel"
  cancelPluginEdition: 'Cancel',

  // Original text: "Plugin configuration"
  pluginConfigurationSuccess: 'Plugin configuration',

  // Original text: "Plugin configuration successfully saved!"
  pluginConfigurationChanges: 'Plugin configuration successfully saved!',

  // Original text: "Predefined configuration"
  pluginConfigurationPresetTitle: 'Predefined configuration',

  // Original text: "Choose a predefined configuration."
  pluginConfigurationChoosePreset: 'Choose a predefined configuration.',

  // Original text: "Apply"
  applyPluginPreset: 'Apply',

  // Original text: 'This plugin is not loaded'
  disabledTestPluginTootltip: undefined,

  // Original text: "Save filter error"
  saveNewUserFilterErrorTitle: 'Save filter error',

  // Original text: "Bad parameter: name must be given."
  saveNewUserFilterErrorBody: 'Bad parameter: name must be given.',

  // Original text: "Name:"
  filterName: 'Name:',

  // Original text: "Value:"
  filterValue: 'Value:',

  // Original text: "Save new filter"
  saveNewFilterTitle: 'Save new filter',

  // Original text: "Remove custom filter"
  removeUserFilterTitle: 'Remove custom filter',

  // Original text: "Are you sure you want to remove the custom filter?"
  removeUserFilterBody: 'Are you sure you want to remove custom filter?',

  // Original text: "Default filter"
  defaultFilter: 'Default filter',

  // Original text: "Default filters"
  defaultFilters: 'Default filters',

  // Original text: "Custom filters"
  customFilters: 'Custom filters',

  // Original text: "Customize filters"
  customizeFilters: 'Customize filters',

  // Original text: 'Interpool copy requires at least Enterprise plan'
  cantInterPoolCopy: undefined,

  // Original text: 'Copy the export URL of the VM'
  copyExportedUrl: undefined,

  // Original text: 'Download VM'
  downloadVm: undefined,

  // Original text: "Start"
  startVmLabel: '仮想マシンの起動',

  // Original text: 'Start on…'
  startVmOnLabel: undefined,

  // Original text: 'No host selected'
  startVmOnMissingHostTitle: undefined,

  // Original text: 'You must select a host'
  startVmOnMissingHostMessage: undefined,

  // Original text: "Recovery start"
  recoveryModeLabel: 'Recovery start',

  // Original text: "Suspend"
  suspendVmLabel: 'サスペンド(停止)',

  // Original text: "Pause"
  pauseVmLabel: '一時停止',

  // Original text: "Stop"
  stopVmLabel: '仮想マシンの終了',

  // Original text: "Force shutdown"
  forceShutdownVmLabel: '強制終了',

  // Original text: "Reboot"
  rebootVmLabel: '仮想マシンのリブート',

  // Original text: "Force reboot"
  forceRebootVmLabel: '強制リブート',

  // Original text: "Delete"
  deleteVmLabel: 'Delete',

  // Original text: 'Delete selected VMs'
  deleteSelectedVmsLabel: undefined,

  // Original text: "Migrate"
  migrateVmLabel: '移設(マイグレーション)',

  // Original text: "Snapshot"
  snapshotVmLabel: 'スナップショット',

  // Original text: "Export"
  exportVmLabel: 'エクスポート',

  // Original text: "Resume"
  resumeVmLabel: '仮想マシンのレジューム(サスペンドからの復旧)',

  // Original text: "Copy"
  copyVmLabel: '仮想マシンの複製',

  // Original text: "Clone"
  cloneVmLabel: 'Clone',

  // Original text: 'Clean VM directory'
  cleanVm: undefined,

  // Original text: "Fast clone"
  fastCloneVmLabel: 'Fast clone',

  // Original text: 'Start the migrated VM'
  startMigratedVm: undefined,

  // Original text: "Console"
  vmConsoleLabel: 'コンソール',

  // Original text: 'The URL is valid once for a short period of time.'
  vmExportUrlValidity: undefined,

  // Original text: 'Warm migration'
  vmWarmMigration: undefined,

  // Original text: 'Warm migration process will first create a copy of the VM on the destination while the source VM is still running, then shutdown the source VM and send the changes that happened during the migration to the destination to minimize downtime.'
  vmWarmMigrationProcessInfo: undefined,

  // Original text: 'Backup'
  backupLabel: undefined,

  // Original text: '{n, number} base cop{n, plural, one {y} other {ies}} ({usage})'
  baseCopyTooltip: undefined,

  // Original text: '{name} ({usage})'
  diskTooltip: undefined,

  // Original text: '{n, number} snapshot{n, plural, one {} other {s}} ({usage})'
  snapshotsTooltip: undefined,

  // Original text: '{name} ({usage}) on {vmName}'
  vdiOnVmTooltip: undefined,

  // Original text: '{n, number} VDI{n, plural, one {} other {s}} ({usage})'
  vdisTooltip: undefined,

  // Original text: 'Provisioning'
  provisioning: undefined,

  // Original text: 'Depth'
  srUnhealthyVdiDepth: undefined,

  // Original text: 'Name'
  srUnhealthyVdiNameLabel: undefined,

  // Original text: 'Size'
  srUnhealthyVdiSize: undefined,

  // Original text: 'VDI to coalesce ({total, number})'
  srUnhealthyVdiTitle: undefined,

  // Original text: 'UUID'
  srUnhealthyVdiUuid: undefined,

  // Original text: 'No stats'
  srNoStats: undefined,

  // Original text: 'IOPS'
  statsIops: undefined,

  // Original text: 'IO throughput'
  statsIoThroughput: undefined,

  // Original text: 'Latency'
  statsLatency: undefined,

  // Original text: 'IOwait'
  statsIowait: undefined,

  // Original text: "Rescan all disks"
  srRescan: 'Rescan all disks',

  // Original text: "Connect to all hosts"
  srReconnectAll: 'Connect to all hosts',

  // Original text: "Disconnect from all hosts"
  srDisconnectAll: 'Disconnect from all hosts',

  // Original text: "Forget this SR"
  srForget: 'Forget this SR',

  // Original text: "Forget SRs"
  srsForget: 'Forget SRs',

  // Original text: 'Forget {nSrs, number} SR{nSrs, plural, one {} other{s}}'
  nSrsForget: undefined,

  // Original text: "Remove this SR"
  srRemoveButton: 'Remove this SR',

  // Original text: "No VDIs in this storage"
  srNoVdis: 'No VDIs in this storage',

  // Original text: 'Reclaim freed space'
  srReclaimSpace: undefined,

  // Original text: 'Are you sure you want to reclaim freed space on this SR?'
  srReclaimSpaceConfirm: undefined,

  // Original text: 'Space reclaim not supported. Only supported on block based/LVM based SRs.'
  srReclaimSpaceNotSupported: undefined,

  // Original text: '{firstVdi} and {nVdis} more'
  multipleActiveVdis: undefined,

  // Original text: 'No active VDI'
  noActiveVdi: undefined,

  // Original text: 'Earliest expiration: {dateString}'
  earliestExpirationDate: undefined,

  // Original text: 'No XCP-ng Pro support enabled on this pool'
  poolNoSupport: undefined,

  // Original text: 'Only {nHostsLicense, number} host{nHostsLicense, plural, one {} other {s}} under license on {nHosts, number} host{nHosts, plural, one {} other {s}}. This means this pool is not supported at all until you license all its hosts.'
  poolPartialSupport: undefined,

  // Original text: "Pool RAM usage:"
  poolTitleRamUsage: 'Pool RAM usage:',

  // Original text: "{used} used of {total} ({free} free)"
  poolRamUsage: '{used} used on {total}',

  // Original text: "Master:"
  poolMaster: 'Master:',

  // Original text: "Display all hosts of this pool"
  displayAllHosts: 'Display all hosts of this pool',

  // Original text: "Display all storage for this pool"
  displayAllStorages: 'Display all storages of this pool',

  // Original text: "Display all VMs of this pool"
  displayAllVMs: 'Display all VMs of this pool',

  // Original text: 'License restrictions'
  licenseRestrictions: undefined,

  // Original text: 'Warning: You are using a Free XenServer license'
  licenseRestrictionsModalTitle: undefined,

  // Original text: 'Some functionality is restricted.'
  actionsRestricted: undefined,

  // Original text: 'You can:'
  counterRestrictionsOptions: undefined,

  // Original text: 'upgrade to XCP-ng for free to get rid of these restrictions'
  counterRestrictionsOptionsXcp: undefined,

  // Original text: 'or get a commercial Citrix license'
  counterRestrictionsOptionsXsLicense: undefined,

  // Original text: "Hosts"
  hostsTabName: 'Hosts',

  // Original text: "VMs"
  vmsTabName: 'Vms',

  // Original text: "SRs"
  srsTabName: 'Srs',

  // Original text: 'Backup network'
  backupNetwork: undefined,

  // Original text: 'Crash dump SR'
  crashDumpSr: undefined,

  // Original text: 'Default migration network'
  defaultMigrationNetwork: undefined,

  // Original text: 'Migration compression'
  migrationCompression: undefined,

  // Original text: 'Migration compression is not available on this pool'
  migrationCompressionDisabled: undefined,

  // Original text: 'Disabling high availability'
  poolDisableHa: undefined,

  // Original text: 'Are you sure you want to disable high availability on this pool?'
  poolDisableHaConfirm: undefined,

  // Original text: 'Enabling high availability'
  poolEnableHa: undefined,

  // Original text: 'Edit all'
  poolEditAll: undefined,

  // Original text: 'Select heartbeat SR candidates'
  poolHaSelectSrs: undefined,

  // Original text: 'The XAPI will pick one of these SR as heartbeat SR'
  poolHaSelectSrsDetails: undefined,

  // Original text: "Enabled"
  poolHaEnabled: 'Enabled',

  // Original text: "Disabled"
  poolHaDisabled: 'Disabled',

  // Original text: "High Availability"
  poolHaStatus: 'High Availability',

  // Original text: 'Heartbeat SR'
  poolHeartbeatSr: undefined,

  // Original text: 'GPU groups'
  poolGpuGroups: undefined,

  // Original text: 'Logging host'
  poolRemoteSyslogPlaceHolder: undefined,

  // Original text: 'XCP-ng Pro Support not available for source users'
  poolSupportSourceUsers: undefined,

  // Original text: 'Only available for pool of XCP-ng hosts'
  poolSupportXcpngOnly: undefined,

  // Original text: 'The pool is already fully supported'
  poolLicenseAlreadyFullySupported: undefined,

  // Original text: 'Rolling Pool Reboot'
  rollingPoolReboot: undefined,

  // Original text: 'High Availability is enabled. This will automatically disable it during the reboot.'
  rollingPoolRebootHaWarning: undefined,

  // Original text: 'Load Balancer plugin is running. This will automatically pause it during the reboot.'
  rollingPoolRebootLoadBalancerWarning: undefined,

  // Original text: 'Are you sure you want to start a Rolling Pool Reboot? Running VMs will be migrated back and forth and this can take a while. Scheduled backups that may concern this pool will be disabled.'
  rollingPoolRebootMessage: undefined,

  // Original text: 'Master'
  setpoolMaster: undefined,

  // Original text: 'Remote syslog host'
  syslogRemoteHost: undefined,

  // Original text: 'Synchronize with Netbox'
  syncNetbox: undefined,

  // Original text: 'Are you sure you want to synchronize with Netbox?'
  syncNetboxWarning: undefined,

  // Original text: '{networkID} not found, please select a new one'
  updateMissingNetwork: undefined,

  // Original text: "Name"
  hostNameLabel: 'Name',

  // Original text: "Description"
  hostDescription: 'Description',

  // Original text: "No hosts"
  noHost: 'No hosts',

  // Original text: "{used}% used ({free} free)"
  memoryLeftTooltip: '{used}% used ({free} free)',

  // Original text: "PIF"
  pif: 'PIF',

  // Original text: 'Automatic'
  poolNetworkAutomatic: undefined,

  // Original text: "Name"
  poolNetworkNameLabel: 'Name',

  // Original text: "Description"
  poolNetworkDescription: 'Description',

  // Original text: "PIFs"
  poolNetworkPif: 'PIFs',

  // Original text: 'Private networks'
  privateNetworks: undefined,

  // Original text: 'Manage'
  manage: undefined,

  // Original text: "No networks"
  poolNoNetwork: 'No networks',

  // Original text: "MTU"
  poolNetworkMTU: 'MTU',

  // Original text: "Connected"
  poolNetworkPifAttached: 'Connected',

  // Original text: "Disconnected"
  poolNetworkPifDetached: 'Disconnected',

  // Original text: "Show PIFs"
  showPifs: 'Show PIFs',

  // Original text: "Hide PIFs"
  hidePifs: 'Hide PIFs',

  // Original text: 'Network(s) selected by default for new VMs'
  networkAutomaticTooltip: undefined,

  // Original text: 'No NBD Connection'
  noNbdConnection: undefined,

  // Original text: 'NBD Connection'
  nbdConnection: undefined,

  // Original text: 'Insecure NBD Connection (not allowed through XO)'
  insecureNbdConnection: undefined,

  // Original text: "Rolling pool update can only work when there's multiple hosts in a pool with a shared storage"
  multiHostPoolUpdate: undefined,

  // Original text: '{nVms, number} VM{nVms, plural, one {} other {s}} {nVms, plural, one {is} other {are}} currently running and using at least one local storage. A shared storage for all your VMs is needed to start a rolling pool update'
  nVmsRunningOnLocalStorage: undefined,

  // Original text: "No stats"
  poolNoStats: 'No stats',

  // Original text: "All hosts"
  poolAllHosts: 'All hosts',

  // Original text: "Add SR"
  addSrLabel: 'Add SR',

  // Original text: "Add VM"
  addVmLabel: 'Add VM',

  // Original text: 'Add hosts'
  addHostsLabel: undefined,

  // Original text: 'The pool needs to install {nMissingPatches, number} patch{nMissingPatches, plural, one {} other {es}}. This operation may take a while.'
  missingPatchesPool: undefined,

  // Original text: 'The selected host{nHosts, plural, one {} other {s}} need{nHosts, plural, one {s} other {}} to install {nMissingPatches, number} patch{nMissingPatches, plural, one {} other {es}}. This operation may take a while.'
  missingPatchesHost: undefined,

  // Original text: 'The selected host{nHosts, plural, one {} other {s}} cannot be added to the pool because the patches are not homogeneous.'
  patchUpdateNoInstall: undefined,

  // Original text: 'Adding host{nHosts, plural, one {} other {s}} failed'
  addHostsErrorTitle: undefined,

  // Original text: "Host patches could not be homogenized."
  addHostNotHomogeneousErrorMessage: 'Host patches could not be homogenized.',

  // Original text: "Disconnect"
  disconnectServer: 'Disconnect',

  // Original text: 'Host'
  host: undefined,

  // Original text: 'Hardware-assisted virtualization is not enabled on this host'
  hostHvmDisabled: undefined,

  // Original text: 'This host does not have an active license, even though it is in a pool with licensed hosts. In order for XCP-ng Pro Support to be enabled on a pool, all hosts within the pool must have an active license'
  hostNoLicensePartialProSupport: undefined,

  // Original text: 'No XCP-ng Pro Support enabled on this host'
  hostNoSupport: undefined,

  // Original text: 'XCP-ng Pro Support enabled on this host'
  hostSupportEnabled: undefined,

  // Original text: 'This host version is no longer maintained'
  noMoreMaintained: undefined,

  // Original text: 'Disable maintenance mode'
  disableMaintenanceMode: undefined,

  // Original text: 'Enable maintenance mode'
  enableMaintenanceMode: undefined,

  // Original text: 'It appears that this host will be more up-to-date than the master ({master}) after the restart. This will result in the slave being unable to contact the pool master. Please update and restart your master node first.'
  slaveHostMoreUpToDateThanMasterAfterRestart: undefined,

  // Original text: "Start"
  startHostLabel: 'Start',

  // Original text: "Stop"
  stopHostLabel: 'Stop',

  // Original text: "Enable"
  enableHostLabel: 'Enable',

  // Original text: "Disable"
  disableHostLabel: 'Disable',

  // Original text: "Restart toolstack"
  restartHostAgent: 'Restart toolstack',

  // Original text: 'As the XOA is hosted on the host that is scheduled for a reboot, it will also be restarted. Consequently, XO won\'t be able to resume VMs, and VMs with the "Protect from accidental shutdown" option enabled will not have this option reactivated automatically.'
  smartRebootBypassCurrentVmCheck: undefined,

  // Original text: 'Smart reboot'
  smartRebootHostLabel: undefined,

  // Original text: 'Suspend resident VMs, reboot host and resume VMs automatically'
  smartRebootHostTooltip: undefined,

  // Original text: "Force reboot"
  forceRebootHostLabel: 'Force reboot',

  // Original text: 'Smart Reboot failed because {nVms, number} VM{nVms, plural, one {} other {s}} ha{nVms, plural, one {s} other {ve}} {nVms, plural, one {its} other {their}} Suspend operation blocked. Would you like to force?'
  forceSmartRebootHost: undefined,

  // Original text: 'Restart anyway'
  restartAnyway: undefined,

  // Original text: "Reboot"
  rebootHostLabel: 'Reboot',

  // Original text: "Error while restarting host"
  noHostsAvailableErrorTitle: 'Error while restarting host',

  // Original text: "Some VMs cannot be migrated without first rebooting this host. Please try force reboot."
  noHostsAvailableErrorMessage: 'Some VMs cannot be migrated before restarting this host. Please try force reboot.',

  // Original text: "Error while restarting hosts"
  failHostBulkRestartTitle: 'Error while restarting hosts',

  // Original text: "{failedHosts, number}/{totalHosts, number} host{failedHosts, plural, one {} other {s}} could not be restarted."
  failHostBulkRestartMessage:
    '{failedHosts, number}/{totalHosts, number} host{failedHosts, plural, one {} other {s}} could not be restarted.',

  // Original text: "Reboot to apply updates"
  rebootUpdateHostLabel: 'Reboot to apply updates',

  // Original text: "Emergency mode"
  emergencyModeLabel: 'Emergency mode',

  // Original text: "Storage"
  storageTabName: 'Storage',

  // Original text: "Patches"
  patchesTabName: 'Patches',

  // Original text: "Load average"
  statLoad: 'Load average',

  // Original text: 'This operation will reboot the host in order to apply the change on the PCI{nPcis, plural, one {} other {s}}. Are you sure you want to continue?'
  applyChangeOnPcis: undefined,

  // Original text: 'Class name'
  className: undefined,

  // Original text: 'Force reboot?'
  confirmForceRebootHost: undefined,

  // Original text: 'Device name'
  deviceName: undefined,

  // Original text: 'Enabled'
  enabled: undefined,

  // Original text: 'All disks are healthy ✅'
  disksSystemHealthy: undefined,

  // Original text: 'Edit iSCSI IQN'
  editHostIscsiIqnTitle: undefined,

  // Original text: 'Are you sure you want to edit the iSCSI IQN? This may result in failures connecting to existing SRs if the host is attached to iSCSI SRs.'
  editHostIscsiIqnMessage: undefined,

  // Original text: 'Host RAM usage:'
  hostTitleRamUsage: undefined,

  // Original text: 'The host evacuation failed, do you want to force reboot?'
  hostEvacuationFailed: undefined,

  // Original text: 'Are you sure you want to enter maintenance mode? This will migrate all the VMs running on this host to other hosts of the pool.'
  maintenanceHostModalMessage: undefined,

  // Original text: 'Maintenance mode'
  maintenanceHostModalTitle: undefined,

  // Original text: 'Evacuate and disable the host'
  maintenanceHostTooltip: undefined,

  // Original text: "RAM: {memoryUsed} used of {memoryTotal} ({memoryFree} free)"
  memoryHostState: 'RAM Usage: {memoryUsed}',

  // Original text: "Hardware"
  hardwareHostSettingsLabel: 'Hardware',

  // Original text: 'Hyper-threading (SMT)'
  hyperThreading: undefined,

  // Original text: 'HT detection is only available on XCP-ng 7.6 and higher'
  hyperThreadingNotAvailable: undefined,

  // Original text: 'Download system logs'
  hostDownloadLogs: undefined,

  // Original text: "The logs you are about to download contain the entire host's logs, potentially hundreds of megabytes. Please note that these logs can be technical and complex to analyze, requiring some expertise."
  hostDownloadLogsContainEntireHostLogs: undefined,

  // Original text: "Address"
  hostAddress: 'Address',

  // Original text: "Status"
  hostStatus: 'Status',

  // Original text: "Build number"
  hostBuildNumber: 'Build number',

  // Original text: 'iSCSI IQN'
  hostIscsiIqn: undefined,

  // Original text: 'PCI passthrough capable'
  hostIommuTooltip: undefined,

  // Original text: 'Not connected to an iSCSI SR'
  hostNoIscsiSr: undefined,

  // Original text: 'Click to see concerned SRs'
  hostMultipathingSrs: undefined,

  // Original text: '{nActives, number} of {nPaths, number} path{nPaths, plural, one {} other {s}}'
  hostMultipathingPaths: undefined,

  // Original text: 'This action will not be fulfilled if a VM is in a running state. Please ensure that all VMs are evacuated or stopped before performing this action!'
  hostMultipathingRequiredState: undefined,

  // Original text: 'The host{nHosts, plural, one {} other {s}} will lose their connection to the SRs. Do you want to continue?'
  hostMultipathingWarning: undefined,

  // Original text: "Version"
  hostXenServerVersion: 'Version',

  // Original text: "Enabled"
  hostStatusEnabled: 'Enabled',

  // Original text: "Disabled"
  hostStatusDisabled: 'Disabled',

  // Original text: "Power on mode"
  hostPowerOnMode: 'Power on mode',

  // Original text: 'Control domain memory'
  hostControlDomainMemory: undefined,

  // Original text: 'Set control domain memory'
  setControlDomainMemory: undefined,

  // Original text: 'Editing the control domain memory will immediately restart the host in order to apply the changes.'
  setControlDomainMemoryMessage: undefined,

  // Original text: 'The host needs to be in maintenance mode'
  maintenanceModeRequired: undefined,

  // Original text: "Host uptime"
  hostStartedSince: 'Host uptime',

  // Original text: "Toolstack uptime"
  hostStackStartedSince: 'Toolstack uptime',

  // Original text: "CPU model"
  hostCpusModel: 'CPU model',

  // Original text: 'GPUs'
  hostGpus: undefined,

  // Original text: "Core (socket)"
  hostCpusNumber: 'Core (socket)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: 'Manufacturer info',

  // Original text: "BIOS info"
  hostBiosinfo: 'BIOS info',

  // Original text: "License"
  licenseHostSettingsLabel: 'Licence',

  // Original text: "Type"
  hostLicenseType: 'Type',

  // Original text: "Socket"
  hostLicenseSocket: 'Socket',

  // Original text: "Expiry"
  hostLicenseExpiry: 'Expiry',

  // Original text: 'Remote syslog'
  hostRemoteSyslog: undefined,

  // Original text: 'IOMMU'
  hostIommu: undefined,

  // Original text: 'No certificates installed on this host'
  hostNoCertificateInstalled: undefined,

  // Original text: 'Only available for XCP-ng 8.3.0 or higher'
  'onlyAvailableXcp8.3OrHigher': undefined,

  // Original text: 'PCI Devices'
  pciDevices: undefined,

  // Original text: 'PCI ID'
  pciId: undefined,

  // Original text: 'PCI{nPcis, plural, one {} other {s}} enable'
  pcisEnable: undefined,

  // Original text: 'PCI{nPcis, plural, one {} other {s}} disable'
  pcisDisable: undefined,

  // Original text: 'Passthrough enabled'
  passthroughEnabled: undefined,

  // Original text: 'PUSB Devices'
  pusbDevices: undefined,

  // Original text: 'Smartctl plugin not installed'
  smartctlPluginNotInstalled: undefined,

  // Original text: "Installed supplemental packs"
  supplementalPacks: 'Installed supplemental packs',

  // Original text: "Install new supplemental pack"
  supplementalPackNew: 'Install new supplemental pack',

  // Original text: "Install supplemental pack on every host"
  supplementalPackPoolNew: 'Install supplemental pack on every host',

  // Original text: "{name} (by {author})"
  supplementalPackTitle: '{name} (by {author})',

  // Original text: "Installation started"
  supplementalPackInstallStartedTitle: 'Installation started',

  // Original text: "Installing new supplemental pack…"
  supplementalPackInstallStartedMessage: 'Installing new supplemental pack…',

  // Original text: "Installation error"
  supplementalPackInstallErrorTitle: 'Installation error',

  // Original text: "The installation of the supplemental pack failed."
  supplementalPackInstallErrorMessage: 'The installation of the supplemental pack failed.',

  // Original text: "Installation success"
  supplementalPackInstallSuccessTitle: 'Installation success',

  // Original text: "Supplemental pack successfully installed."
  supplementalPackInstallSuccessMessage: 'Supplemental pack successfully installed.',

  // Original text: 'System disks health'
  systemDisksHealth: undefined,

  // Original text: 'The iSCSI IQN must be unique. '
  uniqueHostIscsiIqnInfo: undefined,

  // Original text: 'Vendor ID'
  vendorId: undefined,

  // Original text: "Add a network"
  networkCreateButton: 'Add a network',

  // Original text: "Device"
  pifDeviceLabel: 'Device',

  // Original text: "Network"
  pifNetworkLabel: 'Network',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: 'Address',

  // Original text: "Mode"
  pifModeLabel: 'Mode',

  // Original text: "MAC"
  pifMacLabel: 'MAC',

  // Original text: "MTU"
  pifMtuLabel: 'MTU',

  // Original text: 'Speed'
  pifSpeedLabel: undefined,

  // Original text: "Status"
  pifStatusLabel: 'Status',

  // Original text: "This interface is currently in use"
  pifInUse: 'This interface is currently in use',

  // Original text: "Default locking mode"
  defaultLockingMode: 'Default locking mode',

  // Original text: "Configure IP address"
  pifConfigureIp: 'Configure IP address',

  // Original text: "Invalid parameters"
  configIpErrorTitle: 'Invalid parameters',

  // Original text: "Static IP address"
  staticIp: 'Static IP address',

  // Original text: 'Static IPv6 address'
  staticIpv6: undefined,

  // Original text: "Netmask"
  netmask: 'Netmask',

  // Original text: "DNS"
  dns: 'DNS',

  // Original text: "Gateway"
  gateway: 'Gateway',

  // Original text: 'An IP address is required'
  ipRequired: undefined,

  // Original text: 'Netmask required'
  netmaskRequired: undefined,

  // Original text: "Add a storage"
  addSrDeviceButton: 'Add a storage',

  // Original text: "Type"
  srType: 'Type',

  // Original text: 'PBD details'
  pbdDetails: undefined,

  // Original text: "Status"
  pbdStatus: 'Status',

  // Original text: "Connected"
  pbdStatusConnected: 'Connected',

  // Original text: "Disconnected"
  pbdStatusDisconnected: 'Disconnected',

  // Original text: "Connect"
  pbdConnect: 'Connect',

  // Original text: "Disconnect"
  pbdDisconnect: 'Disconnect',

  // Original text: "Forget"
  pbdForget: 'Forget',

  // Original text: "Shared"
  srShared: 'Shared',

  // Original text: "Not shared"
  srNotShared: 'Not shared',

  // Original text: "No storage detected"
  pbdNoSr: 'No storage detected',

  // Original text: "Name"
  patchNameLabel: 'Name',

  // Original text: "Install all patches"
  patchUpdateButton: 'Install all patches',

  // Original text: "Description"
  patchDescription: 'Description',

  // Original text: 'Version'
  patchVersion: undefined,

  // Original text: "Applied date"
  patchApplied: 'Applied date',

  // Original text: "Size"
  patchSize: 'Size',

  // Original text: "No patches detected"
  patchNothing: 'No patch detected',

  // Original text: "Release date"
  patchReleaseDate: 'Release date',

  // Original text: "Guidance"
  patchGuidance: 'Guidance',

  // Original text: "Applied patches"
  hostAppliedPatches: 'Applied patches',

  // Original text: "Missing patches"
  hostMissingPatches: 'Missing patches',

  // Original text: "Host up-to-date!"
  hostUpToDate: 'Host up-to-date!',

  // Original text: 'Install all patches'
  installAllPatchesTitle: undefined,

  // Original text: 'To install all patches go to pool.'
  installAllPatchesContent: undefined,

  // Original text: 'Go to pool'
  installAllPatchesRedirect: undefined,

  // Original text: 'The pool master must always be updated FIRST. Updating will automatically restart the toolstack. Running VMs will not be affected. Are you sure you want to continue and install all patches on this host?'
  installAllPatchesOnHostContent: undefined,

  // Original text: 'Release'
  patchRelease: undefined,

  // Original text: 'An error occurred while fetching the patches. Please make sure the updater plugin is installed by running `yum install xcp-ng-updater` on the host.'
  updatePluginNotInstalled: undefined,

  // Original text: 'Show changelog'
  showChangelog: undefined,

  // Original text: 'Changelog'
  changelog: undefined,

  // Original text: 'Patch'
  changelogPatch: undefined,

  // Original text: 'Author'
  changelogAuthor: undefined,

  // Original text: 'Date'
  changelogDate: undefined,

  // Original text: 'Description'
  changelogDescription: undefined,

  // Original text: 'Install'
  install: undefined,

  // Original text: 'Install patch{nPatches, plural, one {} other {es}}'
  installPatchesTitle: undefined,

  // Original text: 'This will automatically restart the toolstack on every host. Running VMs will not be affected. Are you sure you want to continue and install {nPatches, number} patch{nPatches, plural, one {} other {es}}?'
  installPatchesContent: undefined,

  // Original text: "Install pool patches"
  installPoolPatches: 'Install pool patches',

  // Original text: 'This will automatically restart the toolstack on every host. Running VMs will not be affected. Are you sure you want to continue and install all the patches on this pool?'
  confirmPoolPatch: undefined,

  // Original text: 'Rolling pool update'
  rollingPoolUpdate: undefined,

  // Original text: 'Are you sure you want to start a rolling pool update? Running VMs will be migrated back and forth and this can take a while. Scheduled backups that may concern this pool will be disabled.'
  rollingPoolUpdateMessage: undefined,

  // Original text: 'High Availability is enabled. This will automatically disable it during the update.'
  rollingPoolUpdateHaWarning: undefined,

  // Original text: 'Load Balancer plugin is running. This will automatically pause it during the update.'
  rollingPoolUpdateLoadBalancerWarning: undefined,

  // Original text: 'The pool needs a default SR to install the patches.'
  poolNeedsDefaultSr: undefined,

  // Original text: '{nVms, number} VM{nVms, plural, one {} other {s}} {nVms, plural, one {has} other {have}} CDs'
  vmsHaveCds: undefined,

  // Original text: 'Eject CDs'
  ejectCds: undefined,

  // Original text: 'High Availability must be disabled'
  highAvailabilityNotDisabledTooltip: undefined,

  // Original text: 'In order to install XenServer updates, you first need to configure your XenServer Client ID. See {link}.'
  xsCredentialsMissing: undefined,

  // Original text: 'Missing XenServer Client ID'
  xsCredentialsMissingShort: undefined,

  // Original text: "Default SR"
  defaultSr: 'Default SR',

  // Original text: "Set as default SR"
  setAsDefaultSr: 'Set as default SR',

  // Original text: 'Set default SR:'
  setDefaultSr: undefined,

  // Original text: "General"
  generalTabName: '一般',

  // Original text: "Stats"
  statsTabName: '状態',

  // Original text: "Console"
  consoleTabName: 'コンソール',

  // Original text: "Container"
  containersTabName: 'コンテナ',

  // Original text: "Snapshots"
  snapshotsTabName: 'スナップショット',

  // Original text: "Logs"
  logsTabName: 'ログの一覧',

  // Original text: "Advanced"
  advancedTabName: '詳細設定',

  // Original text: "Network"
  networkTabName: 'ネットワーク',

  // Original text: "Disk{disks, plural, one {} other {s}}"
  disksTabName: 'Disk{disks, plural, one {} other {s}}',

  // Original text: "Halted"
  powerStateHalted: 'halted',

  // Original text: "Running"
  powerStateRunning: '実行中',

  // Original text: "Suspended"
  powerStateSuspended: 'suspended',

  // Original text: 'Paused'
  powerStatePaused: undefined,

  // Original text: 'Disabled'
  powerStateDisabled: undefined,

  // Original text: 'Busy'
  powerStateBusy: undefined,

  // Original text: "Current status:"
  vmCurrentStatus: 'Current status:',

  // Original text: "Not running"
  vmNotRunning: 'Not running',

  // Original text: "Halted {ago}"
  vmHaltedSince: 'Halted {ago}',

  // Original text: 'This feature is only available for UEFI VMs.'
  availableForUefiOnly: undefined,

  // Original text: "No Xen tools detected"
  noToolsDetected: '仮想マシン(VM)に準仮想ドライバ(Xen tools)がインストールされていません',

  // Original text: "Management agent {version} detected"
  managementAgentDetected: '管理エージェント {version} のインストールを認識中',

  // Original text: "Management agent {version} out of date"
  managementAgentOutOfDate: '古いバージョン {version} の管理エージェントがインストールされています',

  // Original text: "Management agent not detected"
  managementAgentNotDetected: '管理エージェントがインストールされていません。',

  // Original text: "No IPv4 record"
  noIpv4Record: 'IPv4アドレスが検出されていません',

  // Original text: "No IP record"
  noIpRecord: 'IPアドレスが検出されていません',

  // Original text: 'Secure boot enforced'
  secureBootEnforced: undefined,

  // Original text: 'Secure boot not enforced'
  secureBootNotEnforced: undefined,

  // Original text: 'Secure boot enforced, but no dbx present'
  secureBootNoDbx: undefined,

  // Original text: 'Secure boot status'
  secureBootStatus: undefined,

  // Original text: 'Secure boot wanted, but some EFI certificates are missing'
  secureBootWantedButCertificatesMissing: undefined,

  // Original text: 'Secure boot wanted, but disabled due to the VM being in UEFI setup mode'
  secureBootWantedButDisabled: undefined,

  // Original text: 'Secure boot wanted, pending first boot'
  secureBootWantedPendingBoot: undefined,

  // Original text: "Started {ago}"
  started: '{ago}から起動中',

  // Original text: "Paravirtualization (PV)"
  paraVirtualizedMode: '準仮想化モード(PV)',

  // Original text: "Hardware virtualization (HVM)"
  hardwareVirtualizedMode: '完全仮想化モード(HVM)',

  // Original text: "Hardware virtualization with paravirtualization drivers enabled (PVHVM)"
  hvmModeWithPvDriversEnabled: '準仮想化ドライバ(PV Driver)がインストール済の完全仮想モード(PVHVM)',

  // Original text: 'PV inside a PVH container (PV in PVH)'
  pvInPvhMode: undefined,

  // Original text: 'Created by {user}\non {date}\nwith template {template}'
  vmCreatedAdmin: undefined,

  // Original text: 'Created on {date}\nwith template {template}'
  vmCreatedNonAdmin: undefined,

  // Original text: 'Manage Citrix PV drivers via Windows Update'
  windowsUpdateTools: undefined,

  // Original text: 'Windows Update Tools'
  windowsToolsModalTitle: undefined,

  // Original text: 'Enabling this will allow the VM to automatically install Citrix PV drivers from Windows Update. This only includes drivers, the Citrix management agent must still be separately installed.'
  windowsToolsModalMessage: undefined,

  // Original text: 'If you have previously installed XCP-ng tools instead of Citrix tools, this option will break your VM.'
  windowsToolsModalWarning: undefined,

  // Original text: 'Edit VM notes'
  editVmNotes: undefined,

  // Original text: 'Supports Markdown syntax'
  supportsMarkdown: undefined,

  // Original text: 'VM notes cannot be longer than 2048 characters'
  vmNotesTooLong: undefined,

  // Original text: "CPU usage"
  statsCpu: 'CPU利用量',

  // Original text: "Memory usage"
  statsMemory: 'メモリ利用量',

  // Original text: "Network throughput"
  statsNetwork: 'ネットワーク転送量',

  // Original text: "Stacked values"
  useStackedValuesOnStats: 'Stacked values',

  // Original text: "Disk throughput"
  statDisk: '仮想ディスク転送量',

  // Original text: "Last 10 minutes"
  statLastTenMinutes: '10分前まで表示',

  // Original text: "Last 2 hours"
  statLastTwoHours: '2時間前まで表示',

  // Original text: 'Last day'
  statLastDay: undefined,

  // Original text: "Last week"
  statLastWeek: '1週間前まで表示',

  // Original text: "Last year"
  statLastYear: '1年前まで表示',

  // Original text: "Copy"
  copyToClipboardLabel: 'コピー',

  // Original text: "Ctrl+Alt+Del"
  ctrlAltDelButtonLabel: 'Ctrl+Alt+Del',

  // Original text: "Send Ctrl+Alt+Del to VM?"
  ctrlAltDelConfirmation: 'Ctrl+Alt+DelをVMに送信しますか？',

  // Original text: "Console is disabled for this VM"
  disabledConsole: 'このVMのコンソールを無効化します',

  // Original text: "Multiline copy"
  multilineCopyToClipboard: '複数行のクリップボードコピー',

  // Original text: "Tip:"
  tipLabel: 'Tip:',

  // Original text: "Hide info"
  hideHeaderTooltip: 'Hide infos',

  // Original text: "Show info"
  showHeaderTooltip: 'Show infos',

  // Original text: "Send to clipboard"
  sendToClipboard: 'クリップボードに送信',

  // Original text: "Connect using external SSH tool as root"
  sshRootTooltip: '外部SSHツールを用いてroot権限で接続',

  // Original text: "SSH"
  sshRootLabel: 'SSH',

  // Original text: "Connect using external SSH tool as user…"
  sshUserTooltip: '外部SSHツールを用いてユーザ権限で接続',

  // Original text: "SSH as…"
  sshUserLabel: 'SSH as…',

  // Original text: "SSH user name"
  sshUsernameLabel: 'SSH ユーザID',

  // Original text: "No IP address reported by client tools"
  remoteNeedClientTools: 'IPアドレスがクライアントツールから検出できません',

  // Original text: "RDP"
  rdp: 'RDP',

  // Original text: "Connect using external RDP tool"
  rdpRootTooltip: '外部RDPツールを用いて接続',

  // Original text: "Name"
  containerName: 'Name',

  // Original text: "Command"
  containerCommand: 'Command',

  // Original text: "Creation date"
  containerCreated: 'Creation date',

  // Original text: "Status"
  containerStatus: 'Status',

  // Original text: "Action"
  containerAction: 'Action',

  // Original text: "No existing containers"
  noContainers: 'No existing containers',

  // Original text: "Stop this container"
  containerStop: 'Stop this container',

  // Original text: "Start this container"
  containerStart: 'Start this container',

  // Original text: "Pause this container"
  containerPause: 'Pause this container',

  // Original text: "Resume this container"
  containerResume: 'Resume this container',

  // Original text: "Restart this container"
  containerRestart: 'Restart this container',

  // Original text: "Rescan all ISO SRs"
  rescanIsoSrs: '再検出(全てのISO SR)',

  // Original text: "New disk"
  vbdCreateDeviceButton: '新規仮想ディスクを作成',

  // Original text: "Attach disk"
  vdiAttachDevice: '仮想ディスクの追加',

  // Original text: 'The selected VDI is already attached to this VM. Are you sure you want to continue?'
  vdiAttachDeviceConfirm: undefined,

  // Original text: "Boot order"
  vdiBootOrder: 'ブート順',

  // Original text: "Name"
  vdiNameLabel: '仮想ディスク名',

  // Original text: "Description"
  vdiNameDescription: '説明',

  // Original text: "Pool"
  vdiPool: 'Pool',

  // Original text: "Tags"
  vdiTags: 'Tags',

  // Original text: 'VDI tasks'
  vdiTasks: undefined,

  // Original text: "Size"
  vdiSize: 'Size',

  // Original text: "SR"
  vdiSr: 'SR',

  // Original text: 'VMs'
  vdiVms: undefined,

  // Original text: "Migrate VDI"
  vdiMigrate: 'Migrate VDI',

  // Original text: "Destination SR:"
  vdiMigrateSelectSr: 'Destination SR:',

  // Original text: "No SR"
  vdiMigrateNoSr: 'No SR',

  // Original text: "A target SR is required to migrate a VDI"
  vdiMigrateNoSrMessage: 'A target SR is required to migrate a VDI',

  // Original text: "Forget"
  vdiForget: 'Forget',

  // Original text: "No VDIs attached to control domain"
  noControlDomainVdis: 'No VDIs attached to Control Domain',

  // Original text: "Boot flag"
  vbdBootableStatus: 'Boot flag',

  // Original text: 'Device'
  vbdDevice: undefined,

  // Original text: 'CBT'
  vbdCbt: undefined,

  // Original text: "Status"
  vbdStatus: 'Status',

  // Original text: "Connected"
  vbdStatusConnected: 'Connected',

  // Original text: "Disconnected"
  vbdStatusDisconnected: 'Disconnected',

  // Original text: "Connect VBD"
  vbdConnect: 'Connect VBD',

  // Original text: "Disconnect VBD"
  vbdDisconnect: 'Disconnect VBD',

  // Original text: "Bootable"
  vbdBootable: 'Bootable',

  // Original text: "Readonly"
  vbdReadonly: 'Readonly',

  // Original text: "Create"
  vbdCreate: 'Create',

  // Original text: 'Attach'
  vbdAttach: undefined,

  // Original text: "Disk name"
  vbdNamePlaceHolder: 'Disk name',

  // Original text: "Size"
  vbdSizePlaceHolder: 'Size',

  // Original text: "CD drive not completely installed"
  cdDriveNotInstalled: 'CD drive not completely installed',

  // Original text: "Stop and start the VM to install the CD drive"
  cdDriveInstallation: 'Stop and start the VM to install the CD drive',

  // Original text: "Save"
  saveBootOption: 'Save',

  // Original text: "Reset"
  resetBootOption: 'Reset',

  // Original text: 'Destroy selected VDIs'
  destroySelectedVdis: undefined,

  // Original text: 'Destroy VDI'
  destroyVdi: undefined,

  // Original text: 'Export VDI content'
  exportVdi: undefined,

  // Original text: 'Format'
  format: undefined,

  // Original text: 'Import VDI content'
  importVdi: undefined,

  // Original text: 'No file selected'
  importVdiNoFile: undefined,

  // Original text: 'Drop VHD file here'
  selectVdiMessage: undefined,

  // Original text: 'Creating this disk will use the disk space quota from the resource set {resourceSet} ({spaceLeft} left)'
  useQuotaWarning: undefined,

  // Original text: 'Not enough space in resource set {resourceSet} ({spaceLeft} left)'
  notEnoughSpaceInResourceSet: undefined,

  // Original text: "The VDIs' SRs must either be shared or on the same host for the VM to be able to start."
  warningVdiSr: undefined,

  // Original text: 'Remove selected VDIs from this VM'
  removeSelectedVdisFromVm: undefined,

  // Original text: 'Remove VDI from this VM'
  removeVdiFromVm: undefined,

  // Original text: 'VHD'
  vhd: undefined,

  // Original text: 'VMDK'
  vmdk: undefined,

  // Original text: 'RAW'
  raw: undefined,

  // Original text: 'Edit locking mode'
  editVifLockingMode: undefined,

  // Original text: 'Allow the traffic'
  aclRuleAllow: undefined,

  // Original text: 'Select a protocol'
  aclRuleProtocol: undefined,

  // Original text: 'Select a port'
  aclRulePort: undefined,

  // Original text: 'Select an IP or an IP range (CIDR format)'
  aclRuleIpRange: undefined,

  // Original text: 'Select a direction'
  aclRuleDirection: undefined,

  // Original text: 'Traffic Enabled/Disabled'
  aclRuleAllowField: undefined,

  // Original text: 'Protocol'
  aclRuleProtocolField: undefined,

  // Original text: 'Port'
  aclRulePortField: undefined,

  // Original text: 'IP range (CIDR format)'
  aclRuleIpRangeField: undefined,

  // Original text: 'Direction'
  aclRuleDirectionField: undefined,

  // Original text: 'Add rule'
  addRule: undefined,

  // Original text: 'Delete rule'
  deleteRule: undefined,

  // Original text: 'Hide rules'
  hideRules: undefined,

  // Original text: 'SDN Controller must be loaded'
  sdnControllerNotLoaded: undefined,

  // Original text: 'Show rules'
  showRules: undefined,

  // Original text: 'Traffic rules'
  vifAclRules: undefined,

  // Original text: "New device"
  vifCreateDeviceButton: 'New device',

  // Original text: "Device"
  vifDeviceLabel: 'Device',

  // Original text: "MAC address"
  vifMacLabel: 'MAC address',

  // Original text: "MTU"
  vifMtuLabel: 'MTU',

  // Original text: "Network"
  vifNetworkLabel: 'Network',

  // Original text: 'Rate limit (kB/s)'
  vifRateLimitLabel: undefined,

  // Original text: "Status"
  vifStatusLabel: 'Status',

  // Original text: "Connected"
  vifStatusConnected: 'Connected',

  // Original text: "Disconnected"
  vifStatusDisconnected: 'Disconnected',

  // Original text: "Connect"
  vifConnect: 'Connect',

  // Original text: "Disconnect"
  vifDisconnect: 'Disconnect',

  // Original text: "Remove"
  vifRemove: 'Remove',

  // Original text: 'Remove selected VIFs'
  vifsRemove: undefined,

  // Original text: "IP addresses"
  vifIpAddresses: 'IP addresses',

  // Original text: "Auto-generated if empty"
  vifMacAutoGenerate: 'Auto-generated if empty',

  // Original text: "Allowed IPs"
  vifAllowedIps: 'Allowed IPs',

  // Original text: 'Select an IP'
  selectIpFromIpPool: undefined,

  // Original text: 'Enter an IP'
  enterIp: undefined,

  // Original text: 'Add allowed IP'
  addAllowedIp: undefined,

  // Original text: 'Error while adding allowed IP'
  addIpError: undefined,

  // Original text: 'Invalid IP'
  invalidIp: undefined,

  // Original text: "No IPs"
  vifNoIps: 'No IPs',

  // Original text: 'VIF locking mode is disabled'
  vifLockingModeDisabled: undefined,

  // Original text: 'VIF locking mode is unlocked'
  vifLockingModeUnlocked: undefined,

  // Original text: 'VIF locking mode is locked'
  vifLockingModeLocked: undefined,

  // Original text: 'Network default locking mode is disabled'
  networkDefaultLockingModeDisabled: undefined,

  // Original text: 'Network default locking mode is unlocked'
  networkDefaultLockingModeUnlocked: undefined,

  // Original text: "Network locked and no IPs are allowed for this interface"
  vifLockedNetworkNoIps: 'Network locked and no IPs are allowed for this interface',

  // Original text: 'Some IPs are unnecessarily set as allowed for this interface'
  vifUnlockedNetworkWithIps: undefined,

  // Original text: "Unknown network"
  vifUnknownNetwork: 'Unknown network',

  // Original text: "Create"
  vifCreate: 'Create',

  // Original text: 'NBD'
  nbd: undefined,

  // Original text: 'Network Block Device status'
  nbdTootltip: undefined,

  // Original text: 'Use of insecure NBD is not advised'
  nbdInsecureTooltip: undefined,

  // Original text: 'Nbd connection is secure and ready'
  nbdSecureTooltip: undefined,

  // Original text: "No snapshots"
  noSnapshots: 'No snapshots',

  // Original text: 'New snapshot with memory'
  newSnapshotWithMemory: undefined,

  // Original text: 'Are you sure you want to create a snapshot with memory? This could take a while and the VM will be unusable during that time.'
  newSnapshotWithMemoryConfirm: undefined,

  // Original text: 'Memory saved'
  snapshotMemorySaved: undefined,

  // Original text: "New snapshot"
  snapshotCreateButton: 'New snapshot',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: 'Just click on the snapshot button to create one!',

  // Original text: "Revert VM to this snapshot"
  revertSnapshot: 'Revert VM to this snapshot',

  // Original text: "Remove this snapshot"
  deleteSnapshot: 'Remove this snapshot',

  // Original text: 'Remove selected snapshots'
  deleteSnapshots: undefined,

  // Original text: "Create a VM from this snapshot"
  copySnapshot: 'Create a VM from this snapshot',

  // Original text: "Export this snapshot"
  exportSnapshot: 'Export this snapshot',

  // Original text: 'Export snapshot memory'
  exportSnapshotMemory: undefined,

  // Original text: 'Secure boot'
  secureBoot: undefined,

  // Original text: "Creation date"
  snapshotDate: 'Creation date',

  // Original text: 'Snapshot error'
  snapshotError: undefined,

  // Original text: "Name"
  snapshotName: 'Name',

  // Original text: "Description"
  snapshotDescription: 'Name',

  // Original text: "Quiesced snapshot"
  snapshotQuiesce: 'Quiesced snapshot',

  // Original text: 'Revert successful'
  vmRevertSuccessfulTitle: undefined,

  // Original text: 'VM successfully reverted'
  vmRevertSuccessfulMessage: undefined,

  // Original text: 'Current snapshot'
  currentSnapshot: undefined,

  // Original text: 'Go to the backup page.'
  goToBackupPage: undefined,

  // Original text: "Remove all logs"
  logRemoveAll: 'Remove all logs',

  // Original text: "No logs so far"
  noLogs: 'No logs so far',

  // Original text: "Creation date"
  logDate: 'Creation date',

  // Original text: "Name"
  logName: 'Name',

  // Original text: "Content"
  logContent: 'Content',

  // Original text: "Action"
  logAction: 'Action',

  // Original text: 'Attached PCIs'
  attachedPcis: undefined,

  // Original text: 'Attaching/detaching a PCI will be taken into consideration for the next VM boot.'
  attachingDetachingPciNeedVmBoot: undefined,

  // Original text: 'Attach PCIs'
  attachPcis: undefined,

  // Original text: 'Create a VTPM'
  createVtpm: undefined,

  // Original text: 'Delete the VTPM'
  deleteVtpm: undefined,

  // Original text: 'If the VTPM is in use, removing it will result in a dangerous data loss. Are you sure you want to remove the VTPM?'
  deleteVtpmWarning: undefined,

  // Original text: "When a VM is offline, it's not attached to any host, and therefore, it's impossible to determine the associated PCI devices, as it depends on the hardware environment in which it would be deployed."
  infoUnknownPciOnNonRunningVm: undefined,

  // Original text: 'Coalesce leaf'
  coalesceLeaf: undefined,

  // Original text: 'Coalesce leaf success'
  coalesceLeafSuccess: undefined,

  // Original text: 'This will suspend the VM during the operation. Do you want to continue?'
  coalesceLeafSuspendVm: undefined,

  // Original text: 'This pool was not setup for Guest UEFI SecureBoot yet'
  noSecureBoot: undefined,

  // Original text: 'Propagate certificates'
  propagateCertificatesTitle: undefined,

  // Original text: "This will overwrite the VM's UEFI certificates with certificates defined at the pool level. Continue?"
  propagateCertificatesConfirm: undefined,

  // Original text: "Copy the pool's default UEFI certificates to the VM"
  propagateCertificates: undefined,

  // Original text: 'Certificates propagated successfully'
  propagateCertificatesSuccessful: undefined,

  // Original text: 'Auto power on is disabled at pool level, click to fix automatically.'
  poolAutoPoweronDisabled: undefined,

  // Original text: "Remove"
  vmRemoveButton: 'Remove',

  // Original text: 'Convert to template'
  vmConvertToTemplateButton: undefined,

  // Original text: 'Convert to {mode}'
  vmSwitchVirtualizationMode: undefined,

  // Original text: 'Change virtualization mode'
  vmVirtualizationModeModalTitle: undefined,

  // Original text: "You must know what you are doing, because it could break your setup (if you didn't install the bootloader in the MBR while switching from PV to HVM, or even worse, in HVM to PV, if you don't have the correct PV args)"
  vmVirtualizationModeModalBody: undefined,

  // Original text: 'Share'
  vmShareButton: undefined,

  // Original text: "Xen settings"
  xenSettingsLabel: 'Xen settings',

  // Original text: "Guest OS"
  guestOsLabel: 'Guest OS',

  // Original text: "Misc"
  miscLabel: 'Misc',

  // Original text: "Virtualization mode"
  virtualizationMode: 'Virtualization mode',

  // Original text: 'Start delay (seconds)'
  startDelayLabel: undefined,

  // Original text: 'CPU mask'
  cpuMaskLabel: undefined,

  // Original text: 'Select core(s)…'
  selectCpuMask: undefined,

  // Original text: "CPU weight"
  cpuWeightLabel: 'CPU weight',

  // Original text: "Default ({value, number})"
  defaultCpuWeight: 'Default ({value, number})',

  // Original text: "CPU cap"
  cpuCapLabel: 'CPU cap',

  // Original text: "Default ({value, number})"
  defaultCpuCap: 'Default ({value, number})',

  // Original text: "PV args"
  pvArgsLabel: 'PV args',

  // Original text: 'Management agent version'
  managementAgentVersion: undefined,

  // Original text: "OS name"
  osName: 'OS name',

  // Original text: "OS kernel"
  osKernel: 'OS kernel',

  // Original text: "Auto power on"
  autoPowerOn: 'Auto power on',

  // Original text: 'Protect from accidental deletion'
  protectFromDeletion: undefined,

  // Original text: 'Protect from accidental shutdown'
  protectFromShutdown: undefined,

  // Original text: "HA"
  ha: 'HA',

  // Original text: 'SR used for High Availability'
  srHaTooltip: undefined,

  // Original text: 'Nested virtualization'
  nestedVirt: undefined,

  // Original text: "Affinity host"
  vmAffinityHost: 'Affinity host',

  // Original text: 'The VM needs to be halted'
  vmNeedToBeHalted: undefined,

  // Original text: "VGA"
  vmVga: 'VGA',

  // Original text: "Video RAM"
  vmVideoram: 'Video RAM',

  // Original text: 'NIC type'
  vmNicType: undefined,

  // Original text: 'VTPM'
  vtpm: undefined,

  // Original text: 'A UEFI boot firmware is necessary to use a VTPM'
  vtpmRequireUefi: undefined,

  // Original text: "None"
  noAffinityHost: 'None',

  // Original text: "Original template"
  originalTemplate: 'Original template',

  // Original text: "Unknown"
  unknownOsName: 'Unknown',

  // Original text: "Unknown"
  unknownOsKernel: 'Unknown',

  // Original text: "Unknown"
  unknownOriginalTemplate: 'Unknown',

  // Original text: "VM limits"
  vmLimitsLabel: 'VM limits',

  // Original text: 'Resource set'
  resourceSet: undefined,

  // Original text: 'None'
  resourceSetNone: undefined,

  // Original text: 'Select user'
  selectUser: undefined,

  // Original text: 'Suspend SR'
  suspendSr: undefined,

  // Original text: 'Viridian'
  viridian: undefined,

  // Original text: "CPU limits"
  vmCpuLimitsLabel: 'CPU limits',

  // Original text: "Topology"
  vmCpuTopology: 'Topology',

  // Original text: "Default behavior"
  vmChooseCoresPerSocket: 'Default behavior',

  // Original text: "{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket"
  vmSocketsWithCoresPerSocket:
    '{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket',

  // Original text: 'None'
  vmCoresPerSocketNone: undefined,

  // Original text: '{nCores, number} core{nCores, plural, one {} other {s}} per socket'
  vmCoresPerSocket: undefined,

  // Original text: "Not a divisor of the VM's max CPUs"
  vmCoresPerSocketNotDivisor: undefined,

  // Original text: 'The selected value exceeds the cores limit ({maxCores, number})'
  vmCoresPerSocketExceedsCoresLimit: undefined,

  // Original text: 'The selected value exceeds the sockets limit ({maxSockets, number})'
  vmCoresPerSocketExceedsSocketsLimit: undefined,

  // Original text: 'Disabled'
  vmHaDisabled: undefined,

  // Original text: "Memory limits (min/max)"
  vmMemoryLimitsLabel: 'Memory limits (min/max)',

  // Original text: 'VM UUID'
  vmUuid: undefined,

  // Original text: 'vGPU'
  vmVgpu: undefined,

  // Original text: 'GPUs'
  vmVgpus: undefined,

  // Original text: 'None'
  vmVgpuNone: undefined,

  // Original text: 'Add vGPU'
  vmAddVgpu: undefined,

  // Original text: 'Select vGPU type'
  vmSelectVgpuType: undefined,

  // Original text: 'ACLs'
  vmAcls: undefined,

  // Original text: 'Add ACLs'
  vmAddAcls: undefined,

  // Original text: 'Failed to add ACL(s)'
  addAclsErrorTitle: undefined,

  // Original text: 'User(s)/group(s) and role are required.'
  addAclsErrorMessage: undefined,

  // Original text: 'Create VUSB'
  createVusb: undefined,

  // Original text: 'Delete'
  removeAcl: undefined,

  // Original text: '{nAcls, number} more…'
  moreAcls: undefined,

  // Original text: 'PUSB description'
  pusbDescription: undefined,

  // Original text: 'PUSB speed'
  pusbSpeed: undefined,

  // Original text: 'PUSB version'
  pusbVersion: undefined,

  // Original text: 'Select PUSB'
  selectPusb: undefined,

  // Original text: 'Boot firmware'
  vmBootFirmware: undefined,

  // Original text: 'VM creator'
  vmCreator: undefined,

  // Original text: 'default (bios)'
  vmDefaultBootFirmwareLabel: undefined,

  // Original text: "You're about to change your boot firmware. This is still experimental in CH/XCP-ng 8.0. Are you sure you want to continue?"
  vmBootFirmwareWarningMessage: undefined,

  // Original text: 'Error on restarting and setting the VM: {vm}'
  setAndRestartVmFailed: undefined,

  // Original text: 'VM is currently running'
  vmEditAndRestartModalTitle: undefined,

  // Original text: 'This VM is currently running, and needs to be stopped to modify this value. Restart VM and modify this value?'
  vmEditAndRestartModalMessage: undefined,

  // Original text: 'Firmware not supported'
  firmwareNotSupported: undefined,

  // Original text: 'VUSBs'
  vusbs: undefined,

  // Original text: 'The VUSB remain unplugged until the next shutdown/start'
  vusbRemainUnplugged: undefined,

  // Original text: 'Unplug until the next shutdown/start'
  vusbUnplugTooltip: undefined,

  // Original text: "Long click to add a name"
  vmHomeNamePlaceholder: 'Long click to add a name',

  // Original text: "Long click to add a description"
  vmHomeDescriptionPlaceholder: 'Long click to add a description',

  // Original text: 'Copy to template'
  copyToTemplate: undefined,

  // Original text: 'Are you sure you want to copy this snapshot to a template?'
  copyToTemplateMessage: undefined,

  // Original text: "Click to add a name"
  templateHomeNamePlaceholder: 'Click to add a name',

  // Original text: "Click to add a description"
  templateHomeDescriptionPlaceholder: 'Click to add a description',

  // Original text: "Delete template"
  templateDelete: 'Delete template',

  // Original text: "Delete VM template{templates, plural, one {} other {s}}"
  templateDeleteModalTitle: 'Delete VM template{templates, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?"
  templateDeleteModalBody:
    'Are you sure you want to delete {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?',

  // Original text: 'Delete template{nTemplates, plural, one {} other {s}} failed'
  failedToDeleteTemplatesTitle: undefined,

  // Original text: 'Failed to delete {nTemplates, number} template{nTemplates, plural, one {} other {s}}.'
  failedToDeleteTemplatesMessage: undefined,

  // Original text: 'Delete default template{nDefaultTemplates, plural, one {} other {s}}'
  deleteDefaultTemplatesTitle: undefined,

  // Original text: 'You are attempting to delete {nDefaultTemplates, number} default template{nDefaultTemplates, plural, one {} other {s}}. Do you want to continue?'
  deleteDefaultTemplatesMessage: undefined,

  // Original text: 'Delete protected template{nProtectedTemplates, plural, one {} other {s}}'
  deleteProtectedTemplatesTitle: undefined,

  // Original text: 'You are attempting to delete {nProtectedTemplates, plural, one {a} other {nProtectedTemplates}} template{nProtectedTemplates, plural, one {} other {s}} protected from accidental deletion. Do you want to continue?'
  deleteProtectedTemplatesMessage: undefined,

  // Original text: "Pool{pools, plural, one {} other {s}}"
  poolPanel: 'プール数',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'ホスト数',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: 'VM数',

  // Original text: "RAM Usage:"
  memoryStatePanel: 'メモリ利用量:',

  // Original text: 'Used Memory'
  usedMemory: undefined,

  // Original text: 'Total Memory'
  totalMemory: undefined,

  // Original text: 'CPUs Total'
  totalCpus: undefined,

  // Original text: 'Used vCPUs'
  usedVCpus: undefined,

  // Original text: 'Used Space'
  usedSpace: undefined,

  // Original text: 'Total Space'
  totalSpace: undefined,

  // Original text: "CPUs Usage"
  cpuStatePanel: 'CPU利用量',

  // Original text: "VMs Power state"
  vmStatePanel: 'VMの稼働と停止率',

  // Original text: 'Halted'
  vmStateHalted: undefined,

  // Original text: 'Other'
  vmStateOther: undefined,

  // Original text: 'Running'
  vmStateRunning: undefined,

  // Original text: 'All'
  vmStateAll: undefined,

  // Original text: "Pending tasks"
  taskStatePanel: '実行待ちタスク数',

  // Original text: "Users"
  usersStatePanel: 'ユーザ数',

  // Original text: "Storage state"
  srStatePanel: 'Storage state',

  // Original text: "{usage} (of {total})"
  ofUsage: '{usage} (of {total})',

  // Original text: '{nVcpus, number} vCPU{nVcpus, plural, one {} other {s}} (of {nCpus, number} CPU{nCpus, plural, one {} other {s}})'
  ofCpusUsage: undefined,

  // Original text: "No storage"
  noSrs: 'No storage',

  // Original text: "Name"
  srName: 'Name',

  // Original text: "Pool"
  srPool: 'Pool',

  // Original text: "Host"
  srHost: 'Host',

  // Original text: "Type"
  srFormat: 'Type',

  // Original text: "Size"
  srSize: 'Size',

  // Original text: "Usage"
  srUsage: 'Usage',

  // Original text: "used"
  srUsed: 'used',

  // Original text: "free"
  srFree: 'free',

  // Original text: "Storage Usage"
  srUsageStatePanel: 'ストレージ(SR)利用量',

  // Original text: "Top 5 SR Usage (in %)"
  srTopUsageStatePanel: 'ストレージ利用の上位5位(%換算)',

  // Original text: 'Not enough permissions!'
  notEnoughPermissionsError: undefined,

  // Original text: "{running, number} running ({halted, number} halted)"
  vmsStates: '可動中：{running, number} 停止中：{halted, number}',

  // Original text: "Clear selection"
  dashboardStatsButtonRemoveAll: 'Clear selection',

  // Original text: "Add all hosts"
  dashboardStatsButtonAddAllHost: 'Add all hosts',

  // Original text: "Add all VMs"
  dashboardStatsButtonAddAllVM: 'Add all VMs',

  // Original text: 'Send report'
  dashboardSendReport: undefined,

  // Original text: 'Report'
  dashboardReport: undefined,

  // Original text: 'This will send a usage report to your configured emails.'
  dashboardSendReportMessage: undefined,

  // Original text: 'The usage report and transport email plugins need to be loaded!'
  dashboardSendReportInfo: undefined,

  // Original text: "{value} {date, date, medium}"
  weekHeatmapData: '{value} {date, date, medium}',

  // Original text: "No data."
  weekHeatmapNoData: 'No data.',

  // Original text: "Weekly Heatmap"
  weeklyHeatmap: 'Weekly Heatmap',

  // Original text: "Weekly Charts"
  weeklyCharts: 'Weekly Charts',

  // Original text: "Synchronize scale:"
  weeklyChartsScaleInfo: 'Synchronize scale:',

  // Original text: "Stats error"
  statsDashboardGenericErrorTitle: 'Stats error',

  // Original text: "There is no stats available for:"
  statsDashboardGenericErrorMessage: 'There is no stats available for:',

  // Original text: "No selected metric"
  noSelectedMetric: 'No selected metric',

  // Original text: "Select"
  statsDashboardSelectObjects: 'Select',

  // Original text: "Loading…"
  metricsLoading: 'Loading…',

  // Original text: 'Length: {length}'
  length: undefined,

  // Original text: 'Delete backup{nBackups, plural, one {} other {s}}'
  deleteBackups: undefined,

  // Original text: 'Are you sure you want to delete {nBackups, number} backup{nBackups, plural, one {} other {s}}?'
  deleteBackupsMessage: undefined,

  // Original text: 'Detached backups'
  detachedBackups: undefined,

  // Original text: 'Detached VM snapshots'
  detachedVmSnapshots: undefined,

  // Original text: 'Duplicated MAC addresses'
  duplicatedMacAddresses: undefined,

  // Original text: 'Local default SRs'
  localDefaultSrs: undefined,

  // Original text: "It is usually recommended for a pool's default SR to be shared to avoid unexpected behaviors"
  localDefaultSrsStatusTip: undefined,

  // Original text: 'Missing job'
  missingJob: undefined,

  // Original text: 'Missing VM'
  missingVm: undefined,

  // Original text: 'This VM does not belong to this job'
  missingVmInJob: undefined,

  // Original text: 'Missing schedule'
  missingSchedule: undefined,

  // Original text: 'No backups'
  noDetachedBackups: undefined,

  // Original text: 'No duplicated MAC addresses'
  noDuplicatedMacAddresses: undefined,

  // Original text: 'Reason'
  reason: undefined,

  // Original text: "Orphan VDIs"
  orphanedVdis: 'Orphaned snapshot VDIs',

  // Original text: 'VDIs and VDI snapshots that are not attached to a VM'
  orphanVdisTip: undefined,

  // Original text: "Orphaned VMs snapshot"
  orphanedVms: 'Orphaned VMs snapshot',

  // Original text: "No orphans"
  noOrphanedObject: 'No orphans',

  // Original text: 'Pools with no default SR'
  poolsWithNoDefaultSr: undefined,

  // Original text: 'Too many snapshots'
  tooManySnapshots: undefined,

  // Original text: 'VMs with more than the recommended amount of snapshots'
  tooManySnapshotsTip: undefined,

  // Original text: 'No local default SRs'
  noLocalDefaultSrs: undefined,

  // Original text: 'No VMs with too many snapshots'
  noTooManySnapshotsObject: undefined,

  // Original text: 'Number of snapshots'
  numberOfSnapshots: undefined,

  // Original text: 'Guest tools must be installed to display stats'
  guestToolsNecessary: undefined,

  // Original text: 'Guest Tools status'
  guestToolStatus: undefined,

  // Original text: 'VMs with missing or outdated guest tools'
  guestToolStatusTip: undefined,

  // Original text: 'All running VMs have up to date guest tools'
  noGuestToolStatusObject: undefined,

  // Original text: 'Status'
  guestToolStatusColumn: undefined,

  // Original text: 'Delete orphaned snapshot VDI'
  deleteOrphanedVdi: undefined,

  // Original text: 'Delete selected orphaned snapshot VDIs'
  deleteSelectedOrphanedVdis: undefined,

  // Original text: "VDIs attached to Control Domain"
  vdisOnControlDomain: 'VDIs attached to Control Domain',

  // Original text: 'VIF #{vifDevice, number} on {vm} ({network})'
  vifOnVmWithNetwork: undefined,

  // Original text: 'VIFs'
  vifs: undefined,

  // Original text: "Name"
  vmNameLabel: 'Name',

  // Original text: "Description"
  vmNameDescription: 'Description',

  // Original text: "Resident on"
  vmContainer: 'Resident on',

  // Original text: 'Snapshot of'
  snapshotOf: undefined,

  // Original text: 'Legacy backups snapshots'
  legacySnapshots: undefined,

  // Original text: "Alarms"
  alarmMessage: '警告',

  // Original text: "No alarms"
  noAlarms: '警告なし',

  // Original text: "Date"
  alarmDate: 'Date',

  // Original text: "Content"
  alarmContent: 'Content',

  // Original text: "Issue on"
  alarmObject: 'Issue on',

  // Original text: "Pool"
  alarmPool: 'Pool',

  // Original text: "{used}% used ({free} left)"
  spaceLeftTooltip: '{used}% used ({free} left)',

  // Original text: 'Unhealthy VDIs'
  unhealthyVdis: undefined,

  // Original text: 'VDIs to coalesce'
  vdisToCoalesce: undefined,

  // Original text: 'VDIs with invalid parent VHD'
  vdisWithInvalidVhdParent: undefined,

  // Original text: 'This SR has {nVdis, number} VDI{nVdis, plural, one {} other {s}} to coalesce'
  srVdisToCoalesceWarning: undefined,

  // Original text: 'Create VM'
  createVmModalTitle: undefined,

  // Original text: "You're about to use a large amount of resources available on the resource set. Are you sure you want to continue?"
  createVmModalWarningMessage: undefined,

  // Original text: 'Copy host BIOS strings to VM'
  copyHostBiosStrings: undefined,

  // Original text: 'Enable VTPM'
  enableVtpm: undefined,

  // Original text: "Create a new VM on {select}"
  newVmCreateNewVmOn: '仮想マシン(VM)の新規作成 プール：{select}',

  // Original text: "You have no permission to create a VM"
  newVmCreateNewVmNoPermission: 'VM作成権限がありません。',

  // Original text: "Info"
  newVmInfoPanel: '仮想マシン(VM)情報',

  // Original text: "Name"
  newVmNameLabel: '仮想マシン(VM)名',

  // Original text: "Template"
  newVmTemplateLabel: 'テンプレート',

  // Original text: "Description"
  newVmDescriptionLabel: 'VMの説明文',

  // Original text: "Performance"
  newVmPerfPanel: 'スペック',

  // Original text: "vCPUs"
  newVmVcpusLabel: 'vCPU数',

  // Original text: "RAM"
  newVmRamLabel: 'RAM',

  // Original text: 'The memory is below the threshold ({threshold})'
  newVmRamWarning: undefined,

  // Original text: "Static memory max"
  newVmStaticMaxLabel: 'メモリ(RAM)を固定値で設定',

  // Original text: "Dynamic memory min"
  newVmDynamicMinLabel: 'メモリを動的に設定(最小値)',

  // Original text: "Dynamic memory max"
  newVmDynamicMaxLabel: 'メモリを動的に設定(最大値)',

  // Original text: "Install settings"
  newVmInstallSettingsPanel: 'インストール設定',

  // Original text: "ISO/DVD"
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: "Network"
  newVmNetworkLabel: 'ネットワーク',

  // Original text: "e.g: http://httpredir.debian.org/debian"
  newVmInstallNetworkPlaceHolder: '例: http://httpredir.debian.org/debian',

  // Original text: "PV Args"
  newVmPvArgsLabel: 'PV Args',

  // Original text: "PXE"
  newVmPxeLabel: 'PXE',

  // Original text: "Interfaces"
  newVmInterfacesPanel: 'ネットワークインタフェイス',

  // Original text: "MAC"
  newVmMacLabel: 'MAC',

  // Original text: "Add interface"
  newVmAddInterface: 'インタフェイスの追加',

  // Original text: "Disks"
  newVmDisksPanel: '仮想ディスク',

  // Original text: "SR"
  newVmSrLabel: 'SR',

  // Original text: "Size"
  newVmSizeLabel: '容量',

  // Original text: "Add disk"
  newVmAddDisk: '仮想ディスクの追加',

  // Original text: "Summary"
  newVmSummaryPanel: '概要',

  // Original text: "Create"
  newVmCreate: 'VMの作成',

  // Original text: "Reset"
  newVmReset: 'VMのリセット',

  // Original text: "Select template"
  newVmSelectTemplate: 'テンプレート選択',

  // Original text: "SSH key"
  newVmSshKey: 'SSH key',

  // Original text: 'No config drive'
  noConfigDrive: undefined,

  // Original text: "Custom config"
  newVmCustomConfig: 'Custom config',

  // Original text: 'Click here to see the available template variables'
  availableTemplateVarsInfo: undefined,

  // Original text: 'Available template variables'
  availableTemplateVarsTitle: undefined,

  // Original text: 'the VM\'s name. It must not contain "_"'
  templateNameInfo: undefined,

  // Original text: "the VM's index, it will take 0 in case of single VM"
  templateIndexInfo: undefined,

  // Original text: 'Tip: escape any variable with a preceding backslash (\\)'
  templateEscape: undefined,

  // Original text: 'Error on getting the default coreOS cloud template'
  coreOsDefaultTemplateError: undefined,

  // Original text: "Boot VM after creation"
  newVmBootAfterCreate: 'Boot VM after creation',

  // Original text: "Auto-generated if empty"
  newVmMacPlaceholder: 'Auto-generated if empty',

  // Original text: "CPU weight"
  newVmCpuWeightLabel: 'CPU weight',

  // Original text: "Default: {value, number}"
  newVmDefaultCpuWeight: 'Default: {value, number}',

  // Original text: "CPU cap"
  newVmCpuCapLabel: 'CPU cap',

  // Original text: "Default: {value, number}"
  newVmDefaultCpuCap: 'Default: {value, number}',

  // Original text: "Cloud config"
  newVmCloudConfig: 'Cloud config',

  // Original text: "Create VMs"
  newVmCreateVms: 'Create VMs',

  // Original text: "Are you sure you want to create {nbVms, number} VMs?"
  newVmCreateVmsConfirm: 'Are you sure you want to create {nbVms, number} VMs?',

  // Original text: "Multiple VMs:"
  newVmMultipleVms: 'Multiple VMs:',

  // Original text: "Name pattern:"
  newVmMultipleVmsPattern: 'Name pattern:',

  // Original text: "e.g.: \\{name\\}_%"
  newVmMultipleVmsPatternPlaceholder: 'e.g.: \\{name\\}_%',

  // Original text: "First index:"
  newVmFirstIndex: 'First index:',

  // Original text: "Recalculate VMs number"
  newVmNumberRecalculate: 'Recalculate VMs number',

  // Original text: "Refresh VMs name"
  newVmNameRefresh: 'Refresh VMs name',

  // Original text: "Affinity host"
  newVmAffinityHost: 'Affinity host',

  // Original text: "Advanced"
  newVmAdvancedPanel: '詳細設定',

  // Original text: "Show advanced settings"
  newVmShowAdvanced: '詳細設定を開く',

  // Original text: "Hide advanced settings"
  newVmHideAdvanced: '詳細設定を隠す',

  // Original text: "Share this VM"
  newVmShare: 'このVMを共有',

  // Original text: 'The SRs must either be on the same host or shared'
  newVmSrsNotOnSameHost: undefined,

  // Original text: 'Network config'
  newVmNetworkConfigLabel: undefined,

  // Original text: 'Network configuration is only compatible with the {noCloudDatasourceLink}.'
  newVmNetworkConfigInfo: undefined,

  // Original text: 'See {networkConfigDocLink}.'
  newVmNetworkConfigDocLink: undefined,

  // Original text: 'Click here to get more information about network config'
  newVmNetworkConfigTooltip: undefined,

  // Original text: 'User config'
  newVmUserConfigLabel: undefined,

  // Original text: 'NoCloud datasource'
  newVmNoCloudDatasource: undefined,

  // Original text: 'Network config documentation'
  newVmNetworkConfigDoc: undefined,

  // Original text: 'The template already contains the BIOS strings'
  templateHasBiosStrings: undefined,

  // Original text: 'Click for more information about Guest UEFI Secure Boot.'
  secureBootLinkToDocumentationMessage: undefined,

  // Original text: 'This pool has not yet been setup for Guest UEFI Secure Boot. Click for more information.'
  secureBootNotSetup: undefined,

  // Original text: 'See VTPM documentation'
  seeVtpmDocumentation: undefined,

  // Original text: 'The boot firmware is UEFI'
  vmBootFirmwareIsUefi: undefined,

  // Original text: 'Destroy cloud config drive after first boot'
  destroyCloudConfigVdiAfterBoot: undefined,

  // Original text: 'VTPM is only supported on pools running XCP-ng/XS 8.3 or later.'
  vtpmNotSupported: undefined,

  // Original text: 'This template requires a VTPM, if you proceed, the VM will likely not be able to boot.'
  warningVtpmRequired: undefined,

  // Original text: "Resource sets"
  resourceSets: 'リソースセット',

  // Original text: "No resource sets."
  noResourceSets: 'リソースセット外',

  // Original text: "Resource set name"
  resourceSetName: 'リソースセット名',

  // Original text: 'Users'
  resourceSetUsers: undefined,

  // Original text: 'Pools'
  resourceSetPools: undefined,

  // Original text: 'Templates'
  resourceSetTemplates: undefined,

  // Original text: 'SRs'
  resourceSetSrs: undefined,

  // Original text: 'Networks'
  resourceSetNetworks: undefined,

  // Original text: "Recompute all limits"
  recomputeResourceSets: 'リソースセットの再計算',

  // Original text: "Save"
  saveResourceSet: '保存',

  // Original text: "Reset"
  resetResourceSet: '元に戻す',

  // Original text: "Edit"
  editResourceSet: '編集',

  // Original text: 'Default tags'
  defaultTags: undefined,

  // Original text: "Delete"
  deleteResourceSet: '削除',

  // Original text: "Delete resource set"
  deleteResourceSetWarning: 'リソースセットの消去',

  // Original text: "Are you sure you want to delete this resource set?"
  deleteResourceSetQuestion: '本当にリソースセットを消してもよろしいですか？',

  // Original text: "Missing objects:"
  resourceSetMissingObjects: '存在しないオブジェクト:',

  // Original text: "Unknown"
  unknownResourceSetValue: '不明',

  // Original text: "Available hosts"
  availableHosts: '有効物理ホスト',

  // Original text: "Excluded hosts"
  excludedHosts: '除外物理ホスト',

  // Original text: "No hosts available."
  noHostsAvailable: '有効な物理ホストがありません',

  // Original text: "VMs created from this resource set shall run on the following hosts."
  availableHostsDescription: 'このリソースセット内に作成されたVMは、下記の物理ホストで動作します。',

  // Original text: "Maximum CPUs"
  maxCpus: '合計最大CPU数',

  // Original text: "Maximum RAM"
  maxRam: '合計最大メモリ(RAM GiB)',

  // Original text: "Maximum disk space"
  maxDiskSpace: '合計最大仮想ディスク容量',

  // Original text: "IP pool"
  ipPool: 'IP予約領域',

  // Original text: "Quantity"
  quantity: 'Quantity',

  // Original text: 'Used'
  usedResourceLabel: undefined,

  // Original text: 'Available'
  availableResourceLabel: undefined,

  // Original text: 'Used: {usage} (Total: {total})'
  resourceSetQuota: undefined,

  // Original text: "New"
  resourceSetNew: '新規リソースセット',

  // Original text: 'Share VMs by default'
  shareVmsByDefault: undefined,

  // Original text: '{nVms, number} VM{nVms, plural, one {} other {s}} belong{nVms, plural, one {s} other {}} to this Resource Set'
  nVmsInResourceSet: undefined,

  // Original text: 'Used: {usage}'
  unlimitedResourceSetUsage: undefined,

  // Original text: 'File type:'
  fileType: undefined,

  // Original text: 'Firmware'
  firmware: undefined,

  // Original text: 'From URL'
  fromUrl: undefined,

  // Original text: 'URL import is only compatible with ISO SRs'
  UrlImportSrsCompatible: undefined,

  // Original text: 'From VMware'
  fromVmware: undefined,

  // Original text: "Drop OVA or XVA files here to import Virtual Machines."
  importVmsList: 'OVA、あるいはXVAファイルをドラッグアンドドロップしてください。',

  // Original text: "No selected VMs."
  noSelectedVms: 'VMが選択されていません。',

  // Original text: 'No tools installed'
  noToolsInstalled: undefined,

  // Original text: 'URL:'
  url: undefined,

  // Original text: "To Pool:"
  vmImportToPool: '作成先プール:',

  // Original text: "To SR:"
  vmImportToSr: '作成先SR:',

  // Original text: "VM{nVms, plural, one {} other {s}} to import"
  vmsToImport: '仮想マシンのインポート',

  // Original text: '<div>VM running from non file based datastore (like VSAN) will be migrated in a three steps process<ul><li>Stop the VM</li><li>Export the VM disks to a remote of Xen Orchestra</li><li>Load these disks in XCP-ng</li></ul>This process will be slower than migrating the VM to VMFS / NFS datastore and then migrating them to XCP-ng</div>'
  warningVsanImport: undefined,

  // Original text: 'Remote used to store temporary disk files(VSAN migration)'
  workDirLabel: undefined,

  // Original text: "Reset"
  importVmsCleanList: 'Reset',

  // Original text: "VM import success"
  vmImportSuccess: '仮想マシン(VM)のインポートに成功しました。',

  // Original text: "VM import failed"
  vmImportFailed: '仮想マシン(VM)のインポートに失敗しました。',

  // Original text: 'VDI import success'
  vdiImportSuccess: undefined,

  // Original text: 'VDI import failed'
  vdiImportFailed: undefined,

  // Original text: 'Error on setting the VM: {vm}'
  setVmFailed: undefined,

  // Original text: "Import starting…"
  startVmImport: '仮想マシン(VM)インポート開始……',

  // Original text: 'VDI import starting…'
  startVdiImport: undefined,

  // Original text: "Export starting…"
  startVmExport: '仮想マシン(VM)エクスポート開始……',

  // Original text: 'VDI export starting…'
  startVdiExport: undefined,

  // Original text: "Number of CPUs"
  nCpus: 'CPU数',

  // Original text: "Memory"
  vmMemory: 'メモリ容量',

  // Original text: "Disk {position} ({capacity})"
  diskInfo: 'Disk {position} ({capacity})',

  // Original text: "Disk description"
  diskDescription: 'Disk description',

  // Original text: "No disks."
  noDisks: 'No disks.',

  // Original text: "No networks."
  noNetworks: 'No networks.',

  // Original text: "Network {name}"
  networkInfo: 'Network {name}',

  // Original text: "No description available"
  noVmImportErrorDescription: 'No description available',

  // Original text: "Error:"
  vmImportError: 'Error:',

  // Original text: "{type} file:"
  vmImportFileType: '{type} file:',

  // Original text: "Please check and/or modify the VM configuration."
  vmImportConfigAlert: 'Please to check and/or modify the VM configuration.',

  // Original text: 'The tools are installed'
  toolsInstalled: undefined,

  // Original text: 'Disk import failed'
  diskImportFailed: undefined,

  // Original text: 'Disk import success'
  diskImportSuccess: undefined,

  // Original text: 'Drop {types} files here to import disks.'
  dropDisksFiles: undefined,

  // Original text: 'To SR'
  importToSr: undefined,

  // Original text: 'To import ISO files, an ISO repository is required'
  isoImportRequirement: undefined,

  // Original text: 'Pool tasks'
  poolTasks: undefined,

  // Original text: 'XO tasks'
  xoTasks: undefined,

  // Original text: 'Cancel'
  cancelTask: undefined,

  // Original text: 'Destroy'
  destroyTask: undefined,

  // Original text: 'Cancel selected tasks'
  cancelTasks: undefined,

  // Original text: 'Destroy selected tasks'
  destroyTasks: undefined,

  // Original text: 'Object'
  object: undefined,

  // Original text: 'Objects'
  objects: undefined,

  // Original text: 'Pool'
  pool: undefined,

  // Original text: 'Task'
  task: undefined,

  // Original text: 'Progress'
  progress: undefined,

  // Original text: 'Previous tasks'
  previousTasks: undefined,

  // Original text: 'Last seen'
  taskLastSeen: undefined,

  // Original text: "Schedules"
  backupSchedules: 'Schedules',

  // Original text: '{nLoneSnapshots} lone snapshot{nLoneSnapshots, plural, one {} other {s}} to delete!'
  loneSnapshotsMessages: undefined,

  // Original text: 'Cron pattern'
  scheduleCron: undefined,

  // Original text: 'Click to display last run details'
  scheduleLastRun: undefined,

  // Original text: 'Name'
  scheduleName: undefined,

  // Original text: 'Copy ID {id}'
  scheduleCopyId: undefined,

  // Original text: 'Timezone'
  scheduleTimezone: undefined,

  // Original text: 'Backup retention'
  scheduleExportRetention: undefined,

  // Original text: 'Replication retention'
  scheduleCopyRetention: undefined,

  // Original text: 'Snapshot retention'
  scheduleSnapshotRetention: undefined,

  // Original text: 'Pool retention'
  poolMetadataRetention: undefined,

  // Original text: 'XO retention'
  xoMetadataRetention: undefined,

  // Original text: "Get remote"
  getRemote: 'Get remote',

  // Original text: 'There are no backups!'
  noBackups: undefined,

  // Original text: "Click on a VM to display restore options"
  restoreBackupsInfo: 'Click on a VM to display restore options',

  // Original text: "Enabled"
  remoteEnabled: 'Enabled',

  // Original text: 'Disabled'
  remoteDisabled: undefined,

  // Original text: 'Enable'
  enableRemote: undefined,

  // Original text: 'Disable'
  disableRemote: undefined,

  // Original text: 'The URL ({url}) is invalid (colon in path). Click this button to change the URL to {newUrl}.'
  remoteErrorMessage: undefined,

  // Original text: "VM Name"
  backupVmNameColumn: 'VM Name',

  // Original text: 'VM Description'
  backupVmDescriptionColumn: undefined,

  // Original text: 'Oldest backup'
  firstBackupColumn: undefined,

  // Original text: "Latest backup"
  lastBackupColumn: 'Last Backup',

  // Original text: "Available Backups"
  availableBackupsColumn: 'Available Backups',

  // Original text: "Missing parameters"
  backupRestoreErrorTitle: 'Missing parameters',

  // Original text: "Choose a SR and a backup"
  backupRestoreErrorMessage: 'Choose a SR and a backup',

  // Original text: 'key'
  backupisKey: undefined,

  // Original text: 'incremental'
  backupIsIncremental: undefined,

  // Original text: 'differencing'
  backupIsDifferencing: undefined,

  // Original text: "VMs to backup"
  vmsToBackup: 'VMs to backup',

  // Original text: 'Refresh backup list'
  refreshBackupList: undefined,

  // Original text: 'Restore'
  restoreVmBackups: undefined,

  // Original text: 'Restore {vm}'
  restoreVmBackupsTitle: undefined,

  // Original text: 'Restore health check {vm}'
  checkVmBackupsTitle: undefined,

  // Original text: 'Restore {nVms, number} VM{nVms, plural, one {} other {s}}'
  restoreVmBackupsBulkTitle: undefined,

  // Original text: 'Restore {nVms, number} VM{nVms, plural, one {} other {s}} from {nVms, plural, one {its} other {their}} {oldestOrLatest} backup.'
  restoreVmBackupsBulkMessage: undefined,

  // Original text: 'This operation will overwrite the host metadata. Only perform a metadata restore if it is a new server with nothing running on it.'
  restoreMetadataBackupWarning: undefined,

  // Original text: 'oldest'
  oldest: undefined,

  // Original text: 'latest'
  latest: undefined,

  // Original text: 'Start VM{nVms, plural, one {} other {s}} after restore'
  restoreVmBackupsStart: undefined,

  // Original text: 'Multi-restore error'
  restoreVmBackupsBulkErrorTitle: undefined,

  // Original text: 'Use differential restore'
  restoreVmUseDifferentialRestore: undefined,

  // Original text: 'Restore {item}'
  restoreMetadataBackupTitle: undefined,

  // Original text: 'Restore {nMetadataBackups, number} metadata backup{nMetadataBackups, plural, one {} other {s}}'
  bulkRestoreMetadataBackupTitle: undefined,

  // Original text: 'Restore {nMetadataBackups, number} metadata backup{nMetadataBackups, plural, one {} other {s}} from {nMetadataBackups, plural, one {its} other {their}} {oldestOrLatest} backup'
  bulkRestoreMetadataBackupMessage: undefined,

  // Original text: 'Delete {item} backup'
  deleteMetadataBackupTitle: undefined,

  // Original text: 'You need to select a destination SR'
  restoreVmBackupsBulkErrorMessage: undefined,

  // Original text: 'Delete backups…'
  deleteVmBackups: undefined,

  // Original text: 'Delete {vm} backups'
  deleteVmBackupsTitle: undefined,

  // Original text: 'Select backups to delete:'
  deleteBackupsSelect: undefined,

  // Original text: 'All'
  deleteVmBackupsSelectAll: undefined,

  // Original text: 'Delete backups'
  deleteVmBackupsBulkTitle: undefined,

  // Original text: 'Are you sure you want to delete all the backups from {nVms, number} VM{nVms, plural, one {} other {s}}?'
  deleteVmBackupsBulkMessage: undefined,

  // Original text: 'delete {nBackups} backup{nBackups, plural, one {} other {s}}'
  deleteVmBackupsBulkConfirmText: undefined,

  // Original text: 'Delete metadata backups'
  bulkDeleteMetadataBackupsTitle: undefined,

  // Original text: 'Are you sure you want to delete all the backups from {nMetadataBackups, number} metadata backup{nMetadataBackups, plural, one {} other {s}}?'
  bulkDeleteMetadataBackupsMessage: undefined,

  // Original text: 'delete {nMetadataBackups} metadata backup{nMetadataBackups, plural, one {} other {s}}'
  bulkDeleteMetadataBackupsConfirmText: undefined,

  // Original text: 'Health check'
  healthCheck: undefined,

  // Original text: 'Choose SR used for VMs restoration'
  healthCheckChooseSr: undefined,

  // Original text: 'If no tags are specified, all VMs in the backup will be tested.'
  healthCheckTagsInfo: undefined,

  // Original text: 'Only available to enterprise users'
  healthCheckAvailableEnterpriseUser: undefined,

  // Original text: "The backup will not be run on this remote because it's not compatible with the selected proxy"
  remoteNotCompatibleWithSelectedProxy: undefined,

  // Original text: 'Loading backups failed'
  remoteLoadBackupsFailure: undefined,

  // Original text: 'Failed to load backups from {name}.'
  remoteLoadBackupsFailureMessage: undefined,

  // Original text: 'VMs tags'
  vmsTags: undefined,

  // Original text: 'VMs with this tag will not be backed up {reason, select, null {} other {({reason})}}'
  tagNoBak: undefined,

  // Original text: 'An email will be sent when a VM with this tag is snapshotted'
  tagNotifyOnSnapshot: undefined,

  // Original text: "Restore backup files"
  restoreFiles: 'Restore backup files',

  // Original text: "Invalid options"
  restoreFilesError: 'Invalid options',

  // Original text: 'Export format:'
  restoreFilesExportFormat: undefined,

  // Original text: "Restore file from {name}"
  restoreFilesFromBackup: 'Restore file from {name}',

  // Original text: "Select a backup…"
  restoreFilesSelectBackup: 'Select a backup…',

  // Original text: "Select a disk…"
  restoreFilesSelectDisk: 'Select a disk…',

  // Original text: "Select a partition…"
  restoreFilesSelectPartition: 'Select a partition…',

  // Original text: "Select a file…"
  restoreFilesSelectFiles: 'Select a file…',

  // Original text: "No files selected"
  restoreFilesNoFilesSelected: 'No files selected',

  // Original text: 'Selected files/folders ({files}):'
  restoreFilesSelectedFilesAndFolders: undefined,

  // Original text: "Error while scanning disk"
  restoreFilesDiskError: 'Error while scanning disk',

  // Original text: "Select all this folder's files"
  restoreFilesSelectAllFiles: "Select all this folder's files",

  // Original text: 'Select this folder'
  restoreFilesSelectFolder: undefined,

  // Original text: 'tar+gzip (.tgz)'
  restoreFilesTgz: undefined,

  // Original text: "Unselect all files"
  restoreFilesUnselectAll: 'Unselect all files',

  // Original text: 'ZIP (slow)'
  restoreFilesZip: undefined,

  // Original text: 'There may be ongoing backups on the host. Are you sure you want to continue?'
  bypassBackupHostModalMessage: undefined,

  // Original text: 'There may be ongoing backups on the pool. Are you sure you want to continue?'
  bypassBackupPoolModalMessage: undefined,

  // Original text: 'Emergency shutdown Host'
  emergencyShutdownHostModalTitle: undefined,

  // Original text: 'Are you sure you want to shutdown {host}?'
  emergencyShutdownHostModalMessage: undefined,

  // Original text: "Emergency shutdown Host{nHosts, plural, one {} other {s}}"
  emergencyShutdownHostsModalTitle: 'Emergency shutdown Host{nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to shutdown {nHosts, number} Host{nHosts, plural, one {} other {s}}?"
  emergencyShutdownHostsModalMessage:
    'Are you sure you want to shutdown {nHosts, number} Host{nHosts, plural, one {} other {s}}?',

  // Original text: "Shutdown host"
  stopHostModalTitle: 'Shutdown host',

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage:
    "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost",

  // Original text: 'Force shutdown host'
  forceStopHost: undefined,

  // Original text: 'This will shutdown your host without evacuating its VMs. Do you want to continue?'
  forceStopHostMessage: undefined,

  // Original text: "Add host"
  addHostModalTitle: 'Add host',

  // Original text: "Are you sure you want to add {host} to {pool}?"
  addHostModalMessage: 'Are you sure you want to add {host} to {pool}?',

  // Original text: "Restart host"
  restartHostModalTitle: 'Restart host',

  // Original text: "This will restart your host. Do you want to continue?"
  restartHostModalMessage: 'This will restart your host. Do you want to continue?',

  // Original text: "Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}"
  restartHostsAgentsModalTitle:
    'Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?"
  restartHostsAgentsModalMessage:
    'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?',

  // Original text: "Restart Host{nHosts, plural, one {} other {s}}"
  restartHostsModalTitle: 'Restart Host{nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}}?"
  restartHostsModalMessage: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}}?',

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'Start VM{vms, plural, one {} other {s}}',

  // Original text: "Start a copy"
  cloneAndStartVM: 'Start a copy',

  // Original text: "Force start"
  forceStartVm: 'Force start',

  // Original text: "Forbidden operation"
  forceStartVmModalTitle: 'Forbidden operation',

  // Original text: "Start operation for this vm is blocked."
  blockedStartVmModalMessage: 'Start operation for this vm is blocked.',

  // Original text: "Forbidden operation start for {nVms, number} vm{nVms, plural, one {} other {s}}."
  blockedStartVmsModalMessage: 'Forbidden operation start for {nVms, number} vm{nVms, plural, one {} other {s}}.',

  // Original text: "Are you sure you want to start {vms, number} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage: 'Are you sure you want to start {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: "{nVms, number} VM{nVms, plural, one {} other {s}} failed. Please check logs for more information"
  failedVmsErrorMessage:
    '{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information',

  // Original text: "Start failed"
  failedVmsErrorTitle: 'Start failed',

  // Original text: 'Delete failed'
  failedDeleteErrorTitle: undefined,

  // Original text: "Stop Host{nHosts, plural, one {} other {s}}"
  stopHostsModalTitle: 'Stop Host{nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?"
  stopHostsModalMessage: 'Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?',

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'Stop VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: 'Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: "Restart VM"
  restartVmModalTitle: 'Restart VM',

  // Original text: "Are you sure you want to restart {name}?"
  restartVmModalMessage: 'Are you sure you want to restart {name}?',

  // Original text: "Stop VM"
  stopVmModalTitle: 'Stop VM',

  // Original text: "Are you sure you want to stop {name}?"
  stopVmModalMessage: 'Are you sure you want to stop {name}?',

  // Original text: 'Blocked operation'
  blockedOperation: undefined,

  // Original text: 'Stop operation for this VM is blocked. Would you like to stop it anyway?'
  stopVmBlockedModalMessage: undefined,

  // Original text: 'No guest tools'
  vmHasNoTools: undefined,

  // Original text: "The VM doesn't have Xen tools installed, which are required to properly stop or reboot it."
  vmHasNoToolsMessage: undefined,

  // Original text: 'Would you like to force shutdown the VM?'
  confirmForceShutdown: undefined,

  // Original text: 'Would you like to force reboot the VM?'
  confirmForceReboot: undefined,

  // Original text: 'Suspend VM{vms, plural, one {} other {s}}'
  suspendVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to suspend {vms, number} VM{vms, plural, one {} other {s}}?'
  suspendVmsModalMessage: undefined,

  // Original text: 'Pause VM{vms, plural, one {} other {s}}'
  pauseVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to pause {vms, number} VM{vms, plural, one {} other {s}}?'
  pauseVmsModalMessage: undefined,

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'Restart VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: 'Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: 'Restart operation for this VM is blocked. Would you like to restart it anyway?'
  restartVmBlockedModalMessage: undefined,

  // Original text: 'save memory'
  snapshotSaveMemory: undefined,

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Snapshot VM{vms, plural, one {} other {s}}',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Delete VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage:
    'Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED',

  // Original text: 'delete {nVms, number} vm{nVms, plural, one {} other {s}}'
  deleteVmsConfirmText: undefined,

  // Original text: "Delete VM"
  deleteVmModalTitle: 'Delete VM',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage: 'Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED',

  // Original text: 'Blocked operation'
  deleteVmBlockedModalTitle: undefined,

  // Original text: 'Removing the VM is a blocked operation. Would you like to remove it anyway?'
  deleteVmBlockedModalMessage: undefined,

  // Original text: 'Force migration'
  forceVmMigrateModalTitle: undefined,

  // Original text: 'The VM is incompatible with the CPU features of the destination host. Would you like to force it anyway?'
  forceVmMigrateModalMessage: undefined,

  // Original text: "Migrate VM"
  migrateVmModalTitle: 'Migrate VM',

  // Original text: "Select a destination host:"
  migrateVmSelectHost: 'Select a destination host:',

  // Original text: "Select a migration network:"
  migrateVmSelectMigrationNetwork: 'Select a migration network:',

  // Original text: "For each VIF, select a network:"
  migrateVmSelectNetworks: 'For each VIF, select a network:',

  // Original text: "Select a destination SR:"
  migrateVmsSelectSr: 'Select a destination SR:',

  // Original text: "Select a destination SR for local disks:"
  migrateVmsSelectSrIntraPool: 'Select a destination SR for local disks:',

  // Original text: "Select a network on which to connect each VIF:"
  migrateVmsSelectNetwork: 'Select a network on which to connect each VIF:',

  // Original text: "Smart mapping"
  migrateVmsSmartMapping: 'Smart mapping',

  // Original text: "VIF"
  migrateVmVif: 'VIF',

  // Original text: "Network"
  migrateVmNetwork: 'Network',

  // Original text: "No target host"
  migrateVmNoTargetHost: 'No target host',

  // Original text: "A target host is required to migrate a VM"
  migrateVmNoTargetHostMessage: 'A target host is required to migrate a VM',

  // Original text: 'SR required'
  migrateVmNoSr: undefined,

  // Original text: 'A destination SR is required'
  migrateVmNoSrMessage: undefined,

  // Original text: "No default SR"
  migrateVmNoDefaultSrError: 'No default SR',

  // Original text: "Default SR not connected to host"
  migrateVmNotConnectedDefaultSrError: 'Default SR not connected to host',

  // Original text: "For each VDI, select an SR (optional)"
  chooseSrForEachVdisModalSelectSr: 'For each VDI, select an SR:',

  // Original text: "Select main SR…"
  chooseSrForEachVdisModalMainSr: 'Select main SR…',

  // Original text: "VDI"
  chooseSrForEachVdisModalVdiLabel: 'VDI',

  // Original text: "SR*"
  chooseSrForEachVdisModalSrLabel: 'SR*',

  // Original text: 'Delete job{nJobs, plural, one {} other {s}}'
  deleteJobsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nJobs, number} job{nJobs, plural, one {} other {s}}?'
  deleteJobsModalMessage: undefined,

  // Original text: 'Delete VBD{nVbds, plural, one {} other {s}}'
  deleteVbdsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVbds, number} VBD{nVbds, plural, one {} other {s}}?'
  deleteVbdsModalMessage: undefined,

  // Original text: "Delete VDI"
  deleteVdiModalTitle: 'Delete VDI',

  // Original text: "Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST"
  deleteVdiModalMessage: 'Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST',

  // Original text: 'Delete VDI{nVdis, plural, one {} other {s}}'
  deleteVdisModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVdis, number} disk{nVdis, plural, one {} other {s}}? ALL DATA ON THESE DISKS WILL BE LOST'
  deleteVdisModalMessage: undefined,

  // Original text: 'Delete schedule{nSchedules, plural, one {} other {s}}'
  deleteSchedulesModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nSchedules, number} schedule{nSchedules, plural, one {} other {s}}?'
  deleteSchedulesModalMessage: undefined,

  // Original text: 'Delete remote{nRemotes, plural, one {} other {s}}'
  deleteRemotesModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nRemotes, number} remote{nRemotes, plural, one {} other {s}}?'
  deleteRemotesModalMessage: undefined,

  // Original text: "Revert your VM"
  revertVmModalTitle: 'Revert your VM',

  // Original text: 'Share your VM'
  shareVmInResourceSetModalTitle: undefined,

  // Original text: 'This VM will be shared with all the members of the self-service {self}. Are you sure?'
  shareVmInResourceSetModalMessage: undefined,

  // Original text: 'Delete VIF{nVifs, plural, one {} other {s}}'
  deleteVifsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVifs, number} VIF{nVifs, plural, one {} other {s}}?'
  deleteVifsModalMessage: undefined,

  // Original text: "Delete snapshot"
  deleteSnapshotModalTitle: 'Delete snapshot',

  // Original text: "Are you sure you want to delete this snapshot?"
  deleteSnapshotModalMessage: 'Are you sure you want to delete this snapshot?',

  // Original text: 'Delete snapshot{nVms, plural, one {} other {s}}'
  deleteSnapshotsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVms, number} snapshot{nVms, plural, one {} other {s}}?'
  deleteSnapshotsModalMessage: undefined,

  // Original text: 'Disconnect VBD{nVbds, plural, one {} other {s}}'
  disconnectVbdsModalTitle: undefined,

  // Original text: 'Are you sure you want to disconnect {nVbds, number} VBD{nVbds, plural, one {} other {s}}?'
  disconnectVbdsModalMessage: undefined,

  // Original text: 'Disable host'
  disableHost: undefined,

  // Original text: 'Are you sure you want to disable {host}? This will prevent new VMs from starting.'
  disableHostModalMessage: undefined,

  // Original text: "Are you sure you want to revert this VM to the snapshot state? This operation is irreversible."
  revertVmModalMessage:
    'Are you sure you want to revert this VM to the snapshot state? This operation is irreversible.',

  // Original text: "Snapshot before"
  revertVmModalSnapshotBefore: 'Snapshot before',

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: 'Select your backup…',

  // Original text: 'Select a destination SR…'
  importBackupModalSelectSr: undefined,

  // Original text: 'Delete orphaned snapshot VDIs'
  deleteOrphanedVdisModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVdis, number} orphaned snapshot VDI{nVdis, plural, one {} other {s}}?'
  deleteOrphanedVdisModalMessage: undefined,

  // Original text: "This operation is definitive."
  definitiveMessageModal: 'This operation is definitive.',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Previous LUN Usage',

  // Original text: "This LUN has been previously used as storage by a XenServer host. All data will be lost if you choose to continue with the SR creation."
  existingLunModalText:
    'This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation.',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: 'Replace current registration?',

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText:
    'Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?',

  // Original text: "Ready for trial?"
  trialReadyModal: 'Ready for trial?',

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText:
    'During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!',

  // Original text: 'Cancel task{nTasks, plural, one {} other {s}}'
  cancelTasksModalTitle: undefined,

  // Original text: 'Are you sure you want to cancel {nTasks, number} task{nTasks, plural, one {} other {s}}?'
  cancelTasksModalMessage: undefined,

  // Original text: 'Destroy task{nTasks, plural, one {} other {s}}'
  destroyTasksModalTitle: undefined,

  // Original text: 'Are you sure you want to destroy {nTasks, number} task{nTasks, plural, one {} other {s}}?'
  destroyTasksModalMessage: undefined,

  // Original text: 'Forget host'
  forgetHostFromSrModalTitle: undefined,

  // Original text: 'Are you sure you want to forget this host? This will disconnect the SR from the host by removing the link between them (PBD).'
  forgetHostFromSrModalMessage: undefined,

  // Original text: 'Forget host{nPbds, plural, one {} other {s}}'
  forgetHostsFromSrModalTitle: undefined,

  // Original text: 'Are you sure you want to forget {nPbds, number} host{nPbds, plural, one {} other {s}}? This will disconnect the SR from these hosts by removing the links between the SR and the hosts (PBDs).'
  forgetHostsFromSrModalMessage: undefined,

  // Original text: 'Forget SR'
  forgetSrFromHostModalTitle: undefined,

  // Original text: 'Are you sure you want to forget this SR? This will disconnect the SR from the host by removing the link between them (PBD).'
  forgetSrFromHostModalMessage: undefined,

  // Original text: 'Forget SR{nPbds, plural, one {} other {s}}'
  forgetSrsFromHostModalTitle: undefined,

  // Original text: 'Are you sure you want to forget {nPbds, number} SR{nPbds, plural, one {} other {s}}? This will disconnect the SRs from the host by removing the links between the host and the SRs (PBDs).'
  forgetSrsFromHostModalMessage: undefined,

  // Original text: "* optional"
  optionalEntry: '* optional',

  // Original text: 'This VM contains a duplicate MAC address or has the same MAC address as another running VM. Do you want to continue?'
  vmWithDuplicatedMacAddressesMessage: undefined,

  // Original text: '{nVms, number} VM{nVms, plural, one {} other {s}} contain{nVms, plural, one {s} other {}} duplicate MAC addresses or {nVms, plural, one {has} other {have}} the same MAC addresses as other running VMs. Do you want to continue?'
  vmsWithDuplicatedMacAddressesMessage: undefined,

  // Original text: 'Ignore this VDI'
  ignoreVdi: undefined,

  // Original text: 'Select a destination SR'
  selectDestinationSr: undefined,

  // Original text: 'Enable server'
  enableServerErrorTitle: undefined,

  // Original text: 'Unexpected response. Please check your server address.'
  enableServerErrorMessage: undefined,

  // Original text: "Label"
  serverLabel: 'Label',

  // Original text: "Host"
  serverHost: 'Host',

  // Original text: "Username"
  serverUsername: 'Username',

  // Original text: "Password"
  serverPassword: 'Password',

  // Original text: "Read Only"
  serverReadOnly: 'Read Only',

  // Original text: "Unauthorized Certificates"
  serverUnauthorizedCertificates: 'Unauthorized Certificates',

  // Original text: "Allow Unauthorized Certificates"
  serverAllowUnauthorizedCertificates: 'Allow Unauthorized Certificates',

  // Original text: "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured."
  serverUnauthorizedCertificatesInfo:
    "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured.",

  // Original text: "username"
  serverPlaceHolderUser: 'username',

  // Original text: "password"
  serverPlaceHolderPassword: 'password',

  // Original text: "address[:port]"
  serverPlaceHolderAddress: 'address[:port]',

  // Original text: "label"
  serverPlaceHolderLabel: 'label',

  // Original text: "Connect"
  serverConnect: 'Connect',

  // Original text: "Error"
  serverError: 'Error',

  // Original text: "Adding server failed"
  serverAddFailed: 'Adding server failed',

  // Original text: "Status"
  serverStatus: 'Status',

  // Original text: "Connection failed. Click for more information."
  serverConnectionFailed: 'Connection failed. Click for more information.',

  // Original text: "Authentication error"
  serverAuthFailed: 'Authentication error',

  // Original text: "Unknown error"
  serverUnknownError: 'Unknown error',

  // Original text: "Invalid self-signed certificate"
  serverSelfSignedCertError: 'Invalid self-signed certificate',

  // Original text: "Do you want to accept self-signed certificate for this server even though it would decrease security?"
  serverSelfSignedCertQuestion:
    'Do you want to accept self-signed certificate for this server even though it would decrease security?',

  // Original text: 'Enable'
  serverEnable: undefined,

  // Original text: 'Enabled'
  serverEnabled: undefined,

  // Original text: 'Disabled'
  serverDisabled: undefined,

  // Original text: 'Disable server'
  serverDisable: undefined,

  // Original text: ' HTTP proxy URL'
  serverHttpProxy: undefined,

  // Original text: ' HTTP proxy URL'
  serverHttpProxyPlaceHolder: undefined,

  // Original text: "Copy VM"
  copyVm: 'Copy VM',

  // Original text: "Name"
  copyVmName: 'Name',

  // Original text: "e.g.: \"\\{name\\}_COPY\""
  copyVmNamePatternPlaceholder: 'e.g.: "\\{name\\}_COPY"',

  // Original text: "Select SR"
  copyVmSelectSr: 'Select SR',

  // Original text: "No target SR"
  copyVmsNoTargetSr: 'No target SR',

  // Original text: "A target SR is required to copy a VM"
  copyVmsNoTargetSrMessage: 'A target SR is required to copy a VM',

  // Original text: 'Zstd is not supported on {nVms, number} VM{nVms, plural, one {} other {s}}'
  notSupportedZstdWarning: undefined,

  // Original text: 'Click to see the concerned VMs'
  notSupportedZstdTooltip: undefined,

  // Original text: 'Fast clone'
  fastCloneMode: undefined,

  // Original text: 'Full copy'
  fullCopyMode: undefined,

  // Original text: 'Copy template'
  copyTemplate: undefined,

  // Original text: "Detach host"
  detachHostModalTitle: 'Detach host',

  // Original text: "Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST."
  detachHostModalMessage:
    'Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST.',

  // Original text: "Detach"
  detachHost: 'Detach',

  // Original text: 'Advanced Live Telemetry'
  advancedLiveTelemetry: undefined,

  // Original text: 'Netdata plugin is necessary'
  pluginNetDataIsNecessary: undefined,

  // Original text: 'Enable Advanced Live Telemetry'
  enableAdvancedLiveTelemetry: undefined,

  // Original text: 'Advanced Live Telemetry successfully enabled'
  enableAdvancedLiveTelemetrySuccess: undefined,

  // Original text: 'This feature is only XCP-ng compatible'
  xcpOnlyFeature: undefined,

  // Original text: "Forget host"
  forgetHostModalTitle: 'Forget host',

  // Original text: "Are you sure you want to forget {host} from its pool? Be sure this host can't be back online, or use detach instead."
  forgetHostModalMessage:
    "Are you sure you want to forget {host} from its pool? Be sure this host can't be back online, or use detach instead.",

  // Original text: "Forget"
  forgetHost: 'Forget',

  // Original text: 'Designate a new master'
  setPoolMasterModalTitle: undefined,

  // Original text: 'This operation may take several minutes. Do you want to continue?'
  setPoolMasterModalMessage: undefined,

  // Original text: 'Management'
  networkManagement: undefined,

  // Original text: "Create network"
  newNetworkCreate: 'Create network',

  // Original text: "Interface"
  newNetworkInterface: 'Interface',

  // Original text: "Name"
  newNetworkName: 'Name',

  // Original text: "Description"
  newNetworkDescription: 'Description',

  // Original text: "VLAN"
  newNetworkVlan: 'VLAN',

  // Original text: "No VLAN if empty"
  newNetworkDefaultVlan: 'No VLAN if empty',

  // Original text: "MTU"
  newNetworkMtu: 'MTU',

  // Original text: "Default: 1500"
  newNetworkDefaultMtu: 'Default: 1500',

  // Original text: "Bond mode"
  newNetworkBondMode: 'Bond mode',

  // Original text: 'Info'
  newNetworkInfo: undefined,

  // Original text: 'Type'
  newNetworkType: undefined,

  // Original text: 'Preferred center (optional)'
  newNetworkPreferredCenter: undefined,

  // Original text: 'Encapsulation'
  newNetworkEncapsulation: undefined,

  // Original text: 'Encrypted'
  newNetworkEncrypted: undefined,

  // Original text: 'A pool can have 1 encrypted GRE network and 1 encrypted VxLAN network max'
  encryptionWarning: undefined,

  // Original text: 'The host to try first to elect as center of the network'
  preferredCenterTip: undefined,

  // Original text: 'Please see the requirements'
  newNetworkSdnControllerTip: undefined,

  // Original text: "Delete network"
  deleteNetwork: 'Delete network',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: 'Are you sure you want to delete this network?',

  // Original text: "This network is currently in use"
  networkInUse: 'This network is currently in use',

  // Original text: "Bonded"
  pillBonded: 'Bonded',

  // Original text: 'Bonded network'
  bondedNetwork: undefined,

  // Original text: 'Private network'
  privateNetwork: undefined,

  // Original text: 'Add pool'
  addPool: undefined,

  // Original text: 'Hosts'
  hosts: undefined,

  // Original text: "No host"
  addHostNoHost: 'No host',

  // Original text: "No host selected to be added"
  addHostNoHostMessage: 'No host selected to be added',

  // Original text: 'Failed to fetch latest master commit'
  failedToFetchLatestMasterCommit: undefined,

  // Original text: "Professional support missing!"
  noProSupport: 'No pro support provided!',

  // Original text: 'Want to use in production?'
  productionUse: undefined,

  // Original text: 'Get pro support with the Xen Orchestra Appliance at {website}'
  getSupport: undefined,

  // Original text: "Bug Tracker"
  bugTracker: 'Bug Tracker',

  // Original text: "Issues? Report it!"
  bugTrackerText: 'Issues? Report it!',

  // Original text: "Community"
  community: 'Community',

  // Original text: "Join our community forum!"
  communityText: 'Join our community forum!',

  // Original text: "Free Trial for Premium Edition!"
  freeTrial: 'Free Trial for Premium Edition!',

  // Original text: "Request your trial now!"
  freeTrialNow: 'Request your trial now!',

  // Original text: "Any issue?"
  issues: 'Any issue?',

  // Original text: "Problem? Contact us!"
  issuesText: 'Problem? Contact us!',

  // Original text: "Documentation"
  documentation: 'Documentation',

  // Original text: "Read our official doc"
  documentationText: 'Read our official doc',

  // Original text: "Pro support included"
  proSupportIncluded: 'Pro support included',

  // Original text: "Access your XO Account"
  xoAccount: 'Access your XO Account',

  // Original text: "Report a problem"
  openTicket: 'Report a problem',

  // Original text: "Problem? Open a ticket!"
  openTicketText: 'Problem? Open a ticket!',

  // Original text: 'Your Xen Orchestra is up to date'
  xoUpToDate: undefined,

  // Original text: 'You are not up to date with master. {nBehind} commit{nBehind, plural, one {} other {s}} behind {nAhead, plural, =0 {} other {and {nAhead, number} commit{nAhead, plural, one {} other {s}} ahead}}'
  xoFromSourceNotUpToDate: undefined,

  // Original text: "Upgrade needed"
  upgradeNeeded: 'Upgrade needed',

  // Original text: "Upgrade now!"
  upgradeNow: 'Upgrade now!',

  // Original text: "Or"
  or: 'Or',

  // Original text: "Try it for free!"
  tryIt: 'Try it for free!',

  // Original text: "This feature is available starting from {plan} Edition"
  availableIn: 'This feature is available starting from {plan} Edition',

  // Original text: "This feature is not available in your version, contact your administrator to know more."
  notAvailable: 'This feature is not available in your version, contact your administrator to know more.',

  // Original text: "Registration"
  registration: 'Registration',

  // Original text: "Settings"
  settings: 'Settings',

  // Original text: "Proxy settings"
  proxySettings: 'Proxy settings',

  // Original text: "Host (myproxy.example.org)"
  proxySettingsHostPlaceHolder: 'Host (myproxy.example.org)',

  // Original text: "Port (eg: 3128)"
  proxySettingsPortPlaceHolder: 'Port (eg: 3128)',

  // Original text: "Username"
  proxySettingsUsernamePlaceHolder: 'Username',

  // Original text: "Password"
  proxySettingsPasswordPlaceHolder: 'Password',

  // Original text: "Your email account"
  updateRegistrationEmailPlaceHolder: 'Your email account',

  // Original text: "Your password"
  updateRegistrationPasswordPlaceHolder: 'Your password',

  // Original text: 'Troubleshooting documentation'
  updaterTroubleshootingLink: undefined,

  // Original text: "Update"
  update: 'Update',

  // Original text: "Refresh"
  refresh: 'Refresh',

  // Original text: "Upgrade"
  upgrade: 'Upgrade',

  // Original text: 'Downgrade'
  downgrade: undefined,

  // Original text: "Please consider subscribing and trying it with all the features for free during 30 days on {link}."
  considerSubscribe: 'Please consider subscribe and try it with all features for free during 15 days on {link}.',

  // Original text: "Current version:"
  currentVersion: 'Current version:',

  // Original text: "Register"
  register: 'Register',

  // Original text: "Edit registration"
  editRegistration: 'Edit registration',

  // Original text: "Please, take time to register in order to enjoy your trial."
  trialRegistration: 'Please, take time to register in order to enjoy your trial.',

  // Original text: "Start trial"
  trialStartButton: 'Start trial',

  // Original text: "You can use a trial version until {date, date, medium}. Upgrade your appliance to get it."
  trialAvailableUntil: 'You can use a trial version until {date, date, medium}. Upgrade your appliance to get it.',

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed: 'Your trial has been ended. Contact us or downgrade to Free version',

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked: 'Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service.',

  // Original text: "No update information available"
  noUpdateInfo: 'No update information available',

  // Original text: "Update information may be available"
  waitingUpdateInfo: 'Update information may be available',

  // Original text: "Your XOA is up-to-date"
  upToDate: 'Your XOA is up-to-date',

  // Original text: "You need to update your XOA (new version is available)"
  mustUpgrade: 'You need to update your XOA (new version is available)',

  // Original text: "Your XOA is not registered for updates"
  registerNeeded: 'Your XOA is not registered for updates',

  // Original text: "Can't fetch update information"
  updaterError: "Can't fetch update information",

  // Original text: "Upgrade successful"
  promptUpgradeReloadTitle: 'Upgrade successful',

  // Original text: "Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?"
  promptUpgradeReloadMessage: 'XOAは正常にアップデートされました。ブラウザでのリロードが必要です。リロードしますか？',

  // Original text: 'Upgrade warning'
  upgradeWarningTitle: undefined,

  // Original text: 'You have some backup jobs in progress. If you upgrade now, these jobs will be interrupted! Are you sure you want to continue?'
  upgradeWarningMessage: undefined,

  // Original text: 'Release channels'
  releaseChannels: undefined,

  // Original text: 'unlisted channel'
  unlistedChannel: undefined,

  // Original text: 'Unlisted channel name'
  unlistedChannelName: undefined,

  // Original text: 'Select channel'
  selectChannel: undefined,

  // Original text: 'Change channel'
  changeChannel: undefined,

  // Original text: 'The Web updater, the release channels and the proxy settings are available in XOA.'
  updaterCommunity: undefined,

  // Original text: 'XOA build:'
  xoaBuild: undefined,

  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Xen Orchestra (ソースコードベースの開発版)',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1:
    'このバージョンは、ソースコードよりインストールされた開発版です！ 個人や、非営利での利用に最適です。',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: '企業利用の場合、プロサポートが含まれるアプライアンスを利用することを推奨します。:',

  // Original text: "This version is not bundled with any support nor updates. Use it with caution."
  disclaimerText3:
    'このバージョンは開発中のものであり、サポート、アップデートはできません。クリティカルな用途には、細心の注意を払ってご利用ください。',

  // Original text: "Why do I see this message?"
  disclaimerText4: 'なぜこのメッセージが表示されますか？',

  // Original text: 'You are not registered. Your XOA may not be up to date.'
  notRegisteredDisclaimerInfo: undefined,

  // Original text: 'Click here to create an account.'
  notRegisteredDisclaimerCreateAccount: undefined,

  // Original text: 'Click here to register and update your XOA.'
  notRegisteredDisclaimerRegister: undefined,

  // Original text: "Connect PIF"
  connectPif: 'Connect PIF',

  // Original text: "Are you sure you want to connect this PIF?"
  connectPifConfirm: 'Are you sure you want to connect this PIF?',

  // Original text: "Disconnect PIF"
  disconnectPif: 'Disconnect PIF',

  // Original text: "Are you sure you want to disconnect this PIF?"
  disconnectPifConfirm: 'Are you sure you want to disconnect this PIF?',

  // Original text: "Delete PIF"
  deletePif: 'Delete PIF',

  // Original text: "Are you sure you want to delete this PIF?"
  deletePifConfirm: 'Are you sure you want to delete this PIF?',

  // Original text: 'Delete PIFs'
  deletePifs: undefined,

  // Original text: 'Are you sure you want to delete {nPifs, number} PIF{nPifs, plural, one {} other {s}}?'
  deletePifsConfirm: undefined,

  // Original text: "Connected"
  pifConnected: 'Connected',

  // Original text: "Disconnected"
  pifDisconnected: 'Disconnected',

  // Original text: "Physically connected"
  pifPhysicallyConnected: 'Physically connected',

  // Original text: "Physically disconnected"
  pifPhysicallyDisconnected: 'Physically disconnected',

  // Original text: 'Token'
  authToken: undefined,

  // Original text: 'Authentication tokens'
  authTokens: undefined,

  // Original text: 'Last use'
  authTokenLastUse: undefined,

  // Original text: "Username"
  username: 'ログインユーザ名',

  // Original text: "Password"
  password: 'パスワードの変更',

  // Original text: "Language"
  language: '言語設定',

  // Original text: "Old password"
  oldPasswordPlaceholder: '現在のパスワード',

  // Original text: "New password"
  newPasswordPlaceholder: '変更後のパスワード',

  // Original text: "Confirm new password"
  confirmPasswordPlaceholder: '変更後のパスワード(確認用)',

  // Original text: "Confirmation password incorrect"
  confirmationPasswordError: 'パスワードの一致エラー',

  // Original text: "Password does not match the confirm password."
  confirmationPasswordErrorBody: '変更後のパスワードが一致しません',

  // Original text: "Password changed"
  pwdChangeSuccess: 'パスワードの変更終了',

  // Original text: "Your password has been successfully changed."
  pwdChangeSuccessBody: 'パスワードが正常に変更されました。',

  // Original text: "Incorrect password"
  pwdChangeError: '不正なパスワード',

  // Original text: "The old password provided is incorrect. Your password has not been changed."
  pwdChangeErrorBody: '変更前のパスワードが誤っています。',

  // Original text: "OK"
  changePasswordOk: 'OK',

  // Original text: "Forget all authentication tokens"
  forgetTokens: '全ての認証トークン破棄',

  // Original text: "This prevents authenticating with existing tokens but the one used by the current session"
  forgetTokensExplained: '現在のセッションで利用している認証トークン以外の既存の認証トークンを消去します。',

  // Original text: "Successfully forgot authentication tokens"
  forgetTokensSuccess: '認証トークンの破棄に成功しました。',

  // Original text: "Error while forgetting authentication tokens"
  forgetTokensError: '認証トークンの破棄の最中にエラーが発生しました。',

  // Original text: "SSH keys"
  sshKeys: 'SSH keys',

  // Original text: 'New token'
  newAuthToken: undefined,

  // Original text: "New SSH key"
  newSshKey: 'New SSH key',

  // Original text: 'Delete selected authentication tokens'
  deleteAuthTokens: undefined,

  // Original text: "Delete"
  deleteSshKey: 'Delete',

  // Original text: 'Delete selected SSH keys'
  deleteSshKeys: undefined,

  // Original text: 'New authentication token'
  newAuthTokenModalTitle: undefined,

  // Original text: "New SSH key"
  newSshKeyModalTitle: 'New SSH key',

  // Original text: 'SSH key already exists!'
  sshKeyAlreadyExists: undefined,

  // Original text: "Invalid key"
  sshKeyErrorTitle: 'Invalid key',

  // Original text: "An SSH key requires both a title and a key."
  sshKeyErrorMessage: 'An SSH key requires both a title and a key.',

  // Original text: "Title"
  title: 'Title',

  // Original text: "Key"
  key: 'Key',

  // Original text: 'Delete authentication token'
  deleteAuthTokenConfirm: undefined,

  // Original text: 'Are you sure you want to delete the authentication token: {id}?'
  deleteAuthTokenConfirmMessage: undefined,

  // Original text: 'Delete authentication token{nTokens, plural, one {} other {s}}'
  deleteAuthTokensConfirm: undefined,

  // Original text: 'Are you sure you want to delete {nTokens, number} autentication token{nTokens, plural, one {} other {s}}?'
  deleteAuthTokensConfirmMessage: undefined,

  // Original text: "Delete SSH key"
  deleteSshKeyConfirm: 'Delete SSH key',

  // Original text: "Are you sure you want to delete the SSH key {title}?"
  deleteSshKeyConfirmMessage: 'Are you sure you want to delete the SSH key {title}?',

  // Original text: 'Delete SSH key{nKeys, plural, one {} other {s}}'
  deleteSshKeysConfirm: undefined,

  // Original text: 'Are you sure you want to delete {nKeys, number} SSH key{nKeys, plural, one {} other {s}}?'
  deleteSshKeysConfirmMessage: undefined,

  // Original text: "Add OTP authentication"
  addOtpConfirm: 'ワンタイムパスワード(OTP)認証を追加します',

  // Original text: "To enable OTP authentication, add it to your application and then enter the current password to validate."
  addOtpConfirmMessage:
    'ワンタイムパスワード(OTP)認証を有効するには、アプリにOTPを追加し、正しいパスワードを入力する必要があります。',

  // Original text: "Password is invalid"
  addOtpInvalidPassword: 'パスワードが間違っています。',

  // Original text: "Remove OTP authentication"
  removeOtpConfirm: 'OTP認証を無効化',

  // Original text: "Are you sure you want to remove OTP authentication?"
  removeOtpConfirmMessage: 'OTP認証を無効化してもよいですか？',

  // Original text: "OTP authentication"
  OtpAuthentication: 'OTP認証設定',

  // Original text: "{nOthers, number} other{nOthers, plural, one {} other {s}}"
  others: 'Others',

  // Original text: "User"
  logUser: 'User',

  // Original text: "Message"
  logMessage: 'Message',

  // Original text: 'Use XCP-ng to get rid of restrictions'
  logSuggestXcpNg: undefined,

  // Original text: 'This is a XenServer/XCP-ng error'
  logXapiError: undefined,

  // Original text: "Error"
  logError: 'Error',

  // Original text: 'Logs'
  logTitle: undefined,

  // Original text: "Display details"
  logDisplayDetails: 'Display details',

  // Original text: 'Download log'
  logDownload: undefined,

  // Original text: "Date"
  logTime: 'Date',

  // Original text: "Delete log"
  logDelete: 'Delete log',

  // Original text: 'Delete logs'
  logsDelete: undefined,

  // Original text: 'Job ID'
  logsJobId: undefined,

  // Original text: 'Job name'
  logsJobName: undefined,

  // Original text: 'Backup time'
  logsBackupTime: undefined,

  // Original text: 'Restore time'
  logsRestoreTime: undefined,

  // Original text: 'Copy log to clipboard'
  copyLogToClipboard: undefined,

  // Original text: 'VM not found!'
  logsVmNotFound: undefined,

  // Original text: 'Click to show error'
  logsFailedRestoreError: undefined,

  // Original text: 'Restore error'
  logsFailedRestoreTitle: undefined,

  // Original text: 'Delete log{nLogs, plural, one {} other {s}}'
  logDeleteMultiple: undefined,

  // Original text: 'Are you sure you want to delete {nLogs, number} log{nLogs, plural, one {} other {s}}?'
  logDeleteMultipleMessage: undefined,

  // Original text: "Click to enable"
  logIndicationToEnable: 'Click to enable',

  // Original text: "Click to disable"
  logIndicationToDisable: 'Click to disable',

  // Original text: "Report a bug"
  reportBug: 'Report a bug',

  // Original text: 'Job canceled to protect the VDI chain'
  unhealthyVdiChainError: undefined,

  // Original text: "Restart VM's backup"
  backupRestartVm: undefined,

  // Original text: "Force restart VM's backup"
  backupForceRestartVm: undefined,

  // Original text: "Restart failed VMs' backup"
  backupRestartFailedVms: undefined,

  // Original text: "Force restart failed VMs' backup"
  backupForceRestartFailedVms: undefined,

  // Original text: 'Click for more information'
  clickForMoreInformation: undefined,

  // Original text: 'Click to go to this job'
  goToThisJob: undefined,

  // Original text: 'Click to see corresponding logs'
  goToCorrespondingLogs: undefined,

  // Original text: "Name"
  ipPoolName: 'Name',

  // Original text: "IPs"
  ipPoolIps: 'IPs',

  // Original text: "Networks"
  ipPoolNetworks: 'Networks',

  // Original text: "No IP pools"
  ipsNoIpPool: 'No IP pools',

  // Original text: "Create"
  ipsCreate: 'Create',

  // Original text: "VIFs"
  ipsVifs: 'VIFs',

  // Original text: "Not used"
  ipsNotUsed: 'Not used',

  // Original text: "unknown VIF"
  ipPoolUnknownVif: 'unknown VIF',

  // Original text: "Name already exists"
  ipPoolNameAlreadyExists: 'Name already exists',

  // Original text: "Keyboard shortcuts"
  shortcutModalTitle: 'Keyboard shortcuts',

  // Original text: "Global"
  shortcut_XoApp: 'Global',

  // Original text: 'Go to hosts list'
  shortcut_XoApp_GO_TO_HOSTS: undefined,

  // Original text: 'Go to pools list'
  shortcut_XoApp_GO_TO_POOLS: undefined,

  // Original text: 'Go to VMs list'
  shortcut_XoApp_GO_TO_VMS: undefined,

  // Original text: 'Go to SRs list'
  shortcut_XoApp_GO_TO_SRS: undefined,

  // Original text: 'Create a new VM'
  shortcut_XoApp_CREATE_VM: undefined,

  // Original text: 'Unfocus field'
  shortcut_XoApp_UNFOCUS: undefined,

  // Original text: 'Show shortcuts key bindings'
  shortcut_XoApp_HELP: undefined,

  // Original text: "Home"
  shortcut_Home: 'Home',

  // Original text: 'Focus search bar'
  shortcut_Home_SEARCH: undefined,

  // Original text: 'Next item'
  shortcut_Home_NAV_DOWN: undefined,

  // Original text: 'Previous item'
  shortcut_Home_NAV_UP: undefined,

  // Original text: 'Select item'
  shortcut_Home_SELECT: undefined,

  // Original text: 'Open'
  shortcut_Home_JUMP_INTO: undefined,

  // Original text: 'Supported tables'
  shortcut_SortedTable: undefined,

  // Original text: 'Focus the table search bar'
  shortcut_SortedTable_SEARCH: undefined,

  // Original text: 'Next item'
  shortcut_SortedTable_NAV_DOWN: undefined,

  // Original text: 'Previous item'
  shortcut_SortedTable_NAV_UP: undefined,

  // Original text: 'Select item'
  shortcut_SortedTable_SELECT: undefined,

  // Original text: 'Action'
  shortcut_SortedTable_ROW_ACTION: undefined,

  // Original text: "VM"
  settingsAclsButtonTooltipVM: 'VM',

  // Original text: "Hosts"
  settingsAclsButtonTooltiphost: 'Hosts',

  // Original text: "Pool"
  settingsAclsButtonTooltippool: 'Pool',

  // Original text: "SR"
  settingsAclsButtonTooltipSR: 'SR',

  // Original text: "Network"
  settingsAclsButtonTooltipnetwork: 'Network',

  // Original text: 'Template'
  settingsCloudConfigTemplate: undefined,

  // Original text: 'Delete cloud config{nCloudConfigs, plural, one {} other {s}}'
  confirmDeleteCloudConfigsTitle: undefined,

  // Original text: 'Are you sure you want to delete {nCloudConfigs, number} cloud config{nCloudConfigs, plural, one {} other {s}}?'
  confirmDeleteCloudConfigsBody: undefined,

  // Original text: 'Delete network config{nNetworkConfigs, plural, one {} other {s}}'
  confirmDeleteNetworkConfigsTitle: undefined,

  // Original text: 'Are you sure you want to delete {nNetworkConfigs, number} network config{nNetworkConfigs, plural, one {} other {s}}?'
  confirmDeleteNetworkConfigsBody: undefined,

  // Original text: 'Delete cloud config'
  deleteCloudConfig: undefined,

  // Original text: 'Edit cloud config'
  editCloudConfig: undefined,

  // Original text: 'Delete selected cloud configs'
  deleteSelectedCloudConfigs: undefined,

  // Original text: 'Network config'
  networkConfig: undefined,

  // Original text: 'Cloud config'
  cloudConfig: undefined,

  // Original text: "No config file selected"
  noConfigFile: 'No config file selected',

  // Original text: "Try dropping a config file here or click to select a config file to upload."
  importTip: 'Try dropping a config file here, or click to select a config file to upload.',

  // Original text: "Config"
  config: 'Config',

  // Original text: "Import"
  importConfig: 'Import',

  // Original text: 'If the config is encrypted, please enter the passphrase:'
  importConfigEnterPassphrase: undefined,

  // Original text: "Config file successfully imported"
  importConfigSuccess: 'Config file successfully imported',

  // Original text: "Error while importing config file"
  importConfigError: 'Error while importing config file',

  // Original text: "Export"
  exportConfig: 'Export',

  // Original text: 'If you want to encrypt the exported config, please enter a passphrase:'
  exportConfigEnterPassphrase: undefined,

  // Original text: "Download current config"
  downloadConfig: 'Download current config',

  // Original text: 'and {n} more'
  andNMore: undefined,

  // Original text: "Snapshots and base copies can't be migrated individually"
  disabledVdiMigrateTooltip: undefined,

  // Original text: "Reconnect all hosts"
  srReconnectAllModalTitle: 'Reconnect all hosts',

  // Original text: "This will reconnect this SR to all its hosts."
  srReconnectAllModalMessage: 'This will reconnect this SR to all its hosts.',

  // Original text: "Disconnect all hosts"
  srDisconnectAllModalTitle: 'Disconnect all hosts',

  // Original text: "This will disconnect this SR from all its hosts."
  srDisconnectAllModalMessage: 'This will disconnect this SR from all its hosts.',

  // Original text: "This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR)."
  srsDisconnectAllModalMessage:
    'This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR).',

  // Original text: 'Are you sure you want to forget {nSrs, number} SR{nSrs, plural, one {} other{s}}?'
  forgetNSrsModalMessage: undefined,

  // Original text: 'You will lose all the metadata, meaning all the links between the VDIs (disks) and their respective VMs. This operation cannot be undone.'
  srForgetModalWarning: undefined,

  // Original text: "Disconnected"
  srAllDisconnected: 'Disconnected',

  // Original text: "Partially connected"
  srSomeConnected: 'Partially connected',

  // Original text: "Connected"
  srAllConnected: 'Connected',

  // Original text: 'In order to put this SR in maintenance mode, the following VM{n, plural, one {} other {s}} will be shut down. Are you sure you want to continue?'
  maintenanceSrModalBody: undefined,

  // Original text: 'Maintenance mode'
  maintenanceMode: undefined,

  // Original text: 'Migrate selected VDIs'
  migrateSelectedVdis: undefined,

  // Original text: 'All the VDIs attached to a VM must either be on a shared SR or on the same host (local SR) for the VM to be able to start.'
  migrateVdiMessage: undefined,

  // Original text: 'Backed up XO Configs'
  backedUpXoConfigs: undefined,

  // Original text: 'Manage XO Config Cloud Backup'
  manageXoConfigCloudBackup: undefined,

  // Original text: 'Select XO config'
  selectXoConfig: undefined,

  // Original text: 'XO Config Cloud Backup'
  xoConfigCloudBackup: undefined,

  // Original text: 'Your encrypted configuration is securely stored inside your Vates account and backed up once a day'
  xoConfigCloudBackupTips: undefined,

  // Original text: 'Passphrase is required to encrypt backups'
  xoCloudConfigEnterPassphrase: undefined,

  // Original text: 'Enter the passphrase:'
  xoCloudConfigRestoreEnterPassphrase: undefined,

  // Original text: "XOSAN"
  xosanTitle: 'XOSAN',

  // Original text: "Suggestions"
  xosanSuggestions: 'Suggestions',

  // Original text: 'Warning: using disperse layout is not recommended right now. Please read {link}.'
  xosanDisperseWarning: undefined,

  // Original text: "Name"
  xosanName: 'Name',

  // Original text: "Host"
  xosanHost: 'Host',

  // Original text: "Connected Hosts"
  xosanHosts: 'Hosts',

  // Original text: 'Pool'
  xosanPool: undefined,

  // Original text: "Size"
  xosanSize: 'Size',

  // Original text: "Used space"
  xosanUsedSpace: 'Used space',

  // Original text: 'License'
  license: undefined,

  // Original text: 'This XOSAN has more than 1 license!'
  xosanMultipleLicenses: undefined,

  // Original text: "XOSAN pack needs to be installed and up to date on each host of the pool."
  xosanNeedPack: 'XOSAN pack needs to be installed on each host of the pool.',

  // Original text: "Install it now!"
  xosanInstallIt: 'Install it now!',

  // Original text: "Some hosts need their toolstack to be restarted before you can create an XOSAN"
  xosanNeedRestart: 'Some hosts need their toolstack to be restarted before you can create an XOSAN',

  // Original text: "Restart toolstacks"
  xosanRestartAgents: 'Restart toolstacks',

  // Original text: 'Select no more than 1 SR per host'
  xosanSrOnSameHostMessage: undefined,

  // Original text: "Layout"
  xosanLayout: 'Layout',

  // Original text: "Redundancy"
  xosanRedundancy: 'Redundancy',

  // Original text: "Capacity"
  xosanCapacity: 'Capacity',

  // Original text: "Available space"
  xosanAvailableSpace: 'Available space',

  // Original text: "* Can fail without data loss"
  xosanDiskLossLegend: '* Can fail without data loss',

  // Original text: "Create"
  xosanCreate: 'Create',

  // Original text: "XOSAN is available in XOA"
  xosanCommunity: 'No XOSAN available for Community Edition',

  // Original text: 'New'
  xosanNew: undefined,

  // Original text: 'Advanced'
  xosanAdvanced: undefined,

  // Original text: 'Remove subvolumes'
  xosanRemoveSubvolumes: undefined,

  // Original text: 'Add subvolume…'
  xosanAddSubvolume: undefined,

  // Original text: "This version of XOSAN SR is from the first beta phase. You can keep using it, but to modify it you'll have to save your disks and re-create it."
  xosanWarning: undefined,

  // Original text: 'VLAN'
  xosanVlan: undefined,

  // Original text: 'No XOSAN found'
  xosanNoSrs: undefined,

  // Original text: 'Some SRs are detached from the XOSAN'
  xosanPbdsDetached: undefined,

  // Original text: 'Something is wrong with: {badStatuses}'
  xosanBadStatus: undefined,

  // Original text: 'Running'
  xosanRunning: undefined,

  // Original text: 'Update packs'
  xosanUpdatePacks: undefined,

  // Original text: 'Checking for updates'
  xosanPackUpdateChecking: undefined,

  // Original text: 'Error while checking XOSAN packs. Please make sure that the Cloud plugin is installed and loaded, and that the updater is reachable.'
  xosanPackUpdateError: undefined,

  // Original text: 'XOSAN resources are unavailable'
  xosanPackUpdateUnavailable: undefined,

  // Original text: 'Not registered for XOSAN resources'
  xosanPackUpdateUnregistered: undefined,

  // Original text: "✓ This pool's XOSAN packs are up to date!"
  xosanPackUpdateUpToDate: undefined,

  // Original text: 'Update pool with latest pack v{version}'
  xosanPackUpdateVersion: undefined,

  // Original text: 'Delete XOSAN'
  xosanDelete: undefined,

  // Original text: 'Fix'
  xosanFixIssue: undefined,

  // Original text: 'Creating XOSAN on {pool}'
  xosanCreatingOn: undefined,

  // Original text: 'Configuring network…'
  xosanState_configuringNetwork: undefined,

  // Original text: 'Importing VM…'
  xosanState_importingVm: undefined,

  // Original text: 'Copying VMs…'
  xosanState_copyingVms: undefined,

  // Original text: 'Configuring VMs…'
  xosanState_configuringVms: undefined,

  // Original text: 'Configuring gluster…'
  xosanState_configuringGluster: undefined,

  // Original text: 'Creating SR…'
  xosanState_creatingSr: undefined,

  // Original text: 'Scanning SR…'
  xosanState_scanningSr: undefined,

  // Original text: 'XOSAN cannot be installed on XCP-ng yet. Incoming XOSANv2 will be compatible with XCP-ng: {link}.'
  xosanXcpngWarning: undefined,

  // Original text: "Install XOA plugin first"
  xosanInstallCloudPlugin: 'Install cloud plugin first',

  // Original text: "Load XOA plugin first"
  xosanLoadCloudPlugin: 'Load cloud plugin first',

  // Original text: "No compatible XOSAN pack found for your XenServer versions."
  xosanNoPackFound: 'No compatible XOSAN pack found for your XenServer versions.',

  // Original text: 'Some XOSAN Virtual Machines are not running'
  xosanVmsNotRunning: undefined,

  // Original text: 'Some XOSAN Virtual Machines could not be found'
  xosanVmsNotFound: undefined,

  // Original text: 'Files needing healing'
  xosanFilesNeedingHealing: undefined,

  // Original text: 'Some XOSAN Virtual Machines have files needing healing'
  xosanFilesNeedHealing: undefined,

  // Original text: 'Host {hostName} is not in XOSAN network'
  xosanHostNotInNetwork: undefined,

  // Original text: 'VM controller'
  xosanVm: undefined,

  // Original text: 'SR'
  xosanUnderlyingStorage: undefined,

  // Original text: 'Replace…'
  xosanReplace: undefined,

  // Original text: 'On same VM'
  xosanOnSameVm: undefined,

  // Original text: 'Brick name'
  xosanBrickName: undefined,

  // Original text: 'Brick UUID'
  xosanBrickUuid: undefined,

  // Original text: 'Brick size'
  xosanBrickSize: undefined,

  // Original text: 'Memory size'
  xosanMemorySize: undefined,

  // Original text: 'Status'
  xosanStatus: undefined,

  // Original text: 'Arbiter'
  xosanArbiter: undefined,

  // Original text: 'Used Inodes'
  xosanUsedInodes: undefined,

  // Original text: 'Block size'
  xosanBlockSize: undefined,

  // Original text: 'Device'
  xosanDevice: undefined,

  // Original text: 'FS name'
  xosanFsName: undefined,

  // Original text: 'Mount options'
  xosanMountOptions: undefined,

  // Original text: 'Path'
  xosanPath: undefined,

  // Original text: 'Job'
  xosanJob: undefined,

  // Original text: 'PID'
  xosanPid: undefined,

  // Original text: 'Port'
  xosanPort: undefined,

  // Original text: 'Missing values'
  xosanReplaceBrickErrorTitle: undefined,

  // Original text: 'You need to select a SR and a size'
  xosanReplaceBrickErrorMessage: undefined,

  // Original text: 'Bad values'
  xosanAddSubvolumeErrorTitle: undefined,

  // Original text: 'You need to select {nSrs, number} and a size'
  xosanAddSubvolumeErrorMessage: undefined,

  // Original text: 'Select {nSrs, number} SRs'
  xosanSelectNSrs: undefined,

  // Original text: 'Run'
  xosanRun: undefined,

  // Original text: 'Remove'
  xosanRemove: undefined,

  // Original text: 'Volume'
  xosanVolume: undefined,

  // Original text: 'Volume options'
  xosanVolumeOptions: undefined,

  // Original text: 'Could not find VM'
  xosanCouldNotFindVm: undefined,

  // Original text: 'Using {usage}'
  xosanUnderlyingStorageUsage: undefined,

  // Original text: 'Custom IP network (/24)'
  xosanCustomIpNetwork: undefined,

  // Original text: 'Will configure the host xosan network device with a static IP address and plug it in.'
  xosanIssueHostNotInNetwork: undefined,

  // Original text: 'Approximate SR capacity'
  approximateSrCapacity: undefined,

  // Original text: 'By default, the management network will be used'
  byDefaultManagementNetworkUsed: undefined,

  // Original text: 'Unable to fetch physical disks from non-XCP-ng host'
  cantFetchDisksFromNonXcpngHost: undefined,

  // Original text: 'Create interface'
  createInterface: undefined,

  // Original text: 'If packages need to be installed, the toolstack on those hosts will restart. Do you want to continue?'
  createXostoreConfirm: undefined,

  // Original text: 'The disk is mounted on: {mountpoint}'
  diskAlreadyMounted: undefined,

  // Original text: 'Diskful'
  diskful: undefined,

  // Original text: 'The disk has existing partition'
  diskHasExistingPartition: undefined,

  // Original text: 'Disk incompatible with XOSTOR'
  diskIncompatibleXostor: undefined,

  // Original text: 'The disk is Read-Only'
  diskIsReadOnly: undefined,

  // Original text: 'Diskless'
  diskless: undefined,

  // Original text: 'Disks'
  disks: undefined,

  // Original text: '{field} is required'
  fieldRequired: undefined,

  // Original text: 'Some fields are missing'
  fieldsMissing: undefined,

  // Original text: 'More than 1 XOSTOR license on {host}'
  hostBoundToMultipleXostorLicenses: undefined,

  // Original text: 'No XOSTOR license on {host}'
  hostHasNoXostorLicense: undefined,

  // Original text: 'Hosts do not have the same number of disks'
  hostsNotSameNumberOfDisks: undefined,

  // Original text: 'Ignore file systems'
  ignoreFileSystems: undefined,

  // Original text: 'Force LINSTOR group creation on existing filesystem'
  ignoreFileSystemsInfo: undefined,

  // Original text: 'Interface name'
  interfaceName: undefined,

  // Original text: 'Interface name is required if a network is provided'
  interfaceNameRequired: undefined,

  // Original text: 'This interface name is reserved'
  interfaceNameReserved: undefined,

  // Original text: 'This is "tapdev" disk'
  isTapdevDisk: undefined,

  // Original text: 'License attached to an unknown XOSTOR'
  licenseBoundUnknownXostor: undefined,

  // Original text: 'No XOSTOR attached'
  licenseNotBoundXostor: undefined,

  // Original text: 'License{nLicenseIds, plural, one {} other {s}} {licenseIds} ha{nLicenseIds, plural, one {s} other {ve}} expired on {host}'
  licenseExpiredXostorWarning: undefined,

  // Original text: 'To manage this XOSTOR storage, you must resolve the following issues:'
  manageXostorWarning: undefined,

  // Original text: 'The network does not have PIFs'
  networkNoPifs: undefined,

  // Original text: 'Networks'
  networks: undefined,

  // Original text: 'Not an XCP-ng pool'
  notXcpPool: undefined,

  // Original text: 'No XOSTOR found'
  noXostorFound: undefined,

  // Original text: 'Number of hosts'
  numberOfHosts: undefined,

  // Original text: '{object} does not meet XOSTOR requirements. Refer to the documentation.'
  objectDoesNotMeetXostorRequirements: undefined,

  // Original text: 'Only show {type} that meet XOSTOR requirements'
  onlyShowXostorRequirements: undefined,

  // Original text: 'Pool already has a XOSTOR'
  poolAlreadyHasXostor: undefined,

  // Original text: 'Not recent enough. Current version: {version}'
  poolNotRecentEnough: undefined,

  // Original text: 'Not all PIFs have an IP'
  pifsNoIp: undefined,

  // Original text: 'Not all PIFs are attached'
  pifsNotAttached: undefined,

  // Original text: 'Not all PIFs are static'
  pifsNotStatic: undefined,

  // Original text: 'Replication'
  replication: undefined,

  // Original text: 'Replication count is higher than number of hosts with disks'
  replicationCountHigherThanHostsWithDisks: undefined,

  // Original text: 'Resource list'
  resourceList: undefined,

  // Original text: 'As long as a XOSTOR storage is present in the pool, Rolling Pool Update will not be available'
  rpuNoLongerAvailableIfXostor: undefined,

  // Original text: 'Select disk(s)…'
  selectDisks: undefined,

  // Original text: 'Only disks of type "Disk" and "Raid" are accepted. Selected disk type: {type}.'
  selectedDiskTypeIncompatibleXostor: undefined,

  // Original text: 'Set as preferred'
  setAsPreferred: undefined,

  // Original text: 'Storage'
  storage: undefined,

  // Original text: 'Summary'
  summary: undefined,

  // Original text: 'Tie breaker'
  tieBreaker: undefined,

  // Original text: 'White space not allowed'
  whiteSpaceNotAllowed: undefined,

  // Original text: 'Wrong number of hosts'
  wrongNumberOfHosts: undefined,

  // Original text: 'XOSTOR'
  xostor: undefined,

  // Original text: 'XOSTOR is available in XOA'
  xostorAvailableInXoa: undefined,

  // Original text: 'XOSTOR creation'
  xostorCreation: undefined,

  // Original text: 'At least one disk is required'
  xostorDiskRequired: undefined,

  // Original text: '({nDisks, number} disk{nDisks, plural, one {} other {s}}) {hostname}'
  xostorDisksDropdownLabel: undefined,

  // Original text: '"xcp-ng-release-linstor" and "xcp-ng-linstor" will be installed on each host'
  xostorPackagesWillBeInstalled: undefined,

  // Original text: 'If a disk dies, you will lose data'
  xostorReplicationWarning: undefined,

  // Original text: 'Hub'
  hubPage: undefined,

  // Original text: 'Hub is available in XOA'
  hubCommunity: undefined,

  // Original text: 'The selected pool has no default SR'
  noDefaultSr: undefined,

  // Original text: 'VM installed successfully'
  successfulInstall: undefined,

  // Original text: 'No VMs available '
  vmNoAvailable: undefined,

  // Original text: 'Create'
  create: undefined,

  // Original text: 'Resource alert'
  hubResourceAlert: undefined,

  // Original text: 'OS'
  os: undefined,

  // Original text: 'Version'
  version: undefined,

  // Original text: 'Size'
  size: undefined,

  // Original text: 'Total disk size'
  totalDiskSize: undefined,

  // Original text: 'Already installed templates are hidden'
  hideInstalledPool: undefined,

  // Original text: 'XVA import'
  hubImportNotificationTitle: undefined,

  // Original text: 'No description available for this template'
  hubTemplateDescriptionNotAvailable: undefined,

  // Original text: 'Recipe created successfully'
  recipeCreatedSuccessfully: undefined,

  // Original text: 'View created VMs'
  recipeViewCreatedVms: undefined,

  // Original text: 'Templates'
  templatesLabel: undefined,

  // Original text: 'Recipes'
  recipesLabel: undefined,

  // Original text: 'Network'
  network: undefined,

  // Original text: 'Select Kubernetes version'
  recipeSelectK8sVersion: undefined,

  // Original text: 'Cluster name'
  recipeClusterNameLabel: undefined,

  // Original text: 'Number of worker nodes'
  recipeNumberOfNodesLabel: undefined,

  // Original text: 'SSH key'
  recipeSshKeyLabel: undefined,

  // Original text: 'Static IP addresses'
  recipeStaticIpAddresses: undefined,

  // Original text: 'Control plane fault tolerance'
  recipeFaultTolerance: undefined,

  // Original text: 'No fault tolerance (one control plane)'
  recipeNoneFaultTolerance: undefined,

  // Original text: 'One fault tolerance (three control planes)'
  recipeOneFaultTolerance: undefined,

  // Original text: 'Two fault tolerances (five control planes)'
  recipeTwoFaultTolerance: undefined,

  // Original text: 'Three fault tolerances (seven control planes)'
  recipeThreeFaultTolerance: undefined,

  // Original text: 'Control plane { i, number } node IP address/subnet mask'
  recipeHaControPlaneIpAddress: undefined,

  // Original text: 'VIP address'
  recipeVip: undefined,

  // Original text: 'Control plane node IP address/subnet mask'
  recipeControlPlaneIpAddress: undefined,

  // Original text: 'Worker node { i, number } IP address/subnet mask'
  recipeWorkerIpAddress: undefined,

  // Original text: 'Gateway IP address'
  recipeGatewayIpAddress: undefined,

  // Original text: 'Nameserver IP addresses'
  recipeNameserverAddresses: undefined,

  // Original text: '192.168.1.0,172.16.1.0'
  recipeNameserverAddressesExample: undefined,

  // Original text: 'Search domains'
  recipeSearches: undefined,

  // Original text: 'domain.com,search.org'
  recipeSearchesExample: undefined,

  // Original text: 'Action/Event'
  auditActionEvent: undefined,

  // Original text: 'The record ({ id }) was altered ({ n, number } valid records)'
  auditAlteredRecord: undefined,

  // Original text: 'Check integrity'
  auditCheckIntegrity: undefined,

  // Original text: 'Copy fingerprint to clipboard'
  auditCopyFingerprintToClipboard: undefined,

  // Original text: 'Generate a new fingerprint'
  auditGenerateNewFingerprint: undefined,

  // Original text: 'The record ({ id }) is missing ({ n, number } valid records)'
  auditMissingRecord: undefined,

  // Original text: 'Fingerprint'
  auditEnterFingerprint: undefined,

  // Original text: "Enter the saved fingerprint to check the previous logs' integrity. If you don't have any, click OK."
  auditEnterFingerprintInfo: undefined,

  // Original text: 'Audit record'
  auditRecord: undefined,

  // Original text: 'Integrity verified'
  auditIntegrityVerified: undefined,

  // Original text: 'Keep this fingerprint to be able to check the integrity of the current records later.'
  auditSaveFingerprintInfo: undefined,

  // Original text: 'However, if you trust the current state of the records, keep this fingerprint to be able to check their integrity later.'
  auditSaveFingerprintInErrorInfo: undefined,

  // Original text: 'New fingerprint'
  auditNewFingerprint: undefined,

  // Original text: 'Download records'
  downloadAuditRecords: undefined,

  // Original text: 'Display record'
  displayAuditRecord: undefined,

  // Original text: 'No audit record available'
  noAuditRecordAvailable: undefined,

  // Original text: 'Refresh records list'
  refreshAuditRecordsList: undefined,

  // Original text: 'User actions recording is currently inactive'
  auditInactiveUserActionsRecord: undefined,

  // Original text: 'All hosts must be bound to a license'
  allHostsMustBeBound: undefined,

  // Original text: 'Bound (Plan (ID), expiration date, host - pool)'
  boundSelectLicense: undefined,

  // Original text: 'Bind XCP-ng licenses'
  bindXcpngLicenses: undefined,

  // Original text: 'You are about to bind {nLicenses, number} professional support license{nLicenses, plural, one {} other {s}} on older and unsupported XCP-ng version{nLicenses, plural, one {} other {s}}. Are you sure you want to continue?'
  confirmBindingOnUnsupportedHost: undefined,

  // Original text: 'The following pools will no longer be fully supported'
  confirmRebindLicenseFromFullySupportedPool: undefined,

  // Original text: 'Licenses'
  licenses: undefined,

  // Original text: 'Licenses binding'
  licensesBinding: undefined,

  // Original text: 'Not enough XCP-ng licenses'
  notEnoughXcpngLicenses: undefined,

  // Original text: 'Not bound (Plan (ID), expiration date)'
  notBoundSelectLicense: undefined,

  // Original text: "To bind an XCP-ng license, go to the pool's Advanced tab."
  xcpngLicensesBindingAvancedView: undefined,

  // Original text: 'You are not registered and therefore will not be able to create or manage your XOSAN SRs. {link}'
  xosanUnregisteredDisclaimer: undefined,

  // Original text: 'In order to create a XOSAN SR, you need to use the Xen Orchestra Appliance and buy a XOSAN license on {link}.'
  xosanSourcesDisclaimer: undefined,

  // Original text: 'Register now!'
  registerNow: undefined,

  // Original text: 'You need to register your appliance to manage your licenses.'
  licensesUnregisteredDisclaimer: undefined,

  // Original text: 'Product'
  licenseProduct: undefined,

  // Original text: 'Purchaser'
  licensePurchaser: undefined,

  // Original text: 'Expires'
  licenseExpires: undefined,

  // Original text: 'You'
  licensePurchaserYou: undefined,

  // Original text: 'Support'
  productSupport: undefined,

  // Original text: 'No XOSAN attached'
  licenseNotBoundXosan: undefined,

  // Original text: 'No proxy attached'
  licenseNotBoundProxy: undefined,

  // Original text: 'License attached to an unknown XOSAN'
  licenseBoundUnknownXosan: undefined,

  // Original text: 'License attached to an unknown proxy'
  licenseBoundUnknownProxy: undefined,

  // Original text: 'Manage the licenses'
  licensesManage: undefined,

  // Original text: 'New license'
  newLicense: undefined,

  // Original text: 'Refresh'
  refreshLicenses: undefined,

  // Original text: 'Limited size because XOSAN is in trial'
  xosanLicenseRestricted: undefined,

  // Original text: 'You need a license on this SR to manage the XOSAN.'
  xosanAdminNoLicenseDisclaimer: undefined,

  // Original text: 'Your XOSAN license has expired. You can still use the SR but cannot administrate it anymore.'
  xosanAdminExpiredLicenseDisclaimer: undefined,

  // Original text: 'Could not check the license on this XOSAN SR'
  xosanCheckLicenseError: undefined,

  // Original text: 'Could not fetch licenses'
  getLicensesError: undefined,

  // Original text: 'License has expired.'
  licenseHasExpired: undefined,

  // Original text: 'License bound to another XOA'
  licenseBoundToOtherXoa: undefined,

  // Original text: 'This license is active on this XOA'
  licenseBoundToThisXoa: undefined,

  // Original text: 'License expires on {date}.'
  licenseExpiresDate: undefined,

  // Original text: 'Update the license now!'
  updateLicenseMessage: undefined,

  // Original text: 'Unknown XOSAN SR.'
  xosanUnknownSr: undefined,

  // Original text: 'Contact us!'
  contactUs: undefined,

  // Original text: 'No license.'
  xosanNoLicense: undefined,

  // Original text: 'Unlock now!'
  unlockNow: undefined,

  // Original text: 'Select a license'
  selectLicense: undefined,

  // Original text: 'Bind license'
  bindLicense: undefined,

  // Original text: 'Bind licenses'
  bindLicenses: undefined,

  // Original text: 'expires on {date}'
  expiresOn: undefined,

  // Original text: 'Install XOA plugin first'
  xosanInstallXoaPlugin: undefined,

  // Original text: 'Load XOA plugin first'
  xosanLoadXoaPlugin: undefined,

  // Original text: 'Activate license'
  bindXoaLicense: undefined,

  // Original text: 'Move license to this XOA'
  rebindXoaLicense: undefined,

  // Original text: 'Are you sure you want to activate this license on your XOA? This action is not reversible!'
  bindXoaLicenseConfirm: undefined,

  // Original text: 'activate {licenseType} license'
  bindXoaLicenseConfirmText: undefined,

  // Original text: 'Update needed'
  updateNeeded: undefined,

  // Original text: 'Starter license'
  starterLicense: undefined,

  // Original text: 'Enterprise license'
  enterpriseLicense: undefined,

  // Original text: 'Premium license'
  premiumLicense: undefined,

  // Original text: 'You are currently in a {edition} trial period that will end on {date, date, medium}'
  trialLicenseInfo: undefined,

  // Original text: 'This proxy has more than 1 license!'
  proxyMultipleLicenses: undefined,

  // Original text: 'Unknown proxy VM.'
  proxyUnknownVm: undefined,

  // Original text: 'XOSTOR Pro Support enabled'
  xostorProSupportEnabled: undefined,

  // Original text: 'Only available to Enterprise users'
  onlyAvailableToEnterprise: undefined,

  // Original text: 'Forget prox{n, plural, one {y} other {ies}}'
  forgetProxyApplianceTitle: undefined,

  // Original text: 'Are you sure you want to forget {n, number} prox{n, plural, one {y} other {ies}}?'
  forgetProxyApplianceMessage: undefined,

  // Original text: 'Forget proxy(ies)'
  forgetProxies: undefined,

  // Original text: 'Destroy prox{n, plural, one {y} other {ies}}'
  destroyProxyApplianceTitle: undefined,

  // Original text: 'Are you sure you want to destroy {n, number} prox{n, plural, one {y} other {ies}}?'
  destroyProxyApplianceMessage: undefined,

  // Original text: 'Destroy proxy(ies)'
  destroyProxies: undefined,

  // Original text: 'Deploy a proxy'
  deployProxy: undefined,

  // Original text: 'Redeploy proxy'
  redeployProxy: undefined,

  // Original text: 'Redeploy this proxy'
  redeployProxyAction: undefined,

  // Original text: 'This action will destroy the old proxy VM'
  redeployProxyWarning: undefined,

  // Original text: 'Register a proxy'
  registerProxy: undefined,

  // Original text: 'No proxies available'
  noProxiesAvailable: undefined,

  // Original text: 'Test your proxy'
  checkProxyHealth: undefined,

  // Original text: 'Update appliance settings'
  updateProxyApplianceSettings: undefined,

  // Original text: 'URL not found'
  urlNotFound: undefined,

  // Original text: 'Authentication token'
  proxyAuthToken: undefined,

  // Original text: 'Unable to connect to this proxy. Do you want to forget it?'
  proxyConnectionFailedAfterRegistrationMessage: undefined,

  // Original text: 'Copy proxy URL'
  proxyCopyUrl: undefined,

  // Original text: 'Proxy error'
  proxyError: undefined,

  // Original text: 'VM UUID is optional but recommended.'
  proxyOptionalVmUuid: undefined,

  // Original text: 'Test passed for {name}'
  proxyTestSuccess: undefined,

  // Original text: 'The proxy appears to work correctly'
  proxyTestSuccessMessage: undefined,

  // Original text: 'Test failed for {name}'
  proxyTestFailed: undefined,

  // Original text: 'Unable to connect to this proxy'
  proxyTestFailedConnectionIssueMessage: undefined,

  // Original text: 'Click to see linked remotes'
  proxyLinkedRemotes: undefined,

  // Original text: 'Click to see linked backups'
  proxyLinkedBackups: undefined,

  // Original text: 'Default to: {dns}'
  proxyNetworkDnsPlaceHolder: undefined,

  // Original text: 'Default to: {netmask}'
  proxyNetworkNetmaskPlaceHolder: undefined,

  // Original text: 'The select only contains SRs connected to at least one HVM-capable host'
  proxySrPredicateInfo: undefined,

  // Original text: 'HTTP proxy'
  httpProxy: undefined,

  // Original text: 'protocol://username:password@address:port'
  httpProxyPlaceholder: undefined,

  // Original text: 'Unable to check upgrades availability'
  proxyUpgradesError: undefined,

  // Original text: 'Leave the field empty and click on OK to remove the existing configuration'
  proxyApplianceSettingsInfo: undefined,

  // Original text: 'Your proxy is up-to-date'
  proxyUpToDate: undefined,

  // Original text: 'The upgrade will interrupt {nJobs, number} running backup job{nJobs, plural, one {} other {s}}. Do you want to continue?'
  proxyRunningBackupsMessage: undefined,

  // Original text: 'Some proxies need to be upgraded.'
  proxiesNeedUpgrade: undefined,

  // Original text: 'Some proxies need to be upgraded. Click here to get more information.'
  upgradeNeededForProxies: undefined,

  // Original text: 'XO Proxy: a concrete guide'
  xoProxyConcreteGuide: undefined,

  // Original text: '{n, number} prox{n, plural, one {y} other {ies}} ha{n, plural, one {s} other {ve}} error{n, plural, one {} other {s}}'
  someProxiesHaveErrors: undefined,

  // Original text: '{seconds, plural, one {# second} other {# seconds}}'
  secondsFormat: undefined,

  // Original text: '{days, plural, =0 {} one {# day } other {# days }}{hours, plural, =0 {} one {# hour } other {# hours }}{minutes, plural, =0 {} one {# minute } other {# minutes }}{seconds, plural, =0 {} one {# second} other {# seconds}}'
  durationFormat: undefined,

  // Original text: '{n, number}x CPU{n, plural, one {} other {s}} (highest: {degres})'
  highestCpuTemperature: undefined,

  // Original text: '{n, number}x fan{n, plural, one {} other {s}} (highest: {speed})'
  highestFanSpeed: undefined,

  // Original text: 'Inlet temperature'
  inletTemperature: undefined,

  // Original text: 'IPMI'
  ipmi: undefined,

  // Original text: '{n, number}x fan{n, plural, one {} other {s}} status: {status}'
  nFanStatus: undefined,

  // Original text: '{n, number}x PSU{n, plural, one {} other {s}} status: {status}'
  nPsuStatus: undefined,

  // Original text: 'Outlet temperature'
  outletTemperature: undefined,

  // Original text: 'Total power'
  totalPower: undefined,
}
