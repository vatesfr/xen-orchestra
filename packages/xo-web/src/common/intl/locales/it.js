// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/it'

import reactIntlData from 'react-intl/locale-data/it'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: '{key}: {value}'
  keyValue: '{key}: {value}',

  // Original text: "Connecting"
  statusConnecting: 'Connessione',

  // Original text: "Disconnected"
  statusDisconnected: 'Disconnesso',

  // Original text: "Loading…"
  statusLoading: 'Caricamento…',

  // Original text: "Page not found"
  errorPageNotFound: 'Pagina non trovata',

  // Original text: 'No such item'
  errorNoSuchItem: 'Nessuna corrispondenza',

  // Original text: 'Unknown {type}'
  errorUnknownItem: 'Sconosciuto {type}',

  // Original text: '{memoryFree} RAM free'
  memoryFree: '{memoryFree} RAM libera',

  // Original text: 'Date'
  date: 'Data',

  // Original text: 'Notifications'
  notifications: 'Notifiche',

  // Original text: 'No notifications so far.'
  noNotifications: 'Nessuna notifica.',

  // Original text: 'NEW!'
  notificationNew: 'Nuova notifica!',

  // Original text: 'More details'
  moreDetails: 'Più dettagli',

  // Original text: 'Subject'
  messageSubject: 'Soggetto',

  // Original text: 'From'
  messageFrom: 'Da',

  // Original text: 'Reply'
  messageReply: 'Risposta',

  // Original text: 'SR'
  sr: 'SR',

  // Original text: 'Try XOA for free and deploy it here.'
  tryXoa: 'Prova XOA gratuitamente e distribuiscilo.',

  // Original text: 'Not installed'
  notInstalled: 'Non installato',

  // Original text: "Long click to edit"
  editableLongClickPlaceholder: 'Tieni premuto per modificare',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'Clicca per modificare',

  // Original text: "Browse files"
  browseFiles: 'Sfoglia i file',

  // Original text: "Show logs"
  showLogs: 'Mostra i log',

  // Original text: 'None'
  noValue: 'Senza valore',

  // Original text: 'Compression'
  compression: 'Compressione',

  // Original text: 'Multipathing'
  multipathing: 'Multipathing',

  // Original text: 'Multipathing disabled'
  multipathingDisabled: 'Multipathing disabilitato',

  // Original text: 'Enable multipathing'
  enableMultipathing: 'Abilita multipathing',

  // Original text: 'Disable multipathing'
  disableMultipathing: 'Disabilita multipathing',

  // Original text: 'Enable multipathing for all hosts'
  enableAllHostsMultipathing: 'Abilita multipathing per tutti gli host',

  // Original text: 'Disable multipathing for all hosts'
  disableAllHostsMultipathing: 'Disabilita multipathing per tutti gli host',

  // Original text: 'Paths'
  paths: 'Percorsi',

  // Original text: 'PBD disconnected'
  pbdDisconnected: 'PBD disconnesso',

  // Original text: 'Has an inactive path'
  hasInactivePath: 'Ha un percorso inattivo',

  // Original text: 'Pools'
  pools: 'Pools',

  // Original text: 'Remotes'
  remotes: 'Remoti',

  // Original text: 'Type'
  type: 'Tipo',

  // Original text: 'Restore'
  restore: 'Ripristinare',

  // Original text: 'Delete'
  delete: 'Elimina',

  // Original text: 'VMs'
  vms: 'VMs',

  // Original text: 'Max vCPUs'
  cpusMax: 'Massimo vCPU',

  // Original text: 'Metadata'
  metadata: 'Metadati',

  // Original text: 'Choose a backup'
  chooseBackup: 'Scegli un backup',

  // Original text: 'Temporarily disabled'
  temporarilyDisabled: 'Temporaneamente disabilitato',

  // Original text: 'Click to show error'
  clickToShowError: "Fai clic per mostrare l'errore",

  // Original text: 'Backup jobs'
  backupJobs: 'Processi di backup',

  // Original text: '({ nSessions, number }) iSCSI session{nSessions, plural, one {} other {s}}'
  iscsiSessions: '({nSessions, number}) session{nSessions, plural, one {e} other {i}} iSCSI',

  // Original text: 'Requires admin permissions'
  requiresAdminPermissions: 'Richiede le autorizzazioni di amministratore',

  // Original text: 'Proxy'
  proxy: 'Proxy',

  // Original text: 'Proxies'
  proxies: 'Proxies',

  // Original text: 'Name'
  name: 'Nome',

  // Original text: 'Address'
  address: 'Indirizzo',

  // Original text: 'VM'
  vm: 'VM',

  // Original text: 'Destination SR'
  destinationSR: 'SR di destinazione',

  // Original text: 'Destination network'
  destinationNetwork: 'Rete di destinazione',

  // Original text: 'DHCP'
  dhcp: 'DHCP',

  // Original text: 'IP'
  ip: 'IP',

  // Original text: 'Static'
  static: 'Statico',

  // Original text: 'User'
  user: 'Utente',

  // Original text: 'deleted ({ name })'
  deletedUser: 'eliminato ({name})',

  // Original text: 'Network configuration'
  networkConfiguration: 'Configurazione di rete',

  // Original text: 'Integrity'
  integrity: 'Integrità',

  // Original text: 'Altered'
  altered: 'Alterato',

  // Original text: 'Missing'
  missing: 'Mancante',

  // Original text: 'Verified'
  verified: 'Verificato',

  // Original text: 'Snapshot mode'
  snapshotMode: 'Modalità istantanea',

  // Original text: 'Normal'
  normal: 'Normale',

  // Original text: 'With memory'
  withMemory: 'Con memoria',

  // Original text: 'Offline'
  offline: 'Disconnesso',

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "OK"
  confirmOk: 'OK',

  // Original text: 'OK'
  formOk: 'OK',

  // Original text: "Cancel"
  genericCancel: 'Cancella',

  // Original text: "Enter the following text to confirm:"
  enterConfirmText: 'Inserisci questo testo per confermare:',

  // Original text: 'On error'
  onError: 'In caso di errore',

  // Original text: "Successful"
  successful: 'Successo',

  // Original text: "Managed disks"
  filterOnlyManaged: 'Dischi gestiti',

  // Original text: "Orphaned disks"
  filterOnlyOrphaned: 'Dischi orfani',

  // Original text: "Normal disks"
  filterOnlyRegular: 'Dischi normali',

  // Original text: "Snapshot disks"
  filterOnlySnapshots: 'Dischi di istantanee',

  // Original text: "Unmanaged disks"
  filterOnlyUnmanaged: 'Dischi non gestiti',

  // Original text: "Save…"
  filterSaveAs: 'Salva…',

  // Original text: "Explore the search syntax in the documentation"
  filterSyntaxLinkTooltip: 'Esplora la sintassi di ricerca nella documentazione',

  // Original text: 'Connected VIFs'
  filterVifsOnlyConnected: 'VIFs connessi',

  // Original text: 'Disconnected VIFs'
  filterVifsOnlyDisconnected: 'VIFs disconnessi',

  // Original text: 'Connected remotes'
  filterRemotesOnlyConnected: 'Remotes connessi',

  // Original text: 'Disconnected remotes'
  filterRemotesOnlyDisconnected: 'Remotes disconnessi',

  // Original text: 'Copy to clipboard'
  copyToClipboard: 'Copia negli appunti',

  // Original text: 'Copy {uuid}'
  copyUuid: 'Copia {uuid}',

  // Original text: 'Master'
  pillMaster: 'Master',

  // Original text: 'Home'
  homePage: 'Home',

  // Original text: 'VMs'
  homeVmPage: 'VMs',

  // Original text: 'Hosts'
  homeHostPage: 'hosts',

  // Original text: 'Pools'
  homePoolPage: 'Pools',

  // Original text: 'Templates'
  homeTemplatePage: 'Modelli',

  // Original text: 'Storages'
  homeSrPage: 'Depositi',

  // Original text: 'Dashboard'
  dashboardPage: 'Pannello di controllo',

  // Original text: 'Overview'
  overviewDashboardPage: 'Panoramica',

  // Original text: 'Visualizations'
  overviewVisualizationDashboardPage: 'Visualizzazioni',

  // Original text: 'Statistics'
  overviewStatsDashboardPage: 'Statistica',

  // Original text: 'Health'
  overviewHealthDashboardPage: 'Salute',

  // Original text: 'Self service'
  selfServicePage: 'Self servizio',

  // Original text: 'Backup'
  backupPage: 'Backup',

  // Original text: 'Jobs'
  jobsPage: 'Processi',

  // Original text: 'XOA'
  xoaPage: 'XOA',

  // Original text: 'Updates'
  updatePage: 'Aggiornamenti',

  // Original text: 'Licenses'
  licensesPage: 'Licenze',

  // Original text: 'Notifications'
  notificationsPage: 'Notifiche',

  // Original text: 'Support'
  supportPage: 'Supporto',

  // Original text: 'Settings'
  settingsPage: 'Impostazioni',

  // Original text: 'Audit'
  settingsAuditPage: 'Revisione',

  // Original text: 'Servers'
  settingsServersPage: 'Servers',

  // Original text: 'Users'
  settingsUsersPage: 'Utenti',

  // Original text: 'Groups'
  settingsGroupsPage: 'Gruppi',

  // Original text: 'ACLs'
  settingsAclsPage: 'ACLs',

  // Original text: 'Plugins'
  settingsPluginsPage: 'Plugins',

  // Original text: 'Logs'
  settingsLogsPage: 'Logs',

  // Original text: 'Cloud configs'
  settingsCloudConfigsPage: 'Configurazioni cloud',

  // Original text: 'IPs'
  settingsIpsPage: 'IPs',

  // Original text: 'Config'
  settingsConfigPage: 'Configurazione',

  // Original text: 'About'
  aboutPage: 'Informazioni',

  // Original text: 'About XO {xoaPlan}'
  aboutXoaPlan: 'Informazioni su XO {xoaPlan}',

  // Original text: 'New'
  newMenu: 'Nuovo',

  // Original text: 'Tasks'
  taskMenu: 'Compiti',

  // Original text: 'Tasks'
  taskPage: 'Compiti',

  // Original text: 'Network'
  newNetworkPage: 'Rete',

  // Original text: 'VM'
  newVmPage: 'VM',

  // Original text: 'Storage'
  newSrPage: 'Deposito',

  // Original text: 'Server'
  newServerPage: 'Server',

  // Original text: 'Import'
  newImport: 'Importare',

  // Original text: 'XOSAN'
  xosan: 'XOSAN',

  // Original text: 'How to migrate to the new backup system'
  backupMigrationLink: 'Come migrare al nuovo sistema di backup',

  // Original text: 'Overview'
  backupOverviewPage: 'Panoramica',

  // Original text: 'New'
  backupNewPage: 'Nuovo',

  // Original text: 'Remotes'
  backupRemotesPage: 'Remoti',

  // Original text: 'Restore'
  backupRestorePage: 'Ripristinare',

  // Original text: 'File restore'
  backupFileRestorePage: 'Ripristino file',

  // Original text: 'Schedule'
  schedule: 'Pianificazione',

  // Original text: 'New VM backup'
  newVmBackup: 'Nuovo backup di VM',

  // Original text: 'Backup'
  backup: 'Backup',

  // Original text: 'Rolling Snapshot'
  rollingSnapshot: 'Istantanea a rotazione',

  // Original text: 'Delta Backup'
  deltaBackup: 'Delta Backup',

  // Original text: 'Disaster Recovery'
  disasterRecovery: 'Disaster Recovery',

  // Original text: 'Continuous Replication'
  continuousReplication: 'Replica continua',

  // Original text: 'Backup type'
  backupType: 'Tipo di backup',

  // Original text: 'Pool metadata'
  poolMetadata: 'Metadati del pool',

  // Original text: 'XO config'
  xoConfig: 'XO config',

  // Original text: 'Backup VMs'
  backupVms: 'VM di backup',

  // Original text: 'Backup metadata'
  backupMetadata: 'Metadati backup',

  // Original text: 'Overview'
  jobsOverviewPage: 'Panoramica',

  // Original text: 'New'
  jobsNewPage: 'Nuovo',

  // Original text: 'Scheduling'
  jobsSchedulingPage: 'Pianificazione',

  // Original text: 'Custom Job'
  customJob: 'Lavoro personalizzato',

  // Original text: 'User'
  userPage: 'Utente',

  // Original text: 'XOA'
  xoa: 'XOA',

  // Original text: 'No support'
  noSupport: 'Senza supporto',

  // Original text: 'Free upgrade!'
  freeUpgrade: 'Aggiornamento gratuito!',

  // Original text: 'Check XOA'
  checkXoa: 'Controlla XOA',

  // Original text: 'XOA check'
  xoaCheck: 'Controllo XOA',

  // Original text: 'Close tunnel'
  closeTunnel: 'Chiudi tunnel',

  // Original text: 'Create a support ticket'
  createSupportTicket: 'Crea un ticket di supporto',

  // Original text: 'Open tunnel'
  openTunnel: 'Tunnel aperto',

  // Original text: 'The XOA check and the support tunnel are available in XOA.'
  supportCommunity: 'Il controllo XOA e il tunnel di supporto sono disponibili in XOA.',

  // Original text: 'Support tunnel'
  supportTunnel: 'Tunnel di supporto',

  // Original text: 'The support tunnel is closed.'
  supportTunnelClosed: 'Il tunnel di supporto è chiuso.',

  // Original text: 'Sign out'
  signOut: 'Disconnessione',

  // Original text: 'Edit my settings {username}'
  editUserProfile: 'Modifica le mie impostazioni {username}',

  // Original text: 'Fetching data…'
  homeFetchingData: 'Recupero dei dati…',

  // Original text: 'Welcome to Xen Orchestra!'
  homeWelcome: 'Benvenuti in Xen Orchestra!',

  // Original text: 'Add your XCP-ng hosts or pools'
  homeWelcomeText: 'Aggiungi i tuoi hosts o pools XCP-ng',

  // Original text: 'Some XCP-ng hosts have been registered but are not connected'
  homeConnectServerText: 'Alcuni XCP-ng hosts sono stati registrati ma non sono collegati',

  // Original text: 'Want some help?'
  homeHelp: 'Vuoi un aiuto?',

  // Original text: 'Add server'
  homeAddServer: 'Aggiungi server',

  // Original text: 'Connect servers'
  homeConnectServer: 'Collega i server',

  // Original text: 'Online doc'
  homeOnlineDoc: 'Documentazione online',

  // Original text: 'Pro support'
  homeProSupport: 'Supporto professionale',

  // Original text: 'There are no VMs!'
  homeNoVms: 'Non ci sono VMs!',

  // Original text: 'Or…'
  homeNoVmsOr: 'O…',

  // Original text: 'Import VM'
  homeImportVm: 'Importa VM',

  // Original text: 'Import an existing VM in xva format'
  homeImportVmMessage: 'Importa una VM esistente in formato xva',

  // Original text: 'Restore a backup'
  homeRestoreBackup: 'Ripristina un backup',

  // Original text: 'Restore a backup from a remote store'
  homeRestoreBackupMessage: 'Ripristina un backup da un desposito remoto',

  // Original text: 'This will create a new VM'
  homeNewVmMessage: 'Ciò creerà una nuova VM',

  // Original text: 'Filters'
  homeFilters: 'Filtri',

  // Original text: 'No results! Click here to reset your filters'
  homeNoMatches: 'Nessun risultato! Fai clic qui per azzerare i filtri',

  // Original text: 'Pool'
  homeTypePool: 'Pool',

  // Original text: 'Host'
  homeTypeHost: 'Host',

  // Original text: 'VM'
  homeTypeVm: 'VM',

  // Original text: 'SR'
  homeTypeSr: 'SR',

  // Original text: 'Template'
  homeTypeVmTemplate: 'Modello',

  // Original text: 'Sort'
  homeSort: 'Ordinare',

  // Original text: 'Pools'
  homeAllPools: 'Pools',

  // Original text: 'Hosts'
  homeAllHosts: 'Hosts',

  // Original text: 'Tags'
  homeAllTags: 'Etichette',

  // Original text: 'Resource sets'
  homeAllResourceSets: 'Insiemi di risorse',

  // Original text: 'New VM'
  homeNewVm: 'Nuova VM',

  // Original text: 'None'
  homeFilterNone: 'Nessuna',

  // Original text: 'Running hosts'
  homeFilterRunningHosts: 'Hosts in esecuzione',

  // Original text: 'Disabled hosts'
  homeFilterDisabledHosts: 'Hosts disabilitati',

  // Original text: 'Running VMs'
  homeFilterRunningVms: 'VMs in esecuzione',

  // Original text: 'Non running VMs'
  homeFilterNonRunningVms: 'VMs non in esecuzione',

  // Original text: 'Pending VMs'
  homeFilterPendingVms: 'VMs in sospeso',

  // Original text: 'HVM guests'
  homeFilterHvmGuests: 'Ospiti HVM',

  // Original text: 'Tags'
  homeFilterTags: 'Etichette',

  // Original text: 'Sort by'
  homeSortBy: 'Ordina per',

  // Original text: 'CPUs'
  homeSortByCpus: 'CPUs',

  // Original text: 'Start time'
  homeSortByStartTime: 'Ora di inizio',

  // Original text: 'Name'
  homeSortByName: 'Nome',

  // Original text: 'Power state'
  homeSortByPowerstate: 'Stato di alimentazione',

  // Original text: 'RAM'
  homeSortByRAM: 'RAM',

  // Original text: 'Shared/Not shared'
  homeSortByShared: 'Condiviso/Non condiviso',

  // Original text: 'Size'
  homeSortBySize: 'Dimensione',

  // Original text: 'Type'
  homeSortByType: 'Tipo',

  // Original text: 'Usage'
  homeSortByUsage: 'Uso',

  // Original text: 'Snapshots'
  homeSortVmsBySnapshots: 'Istantanei',

  // Original text: 'Container'
  homeSortByContainer: 'Contenitore',

  // Original text: 'Pool'
  homeSortByPool: 'Pool',

  // Original text: '{displayed, number}x {icon} (on {total, number})'
  homeDisplayedItems: '{displayed, number}x {icon} (su {total, number})',

  // Original text: '{selected, number}x {icon} selected (on {total, number})'
  homeSelectedItems: '{selected, number}x {icon} selezionat{selected, plural, one {o} other {i}} (su {total, number})',

  // Original text: 'More'
  homeMore: 'Più',

  // Original text: 'Migrate to…'
  homeMigrateTo: 'Migrare a…',

  // Original text: 'Missing patches'
  homeMissingPatches: 'Patches mancanti',

  // Original text: 'Master:'
  homePoolMaster: 'Master:',

  // Original text: 'Resource set: {resourceSet}'
  homeResourceSet: 'Set di risorse: {resourceSet}',

  // Original text: 'High Availability'
  highAvailability: 'Alta disponibilità',

  // Original text: 'Shared {type}'
  srSharedType: 'Condiviso {type}',

  // Original text: 'Host time and XOA time are not consistent with each other'
  warningHostTimeTooltip: "L'ora dello host e l'ora XOA non sono coerenti tra loro",

  // Original text: 'Select from existing tags'
  selectExistingTags: 'Seleziona da etichette esistenti',

  // Original text: 'Name'
  snapshotVmsName: 'Nome',

  // Original text: 'Description'
  snapshotVmsDescription: 'Descrizione',

  // Original text: 'All of them are selected'
  sortedTableAllItemsSelected: 'Tutti sono selezionati ({nItems, number})',

  // Original text: 'No items found'
  sortedTableNoItems: 'Nessun elemento trovato',

  // Original text: '{nFiltered, number} of {nTotal, number} items'
  sortedTableNumberOfFilteredItems: '{nFiltered, number} di {nTotal, number} elementi',

  // Original text: '{nTotal, number} items'
  sortedTableNumberOfItems: '{nTotal, number} elementi',

  // Original text: '{nSelected, number} selected'
  sortedTableNumberOfSelectedItems: '{nSelected, number} selezionat{nSelected, plural, one {o} other {i}}',

  // Original text: 'Click here to select all items'
  sortedTableSelectAllItems: 'Clicca qui per selezionare tutti gli elementi',

  // Original text: 'GZIP (very slow)'
  chooseCompressionGzipOption: 'GZIP (molto lento)',

  // Original text: 'Zstd (fast, XCP-ng only)'
  chooseCompressionZstdOption: 'Zstd (veloce, solo XCP-ng)',

  // Original text: 'State'
  state: 'Stato',

  // Original text: 'Disabled'
  stateDisabled: 'Disabilitato',

  // Original text: 'Enabled'
  stateEnabled: 'Abilitato',

  // Original text: 'Disk'
  labelDisk: 'Disco',

  // Original text: 'Merge'
  labelMerge: 'Merge',

  // Original text: 'Size'
  labelSize: 'Dimensione',

  // Original text: 'Speed'
  labelSpeed: 'Velocità',

  // Original text: 'SR'
  labelSr: 'SR',

  // Original text: 'Transfer'
  labelTransfer: 'Trasferimento',

  // Original text: 'VM'
  labelVm: 'VM',

  // Original text: 'Cancel'
  formCancel: 'Annulla',

  // Original text: 'Create'
  formCreate: 'Creare',

  // Original text: 'Description'
  formDescription: 'Descrizione',

  // Original text: 'Edit'
  formEdit: 'Modificare',

  // Original text: 'ID'
  formId: 'ID',

  // Original text: 'Name'
  formName: 'Nome',

  // Original text: 'Reset'
  formReset: 'Ripristina',

  // Original text: 'Save'
  formSave: 'Salva',

  // Original text: 'Notes'
  formNotes: 'Appunti',

  // Original text: 'Add'
  add: 'Aggiungi',

  // Original text: 'Select all'
  selectAll: 'Seleziona tutto',

  // Original text: 'Remove'
  remove: 'Rimuovi',

  // Original text: 'Preview'
  preview: 'Anteprima',

  // Original text: 'Action'
  action: 'Azione',

  // Original text: 'Item'
  item: 'Elemento',

  // Original text: 'No selected value'
  noSelectedValue: 'Nessun valore selezionato',

  // Original text: 'Choose user(s) and/or group(s)'
  selectSubjects: 'Scegli utente(i) e/o gruppo(i)',

  // Original text: 'Select object(s)…'
  selectObjects: 'Seleziona oggetto(i)…',

  // Original text: 'Choose a role'
  selectRole: 'Scegli un ruolo',

  // Original text: 'Select host(s)…'
  selectHosts: 'Seleziona host(s)…',

  // Original text: 'Select object(s)…'
  selectHostsVms: 'Seleziona oggetto(i)…',

  // Original text: 'Select network(s)…'
  selectNetworks: 'Seleziona rete(i)…',

  // Original text: 'Select PIF(s)…'
  selectPifs: 'Seleziona PIF(s)…',

  // Original text: 'Select pool(s)…'
  selectPools: 'Seleziona pool(s)…',

  // Original text: 'Select remote(s)…'
  selectRemotes: 'Seleziona remoto(i)…',

  // Original text: 'Select proxy(ies)…'
  selectProxies: 'Seleziona proxy(ies)…',

  // Original text: 'Select proxy…'
  selectProxy: 'Seleziona proxy…',

  // Original text: 'Select resource set(s)…'
  selectResourceSets: 'Seleziona set di risorse…',

  // Original text: 'Select template(s)…'
  selectResourceSetsVmTemplate: 'Seleziona modello(i)…',

  // Original text: 'Select SR(s)…'
  selectResourceSetsSr: 'Seleziona SR(s)…',

  // Original text: 'Select network(s)…'
  selectResourceSetsNetwork: 'Seleziona rete(i)…',

  // Original text: 'Select disk(s)…'
  selectResourceSetsVdi: 'Seleziona disco(i)…',

  // Original text: 'Select SSH key(s)…'
  selectSshKey: 'Seleziona chiave(i) SSH…',

  // Original text: 'Select SR(s)…'
  selectSrs: 'Seleziona SR(s)…',

  // Original text: 'Select VM(s)…'
  selectVms: 'Seleziona VM(s)…',

  // Original text: 'Select snapshot(s)…'
  selectVmSnapshots: 'Seleziona istantanea(e)…',

  // Original text: 'Select VM template(s)…'
  selectVmTemplates: 'Seleziona modello(i) di VM…',

  // Original text: 'Select tag(s)…'
  selectTags: 'Seleziona etichetta(e)…',

  // Original text: 'Select disk(s)…'
  selectVdis: 'Seleziona disco(i)…',

  // Original text: 'Select timezone…'
  selectTimezone: 'Seleziona fuso orario…',

  // Original text: 'Select IP(s)…'
  selectIp: 'Seleziona IP(s)…',

  // Original text: 'Select IP pool(s)…'
  selectIpPool: 'Seleziona pool(s) IP…',

  // Original text: 'Select VGPU type(s)…'
  selectVgpuType: 'Seleziona tipo(i) di VGPU…',

  // Original text: 'Fill information (optional)'
  fillOptionalInformations: 'Riempi informazioni (facoltativo)',

  // Original text: 'Reset'
  selectTableReset: 'Ripristina',

  // Original text: 'Select cloud config(s)…'
  selectCloudConfigs: 'Seleziona configurazione(i) cloud…',

  // Original text: 'Month'
  schedulingMonth: 'Mese',

  // Original text: 'Day'
  schedulingDay: 'Giorno',

  // Original text: 'Switch to week days'
  schedulingSetWeekDayMode: 'Passa ai giorni della settimana',

  // Original text: 'Switch to month days'
  schedulingSetMonthDayMode: 'Passa ai giorni del mese',

  // Original text: 'Hour'
  schedulingHour: 'Ora',

  // Original text: 'Minute'
  schedulingMinute: 'Minuto',

  // Original text: 'Every month'
  selectTableAllMonth: 'Ogni mese',

  // Original text: 'Every day'
  selectTableAllDay: 'Ogni giorno',

  // Original text: 'Every hour'
  selectTableAllHour: 'Ogni ora',

  // Original text: 'Every minute'
  selectTableAllMinute: 'Ogni minuto',

  // Original text: 'Unknown'
  unknownSchedule: 'Sconosciuto',

  // Original text: 'Web browser timezone'
  timezonePickerUseLocalTime: 'Fuso orario del browser Web',

  // Original text: 'Server timezone ({value})'
  serverTimezoneOption: 'Fuso orario del server ({value})',

  // Original text: 'Cron Pattern:'
  cronPattern: 'Modello cron:',

  // Original text: 'Successful'
  successfulJobCall: 'Riuscito',

  // Original text: 'Failed'
  failedJobCall: 'Fallito',

  // Original text: 'Skipped'
  jobCallSkipped: 'Saltato',

  // Original text: 'In progress'
  jobCallInProgess: 'In corso',

  // Original text: 'Transfer size:'
  jobTransferredDataSize: 'Dimensione del trasferimento:',

  // Original text: 'Transfer speed:'
  jobTransferredDataSpeed: 'Velocità di trasferimento:',

  // Original text: 'Size'
  operationSize: 'Dimensione',

  // Original text: 'Speed'
  operationSpeed: 'Velocità',

  // Original text: 'Type'
  exportType: 'Tipo',

  // Original text: 'Merge size:'
  jobMergedDataSize: 'Unisci dimensioni:',

  // Original text: 'Merge speed:'
  jobMergedDataSpeed: 'Unisci velocità:',

  // Original text: 'All'
  allJobCalls: 'Tutti',

  // Original text: 'Job'
  job: 'Lavoro',

  // Original text: 'Job {job}'
  jobModalTitle: 'Lavoro {job}',

  // Original text: 'ID'
  jobId: 'ID',

  // Original text: 'Type'
  jobType: 'Tipo',

  // Original text: 'Name'
  jobName: 'Nome',

  // Original text: 'Modes'
  jobModes: 'Modalità',

  // Original text: 'Name of your job (forbidden: "_")'
  jobNamePlaceholder: 'Nome del tuo lavoro (vietato: "_")',

  // Original text: 'Start'
  jobStart: 'Inizio',

  // Original text: 'End'
  jobEnd: 'Fine',

  // Original text: 'Duration'
  jobDuration: 'Durata',

  // Original text: 'Status'
  jobStatus: 'Stato',

  // Original text: 'Action'
  jobAction: 'Azione',

  // Original text: 'Tag'
  jobTag: 'Etichetta',

  // Original text: 'Scheduling'
  jobScheduling: 'Pianificazione',

  // Original text: 'Timezone'
  jobTimezone: 'Fuso orario',

  // Original text: 'Server'
  jobServerTimezone: 'Server',

  // Original text: 'Run job'
  runJob: 'Esegui lavoro',

  // Original text: 'Cancel job'
  cancelJob: 'Annulla lavoro',

  // Original text: 'Are you sure you want to run {backupType} {id} ({tag})?'
  runJobConfirm: 'Sei sicuro di voler eseguire {backupType} {id} ({tag})?',

  // Original text: 'Onetime job started. See overview for logs.'
  runJobVerbose: 'Il singolo lavoro è iniziato. Vedi i registri.',

  // Original text: 'Edit job'
  jobEdit: 'Modifica lavoro',

  // Original text: 'Delete'
  jobDelete: 'Elimina',

  // Original text: 'Finished'
  jobFinished: 'Finito',

  // Original text: 'Interrupted'
  jobInterrupted: 'Interrotto',

  // Original text: 'Started'
  jobStarted: 'Iniziato',

  // Original text: 'Failed'
  jobFailed: 'Fallito',

  // Original text: 'Skipped'
  jobSkipped: 'Saltato',

  // Original text: 'Successful'
  jobSuccess: 'Riuscito',

  // Original text: 'All'
  allTasks: 'Tutti',

  // Original text: 'Start'
  taskStart: 'Inizio',

  // Original text: 'End'
  taskEnd: 'Fine',

  // Original text: 'Duration'
  taskDuration: 'Durata',

  // Original text: 'Successful'
  taskSuccess: 'Riuscito',

  // Original text: 'Failed'
  taskFailed: 'Fallito',

  // Original text: 'Skipped'
  taskSkipped: 'Saltato',

  // Original text: 'Started'
  taskStarted: 'Iniziato',

  // Original text: 'Interrupted'
  taskInterrupted: 'Interrotto',

  // Original text: 'Transfer size'
  taskTransferredDataSize: 'Dimensione del trasferimento',

  // Original text: 'Transfer speed'
  taskTransferredDataSpeed: 'Velocità di trasferimento',

  // Original text: 'Merge size'
  taskMergedDataSize: 'Unisci dimensioni',

  // Original text: 'Merge speed'
  taskMergedDataSpeed: 'Unisci la velocità',

  // Original text: 'Error'
  taskError: 'Errore',

  // Original text: 'Reason'
  taskReason: 'Motivo',

  // Original text: 'Save'
  saveBackupJob: 'Salva',

  // Original text: 'Remove backup job'
  deleteBackupSchedule: 'Rimuovere la pianificazione di backup',

  // Original text: 'Are you sure you want to delete this backup job?'
  deleteBackupScheduleQuestion: 'Sei sicuro di voler eliminare questa pianificazione di backup?',

  // Original text: 'Delete selected jobs'
  deleteSelectedJobs: 'Elimina i lavori selezionati',

  // Original text: 'Enable immediately after creation'
  scheduleEnableAfterCreation: 'Abilita subito dopo la creazione',

  // Original text: 'You are editing schedule {name} ({id}). Saving will override previous schedule state.'
  scheduleEditMessage:
    'Stai modificando la pianificazione {name} ({id}). Il salvataggio sostituirà lo stato di pianificazione precedente.',

  // Original text: 'You are editing job {name} ({id}). Saving will override previous job state.'
  jobEditMessage: 'Stai modificando il lavoro {name} ({id}). Il salvataggio sostituirà lo stato del lavoro precedente.',

  // Original text: 'Edit schedule'
  scheduleEdit: 'Modifica pianificazione',

  // Original text: "A name is required to create the backup's job!"
  missingBackupName: 'È richiesto un nome per creare il backup!',

  // Original text: 'Missing VMs!'
  missingVms: 'VMs mancanti!',

  // Original text: 'You need to choose a backup mode!'
  missingBackupMode: 'Devi scegliere una modalità di backup!',

  // Original text: 'Missing remotes!'
  missingRemotes: 'Remoti mancanti!',

  // Original text: 'Missing SRs!'
  missingSrs: 'SR mancanti!',

  // Original text: 'Missing pools!'
  missingPools: 'Pools mancanti!',

  // Original text: 'Missing schedules!'
  missingSchedules: 'Pianificazioni mancanti!',

  // Original text: 'The modes need at least a schedule with retention higher than 0'
  missingRetentions: 'Le modalità richiedono almeno una pianificazione con ritenzione superiore a 0',

  // Original text: 'The Backup mode and the Delta Backup mode require backup retention to be higher than 0!'
  missingExportRetention:
    'La modalità di backup e la modalità di backup delta richiedono che la ritenzione del backup sia superiore a 0!',

  // Original text: 'The CR mode and The DR mode require replication retention to be higher than 0!'
  missingCopyRetention: 'La modalità CR e la modalità DR richiedono che la ritenzione della replica sia superiore a 0!',

  // Original text: 'The Rolling Snapshot mode requires snapshot retention to be higher than 0!'
  missingSnapshotRetention:
    "La modalità Istantanea a Rotazione richiede che la ritenzione dell'istantanea sia superiore a 0!",

  // Original text: 'Requires one retention to be higher than 0!'
  retentionNeeded: 'Richiede che una ritenzione sia superiore a 0!',

  // Original text: 'Invalid schedule'
  newScheduleError: 'Pianificazione non valida',

  // Original text: 'No remotes found, please click on the remotes settings button to create one!'
  createRemoteMessage: 'Nessun remoto trovato, fai clic sul pulsante delle impostazioni remoti per crearne uno!',

  // Original text: 'Remotes settings'
  remotesSettings: 'Impostazioni remoti',

  // Original text: 'Plugins settings'
  pluginsSettings: 'Impostazioni dei plugins',

  // Original text: 'To receive the report, the plugins backup-reports and transport-email need to be loaded.'
  pluginsWarning:
    "Per ricevere il rapporto, è necessario caricare i rapporti di backup dei plugins e l'e-mail di trasporto.",

  // Original text: 'Add a schedule'
  scheduleAdd: 'Aggiungi una pianificazione',

  // Original text: 'Delete'
  scheduleDelete: 'Elimina',

  // Original text: 'Run schedule'
  scheduleRun: 'Esegui la pianificazione',

  // Original text: 'Delete selected schedules'
  deleteSelectedSchedules: 'Elimina le pianificazioni selezionati',

  // Original text: 'No scheduled jobs.'
  noScheduledJobs: 'Nessun lavoro pianificato.',

  // Original text: 'You can delete all your legacy backup snapshots.'
  legacySnapshotsLink: 'Puoi eliminare tutte le tue istantanee di backup.',

  // Original text: 'New schedule'
  newSchedule: 'Nuova pianificazione',

  // Original text: 'No schedules found'
  noSchedules: 'Nessuna pianificazione trovata',

  // Original text: 'Select an xo-server API command'
  jobActionPlaceHolder: 'Seleziona un comando API xo-server',

  // Original text: 'Timeout (number of seconds after which a VM is considered failed)'
  jobTimeoutPlaceHolder: 'Timeout (numero di secondi dopo i quali una VM viene considerata fallita)',

  // Original text: 'Schedules'
  jobSchedules: 'Pianificazioni',

  // Original text: 'Name of your schedule'
  jobScheduleNamePlaceHolder: 'Nome della tua pianificazione',

  // Original text: 'Select a job'
  jobScheduleJobPlaceHolder: 'Seleziona un lavoro',

  // Original text: 'Job owner'
  jobOwnerPlaceholder: 'Proprietario del lavoro',

  // Original text: "This job's creator no longer exists"
  jobUserNotFound: 'Il creatore di questo lavoro non esiste più',

  // Original text: "This backup's creator no longer exists"
  backupUserNotFound: 'Il creatore di questo backup non esiste più',

  // Original text: 'Click here to see the matching VMs'
  redirectToMatchingVms: 'Fai clic qui per vedere le VMs corrispondenti',

  // Original text: 'There are no matching VMs!'
  noMatchingVms: 'Non ci sono VMs corrispondenti!',

  // Original text: '{icon} See the matching VMs ({nMatchingVms, number})'
  allMatchingVms: '{icon} Vedi le VMs corrispondenti ({nMatchingVms, number})',

  // Original text: 'Backup owner'
  backupOwner: 'Proprietario del backup',

  // Original text: 'Migrate to the new backup system'
  migrateBackupSchedule: 'Migrare al nuovo sistema di backup',

  // Original text: 'This will convert the legacy backup job to the new backup system. This operation is not reversible. Do you want to continue?'
  migrateBackupScheduleMessage:
    'Ciò convertirà il processo di backup nel nuovo sistema di backup. Questa operazione non è reversibile. Vuoi continuare?',

  // Original text: 'Are you sure you want to run {name} ({id})?'
  runBackupNgJobConfirm: 'Sei sicuro di voler eseguire {name} ({id})?',

  // Original text: 'Are you sure you want to cancel {name} ({id})?'
  cancelJobConfirm: 'Sei sicuro di voler cancellare {name} ({id})?',

  // Original text: 'If your country participates in DST, it is advised that you avoid scheduling jobs at the time of change. e.g. 2AM to 3AM for US.'
  scheduleDstWarning:
    "Se il tuo paese partecipa all'ora legale, si consiglia di evitare la pianificazione dei lavori al momento della modifica (tra le 2 e 3 del matino).",

  // Original text: 'Advanced settings'
  newBackupAdvancedSettings: 'Impostazioni avanzate',

  // Original text: 'Settings'
  newBackupSettings: 'Impostazioni',

  // Original text: 'Always'
  reportWhenAlways: 'Sempre',

  // Original text: 'Failure'
  reportWhenFailure: 'Fallimento',

  // Original text: 'Never'
  reportWhenNever: 'Mai',

  // Original text: 'Report recipients'
  reportRecipients: 'Segnala i destinatari',

  // Original text: 'Report when'
  reportWhen: 'Segnala quando',

  // Original text: 'Concurrency'
  concurrency: 'Concorrenza',

  // Original text: 'Select your backup type:'
  newBackupSelection: 'Seleziona il tipo di backup:',

  // Original text: 'Select backup mode:'
  smartBackupModeSelection: 'Seleziona la modalità di backup:',

  // Original text: 'Normal backup'
  normalBackup: 'Backup normale',

  // Original text: 'Smart backup'
  smartBackup: 'Backup intelligente',

  // Original text: 'Snapshot retention'
  snapshotRetention: "Ritenzione dell'istantanea",

  // Original text: 'Name'
  backupName: 'Nome',

  // Original text: 'Checkpoint snapshot'
  checkpointSnapshot: 'Istantanea del checkpoint',

  // Original text: 'Offline snapshot'
  offlineSnapshot: 'Istantanea offline',

  // Original text: 'Offline backup'
  offlineBackup: 'Backup offline',

  // Original text: 'Export VMs without snapshotting them. The VMs will be shutdown during the export.'
  offlineBackupInfo: "Esporta VMs senza istantanea. Le VMs verranno arrestate durante l'esportazione.",

  // Original text: 'Timeout'
  timeout: 'Timeout',

  // Original text: 'Number of hours after which a job is considered failed'
  timeoutInfo: 'Numero di ore dopo le quali un lavoro viene considerato non riuscito',

  // Original text: 'Full backup interval'
  fullBackupInterval: 'Intervallo di backup completo',

  // Original text: 'In hours'
  timeoutUnit: 'Tra ore',

  // Original text: 'Delta Backup and DR require an Enterprise plan'
  dbAndDrRequireEnterprisePlan: 'Delta Backup e DR richiedono un piano Enterprise',

  // Original text: 'CR requires a Premium plan'
  crRequiresPremiumPlan: 'CR richiede un piano Premium',

  // Original text: 'Smart mode'
  smartBackupModeTitle: 'Modalità intelligente',

  // Original text: 'Target remotes (for export)'
  backupTargetRemotes: 'Target remoti (per esportazione)',

  // Original text: 'Target SRs (for replication)'
  backupTargetSrs: 'Target SR (per replica)',

  // Original text: 'Local remote selected'
  localRemoteWarningTitle: 'Remoto locale selezionato',

  // Original text: 'Tip: Using thin-provisioned storage will consume less space. Please click on the icon to get more information'
  crOnThickProvisionedSrWarning:
    "Suggerimento: l'utilizzo dell'archiviazione con thin provisioning consumerà meno spazio. Fare clic sull'icona per ottenere maggiori informazioni",

  // Original text: 'Tip: Creating VMs on thin-provisioned storage will consume less space. Please click on the icon to get more information'
  vmsOnThinProvisionedSrTip:
    "Suggerimento: la creazione di VMs su deposito thin provisioning consumerà meno spazio. Fare clic sull'icona per ottenere maggiori informazioni.",

  // Original text: 'Delta Backup and Continuous Replication require at least XenServer 6.5.'
  deltaBackupOnOutdatedXenServerWarning: 'Delta Backup e Replica Continua richiedono almeno XenServer 6.5.',

  // Original text: 'Click for more information about the backup methods.'
  backupNgLinkToDocumentationMessage: 'Fare clic per ulteriori informazioni sui metodi di backup.',

  // Original text: 'Warning: Local remotes will use limited XOA disk space. Only for advanced users.'
  localRemoteWarningMessage:
    'Avvertenza: i remoti locali utilizzeranno uno spazio su disco XOA limitato. Solo per utenti esperti.',

  // Original text: 'Warning: This feature works only with XenServer 6.5 or newer.'
  backupVersionWarning: 'Avviso: questa funzione è disponibile solo con XenServer 6.5 o versioni successive.',

  // Original text: 'VMs'
  editBackupVmsTitle: 'VMs',

  // Original text: 'VMs statuses'
  editBackupSmartStatusTitle: 'Stati delle VMs',

  // Original text: 'Resident on'
  editBackupSmartResidentOn: 'Residente il',

  // Original text: 'Not resident on'
  editBackupSmartNotResidentOn: 'Non residente il',

  // Original text: 'Pools'
  editBackupSmartPools: 'Pools',

  // Original text: 'Tags'
  editBackupSmartTags: 'Etichette',

  // Original text: 'Sample of matching VMs'
  sampleOfMatchingVms: 'Esempio di VMs corrispondenti',

  // Original text: 'Replicated VMs (VMs with Continuous Replication or Disaster Recovery tag) must be excluded!'
  backupReplicatedVmsInfo:
    'Le VMs replicate (VMs con Replica Continua o etichetta di Disaster Recovery) devono essere escluse!',

  // Original text: 'VMs Tags'
  editBackupSmartTagsTitle: 'Etichette di VMs',

  // Original text: 'Excluded VMs tags'
  editBackupSmartExcludedTagsTitle: 'Etichette di VMs esclusi',

  // Original text: 'Reverse'
  editBackupNot: 'Inverso',

  // Original text: 'Tag'
  editBackupTagTitle: 'Etichetta',

  // Original text: 'Report'
  editBackupReportTitle: 'Rapporto',

  // Original text: 'Automatically run as scheduled'
  editBackupScheduleEnabled: 'Esegui automaticamente come pianificato',

  // Original text: 'Retention'
  editBackupRetentionTitle: 'Ritenzione',

  // Original text: 'Remote'
  editBackupRemoteTitle: 'Remoto',

  // Original text: 'Delete first'
  deleteOldBackupsFirst: 'Elimina prima',

  // Original text: 'Delete old backups before backing up the VMs. If the new backup fails, you will lose your old backups.'
  deleteOldBackupsFirstMessage:
    'Elimina i vecchi backup prima di eseguire il backup delle VMs. Se il nuovo backup fallisce, perderai i tuoi vecchi backup.',

  // Original text: 'Custom tag'
  customTag: 'Etichetta personalizzata',

  // Original text: 'New file system remote'
  newRemote: 'Nuovo file system remoto',

  // Original text: 'Local'
  remoteTypeLocal: 'Locale',

  // Original text: 'NFS'
  remoteTypeNfs: 'NFS',

  // Original text: 'SMB'
  remoteTypeSmb: 'SMB',

  // Original text: 'Type'
  remoteType: 'Tipo',

  // Original text: 'SMB remotes are meant to work with Windows Server. For other systems (Linux Samba, which means almost all NAS), please use NFS.'
  remoteSmbWarningMessage:
    'I remoti SMB sono progettati per funzionare con Windows Server. Per altri sistemi (Linux Samba, quasi tutti i NAS), utilizzare NFS.',

  // Original text: 'Test your remote'
  remoteTestTip: 'Prova il tuo remoto',

  // Original text: 'Test remote'
  testRemote: 'Prova remoto',

  // Original text: 'Test failed for {name}'
  remoteTestFailure: 'Prova non riuscita per {name}',

  // Original text: 'Test passed for {name}'
  remoteTestSuccess: 'Prova riuscita per {name}',

  // Original text: 'Error'
  remoteTestError: 'Errore',

  // Original text: 'Test step'
  remoteTestStep: 'Fase di prova',

  // Original text: 'Test name'
  remoteTestName: 'Nome della prova',

  // Original text: 'Remote name already exists!'
  remoteTestNameFailure: 'Il nome del remoto esiste già!',

  // Original text: 'The remote appears to work correctly'
  remoteTestSuccessMessage: 'Il remoto sembra funzionare correttamente',

  // Original text: 'Connection failed'
  remoteConnectionFailed: 'Connessione fallita',

  // Original text: 'Delete backup job{nJobs, plural, one {} other {s}}'
  confirmDeleteBackupJobsTitle: 'Elimina process{nJobs, plural, one {o} other {i}} di backup',

  // Original text: 'Are you sure you want to delete {nJobs, number} backup job{nJobs, plural, one {} other {s}}?'
  confirmDeleteBackupJobsBody:
    'Sei sicuro di voler eliminare {nJobs, number} process{nJobs, plural, one {o} other {i}} di backup?',

  // Original text: 'Name'
  remoteName: 'Nome',

  // Original text: 'Path'
  remotePath: 'Percorso',

  // Original text: 'State'
  remoteState: 'Stato',

  // Original text: 'Device'
  remoteDevice: 'Dispositivo',

  // Original text: 'Disk (Used / Total)'
  remoteDisk: 'Disco (usato / totale)',

  // Original text: 'Speed (Write / Read)'
  remoteSpeed: 'Velocità (scrittura / lettura)',

  // Original text: 'Read and write rate speed performed during latest test'
  remoteSpeedInfo: "Velocità di lettura e scrittura della velocità eseguita durante l'ultima prova",

  // Original text: 'Options'
  remoteOptions: 'Opzioni',

  // Original text: 'Share'
  remoteShare: 'Condividere',

  // Original text: 'Auth'
  remoteAuth: 'Autenticazione',

  // Original text: 'Delete'
  remoteDeleteTip: 'Elimina',

  // Original text: 'Delete selected remotes'
  remoteDeleteSelected: 'Elimina i remoti selezionati',

  // Original text: 'Name'
  remoteMyNamePlaceHolder: 'Nome',

  // Original text: '/path/to/backup'
  remoteLocalPlaceHolderPath: '/',

  // Original text: 'Host'
  remoteNfsPlaceHolderHost: 'Host',

  // Original text: 'Port'
  remoteNfsPlaceHolderPort: 'Porta',

  // Original text: 'path/to/backup'
  remoteNfsPlaceHolderPath: 'path/to/backup',

  // Original text: 'Custom mount options. Default: vers=3'
  remoteNfsPlaceHolderOptions: 'Opzioni di montaggio personalizzate.',

  // Original text: 'Subfolder [path\\\\to\\\\backup]'
  remoteSmbPlaceHolderRemotePath: 'Sottocartella [path\\\\to\\\\backup]',

  // Original text: 'Username'
  remoteSmbPlaceHolderUsername: 'Nome utente',

  // Original text: 'Password'
  remoteSmbPlaceHolderPassword: 'Parola chiave',

  // Original text: 'Domain'
  remoteSmbPlaceHolderDomain: 'Dominio',

  // Original text: '<address>\\\\<share>'
  remoteSmbPlaceHolderAddressShare: '<indirizzo>\\\\<condivisione>',

  // Original text: 'Custom mount options'
  remoteSmbPlaceHolderOptions: 'Opzioni di montaggio personalizzate',

  // Original text: 'Password(fill to edit)'
  remotePlaceHolderPassword: 'Parola chiave (compilare per modificare)',

  // Original text: 'Create a new SR'
  newSrTitle: 'Crea un nuovo SR',

  // Original text: 'General'
  newSrGeneral: 'Generale',

  // Original text: 'Select storage type:'
  newSrTypeSelection: 'Seleziona il tipo di deposito:',

  // Original text: 'Settings'
  newSrSettings: 'Impostazioni',

  // Original text: 'Storage usage'
  newSrUsage: 'Utilizzo dello deposito',

  // Original text: 'Summary'
  newSrSummary: 'Sommario',

  // Original text: 'Host'
  newSrHost: 'Host',

  // Original text: 'Type'
  newSrType: 'Tipo',

  // Original text: 'Name'
  newSrName: 'Nome',

  // Original text: 'Description'
  newSrDescription: 'Descrizione',

  // Original text: 'Server'
  newSrServer: 'Server',

  // Original text: 'Path'
  newSrPath: 'Percorso',

  // Original text: 'IQN'
  newSrIqn: 'IQN',

  // Original text: 'LUN'
  newSrLun: 'LUN',

  // Original text: 'No HBA devices'
  newSrNoHba: 'Nessun dispositivo HBA',

  // Original text: 'With auth.'
  newSrAuth: 'Con autenticazione.',

  // Original text: 'User name'
  newSrUsername: 'Nome utente',

  // Original text: 'Password'
  newSrPassword: 'Parola chiave',

  // Original text: 'Device'
  newSrDevice: 'Dispositivo',

  // Original text: 'In use'
  newSrInUse: 'In uso',

  // Original text: 'Size'
  newSrSize: 'Dimensione',

  // Original text: 'Create'
  newSrCreate: 'Creare',

  // Original text: 'Storage name'
  newSrNamePlaceHolder: 'Nome di deposito',

  // Original text: 'Storage description'
  newSrDescPlaceHolder: 'Descrizione dello deposito',

  // Original text: 'e.g 93.184.216.34 or iscsi.example.net'
  newSrIscsiAddressPlaceHolder: 'ad esempio 93.184.216.34 o iscsi.example.net',

  // Original text: 'e.g 93.184.216.34 or nfs.example.net'
  newSrNfsAddressPlaceHolder: 'ad esempio 93.184.216.34 o nfs.example.net',

  // Original text: 'e.g \\\\server\\sharename'
  newSrSmbAddressPlaceHolder: 'ad esempio \\\\server\\condivisione',

  // Original text: '[port]'
  newSrPortPlaceHolder: '[porta]',

  // Original text: 'Username'
  newSrUsernamePlaceHolder: 'Nome utente',

  // Original text: 'Password'
  newSrPasswordPlaceHolder: 'Parola chiave',

  // Original text: 'Device, e.g /dev/sda…'
  newSrLvmDevicePlaceHolder: 'Dispositivo, ad esempio /dev/sda…',

  // Original text: '/path/to/directory'
  newSrLocalPathPlaceHolder: '/path/to/directory',

  // Original text: 'Default NFS version'
  newSrNfsDefaultVersion: 'Versione NFS predefinita',

  // Original text: 'Comma delimited NFS options'
  newSrNfsOptions: 'Opzioni NFS delimitate da virgola',

  // Original text: 'NFS version'
  newSrNfs: 'Versione NFS',

  // Original text: 'No shared ZFS available'
  noSharedZfsAvailable: 'Nessuna ZFS condivisa disponibile',

  // Original text: 'Reattach SR'
  reattachNewSrTooltip: 'Ricollegare SR',

  // Original text: 'Storage location'
  srLocation: 'Posizione di archiviazione',

  // Original text: 'You do not have permission to create a network'
  createNewNetworkNoPermission: 'Non sei autorizzato a creare una rete',

  // Original text: 'Create a new network on {select}'
  createNewNetworkOn: 'Crea una nuova rete su {select}',

  // Original text: 'Users/Groups'
  subjectName: 'Utenti/Gruppi',

  // Original text: 'Object'
  objectName: 'Oggetto',

  // Original text: 'Role'
  roleName: 'Ruolo',

  // Original text: 'Create'
  aclCreate: 'Creare',

  // Original text: 'New group name'
  newGroupName: 'Nuovo nome del gruppo',

  // Original text: 'Create group'
  createGroup: 'Creare un gruppo',

  // Original text: 'Create'
  createGroupButton: 'Creare',

  // Original text: 'Delete group'
  deleteGroup: 'Elimina gruppo',

  // Original text: 'Are you sure you want to delete this group?'
  deleteGroupConfirm: 'Sei sicuro di voler eliminare questo gruppo?',

  // Original text: 'Remove user from group'
  removeUserFromGroup: "Rimuovi l'utente dal gruppo",

  // Original text: 'Are you sure you want to delete this user?'
  deleteUserConfirm: 'Sei sicuro di voler eliminare questo utente?',

  // Original text: 'Delete user'
  deleteUser: 'Elimina utente',

  // Original text: 'Delete selected users'
  deleteSelectedUsers: 'Elimina gli utenti selezionati',

  // Original text: 'Delete user{nUsers, plural, one {} other {s}}'
  deleteUsersModalTitle: "Elimina {nUsers, plural, one {l'utente} other {i utenti}}",

  // Original text: 'Are you sure you want to delete {nUsers, number} user{nUsers, plural, one {} other {s}}?'
  deleteUsersModalMessage: 'Sei sicuro di voler eliminare {nUsers, number} utent{nUsers, plural, one {e} other {i}}?',

  // Original text: 'No user'
  noUser: 'Nessun utente',

  // Original text: 'Unknown user'
  unknownUser: 'Utente sconosciuto',

  // Original text: 'No group found'
  noGroupFound: 'Nessun gruppo trovato',

  // Original text: 'Name'
  groupNameColumn: 'Nome',

  // Original text: 'Users'
  groupUsersColumn: 'utenti',

  // Original text: 'Add user'
  addUserToGroupColumn: 'Aggiungi utente',

  // Original text: 'Username'
  userNameColumn: 'Nome utente',

  // Original text: 'Member of'
  userGroupsColumn: 'Membro di',

  // Original text: '{nGroups, number} group{nGroups, plural, one {} other {s}}'
  userCountGroups: '{nGroups, number} grupp{nGruppi, plural, one {o} other {i}}',

  // Original text: 'Permissions'
  userPermissionColumn: 'Permessi',

  // Original text: 'Password'
  userPasswordColumn: 'Parola chiave',

  // Original text: 'Username'
  userName: 'Nome utente',

  // Original text: 'Password'
  userPassword: "Parola d'ordine",

  // Original text: 'Create'
  createUserButton: 'Creare',

  // Original text: 'No user found'
  noUserFound: 'Nessun utente trovato',

  // Original text: 'User'
  userLabel: 'Utente',

  // Original text: 'Admin'
  adminLabel: 'Admin',

  // Original text: 'No user in group'
  noUserInGroup: 'Nessun utente nel gruppo',

  // Original text: '{users, number} user{users, plural, one {} other {s}}'
  countUsers: '{users, number} utent{users, plural, one {e} other {i}}',

  // Original text: 'Select permission'
  selectPermission: "Seleziona l'autorizzazione",

  // Original text: 'Delete ACL'
  deleteAcl: 'Elimina ACL',

  // Original text: 'Delete selected ACLs'
  deleteSelectedAcls: 'Elimina ACL selezionati',

  // Original text: 'Delete ACL{nAcls, plural, one {} other {s}}'
  deleteAclsModalTitle: 'Elimina ACL{nAcls, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nAcls, number} ACL{nAcls, plural, one {} other {s}}?'
  deleteAclsModalMessage: 'Sei sicuro di voler eliminare {nAcls, number} ACL{nAcls, plural, one {} other {s}}?',

  // Original text: 'No plugins found'
  noPlugins: 'Nessun plugin trovato',

  // Original text: 'Auto-load at server start'
  autoloadPlugin: "Caricamento automatico all'avvio del server",

  // Original text: 'Save configuration'
  savePluginConfiguration: 'Salva configurazione',

  // Original text: 'Delete configuration'
  deletePluginConfiguration: 'Elimina configurazione',

  // Original text: 'Plugin error'
  pluginError: 'Errore del plugin',

  // Original text: 'Unknown error'
  unknownPluginError: 'Errore sconosciuto',

  // Original text: 'Purge plugin configuration'
  purgePluginConfiguration: 'Elimina la configurazione del plug-in',

  // Original text: 'Are you sure you want to purge this configuration?'
  purgePluginConfigurationQuestion: 'Sei sicuro di voler eliminare questa configurazione?',

  // Original text: 'Cancel'
  cancelPluginEdition: 'Annulla',

  // Original text: 'Plugin configuration'
  pluginConfigurationSuccess: 'Configurazione del plugin',

  // Original text: 'Plugin configuration successfully saved!'
  pluginConfigurationChanges: 'Configurazione del plugin salvata correttamente!',

  // Original text: 'Predefined configuration'
  pluginConfigurationPresetTitle: 'Configurazione predefinita',

  // Original text: 'Choose a predefined configuration.'
  pluginConfigurationChoosePreset: 'Scegli una configurazione predefinita.',

  // Original text: 'Apply'
  applyPluginPreset: 'Applicare',

  // Original text: 'Save filter error'
  saveNewUserFilterErrorTitle: 'Salva errore filtro',

  // Original text: 'Bad parameter: name must be given.'
  saveNewUserFilterErrorBody: 'Parametro errato: è necessario indicare il nome.',

  // Original text: 'Name:'
  filterName: 'Nome:',

  // Original text: 'Value:'
  filterValue: 'Valore:',

  // Original text: 'Save new filter'
  saveNewFilterTitle: 'Salva nuovo filtro',

  // Original text: 'Remove custom filter'
  removeUserFilterTitle: 'Rimuovi filtro personalizzato',

  // Original text: 'Are you sure you want to remove the custom filter?'
  removeUserFilterBody: 'Sei sicuro di voler rimuovere il filtro personalizzato?',

  // Original text: 'Default filter'
  defaultFilter: 'Filtro predefinito',

  // Original text: 'Default filters'
  defaultFilters: 'Filtri predefiniti',

  // Original text: 'Custom filters'
  customFilters: 'Filtri personalizzati',

  // Original text: 'Customize filters'
  customizeFilters: 'Personalizza i filtri',

  // Original text: 'Start'
  startVmLabel: 'Inizio',

  // Original text: 'Start on…'
  startVmOnLabel: 'Inizia il…',

  // Original text: 'No host selected'
  startVmOnMissingHostTitle: 'Nessun host selezionato',

  // Original text: 'You must select a host'
  startVmOnMissingHostMessage: 'Devi selezionare un host',

  // Original text: 'Recovery start'
  recoveryModeLabel: 'Inizio del recupero',

  // Original text: 'Suspend'
  suspendVmLabel: 'Sospendere',

  // Original text: 'Pause'
  pauseVmLabel: 'Pausa',

  // Original text: 'Stop'
  stopVmLabel: 'Fermare',

  // Original text: 'Force shutdown'
  forceShutdownVmLabel: "Forza l'arresto",

  // Original text: 'Reboot'
  rebootVmLabel: 'Reboot',

  // Original text: 'Force reboot'
  forceRebootVmLabel: 'Forza il riavvio',

  // Original text: 'Delete'
  deleteVmLabel: 'Elimina',

  // Original text: 'Delete selected VMs'
  deleteSelectedVmsLabel: 'Elimina le macchine virtuali selezionate',

  // Original text: 'Migrate'
  migrateVmLabel: 'Migrare',

  // Original text: 'Snapshot'
  snapshotVmLabel: 'Istantaneo',

  // Original text: 'Export'
  exportVmLabel: 'Esportare',

  // Original text: 'Resume'
  resumeVmLabel: 'Curriculum vitae',

  // Original text: 'Copy'
  copyVmLabel: 'copia',

  // Original text: 'Clone'
  cloneVmLabel: 'Clone',

  // Original text: 'Fast clone'
  fastCloneVmLabel: 'Clone veloce',

  // Original text: 'Console'
  vmConsoleLabel: 'Consolle',

  // Original text: 'Backup'
  backupLabel: 'di riserva',

  // Original text: '{n, number} base cop{n, plural, one {y} other {ies}} ({usage})'
  baseCopyTooltip: '{n, number} copi{n, plural, one {a} other {e}} di base ({usage})',

  // Original text: '{name} ({usage})'
  diskTooltip: '{name} ({usage})',

  // Original text: '{n, number} snapshot{n, plural, one {} other {s}} ({usage})'
  snapshotsTooltip: '{n, number} istantane{n, plural, one {a} other {e}} ({usage})',

  // Original text: '{name} ({usage}) on {vmName}'
  vdiOnVmTooltip: '{name} ({usage}) su {vmName}',

  // Original text: '{n, number} VDI{n, plural, one {} other {s}} ({usage})'
  vdisTooltip: '{n, number} VDI{n, plural, one {} other {s}} ({usage})',

  // Original text: 'Depth'
  srUnhealthyVdiDepth: 'Profondità',

  // Original text: 'Name'
  srUnhealthyVdiNameLabel: 'Nome',

  // Original text: 'Size'
  srUnhealthyVdiSize: 'Taglia',

  // Original text: 'VDI to coalesce ({total, number})'
  srUnhealthyVdiTitle: 'VDI da unire ({total, number})',

  // Original text: 'UUID'
  srUnhealthyVdiUuid: 'UUID',

  // Original text: 'No stats'
  srNoStats: 'Nessuna statistica',

  // Original text: 'IOPS'
  statsIops: 'IOPS',

  // Original text: 'IO throughput'
  statsIoThroughput: 'Throughput IO',

  // Original text: 'Latency'
  statsLatency: 'Latenza',

  // Original text: 'IOwait'
  statsIowait: 'IOwait',

  // Original text: 'Rescan all disks'
  srRescan: 'Eseguire nuovamente la scansione di tutti i dischi',

  // Original text: 'Connect to all hosts'
  srReconnectAll: 'Connettiti a tutti gli hosts',

  // Original text: 'Disconnect from all hosts'
  srDisconnectAll: 'Disconnettiti da tutti gli host',

  // Original text: 'Forget this SR'
  srForget: 'Dimentica questo SR',

  // Original text: 'Forget SRs'
  srsForget: 'Dimentica SRs',

  // Original text: 'Remove this SR'
  srRemoveButton: 'Rimuovi questo SR',

  // Original text: 'No VDIs in this storage'
  srNoVdis: 'Nessun VDI in questo deposito',

  // Original text: 'Pool RAM usage:'
  poolTitleRamUsage: 'Utilizzo della RAM del pool:',

  // Original text: '{used} used on {total} ({free} free)'
  poolRamUsage: '{used} usati su {total} ({free} disponibile)',

  // Original text: 'Master:'
  poolMaster: 'Maestro:',

  // Original text: 'Display all hosts of this pool'
  displayAllHosts: 'Visualizza tutti gli hosts di questo pool',

  // Original text: 'Display all storages of this pool'
  displayAllStorages: 'Visualizza tutti gli depositi di questo pool',

  // Original text: 'Display all VMs of this pool'
  displayAllVMs: 'Visualizza tutte le VMs di questo pool',

  // Original text: 'License restrictions'
  licenseRestrictions: 'Limitazioni della licenza',

  // Original text: 'Warning: You are using a Free XenServer license'
  licenseRestrictionsModalTitle: 'Avviso: stai usando una licenza XenServer gratuita',

  // Original text: 'Some functionality is restricted.'
  actionsRestricted: 'Alcune funzionalità sono limitate.',

  // Original text: 'You can:'
  counterRestrictionsOptions: 'Puoi:',

  // Original text: 'upgrade to XCP-ng for free to get rid of these restrictions'
  counterRestrictionsOptionsXcp: 'aggiornare a XCP-ng gratuitamente per sbarazzarsi di queste restrizioni',

  // Original text: 'or get a commercial Citrix license'
  counterRestrictionsOptionsXsLicense: 'o ottenere una licenza Citrix commerciale',

  // Original text: 'Hosts'
  hostsTabName: 'host',

  // Original text: 'VMs'
  vmsTabName: 'VM',

  // Original text: 'SRs'
  srsTabName: 'SRs',

  // Original text: 'Edit all'
  poolEditAll: 'Modifica tutto',

  // Original text: 'High Availability'
  poolHaStatus: 'Alta disponibilità',

  // Original text: 'Enabled'
  poolHaEnabled: 'Abilitato',

  // Original text: 'Disabled'
  poolHaDisabled: 'Disabilitato',

  // Original text: 'GPU groups'
  poolGpuGroups: 'Gruppi GPU',

  // Original text: 'Logging host'
  poolRemoteSyslogPlaceHolder: 'Host di registrazione',

  // Original text: 'Master'
  setpoolMaster: 'Maestro',

  // Original text: 'Remote syslog host'
  syslogRemoteHost: 'Host syslog remoto',

  // Original text: 'Name'
  hostNameLabel: 'Nome',

  // Original text: 'Description'
  hostDescription: 'Descrizione',

  // Original text: 'No hosts'
  noHost: 'Nessun host',

  // Original text: '{used}% used ({free} free)'
  memoryLeftTooltip: '{used}% usati ({free} disponibile)',

  // Original text: 'PIF'
  pif: 'PIF',

  // Original text: 'Automatic'
  poolNetworkAutomatic: 'Automatico',

  // Original text: 'Name'
  poolNetworkNameLabel: 'Nome',

  // Original text: 'Description'
  poolNetworkDescription: 'Descrizione',

  // Original text: 'PIFs'
  poolNetworkPif: 'PIF',

  // Original text: 'Private networks'
  privateNetworks: 'Reti private',

  // Original text: 'Manage'
  manage: 'Gestire',

  // Original text: 'No networks'
  poolNoNetwork: 'Nessuna rete',

  // Original text: 'MTU'
  poolNetworkMTU: 'MTU',

  // Original text: 'Connected'
  poolNetworkPifAttached: 'Collegato',

  // Original text: 'Disconnected'
  poolNetworkPifDetached: 'Disconnected',

  // Original text: 'Show PIFs'
  showPifs: 'Mostra PIFs',

  // Original text: 'Hide PIFs'
  hidePifs: 'Nascondi PIFs',

  // Original text: 'No stats'
  poolNoStats: 'Nessuna statistica',

  // Original text: 'All hosts'
  poolAllHosts: 'Tutti gli host',

  // Original text: 'Add SR'
  addSrLabel: 'Aggiungi SR',

  // Original text: 'Add VM'
  addVmLabel: 'Aggiungi VM',

  // Original text: 'Add hosts'
  addHostsLabel: 'Aggiungi host',

  // Original text: 'The pool needs to install {nMissingPatches, number} patch{nMissingPatches, plural, one {} other {es}}. This operation may take a while.'
  missingPatchesPool:
    'Il pool deve installare {nMissingPatches, number} patch{nMissingPatches, plural, one {} other {es}}. Questa operazione potrebbe richiedere del tempo.',

  // Original text: 'The selected host{nHosts, plural, one {} other {s}} need{nHosts, plural, one {s} other {}} to install {nMissingPatches, number} patch{nMissingPatches, plural, one {} other {es}}. This operation may take a while.'
  missingPatchesHost:
    "{nHosts, plural, one {Li} other {l'}} host{nHosts, plural, one {} other {s}} selezionat{nHosts, plural, one {o} other {i}} {nHosts, plural, one {richiede} other {richiedono}} di installare {nMissingPatches, number} patch{nMissingPatches, plural, one {} other {es}}. Questa operazione potrebbe richiedere del tempo.",

  // Original text: 'The selected host{nHosts, plural, one {} other {s}} cannot be added to the pool because the patches are not homogeneous.'
  patchUpdateNoInstall:
    "{nHosts, plural, one {Li} other {l'}} host{nHosts, plural, one {} other {s}} selezionat{nHosts, plural, one {o} other {i}} non {nHosts, plural, one {può} other {possono}} essere aggiunto al pool perché le patches non sono omogenee.",

  // Original text: 'Adding host{nHosts, plural, one {} other {s}} failed'
  addHostsErrorTitle: 'Aggiunta de{nHosts, plural, one {llo} other {i}} host{nHosts, plural, one {} other {s}} fallito',

  // Original text: 'Host patches could not be homogenized.'
  addHostNotHomogeneousErrorMessage: 'Non è stato possibile omogeneizzare le patch dello host.',

  // Original text: 'Disconnect'
  disconnectServer: 'Disconnect',

  // Original text: 'Start'
  startHostLabel: 'Inizio',

  // Original text: 'Stop'
  stopHostLabel: 'Fermare',

  // Original text: 'Enable'
  enableHostLabel: 'Abilitare',

  // Original text: 'Disable'
  disableHostLabel: 'disattivare',

  // Original text: 'Restart toolstack'
  restartHostAgent: 'Riavvia toolstack',

  // Original text: 'Force reboot'
  forceRebootHostLabel: 'Forza il riavvio',

  // Original text: 'Reboot'
  rebootHostLabel: 'Reboot',

  // Original text: 'Error while restarting host'
  noHostsAvailableErrorTitle: "Errore durante il riavvio dell'host",

  // Original text: 'Some VMs cannot be migrated without first rebooting this host. Please try force reboot.'
  noHostsAvailableErrorMessage:
    'Alcune VM non possono essere migrate senza prima aver riavviato questo host. Prova a forzare il riavvio.',

  // Original text: 'Error while restarting hosts'
  failHostBulkRestartTitle: 'Errore durante il riavvio degli host',

  // Original text: '{failedHosts, number}/{totalHosts, number} host{failedHosts, plural, one {} other {s}} could not be restarted.'
  failHostBulkRestartMessage:
    'Alcune VM non possono essere migrate senza prima aver riavviato questo host. Prova a forzare il riavvio.',

  // Original text: 'Reboot to apply updates'
  rebootUpdateHostLabel: 'Riavvia per applicare gli aggiornamenti',

  // Original text: 'Emergency mode'
  emergencyModeLabel: 'Modalità di emergenza',

  // Original text: 'Storage'
  storageTabName: 'Archivazione',

  // Original text: 'Patches'
  patchesTabName: 'Cerotti',

  // Original text: 'Load average'
  statLoad: 'Carico medio',

  // Original text: 'Edit iSCSI IQN'
  editHostIscsiIqnTitle: 'Modifica iSCSI IQN',

  // Original text: 'Are you sure you want to edit the iSCSI IQN? This may result in failures connecting to existing SRs if the host is attached to iSCSI SRs.'
  editHostIscsiIqnMessage:
    "Ciò può comportare errori nella connessione a SR esistenti se l'host è collegato a SR iSCSI.",

  // Original text: 'Host RAM usage:'
  hostTitleRamUsage: 'Utilizzo della RAM dello host:',

  // Original text: 'RAM: {memoryUsed} used on {memoryTotal} ({memoryFree} free)'
  memoryHostState: 'RAM: {memoryUsed} usata su {memoryTotal} ({memoryFree} disponibile)',

  // Original text: 'Hardware'
  hardwareHostSettingsLabel: 'Hardware',

  // Original text: 'Hyper-threading (SMT)'
  hyperThreading: 'Hyper-threading (SMT)',

  // Original text: 'HT detection is only available on XCP-ng 7.6 and higher'
  hyperThreadingNotAvailable: 'Il rilevamento HT è disponibile solo su XCP-ng 7.6 e versioni successive',

  // Original text: 'Address'
  hostAddress: 'Indirizzo',

  // Original text: 'Status'
  hostStatus: 'Stato',

  // Original text: 'Build number'
  hostBuildNumber: 'Numero di build',

  // Original text: 'iSCSI IQN'
  hostIscsiIqn: 'iSCSI IQN',

  // Original text: 'Not connected to an iSCSI SR'
  hostNoIscsiSr: 'Non collegato a un iSCSI SR',

  // Original text: 'Click to see concerned SRs'
  hostMultipathingSrs: 'Fare clic per visualizzare gli SR interessati',

  // Original text: '{nActives, number} of {nPaths, number} path{nPaths, plural, one {} other {s}}'
  hostMultipathingPaths: '{nActives, number} di {nPaths, number} percors{nPaths, plural, one {o} other {i}}',

  // Original text: 'This action will not be fulfilled if a VM is in a running state. Please ensure that all VMs are evacuated or stopped before performing this action!'
  hostMultipathingRequiredState:
    'Questa azione non verrà eseguita se una VM è in esecuzione. Assicurati che tutte le VMs siano evacuate o arrestate prima di eseguire questa azione!',

  // Original text: 'The host{nHosts, plural, one {} other {s}} will lose their connection to the SRs. Do you want to continue?'
  hostMultipathingWarning:
    "{nHosts, plural, one {Li} other {l'}} host{nHosts, plural, one {} other {s}} {nHosts, plural, one {perderà} other {perderanno}} la connessione agli SR. Vuoi continuare?",

  // Original text: 'Version'
  hostXenServerVersion: 'Versione',

  // Original text: 'Enabled'
  hostStatusEnabled: 'Abilitato',

  // Original text: 'Disabled'
  hostStatusDisabled: 'Disabilitato',

  // Original text: 'Power on mode'
  hostPowerOnMode: 'Modalità di accensione',

  // Original text: 'Host uptime'
  hostStartedSince: "Tempo di attività dell'host",

  // Original text: 'Toolstack uptime'
  hostStackStartedSince: 'Tempo di attività del toolstack',

  // Original text: 'CPU model'
  hostCpusModel: 'Modello di CPU',

  // Original text: 'GPUs'
  hostGpus: 'GPU',

  // Original text: 'Core (socket)'
  hostCpusNumber: 'Core (socket)',

  // Original text: 'Manufacturer info'
  hostManufacturerinfo: 'Informazioni sul produttore',

  // Original text: 'BIOS info'
  hostBiosinfo: 'Informazioni sul BIOS',

  // Original text: 'License'
  licenseHostSettingsLabel: 'Licenza',

  // Original text: 'Type'
  hostLicenseType: 'genere',

  // Original text: 'Socket'
  hostLicenseSocket: 'presa di corrente',

  // Original text: 'Expiry'
  hostLicenseExpiry: 'Scadenza',

  // Original text: 'Remote syslog'
  hostRemoteSyslog: 'Syslog remoto',

  // Original text: 'Installed supplemental packs'
  supplementalPacks: 'Pacchetti supplementari installati',

  // Original text: 'Install new supplemental pack'
  supplementalPackNew: 'Installa nuovo pacchetto supplementare',

  // Original text: 'Install supplemental pack on every host'
  supplementalPackPoolNew: 'Installa pacchetto aggiuntivo su ogni host',

  // Original text: '{name} (by {author})'
  supplementalPackTitle: '{name} (per {author})',

  // Original text: 'Installation started'
  supplementalPackInstallStartedTitle: 'Installazione avviata',

  // Original text: 'Installing new supplemental pack…'
  supplementalPackInstallStartedMessage: 'Installazione del nuovo pacchetto supplementare…',

  // Original text: 'Installation error'
  supplementalPackInstallErrorTitle: 'Errore di installazione',

  // Original text: 'The installation of the supplemental pack failed.'
  supplementalPackInstallErrorMessage: "L'installazione del pacchetto supplementare è fallita.",

  // Original text: 'Installation success'
  supplementalPackInstallSuccessTitle: 'Installazione riuscita',

  // Original text: 'Supplemental pack successfully installed.'
  supplementalPackInstallSuccessMessage: 'Pacchetto supplementare installato correttamente.',

  // Original text: 'The iSCSI IQN must be unique. '
  uniqueHostIscsiIqnInfo: "L'iSCSI IQN deve essere univoco.",

  // Original text: 'Add a network'
  networkCreateButton: 'Aggiungi una rete',

  // Original text: 'Device'
  pifDeviceLabel: 'Dispositivo',

  // Original text: 'Network'
  pifNetworkLabel: 'Rete',

  // Original text: 'VLAN'
  pifVlanLabel: 'VLAN',

  // Original text: 'Address'
  pifAddressLabel: 'Indirizzo',

  // Original text: 'Mode'
  pifModeLabel: 'Modalità',

  // Original text: 'MAC'
  pifMacLabel: 'MAC',

  // Original text: 'MTU'
  pifMtuLabel: 'MTU',

  // Original text: 'Speed'
  pifSpeedLabel: 'Velocità',

  // Original text: 'Status'
  pifStatusLabel: 'Stato',

  // Original text: 'This interface is currently in use'
  pifInUse: 'Questa interfaccia è attualmente in uso',

  // Original text: 'Default locking mode'
  defaultLockingMode: 'Modalità di blocco predefinita',

  // Original text: 'Configure IP address'
  pifConfigureIp: "Configura l'indirizzo IP",

  // Original text: 'Invalid parameters'
  configIpErrorTitle: 'Parametri non validi',

  // Original text: 'IP address and netmask required'
  configIpErrorMessage: 'Indirizzo IP e maschera di rete richiesti',

  // Original text: 'Static IP address'
  staticIp: 'Indirizzo IP statico',

  // Original text: 'Netmask'
  netmask: 'maschera di rete',

  // Original text: 'DNS'
  dns: 'DNS',

  // Original text: 'Gateway'
  gateway: 'porta',

  // Original text: 'Add a storage'
  addSrDeviceButton: 'Aggiungi un deposito',

  // Original text: 'Type'
  srType: 'genere',

  // Original text: 'PBD details'
  pbdDetails: 'Dettagli PBD',

  // Original text: 'Status'
  pbdStatus: 'Stato',

  // Original text: 'Connected'
  pbdStatusConnected: 'Collegato',

  // Original text: 'Disconnected'
  pbdStatusDisconnected: 'Disconnected',

  // Original text: 'Connect'
  pbdConnect: 'Collegare',

  // Original text: 'Disconnect'
  pbdDisconnect: 'Disconnect',

  // Original text: 'Forget'
  pbdForget: 'Dimenticare',

  // Original text: 'Shared'
  srShared: 'Condivisa',

  // Original text: 'Not shared'
  srNotShared: 'Non condiviso',

  // Original text: 'No storage detected'
  pbdNoSr: 'Nessuno deposito rilevato',

  // Original text: 'Name'
  patchNameLabel: 'Nome',

  // Original text: 'Install all patches'
  patchUpdateButton: 'Installa tutte le patch',

  // Original text: 'Description'
  patchDescription: 'Descrizione',

  // Original text: 'Version'
  patchVersion: 'Versione',

  // Original text: 'Applied date'
  patchApplied: 'Data applicata',

  // Original text: 'Size'
  patchSize: 'Taglia',

  // Original text: 'No patches detected'
  patchNothing: 'Nessuna patch rilevata',

  // Original text: 'Release date'
  patchReleaseDate: 'Data di rilascio',

  // Original text: 'Guidance'
  patchGuidance: 'Guida',

  // Original text: 'Applied patches'
  hostAppliedPatches: 'Patches applicati',

  // Original text: 'Missing patches'
  hostMissingPatches: 'Patch mancanti',

  // Original text: 'Host up-to-date!'
  hostUpToDate: 'Host aggiornato!',

  // Original text: 'Install all patches'
  installAllPatchesTitle: 'Installa tutte le patch',

  // Original text: 'To install all patches go to pool.'
  installAllPatchesContent: 'Per installare tutte le patch vai al pool.',

  // Original text: 'Go to pool'
  installAllPatchesRedirect: 'Vai in piscina',

  // Original text: 'Are you sure you want to install all patches on this host?'
  installAllPatchesOnHostContent: 'Sei sicuro di voler installare tutte le patch su questo host?',

  // Original text: 'Release'
  patchRelease: 'pubblicazione',

  // Original text: 'An error occurred while fetching the patches. Please make sure the updater plugin is installed by running `yum install xcp-ng-updater` on the host.'
  updatePluginNotInstalled:
    "Assicurati che il plugin di aggiornamento sia installato eseguendo `yum install xcp-ng-updater` sull'host.",

  // Original text: 'Show changelog'
  showChangelog: 'Mostra il log delle modifiche',

  // Original text: 'Changelog'
  changelog: 'changelog',

  // Original text: 'Patch'
  changelogPatch: 'toppa',

  // Original text: 'Author'
  changelogAuthor: 'Autore',

  // Original text: 'Date'
  changelogDate: 'Data',

  // Original text: 'Description'
  changelogDescription: 'Descrizione',

  // Original text: 'Install'
  install: 'Installare',

  // Original text: 'Install patch{nPatches, plural, one {} other {es}}'
  installPatchesTitle: 'Installa patch{nPatches, plural, one {} other {es}}',

  // Original text: 'Are you sure you want to install {nPatches, number} patch{nPatches, plural, one {} other {es}}?'
  installPatchesContent:
    'Sei sicuro di voler installare {nPatches, number} patch{nPatches, plural, one {} other {es}}?',

  // Original text: 'Install pool patches'
  installPoolPatches: 'Installa patches di pool',

  // Original text: 'Are you sure you want to install all the patches on this pool?'
  confirmPoolPatch: 'Sei sicuro di voler installare tutte le patches su questo pool?',

  // Original text: 'The pool needs a default SR to install the patches.'
  poolNeedsDefaultSr: 'Il pool ha bisogno di un SR predefinito per installare le patches.',

  // Original text: '{nVms, number} VM{nVms, plural, one {} other {s}} {nVms, plural, one {has} other {have}} CDs'
  vmsHaveCds: '{nVms, number} VM{nVms, plural, one {} other {s}} {nVms, plural, one {ha} other {hanno}} CDs',

  // Original text: 'Eject CDs'
  ejectCds: 'Espellere i CD',

  // Original text: 'Default SR'
  defaultSr: 'SR predefinito',

  // Original text: 'Set as default SR'
  setAsDefaultSr: 'Imposta come SR predefinito',

  // Original text: 'Set default SR:'
  setDefaultSr: 'Imposta SR predefinito:',

  // Original text: 'General'
  generalTabName: 'Generale',

  // Original text: 'Stats'
  statsTabName: 'Statistiche',

  // Original text: 'Console'
  consoleTabName: 'Consolle',

  // Original text: 'Container'
  containersTabName: 'Contenitore',

  // Original text: 'Snapshots'
  snapshotsTabName: 'Istantanei',

  // Original text: 'Logs'
  logsTabName: 'Logs',

  // Original text: 'Advanced'
  advancedTabName: 'Avanzati',

  // Original text: 'Network'
  networkTabName: 'Rete',

  // Original text: 'Disk{disks, plural, one {} other {s}}'
  disksTabName: 'Disc{disks, plural, one {o} other {hi}}',

  // Original text: 'Halted'
  powerStateHalted: 'Halted',

  // Original text: 'Running'
  powerStateRunning: 'In esecuzione',

  // Original text: 'Suspended'
  powerStateSuspended: 'Sospeso',

  // Original text: 'Paused'
  powerStatePaused: 'In pausa',

  // Original text: 'Disabled'
  powerStateDisabled: 'Disabilitato',

  // Original text: 'Busy'
  powerStateBusy: 'Occupato',

  // Original text: 'Current status:'
  vmCurrentStatus: 'Stato attuale:',

  // Original text: 'Not running'
  vmNotRunning: 'Non correndo',

  // Original text: 'Halted {ago}'
  vmHaltedSince: 'Arrestato {ago}',

  // Original text: 'No Xen tools detected'
  noToolsDetected: 'Non sono stati rilevati strumenti Xen',

  // Original text: 'No IPv4 record'
  noIpv4Record: 'Nessun record IPv4',

  // Original text: 'No IP record'
  noIpRecord: 'Nessun record IP',

  // Original text: 'Started {ago}'
  started: 'Iniziato {ago}',

  // Original text: 'Created on {date}'
  created: 'Creato il {date}',

  // Original text: 'Paravirtualization (PV)'
  paraVirtualizedMode: 'Paravirtualizzazione (PV)',

  // Original text: 'Hardware virtualization (HVM)'
  hardwareVirtualizedMode: 'Virtualizzazione hardware (HVM)',

  // Original text: 'Hardware virtualization with paravirtualization drivers enabled (PVHVM)'
  hvmModeWithPvDriversEnabled: 'Virtualizzazione hardware con driver di paravirtualizzazione abilitati (PVHVM)',

  // Original text: 'Windows Update tools'
  windowsUpdateTools: 'Strumenti di Windows Update',

  // Original text: 'CPU usage'
  statsCpu: 'Uso della CPU',

  // Original text: 'Memory usage'
  statsMemory: 'Utilizzo della memoria',

  // Original text: 'Network throughput'
  statsNetwork: 'Throughput di rete',

  // Original text: 'Stacked values'
  useStackedValuesOnStats: 'Valori sovrapposti',

  // Original text: 'Disk throughput'
  statDisk: 'Throughput del disco',

  // Original text: 'Last 10 minutes'
  statLastTenMinutes: 'Ultimi 10 minuti',

  // Original text: 'Last 2 hours'
  statLastTwoHours: 'Ultime 2 ore',

  // Original text: 'Last day'
  statLastDay: 'Ultimo giorno',

  // Original text: 'Last week'
  statLastWeek: 'La settimana scorsa',

  // Original text: 'Last year'
  statLastYear: "L'anno scorso",

  // Original text: 'Copy'
  copyToClipboardLabel: 'copia',

  // Original text: 'Ctrl+Alt+Del'
  ctrlAltDelButtonLabel: 'Ctrl',

  // Original text: 'Send Ctrl+Alt+Del to VM?'
  ctrlAltDelConfirmation: 'Invia Ctrl+Alt+Canc alla VM?',

  // Original text: 'Multiline copy'
  multilineCopyToClipboard: 'Copia multilinea',

  // Original text: 'Tip:'
  tipLabel: 'Mancia:',

  // Original text: 'Hide info'
  hideHeaderTooltip: 'Nascondi informazioni',

  // Original text: 'Show info'
  showHeaderTooltip: 'Mostra informazioni',

  // Original text: 'Send to clipboard'
  sendToClipboard: 'Invia negli Appunti',

  // Original text: 'Connect using external SSH tool as root'
  sshRootTooltip: 'Connettiti usando lo strumento SSH esterno come root',

  // Original text: 'SSH'
  sshRootLabel: 'SSH',

  // Original text: 'Connect using external SSH tool as user…'
  sshUserTooltip: 'Connetti usando lo strumento SSH esterno come utente…',

  // Original text: 'SSH as…'
  sshUserLabel: 'SSH come…',

  // Original text: 'SSH user name'
  sshUsernameLabel: 'Nome utente SSH',

  // Original text: 'No IP address reported by client tools'
  remoteNeedClientTools: 'Nessun indirizzo IP segnalato dagli strumenti client',

  // Original text: 'Name'
  containerName: 'Nome',

  // Original text: 'Command'
  containerCommand: 'Comando',

  // Original text: 'Creation date'
  containerCreated: 'Data di creazione',

  // Original text: 'Status'
  containerStatus: 'Stato',

  // Original text: 'Action'
  containerAction: 'Azione',

  // Original text: 'No existing containers'
  noContainers: 'Nessun contenitore esistente',

  // Original text: 'Stop this container'
  containerStop: 'Ferma questo contenitore',

  // Original text: 'Start this container'
  containerStart: 'Avvia questo contenitore',

  // Original text: 'Pause this container'
  containerPause: 'Metti in pausa questo contenitore',

  // Original text: 'Resume this container'
  containerResume: 'Riprendi questo contenitore',

  // Original text: 'Restart this container'
  containerRestart: 'Riavvia questo contenitore',

  // Original text: 'New disk'
  vbdCreateDeviceButton: 'Nuovo disco',

  // Original text: 'Attach disk'
  vdiAttachDevice: 'Collegare il disco',

  // Original text: 'The selected VDI is already attached to this VM. Are you sure you want to continue?'
  vdiAttachDeviceConfirm: 'Sei sicuro di voler continuare?',

  // Original text: 'Boot order'
  vdiBootOrder: 'Ordine di avvio',

  // Original text: 'Name'
  vdiNameLabel: 'Nome',

  // Original text: 'Description'
  vdiNameDescription: 'Descrizione',

  // Original text: 'Pool'
  vdiPool: 'Piscina',

  // Original text: 'Tags'
  vdiTags: 'tag',

  // Original text: 'Size'
  vdiSize: 'Taglia',

  // Original text: 'SR'
  vdiSr: 'SR',

  // Original text: 'VMs'
  vdiVms: 'VM',

  // Original text: 'Migrate VDI'
  vdiMigrate: 'Migrare VDI',

  // Original text: 'Destination SR:'
  vdiMigrateSelectSr: 'Destinazione SR:',

  // Original text: 'No SR'
  vdiMigrateNoSr: 'No SR',

  // Original text: 'A target SR is required to migrate a VDI'
  vdiMigrateNoSrMessage: 'Per la migrazione di un VDI è necessario un SR di destinazione',

  // Original text: 'Forget'
  vdiForget: 'Dimenticare',

  // Original text: 'Remove VDI'
  vdiRemove: 'Rimuovi VDI',

  // Original text: 'No VDIs attached to control domain'
  noControlDomainVdis: 'Nessun VDI collegato al dominio di controllo',

  // Original text: 'Boot flag'
  vbdBootableStatus: 'Flag di avvio',

  // Original text: 'Device'
  vbdDevice: 'Dispositivo',

  // Original text: 'Status'
  vbdStatus: 'Stato',

  // Original text: 'Connected'
  vbdStatusConnected: 'Collegato',

  // Original text: 'Disconnected'
  vbdStatusDisconnected: 'Disconnected',

  // Original text: 'Connect VBD'
  vbdConnect: 'Connetti VBD',

  // Original text: 'Disconnect VBD'
  vbdDisconnect: 'Disconnetti VBD',

  // Original text: 'Bootable'
  vbdBootable: 'avviabile',

  // Original text: 'Readonly'
  vbdReadonly: 'Sola lettura',

  // Original text: 'Create'
  vbdCreate: 'Creare',

  // Original text: 'Attach'
  vbdAttach: 'allegare',

  // Original text: 'Disk name'
  vbdNamePlaceHolder: 'Nome del disco',

  // Original text: 'Size'
  vbdSizePlaceHolder: 'Taglia',

  // Original text: 'CD drive not completely installed'
  cdDriveNotInstalled: 'Unità CD non completamente installata',

  // Original text: 'Stop and start the VM to install the CD drive'
  cdDriveInstallation: "Arrestare e avviare la VM per installare l'unità CD",

  // Original text: 'Save'
  saveBootOption: 'Salva',

  // Original text: 'Reset'
  resetBootOption: 'Ripristina',

  // Original text: 'Destroy selected VDIs'
  destroySelectedVdis: 'Distruggi i VDIs selezionati',

  // Original text: 'Destroy VDI'
  destroyVdi: 'Distruggi il VDI',

  // Original text: 'Export VDI content'
  exportVdi: 'Esporta contenuto VDI',

  // Original text: 'Import VDI content'
  importVdi: 'Importa contenuto VDI',

  // Original text: 'No file selected'
  importVdiNoFile: 'Nessun file selezionato',

  // Original text: 'Drop VHD file here'
  selectVdiMessage: 'Trascina qui il file VHD',

  // Original text: 'Creating this disk will use the disk space quota from the resource set {resourceSet} ({spaceLeft} left)'
  useQuotaWarning:
    'La creazione di questo disco utilizzerà la quota di spazio su disco dal set di risorse {resourceSet} ({spaceLeft} rimanente)',

  // Original text: 'Not enough space in resource set {resourceSet} ({spaceLeft} left)'
  notEnoughSpaceInResourceSet: 'Spazio insufficiente nel set di risorse {resourceSet} ({spaceLeft} rimanente)',

  // Original text: "The VDIs' SRs must either be shared or on the same host for the VM to be able to start."
  warningVdiSr:
    "Gli SR dei VDI devono essere condivisi o sullo stesso host per consentire l'avvio della macchina virtuale.",

  // Original text: 'New device'
  vifCreateDeviceButton: 'Nuovo dispositivo',

  // Original text: 'Device'
  vifDeviceLabel: 'Dispositivo',

  // Original text: 'MAC address'
  vifMacLabel: 'Indirizzo MAC',

  // Original text: 'MTU'
  vifMtuLabel: 'MTU',

  // Original text: 'Network'
  vifNetworkLabel: 'Rete',

  // Original text: 'Rate limit (kB/s)'
  vifRateLimitLabel: 'Limite di velocità (kB/s)',

  // Original text: 'Status'
  vifStatusLabel: 'Stato',

  // Original text: 'Connected'
  vifStatusConnected: 'Collegato',

  // Original text: 'Disconnected'
  vifStatusDisconnected: 'Disconnected',

  // Original text: 'Connect'
  vifConnect: 'Collegare',

  // Original text: 'Disconnect'
  vifDisconnect: 'Disconnect',

  // Original text: 'Remove'
  vifRemove: 'Rimuovere',

  // Original text: 'Remove selected VIFs'
  vifsRemove: 'Rimuovi i VIFs selezionati',

  // Original text: 'IP addresses'
  vifIpAddresses: 'Indirizzi IP',

  // Original text: 'Auto-generated if empty'
  vifMacAutoGenerate: 'Generato automaticamente se vuoto',

  // Original text: 'Allowed IPs'
  vifAllowedIps: 'IP consentiti',

  // Original text: 'No IPs'
  vifNoIps: 'Nessun IP',

  // Original text: 'Network locked'
  vifLockedNetwork: 'Rete bloccata',

  // Original text: 'Network locked and no IPs are allowed for this interface'
  vifLockedNetworkNoIps: 'Rete bloccata e nessun IP consentito per questa interfaccia',

  // Original text: 'Network not locked'
  vifUnLockedNetwork: 'Rete non bloccata',

  // Original text: 'Unknown network'
  vifUnknownNetwork: 'Rete sconosciuta',

  // Original text: 'Create'
  vifCreate: 'Creare',

  // Original text: 'No snapshots'
  noSnapshots: 'Nessuna istantanea',

  // Original text: 'New snapshot with memory'
  newSnapshotWithMemory: 'Nuova istantanea con memoria',

  // Original text: 'Memory saved'
  snapshotMemorySaved: 'Memoria salvata',

  // Original text: 'New snapshot'
  snapshotCreateButton: 'Nuova istantanea',

  // Original text: 'Just click on the snapshot button to create one!'
  tipCreateSnapshotLabel: 'Basta fare clic sul pulsante Istantanea per crearne uno!',

  // Original text: 'Revert VM to this snapshot'
  revertSnapshot: 'Ripristina VM in questa istantanea',

  // Original text: 'Remove this snapshot'
  deleteSnapshot: 'Rimuovi questa istantanea',

  // Original text: 'Remove selected snapshots'
  deleteSnapshots: 'Rimuovi le istantanee selezionate',

  // Original text: 'Create a VM from this snapshot'
  copySnapshot: 'Crea una VM da questa istantanea',

  // Original text: 'Export this snapshot'
  exportSnapshot: 'Esporta questa istantanea',

  // Original text: 'Creation date'
  snapshotDate: 'Data di creazione',

  // Original text: 'Name'
  snapshotName: 'Nome',

  // Original text: 'Description'
  snapshotDescription: 'Descrizione',

  // Original text: 'Quiesced snapshot'
  snapshotQuiesce: 'Istantanea sospesa',

  // Original text: 'Revert successful'
  vmRevertSuccessfulTitle: 'Ripristino riuscito',

  // Original text: 'VM successfully reverted'
  vmRevertSuccessfulMessage: 'VM ripristinata correttamente',

  // Original text: 'Go to the backup page.'
  goToBackupPage: 'Vai alla pagina di backup.',

  // Original text: 'This VM may be backed up by the legacy backup system. See legacy jobs.'
  vmInLegacyBackup: 'Vedi i lavori legacy.',

  // Original text: 'Remove all logs'
  logRemoveAll: 'Rimuovi tutti i registri',

  // Original text: 'No logs so far'
  noLogs: 'Nessun registro finora',

  // Original text: 'Creation date'
  logDate: 'Data di creazione',

  // Original text: 'Name'
  logName: 'Nome',

  // Original text: 'Content'
  logContent: 'Soddisfare',

  // Original text: 'Action'
  logAction: 'Azione',

  // Original text: 'Remove'
  vmRemoveButton: 'Rimuovere',

  // Original text: 'Convert to template'
  vmConvertToTemplateButton: 'Converti in modello',

  // Original text: 'Convert to {mode}'
  vmSwitchVirtualizationMode: 'Converti in {mode}',

  // Original text: 'Change virtualization mode'
  vmVirtualizationModeModalTitle: 'Cambia modalità di virtualizzazione',

  // Original text: "You must know what you are doing, because it could break your setup (if you didn't install the bootloader in the MBR while switching from PV to HVM, or even worse, in HVM to PV, if you don't have the correct PV args)"
  vmVirtualizationModeModalBody:
    "Devi sapere cosa stai facendo, perché potrebbe interrompere la configurazione (se non hai installato il bootloader nell'MBR mentre passavi da PV a HVM, o, peggio ancora, da HVM a PV, se non disponi del corretto",

  // Original text: 'Share'
  vmShareButton: 'Condividere',

  // Original text: 'Xen settings'
  xenSettingsLabel: 'Impostazioni Xen',

  // Original text: 'Guest OS'
  guestOsLabel: 'Sistema operativo guest',

  // Original text: 'Misc'
  miscLabel: 'Varie',

  // Original text: 'Virtualization mode'
  virtualizationMode: 'Modalità di virtualizzazione',

  // Original text: 'Start delay (seconds)'
  startDelayLabel: 'Partenza ritardata (secondi)',

  // Original text: 'CPU mask'
  cpuMaskLabel: 'Maschera CPU',

  // Original text: 'Select core(s)…'
  selectCpuMask: 'Seleziona cuore(i)…',

  // Original text: 'CPU weight'
  cpuWeightLabel: 'Peso della CPU',

  // Original text: 'Default ({value, number})'
  defaultCpuWeight: 'Predefinito ({value, number})',

  // Original text: 'CPU cap'
  cpuCapLabel: 'CPU cap',

  // Original text: 'Default ({value, number})'
  defaultCpuCap: 'Predefinito ({value, number})',

  // Original text: 'PV args'
  pvArgsLabel: 'Args PV',

  // Original text: 'Xen tools version'
  xenToolsStatus: 'Versione degli strumenti Xen',

  // Original text: 'Not installed'
  xenToolsNotInstalled: 'Non installato',

  // Original text: 'OS name'
  osName: 'Nome del sistema operativo',

  // Original text: 'OS kernel'
  osKernel: 'Kernel del sistema operativo',

  // Original text: 'Auto power on'
  autoPowerOn: 'Accensione automatica',

  // Original text: 'HA'
  ha: 'HA',

  // Original text: 'Nested virtualization'
  nestedVirt: 'Virtualizzazione nidificata',

  // Original text: 'Affinity host'
  vmAffinityHost: 'Affinità host',

  // Original text: 'VGA'
  vmVga: 'VGA',

  // Original text: 'Video RAM'
  vmVideoram: 'Memoria video',

  // Original text: 'NIC type'
  vmNicType: 'Tipo di scheda di rete',

  // Original text: 'None'
  noAffinityHost: 'Nessuna',

  // Original text: 'Original template'
  originalTemplate: 'Modello originale',

  // Original text: 'Unknown'
  unknownOsName: 'Sconosciuto',

  // Original text: 'Unknown'
  unknownOsKernel: 'Sconosciuto',

  // Original text: 'Unknown'
  unknownOriginalTemplate: 'Sconosciuto',

  // Original text: 'VM limits'
  vmLimitsLabel: 'Limiti VM',

  // Original text: 'Resource set'
  resourceSet: 'Set di risorse',

  // Original text: 'None'
  resourceSetNone: 'Nessuna',

  // Original text: 'CPU limits'
  vmCpuLimitsLabel: 'Limiti della CPU',

  // Original text: 'Topology'
  vmCpuTopology: 'Topologia',

  // Original text: 'Default behavior'
  vmChooseCoresPerSocket: 'Comportamento predefinito',

  // Original text: '{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket'
  vmSocketsWithCoresPerSocket:
    '{nSockets, number} socket{nSockets, plural, one {} other {s}} con {nCores, number} cuor{nCores, plural, one {e} other {i}} per socket',

  // Original text: 'None'
  vmCoresPerSocketNone: 'Nessuna',

  // Original text: '{nCores, number} core{nCores, plural, one {} other {s}} per socket'
  vmCoresPerSocket: '{nCores, number} cuor{nCores, plural, one {e} other {i}} per socket',

  // Original text: "Not a divisor of the VM's max CPUs"
  vmCoresPerSocketNotDivisor: 'Non è un divisore delle CPUs massime della VM',

  // Original text: 'The selected value exceeds the cores limit ({maxCores, number})'
  vmCoresPerSocketExceedsCoresLimit: 'Il valore selezionato supera il limite dei cuori ({maxCores, number})',

  // Original text: 'The selected value exceeds the sockets limit ({maxSockets, number})'
  vmCoresPerSocketExceedsSocketsLimit: 'Il valore selezionato supera il limite dei sockets ({maxSocket, number})',

  // Original text: 'Disabled'
  vmHaDisabled: 'Disabilitato',

  // Original text: 'Memory limits (min/max)'
  vmMemoryLimitsLabel: 'Limiti di memoria (minimo/massimo)',

  // Original text: 'vGPU'
  vmVgpu: 'vGPU',

  // Original text: 'GPUs'
  vmVgpus: 'GPU',

  // Original text: 'None'
  vmVgpuNone: 'Nessuna',

  // Original text: 'Add vGPU'
  vmAddVgpu: 'Aggiungi vGPU',

  // Original text: 'Select vGPU type'
  vmSelectVgpuType: 'Seleziona il tipo di vGPU',

  // Original text: 'ACLs'
  vmAcls: 'ACL',

  // Original text: 'Add ACLs'
  vmAddAcls: 'Aggiungi ACLs',

  // Original text: 'Failed to add ACL(s)'
  addAclsErrorTitle: 'Impossibile aggiungere ACL(s)',

  // Original text: 'User(s)/group(s) and role are required.'
  addAclsErrorMessage: 'Utente(i)/gruppo(i) e ruolo sono richiesti.',

  // Original text: 'Delete'
  removeAcl: 'Elimina',

  // Original text: '{nAcls, number} more…'
  moreAcls: '{nAcls, number} di più',

  // Original text: 'Boot firmware'
  vmBootFirmware: 'Firmware di avvio',

  // Original text: 'default (bios)'
  vmDefaultBootFirmwareLabel: 'predefinitio (bios)',

  // Original text: "You're about to change your boot firmware. This is still experimental in CH/XCP-ng 8.0. Are you sure you want to continue?"
  vmBootFirmwareWarningMessage:
    'Stai per cambiare il firmware di avvio. Questo è ancora sperimentale in CH/XCP-ng 8.0. Sei sicuro di voler continuare?',

  // Original text: 'Long click to add a name'
  vmHomeNamePlaceholder: 'Fai clic lungo per aggiungere un nome',

  // Original text: 'Long click to add a description'
  vmHomeDescriptionPlaceholder: 'Fai clic lungo per aggiungere una descrizione',

  // Original text: 'Click to add a name'
  templateHomeNamePlaceholder: 'Fai clic per aggiungere un nome',

  // Original text: 'Click to add a description'
  templateHomeDescriptionPlaceholder: 'Fai clic per aggiungere una descrizione',

  // Original text: 'Delete template'
  templateDelete: 'Elimina modello',

  // Original text: 'Delete VM template{templates, plural, one {} other {s}}'
  templateDeleteModalTitle: 'Elimina modell{templates, plural, one {o} other {i}} di VM ',

  // Original text: 'Are you sure you want to delete {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?'
  templateDeleteModalBody:
    'Sei sicuro di voler eliminare {templates, plural, one {questo} other {questi}} modell{templates, plural, one {o} other {i}}?',

  // Original text: 'Delete template{nTemplates, plural, one {} other {s}} failed'
  failedToDeleteTemplatesTitle:
    'Eliminazione {nTemplates, plural, one {del} other {dei}} modell{nTemplates, plural, one {o} other {i}} non riuscita',

  // Original text: 'Failed to delete {nTemplates, number} template{nTemplates, plural, one {} other {s}}.'
  failedToDeleteTemplatesMessage:
    'Impossibile eliminare {nTemplates, number} modell{nTemplates, plural, one {o} other {i}}.',

  // Original text: 'Delete default template{nDefaultTemplates, plural, one {} other {s}}'
  deleteDefaultTemplatesTitle:
    'Elimina modell{nDefaultTemplates, plural, one {o} other {i}} predefinit{nDefaultTemplates, plural, one {o} other {i}}',

  // Original text: 'You are attempting to delete {nDefaultTemplates, number} default template{nDefaultTemplates, plural, one {} other {s}}. Do you want to continue?'
  deleteDefaultTemplatesMessage:
    'Stai tentando di eliminare {nDefaultTemplates, number} modell{nDefaultTemplates, plural, one {o} other {i}} predefinit{nDefaultTemplates, plural, one {o} other {i}}. Vuoi continuare?',

  // Original text: 'Pool{pools, plural, one {} other {s}}'
  poolPanel: 'Pool{pools, plural, one {} other {s}}',

  // Original text: 'Host{hosts, plural, one {} other {s}}'
  hostPanel: 'Host{hosts, plural, one {} other {s}}',

  // Original text: 'VM{vms, plural, one {} other {s}}'
  vmPanel: 'VM{vms, plural, one {} other {s}}',

  // Original text: 'RAM Usage:'
  memoryStatePanel: 'Utilizzo RAM:',

  // Original text: 'Used Memory'
  usedMemory: 'Memoria usata',

  // Original text: 'Total Memory'
  totalMemory: 'Memoria totale',

  // Original text: 'CPUs Total'
  totalCpus: 'CPUs totale',

  // Original text: 'Used vCPUs'
  usedVCpus: 'vCPUs usate',

  // Original text: 'Used Space'
  usedSpace: 'Spazio utilizzato',

  // Original text: 'Total Space'
  totalSpace: 'Spazio totale',

  // Original text: 'CPUs Usage'
  cpuStatePanel: 'Utilizzo CPU',

  // Original text: 'VMs Power state'
  vmStatePanel: 'Stato di alimentazione VMs',

  // Original text: 'Halted'
  vmStateHalted: 'Arrestato',

  // Original text: 'Other'
  vmStateOther: 'Altro',

  // Original text: 'Running'
  vmStateRunning: 'In esecuzione',

  // Original text: 'All'
  vmStateAll: 'Tutti',

  // Original text: 'Pending tasks'
  taskStatePanel: 'Compiti in sospeso',

  // Original text: 'Users'
  usersStatePanel: 'Utenti',

  // Original text: 'Storage state'
  srStatePanel: 'Stato di archiviazione',

  // Original text: '{usage} (of {total})'
  ofUsage: '{usage} (di {total})',

  // Original text: '{nVcpus, number} vCPU{nVcpus, plural, one {} other {s}} (of {nCpus, number} CPU{nCpus, plural, one {} other {s}})'
  ofCpusUsage:
    '{nVcpus, number} vCPU{nVcpus, plural, one {} other {s}} (su {nCpus, number} CPU{nCpus, plural, one {} other {s}})',

  // Original text: 'No storage'
  noSrs: 'Nessuno deposito',

  // Original text: 'Name'
  srName: 'Nome',

  // Original text: 'Pool'
  srPool: 'Pool',

  // Original text: 'Host'
  srHost: 'Host',

  // Original text: 'Type'
  srFormat: 'Tipo',

  // Original text: 'Size'
  srSize: 'Dimensione',

  // Original text: 'Usage'
  srUsage: 'uso',

  // Original text: 'used'
  srUsed: 'usato',

  // Original text: 'free'
  srFree: 'gratuito',

  // Original text: 'Storage Usage'
  srUsageStatePanel: 'Utilizzo dello deposito',

  // Original text: 'Top 5 SR Usage (in %)'
  srTopUsageStatePanel: 'Primi 5 utilizzi SR (in %)',

  // Original text: 'Not enough permissions!'
  notEnoughPermissionsError: 'Autorizzazioni insufficienti!',

  // Original text: '{running, number} running ({halted, number} halted)'
  vmsStates: '{running, in } in esecuzione ({halted, number} arrestat{halted, plural, one {o} other {i}})',

  // Original text: 'Clear selection'
  dashboardStatsButtonRemoveAll: 'Cancella selezione',

  // Original text: 'Add all hosts'
  dashboardStatsButtonAddAllHost: 'Aggiungi tutti gli hosts',

  // Original text: 'Add all VMs'
  dashboardStatsButtonAddAllVM: 'Aggiungi tutte le VMs',

  // Original text: 'Send report'
  dashboardSendReport: 'Spedisci il rapporto',

  // Original text: 'Report'
  dashboardReport: 'Rapporto',

  // Original text: 'This will send a usage report to your configured emails.'
  dashboardSendReportMessage: 'Questo invierà un rapporto di utilizzo alle e-mail configurate.',

  // Original text: 'The usage report and transport email plugins need to be loaded!'
  dashboardSendReportInfo: "È necessario caricare il rapporto sull'utilizzo e i plug-in e-mail di trasporto!",

  // Original text: '{value} {date, date, medium}'
  weekHeatmapData: '{value} {date, date, medium}',

  // Original text: 'No data.'
  weekHeatmapNoData: 'Nessun dato.',

  // Original text: 'Weekly Heatmap'
  weeklyHeatmap: 'Heatmap settimanale',

  // Original text: 'Weekly Charts'
  weeklyCharts: 'Grafici settimanali',

  // Original text: 'Synchronize scale:'
  weeklyChartsScaleInfo: 'Sincronizza scala:',

  // Original text: 'Stats error'
  statsDashboardGenericErrorTitle: 'Errore statistico',

  // Original text: 'There is no stats available for:'
  statsDashboardGenericErrorMessage: 'Non ci sono statistiche disponibili per:',

  // Original text: 'No selected metric'
  noSelectedMetric: 'Nessuna metrica selezionata',

  // Original text: 'Select'
  statsDashboardSelectObjects: 'Selezionare',

  // Original text: 'Loading…'
  metricsLoading: 'Caricamento in corso…',

  // Original text: 'Orphaned snapshot VDIs'
  orphanedVdis: 'VDI di snapshot orfani',

  // Original text: 'Orphaned VMs snapshot'
  orphanedVms: 'Snapshot di VMs orfane',

  // Original text: 'No orphans'
  noOrphanedObject: 'Nessun orfano',

  // Original text: 'Delete orphaned snapshot VDI'
  deleteOrphanedVdi: 'Elimina VDI snapshot orfano',

  // Original text: 'Delete selected orphaned snapshot VDIs'
  deleteSelectedOrphanedVdis: 'Elimina i VDI di snapshot orfani selezionati',

  // Original text: 'VDIs attached to Control Domain'
  vdisOnControlDomain: 'VDI collegati al dominio di controllo',

  // Original text: 'Name'
  vmNameLabel: 'Nome',

  // Original text: 'Description'
  vmNameDescription: 'Descrizione',

  // Original text: 'Resident on'
  vmContainer: 'Residente su',

  // Original text: 'VM snapshots related to non-existent backups'
  vmSnapshotsRelatedToNonExistentBackups: 'Snapshot VM relativi a backup inesistenti',

  // Original text: 'Snapshot of'
  snapshotOf: 'Istantanea di',

  // Original text: 'Legacy backups snapshots'
  legacySnapshots: 'Istantanee dei backup legacy',

  // Original text: 'Alarms'
  alarmMessage: 'Allarmi',

  // Original text: 'No alarms'
  noAlarms: 'Nessun allarme',

  // Original text: 'Date'
  alarmDate: 'Data',

  // Original text: 'Content'
  alarmContent: 'Contenuto',

  // Original text: 'Issue on'
  alarmObject: 'Problema su',

  // Original text: 'Pool'
  alarmPool: 'Pool',

  // Original text: '{used}% used ({free} left)'
  spaceLeftTooltip: '{used}% usati ({free} disponibile)',

  // Original text: 'Create VM'
  createVmModalTitle: 'Crea VM',

  // Original text: "You're about to use a large amount of resources available on the resource set. Are you sure you want to continue?"
  createVmModalWarningMessage:
    'Stai per utilizzare una grande quantità di risorse disponibili sul set di risorse. Sei sicuro di voler continuare?',

  // Original text: 'Copy host BIOS strings to VM'
  copyHostBiosStrings: 'Copia le stringhe del BIOS host su VM',

  // Original text: 'Create a new VM on {select}'
  newVmCreateNewVmOn: 'Crea una nuova macchina virtuale su {select}',

  // Original text: 'You have no permission to create a VM'
  newVmCreateNewVmNoPermission: 'Non sei autorizzato a creare una macchina virtuale',

  // Original text: 'Infos'
  newVmInfoPanel: 'Informazioni',

  // Original text: 'Name'
  newVmNameLabel: 'Nome',

  // Original text: 'Template'
  newVmTemplateLabel: 'Modello',

  // Original text: 'Description'
  newVmDescriptionLabel: 'Descrizione',

  // Original text: 'Performances'
  newVmPerfPanel: 'Prestazioni',

  // Original text: 'vCPUs'
  newVmVcpusLabel: 'CPU virtuali',

  // Original text: 'RAM'
  newVmRamLabel: 'RAM',

  // Original text: 'The memory is below the threshold ({threshold})'
  newVmRamWarning: 'La memoria è al di sotto della soglia ({threshold})',

  // Original text: 'Static memory max'
  newVmStaticMaxLabel: 'Memoria statica massima',

  // Original text: 'Dynamic memory min'
  newVmDynamicMinLabel: 'Memoria dinamica min',

  // Original text: 'Dynamic memory max'
  newVmDynamicMaxLabel: 'Memoria dinamica massima',

  // Original text: 'Install settings'
  newVmInstallSettingsPanel: 'Installa le impostazioni',

  // Original text: 'ISO/DVD'
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: 'Network'
  newVmNetworkLabel: 'Rete',

  // Original text: 'e.g: http://httpredir.debian.org/debian'
  newVmInstallNetworkPlaceHolder: '',

  // Original text: 'PV Args'
  newVmPvArgsLabel: 'PV Args',

  // Original text: 'PXE'
  newVmPxeLabel: 'PXE',

  // Original text: 'Interfaces'
  newVmInterfacesPanel: 'Interfacce',

  // Original text: 'MAC'
  newVmMacLabel: 'MAC',

  // Original text: 'Add interface'
  newVmAddInterface: 'Aggiungi interfaccia',

  // Original text: 'Disks'
  newVmDisksPanel: 'Dischi',

  // Original text: 'SR'
  newVmSrLabel: 'SR',

  // Original text: 'Size'
  newVmSizeLabel: 'Dimensione',

  // Original text: 'Add disk'
  newVmAddDisk: 'Aggiungi disco',

  // Original text: 'Summary'
  newVmSummaryPanel: 'Sommario',

  // Original text: 'Create'
  newVmCreate: 'Creare',

  // Original text: 'Reset'
  newVmReset: 'Ripristina',

  // Original text: 'Select template'
  newVmSelectTemplate: 'Seleziona il modello',

  // Original text: 'SSH key'
  newVmSshKey: 'Chiave SSH',

  // Original text: 'No config drive'
  noConfigDrive: 'Nessuna unità di configurazione',

  // Original text: 'Custom config'
  newVmCustomConfig: 'Configurazione personalizzata',

  // Original text: 'Click here to see the available template variables'
  availableTemplateVarsInfo: 'Fai clic qui per visualizzare le variabili del modello disponibili',

  // Original text: 'Available template variables'
  availableTemplateVarsTitle: 'Variabili di modello disponibili',

  // Original text: 'the VM\'s name. It must not contain "_"'
  templateNameInfo: 'il nome della VM. Non deve contenere "_"',

  // Original text: "the VM's index, it will take 0 in case of single VM"
  templateIndexInfo: "l'indice della VM, ci vorrà 0 in caso di VM singola",

  // Original text: 'Tip: escape any variable with a preceding backslash (\\)'
  templateEscape: 'Suggerimento: usare una barra rovesciata precedente (\\) per qualsiasi variabile',

  // Original text: 'Error on getting the default coreOS cloud template'
  coreOsDefaultTemplateError: "Errore durante l'acquisizione del modello cloud coreOS predefinito",

  // Original text: 'Boot VM after creation'
  newVmBootAfterCreate: 'Avvia la VM dopo la creazione',

  // Original text: 'Auto-generated if empty'
  newVmMacPlaceholder: 'Generato automaticamente se vuoto',

  // Original text: 'CPU weight'
  newVmCpuWeightLabel: 'Peso della CPU',

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuWeight: 'Predefinito: {value, number}',

  // Original text: 'CPU cap'
  newVmCpuCapLabel: 'CPU cap',

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuCap: 'Predefinito: {value, number}',

  // Original text: 'Cloud config'
  newVmCloudConfig: 'Configurazione cloud',

  // Original text: 'Create VMs'
  newVmCreateVms: 'Crea VM',

  // Original text: 'Are you sure you want to create {nbVms, number} VMs?'
  newVmCreateVmsConfirm: 'Sei sicuro di voler creare {nbVms, number} VMs?',

  // Original text: 'Multiple VMs:'
  newVmMultipleVms: 'VMs multiple:',

  // Original text: 'Name pattern:'
  newVmMultipleVmsPattern: 'Modello di nome:',

  // Original text: 'e.g.: \\{name\\}_%'
  newVmMultipleVmsPatternPlaceholder: 'ad esempio: \\{name\\}_%',

  // Original text: 'First index:'
  newVmFirstIndex: 'Primo indice:',

  // Original text: 'Recalculate VMs number'
  newVmNumberRecalculate: 'Ricalcola il numero di VMs',

  // Original text: 'Refresh VMs name'
  newVmNameRefresh: 'Aggiorna il nome delle VMs',

  // Original text: 'Affinity host'
  newVmAffinityHost: 'Affinità host',

  // Original text: 'Advanced'
  newVmAdvancedPanel: 'Avanzati',

  // Original text: 'Show advanced settings'
  newVmShowAdvanced: 'Mostra impostazioni avanzate',

  // Original text: 'Hide advanced settings'
  newVmHideAdvanced: 'Nascondi impostazioni avanzate',

  // Original text: 'Share this VM'
  newVmShare: 'Condividi questa VM',

  // Original text: 'The SRs must either be on the same host or shared'
  newVmSrsNotOnSameHost: 'Gli SR devono essere sullo stesso host o condivisi',

  // Original text: 'Network config'
  newVmNetworkConfigLabel: 'Configurazione della rete',

  // Original text: 'Network configuration is only compatible with the {noCloudDatasourceLink}.'
  newVmNetworkConfigInfo: 'La configurazione di rete è compatibile solo con {noCloudDatasourceLink}.',

  // Original text: 'See {networkConfigDocLink}.'
  newVmNetworkConfigDocLink: 'Vedi {networkConfigDocLink}.',

  // Original text: 'Click here to get more information about network config'
  newVmNetworkConfigTooltip: 'Fai clic qui per ulteriori informazioni sulla configurazione di rete',

  // Original text: 'User config'
  newVmUserConfigLabel: "Configurazione dell'utente",

  // Original text: 'NoCloud datasource'
  newVmNoCloudDatasource: 'NoCloud datasource',

  // Original text: 'Network config documentation'
  newVmNetworkConfigDoc: 'Documentazione di configurazione della rete',

  // Original text: 'The template already contains the BIOS strings'
  templateHasBiosStrings: 'Il modello contiene già le stringhe del BIOS',

  // Original text: 'The boot firmware is UEFI'
  vmBootFirmwareIsUefi: 'Il firmware di avvio è UEFI',

  // Original text: 'Resource sets'
  resourceSets: 'Sets di risorse',

  // Original text: 'No resource sets.'
  noResourceSets: 'Nessun set di risorse.',

  // Original text: 'Resource set name'
  resourceSetName: 'Nome set di risorse',

  // Original text: 'Users'
  resourceSetUsers: 'Utenti',

  // Original text: 'Pools'
  resourceSetPools: 'Pools',

  // Original text: 'Templates'
  resourceSetTemplates: 'Modelli',

  // Original text: 'SRs'
  resourceSetSrs: 'SRs',

  // Original text: 'Networks'
  resourceSetNetworks: 'Reti',

  // Original text: 'Recompute all limits'
  recomputeResourceSets: 'Ricalcola tutti i limiti',

  // Original text: 'Save'
  saveResourceSet: 'Salva',

  // Original text: 'Reset'
  resetResourceSet: 'Ripristina',

  // Original text: 'Edit'
  editResourceSet: 'Modificare',

  // Original text: 'Delete'
  deleteResourceSet: 'Elimina',

  // Original text: 'Delete resource set'
  deleteResourceSetWarning: 'Elimina set di risorse',

  // Original text: 'Are you sure you want to delete this resource set?'
  deleteResourceSetQuestion: 'Sei sicuro di voler eliminare questo set di risorse?',

  // Original text: 'Missing objects:'
  resourceSetMissingObjects: 'Oggetti mancanti:',

  // Original text: 'Unknown'
  unknownResourceSetValue: 'Sconosciuto',

  // Original text: 'Available hosts'
  availableHosts: 'Hosts disponibili',

  // Original text: 'Excluded hosts'
  excludedHosts: 'Hosts esclusi',

  // Original text: 'No hosts available.'
  noHostsAvailable: 'Nessun host disponibile.',

  // Original text: 'VMs created from this resource set shall run on the following hosts.'
  availableHostsDescription:
    'Le macchine virtuali create da questo set di risorse devono essere eseguite sui seguenti host.',

  // Original text: 'Maximum CPUs'
  maxCpus: 'CPUs massime',

  // Original text: 'Maximum RAM'
  maxRam: 'RAM massima',

  // Original text: 'Maximum disk space'
  maxDiskSpace: 'Spazio su disco massimo',

  // Original text: 'IP pool'
  ipPool: 'IP pool',

  // Original text: 'Quantity'
  quantity: 'Quantità',

  // Original text: 'Used'
  usedResourceLabel: 'Usato',

  // Original text: 'Available'
  availableResourceLabel: 'A disposizione',

  // Original text: 'Used: {usage} (Total: {total})'
  resourceSetQuota: 'Utilizzato: {usage} (Totale: {total})',

  // Original text: 'New'
  resourceSetNew: 'Nuovo',

  // Original text: 'Drop OVA or XVA files here to import Virtual Machines.'
  importVmsList: 'Rilascia qui i file OVA o XVA per importare macchine virtuali.',

  // Original text: 'No selected VMs.'
  noSelectedVms: 'Nessuna VM selezionata.',

  // Original text: 'To Pool:'
  vmImportToPool: 'A Pool:',

  // Original text: 'To SR:'
  vmImportToSr: 'Per SR:',

  // Original text: 'VM{nVms, plural, one {} other {s}} to import'
  vmsToImport: 'VM{nVms, plural, one {} other {s}} da importare',

  // Original text: 'Reset'
  importVmsCleanList: 'Ripristina',

  // Original text: 'VM import success'
  vmImportSuccess: 'Importazione delle VM riuscita',

  // Original text: 'VM import failed'
  vmImportFailed: 'Importazione VM fallita',

  // Original text: 'VDI import success'
  vdiImportSuccess: 'Importazione VDI riuscita',

  // Original text: 'VDI import failed'
  vdiImportFailed: 'Importazione VDI fallita',

  // Original text: 'Error on setting the VM: {vm}'
  setVmFailed: "Errore durante l'impostazione della macchina virtuale: {vm}",

  // Original text: 'Import starting…'
  startVmImport: "Inizio dell'importazione…",

  // Original text: 'VDI import starting…'
  startVdiImport: "Inizio dell'importazione VDI…",

  // Original text: 'Export starting…'
  startVmExport: "Inizio dell'esportazione…",

  // Original text: 'VDI export starting…'
  startVdiExport: "Inizio dell'esportazione VDI…",

  // Original text: 'Number of CPUs'
  nCpus: undefined,

  // Original text: 'Memory'
  vmMemory: 'Memoria',

  // Original text: 'Disk {position} ({capacity})'
  diskInfo: 'Disco {position} ({capacity})',

  // Original text: 'Disk description'
  diskDescription: 'Descrizione del disco',

  // Original text: 'No disks.'
  noDisks: 'Nessun disco',

  // Original text: 'No networks.'
  noNetworks: 'Nessuna rete',

  // Original text: 'Network {name}'
  networkInfo: 'Rete {name}',

  // Original text: 'No description available'
  noVmImportErrorDescription: 'Nessuna descrizione disponibile',

  // Original text: 'Error:'
  vmImportError: 'Errore:',

  // Original text: '{type} file:'
  vmImportFileType: 'file {type}:',

  // Original text: 'Please check and/or modify the VM configuration.'
  vmImportConfigAlert: 'Verificare e/o modificare la configurazione della VM.',

  // Original text: 'Disk import failed'
  diskImportFailed: 'Importazione del disco non riuscita',

  // Original text: 'Disk import success'
  diskImportSuccess: 'Importazione del disco riuscita',

  // Original text: 'Drop VMDK or VHD files here to import disks.'
  dropDisksFiles: 'Rilascia qui i file ISO, VMDK o VHD per importare i dischi.',

  // Original text: 'To SR'
  importToSr: 'A SR',

  // Original text: 'Cancel'
  cancelTask: 'Annulla',

  // Original text: 'Destroy'
  destroyTask: 'Distruggere',

  // Original text: 'Cancel selected tasks'
  cancelTasks: 'Annulla i compiti selezionati',

  // Original text: 'Destroy selected tasks'
  destroyTasks: 'Distruggi i compiti selezionati',

  // Original text: 'Pool'
  pool: 'Pool',

  // Original text: 'Task'
  task: 'Compito',

  // Original text: 'Progress'
  progress: 'Progresso',

  // Original text: 'Previous tasks'
  previousTasks: 'Attività precedenti',

  // Original text: 'Last seen'
  taskLastSeen: 'Ultima visualizzazione',

  // Original text: 'Schedules'
  backupSchedules: 'Orari',

  // Original text: '{nLoneSnapshots} lone snapshot{nLoneSnapshots, plural, one {} other {s}} to delete!'
  loneSnapshotsMessages:
    '{nLoneSnapshots} istantane{nLoneSnapshots, plural, one {a} other {e}} isolat{nLoneSnapshots, plural, one {a} other {e}} to delete!',

  // Original text: 'Cron pattern'
  scheduleCron: 'Modello cron',

  // Original text: 'Click to display last run details'
  scheduleLastRun: "Fare clic per visualizzare i dettagli dell'ultima esecuzione",

  // Original text: 'Name'
  scheduleName: 'Nome',

  // Original text: 'Copy ID {id}'
  scheduleCopyId: 'Copia ID {id}',

  // Original text: 'Timezone'
  scheduleTimezone: 'Fuso orario',

  // Original text: 'Backup retention'
  scheduleExportRetention: 'Ritenzione del backup',

  // Original text: 'Replication retention'
  scheduleCopyRetention: 'Ritenzione della replica',

  // Original text: 'Snapshot retention'
  scheduleSnapshotRetention: "Ritenzione dell'istantanea",

  // Original text: 'Pool retention'
  poolMetadataRetention: 'Ritenzione del pool',

  // Original text: 'XO retention'
  xoMetadataRetention: 'Ritenzione XO',

  // Original text: 'Get remote'
  getRemote: 'Ottieni remoto',

  // Original text: 'List Remote'
  listRemote: 'Elenco remoto',

  // Original text: 'simple'
  simpleBackup: 'semplice',

  // Original text: 'delta'
  delta: 'delta',

  // Original text: 'There are no backups!'
  noBackups: 'Non ci sono backup!',

  // Original text: 'Click on a VM to display restore options'
  restoreBackupsInfo: 'Fare clic su una VM per visualizzare le opzioni di ripristino',

  // Original text: 'Enabled'
  remoteEnabled: 'Abilitato',

  // Original text: 'Disabled'
  remoteDisabled: 'Disabilitato',

  // Original text: 'Enable'
  enableRemote: 'Abilitare',

  // Original text: 'Disable'
  disableRemote: 'Disabilitare',

  // Original text: 'The URL ({url}) is invalid (colon in path). Click this button to change the URL to {newUrl}.'
  remoteErrorMessage:
    "L'URL ({url}) non è valido (due punti nel percorso). Fai clic su questo pulsante per modificare l'URL in {newUrl}.",

  // Original text: 'VM Name'
  backupVmNameColumn: 'Nome VM',

  // Original text: 'VM Description'
  backupVmDescriptionColumn: 'Descrizione della VM',

  // Original text: 'Tags'
  backupTags: 'Etichette',

  // Original text: 'Oldest backup'
  firstBackupColumn: 'Backup più vecchio',

  // Original text: 'Latest backup'
  lastBackupColumn: 'Ultimo backup',

  // Original text: 'Available Backups'
  availableBackupsColumn: 'Backup disponibili',

  // Original text: 'Missing parameters'
  backupRestoreErrorTitle: 'Parametri mancanti',

  // Original text: 'Choose a SR and a backup'
  backupRestoreErrorMessage: 'Scegli un SR e un backup',

  // Original text: 'Import VM'
  importBackupTitle: 'Importa VM',

  // Original text: 'Starting your backup import'
  importBackupMessage: "Avvio dell'importazione di backup",

  // Original text: 'VMs to backup'
  vmsToBackup: 'VMs per il backup',

  // Original text: 'Refresh backup list'
  refreshBackupList: "Aggiorna l'elenco di backup",

  // Original text: 'Legacy restore'
  restoreLegacy: 'Ripristino legacy',

  // Original text: 'Legacy file restore'
  restoreFileLegacy: 'Ripristino di file legacy',

  // Original text: 'Restore'
  restoreVmBackups: 'Ripristinare',

  // Original text: 'Restore {vm}'
  restoreVmBackupsTitle: 'Ripristina {vm}',

  // Original text: 'Restore {nVms, number} VM{nVms, plural, one {} other {s}}'
  restoreVmBackupsBulkTitle: 'Ripristina {nVms, number} VM{nVms, plural, one {} other {s}}',

  // Original text: 'Restore {nVms, number} VM{nVms, plural, one {} other {s}} from {nVms, plural, one {its} other {their}} {oldestOrLatest} backup.'
  restoreVmBackupsBulkMessage:
    'Ripristina {nVms, number} VM{nVms, plural, one {} other {s}} da {nVms, plural, one {suo} other {loro}} {oldestOrLatest} backup.',

  // Original text: 'oldest'
  oldest: 'il più vecchio',

  // Original text: 'latest'
  latest: 'più recente',

  // Original text: 'Start VM{nVms, plural, one {} other {s}} after restore'
  restoreVmBackupsStart: 'Avvia VM{nVms, plural, one {} other {s}} dopo il ripristino',

  // Original text: 'Multi-restore error'
  restoreVmBackupsBulkErrorTitle: 'Errore di ripristino multiplo',

  // Original text: 'Restore {item}'
  restoreMetadataBackupTitle: 'Ripristina {item}',

  // Original text: 'Restore {nMetadataBackups, number} metadata backup{nMetadataBackups, plural, one {} other {s}}'
  bulkRestoreMetadataBackupTitle:
    'Ripristina {nMetadataBackups, number} metadati backup{nMetadataBackups, plural, one {} other {s}}',

  // Original text: 'Restore {nMetadataBackups, number} metadata backup{nMetadataBackups, plural, one {} other {s}} from {nMetadataBackups, plural, one {its} other {their}} {oldestOrLatest} backup'
  bulkRestoreMetadataBackupMessage:
    'Ripristina {nMetadataBackups, number} backup{nMetadataBackups, plural, one {} other {s}} dei metadati da {nMetadataBackups, plurale, uno {suo} altro {suoi}} {vecchiOrLatest} backup',

  // Original text: 'Delete {item} backup'
  deleteMetadataBackupTitle: 'Elimina il backup di {item}',

  // Original text: 'You need to select a destination SR'
  restoreVmBackupsBulkErrorMessage: 'Devi selezionare un SR di destinazione',

  // Original text: 'Delete backups…'
  deleteVmBackups: 'Elimina backup…',

  // Original text: 'Delete {vm} backups'
  deleteVmBackupsTitle: 'Elimina i backup di {vm}',

  // Original text: 'Select backups to delete:'
  deleteBackupsSelect: 'Seleziona i backup da eliminare:',

  // Original text: 'All'
  deleteVmBackupsSelectAll: 'Tutti',

  // Original text: 'Delete backups'
  deleteVmBackupsBulkTitle: 'Elimina i backup',

  // Original text: 'Are you sure you want to delete all the backups from {nVms, number} VM{nVms, plural, one {} other {s}}?'
  deleteVmBackupsBulkMessage:
    'Sei sicuro di voler eliminare tutti i backup da {nVms, number} VM{nVms, plural, one {} other {s}}?',

  // Original text: 'delete {nBackups} backup{nBackups, plural, one {} other {s}}'
  deleteVmBackupsBulkConfirmText: 'elimina {nBackups} backup{nBackups, plural, one {} other {s}}',

  // Original text: 'Delete metadata backups'
  bulkDeleteMetadataBackupsTitle: 'Elimina i backup dei metadati',

  // Original text: 'Are you sure you want to delete all the backups from {nMetadataBackups, number} metadata backup{nMetadataBackups, plural, one {} other {s}}?'
  bulkDeleteMetadataBackupsMessage:
    'Sei sicuro di voler eliminare tutti i backup da {nMetadataBackups, numero} metadati backup{nMetadataBackups, plural, one {} other {s}}?',

  // Original text: 'delete {nMetadataBackups} metadata backup{nMetadataBackups, plural, one {} other {s}}'
  bulkDeleteMetadataBackupsConfirmText:
    'elimina {nMetadataBackups} metadati backup{nMetadataBackups, plural, one {} other {s}}',

  // Original text: "The backup will not be run on this remote because it's not compatible with the selected proxy"
  remoteNotCompatibleWithSelectedProxy:
    'Il backup non verrà eseguito su questo remoto perché non è compatibile con il proxy selezionato',

  // Original text: 'List remote backups'
  listRemoteBackups: 'Elenca backup remoti',

  // Original text: 'Restore backup files'
  restoreFiles: 'Ripristina i file di backup',

  // Original text: 'Invalid options'
  restoreFilesError: 'Opzioni non valide',

  // Original text: 'Restore file from {name}'
  restoreFilesFromBackup: 'Ripristina file da {name}',

  // Original text: 'Select a backup…'
  restoreFilesSelectBackup: 'Seleziona un backup…',

  // Original text: 'Select a disk…'
  restoreFilesSelectDisk: 'Seleziona un disco…',

  // Original text: 'Select a partition…'
  restoreFilesSelectPartition: 'Seleziona una partizione…',

  // Original text: 'Select a file…'
  restoreFilesSelectFiles: 'Seleziona un file…',

  // Original text: 'No files selected'
  restoreFilesNoFilesSelected: 'Nessun file selezionato',

  // Original text: 'Selected files ({files}):'
  restoreFilesSelectedFiles: 'File selezionati ({files}):',

  // Original text: 'Selected files/folders ({files}):'
  restoreFilesSelectedFilesAndFolders: 'File/cartelle selezionati ({files}):',

  // Original text: 'Error while scanning disk'
  restoreFilesDiskError: 'Errore durante la scansione del disco',

  // Original text: "Select all this folder's files"
  restoreFilesSelectAllFiles: 'Seleziona tutti i file di questa cartella',

  // Original text: 'Select this folder'
  restoreFilesSelectFolder: 'Seleziona questa cartella',

  // Original text: 'Unselect all files'
  restoreFilesUnselectAll: 'Deseleziona tutti i file',

  // Original text: 'Emergency shutdown Host'
  emergencyShutdownHostModalTitle: 'Arresto di emergenza dello host',

  // Original text: 'Are you sure you want to shutdown {host}?'
  emergencyShutdownHostModalMessage: 'Sei sicuro di voler arrestare {host}?',

  // Original text: 'Emergency shutdown Host{nHosts, plural, one {} other {s}}'
  emergencyShutdownHostsModalTitle:
    'Arresto di emergenza {nHosts, plural, one {dello} other {degli}} host{nHosts, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to shutdown {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  emergencyShutdownHostsModalMessage:
    'Sei sicuro di voler chiudere {nHosts, number} Host{nHosts, plural, one {} other {s}}?',

  // Original text: 'Shutdown host'
  stopHostModalTitle: 'Arresto dello host',

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage: 'Questo spegnerà il tuo host.',

  // Original text: 'Add host'
  addHostModalTitle: 'Aggiungi host',

  // Original text: 'Are you sure you want to add {host} to {pool}?'
  addHostModalMessage: 'Sei sicuro di voler aggiungere {host} a {pool}?',

  // Original text: 'Restart host'
  restartHostModalTitle: 'Riavvia host',

  // Original text: 'This will restart your host. Do you want to continue?'
  restartHostModalMessage: 'Vuoi continuare?',

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}'
  restartHostsAgentsModalTitle:
    'Riavvia host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {e} other {i}}',

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?'
  restartHostsAgentsModalMessage:
    'Sei sicuro di voler riavviare {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {e} other {i}}?',

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}}'
  restartHostsModalTitle: 'Riavvia host{nHosts, plurale, uno {} altro {s}}',

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  restartHostsModalMessage: 'Sei sicuro di voler riavviare {nHosts, number} Host{nHosts, plural, one {} other {s}}?',

  // Original text: 'Start VM{vms, plural, one {} other {s}}'
  startVmsModalTitle: 'Avvia VM{vms, plural, one {} other {s}}',

  // Original text: 'Start a copy'
  cloneAndStartVM: 'Inizia una copia',

  // Original text: 'Force start'
  forceStartVm: "Forzare l'avvio",

  // Original text: 'Forbidden operation'
  forceStartVmModalTitle: 'Operazione proibita',

  // Original text: 'Start operation for this vm is blocked.'
  blockedStartVmModalMessage: "L'operazione di avvio per questa VM è bloccata.",

  // Original text: 'Forbidden operation start for {nVms, number} vm{nVms, plural, one {} other {s}}.'
  blockedStartVmsModalMessage: "Inizio dell'operazione proibita per {nVms, number} VM{nVms, plural, one {} other {s}}.",

  // Original text: 'Are you sure you want to start {vms, number} VM{vms, plural, one {} other {s}}?'
  startVmsModalMessage: 'Sei sicuro di voler avviare {vms, number} VMvms, plural, one {} other {s}}?',

  // Original text: '{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information'
  failedVmsErrorMessage: 'Si prega di consultare i registri per ottenere maggiori informazioni',

  // Original text: 'Start failed'
  failedVmsErrorTitle: 'Inizio fallito',

  // Original text: 'Stop Host{nHosts, plural, one {} other {s}}'
  stopHostsModalTitle: 'Stop Host{nHosts, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  stopHostsModalMessage: 'Sei sicuro di voler interrompere {nHosts, number} Host{nHosts, plural, one {} other {s}}?',

  // Original text: 'Stop VM{vms, plural, one {} other {s}}'
  stopVmsModalTitle: 'Arresta VM{vms, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?'
  stopVmsModalMessage: 'Sei sicuro di voler arrestare {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: 'Restart VM'
  restartVmModalTitle: 'Riavvia VM',

  // Original text: 'Are you sure you want to restart {name}?'
  restartVmModalMessage: 'Vuoi riavviare {name}?',

  // Original text: 'Stop VM'
  stopVmModalTitle: 'Ferma VM',

  // Original text: 'Are you sure you want to stop {name}?'
  stopVmModalMessage: 'Sei sicuro di voler interrompere {name}?',

  // Original text: 'Suspend VM{vms, plural, one {} other {s}}'
  suspendVmsModalTitle: 'Sospendi VM{vms, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to suspend {vms, number} VM{vms, plural, one {} other {s}}?'
  suspendVmsModalMessage: 'Sei sicuro di voler sospendere {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: 'Pause VM{vms, plural, one {} other {s}}'
  pauseVmsModalTitle: 'Metti in pausa VM{vms, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to pause {vms, number} VM{vms, plural, one {} other {s}}?'
  pauseVmsModalMessage: 'Vuoi mettere in pausa {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: 'Restart VM{vms, plural, one {} other {s}}'
  restartVmsModalTitle: 'Riavvia VM{vms, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?'
  restartVmsModalMessage: 'Vuoi riavviare {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: 'save memory'
  snapshotSaveMemory: 'salva la memoria',

  // Original text: 'Snapshot VM{vms, plural, one {} other {s}}'
  snapshotVmsModalTitle: 'Istantane{vms, plural, one {a} other {e}} VM{vms, plural, one {} other {s}}',

  // Original text: 'Delete VM{vms, plural, one {} other {s}}'
  deleteVmsModalTitle: 'Elimina VM{vms, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED'
  deleteVmsModalMessage:
    'Sei sicuro di voler eliminare {vms, number} VM{vms, plural, one {} other {s}}? TUTTI I DISCHI DELLE VM VERRANNO RIMOSSI',

  // Original text: 'delete {nVms, number} vm{nVms, plural, one {} other {s}}'
  deleteVmsConfirmText: 'elimina {nVms, number} VM{nVms, plural, one {} other {s}}',

  // Original text: 'Delete VM'
  deleteVmModalTitle: 'Elimina VM',

  // Original text: 'Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED'
  deleteVmModalMessage: 'Sei sicuro di voler eliminare questa VM? TUTTI I DISCHI DELLA VM VERRANNO RIMOSSI',

  // Original text: 'Blocked operation'
  deleteVmBlockedModalTitle: 'Operazione bloccata',

  // Original text: 'Removing the VM is a blocked operation. Would you like to remove it anyway?'
  deleteVmBlockedModalMessage: "La rimozione della VM è un'operazione bloccata. Vuoi rimuoverlo comunque?",

  // Original text: 'Force migration'
  forceVmMigrateModalTitle: 'Forza la migrazione',

  // Original text: 'The VM is incompatible with the CPU features of the destination host. Would you like to force it anyway?'
  forceVmMigrateModalMessage:
    "La VM non è compatibile con le funzionalità della CPU dell'host di destinazione. Ti piacerebbe forzarlo comunque?",

  // Original text: 'Migrate VM'
  migrateVmModalTitle: 'Migrare VM',

  // Original text: 'Select a destination host:'
  migrateVmSelectHost: 'Seleziona un host di destinazione:',

  // Original text: 'Select a migration network:'
  migrateVmSelectMigrationNetwork: 'Seleziona una rete di migrazione:',

  // Original text: 'For each VIF, select a network:'
  migrateVmSelectNetworks: 'Per ogni VIF, selezionare una rete:',

  // Original text: 'Select a destination SR:'
  migrateVmsSelectSr: 'Seleziona un SR di destinazione:',

  // Original text: 'Select a destination SR for local disks:'
  migrateVmsSelectSrIntraPool: 'Seleziona un SR di destinazione per i dischi locali:',

  // Original text: 'Select a network on which to connect each VIF:'
  migrateVmsSelectNetwork: 'Seleziona una rete su cui connettere ogni VIF:',

  // Original text: 'Smart mapping'
  migrateVmsSmartMapping: 'Mappatura intelligente',

  // Original text: 'VIF'
  migrateVmVif: 'VIF',

  // Original text: 'Network'
  migrateVmNetwork: 'Rete',

  // Original text: 'No target host'
  migrateVmNoTargetHost: 'Nessun host di destinazione',

  // Original text: 'A target host is required to migrate a VM'
  migrateVmNoTargetHostMessage: 'Per eseguire la migrazione di una VM è necessario un host di destinazione',

  // Original text: 'No default SR'
  migrateVmNoDefaultSrError: 'Nessuna SR predefinita',

  // Original text: 'Default SR not connected to host'
  migrateVmNotConnectedDefaultSrError: "SR predefinito non connesso all'host",

  // Original text: 'For each VDI, select an SR (optional)'
  chooseSrForEachVdisModalSelectSr: 'Per ogni VDI, selezionare un SR (opzionale)',

  // Original text: 'Select main SR…'
  chooseSrForEachVdisModalMainSr: 'Seleziona SR principale…',

  // Original text: 'VDI'
  chooseSrForEachVdisModalVdiLabel: 'VDI',

  // Original text: 'SR*'
  chooseSrForEachVdisModalSrLabel: 'SR*',

  // Original text: 'Delete job{nJobs, plural, one {} other {s}}'
  deleteJobsModalTitle: 'Elimina process{nJobs, plural, one {o} other {i}}',

  // Original text: 'Are you sure you want to delete {nJobs, number} job{nJobs, plural, one {} other {s}}?'
  deleteJobsModalMessage: 'Sei sicuro di voler eliminare {nJobs, number} lavor{nJobs, plural, one {o} other {i}}?',

  // Original text: 'Delete VBD{nVbds, plural, one {} other {s}}'
  deleteVbdsModalTitle: 'Elimina VBD{nVbds, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nVbds, number} VBD{nVbds, plural, one {} other {s}}?'
  deleteVbdsModalMessage: 'Sei sicuro di voler eliminare {nVbds, number} VBD{nVbds, plural, one {} other {s}}?',

  // Original text: 'Delete VDI'
  deleteVdiModalTitle: 'Elimina VDI',

  // Original text: 'Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST'
  deleteVdiModalMessage: 'Sei sicuro di voler eliminare questo disco? TUTTI I DATI SU QUESTO DISCO SARANNO PERDUTI',

  // Original text: 'Delete VDI{nVdis, plural, one {} other {s}}'
  deleteVdisModalTitle: 'Elimina VDI{nVdis, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nVdis, number} disk{nVdis, plural, one {} other {s}}? ALL DATA ON THESE DISKS WILL BE LOST'
  deleteVdisModalMessage:
    'Sei sicuro di voler eliminare {nVdis, number} disc{nVdis, plural, one {o} other {hi}}? TUTTI I DATI SU QUESTI DISCHI SARANNO PERDUTI',

  // Original text: 'Delete schedule{nSchedules, plural, one {} other {s}}'
  deleteSchedulesModalTitle: 'Elimina pianificazion{nSchedules, plural, one {e} other {i}}',

  // Original text: 'Are you sure you want to delete {nSchedules, number} schedule{nSchedules, plural, one {} other {s}}?'
  deleteSchedulesModalMessage:
    'Sei sicuro di voler eliminare {nSchedules, number} pianificazion{nSchedules, plural, one {e} other {i}}?',

  // Original text: 'Delete remote{nRemotes, plural, one {} other {s}}'
  deleteRemotesModalTitle: 'Elimina remot{nRemote, plural, one {o} other {i}}',

  // Original text: 'Are you sure you want to delete {nRemotes, number} remote{nRemotes, plural, one {} other {s}}?'
  deleteRemotesModalMessage:
    'Sei sicuro di voler eliminare {nRemote, number} remot{nRemote, plural, one {o} other {i}}?',

  // Original text: 'Revert your VM'
  revertVmModalTitle: 'Ripristina la tua VM',

  // Original text: 'Share your VM'
  shareVmInResourceSetModalTitle: 'Condividi la tua VM',

  // Original text: 'This VM will be shared with all the members of the self-service {self}. Are you sure?'
  shareVmInResourceSetModalMessage: 'Sei sicuro?',

  // Original text: 'Delete VIF{nVifs, plural, one {} other {s}}'
  deleteVifsModalTitle: 'Elimina VIF{nVifs, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nVifs, number} VIF{nVifs, plural, one {} other {s}}?'
  deleteVifsModalMessage: 'Sei sicuro di voler eliminare {nVifs, number} VIF{nVifs, plural, one {} other {s}}?',

  // Original text: 'Delete snapshot'
  deleteSnapshotModalTitle: 'Elimina istantanea',

  // Original text: 'Are you sure you want to delete this snapshot?'
  deleteSnapshotModalMessage: 'Sei sicuro di voler eliminare questa istantanea?',

  // Original text: 'Delete snapshot{nVms, plural, one {} other {s}}'
  deleteSnapshotsModalTitle: 'Elimina istantane{nVms, plural, one {a} other {e}}',

  // Original text: 'Are you sure you want to delete {nVms, number} snapshot{nVms, plural, one {} other {s}}?'
  deleteSnapshotsModalMessage:
    'Sei sicuro di voler eliminare {nVms, number} istantane{nVms, plural, one {a} other {e}}?',

  // Original text: 'Disconnect VBD{nVbds, plural, one {} other {s}}'
  disconnectVbdsModalTitle: 'Disconnetti VBD{nVbds, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to disconnect {nVbds, number} VBD{nVbds, plural, one {} other {s}}?'
  disconnectVbdsModalMessage: 'Sei sicuro di voler disconnettere {nVbds, number} VBD{nVbds, plural, one {} other {s}}?',

  // Original text: 'Are you sure you want to revert this VM to the snapshot state? This operation is irreversible.'
  revertVmModalMessage: 'Questa operazione è irreversibile.',

  // Original text: 'Snapshot before'
  revertVmModalSnapshotBefore: 'Istantanea prima',

  // Original text: 'Import a {name} Backup'
  importBackupModalTitle: 'Importa un backup {name}',

  // Original text: 'Start VM after restore'
  importBackupModalStart: 'Avviare la VM dopo il ripristino',

  // Original text: 'Select your backup…'
  importBackupModalSelectBackup: 'Seleziona il tuo backup…',

  // Original text: 'Select a destination SR…'
  importBackupModalSelectSr: 'Seleziona una destinazione SR…',

  // Original text: 'Delete orphaned snapshot VDIs'
  deleteOrphanedVdisModalTitle: 'Elimina VDI snapshot orfani',

  // Original text: 'Are you sure you want to delete {nVdis, number} orphaned snapshot VDI{nVdis, plural, one {} other {s}}?'
  deleteOrphanedVdisModalMessage:
    'Sei sicuro di voler eliminare {nVdis, number} VDI istantane{nVdis, plural, one {a} other {e}} orfan{nVdis, plural, one {a} other {e}}?',

  // Original text: 'This operation is definitive.'
  definitiveMessageModal: 'Questa operazione è definitiva.',

  // Original text: 'Previous LUN Usage'
  existingLunModalTitle: 'Utilizzo LUN precedente',

  // Original text: 'This LUN has been previously used as storage by a XenServer host. All data will be lost if you choose to continue with the SR creation.'
  existingLunModalText: 'Tutti i dati andranno persi se si sceglie di continuare con la creazione di SR.',

  // Original text: 'Replace current registration?'
  alreadyRegisteredModal: 'Sostituisci la registrazione attuale?',

  // Original text: 'Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?'
  alreadyRegisteredModalText:
    "L'appliance XO è già registrata su {email}, vuoi dimenticare e sostituire questa registrazione?",

  // Original text: 'Ready for trial?'
  trialReadyModal: 'Pronto per il processo?',

  // Original text: 'During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!'
  trialReadyModalText:
    'Durante il periodo di prova, XOA deve disporre di una connessione Internet funzionante. Questa limitazione non si applica ai nostri piani a pagamento!',

  // Original text: 'Cancel task{nTasks, plural, one {} other {s}}'
  cancelTasksModalTitle: 'Annulla attività',

  // Original text: 'Are you sure you want to cancel {nTasks, number} task{nTasks, plural, one {} other {s}}?'
  cancelTasksModalMessage: 'Sei sicuro di voler annullare {nTasks, number} compit{nTasks, plural, one {o} other {i}}?',

  // Original text: 'Destroy task{nTasks, plural, one {} other {s}}'
  destroyTasksModalTitle: 'Distruggi compit{nTasks, plural, one {o} other {i}}',

  // Original text: 'Are you sure you want to destroy {nTasks, number} task{nTasks, plural, one {} other {s}}?'
  destroyTasksModalMessage:
    'Sei sicuro di voler distruggere {nTasks, number} compit{nTasks, plural, one {o} other {i}}?',

  // Original text: 'Forget host'
  forgetHostFromSrModalTitle: "Dimentica l'host",

  // Original text: 'Are you sure you want to forget this host? This will disconnect the SR from the host by removing the link between them (PBD).'
  forgetHostFromSrModalMessage:
    'Sei sicuro di voler dimenticare questo host? Ciò disconnetterà lo SR dallo host rimuovendo il collegamento tra loro (PBD).',

  // Original text: 'Forget host{nPbds, plural, one {} other {s}}'
  forgetHostsFromSrModalTitle: "Dimentica {nPbds, plural, one {l'} other {gli}} host{nPbds, plural, one {} other {s}}",

  // Original text: 'Are you sure you want to forget {nPbds, number} host{nPbds, plural, one {} other {s}}? This will disconnect the SR from these hosts by removing the links between the SR and the hosts (PBDs).'
  forgetHostsFromSrModalMessage:
    'Sei sicuro di voler dimenticare {nPbds, number} host{nPbds, plural, one {} other {s}}? Ciò disconnetterà lo SR da questi hosts rimuovendo i collegamenti tra lo SR e gli host (PBD).',

  // Original text: 'Forget SR'
  forgetSrFromHostModalTitle: 'Dimentica SR',

  // Original text: 'Are you sure you want to forget this SR? This will disconnect the SR from the host by removing the link between them (PBD).'
  forgetSrFromHostModalMessage:
    'Sei sicuro di voler dimenticare questo SR? Ciò disconnetterà il SR dalo host rimuovendo il collegamento tra loro (PBD).',

  // Original text: 'Forget SR{nPbds, plural, one {} other {s}}'
  forgetSrsFromHostModalTitle: 'Dimentica SR{nPbds, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to forget {nPbds, number} SR{nPbds, plural, one {} other {s}}? This will disconnect the SRs from the host by removing the links between the host and the SRs (PBDs).'
  forgetSrsFromHostModalMessage:
    "Sei sicuro di voler dimenticare {nPbds, number} SR{nPbds, plural, one {} other {s}}? Ciò disconnetterà gli SR dallo host rimuovendo i collegamenti tra l'host e gli SR (PBD).",

  // Original text: '* optional'
  optionalEntry: '* opzionale',

  // Original text: 'Label'
  serverLabel: 'Etichetta',

  // Original text: 'Host'
  serverHost: 'Host',

  // Original text: 'Username'
  serverUsername: 'Nome utente',

  // Original text: 'Password'
  serverPassword: 'Parola chiave',

  // Original text: 'Read Only'
  serverReadOnly: 'Sola lettura',

  // Original text: 'Unauthorized Certificates'
  serverUnauthorizedCertificates: 'Certificati non autorizzati',

  // Original text: 'Allow Unauthorized Certificates'
  serverAllowUnauthorizedCertificates: 'Consenti certificati non autorizzati',

  // Original text: "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured."
  serverUnauthorizedCertificatesInfo:
    'Abilitalo se il certificato viene rifiutato, ma non è consigliato perché la connessione non sarà protetta.',

  // Original text: 'username'
  serverPlaceHolderUser: 'nome utente',

  // Original text: 'password'
  serverPlaceHolderPassword: 'parola chiave',

  // Original text: 'address[:port]'
  serverPlaceHolderAddress: 'Indirizzo[:porta]',

  // Original text: 'label'
  serverPlaceHolderLabel: 'Etichetta',

  // Original text: 'Connect'
  serverConnect: 'Collegare',

  // Original text: 'Error'
  serverError: 'Errore',

  // Original text: 'Adding server failed'
  serverAddFailed: 'Aggiunta del server fallita',

  // Original text: 'Status'
  serverStatus: 'Stato',

  // Original text: 'Connection failed. Click for more information.'
  serverConnectionFailed: 'Connessione fallita. Clicca per maggiori informazioni.',

  // Original text: 'Authentication error'
  serverAuthFailed: 'Errore di autenticazione',

  // Original text: 'Unknown error'
  serverUnknownError: 'Errore sconosciuto',

  // Original text: 'Invalid self-signed certificate'
  serverSelfSignedCertError: 'Certificato autofirmato non valido',

  // Original text: 'Do you want to accept self-signed certificate for this server even though it would decrease security?'
  serverSelfSignedCertQuestion:
    'Vuoi accettare il certificato autofirmato per questo server anche se ridurrebbe la sicurezza?',

  // Original text: 'Enable'
  serverEnable: 'Abilitare',

  // Original text: 'Enabled'
  serverEnabled: 'Abilitato',

  // Original text: 'Disabled'
  serverDisabled: 'Disabilitato',

  // Original text: 'Disable server'
  serverDisable: 'Disabilita il server',

  // Original text: 'Copy VM'
  copyVm: 'Copia VM',

  // Original text: 'Name'
  copyVmName: 'Nome',

  // Original text: 'If empty: name of the copied VM'
  copyVmNamePlaceholder: 'Se vuoto: nome della VM copiata',

  // Original text: 'e.g.: "\\{name\\}_COPY"'
  copyVmNamePatternPlaceholder: 'ad esempio: "\\{name\\}_COPIA"',

  // Original text: 'Select SR'
  copyVmSelectSr: 'Seleziona SR',

  // Original text: 'No target SR'
  copyVmsNoTargetSr: 'Nessuna SR di destinazione',

  // Original text: 'A target SR is required to copy a VM'
  copyVmsNoTargetSrMessage: 'È richiesto un SR di destinazione per copiare una VM',

  // Original text: 'Zstd is not supported on {nVms, number} VM{nVms, plural, one {} other {s}}'
  notSupportedZstdWarning: 'Zstd non è supportato su {nVms, number} VM{nVms, plural, one {} other {s}}',

  // Original text: 'Click to see the concerned VMs'
  notSupportedZstdTooltip: 'Fare clic per visualizzare le VM interessate',

  // Original text: 'Fast clone'
  fastCloneMode: 'Clone veloce',

  // Original text: 'Full copy'
  fullCopyMode: 'Copia completa',

  // Original text: 'Detach host'
  detachHostModalTitle: "Scollega l'host",

  // Original text: 'Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST.'
  detachHostModalMessage:
    "Sei sicuro di voler staccare {host} dal suo pool? QUESTO RIMUOVERÀ TUTTE LE VM SUL SUO STOCCAGGIO LOCALE E RIAVVIERÀ L'HOST.",

  // Original text: 'Detach'
  detachHost: 'Scollegare',

  // Original text: 'Advanced Live Telemetry'
  advancedLiveTelemetry: 'Telemetria live avanzata',

  // Original text: 'Netdata plugin is necessary'
  pluginNetDataIsNecessary: 'È necessario il plug-in Netdata',

  // Original text: 'Enable Advanced Live Telemetry'
  enableAdvancedLiveTelemetry: 'Abilita telemetria live avanzata',

  // Original text: 'Advanced Live Telemetry successfully enabled'
  enableAdvancedLiveTelemetrySuccess: 'Telemetria live avanzata abilitata correttamente',

  // Original text: 'This feature is only XCP-ng compatible'
  xcpOnlyFeature: 'Questa funzione è compatibile solo con XCP-ng',

  // Original text: 'Forget host'
  forgetHostModalTitle: "Dimentica l'host",

  // Original text: "Are you sure you want to forget {host} from its pool? Be sure this host can't be back online, or use detach instead."
  forgetHostModalMessage: 'Assicurati che questo host non possa essere di nuovo online, oppure usa detach invece.',

  // Original text: 'Forget'
  forgetHost: 'Dimenticare',

  // Original text: 'Designate a new master'
  setPoolMasterModalTitle: 'Designare un nuovo master',

  // Original text: 'This operation may take several minutes. Do you want to continue?'
  setPoolMasterModalMessage: 'Vuoi continuare?',

  // Original text: 'Create network'
  newNetworkCreate: 'Crea rete',

  // Original text: 'Interface'
  newNetworkInterface: 'Interfaccia',

  // Original text: 'Name'
  newNetworkName: 'Nome',

  // Original text: 'Description'
  newNetworkDescription: 'Descrizione',

  // Original text: 'VLAN'
  newNetworkVlan: 'VLAN',

  // Original text: 'No VLAN if empty'
  newNetworkDefaultVlan: 'Nessuna VLAN se vuota',

  // Original text: 'MTU'
  newNetworkMtu: 'MTU',

  // Original text: 'Default: 1500'
  newNetworkDefaultMtu: 'Predefinito: 1500',

  // Original text: 'Bond mode'
  newNetworkBondMode: 'Modalità vincolo',

  // Original text: 'Info'
  newNetworkInfo: 'Informazioni',

  // Original text: 'Type'
  newNetworkType: 'Tipo',

  // Original text: 'Encapsulation'
  newNetworkEncapsulation: 'Incapsulamento',

  // Original text: 'Encrypted'
  newNetworkEncrypted: 'Criptato',

  // Original text: 'A pool can have 1 encrypted GRE network and 1 encrypted VxLAN network max'
  encryptionWarning: 'Un pool può avere 1 rete GRE crittografata e 1 rete VxLAN crittografata massima',

  // Original text: 'Please see the requirements'
  newNetworkSdnControllerTip: 'Si prega di consultare i requisiti',

  // Original text: 'Delete network'
  deleteNetwork: 'Elimina rete',

  // Original text: 'Are you sure you want to delete this network?'
  deleteNetworkConfirm: 'Sei sicuro di voler eliminare questa rete?',

  // Original text: 'This network is currently in use'
  networkInUse: 'Questa rete è attualmente in uso',

  // Original text: 'Bonded'
  pillBonded: 'Vincolato',

  // Original text: 'Bonded network'
  bondedNetwork: 'Rete legata',

  // Original text: 'Private network'
  privateNetwork: 'Rete privata',

  // Original text: 'Add pool'
  addPool: 'Aggiungi pool',

  // Original text: 'Hosts'
  hosts: 'Hosts',

  // Original text: 'No host'
  addHostNoHost: 'Nessun host',

  // Original text: 'No host selected to be added'
  addHostNoHostMessage: 'Nessun host selezionato da aggiungere',

  // Original text: 'Xen Orchestra server'
  xenOrchestraServer: 'Server Xen Orchestra',

  // Original text: 'Xen Orchestra web client'
  xenOrchestraWeb: 'Client web Xen Orchestra',

  // Original text: 'Professional support missing!'
  noProSupport: 'Manca il supporto professionale!',

  // Original text: 'Want to use in production?'
  productionUse: 'Vuoi usare in produzione?',

  // Original text: 'Get pro support with the Xen Orchestra Appliance at {website}'
  getSupport: 'Ottieni supporto professionale con Xen Orchestra Appliance su {website}',

  // Original text: 'Bug Tracker'
  bugTracker: 'Bug Tracker',

  // Original text: 'Issues? Report it!'
  bugTrackerText: 'Segnalalo!',

  // Original text: 'Community'
  community: 'Comunità',

  // Original text: 'Join our community forum!'
  communityText: 'Unisciti al nostro forum della comunità!',

  // Original text: 'Free Trial for Premium Edition!'
  freeTrial: 'Prova gratuita per Premium Edition!',

  // Original text: 'Request your trial now!'
  freeTrialNow: 'Richiedi la tua prova ora!',

  // Original text: 'Any issue?'
  issues: 'Qualsiasi problema?',

  // Original text: 'Problem? Contact us!'
  issuesText: 'Problema? Contattaci!',

  // Original text: 'Documentation'
  documentation: 'Documentazione',

  // Original text: 'Read our official doc'
  documentationText: 'Leggi il nostro documento ufficiale',

  // Original text: 'Pro support included'
  proSupportIncluded: 'Supporto professionale incluso',

  // Original text: 'Access your XO Account'
  xoAccount: 'Accedi al tuo XO Account',

  // Original text: 'Report a problem'
  openTicket: 'Segnala un problema',

  // Original text: 'Problem? Open a ticket!'
  openTicketText: 'Problema? Apri un ticket!',

  // Original text: 'Upgrade needed'
  upgradeNeeded: 'Aggiornamento necessario',

  // Original text: 'Upgrade now!'
  upgradeNow: 'Aggiorna ora!',

  // Original text: 'Or'
  or: 'O',

  // Original text: 'Try it for free!'
  tryIt: 'Provalo gratuitamente!',

  // Original text: 'This feature is available starting from {plan} Edition'
  availableIn: "Questa funzione è disponibile a partire dall'edizione {plan}",

  // Original text: 'This feature is not available in your version, contact your administrator to know more.'
  notAvailable:
    'Questa funzione non è disponibile nella tua versione, contatta il tuo amministratore per saperne di più.',

  // Original text: 'Registration'
  registration: 'Registrazione',

  // Original text: 'Settings'
  settings: 'Impostazioni',

  // Original text: 'Proxy settings'
  proxySettings: 'Impostazioni proxy',

  // Original text: 'Host (myproxy.example.org)'
  proxySettingsHostPlaceHolder: 'Host (myproxy.example.org)',

  // Original text: 'Port (eg: 3128)'
  proxySettingsPortPlaceHolder: 'Porta (ad esemio: 3128)',

  // Original text: 'Username'
  proxySettingsUsernamePlaceHolder: 'Nome utente',

  // Original text: 'Password'
  proxySettingsPasswordPlaceHolder: 'Parola chiave',

  // Original text: 'Your email account'
  updateRegistrationEmailPlaceHolder: 'Il tuo account e-mail',

  // Original text: 'Your password'
  updateRegistrationPasswordPlaceHolder: 'La tua parola chiave',

  // Original text: 'Troubleshooting documentation'
  updaterTroubleshootingLink: 'Documentazione per la risoluzione dei problemi',

  // Original text: 'Update'
  update: 'Aggiornare',

  // Original text: 'Refresh'
  refresh: 'Ricaricare',

  // Original text: 'Upgrade'
  upgrade: 'Aggiornamento',

  // Original text: 'Downgrade'
  downgrade: 'Retrocedere',

  // Original text: 'Please consider subscribing and trying it with all the features for free during 15 days on {link}.'
  considerSubscribe:
    "Ti preghiamo di prendere in considerazione l'abbonamento e provarlo con tutte le funzionalità gratuitamente per 15 giorni su {link}.",

  // Original text: 'Current version:'
  currentVersion: 'Versione attuale:',

  // Original text: 'Register'
  register: 'Registrati',

  // Original text: 'Edit registration'
  editRegistration: 'Modifica registrazione',

  // Original text: 'Please, take time to register in order to enjoy your trial.'
  trialRegistration: 'Per favore, prenditi del tempo per registrarti per goderti la tua prova.',

  // Original text: 'Start trial'
  trialStartButton: 'Inizia la prova',

  // Original text: 'You can use a trial version until {date, date, medium}. Upgrade your appliance to get it.'
  trialAvailableUntil: 'Aggiorna il tuo dispositivo per ottenerlo.',

  // Original text: 'Your trial has been ended. Contact us or downgrade to Free version'
  trialConsumed: 'Contattaci o effettua il downgrade alla versione gratuita',

  // Original text: 'Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service.'
  trialLocked: 'Il tuo XOA non può funzionare completamente senza connettersi a questo servizio.',

  // Original text: 'No update information available'
  noUpdateInfo: 'Nessuna informazione di aggiornamento disponibile',

  // Original text: 'Update information may be available'
  waitingUpdateInfo: "Informazioni sull'aggiornamento potrebbero essere disponibili",

  // Original text: 'Your XOA is up-to-date'
  upToDate: 'Il tuo XOA è aggiornato',

  // Original text: 'You need to update your XOA (new version is available)'
  mustUpgrade: 'Devi aggiornare il tuo XOA (è disponibile una nuova versione)',

  // Original text: 'Your XOA is not registered for updates'
  registerNeeded: 'Il tuo XOA non è registrato per gli aggiornamenti',

  // Original text: "Can't fetch update information"
  updaterError: 'Impossibile recuperare le informazioni di aggiornamento',

  // Original text: 'Upgrade successful'
  promptUpgradeReloadTitle: 'Aggiornamento eseguito correttamente',

  // Original text: 'Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?'
  promptUpgradeReloadMessage:
    "Il tuo XOA è stato aggiornato correttamente e il tuo browser deve ricaricare l'applicazione. Vuoi ricaricare ora?",

  // Original text: 'Upgrade warning'
  upgradeWarningTitle: 'Avviso di aggiornamento',

  // Original text: 'You have some backup jobs in progress. If you upgrade now, these jobs will be interrupted! Are you sure you want to continue?'
  upgradeWarningMessage:
    "Sono in corso alcuni processi di backup. Se esegui l'aggiornamento adesso, questi lavori verranno interrotti! Sei sicuro di voler continuare?",

  // Original text: 'Release channels'
  releaseChannels: 'Canali di rilascio',

  // Original text: 'unlisted channel'
  unlistedChannel: 'canale non elencato',

  // Original text: 'Unlisted channel name'
  unlistedChannelName: 'Nome del canale non in elenco',

  // Original text: 'Select channel'
  selectChannel: 'Seleziona canale',

  // Original text: 'Change channel'
  changeChannel: 'Cambia canale',

  // Original text: 'The Web updater, the release channels and the proxy settings are available in XOA.'
  updaterCommunity: "L'aggiornamento Web, i canali di rilascio e le impostazioni proxy sono disponibili in XOA.",

  // Original text: 'XOA build:'
  xoaBuild: 'XOA build:',

  // Original text: 'Xen Orchestra from the sources'
  disclaimerTitle: 'Stai usando XO dai sorgenti!',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: 'Stai usando XO dai sorgenti! È fantastico per un uso personale/non lucrativo.',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: "Se sei un'azienda, è meglio utilizzarlo con il nostro supporto appliance + pro incluso:",

  // Original text: 'This version is not bundled with any support nor updates. Use it with caution.'
  disclaimerText3: 'Questa versione non è fornita con alcun supporto né aggiornamento. Usalo con cautela.',

  // Original text: 'You are not registered. Your XOA may not be up to date.'
  notRegisteredDisclaimerInfo: 'Non sei registrato Il tuo XOA potrebbe non essere aggiornato.',

  // Original text: 'Click here to create an account.'
  notRegisteredDisclaimerCreateAccount: 'Clicca qui per creare un account.',

  // Original text: 'Click here to register and update your XOA.'
  notRegisteredDisclaimerRegister: 'Fai clic qui per registrarti e aggiornare il tuo XOA.',

  // Original text: 'Connect PIF'
  connectPif: 'Collega PIF',

  // Original text: 'Are you sure you want to connect this PIF?'
  connectPifConfirm: 'Sei sicuro di voler collegare questo PIF?',

  // Original text: 'Disconnect PIF'
  disconnectPif: 'Scollega PIF',

  // Original text: 'Are you sure you want to disconnect this PIF?'
  disconnectPifConfirm: 'Sei sicuro di voler disconnettere questo PIF?',

  // Original text: 'Delete PIF'
  deletePif: 'Elimina PIF',

  // Original text: 'Are you sure you want to delete this PIF?'
  deletePifConfirm: 'Sei sicuro di voler eliminare questo PIF?',

  // Original text: 'Delete PIFs'
  deletePifs: 'Elimina PIF',

  // Original text: 'Are you sure you want to delete {nPifs, number} PIF{nPifs, plural, one {} other {s}}?'
  deletePifsConfirm: 'Sei sicuro di voler eliminare {nPifs, number} PIF{nPifs, plural, one {} other {s}}?',

  // Original text: 'Connected'
  pifConnected: 'Collegato',

  // Original text: 'Disconnected'
  pifDisconnected: 'Scollegato',

  // Original text: 'Physically connected'
  pifPhysicallyConnected: 'Fisicamente connesso',

  // Original text: 'Physically disconnected'
  pifPhysicallyDisconnected: 'Disconnessione fisica',

  // Original text: 'Username'
  username: 'Nome utente',

  // Original text: 'Password'
  password: 'Parola chiave',

  // Original text: 'Language'
  language: 'Linguaggio',

  // Original text: 'Old password'
  oldPasswordPlaceholder: 'Vecchia parola chiave',

  // Original text: 'New password'
  newPasswordPlaceholder: 'Nuova parola chiave',

  // Original text: 'Confirm new password'
  confirmPasswordPlaceholder: 'Conferma la nuova parola chiave',

  // Original text: 'Confirmation password incorrect'
  confirmationPasswordError: 'Parola chiave di conferma errata',

  // Original text: 'Password does not match the confirm password.'
  confirmationPasswordErrorBody: 'La parola chiave non corrisponde alla parola chiave di conferma.',

  // Original text: 'Password changed'
  pwdChangeSuccess: 'Parola chiave cambiata',

  // Original text: 'Your password has been successfully changed.'
  pwdChangeSuccessBody: 'La tua parola chiave è stata cambiata con successo.',

  // Original text: 'Incorrect password'
  pwdChangeError: 'Parola chiave errata',

  // Original text: 'The old password provided is incorrect. Your password has not been changed.'
  pwdChangeErrorBody: 'La tua parola chiave non è stata cambiata',

  // Original text: 'OK'
  changePasswordOk: 'ok',

  // Original text: 'Forget all connection tokens'
  forgetTokens: 'Dimentica tutti i token di connessione',

  // Original text: 'This will prevent other clients from authenticating with existing tokens but will not kill active sessions'
  forgetTokensExplained:
    'Ciò impedirà ad altri client di autenticarsi con token esistenti ma non ucciderà le sessioni attive',

  // Original text: 'Successfully forgot connection tokens'
  forgetTokensSuccess: 'Token di connessione dimenticati correttamente',

  // Original text: 'Error while forgetting connection tokens'
  forgetTokensError: 'Errore durante la dimenticanza dei token di connessione',

  // Original text: 'SSH keys'
  sshKeys: 'Chiavi SSH',

  // Original text: 'New SSH key'
  newSshKey: 'Nuova chiave SSH',

  // Original text: 'Delete'
  deleteSshKey: 'Elimina',

  // Original text: 'Delete selected SSH keys'
  deleteSshKeys: 'Elimina le chiavi SSH selezionate',

  // Original text: 'New SSH key'
  newSshKeyModalTitle: 'Nuova chiave SSH',

  // Original text: 'Invalid key'
  sshKeyErrorTitle: 'Chiave non valida',

  // Original text: 'An SSH key requires both a title and a key.'
  sshKeyErrorMessage: 'Una chiave SSH richiede sia un titolo che una chiave.',

  // Original text: 'Title'
  title: 'Titolo',

  // Original text: 'Key'
  key: 'Chiave',

  // Original text: 'Delete SSH key'
  deleteSshKeyConfirm: 'Elimina chiave SSH',

  // Original text: 'Are you sure you want to delete the SSH key {title}?'
  deleteSshKeyConfirmMessage: 'Sei sicuro di voler eliminare la chiave SSH {title}?',

  // Original text: 'Delete SSH key{nKeys, plural, one {} other {s}}'
  deleteSshKeysConfirm: 'Elimina chiav{nKeys, plural, one {e} other {i}} SSH',

  // Original text: 'Are you sure you want to delete {nKeys, number} SSH key{nKeys, plural, one {} other {s}}?'
  deleteSshKeysConfirmMessage:
    'Sei sicuro di voler eliminare {nKeys, number} chiav{nKeys, plural, one {e} other {i}} SSH?',

  // Original text: 'Add OTP authentication'
  addOtpConfirm: 'Aggiungi autenticazione OTP',

  // Original text: 'Are you sure you want to add OTP authentication?'
  addOtpConfirmMessage: "Sei sicuro di voler aggiungere l'autenticazione OTP?",

  // Original text: 'Remove OTP authentication'
  removeOtpConfirm: 'Rimuovi autenticazione OTP',

  // Original text: 'Are you sure you want to remove OTP authentication?'
  removeOtpConfirmMessage: "Sei sicuro di voler rimuovere l'autenticazione OTP?",

  // Original text: 'OTP authentication'
  OtpAuthentication: 'Autenticazione OTP',

  // Original text: '{nOthers, number} other{nOthers, plural, one {} other {s}}'
  others: '{nOthers, number} altr{nOthers, plural, one {o} other {i}}',

  // Original text: 'User'
  logUser: 'Utente',

  // Original text: 'Message'
  logMessage: 'Messaggio',

  // Original text: 'Use XCP-ng to get rid of restrictions'
  logSuggestXcpNg: 'Usa XCP-ng per sbarazzarti delle restrizioni',

  // Original text: 'This is a XenServer/XCP-ng error'
  logXapiError: 'Questo è un errore XenServer/XCP-ng',

  // Original text: 'Error'
  logError: 'Errore',

  // Original text: 'Logs'
  logTitle: 'Logs',

  // Original text: 'Display details'
  logDisplayDetails: 'Visualizza i dettagli',

  // Original text: 'Download log'
  logDownload: 'Scarica il registro',

  // Original text: 'Date'
  logTime: 'Data',

  // Original text: 'Delete log'
  logDelete: 'Elimina registro',

  // Original text: 'Delete logs'
  logsDelete: 'Elimina registri',

  // Original text: 'Job ID'
  logsJobId: 'ID lavoro',

  // Original text: 'Job name'
  logsJobName: 'Nome del lavoro',

  // Original text: 'Backup time'
  logsBackupTime: 'Tempo di backup',

  // Original text: 'Restore time'
  logsRestoreTime: 'Tempo di ripristino',

  // Original text: 'Copy log to clipboard'
  copyLogToClipboard: 'Copia il registro negli appunti',

  // Original text: 'VM not found!'
  logsVmNotFound: 'VM non trovata!',

  // Original text: 'Click to show error'
  logsFailedRestoreError: "Fai clic per mostrare l'errore",

  // Original text: 'Restore error'
  logsFailedRestoreTitle: 'Errore di ripristino',

  // Original text: 'Delete log{nLogs, plural, one {} other {s}}'
  logDeleteMultiple: 'Elimina registr{nLogs, plural, one {o} other {i}}',

  // Original text: 'Are you sure you want to delete {nLogs, number} log{nLogs, plural, one {} other {s}}?'
  logDeleteMultipleMessage: 'Vuoi eliminare {nLogs, number} log{nLogs, plural, one {o} other {i}}?',

  // Original text: 'Click to enable'
  logIndicationToEnable: 'Fai clic per abilitare',

  // Original text: 'Click to disable'
  logIndicationToDisable: 'Fai clic per disabilitare',

  // Original text: 'Report a bug'
  reportBug: 'Segnalare un bug',

  // Original text: 'Job canceled to protect the VDI chain'
  unhealthyVdiChainError: 'Lavoro annullato per proteggere la catena VDI',

  // Original text: "Restart VM's backup"
  backupRestartVm: 'Riavvia il backup della VM',

  // Original text: "Force restart VM's backup"
  backupForceRestartVm: 'Forza il riavvio del backup della VM',

  // Original text: "Restart failed VMs' backup"
  backupRestartFailedVms: 'Riavvio del backup delle VMs non riuscito',

  // Original text: "Force restart failed VMs' backup"
  backupForceRestartFailedVms: 'Forza riavvio backup delle VM non riuscito',

  // Original text: 'Click for more information'
  clickForMoreInformation: 'Fai clic per maggiori informazioni',

  // Original text: 'Name'
  ipPoolName: 'Nome',

  // Original text: 'IPs'
  ipPoolIps: 'IPs',

  // Original text: 'Networks'
  ipPoolNetworks: 'Reti',

  // Original text: 'No IP pools'
  ipsNoIpPool: 'Nessun IP pool',

  // Original text: 'Create'
  ipsCreate: 'Creare',

  // Original text: 'VIFs'
  ipsVifs: 'VIFs',

  // Original text: 'Not used'
  ipsNotUsed: 'Non usato',

  // Original text: 'unknown VIF'
  ipPoolUnknownVif: 'VIF sconosciuto',

  // Original text: 'Name already exists'
  ipPoolNameAlreadyExists: 'Il nome esiste già',

  // Original text: 'Keyboard shortcuts'
  shortcutModalTitle: 'Tasti rapidi',

  // Original text: 'Global'
  shortcut_XoApp: 'Globale',

  // Original text: 'Go to hosts list'
  shortcut_XoApp_GO_TO_HOSTS: "Vai all'elenco degli hosts",

  // Original text: 'Go to pools list'
  shortcut_XoApp_GO_TO_POOLS: "Vai all'elenco dei pool",

  // Original text: 'Go to VMs list'
  shortcut_XoApp_GO_TO_VMS: "Vai all'elenco VM",

  // Original text: 'Go to SRs list'
  shortcut_XoApp_GO_TO_SRS: "Vai all'elenco SR",

  // Original text: 'Create a new VM'
  shortcut_XoApp_CREATE_VM: 'Crea una nuova VM',

  // Original text: 'Unfocus field'
  shortcut_XoApp_UNFOCUS: 'Campo sfocato',

  // Original text: 'Show shortcuts key bindings'
  shortcut_XoApp_HELP: 'Mostra scorciatoie da tastiera',

  // Original text: 'Home'
  shortcut_Home: 'Home',

  // Original text: 'Focus search bar'
  shortcut_Home_SEARCH: 'Barra di ricerca del focus',

  // Original text: 'Next item'
  shortcut_Home_NAV_DOWN: 'Elemento successivo',

  // Original text: 'Previous item'
  shortcut_Home_NAV_UP: 'Elemento precedente',

  // Original text: 'Select item'
  shortcut_Home_SELECT: 'Scegliere elemento',

  // Original text: 'Open'
  shortcut_Home_JUMP_INTO: 'Aperto',

  // Original text: 'Supported tables'
  shortcut_SortedTable: 'Tabelle supportate',

  // Original text: 'Focus the table search bar'
  shortcut_SortedTable_SEARCH: 'Mettere a fuoco la barra di ricerca della tabella',

  // Original text: 'Next item'
  shortcut_SortedTable_NAV_DOWN: 'Elemento successivo',

  // Original text: 'Previous item'
  shortcut_SortedTable_NAV_UP: 'Elemento precedente',

  // Original text: 'Select item'
  shortcut_SortedTable_SELECT: 'Scegliere elemento',

  // Original text: 'Action'
  shortcut_SortedTable_ROW_ACTION: 'Azione',

  // Original text: 'VM'
  settingsAclsButtonTooltipVM: 'VM',

  // Original text: 'Hosts'
  settingsAclsButtonTooltiphost: 'Hosts',

  // Original text: 'Pool'
  settingsAclsButtonTooltippool: 'Pool',

  // Original text: 'SR'
  settingsAclsButtonTooltipSR: 'SR',

  // Original text: 'Network'
  settingsAclsButtonTooltipnetwork: 'Rete',

  // Original text: 'Template'
  settingsCloudConfigTemplate: 'Modello',

  // Original text: 'Delete cloud config{nCloudConfigs, plural, one {} other {s}}'
  confirmDeleteCloudConfigsTitle: 'Elimina cloud configurazion{nCloudConfigs, plural, one {e} other {i}}',

  // Original text: 'Are you sure you want to delete {nCloudConfigs, number} cloud config{nCloudConfigs, plural, one {} other {s}}?'
  confirmDeleteCloudConfigsBody:
    'Sei sicuro di voler eliminare {nCloudConfigs, number} cloud configurazion{nCloudConfigs, plural, one {e} other {i}}?',

  // Original text: 'Delete cloud config'
  deleteCloudConfig: 'Elimina configurazione cloud',

  // Original text: 'Edit cloud config'
  editCloudConfig: 'Modifica configurazione cloud',

  // Original text: 'Delete selected cloud configs'
  deleteSelectedCloudConfigs: 'Elimina le configurazioni cloud selezionate',

  // Original text: 'No config file selected'
  noConfigFile: 'Nessun file di configurazione selezionato',

  // Original text: 'Try dropping a config file here or click to select a config file to upload.'
  importTip:
    'Prova a rilasciare un file di configurazione qui o fai clic per selezionare un file di configurazione da caricare.',

  // Original text: 'Config'
  config: 'Configurazione',

  // Original text: 'Import'
  importConfig: 'Importare',

  // Original text: 'Config file successfully imported'
  importConfigSuccess: 'File di configurazione importato correttamente',

  // Original text: 'Error while importing config file'
  importConfigError: "Errore durante l'importazione del file di configurazione",

  // Original text: 'Export'
  exportConfig: 'Esportare',

  // Original text: 'Download current config'
  downloadConfig: 'Scarica la configurazione corrente',

  // Original text: 'Reconnect all hosts'
  srReconnectAllModalTitle: 'Riconnetti tutti gli hosts',

  // Original text: 'This will reconnect this SR to all its hosts.'
  srReconnectAllModalMessage: 'Ciò ricollegherà questo SR a tutti i suoi host.',

  // Original text: 'Disconnect all hosts'
  srDisconnectAllModalTitle: 'Disconnetti tutti gli hosts',

  // Original text: 'This will disconnect this SR from all its hosts.'
  srDisconnectAllModalMessage: 'Questo disconnetterà questo SR da tutti i suoi hosts.',

  // Original text: 'This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR).'
  srsDisconnectAllModalMessage:
    'Ciò disconnetterà ogni SR selezionato dal suo host (SR locale) o da tutti gli hosts del suo pool (SR condiviso).',

  // Original text: 'Forget SR'
  srForgetModalTitle: 'Dimentica SR',

  // Original text: 'Forget selected SRs'
  srsForgetModalTitle: 'Dimentica i SRs selezionati',

  // Original text: "Are you sure you want to forget this SR? VDIs on this storage won't be removed."
  srForgetModalMessage: 'Sei sicuro di voler dimenticare questo SR? I VDI su questo deposito non verranno rimossi.',

  // Original text: "Are you sure you want to forget all the selected SRs? VDIs on these storages won't be removed."
  srsForgetModalMessage:
    'Sei sicuro di voler dimenticare tutti gli SR selezionati? I VDI su questi depositi non verranno rimossi.',

  // Original text: 'Disconnected'
  srAllDisconnected: 'Scollegato',

  // Original text: 'Partially connected'
  srSomeConnected: 'Parzialmente collegato',

  // Original text: 'Connected'
  srAllConnected: 'Collegato',

  // Original text: 'Migrate selected VDIs'
  migrateSelectedVdis: 'Migrare i VDI selezionati',

  // Original text: 'All the VDIs attached to a VM must either be on a shared SR or on the same host (local SR) for the VM to be able to start.'
  migrateVdiMessage:
    'Tutti i VDI collegati a una VM devono trovarsi su un SR condiviso o sullo stesso host (SR locale) affinché la VM possa avviarsi.',

  // Original text: 'XOSAN'
  xosanTitle: 'XOSAN',

  // Original text: 'Suggestions'
  xosanSuggestions: 'Suggerimenti',

  // Original text: 'Warning: using disperse layout is not recommended right now. Please read {link}.'
  xosanDisperseWarning: 'Si prega di leggere {link}.',

  // Original text: 'Name'
  xosanName: 'Nome',

  // Original text: 'Host'
  xosanHost: 'Host',

  // Original text: 'Connected Hosts'
  xosanHosts: 'Host collegati',

  // Original text: 'Pool'
  xosanPool: 'Pool',

  // Original text: 'Size'
  xosanSize: 'Dimensione',

  // Original text: 'Used space'
  xosanUsedSpace: 'Spazio usato',

  // Original text: 'License'
  license: 'Licenza',

  // Original text: 'This XOSAN has more than 1 license!'
  xosanMultipleLicenses: 'Questo XOSAN ha più di 1 licenza!',

  // Original text: 'XOSAN pack needs to be installed and up to date on each host of the pool.'
  xosanNeedPack: 'Il pacchetto XOSAN deve essere installato e aggiornato su ogni host del pool.',

  // Original text: 'Install it now!'
  xosanInstallIt: 'Installarlo ora!',

  // Original text: 'Some hosts need their toolstack to be restarted before you can create an XOSAN'
  xosanNeedRestart: 'Alcuni hosts necessitano di riavviare il loro toolstack prima di poter creare un XOSAN',

  // Original text: 'Restart toolstacks'
  xosanRestartAgents: 'Riavvia toolstacks',

  // Original text: 'Select no more than 1 SR per host'
  xosanSrOnSameHostMessage: 'Selezionare non più di 1 SR per host',

  // Original text: 'Layout'
  xosanLayout: 'Disposizione',

  // Original text: 'Redundancy'
  xosanRedundancy: 'Ridondanza',

  // Original text: 'Capacity'
  xosanCapacity: 'Capacità',

  // Original text: 'Available space'
  xosanAvailableSpace: 'Spazio disponibile',

  // Original text: '* Can fail without data loss'
  xosanDiskLossLegend: '* Può fallire senza perdita di dati',

  // Original text: 'Create'
  xosanCreate: 'Creare',

  // Original text: 'XOSAN is available in XOA'
  xosanCommunity: 'XOSAN è disponibile in XOA',

  // Original text: 'New'
  xosanNew: 'Nuovo',

  // Original text: 'Advanced'
  xosanAdvanced: 'Avanzati',

  // Original text: 'Remove subvolumes'
  xosanRemoveSubvolumes: 'Rimuovi sottovolumi',

  // Original text: 'Add subvolume…'
  xosanAddSubvolume: 'Aggiungi volume secondario…',

  // Original text: "This version of XOSAN SR is from the first beta phase. You can keep using it, but to modify it you'll have to save your disks and re-create it."
  xosanWarning:
    'Questa versione di XOSAN SR è della prima fase beta. Puoi continuare a usarlo, ma per modificarlo dovrai salvare i tuoi dischi e ricrearli.',

  // Original text: 'VLAN'
  xosanVlan: 'VLAN',

  // Original text: 'No XOSAN found'
  xosanNoSrs: 'Nessun XOSAN trovato',

  // Original text: 'Some SRs are detached from the XOSAN'
  xosanPbdsDetached: 'Alcuni SR sono scollegati da XOSAN',

  // Original text: 'Something is wrong with: {badStatuses}'
  xosanBadStatus: 'Qualcosa non va: {badStatuses}',

  // Original text: 'Running'
  xosanRunning: 'In esecuzione',

  // Original text: 'Update packs'
  xosanUpdatePacks: 'Pacchetti di aggiornamento',

  // Original text: 'Checking for updates'
  xosanPackUpdateChecking: 'Verifica aggiornamenti',

  // Original text: 'Error while checking XOSAN packs. Please make sure that the Cloud plugin is installed and loaded, and that the updater is reachable.'
  xosanPackUpdateError:
    'Assicurati che il plug-in Cloud sia installato e caricato e che il programma di aggiornamento sia raggiungibile.',

  // Original text: 'XOSAN resources are unavailable'
  xosanPackUpdateUnavailable: 'Le risorse XOSAN non sono disponibili',

  // Original text: 'Not registered for XOSAN resources'
  xosanPackUpdateUnregistered: 'Non registrato per le risorse XOSAN',

  // Original text: "✓ This pool's XOSAN packs are up to date!"
  xosanPackUpdateUpToDate: '✓ I pacchetti XOSAN di questo pool sono aggiornati!',

  // Original text: 'Update pool with latest pack v{version}'
  xosanPackUpdateVersion: "Pool di aggiornamento con l'ultimo pacchetto v{versione}",

  // Original text: 'Delete XOSAN'
  xosanDelete: 'Elimina XOSAN',

  // Original text: 'Fix'
  xosanFixIssue: 'fix',

  // Original text: 'Creating XOSAN on {pool}'
  xosanCreatingOn: 'Creazione di XOSAN su {pool}',

  // Original text: 'Configuring network…'
  xosanState_configuringNetwork: 'Configurazione della rete…',

  // Original text: 'Importing VM…'
  xosanState_importingVm: 'Importazione delle VMs…',

  // Original text: 'Copying VMs…'
  xosanState_copyingVms: 'Copia delle VMs…',

  // Original text: 'Configuring VMs…'
  xosanState_configuringVms: 'Configurazione delle VMs…',

  // Original text: 'Configuring gluster…'
  xosanState_configuringGluster: 'Configurazione dello gluster…',

  // Original text: 'Creating SR…'
  xosanState_creatingSr: 'Creazione dello SR…',

  // Original text: 'Scanning SR…'
  xosanState_scanningSr: 'Scansione SR…',

  // Original text: 'Install XOA plugin first'
  xosanInstallCloudPlugin: 'Installare prima il plugin XOA',

  // Original text: 'Load XOA plugin first'
  xosanLoadCloudPlugin: 'Carica prima il plugin XOA',

  // Original text: 'No compatible XOSAN pack found for your XenServer versions.'
  xosanNoPackFound: 'Nessun pacchetto XOSAN compatibile trovato per le tue versioni XenServer.',

  // Original text: 'Some XOSAN Virtual Machines are not running'
  xosanVmsNotRunning: 'Alcune VMs XOSAN non sono in esecuzione',

  // Original text: 'Some XOSAN Virtual Machines could not be found'
  xosanVmsNotFound: 'Impossibile trovare alcune VMs XOSAN',

  // Original text: 'Files needing healing'
  xosanFilesNeedingHealing: 'File che necessitano di guarigione',

  // Original text: 'Some XOSAN Virtual Machines have files needing healing'
  xosanFilesNeedHealing: 'Alcune VMs XOSAN hanno file che richiedono cure',

  // Original text: 'Host {hostName} is not in XOSAN network'
  xosanHostNotInNetwork: "L'host {hostName} non si trova nella rete XOSAN",

  // Original text: 'VM controller'
  xosanVm: 'Controller VM',

  // Original text: 'SR'
  xosanUnderlyingStorage: 'SR',

  // Original text: 'Replace…'
  xosanReplace: 'Sostituire…',

  // Original text: 'On same VM'
  xosanOnSameVm: 'Sulla stessa macchina virtuale',

  // Original text: 'Brick name'
  xosanBrickName: 'Nome del brick',

  // Original text: 'Brick UUID'
  xosanBrickUuid: 'Brick UUID',

  // Original text: 'Brick size'
  xosanBrickSize: 'Dimensione del brick',

  // Original text: 'Memory size'
  xosanMemorySize: 'Dimensione delle memoria',

  // Original text: 'Status'
  xosanStatus: 'Stato',

  // Original text: 'Arbiter'
  xosanArbiter: 'Arbitro',

  // Original text: 'Used Inodes'
  xosanUsedInodes: 'Inodi usati',

  // Original text: 'Block size'
  xosanBlockSize: 'Dimensione del blocco',

  // Original text: 'Device'
  xosanDevice: 'Dispositivo',

  // Original text: 'FS name'
  xosanFsName: 'Nome FS',

  // Original text: 'Mount options'
  xosanMountOptions: 'Opzioni di montaggio',

  // Original text: 'Path'
  xosanPath: 'Percorso',

  // Original text: 'Job'
  xosanJob: 'Lavoro',

  // Original text: 'PID'
  xosanPid: 'PID',

  // Original text: 'Port'
  xosanPort: 'Porta',

  // Original text: 'Missing values'
  xosanReplaceBrickErrorTitle: 'Valori mancanti',

  // Original text: 'You need to select a SR and a size'
  xosanReplaceBrickErrorMessage: 'Devi selezionare un SR e una dimensione',

  // Original text: 'Bad values'
  xosanAddSubvolumeErrorTitle: 'Valori errati',

  // Original text: 'You need to select {nSrs, number} and a size'
  xosanAddSubvolumeErrorMessage: 'Devi selezionare {nSrs, number} e una dimensione',

  // Original text: 'Select {nSrs, number} SRs'
  xosanSelectNSrs: 'Seleziona {nSrs, number} SR',

  // Original text: 'Run'
  xosanRun: 'Execuzione',

  // Original text: 'Remove'
  xosanRemove: 'Rimuovere',

  // Original text: 'Volume'
  xosanVolume: 'Volume',

  // Original text: 'Volume options'
  xosanVolumeOptions: 'Opzioni volume',

  // Original text: 'Could not find VM'
  xosanCouldNotFindVm: 'Impossibile trovare la VM',

  // Original text: 'Using {usage}'
  xosanUnderlyingStorageUsage: 'Utilizzando {usage}',

  // Original text: 'Custom IP network (/24)'
  xosanCustomIpNetwork: 'Rete IP personalizzata (/ 24)',

  // Original text: 'Will configure the host xosan network device with a static IP address and plug it in.'
  xosanIssueHostNotInNetwork:
    'Configurerà il dispositivo di rete xosan host con un indirizzo IP statico e lo collegherà.',

  // Original text: 'Hub'
  hubPage: 'Hub',

  // Original text: 'Hub is available in XOA'
  hubCommunity: 'Hub è disponibile in XOA',

  // Original text: 'The selected pool has no default SR'
  noDefaultSr: 'Il pool selezionato non ha SR predefinito',

  // Original text: 'VM installed successfully'
  successfulInstall: 'VM installata correttamente',

  // Original text: 'No VMs available '
  vmNoAvailable: 'Nessuna VM disponibile',

  // Original text: 'Create'
  create: 'Creare',

  // Original text: 'Resource alert'
  hubResourceAlert: 'Avviso sulle risorse',

  // Original text: 'OS'
  os: 'OS',

  // Original text: 'Version'
  version: 'Versione',

  // Original text: 'Size'
  size: 'Dimensione',

  // Original text: 'Total disk size'
  totalDiskSize: 'Dimensione totale del disco',

  // Original text: 'Already installed templates are hidden'
  hideInstalledPool: 'I modelli già installati sono nascosti',

  // Original text: 'XVA import'
  hubImportNotificationTitle: 'Importazione XVA',

  // Original text: 'No description available for this template'
  hubTemplateDescriptionNotAvailable: 'Nessuna descrizione disponibile per questo modello',

  // Original text: 'Recipe created successfully'
  recipeCreatedSuccessfully: 'Ricetta creata con successo',

  // Original text: 'View created VMs'
  recipeViewCreatedVms: 'Visualizza VMs create',

  // Original text: 'Templates'
  templatesLabel: 'Modelli',

  // Original text: 'Recipes'
  recipesLabel: 'Ricette',

  // Original text: 'Network'
  network: 'Rete',

  // Original text: 'Master name'
  recipeMasterNameLabel: 'Nome Master',

  // Original text: 'Number of nodes'
  recipeNumberOfNodesLabel: 'Numero di nodi',

  // Original text: 'SSH key'
  recipeSshKeyLabel: 'Chiave SSH',

  // Original text: 'Action/Event'
  auditActionEvent: 'Azione/Evento',

  // Original text: 'The record ({ id }) was altered ({ n, number } valid records)'
  auditAlteredRecord: 'Il record ({id}) è stato modificato ({n, number} record validi)',

  // Original text: 'Check integrity'
  auditCheckIntegrity: "Verifica l'integrità",

  // Original text: 'Copy fingerprint to clipboard'
  auditCopyFingerprintToClipboard: "Copia l'impronta digitale negli Appunti",

  // Original text: 'Generate a new fingerprint'
  auditGenerateNewFingerprint: 'Genera una nuova impronta digitale',

  // Original text: 'The record ({ id }) is missing ({ n, number } valid records)'
  auditMissingRecord: 'Manca il record ({id}) ({n, number} record validi)',

  // Original text: 'Fingerprint'
  auditEnterFingerprint: 'Impronta digitale',

  // Original text: "Enter the saved fingerprint to check the previous logs' integrity. If you don't have any, click OK."
  auditEnterFingerprintInfo:
    "Immettere l'impronta digitale salvata per verificare l'integrità dei registri precedenti.",

  // Original text: 'Audit record'
  auditRecord: 'Registro di audit',

  // Original text: 'Integrity verified'
  auditIntegrityVerified: 'Integrità verificata',

  // Original text: 'Keep this fingerprint to be able to check the integrity of the current records later.'
  auditSaveFingerprintInfo:
    "Conservare questa impronta digitale per poter verificare in seguito l'integrità dei record correnti.",

  // Original text: 'However, if you trust the current state of the records, keep this fingerprint to be able to check their integrity later.'
  auditSaveFingerprintInErrorInfo:
    "Tuttavia, se ti fidi dell'attuale stato dei record, mantieni questa impronta digitale per poterne verificare l'integrità in un secondo tempo.",

  // Original text: 'New fingerprint'
  auditNewFingerprint: 'Nuova impronta digitale',

  // Original text: 'Download records'
  downloadAuditRecords: 'Scarica i record',

  // Original text: 'Display record'
  displayAuditRecord: 'Visualizza record',

  // Original text: 'No audit record available'
  noAuditRecordAvailable: 'Nessun record di controllo disponibile',

  // Original text: 'Refresh records list'
  refreshAuditRecordsList: "Aggiorna l'elenco dei record",

  // Original text: 'You are not registered and therefore will not be able to create or manage your XOSAN SRs. {link}'
  xosanUnregisteredDisclaimer:
    'Non sei registrato e pertanto non sarai in grado di creare o gestire i tuoi XOSAN SR. {link}',

  // Original text: 'In order to create a XOSAN SR, you need to use the Xen Orchestra Appliance and buy a XOSAN license on {link}.'
  xosanSourcesDisclaimer:
    'Per creare un XOSAN SR, è necessario utilizzare Xen Orchestra Appliance e acquistare una licenza XOSAN su {link}.',

  // Original text: 'Register now!'
  registerNow: 'Iscriviti ora!',

  // Original text: 'You need to register your appliance to manage your licenses.'
  licensesUnregisteredDisclaimer: "È necessario registrare l'appliance per gestire le licenze.",

  // Original text: 'Product'
  licenseProduct: 'Prodotto',

  // Original text: 'Purchaser'
  licensePurchaser: 'Acquirente',

  // Original text: 'Expires'
  licenseExpires: 'Scade',

  // Original text: 'You'
  licensePurchaserYou: 'Tu',

  // Original text: 'Support'
  productSupport: 'Supporto',

  // Original text: 'No XOSAN attached'
  licenseNotBoundXosan: 'XOSAN non collegato',

  // Original text: 'License attached to an unknown XOSAN'
  licenseBoundUnknownXosan: 'Licenza allegata a un XOSAN sconosciuto',

  // Original text: 'Manage the licenses'
  licensesManage: 'Gestisci le licenze',

  // Original text: 'New license'
  newLicense: 'Nuova licenza',

  // Original text: 'Refresh'
  refreshLicenses: 'Ricaricare',

  // Original text: 'Limited size because XOSAN is in trial'
  xosanLicenseRestricted: 'Dimensioni limitate perché XOSAN è in prova',

  // Original text: 'You need a license on this SR to manage the XOSAN.'
  xosanAdminNoLicenseDisclaimer: 'Per gestire XOSAN è necessaria una licenza su questo SR.',

  // Original text: 'Your XOSAN license has expired. You can still use the SR but cannot administrate it anymore.'
  xosanAdminExpiredLicenseDisclaimer:
    'La tua licenza XOSAN è scaduta. È ancora possibile utilizzare SR ma non è più possibile gestirlo.',

  // Original text: 'Could not check the license on this XOSAN SR'
  xosanCheckLicenseError: 'Impossibile verificare la licenza su questo XOSAN SR',

  // Original text: 'Could not fetch licenses'
  getLicensesError: 'Impossibile recuperare le licenze',

  // Original text: 'License has expired.'
  licenseHasExpired: 'La licenza è scaduta.',

  // Original text: 'License bound to another XOA'
  licenseBoundToOtherXoa: 'Licenza vincolata a un altro XOA',

  // Original text: 'This license is active on this XOA'
  licenseBoundToThisXoa: 'Questa licenza è attiva su questo XOA',

  // Original text: 'License expires on {date}.'
  licenseExpiresDate: 'La licenza scade il {date}.',

  // Original text: 'Update the license now!'
  updateLicenseMessage: 'Aggiorna subito la licenza!',

  // Original text: 'Unknown XOSAN SR.'
  xosanUnknownSr: 'XOSAN SR sconosciuto.',

  // Original text: 'Contact us!'
  contactUs: 'Contattaci!',

  // Original text: 'No license.'
  xosanNoLicense: 'Nessuna licenza.',

  // Original text: 'Unlock now!'
  unlockNow: 'Sblocca ora!',

  // Original text: 'Select a license'
  selectLicense: 'Seleziona una licenza',

  // Original text: 'Bind license'
  bindLicense: 'Licenza vincolante',

  // Original text: 'expires on {date}'
  expiresOn: 'scade il {date}',

  // Original text: 'Install XOA plugin first'
  xosanInstallXoaPlugin: 'Installare prima il plugin XOA',

  // Original text: 'Load XOA plugin first'
  xosanLoadXoaPlugin: 'Carica prima il plugin XOA',

  // Original text: 'Activate license'
  bindXoaLicense: 'Attiva la licenza',

  // Original text: 'Are you sure you want to activate this license on your XOA? This action is not reversible!'
  bindXoaLicenseConfirm: 'Questa azione non è reversibile!',

  // Original text: 'activate {licenseType} license'
  bindXoaLicenseConfirmText: 'attiva la licenza {licenseType}',

  // Original text: 'Update needed'
  updateNeeded: 'Aggiornamento necessario',

  // Original text: 'Starter license'
  starterLicense: 'Licenza di avviamento',

  // Original text: 'Enterprise license'
  enterpriseLicense: 'Licenza Enterprise',

  // Original text: 'Premium license'
  premiumLicense: 'Licenza Premium',

  // Original text: 'Forget prox{n, plural, one {y} other {ies}}'
  forgetProxyApplianceTitle: 'Dimentica prox{n, plural, one {y} other {ies}}',

  // Original text: 'Are you sure you want to forget {n, number} prox{n, plural, one {y} other {ies}}?'
  forgetProxyApplianceMessage: 'Sei sicuro di voler dimenticare {n, number} prox{n, plural, one {y} other {ies}}?',

  // Original text: 'Forget proxy(ies)'
  forgetProxies: 'Dimentica i proxy',

  // Original text: 'Destroy prox{n, plural, one {y} other {ies}}'
  destroyProxyApplianceTitle: 'Distruggi prox{n, plural, one {y} other {ies}}',

  // Original text: 'Are you sure you want to destroy {n, number} prox{n, plural, one {y} other {ies}}?'
  destroyProxyApplianceMessage: 'Sei sicuro di voler distruggere {n, number} prox{n, plural, one {y} other {ies}}?',

  // Original text: 'Destroy proxy(ies)'
  destroyProxies: 'Distruggi i prox(ies)',

  // Original text: 'Deploy a proxy'
  deployProxy: 'Distribuire un proxy',

  // Original text: 'Redeploy proxy'
  redeployProxy: 'Ridistribuire il proxy',

  // Original text: 'Redeploy this proxy'
  redeployProxyAction: 'Ridistribuire questo proxy',

  // Original text: 'This action will destroy the old proxy VM'
  redeployProxyWarning: 'Questa azione distruggerà la vecchia VM proxy',

  // Original text: 'No proxies available'
  noProxiesAvailable: 'Nessun proxy disponibile',

  // Original text: 'Test your proxy'
  checkProxyHealth: 'Metti alla prova il tuo proxy',

  // Original text: 'upgrade the appliance'
  upgradeProxyAppliance: "aggiornare l'appliance",

  // Original text: 'Test passed for {name}'
  proxyTestSuccess: 'Test OK per {name}',

  // Original text: 'The proxy appears to work correctly'
  proxyTestSuccessMessage: 'Il proxy sembra funzionare correttamente',

  // Original text: 'Click to see linked remotes'
  proxyLinkedRemotes: 'Fai clic per vedere i remoti collegati',

  // Original text: 'Click to see linked backups'
  proxyLinkedBackups: 'Fare clic per visualizzare i backup collegati',

  // Original text: 'Default to: {dns}'
  proxyNetworkDnsPlaceHolder: "L'impostazione predefinita è: {dns}",

  // Original text: 'Default to: {netmask}'
  proxyNetworkNetmaskPlaceHolder: "L'impostazione predefinita è: {netmask}",

  // Original text: 'The select only contains SRs connected to at least one HVM-capable host'
  proxySrPredicateInfo: 'La selezione contiene solo SR collegati ad almeno un host abilitato per HVM',

  // Original text: '{seconds, plural, one {# second} other {# seconds}}'
  secondsFormat: '{seconds, plural, one {# secondo} other {# secondi}}',

  // Original text: '{days, plural, =0 {} one {# day } other {# days }}{hours, plural, =0 {} one {# hour } other {# hours }}{minutes, plural, =0 {} one {# minute } other {# minutes }}{seconds, plural, =0 {} one {# second} other {# seconds}}'
  durationFormat:
    '{days, plural, =0 {} one {# giorno } other {# giorni }}{hours, plural, =0 {} one {# ora } other {# ore }}{minutes, plural, =0 {} one {# minuto } other {# minuti }}{seconds, plural, =0 {} one {# secondo} other {# secondi}}',
}
