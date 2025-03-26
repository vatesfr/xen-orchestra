// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/ru'

import reactIntlData from 'react-intl/locale-data/ru'
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

  // Original text: '{key}: {value}'
  keyValue: undefined,

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

  // Original text: 'UUID'
  uuid: undefined,

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
  statusConnecting: 'Подключение',

  // Original text: "Disconnected"
  statusDisconnected: 'Отключено',

  // Original text: "Loading…"
  statusLoading: 'Загружается...',

  // Original text: "Page not found"
  errorPageNotFound: 'Страница не найдена',

  // Original text: "No such item"
  errorNoSuchItem: 'элемент не найден',

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
  editableLongClickPlaceholder: 'Долгое нажатие для редактирования',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'Нажмите для редактирования',

  // Original text: "Browse files"
  browseFiles: 'Просмотреть файлы',

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
  genericCancel: 'Отмена',

  // Original text: 'Enter the following text to confirm:'
  enterConfirmText: undefined,

  // Original text: "On error"
  onError: 'При ошибке',

  // Original text: "Successful"
  successful: 'Успешно',

  // Original text: 'Hide short tasks'
  filterOutShortTasks: undefined,

  // Original text: "Managed disks"
  filterOnlyManaged: 'Управляемые диски',

  // Original text: 'Orphaned disks'
  filterOnlyOrphaned: undefined,

  // Original text: 'Normal disks'
  filterOnlyRegular: undefined,

  // Original text: 'Running VMs'
  filterOnlyRunningVms: undefined,

  // Original text: "Snapshot disks"
  filterOnlySnapshots: 'Снимки дисков',

  // Original text: 'Unmanaged disks'
  filterOnlyUnmanaged: undefined,

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
  copyToClipboard: 'Копировать в буфер обмена',

  // Original text: 'Copy VDI UUID'
  copyToClipboardVdiUuid: undefined,

  // Original text: 'Copy {uuid}'
  copyUuid: undefined,

  // Original text: 'Copy {value}'
  copyValue: undefined,

  // Original text: 'Master'
  pillMaster: undefined,

  // Original text: "Home"
  homePage: 'Главная',

  // Original text: "VMs"
  homeVmPage: 'Виртуальные машины',

  // Original text: "Hosts"
  homeHostPage: 'Хосты',

  // Original text: "Pools"
  homePoolPage: 'Пулы',

  // Original text: "Templates"
  homeTemplatePage: 'Шаблоны',

  // Original text: "Storage"
  homeSrPage: 'Хранилища',

  // Original text: "Dashboard"
  dashboardPage: 'Контрольная панель',

  // Original text: "Overview"
  overviewDashboardPage: 'Обзор',

  // Original text: "Visualizations"
  overviewVisualizationDashboardPage: 'Визуализация',

  // Original text: "Statistics"
  overviewStatsDashboardPage: 'Статистика',

  // Original text: "Health"
  overviewHealthDashboardPage: 'Здоровье',

  // Original text: "Self service"
  selfServicePage: 'Самообслуживание',

  // Original text: "Backup"
  backupPage: 'Резервная копия',

  // Original text: "Jobs"
  jobsPage: 'Задачи',

  // Original text: 'XOA'
  xoaPage: undefined,

  // Original text: "Updates"
  updatePage: 'Обновления',

  // Original text: 'Licenses'
  licensesPage: undefined,

  // Original text: 'Notifications'
  notificationsPage: undefined,

  // Original text: 'Support'
  supportPage: undefined,

  // Original text: "Settings"
  settingsPage: 'Настройки',

  // Original text: 'Audit'
  settingsAuditPage: undefined,

  // Original text: "Servers"
  settingsServersPage: 'Серверы',

  // Original text: "Users"
  settingsUsersPage: 'Пользователи',

  // Original text: "Groups"
  settingsGroupsPage: 'Группы',

  // Original text: "ACLs"
  settingsAclsPage: 'Управление доступом',

  // Original text: "Plugins"
  settingsPluginsPage: 'Плагины',

  // Original text: "Logs"
  settingsLogsPage: 'Журналы',

  // Original text: 'Cloud configs'
  settingsCloudConfigsPage: undefined,

  // Original text: "IPs"
  settingsIpsPage: 'IP адреса',

  // Original text: "About"
  aboutPage: 'О программе',

  // Original text: "About XO {xoaPlan}"
  aboutXoaPlan: 'О Xen Orchestra {xoaPlan}',

  // Original text: "New"
  newMenu: 'Добавить',

  // Original text: "Tasks"
  taskMenu: 'Задачи',

  // Original text: "Tasks"
  taskPage: 'Задачи',

  // Original text: 'Network'
  newNetworkPage: undefined,

  // Original text: "VM"
  newVmPage: 'ВМ',

  // Original text: "Storage"
  newSrPage: 'Хранилище',

  // Original text: "Server"
  newServerPage: 'Сервер',

  // Original text: "Import"
  newImport: 'Импорт',

  // Original text: 'XOSAN'
  xosan: undefined,

  // Original text: "Overview"
  backupOverviewPage: 'Обзор',

  // Original text: "New"
  backupNewPage: 'Создать',

  // Original text: 'Remotes'
  backupRemotesPage: undefined,

  // Original text: "Restore"
  backupRestorePage: 'Восстановление',

  // Original text: "File restore"
  backupFileRestorePage: 'Восстановление файлов',

  // Original text: "Schedule"
  schedule: 'Расписание',

  // Original text: "Backup"
  backup: 'Резервная копия',

  // Original text: 'Rolling Snapshot'
  rollingSnapshot: undefined,

  // Original text: 'Delta Backup'
  deltaBackup: undefined,

  // Original text: 'Disaster Recovery'
  disasterRecovery: undefined,

  // Original text: 'Continuous Replication'
  continuousReplication: undefined,

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

  // Original text: 'Mirror backup'
  mirrorBackup: undefined,

  // Original text: 'VM Mirror Backup'
  mirrorBackupVms: undefined,

  // Original text: "Overview"
  jobsOverviewPage: 'Обзор',

  // Original text: "New"
  jobsNewPage: 'Добавить',

  // Original text: "Scheduling"
  jobsSchedulingPage: 'Планировщик',

  // Original text: "Custom Job"
  customJob: 'Пользовательская задача',

  // Original text: "User"
  userPage: 'Пользователь',

  // Original text: 'XOA'
  xoa: undefined,

  // Original text: "No support"
  noSupport: 'Без поддержки',

  // Original text: "Free upgrade!"
  freeUpgrade: 'Бесплатное обновление!',

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
  signOut: 'Выйти',

  // Original text: "Edit my settings {username}"
  editUserProfile: 'Изменить мои настройки {username}',

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
  homeFetchingData: 'Извлечение  данных…',

  // Original text: "Welcome to Xen Orchestra!"
  homeWelcome: 'Добро пожаловать в Xen Orchestra!',

  // Original text: "Add your XCP-ng hosts or pools"
  homeWelcomeText: 'Добавьте свои хосты и пулы XCP-ng',

  // Original text: "Some XCP-ng hosts have been registered but are not connected"
  homeConnectServerText: 'Некоторые серверы XenServer зарегистрированы, но не подключены',

  // Original text: "Want some help?"
  homeHelp: 'Нужна помощь?',

  // Original text: "Add server"
  homeAddServer: 'Добавить сервер',

  // Original text: "Connect servers"
  homeConnectServer: 'Подключить серверы',

  // Original text: "Online doc"
  homeOnlineDoc: 'Онлайн документация',

  // Original text: "Pro support"
  homeProSupport: 'Поддержка уровня "Pro"',

  // Original text: "There are no VMs!"
  homeNoVms: 'Виртуальных машин нет!',

  // Original text: "Or…"
  homeNoVmsOr: 'Или…',

  // Original text: "Import VM"
  homeImportVm: 'Импорт ВМ',

  // Original text: "Import an existing VM in xva format"
  homeImportVmMessage: 'Импорт существующей виртуальной машины в формате xva',

  // Original text: "Restore a backup"
  homeRestoreBackup: 'Восстановить резервную копию',

  // Original text: "Restore a backup from a remote store"
  homeRestoreBackupMessage: 'Восстановить резервную копию из удаленного хранилища',

  // Original text: "This will create a new VM"
  homeNewVmMessage: 'Это создаст новую ВМ',

  // Original text: "Filters"
  homeFilters: 'Фильтры',

  // Original text: "No results! Click here to reset your filters"
  homeNoMatches: 'Ничего не найдено! Нажмите, что-бы сбросить фильтры',

  // Original text: "Pool"
  homeTypePool: 'Пул',

  // Original text: "Host"
  homeTypeHost: 'Хост',

  // Original text: "VM"
  homeTypeVm: 'ВМ',

  // Original text: 'SR'
  homeTypeSr: undefined,

  // Original text: "Template"
  homeTypeVmTemplate: 'Шаблон',

  // Original text: "Sort"
  homeSort: 'Сортировка',

  // Original text: "Pools"
  homeAllPools: 'Пулы',

  // Original text: "Hosts"
  homeAllHosts: 'Хосты',

  // Original text: "Tags"
  homeAllTags: 'Тэги',

  // Original text: 'Resource sets'
  homeAllResourceSets: undefined,

  // Original text: "New VM"
  homeNewVm: 'Новая ВМ',

  // Original text: 'None'
  homeFilterNone: undefined,

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: 'Отключенные хосты',

  // Original text: "Pending VMs"
  homeFilterPendingVms: 'Ожидание ВМ',

  // Original text: 'HVM guests'
  homeFilterHvmGuests: undefined,

  // Original text: "Sort by"
  homeSortBy: 'Сортировать по',

  // Original text: 'CPUs'
  homeSortByCpus: undefined,

  // Original text: 'Start time'
  homeSortByStartTime: undefined,

  // Original text: "Name"
  homeSortByName: 'Название',

  // Original text: "Power state"
  homeSortByPowerstate: 'Состояние питания',

  // Original text: 'RAM'
  homeSortByRAM: undefined,

  // Original text: "Shared/Not shared"
  homeSortByShared: 'Общий доступ/Без общего доступа',

  // Original text: "Size"
  homeSortBySize: 'Размер',

  // Original text: "Type"
  homeSortByType: 'Тип',

  // Original text: "Usage"
  homeSortByUsage: 'Используется',

  // Original text: 'Snapshots'
  homeSortVmsBySnapshots: undefined,

  // Original text: 'Container'
  homeSortByContainer: undefined,

  // Original text: 'Pool'
  homeSortByPool: undefined,

  // Original text: "{displayed, number}x {icon} (of {total, number})"
  homeDisplayedItems: '{displayed, number}x {icon} (на {total, number})',

  // Original text: "{selected, number}x {icon} selected (of {total, number})"
  homeSelectedItems: '{selected, number}x {icon} выбранных (на {total, number})',

  // Original text: "More"
  homeMore: 'Больше',

  // Original text: "Migrate to…"
  homeMigrateTo: 'Переместить на…',

  // Original text: "Missing patches"
  homeMissingPatches: 'Отсутствующие исправления',

  // Original text: 'Master:'
  homePoolMaster: undefined,

  // Original text: "Resource set: {resourceSet}"
  homeResourceSet: 'Набор ресурсов',

  // Original text: 'Some VDIs need to be coalesced'
  homeSrVdisToCoalesce: undefined,

  // Original text: "High Availability"
  highAvailability: 'Высокая доступность',

  // Original text: 'Power state'
  powerState: undefined,

  // Original text: "Shared {type}"
  srSharedType: 'Общий доступ {type}',

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

  // Original text: 'All of them are selected ({nItems, number})'
  sortedTableAllItemsSelected: undefined,

  // Original text: 'No items found'
  sortedTableNoItems: undefined,

  // Original text: '{nFiltered, number} of {nTotal, number} items'
  sortedTableNumberOfFilteredItems: undefined,

  // Original text: '{nTotal, number} items'
  sortedTableNumberOfItems: undefined,

  // Original text: '{nSelected, number} selected'
  sortedTableNumberOfSelectedItems: undefined,

  // Original text: 'Click here to select all items'
  sortedTableSelectAllItems: undefined,

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
  add: 'Добавить',

  // Original text: "Select all"
  selectAll: 'Выбрать всё',

  // Original text: "Remove"
  remove: 'Удалить',

  // Original text: "Preview"
  preview: 'Предпросмотр',

  // Original text: 'Action'
  action: undefined,

  // Original text: "Item"
  item: 'Элемент',

  // Original text: "No selected value"
  noSelectedValue: 'Нет выбранных значений',

  // Original text: "Choose user(s) and/or group(s)"
  selectSubjects: 'Выберите пользователя(ей) и/или группу(ы)',

  // Original text: "Select object(s)…"
  selectObjects: 'Выберите объект(ы)…',

  // Original text: "Choose a role"
  selectRole: 'Выберите роль',

  // Original text: 'Select a host first'
  selectHostFirst: undefined,

  // Original text: "Select host(s)…"
  selectHosts: 'Выберите Хост(ы)…',

  // Original text: "Select object(s)…"
  selectHostsVms: 'Выберите объект(ы)…',

  // Original text: "Select network(s)…"
  selectNetworks: 'Выберите сеть/сети…',

  // Original text: 'Select PCI(s)…'
  selectPcis: undefined,

  // Original text: "Select PIF(s)…"
  selectPifs: 'Выберите физический(ие) сетевой(вые) интерфейс(ы)…',

  // Original text: "Select pool(s)…"
  selectPools: 'Выберите Пул(ы)…',

  // Original text: "Select remote(s)…"
  selectRemotes: 'Выберите удаленное(ые) хранилище(я)…',

  // Original text: 'Select proxy(ies)…'
  selectProxies: undefined,

  // Original text: 'Select proxy…'
  selectProxy: undefined,

  // Original text: "Select resource set(s)…"
  selectResourceSets: 'Выберите набор(ы) ресурсов',

  // Original text: "Select template(s)…"
  selectResourceSetsVmTemplate: 'Выберите шаблон(ы)…',

  // Original text: "Select SR(s)…"
  selectResourceSetsSr: 'Выберите SR(s)…',

  // Original text: "Select network(s)…"
  selectResourceSetsNetwork: 'Выберите сеть(и)…',

  // Original text: "Select disk(s)…"
  selectResourceSetsVdi: 'Выберите диск(и)…',

  // Original text: "Select SSH key(s)…"
  selectSshKey: 'Выберите SSH-ключ(и)…',

  // Original text: "Select SR(s)…"
  selectSrs: 'Выберите SR(s)…',

  // Original text: "Select VM(s)…"
  selectVms: 'Выберите виртуальную(ые) машину(ы)…',

  // Original text: 'Select snapshot(s)…'
  selectVmSnapshots: undefined,

  // Original text: "Select VM template(s)…"
  selectVmTemplates: 'Выберите шаблон(ы) ВМ…',

  // Original text: "Select tag(s)…"
  selectTags: 'Выберите тэги(s)…',

  // Original text: "Select disk(s)…"
  selectVdis: 'Выберите диск(и)…',

  // Original text: "Select timezone…"
  selectTimezone: 'Выберите часовой пояс…',

  // Original text: "Select IP(s)…"
  selectIp: 'Выберите IP-адрес(а)…',

  // Original text: "Select IP pool(s)…"
  selectIpPool: 'Выберите пул(ы) IP-адресов…',

  // Original text: 'Select VGPU type(s)…'
  selectVgpuType: undefined,

  // Original text: "Fill information (optional)"
  fillOptionalInformations: 'Введите данные (опционально)',

  // Original text: "Reset"
  selectTableReset: 'Сброс',

  // Original text: 'Select cloud config(s)…'
  selectCloudConfigs: undefined,

  // Original text: 'Select network config(s)…'
  selectNetworkConfigs: undefined,

  // Original text: "Month"
  schedulingMonth: 'Месяц',

  // Original text: "Day"
  schedulingDay: 'День',

  // Original text: "Switch to week days"
  schedulingSetWeekDayMode: 'Переключиться на дни недели',

  // Original text: "Switch to month days"
  schedulingSetMonthDayMode: 'Переключиться на дни месяца',

  // Original text: "Hour"
  schedulingHour: 'Час',

  // Original text: "Minute"
  schedulingMinute: 'Минута',

  // Original text: "Every month"
  selectTableAllMonth: 'Каждый месяц',

  // Original text: "Every day"
  selectTableAllDay: 'Каждый день',

  // Original text: "Every hour"
  selectTableAllHour: 'Каждый час',

  // Original text: "Every minute"
  selectTableAllMinute: 'Каждую минуту',

  // Original text: "Web browser timezone"
  timezonePickerUseLocalTime: 'Часовой пояс WEB-браузера',

  // Original text: "Server timezone ({value})"
  serverTimezoneOption: 'Часовой пояс сервера ({value})',

  // Original text: "Cron Pattern:"
  cronPattern: 'Cron-шаблон: ',

  // Original text: "Successful"
  successfulJobCall: 'Успешно',

  // Original text: "Failed"
  failedJobCall: 'Провал',

  // Original text: 'Skipped'
  jobCallSkipped: undefined,

  // Original text: "In progress"
  jobCallInProgess: 'Выполняется',

  // Original text: "Transfer size:"
  jobTransferredDataSize: 'размер',

  // Original text: "Transfer speed:"
  jobTransferredDataSpeed: 'скорость',

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
  job: 'Задача',

  // Original text: "Job {job}"
  jobModalTitle: 'Задача {job}',

  // Original text: "ID"
  jobId: 'ID задачи',

  // Original text: "Type"
  jobType: 'Тип',

  // Original text: "Name"
  jobName: 'Имя',

  // Original text: 'Modes'
  jobModes: undefined,

  // Original text: "Name of your job (forbidden: \"_\")"
  jobNamePlaceholder: 'Имя для вашей задачи (запрещено: "_")',

  // Original text: "Start"
  jobStart: 'Начало',

  // Original text: "End"
  jobEnd: 'Конец',

  // Original text: "Duration"
  jobDuration: 'Длительность',

  // Original text: "Status"
  jobStatus: 'Статус',

  // Original text: "Action"
  jobAction: 'Действие',

  // Original text: "Tag"
  jobTag: 'Тэг',

  // Original text: "Scheduling"
  jobScheduling: 'Расписание',

  // Original text: "Timezone"
  jobTimezone: 'Часовой пояс',

  // Original text: "Server"
  jobServerTimezone: 'Сервер',

  // Original text: "Run job"
  runJob: 'Запустить задачу',

  // Original text: 'Cancel job'
  cancelJob: undefined,

  // Original text: "Onetime job started. See overview for logs."
  runJobVerbose: 'Запуск резервного копирования вручную. Перейдите в Обзор, чтобы просмотреть журналы.',

  // Original text: 'Edit job'
  jobEdit: undefined,

  // Original text: 'Delete'
  jobDelete: undefined,

  // Original text: "Finished"
  jobFinished: 'Завершено',

  // Original text: 'Interrupted'
  jobInterrupted: undefined,

  // Original text: "Started"
  jobStarted: 'Запущено',

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
  saveBackupJob: 'Сохранить',

  // Original text: "Remove backup job"
  deleteBackupSchedule: 'Удалить задачу резервного копирования',

  // Original text: "Are you sure you want to delete this backup job?"
  deleteBackupScheduleQuestion: 'Вы уверены, что хотите удалить это задание резервного копирования?',

  // Original text: 'Delete selected jobs'
  deleteSelectedJobs: undefined,

  // Original text: "Enable immediately after creation"
  scheduleEnableAfterCreation: 'Активировать после создания',

  // Original text: "You are editing schedule {name} ({id}). Saving will override previous schedule state."
  scheduleEditMessage: 'Вы редактируете расписание {name} ({id}). Текущее состояние будет изменено при сохранении.',

  // Original text: "You are editing job {name} ({id}). Saving will override previous job state."
  jobEditMessage: 'Вы редактируете задачу {name} ({id}). Текущее состояние будет изменено при сохранении.',

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

  // Original text: 'Add a schedule'
  scheduleAdd: undefined,

  // Original text: 'Delete'
  scheduleDelete: undefined,

  // Original text: 'Run schedule'
  scheduleRun: undefined,

  // Original text: 'Delete selected schedules'
  deleteSelectedSchedules: undefined,

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'Нет запланированных задач',

  // Original text: 'You can delete all your legacy backup snapshots.'
  legacySnapshotsLink: undefined,

  // Original text: 'New schedule'
  newSchedule: undefined,

  // Original text: "No schedules found"
  noSchedules: 'Расписания не найдены',

  // Original text: "Select an xo-server API command"
  jobActionPlaceHolder: 'Выберите команду API xo-server',

  // Original text: "Timeout (number of seconds after which a VM is considered failed)"
  jobTimeoutPlaceHolder: 'Таймаут (количество секунд, после которого виртуальная машина считается неисправной)',

  // Original text: "Schedules"
  jobSchedules: 'Расписания',

  // Original text: "Name of your schedule"
  jobScheduleNamePlaceHolder: 'Название расписания',

  // Original text: "Select a job"
  jobScheduleJobPlaceHolder: 'Выберите задачу',

  // Original text: "Job owner"
  jobOwnerPlaceholder: 'Владелец задачи',

  // Original text: "This job's creator no longer exists"
  jobUserNotFound: 'Создатель задачи больше не существует',

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
  newBackupSelection: 'Выберите тип резервной копии:',

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

  // Original text: 'Local remote selected'
  localRemoteWarningTitle: undefined,

  // Original text: 'Tip: Using thin-provisioned storage will consume less space. Please click on the icon to get more information'
  crOnThickProvisionedSrWarning: undefined,

  // Original text: 'Tip: Creating VMs on thin-provisioned storage will consume less space. Please click on the icon to get more information'
  vmsOnThinProvisionedSrTip: undefined,

  // Original text: 'Delta Backup and Continuous Replication require at least XenServer 6.5.'
  deltaBackupOnOutdatedXenServerWarning: undefined,

  // Original text: 'Click for more information about the backup methods.'
  backupNgLinkToDocumentationMessage: undefined,

  // Original text: 'Warning: Local remotes will use limited XOA disk space. Only for advanced users.'
  localRemoteWarningMessage: undefined,

  // Original text: "VMs"
  editBackupVmsTitle: 'ВМ',

  // Original text: "VMs statuses"
  editBackupSmartStatusTitle: 'Статусы ВМ',

  // Original text: 'Resident on'
  editBackupSmartResidentOn: undefined,

  // Original text: 'Not resident on'
  editBackupSmartNotResidentOn: undefined,

  // Original text: "Pools"
  editBackupSmartPools: 'Пулы',

  // Original text: "Tags"
  editBackupSmartTags: 'Тэги',

  // Original text: "VMs with tags in the form of <b>xo:no-bak</b> or <b>xo:no-bak=Reason</b>won't be included in any backup.For example, ephemeral VMs created by health check have this tag"
  editBackupSmartTagsInfo: undefined,

  // Original text: 'Sample of matching VMs'
  sampleOfMatchingVms: undefined,

  // Original text: 'Replicated VMs (VMs with Continuous Replication or Disaster Recovery tag) must be excluded!'
  backupReplicatedVmsInfo: undefined,

  // Original text: "VMs Tags"
  editBackupSmartTagsTitle: 'Тэги ВМ',

  // Original text: 'Excluded VMs tags'
  editBackupSmartExcludedTagsTitle: undefined,

  // Original text: "Delete first"
  deleteOldBackupsFirst: 'Сперва удалите старые резервные копии',

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

  // Original text: 'New file system remote'
  newRemote: undefined,

  // Original text: "Local"
  remoteTypeLocal: 'Локальный',

  // Original text: 'NFS'
  remoteTypeNfs: undefined,

  // Original text: 'SMB'
  remoteTypeSmb: undefined,

  // Original text: 'Amazon Web Services S3'
  remoteTypeS3: undefined,

  // Original text: "Type"
  remoteType: 'Тип',

  // Original text: 'SMB remotes are meant to work with Windows Server. For other systems (Linux Samba, which means almost all NAS), please use NFS.'
  remoteSmbWarningMessage: undefined,

  // Original text: 'Test your remote'
  remoteTestTip: undefined,

  // Original text: 'Test remote'
  testRemote: undefined,

  // Original text: 'Test failed for {name}'
  remoteTestFailure: undefined,

  // Original text: 'Test passed for {name}'
  remoteTestSuccess: undefined,

  // Original text: "Error"
  remoteTestError: 'Ошибка',

  // Original text: 'Test step'
  remoteTestStep: undefined,

  // Original text: 'Test name'
  remoteTestName: undefined,

  // Original text: 'Remote name already exists!'
  remoteTestNameFailure: undefined,

  // Original text: 'The remote appears to work correctly'
  remoteTestSuccessMessage: undefined,

  // Original text: "Connection failed"
  remoteConnectionFailed: 'Подключение не удалось',

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
  remoteName: 'Имя',

  // Original text: "Path"
  remotePath: 'Путь',

  // Original text: "State"
  remoteState: 'Состояние',

  // Original text: "Device"
  remoteDevice: 'Устройство',

  // Original text: 'Disk (Used / Total)'
  remoteDisk: undefined,

  // Original text: 'Speed (Write / Read)'
  remoteSpeed: undefined,

  // Original text: 'Read and write rate speed performed during latest test'
  remoteSpeedInfo: undefined,

  // Original text: 'Options'
  remoteOptions: undefined,

  // Original text: 'Share'
  remoteShare: undefined,

  // Original text: "Auth"
  remoteAuth: 'Авторизация',

  // Original text: "Delete"
  remoteDeleteTip: 'Удалить',

  // Original text: 'Delete selected remotes'
  remoteDeleteSelected: undefined,

  // Original text: "Name"
  remoteMyNamePlaceHolder: 'Имя *',

  // Original text: '/path/to/backup'
  remoteLocalPlaceHolderPath: undefined,

  // Original text: "Host"
  remoteNfsPlaceHolderHost: 'хост *',

  // Original text: 'Port'
  remoteNfsPlaceHolderPort: undefined,

  // Original text: 'path/to/backup'
  remoteNfsPlaceHolderPath: undefined,

  // Original text: 'Custom mount options'
  remoteNfsPlaceHolderOptions: undefined,

  // Original text: 'Subfolder [path\\\\to\\\\backup]'
  remoteSmbPlaceHolderRemotePath: undefined,

  // Original text: 'Username'
  remoteSmbPlaceHolderUsername: undefined,

  // Original text: 'Password'
  remoteSmbPlaceHolderPassword: undefined,

  // Original text: 'Domain'
  remoteSmbPlaceHolderDomain: undefined,

  // Original text: '<address>\\\\<share>'
  remoteSmbPlaceHolderAddressShare: undefined,

  // Original text: 'Custom mount options'
  remoteSmbPlaceHolderOptions: undefined,

  // Original text: 'Use HTTPS'
  remoteS3LabelUseHttps: undefined,

  // Original text: 'Allow unauthorized'
  remoteS3LabelAllowInsecure: undefined,

  // Original text: 'AWS S3 endpoint (ex: s3.us-east-2.amazonaws.com)'
  remoteS3PlaceHolderEndpoint: undefined,

  // Original text: 'AWS S3 bucket name'
  remoteS3PlaceHolderBucket: undefined,

  // Original text: 'Directory'
  remoteS3PlaceHolderDirectory: undefined,

  // Original text: 'Access key ID'
  remoteS3PlaceHolderAccessKeyID: undefined,

  // Original text: 'Paste secret here to change it'
  remoteS3PlaceHolderSecret: undefined,

  // Original text: 'Enter your encryption key here (32 characters)'
  remoteS3PlaceHolderEncryptionKey: undefined,

  // Original text: 'Region, leave blank for default'
  remoteS3Region: undefined,

  // Original text: 'Uncheck if you want HTTP instead of HTTPS'
  remoteS3TooltipProtocol: undefined,

  // Original text: 'Check if you want to accept self signed certificates'
  remoteS3TooltipAcceptInsecure: undefined,

  // Original text: 'Password(fill to edit)'
  remotePlaceHolderPassword: undefined,

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

  // Original text: 'Create a new SR'
  newSrTitle: undefined,

  // Original text: "General"
  newSrGeneral: 'Общий',

  // Original text: "Select storage type:"
  newSrTypeSelection: 'Выберите тип хранилища:',

  // Original text: "Settings"
  newSrSettings: 'Настройки',

  // Original text: "Storage usage"
  newSrUsage: 'Использование хранилища',

  // Original text: 'Summary'
  newSrSummary: undefined,

  // Original text: "Host"
  newSrHost: 'Хост',

  // Original text: "Type"
  newSrType: 'Тип',

  // Original text: "Name"
  newSrName: 'Имя',

  // Original text: "Description"
  newSrDescription: 'Описание',

  // Original text: "Server"
  newSrServer: 'Сервер',

  // Original text: "Path"
  newSrPath: 'Путь',

  // Original text: 'IQN'
  newSrIqn: undefined,

  // Original text: 'LUN'
  newSrLun: undefined,

  // Original text: 'No HBA devices'
  newSrNoHba: undefined,

  // Original text: "With auth."
  newSrAuth: 'с авторизацией',

  // Original text: "User name"
  newSrUsername: 'Имя пользователя',

  // Original text: "Password"
  newSrPassword: 'Пароль',

  // Original text: "Device"
  newSrDevice: 'Устройство',

  // Original text: "In use"
  newSrInUse: 'используется',

  // Original text: "Size"
  newSrSize: 'Размер',

  // Original text: "Create"
  newSrCreate: 'Создать',

  // Original text: "Storage name"
  newSrNamePlaceHolder: 'Имя хранилища',

  // Original text: "Storage description"
  newSrDescPlaceHolder: 'Описание хранилища',

  // Original text: 'e.g 93.184.216.34 or iscsi.example.net'
  newSrIscsiAddressPlaceHolder: undefined,

  // Original text: 'e.g 93.184.216.34 or nfs.example.net'
  newSrNfsAddressPlaceHolder: undefined,

  // Original text: 'e.g \\\\server\\sharename'
  newSrSmbAddressPlaceHolder: undefined,

  // Original text: "[port]"
  newSrPortPlaceHolder: '[порт]',

  // Original text: "Username"
  newSrUsernamePlaceHolder: 'Имя пользователя',

  // Original text: "Password"
  newSrPasswordPlaceHolder: 'Пароль',

  // Original text: 'Device, e.g /dev/sda…'
  newSrLvmDevicePlaceHolder: undefined,

  // Original text: '/path/to/directory'
  newSrLocalPathPlaceHolder: undefined,

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
  subjectName: 'Пользователи/Группы',

  // Original text: "Object"
  objectName: 'Объект',

  // Original text: "Role"
  roleName: 'Роль',

  // Original text: "Create"
  aclCreate: 'Создать',

  // Original text: "New group name"
  newGroupName: 'Имя новой группы',

  // Original text: "Create group"
  createGroup: 'Создать группу',

  // Original text: 'Synchronize LDAP groups'
  syncLdapGroups: undefined,

  // Original text: 'Install and configure the auth-ldap plugin first'
  ldapPluginNotConfigured: undefined,

  // Original text: 'Are you sure you want to synchronize LDAP groups with XO? This may delete XO groups and their ACLs.'
  syncLdapGroupsWarning: undefined,

  // Original text: "Create"
  createGroupButton: 'Создать',

  // Original text: "Delete group"
  deleteGroup: 'Удалить группу',

  // Original text: "Are you sure you want to delete this group?"
  deleteGroupConfirm: 'Вы уверены, что хотите удалить эту группу?',

  // Original text: 'Delete selected groups'
  deleteSelectedGroups: undefined,

  // Original text: 'Delete group{nGroups, plural, one {} other {s}}'
  deleteGroupsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nGroups, number} group{nGroups, plural, one {} other {s}}?'
  deleteGroupsModalMessage: undefined,

  // Original text: "Remove user from group"
  removeUserFromGroup: 'Удалить пользователя из группы',

  // Original text: "Are you sure you want to delete this user?"
  deleteUserConfirm: 'Вы уверены, что хотите удалить этого пользователя?',

  // Original text: "Delete user"
  deleteUser: 'Удалить пользователя',

  // Original text: 'Delete selected users'
  deleteSelectedUsers: undefined,

  // Original text: 'Delete user{nUsers, plural, one {} other {s}}'
  deleteUsersModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nUsers, number} user{nUsers, plural, one {} other {s}}?'
  deleteUsersModalMessage: undefined,

  // Original text: 'No user'
  noUser: undefined,

  // Original text: "Unknown user"
  unknownUser: 'неизвестный пользователь',

  // Original text: "No group found"
  noGroupFound: 'Группа не найдена',

  // Original text: "Name"
  groupNameColumn: 'Имя',

  // Original text: "Users"
  groupUsersColumn: 'Пользователи',

  // Original text: "Add user"
  addUserToGroupColumn: 'Добавить пользователя',

  // Original text: "Username"
  userNameColumn: 'Email',

  // Original text: 'Member of'
  userGroupsColumn: undefined,

  // Original text: '{nGroups, number} group{nGroups, plural, one {} other {s}}'
  userCountGroups: undefined,

  // Original text: "Permissions"
  userPermissionColumn: 'Разрешения',

  // Original text: 'Password / Authentication methods'
  userAuthColumn: undefined,

  // Original text: 'Username'
  userName: undefined,

  // Original text: "Password"
  userPassword: 'Пароль',

  // Original text: "Create"
  createUserButton: 'Создать',

  // Original text: "No user found"
  noUserFound: 'Пользователь не найден',

  // Original text: "User"
  userLabel: 'Пользователь',

  // Original text: "Admin"
  adminLabel: 'Admin',

  // Original text: "No user in group"
  noUserInGroup: 'В группе нет пользователя',

  // Original text: "{users, number} user{users, plural, one {} other {s}}"
  countUsers: '{users, number} пользователь{users, plural, one {} other {s}}',

  // Original text: 'Select permission'
  selectPermission: undefined,

  // Original text: 'Delete ACL'
  deleteAcl: undefined,

  // Original text: 'Delete selected ACLs'
  deleteSelectedAcls: undefined,

  // Original text: 'Delete ACL{nAcls, plural, one {} other {s}}'
  deleteAclsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nAcls, number} ACL{nAcls, plural, one {} other {s}}?'
  deleteAclsModalMessage: undefined,

  // Original text: 'No plugins found'
  noPlugins: undefined,

  // Original text: "Auto-load at server start"
  autoloadPlugin: 'Автозагрузка при запуске сервера',

  // Original text: "Save configuration"
  savePluginConfiguration: 'Сохранить конфигурацию',

  // Original text: "Delete configuration"
  deletePluginConfiguration: 'Удалить конфигурацию',

  // Original text: 'The test appears to be working.'
  pluginConfirmation: undefined,

  // Original text: "Plugin error"
  pluginError: 'Ошибка плагина',

  // Original text: 'Plugin test'
  pluginTest: undefined,

  // Original text: "Unknown error"
  unknownPluginError: 'Неизвестная ошибка',

  // Original text: "Purge plugin configuration"
  purgePluginConfiguration: 'Сбросить конфигурацию плагина',

  // Original text: "Are you sure you want to purge this configuration?"
  purgePluginConfigurationQuestion: 'Вы уверены, что хотите сбросить эту конфигурацию?',

  // Original text: "Cancel"
  cancelPluginEdition: 'Отменить',

  // Original text: "Plugin configuration"
  pluginConfigurationSuccess: 'Конфигурация плагина',

  // Original text: "Plugin configuration successfully saved!"
  pluginConfigurationChanges: 'Конфигурация плагина успешно сохранена!',

  // Original text: "Predefined configuration"
  pluginConfigurationPresetTitle: 'Предопределенная конфигурация',

  // Original text: "Choose a predefined configuration."
  pluginConfigurationChoosePreset: 'Выберите предопределенную конфигурацию',

  // Original text: "Apply"
  applyPluginPreset: 'Применить',

  // Original text: 'This plugin is not loaded'
  disabledTestPluginTootltip: undefined,

  // Original text: "Save filter error"
  saveNewUserFilterErrorTitle: 'Сохранить фильтр ошибок',

  // Original text: "Bad parameter: name must be given."
  saveNewUserFilterErrorBody: 'Неверный параметр: имя должно быть задано',

  // Original text: "Name:"
  filterName: 'Имя',

  // Original text: "Value:"
  filterValue: 'Значение',

  // Original text: "Save new filter"
  saveNewFilterTitle: 'Сохранить новый фильтр',

  // Original text: "Remove custom filter"
  removeUserFilterTitle: 'Удалить пользовательский фильтр',

  // Original text: "Are you sure you want to remove the custom filter?"
  removeUserFilterBody: 'Вы уверены, что хотите удалить пользовательский фильтр?',

  // Original text: "Default filter"
  defaultFilter: 'Фильтр по умолчанию',

  // Original text: "Default filters"
  defaultFilters: 'Фильтры по умолчанию',

  // Original text: "Custom filters"
  customFilters: 'Пользовательские фильтры',

  // Original text: "Customize filters"
  customizeFilters: 'Настройка фильтров',

  // Original text: 'Interpool copy requires at least Enterprise plan'
  cantInterPoolCopy: undefined,

  // Original text: 'Copy the export URL of the VM'
  copyExportedUrl: undefined,

  // Original text: 'Download VM'
  downloadVm: undefined,

  // Original text: "Start"
  startVmLabel: 'Запустить',

  // Original text: 'Start on…'
  startVmOnLabel: undefined,

  // Original text: 'No host selected'
  startVmOnMissingHostTitle: undefined,

  // Original text: 'You must select a host'
  startVmOnMissingHostMessage: undefined,

  // Original text: "Recovery start"
  recoveryModeLabel: 'Запустить восстановление',

  // Original text: "Suspend"
  suspendVmLabel: 'Приостановить',

  // Original text: 'Pause'
  pauseVmLabel: undefined,

  // Original text: "Stop"
  stopVmLabel: 'Остановить',

  // Original text: "Force shutdown"
  forceShutdownVmLabel: 'Принудительное выключение',

  // Original text: "Reboot"
  rebootVmLabel: 'Перезагрузка',

  // Original text: "Force reboot"
  forceRebootVmLabel: 'Принудительная перезагрузка',

  // Original text: "Delete"
  deleteVmLabel: 'Удалить',

  // Original text: 'Delete selected VMs'
  deleteSelectedVmsLabel: undefined,

  // Original text: "Migrate"
  migrateVmLabel: 'Переместить',

  // Original text: "Snapshot"
  snapshotVmLabel: 'Снимок',

  // Original text: "Export"
  exportVmLabel: 'Экспорт',

  // Original text: "Resume"
  resumeVmLabel: 'Возобновить',

  // Original text: "Copy"
  copyVmLabel: 'Копировать',

  // Original text: "Clone"
  cloneVmLabel: 'Клонировать',

  // Original text: 'Clean VM directory'
  cleanVm: undefined,

  // Original text: "Fast clone"
  fastCloneVmLabel: 'Быстрое клонирование',

  // Original text: 'Start the migrated VM'
  startMigratedVm: undefined,

  // Original text: "Console"
  vmConsoleLabel: 'Консоль',

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
  srRescan: 'Перечитать все диски',

  // Original text: "Connect to all hosts"
  srReconnectAll: 'Подключить ко всем хостам',

  // Original text: "Disconnect from all hosts"
  srDisconnectAll: 'Отключить от всех хостов',

  // Original text: "Forget this SR"
  srForget: 'Забыть этот SR',

  // Original text: 'Forget SRs'
  srsForget: undefined,

  // Original text: 'Forget {nSrs, number} SR{nSrs, plural, one {} other{s}}'
  nSrsForget: undefined,

  // Original text: "Remove this SR"
  srRemoveButton: 'Удалить этот SR',

  // Original text: "No VDIs in this storage"
  srNoVdis: 'На этом хранилище нет VDI',

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

  // Original text: 'Pool RAM usage:'
  poolTitleRamUsage: undefined,

  // Original text: '{used} used of {total} ({free} free)'
  poolRamUsage: undefined,

  // Original text: 'Master:'
  poolMaster: undefined,

  // Original text: "Display all hosts of this pool"
  displayAllHosts: 'Отобразить все хосты в этом пуле',

  // Original text: "Display all storage for this pool"
  displayAllStorages: 'Отобразить все хранилища в этом пуле',

  // Original text: "Display all VMs of this pool"
  displayAllVMs: 'Отобразить все ВМ в этом пуле',

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
  hostsTabName: 'Хосты',

  // Original text: 'VMs'
  vmsTabName: undefined,

  // Original text: 'SRs'
  srsTabName: undefined,

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
  poolHaEnabled: 'Включена',

  // Original text: "Disabled"
  poolHaDisabled: 'Выключена',

  // Original text: "High Availability"
  poolHaStatus: 'Высокая доступность',

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
  hostNameLabel: 'Имя',

  // Original text: "Description"
  hostDescription: 'Описание',

  // Original text: "No hosts"
  noHost: 'Нет хостов',

  // Original text: '{used}% used ({free} free)'
  memoryLeftTooltip: undefined,

  // Original text: 'PIF'
  pif: undefined,

  // Original text: 'Automatic'
  poolNetworkAutomatic: undefined,

  // Original text: "Name"
  poolNetworkNameLabel: 'Имя',

  // Original text: "Description"
  poolNetworkDescription: 'Описание',

  // Original text: 'PIFs'
  poolNetworkPif: undefined,

  // Original text: 'Private networks'
  privateNetworks: undefined,

  // Original text: 'Manage'
  manage: undefined,

  // Original text: "No networks"
  poolNoNetwork: 'Нет сетей',

  // Original text: 'MTU'
  poolNetworkMTU: undefined,

  // Original text: "Connected"
  poolNetworkPifAttached: 'Подключено',

  // Original text: "Disconnected"
  poolNetworkPifDetached: 'Отключено',

  // Original text: "Show PIFs"
  showPifs: 'Показать PIFs',

  // Original text: "Hide PIFs"
  hidePifs: 'Скрыть PIFs',

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

  // Original text: 'No stats'
  poolNoStats: undefined,

  // Original text: "All hosts"
  poolAllHosts: 'Все хосты',

  // Original text: "Add SR"
  addSrLabel: 'Добавить SR',

  // Original text: "Add VM"
  addVmLabel: 'Добавить ВМ',

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

  // Original text: 'Host patches could not be homogenized.'
  addHostNotHomogeneousErrorMessage: undefined,

  // Original text: "Disconnect"
  disconnectServer: 'Отключен',

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
  startHostLabel: 'Запустить',

  // Original text: "Stop"
  stopHostLabel: 'Остановить',

  // Original text: "Enable"
  enableHostLabel: 'Включить',

  // Original text: "Disable"
  disableHostLabel: 'Выключить',

  // Original text: 'Restart toolstack'
  restartHostAgent: undefined,

  // Original text: 'As the XOA is hosted on the host that is scheduled for a reboot, it will also be restarted. Consequently, XO won\'t be able to resume VMs, and VMs with the "Protect from accidental shutdown" option enabled will not have this option reactivated automatically.'
  smartRebootBypassCurrentVmCheck: undefined,

  // Original text: 'Smart reboot'
  smartRebootHostLabel: undefined,

  // Original text: 'Suspend resident VMs, reboot host and resume VMs automatically'
  smartRebootHostTooltip: undefined,

  // Original text: "Force reboot"
  forceRebootHostLabel: 'Принудительная перезагрузка',

  // Original text: 'Smart Reboot failed because {nVms, number} VM{nVms, plural, one {} other {s}} ha{nVms, plural, one {s} other {ve}} {nVms, plural, one {its} other {their}} Suspend operation blocked. Would you like to force?'
  forceSmartRebootHost: undefined,

  // Original text: 'Restart anyway'
  restartAnyway: undefined,

  // Original text: "Reboot"
  rebootHostLabel: 'Перезагрузка',

  // Original text: "Error while restarting host"
  noHostsAvailableErrorTitle: 'Ошибка при перезапуске хоста',

  // Original text: "Some VMs cannot be migrated without first rebooting this host. Please try force reboot."
  noHostsAvailableErrorMessage:
    'Некоторые виртуальные машины невозможно перенести до перезапуска этого хоста. Пожалуйста, попробуйте выполнить принудительную перезагрузку.',

  // Original text: "Error while restarting hosts"
  failHostBulkRestartTitle: 'Ошибка при перезапуске хостов',

  // Original text: '{failedHosts, number}/{totalHosts, number} host{failedHosts, plural, one {} other {s}} could not be restarted.'
  failHostBulkRestartMessage: undefined,

  // Original text: "Reboot to apply updates"
  rebootUpdateHostLabel: 'Перезагрузите для применения обновлений',

  // Original text: "Emergency mode"
  emergencyModeLabel: 'Аварийный режим',

  // Original text: "Storage"
  storageTabName: 'Хранилище',

  // Original text: "Patches"
  patchesTabName: 'Исправления',

  // Original text: "Load average"
  statLoad: 'Средняя нагрузка',

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
  memoryHostState: 'Использование RAM: {memoryUsed}',

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
  hostAddress: 'Адрес',

  // Original text: "Status"
  hostStatus: 'Статус',

  // Original text: "Build number"
  hostBuildNumber: 'Номер сборки',

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
  hostXenServerVersion: 'Версия',

  // Original text: "Enabled"
  hostStatusEnabled: 'Включен',

  // Original text: "Disabled"
  hostStatusDisabled: 'Выключен',

  // Original text: "Power on mode"
  hostPowerOnMode: 'Режим включения',

  // Original text: 'Control domain memory'
  hostControlDomainMemory: undefined,

  // Original text: 'Set control domain memory'
  setControlDomainMemory: undefined,

  // Original text: 'Editing the control domain memory will immediately restart the host in order to apply the changes.'
  setControlDomainMemoryMessage: undefined,

  // Original text: 'The host needs to be in maintenance mode'
  maintenanceModeRequired: undefined,

  // Original text: "Host uptime"
  hostStartedSince: 'Время работы хоста',

  // Original text: 'Toolstack uptime'
  hostStackStartedSince: undefined,

  // Original text: "CPU model"
  hostCpusModel: 'Модель CPU',

  // Original text: 'GPUs'
  hostGpus: undefined,

  // Original text: "Core (socket)"
  hostCpusNumber: 'Ядра (сокеты)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: 'Производитель',

  // Original text: "BIOS info"
  hostBiosinfo: 'BIOS',

  // Original text: "License"
  licenseHostSettingsLabel: 'Лицензия',

  // Original text: "Type"
  hostLicenseType: 'Тип',

  // Original text: "Socket"
  hostLicenseSocket: 'Сокет',

  // Original text: "Expiry"
  hostLicenseExpiry: 'Срок действия',

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

  // Original text: 'PUSB Devices'
  pusbDevices: undefined,

  // Original text: 'Smartctl plugin not installed'
  smartctlPluginNotInstalled: undefined,

  // Original text: "Installed supplemental packs"
  supplementalPacks: 'Установленные пакеты дополнений',

  // Original text: "Install new supplemental pack"
  supplementalPackNew: 'Установить новый пакет дополнений',

  // Original text: "Install supplemental pack on every host"
  supplementalPackPoolNew: 'Установить пакет дополнений на каждый хост',

  // Original text: "{name} (by {author})"
  supplementalPackTitle: '{name} (by {author})',

  // Original text: "Installation started"
  supplementalPackInstallStartedTitle: 'Установка началась',

  // Original text: "Installing new supplemental pack…"
  supplementalPackInstallStartedMessage: 'Установка нового пакета дополнений…',

  // Original text: "Installation error"
  supplementalPackInstallErrorTitle: 'Ошибка установки',

  // Original text: "The installation of the supplemental pack failed."
  supplementalPackInstallErrorMessage: 'Не удалось установить пакет дополнений',

  // Original text: "Installation success"
  supplementalPackInstallSuccessTitle: 'Установка успешна',

  // Original text: "Supplemental pack successfully installed."
  supplementalPackInstallSuccessMessage: 'Пакет дополнений успешно установлен.',

  // Original text: 'System disks health'
  systemDisksHealth: undefined,

  // Original text: 'The iSCSI IQN must be unique. '
  uniqueHostIscsiIqnInfo: undefined,

  // Original text: 'Vendor ID'
  vendorId: undefined,

  // Original text: "Add a network"
  networkCreateButton: 'Добавить сеть',

  // Original text: "Device"
  pifDeviceLabel: 'Устройство',

  // Original text: "Network"
  pifNetworkLabel: 'Сеть',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: 'Адрес',

  // Original text: "Mode"
  pifModeLabel: 'Режим',

  // Original text: "MAC"
  pifMacLabel: 'MAC',

  // Original text: "MTU"
  pifMtuLabel: 'MTU',

  // Original text: 'Speed'
  pifSpeedLabel: undefined,

  // Original text: "Status"
  pifStatusLabel: 'Статус',

  // Original text: 'This interface is currently in use'
  pifInUse: undefined,

  // Original text: 'Default locking mode'
  defaultLockingMode: undefined,

  // Original text: "Configure IP address"
  pifConfigureIp: 'Настройка IP адреса',

  // Original text: 'Invalid parameters'
  configIpErrorTitle: undefined,

  // Original text: "Static IP address"
  staticIp: 'Статичный IP адрес',

  // Original text: 'Static IPv6 address'
  staticIpv6: undefined,

  // Original text: "Netmask"
  netmask: 'Маска сети',

  // Original text: "DNS"
  dns: 'DNS',

  // Original text: "Gateway"
  gateway: 'Сетевой шлюз',

  // Original text: 'An IP address is required'
  ipRequired: undefined,

  // Original text: 'Netmask required'
  netmaskRequired: undefined,

  // Original text: "Add a storage"
  addSrDeviceButton: 'Добавить хранилище',

  // Original text: "Type"
  srType: 'Тип',

  // Original text: 'PBD details'
  pbdDetails: undefined,

  // Original text: "Status"
  pbdStatus: 'Статус',

  // Original text: "Connected"
  pbdStatusConnected: 'Подключен',

  // Original text: "Disconnected"
  pbdStatusDisconnected: 'Отключен',

  // Original text: "Connect"
  pbdConnect: 'Подключить',

  // Original text: "Disconnect"
  pbdDisconnect: 'Отключить',

  // Original text: "Forget"
  pbdForget: 'Забыть',

  // Original text: "Shared"
  srShared: 'С общим доступом',

  // Original text: "Not shared"
  srNotShared: 'Без общего доступа',

  // Original text: "No storage detected"
  pbdNoSr: 'Хранилища не обнаружены',

  // Original text: "Name"
  patchNameLabel: 'Имя',

  // Original text: "Install all patches"
  patchUpdateButton: 'Установить все исправления',

  // Original text: "Description"
  patchDescription: 'Описание',

  // Original text: 'Version'
  patchVersion: undefined,

  // Original text: "Applied date"
  patchApplied: 'Дата публикации',

  // Original text: "Size"
  patchSize: 'Размер',

  // Original text: "No patches detected"
  patchNothing: 'Исправления не найдены',

  // Original text: "Release date"
  patchReleaseDate: 'Дата релиза',

  // Original text: "Guidance"
  patchGuidance: 'Руководство',

  // Original text: "Applied patches"
  hostAppliedPatches: 'Примененные исправления',

  // Original text: "Missing patches"
  hostMissingPatches: 'Отсутствующие исправления',

  // Original text: "Host up-to-date!"
  hostUpToDate: 'Хост в актуальном состоянии!',

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
  installPoolPatches: 'Установить исправления на пул',

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
  defaultSr: 'SR по умолчанию',

  // Original text: "Set as default SR"
  setAsDefaultSr: 'Выбрать SR по умолчанию',

  // Original text: 'Set default SR:'
  setDefaultSr: undefined,

  // Original text: "General"
  generalTabName: 'Общее',

  // Original text: "Stats"
  statsTabName: 'Статистика',

  // Original text: "Console"
  consoleTabName: 'Консоль',

  // Original text: "Container"
  containersTabName: 'Контейнер',

  // Original text: "Snapshots"
  snapshotsTabName: 'Снимки',

  // Original text: "Logs"
  logsTabName: 'Журналы',

  // Original text: "Advanced"
  advancedTabName: 'Расширенные',

  // Original text: "Network"
  networkTabName: 'Сеть',

  // Original text: "Disk{disks, plural, one {} other {s}}"
  disksTabName: 'Диск{disks, plural, one {} other {s}}',

  // Original text: "Halted"
  powerStateHalted: 'остановлен',

  // Original text: "Running"
  powerStateRunning: 'работает',

  // Original text: "Suspended"
  powerStateSuspended: 'приостановлен',

  // Original text: 'Paused'
  powerStatePaused: undefined,

  // Original text: 'Disabled'
  powerStateDisabled: undefined,

  // Original text: 'Busy'
  powerStateBusy: undefined,

  // Original text: "Current status:"
  vmCurrentStatus: 'Текущий статус',

  // Original text: "Not running"
  vmNotRunning: 'Не запущено',

  // Original text: "Halted {ago}"
  vmHaltedSince: 'Остановлено {ago}',

  // Original text: "No Xen tools detected"
  noToolsDetected: 'Утилиты XEN не обнаружены',

  // Original text: 'Management agent {version} detected'
  managementAgentDetected: undefined,

  // Original text: 'Management agent {version} out of date'
  managementAgentOutOfDate: undefined,

  // Original text: 'Management agent not detected'
  managementAgentNotDetected: undefined,

  // Original text: "No IPv4 record"
  noIpv4Record: 'Нет IPv4 записи',

  // Original text: "No IP record"
  noIpRecord: 'Нет IP записи',

  // Original text: "Started {ago}"
  started: 'Запущено {ago}',

  // Original text: "Paravirtualization (PV)"
  paraVirtualizedMode: 'Паравиртуализация (PV)',

  // Original text: "Hardware virtualization (HVM)"
  hardwareVirtualizedMode: 'Аппаратная паравиртуализация (HVM)',

  // Original text: 'Hardware virtualization with paravirtualization drivers enabled (PVHVM)'
  hvmModeWithPvDriversEnabled: undefined,

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
  statsCpu: 'Использование CPU',

  // Original text: "Memory usage"
  statsMemory: 'Использование памяти',

  // Original text: "Network throughput"
  statsNetwork: 'Использование сети',

  // Original text: "Stacked values"
  useStackedValuesOnStats: 'Сложить значения',

  // Original text: "Disk throughput"
  statDisk: 'Пропускная способность диска',

  // Original text: "Last 10 minutes"
  statLastTenMinutes: 'Последние 10 минут',

  // Original text: "Last 2 hours"
  statLastTwoHours: 'Последние 2 часа',

  // Original text: 'Last day'
  statLastDay: undefined,

  // Original text: "Last week"
  statLastWeek: 'Последняя неделя',

  // Original text: "Last year"
  statLastYear: 'Последний год',

  // Original text: "Copy"
  copyToClipboardLabel: 'Копировать',

  // Original text: 'Ctrl+Alt+Del'
  ctrlAltDelButtonLabel: undefined,

  // Original text: 'Send Ctrl+Alt+Del to VM?'
  ctrlAltDelConfirmation: undefined,

  // Original text: 'Console is disabled for this VM'
  disabledConsole: undefined,

  // Original text: 'Multiline copy'
  multilineCopyToClipboard: undefined,

  // Original text: "Tip:"
  tipLabel: 'Совет:',

  // Original text: "Hide info"
  hideHeaderTooltip: 'Скрыть информацию',

  // Original text: "Show info"
  showHeaderTooltip: 'Показать информацию',

  // Original text: 'Send to clipboard'
  sendToClipboard: undefined,

  // Original text: 'Connect using external SSH tool as root'
  sshRootTooltip: undefined,

  // Original text: 'SSH'
  sshRootLabel: undefined,

  // Original text: 'Connect using external SSH tool as user…'
  sshUserTooltip: undefined,

  // Original text: 'SSH as…'
  sshUserLabel: undefined,

  // Original text: 'SSH user name'
  sshUsernameLabel: undefined,

  // Original text: 'No IP address reported by client tools'
  remoteNeedClientTools: undefined,

  // Original text: 'RDP'
  rdp: undefined,

  // Original text: 'Connect using external RDP tool'
  rdpRootTooltip: undefined,

  // Original text: "Name"
  containerName: 'Имя',

  // Original text: "Command"
  containerCommand: 'Команда',

  // Original text: "Creation date"
  containerCreated: 'Дата создания',

  // Original text: "Status"
  containerStatus: 'Статус',

  // Original text: "Action"
  containerAction: 'Действие',

  // Original text: "No existing containers"
  noContainers: 'Нет существующих контейнеров',

  // Original text: "Stop this container"
  containerStop: 'Остановить контейнер',

  // Original text: "Start this container"
  containerStart: 'Запустить контейнер',

  // Original text: "Pause this container"
  containerPause: 'Приостановить контейнер',

  // Original text: "Resume this container"
  containerResume: 'Возобновить контейнер',

  // Original text: "Restart this container"
  containerRestart: 'Перезапустить контейнер',

  // Original text: 'Rescan all ISO SRs'
  rescanIsoSrs: undefined,

  // Original text: "New disk"
  vbdCreateDeviceButton: 'Новый диск',

  // Original text: "Attach disk"
  vdiAttachDevice: 'Подключить диск',

  // Original text: 'The selected VDI is already attached to this VM. Are you sure you want to continue?'
  vdiAttachDeviceConfirm: undefined,

  // Original text: "Boot order"
  vdiBootOrder: 'Очередность загрузки',

  // Original text: "Name"
  vdiNameLabel: 'Имя',

  // Original text: "Description"
  vdiNameDescription: 'Описание',

  // Original text: "Pool"
  vdiPool: 'Пул',

  // Original text: "Tags"
  vdiTags: 'Тэги',

  // Original text: 'VDI tasks'
  vdiTasks: undefined,

  // Original text: "Size"
  vdiSize: 'Размер',

  // Original text: 'SR'
  vdiSr: undefined,

  // Original text: 'VMs'
  vdiVms: undefined,

  // Original text: "Migrate VDI"
  vdiMigrate: 'Мигрировать VDI',

  // Original text: "Destination SR:"
  vdiMigrateSelectSr: 'Целевая SR',

  // Original text: "No SR"
  vdiMigrateNoSr: 'Нет SR',

  // Original text: "A target SR is required to migrate a VDI"
  vdiMigrateNoSrMessage: 'Для переноса VDI требуется целевой SR',

  // Original text: "Forget"
  vdiForget: 'Забыть',

  // Original text: "No VDIs attached to control domain"
  noControlDomainVdis: 'Нет VDI подключенных к Управляющему Домену',

  // Original text: "Boot flag"
  vbdBootableStatus: 'Флаг загрузки',

  // Original text: 'Device'
  vbdDevice: undefined,

  // Original text: 'CBT'
  vbdCbt: undefined,

  // Original text: "Status"
  vbdStatus: 'Статус',

  // Original text: "Connected"
  vbdStatusConnected: 'Подключен',

  // Original text: "Disconnected"
  vbdStatusDisconnected: 'Отключен',

  // Original text: "Connect VBD"
  vbdConnect: 'Подключить VBD',

  // Original text: "Disconnect VBD"
  vbdDisconnect: 'Отключить VBD',

  // Original text: 'Bootable'
  vbdBootable: undefined,

  // Original text: 'Readonly'
  vbdReadonly: undefined,

  // Original text: "Create"
  vbdCreate: 'Создать',

  // Original text: 'Attach'
  vbdAttach: undefined,

  // Original text: "Disk name"
  vbdNamePlaceHolder: 'Имя диска',

  // Original text: "Size"
  vbdSizePlaceHolder: 'Размер',

  // Original text: "CD drive not completely installed"
  cdDriveNotInstalled: 'CD установлен не полностью',

  // Original text: "Stop and start the VM to install the CD drive"
  cdDriveInstallation: 'Остановить и запустить ВМ для установки CD',

  // Original text: "Save"
  saveBootOption: 'Сохранить',

  // Original text: "Reset"
  resetBootOption: 'Сбросить',

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
  vifCreateDeviceButton: 'Новое устройство',

  // Original text: "Device"
  vifDeviceLabel: 'Устройство',

  // Original text: "MAC address"
  vifMacLabel: 'MAC адрес',

  // Original text: 'MTU'
  vifMtuLabel: undefined,

  // Original text: "Network"
  vifNetworkLabel: 'Сеть',

  // Original text: 'Rate limit (kB/s)'
  vifRateLimitLabel: undefined,

  // Original text: "Status"
  vifStatusLabel: 'Статус',

  // Original text: "Connected"
  vifStatusConnected: 'Подключен',

  // Original text: "Disconnected"
  vifStatusDisconnected: 'Отключен',

  // Original text: "Connect"
  vifConnect: 'Подключить',

  // Original text: "Disconnect"
  vifDisconnect: 'Отключить',

  // Original text: "Remove"
  vifRemove: 'Удалить',

  // Original text: 'Remove selected VIFs'
  vifsRemove: undefined,

  // Original text: "IP addresses"
  vifIpAddresses: 'IP адреса',

  // Original text: "Auto-generated if empty"
  vifMacAutoGenerate: 'Создать если не указано',

  // Original text: "Allowed IPs"
  vifAllowedIps: 'Разрешенные IP',

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
  vifNoIps: 'Без IP',

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
  vifLockedNetworkNoIps: 'Сеть заблокирована, и для этого интерфейса не разрешены IP-адреса',

  // Original text: 'Some IPs are unnecessarily set as allowed for this interface'
  vifUnlockedNetworkWithIps: undefined,

  // Original text: "Unknown network"
  vifUnknownNetwork: 'Неизвестная сеть',

  // Original text: "Create"
  vifCreate: 'Создать',

  // Original text: 'NBD'
  nbd: undefined,

  // Original text: 'Network Block Device status'
  nbdTootltip: undefined,

  // Original text: 'Use of insecure NBD is not advised'
  nbdInsecureTooltip: undefined,

  // Original text: 'Nbd connection is secure and ready'
  nbdSecureTooltip: undefined,

  // Original text: "No snapshots"
  noSnapshots: 'Нет снимков',

  // Original text: 'New snapshot with memory'
  newSnapshotWithMemory: undefined,

  // Original text: 'Are you sure you want to create a snapshot with memory? This could take a while and the VM will be unusable during that time.'
  newSnapshotWithMemoryConfirm: undefined,

  // Original text: 'Memory saved'
  snapshotMemorySaved: undefined,

  // Original text: "New snapshot"
  snapshotCreateButton: 'Новый снимок',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: 'Нажмите на кнопку снимка, чтобы создать его!',

  // Original text: "Revert VM to this snapshot"
  revertSnapshot: 'Откатить ВМ на этот снимок',

  // Original text: "Remove this snapshot"
  deleteSnapshot: 'Удалить снимок',

  // Original text: 'Remove selected snapshots'
  deleteSnapshots: undefined,

  // Original text: "Create a VM from this snapshot"
  copySnapshot: 'Создать ВМ из снимка',

  // Original text: "Export this snapshot"
  exportSnapshot: 'Экспортировать снимок',

  // Original text: 'Export snapshot memory'
  exportSnapshotMemory: undefined,

  // Original text: 'Secure boot'
  secureBoot: undefined,

  // Original text: "Creation date"
  snapshotDate: 'Дата создания',

  // Original text: 'Snapshot error'
  snapshotError: undefined,

  // Original text: "Name"
  snapshotName: 'Имя',

  // Original text: 'Description'
  snapshotDescription: undefined,

  // Original text: 'Quiesced snapshot'
  snapshotQuiesce: undefined,

  // Original text: 'Revert successful'
  vmRevertSuccessfulTitle: undefined,

  // Original text: 'VM successfully reverted'
  vmRevertSuccessfulMessage: undefined,

  // Original text: 'Current snapshot'
  currentSnapshot: undefined,

  // Original text: 'Go to the backup page.'
  goToBackupPage: undefined,

  // Original text: "Remove all logs"
  logRemoveAll: 'Удалить все журналы',

  // Original text: "No logs so far"
  noLogs: 'Записей в журналах пока нет',

  // Original text: "Creation date"
  logDate: 'Дата создания',

  // Original text: "Name"
  logName: 'Имя',

  // Original text: "Content"
  logContent: 'Содержимое',

  // Original text: "Action"
  logAction: 'Действие',

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

  // Original text: 'Auto power on is disabled at pool level, click to fix automatically.'
  poolAutoPoweronDisabled: undefined,

  // Original text: "Remove"
  vmRemoveButton: 'Удаление',

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
  xenSettingsLabel: 'Конфигурация Xen',

  // Original text: "Guest OS"
  guestOsLabel: 'Гостевая ОС',

  // Original text: "Misc"
  miscLabel: 'Разное',

  // Original text: "Virtualization mode"
  virtualizationMode: 'Режим виртуализации',

  // Original text: 'Start delay (seconds)'
  startDelayLabel: undefined,

  // Original text: 'CPU mask'
  cpuMaskLabel: undefined,

  // Original text: 'Select core(s)…'
  selectCpuMask: undefined,

  // Original text: "CPU weight"
  cpuWeightLabel: 'Приоритизация CPU',

  // Original text: "Default ({value, number})"
  defaultCpuWeight: 'По умолчанию ({value, number})',

  // Original text: 'CPU cap'
  cpuCapLabel: undefined,

  // Original text: "Default ({value, number})"
  defaultCpuCap: 'По умолчанию ({value, number})',

  // Original text: 'PV args'
  pvArgsLabel: undefined,

  // Original text: 'Management agent version'
  managementAgentVersion: undefined,

  // Original text: "OS name"
  osName: 'Имя ОС',

  // Original text: "OS kernel"
  osKernel: 'Ядро ОС',

  // Original text: "Auto power on"
  autoPowerOn: 'Автозапуск',

  // Original text: 'Protect from accidental deletion'
  protectFromDeletion: undefined,

  // Original text: 'Protect from accidental shutdown'
  protectFromShutdown: undefined,

  // Original text: "HA"
  ha: 'Высокая доступность',

  // Original text: 'SR used for High Availability'
  srHaTooltip: undefined,

  // Original text: 'Nested virtualization'
  nestedVirt: undefined,

  // Original text: 'Affinity host'
  vmAffinityHost: undefined,

  // Original text: 'The VM needs to be halted'
  vmNeedToBeHalted: undefined,

  // Original text: 'VGA'
  vmVga: undefined,

  // Original text: 'Video RAM'
  vmVideoram: undefined,

  // Original text: 'NIC type'
  vmNicType: undefined,

  // Original text: 'VTPM'
  vtpm: undefined,

  // Original text: 'A UEFI boot firmware is necessary to use a VTPM'
  vtpmRequireUefi: undefined,

  // Original text: 'None'
  noAffinityHost: undefined,

  // Original text: "Original template"
  originalTemplate: 'Оригинальный шаблон',

  // Original text: "Unknown"
  unknownOsName: 'Неизвестно',

  // Original text: "Unknown"
  unknownOsKernel: 'Неизвестно',

  // Original text: "Unknown"
  unknownOriginalTemplate: 'Неизвестно',

  // Original text: "VM limits"
  vmLimitsLabel: 'Ограничения ВМ',

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
  vmCpuLimitsLabel: 'Ограничение CPU',

  // Original text: "Topology"
  vmCpuTopology: 'Топология',

  // Original text: "Default behavior"
  vmChooseCoresPerSocket: 'Поведение по умолчанию',

  // Original text: '{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket'
  vmSocketsWithCoresPerSocket: undefined,

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
  vmMemoryLimitsLabel: 'Ограничение памяти (min/max)',

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
  vmHomeNamePlaceholder: 'Длительное нажатие для добавления имени',

  // Original text: "Long click to add a description"
  vmHomeDescriptionPlaceholder: 'Длительное нажатие для добавления описания',

  // Original text: 'Copy to template'
  copyToTemplate: undefined,

  // Original text: 'Are you sure you want to copy this snapshot to a template?'
  copyToTemplateMessage: undefined,

  // Original text: "Click to add a name"
  templateHomeNamePlaceholder: 'Нажать для добавления имени',

  // Original text: "Click to add a description"
  templateHomeDescriptionPlaceholder: 'Нажать для добавления описания',

  // Original text: "Delete template"
  templateDelete: 'Удалить шаблон',

  // Original text: "Delete VM template{templates, plural, one {} other {s}}"
  templateDeleteModalTitle: 'Удалить шаблон VM {templates, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?"
  templateDeleteModalBody:
    'Вы уверены, что хотите удалить{templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?',

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
  poolPanel: 'Пул{pools, plural, one {} other {s}}',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'Хост{hosts, plural, one {} other {s}}',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: 'ВМ{vms, plural, one {} other {s}}',

  // Original text: "RAM Usage:"
  memoryStatePanel: 'Использование памяти',

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
  cpuStatePanel: 'Использование CPU',

  // Original text: "VMs Power state"
  vmStatePanel: 'Состояние питания ВМ',

  // Original text: 'Halted'
  vmStateHalted: undefined,

  // Original text: 'Other'
  vmStateOther: undefined,

  // Original text: 'Running'
  vmStateRunning: undefined,

  // Original text: 'All'
  vmStateAll: undefined,

  // Original text: "Pending tasks"
  taskStatePanel: 'Отложенные задачи',

  // Original text: "Users"
  usersStatePanel: 'Пользователи',

  // Original text: "Storage state"
  srStatePanel: 'Состояние хранилища',

  // Original text: '{usage} (of {total})'
  ofUsage: undefined,

  // Original text: '{nVcpus, number} vCPU{nVcpus, plural, one {} other {s}} (of {nCpus, number} CPU{nCpus, plural, one {} other {s}})'
  ofCpusUsage: undefined,

  // Original text: "No storage"
  noSrs: 'Нет хранилища',

  // Original text: "Name"
  srName: 'Имя',

  // Original text: "Pool"
  srPool: 'Пул',

  // Original text: "Host"
  srHost: 'Хост',

  // Original text: "Type"
  srFormat: 'Тип',

  // Original text: "Size"
  srSize: 'Размер',

  // Original text: "Usage"
  srUsage: 'Используется',

  // Original text: "used"
  srUsed: 'используется',

  // Original text: "free"
  srFree: 'свободно',

  // Original text: "Storage Usage"
  srUsageStatePanel: 'Использование хранилища',

  // Original text: "Top 5 SR Usage (in %)"
  srTopUsageStatePanel: 'Топ 5 SR по использованию (в %)',

  // Original text: 'Not enough permissions!'
  notEnoughPermissionsError: undefined,

  // Original text: '{running, number} running ({halted, number} halted)'
  vmsStates: undefined,

  // Original text: "Clear selection"
  dashboardStatsButtonRemoveAll: 'Сбросить выделение',

  // Original text: "Add all hosts"
  dashboardStatsButtonAddAllHost: 'Добавить все хосты',

  // Original text: "Add all VMs"
  dashboardStatsButtonAddAllVM: 'Добавить все ВМ',

  // Original text: 'Send report'
  dashboardSendReport: undefined,

  // Original text: 'Report'
  dashboardReport: undefined,

  // Original text: 'This will send a usage report to your configured emails.'
  dashboardSendReportMessage: undefined,

  // Original text: 'The usage report and transport email plugins need to be loaded!'
  dashboardSendReportInfo: undefined,

  // Original text: '{value} {date, date, medium}'
  weekHeatmapData: undefined,

  // Original text: "No data."
  weekHeatmapNoData: 'Нет данных.',

  // Original text: "Weekly Heatmap"
  weeklyHeatmap: 'Недельная тепловая карта',

  // Original text: "Weekly Charts"
  weeklyCharts: 'Недельные диаграммы',

  // Original text: "Synchronize scale:"
  weeklyChartsScaleInfo: 'Синхронизировать масштаб:',

  // Original text: "Stats error"
  statsDashboardGenericErrorTitle: 'Ошибка статистики',

  // Original text: "There is no stats available for:"
  statsDashboardGenericErrorMessage: 'Нет статистики для:',

  // Original text: "No selected metric"
  noSelectedMetric: 'Метрика не выбрана',

  // Original text: "Select"
  statsDashboardSelectObjects: 'Выбор',

  // Original text: "Loading…"
  metricsLoading: 'Загрузка…',

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

  // Original text: 'Orphan VDIs'
  orphanedVdis: undefined,

  // Original text: 'VDIs and VDI snapshots that are not attached to a VM'
  orphanVdisTip: undefined,

  // Original text: 'Orphaned VMs snapshot'
  orphanedVms: undefined,

  // Original text: 'No orphans'
  noOrphanedObject: undefined,

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
  vdisOnControlDomain: 'VDI подключенные к Управляющему Домену',

  // Original text: 'VIF #{vifDevice, number} on {vm} ({network})'
  vifOnVmWithNetwork: undefined,

  // Original text: 'VIFs'
  vifs: undefined,

  // Original text: "Name"
  vmNameLabel: 'Имя',

  // Original text: "Description"
  vmNameDescription: 'Описание',

  // Original text: 'Resident on'
  vmContainer: undefined,

  // Original text: 'Snapshot of'
  snapshotOf: undefined,

  // Original text: 'Legacy backups snapshots'
  legacySnapshots: undefined,

  // Original text: "Alarms"
  alarmMessage: 'Предупреждения',

  // Original text: "No alarms"
  noAlarms: 'Нет предупреждений',

  // Original text: "Date"
  alarmDate: 'Дата',

  // Original text: 'Content'
  alarmContent: undefined,

  // Original text: 'Issue on'
  alarmObject: undefined,

  // Original text: "Pool"
  alarmPool: 'Пул',

  // Original text: '{used}% used ({free} left)'
  spaceLeftTooltip: undefined,

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
  newVmCreateNewVmOn: 'Создать новую ВМ на {select}',

  // Original text: "You have no permission to create a VM"
  newVmCreateNewVmNoPermission: 'У вас нет разрешений для создания ВМ',

  // Original text: "Info"
  newVmInfoPanel: 'Информация',

  // Original text: "Name"
  newVmNameLabel: 'Имя',

  // Original text: "Template"
  newVmTemplateLabel: 'Шаблон',

  // Original text: "Description"
  newVmDescriptionLabel: 'Описание',

  // Original text: "Performance"
  newVmPerfPanel: 'Производительность',

  // Original text: 'vCPUs'
  newVmVcpusLabel: undefined,

  // Original text: "RAM"
  newVmRamLabel: 'Память',

  // Original text: 'The memory is below the threshold ({threshold})'
  newVmRamWarning: undefined,

  // Original text: 'Static memory max'
  newVmStaticMaxLabel: undefined,

  // Original text: 'Dynamic memory min'
  newVmDynamicMinLabel: undefined,

  // Original text: 'Dynamic memory max'
  newVmDynamicMaxLabel: undefined,

  // Original text: "Install settings"
  newVmInstallSettingsPanel: 'Варианты установки',

  // Original text: 'ISO/DVD'
  newVmIsoDvdLabel: undefined,

  // Original text: "Network"
  newVmNetworkLabel: 'Сеть',

  // Original text: 'e.g: http://httpredir.debian.org/debian'
  newVmInstallNetworkPlaceHolder: undefined,

  // Original text: "PV Args"
  newVmPvArgsLabel: 'Детали PV',

  // Original text: 'PXE'
  newVmPxeLabel: undefined,

  // Original text: "Interfaces"
  newVmInterfacesPanel: 'Интерфейсы',

  // Original text: 'MAC'
  newVmMacLabel: undefined,

  // Original text: "Add interface"
  newVmAddInterface: 'Добавить интерфейс',

  // Original text: "Disks"
  newVmDisksPanel: 'Диски',

  // Original text: 'SR'
  newVmSrLabel: undefined,

  // Original text: "Size"
  newVmSizeLabel: 'Размер',

  // Original text: "Add disk"
  newVmAddDisk: 'Добавить диск',

  // Original text: 'Summary'
  newVmSummaryPanel: undefined,

  // Original text: "Create"
  newVmCreate: 'Создать',

  // Original text: "Reset"
  newVmReset: 'Сбросить',

  // Original text: "Select template"
  newVmSelectTemplate: 'Выбрать шаблон',

  // Original text: "SSH key"
  newVmSshKey: 'SSH ключ',

  // Original text: 'No config drive'
  noConfigDrive: undefined,

  // Original text: "Custom config"
  newVmCustomConfig: 'Пользовательские настройки',

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
  newVmBootAfterCreate: 'Запустить ВМ после создания',

  // Original text: "Auto-generated if empty"
  newVmMacPlaceholder: 'Создается автоматически, если оставить пустым',

  // Original text: "CPU weight"
  newVmCpuWeightLabel: 'Приоритизация CPU',

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuWeight: undefined,

  // Original text: 'CPU cap'
  newVmCpuCapLabel: undefined,

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuCap: undefined,

  // Original text: "Cloud config"
  newVmCloudConfig: 'Облачная конфигурация',

  // Original text: "Create VMs"
  newVmCreateVms: 'Создать виртуальные машины',

  // Original text: "Are you sure you want to create {nbVms, number} VMs?"
  newVmCreateVmsConfirm: 'Вы уверены, что хотите создать {nbVms, number} виртуальные машины?',

  // Original text: "Multiple VMs:"
  newVmMultipleVms: 'Несколько ВМ:',

  // Original text: 'Name pattern:'
  newVmMultipleVmsPattern: undefined,

  // Original text: 'e.g.: \\{name\\}_%'
  newVmMultipleVmsPatternPlaceholder: undefined,

  // Original text: 'First index:'
  newVmFirstIndex: undefined,

  // Original text: 'Recalculate VMs number'
  newVmNumberRecalculate: undefined,

  // Original text: 'Refresh VMs name'
  newVmNameRefresh: undefined,

  // Original text: 'Affinity host'
  newVmAffinityHost: undefined,

  // Original text: 'Advanced'
  newVmAdvancedPanel: undefined,

  // Original text: 'Show advanced settings'
  newVmShowAdvanced: undefined,

  // Original text: 'Hide advanced settings'
  newVmHideAdvanced: undefined,

  // Original text: 'Share this VM'
  newVmShare: undefined,

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
  resourceSets: 'Набор ресурсов',

  // Original text: "No resource sets."
  noResourceSets: 'Набор ресурсов не определен',

  // Original text: "Resource set name"
  resourceSetName: 'Имя набора ресурсов',

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

  // Original text: 'Recompute all limits'
  recomputeResourceSets: undefined,

  // Original text: "Save"
  saveResourceSet: 'Сохранить',

  // Original text: "Reset"
  resetResourceSet: 'Сбросить',

  // Original text: "Edit"
  editResourceSet: 'Изменить',

  // Original text: 'Default tags'
  defaultTags: undefined,

  // Original text: "Delete"
  deleteResourceSet: 'Удалить',

  // Original text: "Delete resource set"
  deleteResourceSetWarning: 'Удалить набор ресурсов',

  // Original text: "Are you sure you want to delete this resource set?"
  deleteResourceSetQuestion: 'Вы уверены, что хотите удалить этот набор ресурсов?',

  // Original text: "Missing objects:"
  resourceSetMissingObjects: 'Объект не найден:',

  // Original text: "Unknown"
  unknownResourceSetValue: 'Неизвестно',

  // Original text: "Available hosts"
  availableHosts: 'Доступные хосты',

  // Original text: "Excluded hosts"
  excludedHosts: 'Исключенные хосты',

  // Original text: "No hosts available."
  noHostsAvailable: 'Нет доступных хостов',

  // Original text: "VMs created from this resource set shall run on the following hosts."
  availableHostsDescription:
    'Виртуальные машины, созданные из этого набора ресурсов, должны работать на следующих хостах.',

  // Original text: "Maximum CPUs"
  maxCpus: 'Максимум CPUs',

  // Original text: "Maximum RAM"
  maxRam: 'Максимум памяти (GiB)',

  // Original text: "Maximum disk space"
  maxDiskSpace: 'Максимум дискового пространства',

  // Original text: 'IP pool'
  ipPool: undefined,

  // Original text: 'Quantity'
  quantity: undefined,

  // Original text: 'Used'
  usedResourceLabel: undefined,

  // Original text: 'Available'
  availableResourceLabel: undefined,

  // Original text: 'Used: {usage} (Total: {total})'
  resourceSetQuota: undefined,

  // Original text: 'New'
  resourceSetNew: undefined,

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
  importVmsList:
    'Перетащите сюда несколько файлов виртуальных машин или нажмите, чтобы выбрать виртуальные машины для загрузки. Работает только с файлами .xva/.ova.',

  // Original text: "No selected VMs."
  noSelectedVms: 'Нет выбранных ВМ',

  // Original text: 'No tools installed'
  noToolsInstalled: undefined,

  // Original text: 'URL:'
  url: undefined,

  // Original text: "To Pool:"
  vmImportToPool: 'В пул:',

  // Original text: "To SR:"
  vmImportToSr: 'В SR:',

  // Original text: "VM{nVms, plural, one {} other {s}} to import"
  vmsToImport: 'ВМ для импорта',

  // Original text: '<div>VM running from non file based datastore (like VSAN) will be migrated in a three steps process<ul><li>Stop the VM</li><li>Export the VM disks to a remote of Xen Orchestra</li><li>Load these disks in XCP-ng</li></ul>This process will be slower than migrating the VM to VMFS / NFS datastore and then migrating them to XCP-ng</div>'
  warningVsanImport: undefined,

  // Original text: 'Remote used to store temporary disk files(VSAN migration)'
  workDirLabel: undefined,

  // Original text: "Reset"
  importVmsCleanList: 'Сбросить',

  // Original text: "VM import success"
  vmImportSuccess: 'Импорт ВМ выполнен успешно',

  // Original text: "VM import failed"
  vmImportFailed: 'Ошибка импорта ВМ',

  // Original text: 'VDI import success'
  vdiImportSuccess: undefined,

  // Original text: 'VDI import failed'
  vdiImportFailed: undefined,

  // Original text: 'Error on setting the VM: {vm}'
  setVmFailed: undefined,

  // Original text: "Import starting…"
  startVmImport: 'Импорт начался…',

  // Original text: 'VDI import starting…'
  startVdiImport: undefined,

  // Original text: "Export starting…"
  startVmExport: 'Экспорт начался…',

  // Original text: 'VDI export starting…'
  startVdiExport: undefined,

  // Original text: "Number of CPUs"
  nCpus: 'Количество CPUs',

  // Original text: "Memory"
  vmMemory: 'Память',

  // Original text: 'Disk {position} ({capacity})'
  diskInfo: undefined,

  // Original text: "Disk description"
  diskDescription: 'Описание диска',

  // Original text: "No disks."
  noDisks: 'Нет дисков',

  // Original text: "No networks."
  noNetworks: 'Нет сетей',

  // Original text: "Network {name}"
  networkInfo: 'Сеть {name}',

  // Original text: "No description available"
  noVmImportErrorDescription: 'Описание недоступно',

  // Original text: "Error:"
  vmImportError: 'Ошибка',

  // Original text: "{type} file:"
  vmImportFileType: '{type} файл:',

  // Original text: "Please check and/or modify the VM configuration."
  vmImportConfigAlert: 'Пожалуйста, проверьте и/или измените конфигурацию виртуальной машины.',

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

  // Original text: 'Schedules'
  backupSchedules: undefined,

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

  // Original text: 'Get remote'
  getRemote: undefined,

  // Original text: 'There are no backups!'
  noBackups: undefined,

  // Original text: 'Click on a VM to display restore options'
  restoreBackupsInfo: undefined,

  // Original text: "Enabled"
  remoteEnabled: 'Подключено',

  // Original text: 'Disabled'
  remoteDisabled: undefined,

  // Original text: 'Enable'
  enableRemote: undefined,

  // Original text: 'Disable'
  disableRemote: undefined,

  // Original text: 'The URL ({url}) is invalid (colon in path). Click this button to change the URL to {newUrl}.'
  remoteErrorMessage: undefined,

  // Original text: "VM Name"
  backupVmNameColumn: 'Имя ВМ',

  // Original text: 'VM Description'
  backupVmDescriptionColumn: undefined,

  // Original text: 'Oldest backup'
  firstBackupColumn: undefined,

  // Original text: "Latest backup"
  lastBackupColumn: 'Последняя резервная копия',

  // Original text: "Available Backups"
  availableBackupsColumn: 'Доступные резервные копии',

  // Original text: 'Missing parameters'
  backupRestoreErrorTitle: undefined,

  // Original text: 'Choose a SR and a backup'
  backupRestoreErrorMessage: undefined,

  // Original text: 'key'
  backupisKey: undefined,

  // Original text: 'incremental'
  backupIsIncremental: undefined,

  // Original text: 'differencing'
  backupIsDifferencing: undefined,

  // Original text: 'VMs to backup'
  vmsToBackup: undefined,

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

  // Original text: 'Restore backup files'
  restoreFiles: undefined,

  // Original text: 'Invalid options'
  restoreFilesError: undefined,

  // Original text: 'Export format:'
  restoreFilesExportFormat: undefined,

  // Original text: 'Restore file from {name}'
  restoreFilesFromBackup: undefined,

  // Original text: 'Select a backup…'
  restoreFilesSelectBackup: undefined,

  // Original text: 'Select a disk…'
  restoreFilesSelectDisk: undefined,

  // Original text: 'Select a partition…'
  restoreFilesSelectPartition: undefined,

  // Original text: 'Select a file…'
  restoreFilesSelectFiles: undefined,

  // Original text: 'No files selected'
  restoreFilesNoFilesSelected: undefined,

  // Original text: 'Selected files/folders ({files}):'
  restoreFilesSelectedFilesAndFolders: undefined,

  // Original text: 'Error while scanning disk'
  restoreFilesDiskError: undefined,

  // Original text: "Select all this folder's files"
  restoreFilesSelectAllFiles: undefined,

  // Original text: 'Select this folder'
  restoreFilesSelectFolder: undefined,

  // Original text: 'tar+gzip (.tgz)'
  restoreFilesTgz: undefined,

  // Original text: 'Unselect all files'
  restoreFilesUnselectAll: undefined,

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

  // Original text: 'Emergency shutdown Host{nHosts, plural, one {} other {s}}'
  emergencyShutdownHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to shutdown {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  emergencyShutdownHostsModalMessage: undefined,

  // Original text: 'Shutdown host'
  stopHostModalTitle: undefined,

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage: undefined,

  // Original text: 'Force shutdown host'
  forceStopHost: undefined,

  // Original text: 'This will shutdown your host without evacuating its VMs. Do you want to continue?'
  forceStopHostMessage: undefined,

  // Original text: 'Add host'
  addHostModalTitle: undefined,

  // Original text: 'Are you sure you want to add {host} to {pool}?'
  addHostModalMessage: undefined,

  // Original text: 'Restart host'
  restartHostModalTitle: undefined,

  // Original text: 'This will restart your host. Do you want to continue?'
  restartHostModalMessage: undefined,

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}'
  restartHostsAgentsModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?'
  restartHostsAgentsModalMessage: undefined,

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}}'
  restartHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  restartHostsModalMessage: undefined,

  // Original text: 'Start VM{vms, plural, one {} other {s}}'
  startVmsModalTitle: undefined,

  // Original text: 'Start a copy'
  cloneAndStartVM: undefined,

  // Original text: 'Force start'
  forceStartVm: undefined,

  // Original text: 'Forbidden operation'
  forceStartVmModalTitle: undefined,

  // Original text: 'Start operation for this vm is blocked.'
  blockedStartVmModalMessage: undefined,

  // Original text: 'Forbidden operation start for {nVms, number} vm{nVms, plural, one {} other {s}}.'
  blockedStartVmsModalMessage: undefined,

  // Original text: "Are you sure you want to start {vms, number} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage: 'Вы уверены, что хотите запустить {vms, number} ВМ{vms, plural, one {} other {s}}?',

  // Original text: '{nVms, number} VM{nVms, plural, one {} other {s}} failed. Please check logs for more information'
  failedVmsErrorMessage: undefined,

  // Original text: 'Start failed'
  failedVmsErrorTitle: undefined,

  // Original text: 'Delete failed'
  failedDeleteErrorTitle: undefined,

  // Original text: 'Stop Host{nHosts, plural, one {} other {s}}'
  stopHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  stopHostsModalMessage: undefined,

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'Остановить ВМ{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: 'Вы уверены, что хотите остановить {vms, number} ВМ{vms, plural, one {} other {s}}?',

  // Original text: 'Restart VM'
  restartVmModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {name}?'
  restartVmModalMessage: undefined,

  // Original text: 'Stop VM'
  stopVmModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {name}?'
  stopVmModalMessage: undefined,

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
  restartVmsModalTitle: 'Перезапустить ВМ{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: 'Вы уверены, что хотите перезапустить {vms, number} ВМ{vms, plural, one {} other {s}}?',

  // Original text: 'Restart operation for this VM is blocked. Would you like to restart it anyway?'
  restartVmBlockedModalMessage: undefined,

  // Original text: 'save memory'
  snapshotSaveMemory: undefined,

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Снимок ВМ{vms, plural, one {} other {s}}',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Удалить ВМ{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage:
    'Вы уверены, что хотите удалить {vms, number} ВМ{vms, plural, one {} other {s}}? ВСЕ ДИСКИ ВИРТУАЛЬНЫХ МАШИН БУДУТ УДАЛЕНЫ!',

  // Original text: 'delete {nVms, number} vm{nVms, plural, one {} other {s}}'
  deleteVmsConfirmText: undefined,

  // Original text: "Delete VM"
  deleteVmModalTitle: 'Удалить ВМ',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage:
    'Вы уверены, что хотите удалить эту виртуальную машину? ВСЕ ДИСКИ ВИРТУАЛЬНОЙ МАШИНЫ БУДУТ УДАЛЕНЫ!',

  // Original text: 'Blocked operation'
  deleteVmBlockedModalTitle: undefined,

  // Original text: 'Removing the VM is a blocked operation. Would you like to remove it anyway?'
  deleteVmBlockedModalMessage: undefined,

  // Original text: 'Force migration'
  forceVmMigrateModalTitle: undefined,

  // Original text: 'The VM is incompatible with the CPU features of the destination host. Would you like to force it anyway?'
  forceVmMigrateModalMessage: undefined,

  // Original text: "Migrate VM"
  migrateVmModalTitle: 'Переместить ВМ',

  // Original text: 'Select a destination host:'
  migrateVmSelectHost: undefined,

  // Original text: 'Select a migration network:'
  migrateVmSelectMigrationNetwork: undefined,

  // Original text: 'For each VIF, select a network:'
  migrateVmSelectNetworks: undefined,

  // Original text: 'Select a destination SR:'
  migrateVmsSelectSr: undefined,

  // Original text: 'Select a destination SR for local disks:'
  migrateVmsSelectSrIntraPool: undefined,

  // Original text: 'Select a network on which to connect each VIF:'
  migrateVmsSelectNetwork: undefined,

  // Original text: 'Smart mapping'
  migrateVmsSmartMapping: undefined,

  // Original text: 'VIF'
  migrateVmVif: undefined,

  // Original text: 'Network'
  migrateVmNetwork: undefined,

  // Original text: 'No target host'
  migrateVmNoTargetHost: undefined,

  // Original text: 'A target host is required to migrate a VM'
  migrateVmNoTargetHostMessage: undefined,

  // Original text: 'SR required'
  migrateVmNoSr: undefined,

  // Original text: 'A destination SR is required'
  migrateVmNoSrMessage: undefined,

  // Original text: 'No default SR'
  migrateVmNoDefaultSrError: undefined,

  // Original text: 'Default SR not connected to host'
  migrateVmNotConnectedDefaultSrError: undefined,

  // Original text: 'For each VDI, select an SR (optional)'
  chooseSrForEachVdisModalSelectSr: undefined,

  // Original text: 'Select main SR…'
  chooseSrForEachVdisModalMainSr: undefined,

  // Original text: 'VDI'
  chooseSrForEachVdisModalVdiLabel: undefined,

  // Original text: 'SR*'
  chooseSrForEachVdisModalSrLabel: undefined,

  // Original text: 'Delete job{nJobs, plural, one {} other {s}}'
  deleteJobsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nJobs, number} job{nJobs, plural, one {} other {s}}?'
  deleteJobsModalMessage: undefined,

  // Original text: 'Delete VBD{nVbds, plural, one {} other {s}}'
  deleteVbdsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVbds, number} VBD{nVbds, plural, one {} other {s}}?'
  deleteVbdsModalMessage: undefined,

  // Original text: 'Delete VDI'
  deleteVdiModalTitle: undefined,

  // Original text: 'Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST'
  deleteVdiModalMessage: undefined,

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

  // Original text: 'Revert your VM'
  revertVmModalTitle: undefined,

  // Original text: 'Share your VM'
  shareVmInResourceSetModalTitle: undefined,

  // Original text: 'This VM will be shared with all the members of the self-service {self}. Are you sure?'
  shareVmInResourceSetModalMessage: undefined,

  // Original text: 'Delete VIF{nVifs, plural, one {} other {s}}'
  deleteVifsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVifs, number} VIF{nVifs, plural, one {} other {s}}?'
  deleteVifsModalMessage: undefined,

  // Original text: 'Delete snapshot'
  deleteSnapshotModalTitle: undefined,

  // Original text: 'Are you sure you want to delete this snapshot?'
  deleteSnapshotModalMessage: undefined,

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

  // Original text: 'Are you sure you want to revert this VM to the snapshot state? This operation is irreversible.'
  revertVmModalMessage: undefined,

  // Original text: 'Snapshot before'
  revertVmModalSnapshotBefore: undefined,

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: 'Выберите резервную копию…',

  // Original text: 'Select a destination SR…'
  importBackupModalSelectSr: undefined,

  // Original text: 'Delete orphaned snapshot VDIs'
  deleteOrphanedVdisModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVdis, number} orphaned snapshot VDI{nVdis, plural, one {} other {s}}?'
  deleteOrphanedVdisModalMessage: undefined,

  // Original text: "This operation is definitive."
  definitiveMessageModal: 'Эта операция является окончательной',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Предыдущее использование LUN',

  // Original text: "This LUN has been previously used as storage by a XenServer host. All data will be lost if you choose to continue with the SR creation."
  existingLunModalText:
    'Этот LUN ранее использовался хостом XenServer в качестве хранилища. Все существующие данные будут потеряны, если вы продолжите создание SR.',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: 'Заменить текущую регистрацию?',

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText: 'Ваш XO уже зарегистрирован в {email}, вы хотите сменить регистрацию?',

  // Original text: "Ready for trial?"
  trialReadyModal: 'Готовы к пробному периоду?',

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText:
    'В течение пробного периода для XOA требуется подключение к Интернету. Это ограничение не распространяется на тарифные планы',

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

  // Original text: '* optional'
  optionalEntry: undefined,

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

  // Original text: 'Label'
  serverLabel: undefined,

  // Original text: "Host"
  serverHost: 'Хост',

  // Original text: "Username"
  serverUsername: 'Имя пользователя',

  // Original text: "Password"
  serverPassword: 'Пароль',

  // Original text: "Read Only"
  serverReadOnly: 'Только для чтения',

  // Original text: 'Unauthorized Certificates'
  serverUnauthorizedCertificates: undefined,

  // Original text: 'Allow Unauthorized Certificates'
  serverAllowUnauthorizedCertificates: undefined,

  // Original text: "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured."
  serverUnauthorizedCertificatesInfo: undefined,

  // Original text: 'username'
  serverPlaceHolderUser: undefined,

  // Original text: 'password'
  serverPlaceHolderPassword: undefined,

  // Original text: 'address[:port]'
  serverPlaceHolderAddress: undefined,

  // Original text: 'label'
  serverPlaceHolderLabel: undefined,

  // Original text: 'Connect'
  serverConnect: undefined,

  // Original text: 'Error'
  serverError: undefined,

  // Original text: 'Adding server failed'
  serverAddFailed: undefined,

  // Original text: 'Status'
  serverStatus: undefined,

  // Original text: 'Connection failed. Click for more information.'
  serverConnectionFailed: undefined,

  // Original text: 'Authentication error'
  serverAuthFailed: undefined,

  // Original text: 'Unknown error'
  serverUnknownError: undefined,

  // Original text: 'Invalid self-signed certificate'
  serverSelfSignedCertError: undefined,

  // Original text: 'Do you want to accept self-signed certificate for this server even though it would decrease security?'
  serverSelfSignedCertQuestion: undefined,

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
  copyVm: 'Копировать ВМ',

  // Original text: "Name"
  copyVmName: 'Имя',

  // Original text: 'e.g.: "\\{name\\}_COPY"'
  copyVmNamePatternPlaceholder: undefined,

  // Original text: "Select SR"
  copyVmSelectSr: 'Выберите SR',

  // Original text: 'No target SR'
  copyVmsNoTargetSr: undefined,

  // Original text: 'A target SR is required to copy a VM'
  copyVmsNoTargetSrMessage: undefined,

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

  // Original text: 'Detach host'
  detachHostModalTitle: undefined,

  // Original text: 'Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST.'
  detachHostModalMessage: undefined,

  // Original text: 'Detach'
  detachHost: undefined,

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

  // Original text: 'Forget host'
  forgetHostModalTitle: undefined,

  // Original text: "Are you sure you want to forget {host} from its pool? Be sure this host can't be back online, or use detach instead."
  forgetHostModalMessage: undefined,

  // Original text: 'Forget'
  forgetHost: undefined,

  // Original text: 'Designate a new master'
  setPoolMasterModalTitle: undefined,

  // Original text: 'This operation may take several minutes. Do you want to continue?'
  setPoolMasterModalMessage: undefined,

  // Original text: 'Management'
  networkManagement: undefined,

  // Original text: "Create network"
  newNetworkCreate: 'Создать сеть',

  // Original text: "Interface"
  newNetworkInterface: 'Интерфейс',

  // Original text: "Name"
  newNetworkName: 'Имя',

  // Original text: "Description"
  newNetworkDescription: 'Описание',

  // Original text: "VLAN"
  newNetworkVlan: 'VLAN',

  // Original text: "No VLAN if empty"
  newNetworkDefaultVlan: 'VLAN не определён',

  // Original text: 'MTU'
  newNetworkMtu: undefined,

  // Original text: "Default: 1500"
  newNetworkDefaultMtu: 'По умолчанию: 1500',

  // Original text: 'Bond mode'
  newNetworkBondMode: undefined,

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
  deleteNetwork: 'Удалить сеть',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: 'Вы уверены что хотите удалить эту сеть?',

  // Original text: 'This network is currently in use'
  networkInUse: undefined,

  // Original text: 'Bonded'
  pillBonded: undefined,

  // Original text: 'Bonded network'
  bondedNetwork: undefined,

  // Original text: 'Private network'
  privateNetwork: undefined,

  // Original text: 'Add pool'
  addPool: undefined,

  // Original text: 'Hosts'
  hosts: undefined,

  // Original text: 'No host'
  addHostNoHost: undefined,

  // Original text: 'No host selected to be added'
  addHostNoHostMessage: undefined,

  // Original text: 'Failed to fetch latest master commit'
  failedToFetchLatestMasterCommit: undefined,

  // Original text: "Professional support missing!"
  noProSupport: '"PRO" поддержка не предоставляется!',

  // Original text: "Want to use in production?"
  productionUse: 'Хотите использовать в производстве',

  // Original text: 'Get pro support with the Xen Orchestra Appliance at {website}'
  getSupport: undefined,

  // Original text: "Bug Tracker"
  bugTracker: 'Bug Tracker',

  // Original text: "Issues? Report it!"
  bugTrackerText: 'Проблема? Сообщи!',

  // Original text: "Community"
  community: 'Сообщество',

  // Original text: "Join our community forum!"
  communityText: 'Присоединяйся к форуму нашего сообщества!',

  // Original text: "Free Trial for Premium Edition!"
  freeTrial: 'Бесплатная пробная версия "Premium Edition"!',

  // Original text: "Request your trial now!"
  freeTrialNow: 'Запросите пробную версию прямо сейчас!',

  // Original text: "Any issue?"
  issues: 'Есть проблема?',

  // Original text: "Problem? Contact us!"
  issuesText: 'Проблема? Свяжись с нами!',

  // Original text: "Documentation"
  documentation: 'Документация',

  // Original text: "Read our official doc"
  documentationText: 'Прочтите нашу официальную документацию',

  // Original text: "Pro support included"
  proSupportIncluded: 'Профессиональная поддержка включена',

  // Original text: "Access your XO Account"
  xoAccount: 'Доступ к вашей учетной записи XO',

  // Original text: "Report a problem"
  openTicket: 'Сообщить о проблеме',

  // Original text: "Problem? Open a ticket!"
  openTicketText: 'Проблема? Открой заявку!',

  // Original text: 'Your Xen Orchestra is up to date'
  xoUpToDate: undefined,

  // Original text: 'You are not up to date with master. {nBehind} commit{nBehind, plural, one {} other {s}} behind {nAhead, plural, =0 {} other {and {nAhead, number} commit{nAhead, plural, one {} other {s}} ahead}}'
  xoFromSourceNotUpToDate: undefined,

  // Original text: "Upgrade needed"
  upgradeNeeded: 'Требуется обновление',

  // Original text: "Upgrade now!"
  upgradeNow: 'Обнови сейчас!',

  // Original text: "Or"
  or: 'Или',

  // Original text: "Try it for free!"
  tryIt: 'Попробуй бесплатно!',

  // Original text: "This feature is available starting from {plan} Edition"
  availableIn: 'Эта функция доступна только в {plan} Edition',

  // Original text: "This feature is not available in your version, contact your administrator to know more."
  notAvailable: 'Эта функция недоступна в вашей версии, обратитесь к своему администратору, чтобы узнать больше.',

  // Original text: "Registration"
  registration: 'Регистрация',

  // Original text: "Settings"
  settings: 'Настройки',

  // Original text: 'Proxy settings'
  proxySettings: undefined,

  // Original text: 'Host (myproxy.example.org)'
  proxySettingsHostPlaceHolder: undefined,

  // Original text: 'Port (eg: 3128)'
  proxySettingsPortPlaceHolder: undefined,

  // Original text: 'Username'
  proxySettingsUsernamePlaceHolder: undefined,

  // Original text: 'Password'
  proxySettingsPasswordPlaceHolder: undefined,

  // Original text: 'Your email account'
  updateRegistrationEmailPlaceHolder: undefined,

  // Original text: 'Your password'
  updateRegistrationPasswordPlaceHolder: undefined,

  // Original text: 'Troubleshooting documentation'
  updaterTroubleshootingLink: undefined,

  // Original text: "Update"
  update: 'Обновить',

  // Original text: 'Refresh'
  refresh: undefined,

  // Original text: "Upgrade"
  upgrade: 'Обновить',

  // Original text: 'Downgrade'
  downgrade: undefined,

  // Original text: "Please consider subscribing and trying it with all the features for free during 30 days on {link}."
  considerSubscribe:
    'Пожалуйста, рассмотрите возможность подписки и попробуйте все функции бесплатно в течение 30 дней на {link}.',

  // Original text: "Current version:"
  currentVersion: 'Текущая версия:',

  // Original text: "Register"
  register: 'Регистрация',

  // Original text: "Edit registration"
  editRegistration: 'Изменить регистрацию',

  // Original text: "Please, take time to register in order to enjoy your trial."
  trialRegistration: 'Пожалуйста, зарегистрируйтесь, чтобы испытать пробный период',

  // Original text: "Start trial"
  trialStartButton: 'Активировать пробный период',

  // Original text: "You can use a trial version until {date, date, medium}. Upgrade your appliance to get it."
  trialAvailableUntil:
    'Вы можете использовать пробную версию до {date, date, medium}. Обновите свою установку Xen Orchestra, чтобы продолжить использовать все преимущества.',

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed: 'Ваш пробный период закончился. Свяжитесь с нами или вернитесь к бесплатной версии',

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked:
    'Ваша служба xoa-updater, похоже, не работает. XOA не может работать должным образом без обращения к этой службе',

  // Original text: "No update information available"
  noUpdateInfo: 'Нет информации об обновлении',

  // Original text: "Update information may be available"
  waitingUpdateInfo: 'Информация об обновлении может быть доступна',

  // Original text: "Your XOA is up-to-date"
  upToDate: 'Ваш XOA обновлен до последней версии',

  // Original text: "You need to update your XOA (new version is available)"
  mustUpgrade: 'Вам необходимо обновить XOA (доступна новая версия)',

  // Original text: "Your XOA is not registered for updates"
  registerNeeded: 'Ваш XOA не зарегистрирован для получения обновлений',

  // Original text: "Can't fetch update information"
  updaterError: 'Не удалось получить информацию об обновлении',

  // Original text: 'Upgrade successful'
  promptUpgradeReloadTitle: undefined,

  // Original text: 'Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?'
  promptUpgradeReloadMessage: undefined,

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
  disclaimerTitle: 'Xen Orchestra из исходного кода',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: 'Вы используете XO из исходного кода! Отлично подходит для личного/некоммерческого использования',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: undefined,

  // Original text: "This version is not bundled with any support nor updates. Use it with caution."
  disclaimerText3: 'Эта версия без поддержки и обновлений. Используйте с осторожностью при выполнении важных задач.',

  // Original text: 'Why do I see this message?'
  disclaimerText4: undefined,

  // Original text: 'You are not registered. Your XOA may not be up to date.'
  notRegisteredDisclaimerInfo: undefined,

  // Original text: 'Click here to create an account.'
  notRegisteredDisclaimerCreateAccount: undefined,

  // Original text: 'Click here to register and update your XOA.'
  notRegisteredDisclaimerRegister: undefined,

  // Original text: "Connect PIF"
  connectPif: 'Подключить PIF',

  // Original text: "Are you sure you want to connect this PIF?"
  connectPifConfirm: 'Вы уверены, что хотите подключить этот PIF?',

  // Original text: "Disconnect PIF"
  disconnectPif: 'Отключить PIF',

  // Original text: "Are you sure you want to disconnect this PIF?"
  disconnectPifConfirm: 'Вы уверены, что хотите отключить этот PIF?',

  // Original text: "Delete PIF"
  deletePif: 'Удалить PIF',

  // Original text: "Are you sure you want to delete this PIF?"
  deletePifConfirm: 'Вы уверены, что хотите удалить этот PIF?',

  // Original text: 'Delete PIFs'
  deletePifs: undefined,

  // Original text: 'Are you sure you want to delete {nPifs, number} PIF{nPifs, plural, one {} other {s}}?'
  deletePifsConfirm: undefined,

  // Original text: 'Connected'
  pifConnected: undefined,

  // Original text: "Disconnected"
  pifDisconnected: 'Отключен',

  // Original text: 'Physically connected'
  pifPhysicallyConnected: undefined,

  // Original text: 'Physically disconnected'
  pifPhysicallyDisconnected: undefined,

  // Original text: 'Token'
  authToken: undefined,

  // Original text: 'Authentication tokens'
  authTokens: undefined,

  // Original text: 'Last use'
  authTokenLastUse: undefined,

  // Original text: 'Username'
  username: undefined,

  // Original text: 'Password'
  password: undefined,

  // Original text: 'Language'
  language: undefined,

  // Original text: 'Old password'
  oldPasswordPlaceholder: undefined,

  // Original text: 'New password'
  newPasswordPlaceholder: undefined,

  // Original text: 'Confirm new password'
  confirmPasswordPlaceholder: undefined,

  // Original text: 'Confirmation password incorrect'
  confirmationPasswordError: undefined,

  // Original text: 'Password does not match the confirm password.'
  confirmationPasswordErrorBody: undefined,

  // Original text: 'Password changed'
  pwdChangeSuccess: undefined,

  // Original text: 'Your password has been successfully changed.'
  pwdChangeSuccessBody: undefined,

  // Original text: 'Incorrect password'
  pwdChangeError: undefined,

  // Original text: 'The old password provided is incorrect. Your password has not been changed.'
  pwdChangeErrorBody: undefined,

  // Original text: 'OK'
  changePasswordOk: undefined,

  // Original text: 'Forget all authentication tokens'
  forgetTokens: undefined,

  // Original text: 'This prevents authenticating with existing tokens but the one used by the current session'
  forgetTokensExplained: undefined,

  // Original text: 'Successfully forgot authentication tokens'
  forgetTokensSuccess: undefined,

  // Original text: 'Error while forgetting authentication tokens'
  forgetTokensError: undefined,

  // Original text: 'SSH keys'
  sshKeys: undefined,

  // Original text: 'New token'
  newAuthToken: undefined,

  // Original text: 'New SSH key'
  newSshKey: undefined,

  // Original text: 'Delete selected authentication tokens'
  deleteAuthTokens: undefined,

  // Original text: 'Delete'
  deleteSshKey: undefined,

  // Original text: 'Delete selected SSH keys'
  deleteSshKeys: undefined,

  // Original text: 'New authentication token'
  newAuthTokenModalTitle: undefined,

  // Original text: "New SSH key"
  newSshKeyModalTitle: 'Новый SSH ключ',

  // Original text: 'SSH key already exists!'
  sshKeyAlreadyExists: undefined,

  // Original text: "Invalid key"
  sshKeyErrorTitle: 'Недействительный ключ',

  // Original text: "An SSH key requires both a title and a key."
  sshKeyErrorMessage: 'Для SSH-ключа требуется как заголовок, так и ключ.',

  // Original text: "Title"
  title: 'Заголовок',

  // Original text: "Key"
  key: 'Ключ',

  // Original text: 'Delete authentication token'
  deleteAuthTokenConfirm: undefined,

  // Original text: 'Are you sure you want to delete the authentication token: {id}?'
  deleteAuthTokenConfirmMessage: undefined,

  // Original text: 'Delete authentication token{nTokens, plural, one {} other {s}}'
  deleteAuthTokensConfirm: undefined,

  // Original text: 'Are you sure you want to delete {nTokens, number} autentication token{nTokens, plural, one {} other {s}}?'
  deleteAuthTokensConfirmMessage: undefined,

  // Original text: "Delete SSH key"
  deleteSshKeyConfirm: 'Удалить SSH ключ',

  // Original text: "Are you sure you want to delete the SSH key {title}?"
  deleteSshKeyConfirmMessage: 'Вы уверены, что хотите удалить SSH ключ {title}?',

  // Original text: 'Delete SSH key{nKeys, plural, one {} other {s}}'
  deleteSshKeysConfirm: undefined,

  // Original text: 'Are you sure you want to delete {nKeys, number} SSH key{nKeys, plural, one {} other {s}}?'
  deleteSshKeysConfirmMessage: undefined,

  // Original text: 'Add OTP authentication'
  addOtpConfirm: undefined,

  // Original text: 'To enable OTP authentication, add it to your application and then enter the current password to validate.'
  addOtpConfirmMessage: undefined,

  // Original text: 'Password is invalid'
  addOtpInvalidPassword: undefined,

  // Original text: 'Remove OTP authentication'
  removeOtpConfirm: undefined,

  // Original text: 'Are you sure you want to remove OTP authentication?'
  removeOtpConfirmMessage: undefined,

  // Original text: 'OTP authentication'
  OtpAuthentication: undefined,

  // Original text: '{nOthers, number} other{nOthers, plural, one {} other {s}}'
  others: undefined,

  // Original text: 'User'
  logUser: undefined,

  // Original text: 'Message'
  logMessage: undefined,

  // Original text: 'Use XCP-ng to get rid of restrictions'
  logSuggestXcpNg: undefined,

  // Original text: 'This is a XenServer/XCP-ng error'
  logXapiError: undefined,

  // Original text: "Error"
  logError: 'Ошибка',

  // Original text: 'Logs'
  logTitle: undefined,

  // Original text: "Display details"
  logDisplayDetails: 'Показать детали',

  // Original text: 'Download log'
  logDownload: undefined,

  // Original text: "Date"
  logTime: 'Дата',

  // Original text: "Delete log"
  logDelete: 'Удалить журнал',

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
  logIndicationToEnable: 'Нажмите для включения',

  // Original text: "Click to disable"
  logIndicationToDisable: 'Нажмите для отключения',

  // Original text: "Report a bug"
  reportBug: 'Сообщить об ошибке',

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
  ipPoolName: 'Имя',

  // Original text: "IPs"
  ipPoolIps: 'IPs',

  // Original text: "Networks"
  ipPoolNetworks: 'Сети',

  // Original text: 'No IP pools'
  ipsNoIpPool: undefined,

  // Original text: "Create"
  ipsCreate: 'Создать',

  // Original text: 'VIFs'
  ipsVifs: undefined,

  // Original text: 'Not used'
  ipsNotUsed: undefined,

  // Original text: 'unknown VIF'
  ipPoolUnknownVif: undefined,

  // Original text: 'Name already exists'
  ipPoolNameAlreadyExists: undefined,

  // Original text: 'Keyboard shortcuts'
  shortcutModalTitle: undefined,

  // Original text: 'Global'
  shortcut_XoApp: undefined,

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

  // Original text: 'Home'
  shortcut_Home: undefined,

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
  settingsAclsButtonTooltipVM: 'ВМ',

  // Original text: "Hosts"
  settingsAclsButtonTooltiphost: 'Хосты',

  // Original text: "Pool"
  settingsAclsButtonTooltippool: 'Пул',

  // Original text: 'SR'
  settingsAclsButtonTooltipSR: undefined,

  // Original text: "Network"
  settingsAclsButtonTooltipnetwork: 'Сеть',

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
  noConfigFile: 'Файл настроек не выбран',

  // Original text: "Try dropping a config file here or click to select a config file to upload."
  importTip: 'Перетащите файл настроек сюда, или выберите файл для загрузки',

  // Original text: 'Config'
  config: undefined,

  // Original text: "Import"
  importConfig: 'Импорт',

  // Original text: 'If the config is encrypted, please enter the passphrase:'
  importConfigEnterPassphrase: undefined,

  // Original text: "Config file successfully imported"
  importConfigSuccess: 'Файл настроек успешно импортирован',

  // Original text: "Error while importing config file"
  importConfigError: 'Ошибка при импорте файла настроек',

  // Original text: "Export"
  exportConfig: 'Экспорт',

  // Original text: 'If you want to encrypt the exported config, please enter a passphrase:'
  exportConfigEnterPassphrase: undefined,

  // Original text: "Download current config"
  downloadConfig: 'Скачать текущие настройки',

  // Original text: 'and {n} more'
  andNMore: undefined,

  // Original text: "Snapshots and base copies can't be migrated individually"
  disabledVdiMigrateTooltip: undefined,

  // Original text: "Reconnect all hosts"
  srReconnectAllModalTitle: 'Переподключить все хосты',

  // Original text: "This will reconnect this SR to all its hosts."
  srReconnectAllModalMessage: 'Переподключить этот SR ко всем его хостам',

  // Original text: "Disconnect all hosts"
  srDisconnectAllModalTitle: 'Отключить все хосты',

  // Original text: "This will disconnect this SR from all its hosts."
  srDisconnectAllModalMessage: 'Отключить этот SR от всех хостов.',

  // Original text: "This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR)."
  srsDisconnectAllModalMessage:
    'Отключить выбранный SR от его хоста (локальный SR) или от всех хостов в его пуле (общий SR).',

  // Original text: 'Are you sure you want to forget {nSrs, number} SR{nSrs, plural, one {} other{s}}?'
  forgetNSrsModalMessage: undefined,

  // Original text: 'You will lose all the metadata, meaning all the links between the VDIs (disks) and their respective VMs. This operation cannot be undone.'
  srForgetModalWarning: undefined,

  // Original text: "Disconnected"
  srAllDisconnected: 'Отключено',

  // Original text: 'Partially connected'
  srSomeConnected: undefined,

  // Original text: "Connected"
  srAllConnected: 'Подключено',

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

  // Original text: 'XOSAN'
  xosanTitle: undefined,

  // Original text: 'Suggestions'
  xosanSuggestions: undefined,

  // Original text: 'Warning: using disperse layout is not recommended right now. Please read {link}.'
  xosanDisperseWarning: undefined,

  // Original text: "Name"
  xosanName: 'Имя',

  // Original text: "Host"
  xosanHost: 'Хост',

  // Original text: "Connected Hosts"
  xosanHosts: 'Хосты',

  // Original text: 'Pool'
  xosanPool: undefined,

  // Original text: "Size"
  xosanSize: 'Размер',

  // Original text: 'Used space'
  xosanUsedSpace: undefined,

  // Original text: 'License'
  license: undefined,

  // Original text: 'This XOSAN has more than 1 license!'
  xosanMultipleLicenses: undefined,

  // Original text: 'XOSAN pack needs to be installed and up to date on each host of the pool.'
  xosanNeedPack: undefined,

  // Original text: 'Install it now!'
  xosanInstallIt: undefined,

  // Original text: 'Some hosts need their toolstack to be restarted before you can create an XOSAN'
  xosanNeedRestart: undefined,

  // Original text: 'Restart toolstacks'
  xosanRestartAgents: undefined,

  // Original text: 'Select no more than 1 SR per host'
  xosanSrOnSameHostMessage: undefined,

  // Original text: 'Layout'
  xosanLayout: undefined,

  // Original text: 'Redundancy'
  xosanRedundancy: undefined,

  // Original text: 'Capacity'
  xosanCapacity: undefined,

  // Original text: 'Available space'
  xosanAvailableSpace: undefined,

  // Original text: '* Can fail without data loss'
  xosanDiskLossLegend: undefined,

  // Original text: 'Create'
  xosanCreate: undefined,

  // Original text: 'XOSAN is available in XOA'
  xosanCommunity: undefined,

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

  // Original text: 'Install XOA plugin first'
  xosanInstallCloudPlugin: undefined,

  // Original text: 'Load XOA plugin first'
  xosanLoadCloudPlugin: undefined,

  // Original text: 'No compatible XOSAN pack found for your XenServer versions.'
  xosanNoPackFound: undefined,

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
}
