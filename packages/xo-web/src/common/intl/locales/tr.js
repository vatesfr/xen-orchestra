// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/tr'

import reactIntlData from 'react-intl/locale-data/tr'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: "{key}: {value}"
  keyValue: '{key}: {value}',

  // Original text: "Connecting"
  statusConnecting: 'Bağlanıyor',

  // Original text: "Disconnected"
  statusDisconnected: 'Bağlantı kesildi',

  // Original text: "Loading…"
  statusLoading: 'Yükleniyor...',

  // Original text: "Page not found"
  errorPageNotFound: 'Sayfa bulunamadı',

  // Original text: "no such item"
  errorNoSuchItem: 'Böyle bir öğe yok',

  // Original text: 'unknown item'
  errorUnknownItem: undefined,

  // Original text: "Long click to edit"
  editableLongClickPlaceholder: 'Düzenlemek için uzun tıklayın',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'Düzenlemek için tıklayın',

  // Original text: "Browse files"
  browseFiles: 'Dosyaları tara',

  // Original text: "Show logs"
  showLogs: 'Günlüğü göster',

  // Original text: "OK"
  alertOk: 'Tamam',

  // Original text: "OK"
  confirmOk: 'Tamam',

  // Original text: "Cancel"
  genericCancel: 'İptal',

  // Original text: "Enter the following text to confirm:"
  enterConfirmText: 'Onaylamak için aşağıdaki metni girin:',

  // Original text: "On error"
  onError: 'Hata durumunda',

  // Original text: "Successful"
  successful: 'Başarılı',

  // Original text: "Managed disks"
  filterOnlyManaged: 'Yönetilen diskler',

  // Original text: "Orphaned disks"
  filterOnlyOrphaned: 'Yetim diskler',

  // Original text: "Normal disks"
  filterOnlyRegular: 'Normal diskler',

  // Original text: "Snapshot disks"
  filterOnlySnapshots: 'Snapshot diskleri',

  // Original text: "Unmanaged disks"
  filterOnlyUnmanaged: 'Yönetilmeyen diskler',

  // Original text: "Save…"
  filterSaveAs: 'Kaydet...',

  // Original text: "Explore the search syntax in the documentation"
  filterSyntaxLinkTooltip: 'Dokümanlarda arama sözdizimini keşfedin',

  // Original text: "Connected VIFs"
  filterVifsOnlyConnected: "Bağlı VIF'ler",

  // Original text: "Disconnected VIFs"
  filterVifsOnlyDisconnected: "Bağlı olmayan VIF'ler",

  // Original text: "Connected remotes"
  filterRemotesOnlyConnected: 'Bağlı hedefler',

  // Original text: "Disconnected remotes"
  filterRemotesOnlyDisconnected: 'Bağlı olmayan hedefler',

  // Original text: "Copy to clipboard"
  copyToClipboard: 'Panoya kopyala',

  // Original text: 'Copy {uuid}'
  copyUuid: undefined,

  // Original text: "Master"
  pillMaster: 'Master',

  // Original text: "Home"
  homePage: 'Ana sayfa',

  // Original text: "VMs"
  homeVmPage: "VM'ler",

  // Original text: "Hosts"
  homeHostPage: 'Sunucular',

  // Original text: "Pools"
  homePoolPage: 'Havuzlar',

  // Original text: "Templates"
  homeTemplatePage: 'Kalıplar',

  // Original text: "Storages"
  homeSrPage: 'Depolama birimleri',

  // Original text: "Dashboard"
  dashboardPage: 'Gösterge paneli ',

  // Original text: "Overview"
  overviewDashboardPage: 'Genel görünüm',

  // Original text: "Visualizations"
  overviewVisualizationDashboardPage: 'Görselleştirmeler',

  // Original text: "Statistics"
  overviewStatsDashboardPage: 'İstatistikler',

  // Original text: "Health"
  overviewHealthDashboardPage: 'Sağlık',

  // Original text: "Self service"
  selfServicePage: 'Self servis',

  // Original text: "Backup"
  backupPage: 'Yedekleme',

  // Original text: "Jobs"
  jobsPage: 'İşler',

  // Original text: "XOA"
  xoaPage: 'XOA',

  // Original text: "Updates"
  updatePage: 'Güncellemeler',

  // Original text: "Licenses"
  licensesPage: 'Lisanslar',

  // Original text: "Settings"
  settingsPage: 'Ayarlar',

  // Original text: "Servers"
  settingsServersPage: 'Sunucular',

  // Original text: "Users"
  settingsUsersPage: 'Kullanıcılar',

  // Original text: "Groups"
  settingsGroupsPage: 'Gruplar',

  // Original text: "ACLs"
  settingsAclsPage: "ACL'ler",

  // Original text: "Plugins"
  settingsPluginsPage: 'Eklentiler',

  // Original text: "Logs"
  settingsLogsPage: 'Günlükler',

  // Original text: 'Cloud configs'
  settingsCloudConfigsPage: undefined,

  // Original text: "IPs"
  settingsIpsPage: "IP'ler",

  // Original text: "About"
  aboutPage: 'Hakkında',

  // Original text: "About XO {xoaPlan}"
  aboutXoaPlan: 'XO {xoaPlan} hakkında',

  // Original text: "New"
  newMenu: 'Yeni',

  // Original text: "Tasks"
  taskMenu: 'Görevler',

  // Original text: "Tasks"
  taskPage: 'Görevler',

  // Original text: "VM"
  newVmPage: 'VM',

  // Original text: "Storage"
  newSrPage: 'Depolama birimi',

  // Original text: "Server"
  newServerPage: 'Sunucu',

  // Original text: "Import"
  newImport: 'İçe aktar',

  // Original text: "XOSAN"
  xosan: 'XOSAN',

  // Original text: 'Warning: Backup is deprecated, use Backup NG instead.'
  backupDeprecatedMessage: undefined,

  // Original text: 'How to migrate to Backup NG'
  backupMigrationLink: undefined,

  // Original text: 'Create a new backup with Backup NG'
  backupNgNewPage: undefined,

  // Original text: "Overview"
  backupOverviewPage: 'Genel bakış',

  // Original text: "New"
  backupNewPage: 'Yeni',

  // Original text: "Remotes"
  backupRemotesPage: 'Hedefler',

  // Original text: "Restore"
  backupRestorePage: 'Geri yükle',

  // Original text: "File restore"
  backupFileRestorePage: 'Dosya geri yükle',

  // Original text: "Schedule"
  schedule: 'Zamanlama',

  // Original text: "New VM backup"
  newVmBackup: 'Yeni VM yedekleme',

  // Original text: "Edit VM backup"
  editVmBackup: 'VM yedekleme düzenle',

  // Original text: "Backup"
  backup: 'Yedekleme',

  // Original text: "Rolling Snapshot"
  rollingSnapshot: 'Snapshot döngüsü',

  // Original text: "Delta Backup"
  deltaBackup: 'Fark yedekleme',

  // Original text: "Disaster Recovery"
  disasterRecovery: 'Felaket kurtarma',

  // Original text: "Continuous Replication"
  continuousReplication: 'Sürekli replikasyon',

  // Original text: "Overview"
  jobsOverviewPage: 'Genel bakış',

  // Original text: "New"
  jobsNewPage: 'Yeni',

  // Original text: "Scheduling"
  jobsSchedulingPage: 'Zamanlama',

  // Original text: "Custom Job"
  customJob: 'Özel iş',

  // Original text: "User"
  userPage: 'Kullanıcı',

  // Original text: "XOA"
  xoa: 'XOA',

  // Original text: "No support"
  noSupport: 'Destek yok',

  // Original text: "Free upgrade!"
  freeUpgrade: 'Bedava yükseltme!',

  // Original text: "Sign out"
  signOut: 'Oturumu kapat',

  // Original text: "Edit my settings {username}"
  editUserProfile: 'Ayarlarımı düzenle {username}',

  // Original text: "Fetching data…"
  homeFetchingData: 'Veri getiriliyor...',

  // Original text: "Welcome to Xen Orchestra!"
  homeWelcome: "Xen Orchestra'ya Hoşgeldiniz!",

  // Original text: "Add your XCP-ng hosts or pools"
  homeWelcomeText: 'XenServer sunucu veya havuzunu ekle',

  // Original text: "Some XCP-ng hosts have been registered but are not connected"
  homeConnectServerText: "Bazı XenServer'lar kayıtlı ama bağlı değil",

  // Original text: "Want some help?"
  homeHelp: 'Yardım ister misin?',

  // Original text: "Add server"
  homeAddServer: 'Sunucu ekle',

  // Original text: "Connect servers"
  homeConnectServer: 'Bağlı sunucular',

  // Original text: "Online Doc"
  homeOnlineDoc: 'Çevrimiçi Doküman',

  // Original text: "Pro Support"
  homeProSupport: 'Profesyonel Destek',

  // Original text: "There are no VMs!"
  homeNoVms: 'Hiç VM yok',

  // Original text: "Or…"
  homeNoVmsOr: 'Veya...',

  // Original text: "Import VM"
  homeImportVm: 'VM içe aktar',

  // Original text: "Import an existing VM in xva format"
  homeImportVmMessage: "Varolan bir VM'i xva formatından içe aktar",

  // Original text: "Restore a backup"
  homeRestoreBackup: 'Bir yedeği geri yükle',

  // Original text: "Restore a backup from a remote store"
  homeRestoreBackupMessage: 'Bir yedeği uzak depodan geri yükle',

  // Original text: "This will create a new VM"
  homeNewVmMessage: 'Bu yeni bir VM oluşturacak',

  // Original text: "Filters"
  homeFilters: 'Filtreler',

  // Original text: "No results! Click here to reset your filters"
  homeNoMatches: 'Sonuç yok! Filtreyi sıfırlamak için buraya tıklayın',

  // Original text: "Pool"
  homeTypePool: 'Havuz',

  // Original text: "Host"
  homeTypeHost: 'Sunucu',

  // Original text: "VM"
  homeTypeVm: 'VM',

  // Original text: "SR"
  homeTypeSr: 'SR',

  // Original text: "Template"
  homeTypeVmTemplate: 'Kalıp',

  // Original text: "Sort"
  homeSort: 'Sırala',

  // Original text: "Pools"
  homeAllPools: 'Havuzlar',

  // Original text: "Hosts"
  homeAllHosts: 'Sunucular',

  // Original text: "Tags"
  homeAllTags: 'Etiketler',

  // Original text: "Resource sets"
  homeAllResourceSets: 'Kaynak setleri',

  // Original text: "New VM"
  homeNewVm: 'Yeni VM',

  // Original text: "None"
  homeFilterNone: 'Yok',

  // Original text: "Running hosts"
  homeFilterRunningHosts: 'Çalışan sunucular',

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: 'Devre dışı sunucular',

  // Original text: "Running VMs"
  homeFilterRunningVms: "Çalışan VM'ler",

  // Original text: "Non running VMs"
  homeFilterNonRunningVms: "Çalışmayan VM'ler",

  // Original text: "Pending VMs"
  homeFilterPendingVms: "Askıdaki VM'ler",

  // Original text: "HVM guests"
  homeFilterHvmGuests: 'HVM konuklar',

  // Original text: "Tags"
  homeFilterTags: 'Etiketler',

  // Original text: "Sort by"
  homeSortBy: 'Sırala',

  // Original text: "CPUs"
  homeSortByCpus: "CPU'lar",

  // Original text: "Name"
  homeSortByName: 'İsim',

  // Original text: "Power state"
  homeSortByPowerstate: 'Güç durumu',

  // Original text: "RAM"
  homeSortByRAM: 'RAM',

  // Original text: "Shared/Not shared"
  homeSortByShared: 'Paylaşımlı/Paylaşımsız',

  // Original text: "Size"
  homeSortBySize: 'Boyut',

  // Original text: "Type"
  homeSortByType: 'Tip',

  // Original text: "Usage"
  homeSortByUsage: 'Kullanım',

  // Original text: "vCPUs"
  homeSortByvCPUs: "vCPU'lar",

  // Original text: "Snapshots"
  homeSortVmsBySnapshots: "Snapshot'lar",

  // Original text: 'Container'
  homeSortByContainer: undefined,

  // Original text: 'Pool'
  homeSortByPool: undefined,

  // Original text: "{displayed, number}x {icon} (on {total, number})"
  homeDisplayedItems: '{displayed, number}x {icon} (on {total, number})',

  // Original text: "{selected, number}x {icon} selected (on {total, number})"
  homeSelectedItems: '{selected, number}x {icon} selected (on {total, number})',

  // Original text: "More"
  homeMore: 'Daha fazla',

  // Original text: "Migrate to…"
  homeMigrateTo: 'Taşı...',

  // Original text: "Missing patches"
  homeMissingPatches: 'Eksik yamalar',

  // Original text: "Master:"
  homePoolMaster: 'Master:',

  // Original text: "Resource set: {resourceSet}"
  homeResourceSet: 'Kaynak seti: {resourceSet}',

  // Original text: "High Availability"
  highAvailability: 'Yüksek kullanılabilirlik',

  // Original text: "Shared {type}"
  srSharedType: 'Paylaşımlı {type}',

  // Original text: "Not shared {type}"
  srNotSharedType: 'Paylaşımsız {type}',

  // Original text: "All of them are selected"
  sortedTableAllItemsSelected: 'Hepsi seçildi ({nItems, number})',

  // Original text: "No items found"
  sortedTableNoItems: 'Hiç öğe bulunamadı',

  // Original text: "{nFiltered, number} of {nTotal, number} items"
  sortedTableNumberOfFilteredItems: '{nTotal, number} öğeden {nFiltered, number}',

  // Original text: "{nTotal, number} items"
  sortedTableNumberOfItems: '{nTotal, number} öğe',

  // Original text: "{nSelected, number} selected"
  sortedTableNumberOfSelectedItems: '{nSelected, number} seçildi',

  // Original text: "Click here to select all items"
  sortedTableSelectAllItems: 'Bütün öğeleri seçmek için buraya tıklayın',

  // Original text: 'State'
  state: undefined,

  // Original text: 'Disabled'
  stateDisabled: undefined,

  // Original text: 'Enabled'
  stateEnabled: undefined,

  // Original text: 'Cancel'
  formCancel: undefined,

  // Original text: 'Create'
  formCreate: undefined,

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
  add: 'Ekle',

  // Original text: "Select all"
  selectAll: 'Hepsini seç',

  // Original text: "Remove"
  remove: 'Kaldır',

  // Original text: "Preview"
  preview: 'Örnek',

  // Original text: "Action"
  action: 'Aksiyon',

  // Original text: "Item"
  item: 'Öğe',

  // Original text: "No selected value"
  noSelectedValue: 'Seçilmiş değer yok',

  // Original text: "Choose user(s) and/or group(s)"
  selectSubjects: 'Kullanıcı(ları) ve/veya grub(ları) seç',

  // Original text: "Select Object(s)…"
  selectObjects: 'Nesne(leri) seç...',

  // Original text: "Choose a role"
  selectRole: 'Bir rol seç',

  // Original text: "Select Host(s)…"
  selectHosts: 'Sunucu(ları) seç...',

  // Original text: "Select object(s)…"
  selectHostsVms: 'Nesne(leri) seç...',

  // Original text: "Select Network(s)…"
  selectNetworks: 'Ağ(ları) seç...',

  // Original text: "Select PIF(s)…"
  selectPifs: 'PIF(leri) seç...',

  // Original text: "Select Pool(s)…"
  selectPools: 'Havuz(ları) seç...',

  // Original text: "Select Remote(s)…"
  selectRemotes: 'Hedef(leri) seç...',

  // Original text: "Select resource set(s)…"
  selectResourceSets: 'Kaynak seti(lerini) seç...',

  // Original text: "Select template(s)…"
  selectResourceSetsVmTemplate: 'Kalıp(ları) seç...',

  // Original text: "Select SR(s)…"
  selectResourceSetsSr: 'SR(leri) seç...',

  // Original text: "Select network(s)…"
  selectResourceSetsNetwork: 'Ağ(ları) seç...',

  // Original text: "Select disk(s)…"
  selectResourceSetsVdi: 'Disk(leri) seç...',

  // Original text: "Select SSH key(s)…"
  selectSshKey: 'SSH anahtarı(larını) seç...',

  // Original text: "Select SR(s)…"
  selectSrs: 'SR(leri) seç...',

  // Original text: "Select VM(s)…"
  selectVms: 'VM(leri) seç...',

  // Original text: "Select snapshot(s)…"
  selectVmSnapshots: 'Snapshot(ları) seç...',

  // Original text: "Select VM template(s)…"
  selectVmTemplates: 'VM kalıbı(ları) seç...',

  // Original text: "Select tag(s)…"
  selectTags: 'Etiket(leri) seç...',

  // Original text: "Select disk(s)…"
  selectVdis: 'Disk(leri) seç...',

  // Original text: "Select timezone…"
  selectTimezone: 'Saat dilimini seç...',

  // Original text: "Select IP(s)…"
  selectIp: 'IP(leri) seç...',

  // Original text: "Select IP pool(s)…"
  selectIpPool: 'IP havuzu(larını) seç...',

  // Original text: "Select VGPU type(s)…"
  selectVgpuType: 'VGPU tipi(lerini)seç...',

  // Original text: "Fill required information."
  fillRequiredInformations: 'Gerekli bilgileri doldur.',

  // Original text: "Fill information (optional)"
  fillOptionalInformations: 'Bilgileri doldur (opsiyonel)',

  // Original text: "Reset"
  selectTableReset: 'Sıfırla',

  // Original text: 'Select Cloud Config(s)…'
  selectCloudConfigs: undefined,

  // Original text: "Month"
  schedulingMonth: 'Ay',

  // Original text: "Every N month"
  schedulingEveryNMonth: 'N ayda bir',

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: 'Seçilen aylarda',

  // Original text: "Day"
  schedulingDay: 'Gün',

  // Original text: "Every N day"
  schedulingEveryNDay: 'N günde bir',

  // Original text: "Each selected day"
  schedulingEachSelectedDay: 'Seçilen günlerde',

  // Original text: "Switch to week days"
  schedulingSetWeekDayMode: 'Haftanın günlerine çevir',

  // Original text: "Switch to month days"
  schedulingSetMonthDayMode: 'Ayın günlerine çevir',

  // Original text: "Hour"
  schedulingHour: 'Saat',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: 'Seçilen saatlerde',

  // Original text: "Every N hour"
  schedulingEveryNHour: 'N saatte bir',

  // Original text: "Minute"
  schedulingMinute: 'Dakika',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: 'Seçilen dakikalarda',

  // Original text: "Every N minute"
  schedulingEveryNMinute: 'N dakikada bir',

  // Original text: "Every month"
  selectTableAllMonth: 'Her ay',

  // Original text: "Every day"
  selectTableAllDay: 'Her gün',

  // Original text: "Every hour"
  selectTableAllHour: 'Her saat',

  // Original text: "Every minute"
  selectTableAllMinute: 'Her dakika',

  // Original text: "Reset"
  schedulingReset: 'Sıfırla',

  // Original text: "Unknown"
  unknownSchedule: 'Bilinmeyen',

  // Original text: "Web browser timezone"
  timezonePickerUseLocalTime: 'Tarayıcı kaynaklı saat dilimi',

  // Original text: "Server timezone ({value})"
  serverTimezoneOption: 'Sunucu saat dilimi ({value})',

  // Original text: "Cron Pattern:"
  cronPattern: 'Cron kalıbı:',

  // Original text: "Cannot edit backup"
  backupEditNotFoundTitle: 'Yedekleme düzenlenemiyor',

  // Original text: "Missing required info for edition"
  backupEditNotFoundMessage: 'Sürüm için gerekli bilgi eksik',

  // Original text: "Successful"
  successfulJobCall: 'Başarılı',

  // Original text: "Failed"
  failedJobCall: 'Başarısız',

  // Original text: "Skipped"
  jobCallSkipped: 'Atlandı',

  // Original text: "In progress"
  jobCallInProgess: 'Devam ediyor',

  // Original text: "Transfer size:"
  jobTransferredDataSize: 'Transfer boyutu',

  // Original text: "Transfer speed:"
  jobTransferredDataSpeed: 'Transfer hızı',

  // Original text: 'Size'
  operationSize: undefined,

  // Original text: 'Speed'
  operationSpeed: undefined,

  // Original text: 'Type'
  exportType: undefined,

  // Original text: "Merge size:"
  jobMergedDataSize: 'Birleştirme boyutu',

  // Original text: "Merge speed:"
  jobMergedDataSpeed: 'Birleştrime hızı',

  // Original text: "All"
  allJobCalls: 'Hepsi',

  // Original text: "Job"
  job: 'İş',

  // Original text: "Job {job}"
  jobModalTitle: 'İş {job}',

  // Original text: "ID"
  jobId: 'ID',

  // Original text: "Type"
  jobType: 'Tip',

  // Original text: "Name"
  jobName: 'İsim',

  // Original text: "Mode"
  jobMode: 'Mod',

  // Original text: "Name of your job (forbidden: \"_\")"
  jobNamePlaceholder: 'İşin adı (yasak: "_")',

  // Original text: "Start"
  jobStart: 'Başla',

  // Original text: "End"
  jobEnd: 'Son',

  // Original text: "Duration"
  jobDuration: 'Süre',

  // Original text: "Status"
  jobStatus: 'Durum',

  // Original text: "Action"
  jobAction: 'Aksiyon',

  // Original text: "Tag"
  jobTag: 'Etiket',

  // Original text: "Scheduling"
  jobScheduling: 'Zamanlama',

  // Original text: "Timezone"
  jobTimezone: 'Saat dilimi',

  // Original text: "Server"
  jobServerTimezone: 'Sunucu',

  // Original text: "Run job"
  runJob: 'İşi çalıştır',

  // Original text: 'Cancel job'
  cancelJob: undefined,

  // Original text: "Are you sure you want to run {backupType} {id} ({tag})?"
  runJobConfirm: '{backupType} {id} ({tag} işini çalıştırmak istediğinize emin misiniz?',

  // Original text: "One shot running started. See overview for logs."
  runJobVerbose: 'Tek seferlik çalıştırma başladı. Günlükler için genel görünüme bakın',

  // Original text: "Edit job"
  jobEdit: 'İşi düzenle',

  // Original text: "Delete"
  jobDelete: 'Sil',

  // Original text: "Finished"
  jobFinished: 'Tamamlandı',

  // Original text: "Interrupted"
  jobInterrupted: 'Kesintiye uğradı',

  // Original text: "Started"
  jobStarted: 'Başladı',

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

  // Original text: 'Reason'
  taskReason: undefined,

  // Original text: "Save"
  saveBackupJob: 'Kaydet',

  // Original text: "Remove backup job"
  deleteBackupSchedule: 'Yedekleme işini kaldır',

  // Original text: "Are you sure you want to delete this backup job?"
  deleteBackupScheduleQuestion: 'Bu yedekleme işini silmek istediğinize emin misiniz?',

  // Original text: "Delete selected jobs"
  deleteSelectedJobs: 'Seçilen işleri sil',

  // Original text: "Enable immediately after creation"
  scheduleEnableAfterCreation: 'Oluşturmanın ardından hemen aktif et',

  // Original text: "You are editing Schedule {name} ({id}). Saving will override previous schedule state."
  scheduleEditMessage:
    '{name} ({id}) zamanlamasını düzenliyorsunuz. Kaydetme işlemi önceki zamanlamanın üzerine yazılacak.',

  // Original text: "You are editing job {name} ({id}). Saving will override previous job state."
  jobEditMessage: '{name} ({id}) işini düzenliyorsunuz. Kaydetme işlemi önceki işin üzerine yazılacak',

  // Original text: "Edit schedule"
  scheduleEdit: 'Zamanlamayı düzenle',

  // Original text: "A name is required to create the backup's job!"
  missingBackupName: undefined,

  // Original text: 'Missing VMs!'
  missingVms: undefined,

  // Original text: 'You need to choose a backup mode!'
  missingBackupMode: undefined,

  // Original text: 'Missing remotes!'
  missingRemotes: undefined,

  // Original text: 'Missing SRs!'
  missingSrs: undefined,

  // Original text: 'Missing schedules!'
  missingSchedules: undefined,

  // Original text: 'The Backup mode and The Delta Backup mode require export retention to be higher than 0!'
  missingExportRetention: undefined,

  // Original text: 'The CR mode and The DR mode require copy retention to be higher than 0!'
  missingCopyRetention: undefined,

  // Original text: 'The Rolling Snapshot mode requires snapshot retention to be higher than 0!'
  missingSnapshotRetention: undefined,

  // Original text: 'One of the retentions needs to be higher than 0!'
  retentionNeeded: undefined,

  // Original text: 'No remotes found, please click on the remotes settings button to create one!'
  createRemoteMessage: undefined,

  // Original text: 'Remotes settings'
  remotesSettings: undefined,

  // Original text: "Add a schedule"
  scheduleAdd: 'Zamanlama ekle',

  // Original text: "Delete"
  scheduleDelete: 'Sil',

  // Original text: "Run schedule"
  scheduleRun: 'Zamanlanmış çalıştırma',

  // Original text: "Delete selected schedules"
  deleteSelectedSchedules: 'Seçili zamanlamayı sil',

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'Zamanlanmış iş yok.',

  // Original text: 'You can delete all your legacy backup snapshots.'
  legacySnapshotsLink: undefined,

  // Original text: "New schedule"
  newSchedule: 'Yeni zamanlama',

  // Original text: "No jobs found."
  noJobs: 'İş bulunamadı',

  // Original text: "No schedules found"
  noSchedules: 'Zamanlama bulunamadı',

  // Original text: "Select a xo-server API command"
  jobActionPlaceHolder: 'Bir xo-server API komutu seç',

  // Original text: "Timeout (number of seconds after which a VM is considered failed)"
  jobTimeoutPlaceHolder: "Zaman aşımı (Bir VM'nin değerlendirilmesinin başarısız olduğu saniye sayısı)",

  // Original text: "Schedules"
  jobSchedules: 'Zamanlamalar',

  // Original text: "Name of your schedule"
  jobScheduleNamePlaceHolder: 'Zamanlamanın adı',

  // Original text: "Select a Job"
  jobScheduleJobPlaceHolder: 'Bir iş seç',

  // Original text: "Job owner"
  jobOwnerPlaceholder: 'işin sahibi',

  // Original text: "This job's creator no longer exists"
  jobUserNotFound: 'Bu işi oluşturan kullanıcı artık yok',

  // Original text: "This backup's creator no longer exists"
  backupUserNotFound: 'Bu yedeklemeyi oluşturan kullanıcı artık yok',

  // Original text: "Click here to see the matching VMs"
  redirectToMatchingVms: "Eşleşen VM'leri görmek için tıklayın",

  // Original text: 'Migrate to backup NG'
  migrateToBackupNg: undefined,

  // Original text: "There are no matching VMs!"
  noMatchingVms: 'Hiç eşleşen VM yok',

  // Original text: "{icon} See the matching VMs ({nMatchingVms, number})"
  allMatchingVms: "{icon} Eşleşen VM'leri gör ({nMatchingVms, number})",

  // Original text: "Backup owner"
  backupOwner: 'Yedeklemenin sahibi',

  // Original text: "Migrate to backup NG"
  migrateBackupSchedule: "Backup NG'ye taşı",

  // Original text: "This will migrate this backup to a backup NG. This operation is not reversible. Do you want to continue?"
  migrateBackupScheduleMessage:
    "Bu, yedeklemeyi Backup NG'ye taşıyacak. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?",

  // Original text: "Are you sure you want to run {name} ({id})?"
  runBackupNgJobConfirm: 'Çalıştırmak istediğinize emin misiniz {name} ({id})?',

  // Original text: 'Are you sure you want to cancel {name} ({id})?'
  cancelJobConfirm: undefined,

  // Original text: 'Advanced settings'
  newBackupAdvancedSettings: undefined,

  // Original text: 'Always'
  reportWhenAlways: undefined,

  // Original text: 'Failure'
  reportWhenFailure: undefined,

  // Original text: 'Never'
  reportWhenNever: undefined,

  // Original text: 'Report when'
  reportWhen: undefined,

  // Original text: 'Concurrency'
  concurrency: undefined,

  // Original text: "Select your backup type:"
  newBackupSelection: 'Yedekleme tipini seçin:',

  // Original text: "Select backup mode:"
  smartBackupModeSelection: 'Yedekleme modunu seçin:',

  // Original text: "Normal backup"
  normalBackup: 'Normal yedekleme',

  // Original text: "Smart backup"
  smartBackup: 'Akıllı yedekleme',

  // Original text: "Export retention"
  exportRetention: 'Saklanacak yedek sayısı',

  // Original text: 'Copy retention'
  copyRetention: undefined,

  // Original text: "Snapshot retention"
  snapshotRetention: 'Saklanacak snapshot sayısı',

  // Original text: "Name"
  backupName: 'Ad',

  // Original text: "Use delta"
  useDelta: 'Farkı kullan',

  // Original text: "Use compression"
  useCompression: 'Sıkıştırmayı kullan',

  // Original text: 'Offline snapshot'
  offlineSnapshot: undefined,

  // Original text: 'Shutdown VMs before snapshotting them'
  offlineSnapshotInfo: undefined,

  // Original text: "Delta Backup and DR require Entreprise plan"
  dbAndDrRequireEnterprisePlan: 'Fark Yedekleme ve DR Enterprise planı gerektirir',

  // Original text: "CR requires Premium plan"
  crRequiresPremiumPlan: 'CR Premium planı gerektirir',

  // Original text: "Smart mode"
  smartBackupModeTitle: 'Akıllı mod',

  // Original text: "Target remotes (for Export)"
  backupTargetRemotes: 'Hedefler (Yedekleme için)',

  // Original text: "Target SRs (for Replication)"
  backupTargetSrs: "Hedef SR'ler (Replikasyon için)",

  // Original text: "Local remote selected"
  localRemoteWarningTitle: 'Yerel hedef seçildi',

  // Original text: "Warning: local remotes will use limited XOA disk space. Only for advanced users."
  localRemoteWarningMessage:
    "Uyarı: yerel hedef XOA'nın disk alını ile sınırlıdır. Sadece ileri seviye kullanıcılar içindir.",

  // Original text: "Warning: this feature works only with XenServer 6.5 or newer."
  backupVersionWarning: 'Uyarı: Bu özellik yalnızca Xenserver 6.5 ve daha yeni sürümlerinde çalışır.',

  // Original text: "VMs"
  editBackupVmsTitle: "VM'ler",

  // Original text: "VMs statuses"
  editBackupSmartStatusTitle: "VM'lerin durumları",

  // Original text: "Resident on"
  editBackupSmartResidentOn: 'Üzerinde olan',

  // Original text: "Not resident on"
  editBackupSmartNotResidentOn: 'Üzerinde olmayan',

  // Original text: "Pools"
  editBackupSmartPools: 'Havuzlar',

  // Original text: "Tags"
  editBackupSmartTags: 'Etiketler',

  // Original text: "Sample of matching Vms"
  sampleOfMatchingVms: "Eşleşen VM'lerden bazıları",

  // Original text: "VMs Tags"
  editBackupSmartTagsTitle: 'VM etiketleri',

  // Original text: "Excluded VMs tags"
  editBackupSmartExcludedTagsTitle: 'Hariç tutulan VM etiketleri',

  // Original text: "Reverse"
  editBackupNot: 'Ters',

  // Original text: "Tag"
  editBackupTagTitle: 'Etiket',

  // Original text: "Report"
  editBackupReportTitle: 'Rapor',

  // Original text: "Automatically run as scheduled"
  editBackupScheduleEnabled: 'Zamanlamaya göre otomatik çalıştır',

  // Original text: "Retention"
  editBackupRetentionTitle: 'Saklama',

  // Original text: "Remote"
  editBackupRemoteTitle: 'Hedef',

  // Original text: "Delete the old backups first"
  deleteOldBackupsFirst: 'Önce eski yedekleri sil',

  // Original text: "Remote stores for backup"
  remoteList: 'Yedekleme için uzak depolar',

  // Original text: "New File System Remote"
  newRemote: 'Yeni Dosya Sistemi Hedefi',

  // Original text: "Local"
  remoteTypeLocal: 'Yerel',

  // Original text: "NFS"
  remoteTypeNfs: 'NFS',

  // Original text: "SMB"
  remoteTypeSmb: 'SMB',

  // Original text: "Type"
  remoteType: 'Tip',

  // Original text: "SMB remotes are meant to work on Windows Server. For other systems (Linux Samba, which means almost all NAS), please use NFS."
  remoteSmbWarningMessage:
    'SMB hedefler Windows Server üzerinde çalışır. Diğer sistemler için (Linux samba, neredeyse bütün NAS cihazları anlamına gelir) lütfen NFS kullanın.',

  // Original text: "Test your remote"
  remoteTestTip: 'Hedefinizi test edin',

  // Original text: "Test Remote"
  testRemote: 'Hedefi test et',

  // Original text: "Test failed for {name}"
  remoteTestFailure: '{name} için test başarısız',

  // Original text: "Test passed for {name}"
  remoteTestSuccess: '{name} için test başarılı',

  // Original text: "Error"
  remoteTestError: 'Hata',

  // Original text: "Test Step"
  remoteTestStep: 'Test Adımı',

  // Original text: "Test file"
  remoteTestFile: 'Test dosyası',

  // Original text: "Test name"
  remoteTestName: 'Test adı',

  // Original text: "Remote name already exists!"
  remoteTestNameFailure: 'Hedef ismi zaten kullanılıyor!',

  // Original text: "The remote appears to work correctly"
  remoteTestSuccessMessage: 'Hedef düzgün çalışıyor',

  // Original text: "Connection failed"
  remoteConnectionFailed: 'Bağlantı başarısız',

  // Original text: "Delete backup job{nJobs, plural, one {} other {s}}"
  confirmDeleteBackupJobsTitle: 'Yedekleme işini(lerini) sil',

  // Original text: "Are you sure you want to delete {nJobs, number} backup job{nJobs, plural, one {} other {s}}?"
  confirmDeleteBackupJobsBody: '{nJobs, number} yedekleme işini(lerini) silmek istediğinize emin misiniz?',

  // Original text: "Name"
  remoteName: 'Ad',

  // Original text: "Path"
  remotePath: 'Yol',

  // Original text: "State"
  remoteState: 'Durum',

  // Original text: "Device"
  remoteDevice: 'Cihaz',

  // Original text: "Share"
  remoteShare: 'Paylaşım',

  // Original text: "Action"
  remoteAction: 'Aksiyon',

  // Original text: "Auth"
  remoteAuth: 'Kimlik doğrulama',

  // Original text: "Mounted"
  remoteMounted: 'Takıldı',

  // Original text: "Unmounted"
  remoteUnmounted: 'Çıkarıldı',

  // Original text: "Connect"
  remoteConnectTip: 'Bağlan',

  // Original text: "Disconnect"
  remoteDisconnectTip: 'Bağlatıyı kes',

  // Original text: "Connected"
  remoteConnected: 'Bağlandı',

  // Original text: "Disconnected"
  remoteDisconnected: 'Bağlantı kesildi',

  // Original text: "Delete"
  remoteDeleteTip: 'Sil',

  // Original text: "Delete selected remotes"
  remoteDeleteSelected: 'Seçilen hedefi sil',

  // Original text: "remote name *"
  remoteNamePlaceHolder: 'hedef adı *',

  // Original text: "Name *"
  remoteMyNamePlaceHolder: 'Ad',

  // Original text: "/path/to/backup"
  remoteLocalPlaceHolderPath: '/yedek/için/yol',

  // Original text: "host *"
  remoteNfsPlaceHolderHost: 'sunucu',

  // Original text: 'Port'
  remoteNfsPlaceHolderPort: undefined,

  // Original text: "path/to/backup"
  remoteNfsPlaceHolderPath: '/yedek/için/yol',

  // Original text: "subfolder [path\\\\to\\\\backup]"
  remoteSmbPlaceHolderRemotePath: 'altdizin [yedek\\\\için\\\\yol]',

  // Original text: "Username"
  remoteSmbPlaceHolderUsername: 'Kullanıcı adı',

  // Original text: "Password"
  remoteSmbPlaceHolderPassword: 'Parola',

  // Original text: "Domain"
  remoteSmbPlaceHolderDomain: 'Domain',

  // Original text: "<address>\\\\<share> *"
  remoteSmbPlaceHolderAddressShare: '<paylaşım>\\\\<adresi>',

  // Original text: "password(fill to edit)"
  remotePlaceHolderPassword: 'parola(düzenlemek için doldurun)',

  // Original text: "Create a new SR"
  newSrTitle: 'Yeni SR oluştur',

  // Original text: "General"
  newSrGeneral: 'Genel',

  // Original text: "Select Storage Type:"
  newSrTypeSelection: 'Depolama Birimi Tipi:',

  // Original text: "Settings"
  newSrSettings: 'Ayarlar',

  // Original text: "Storage Usage"
  newSrUsage: 'Depolama birimi kullanımı',

  // Original text: "Summary"
  newSrSummary: 'Özet',

  // Original text: "Host"
  newSrHost: 'Sunucu',

  // Original text: "Type"
  newSrType: 'Tip',

  // Original text: "Name"
  newSrName: 'Ad',

  // Original text: "Description"
  newSrDescription: 'Açıklama',

  // Original text: "Server"
  newSrServer: 'Sunucu',

  // Original text: "Path"
  newSrPath: 'Yol',

  // Original text: "IQN"
  newSrIqn: 'IQN',

  // Original text: "LUN"
  newSrLun: 'LUN',

  // Original text: "No HBA devices"
  newSrNoHba: 'HBA olmayan cihaz',

  // Original text: "with auth."
  newSrAuth: 'Kimlik doğrulama ile',

  // Original text: "User Name"
  newSrUsername: 'Kullanıcı adı',

  // Original text: "Password"
  newSrPassword: 'Parola',

  // Original text: "Device"
  newSrDevice: 'Cihaz',

  // Original text: "in use"
  newSrInUse: 'kullanımda',

  // Original text: "Size"
  newSrSize: 'Boyut',

  // Original text: "Create"
  newSrCreate: 'Create',

  // Original text: "Storage name"
  newSrNamePlaceHolder: 'Depolama birimi adı',

  // Original text: "Storage description"
  newSrDescPlaceHolder: 'Depolama birimi açıklaması',

  // Original text: "Address"
  newSrAddressPlaceHolder: 'Adres',

  // Original text: "[port]"
  newSrPortPlaceHolder: '[port]',

  // Original text: "Username"
  newSrUsernamePlaceHolder: 'Kullanıcı adı',

  // Original text: "Password"
  newSrPasswordPlaceHolder: 'Parola',

  // Original text: "Device, e.g /dev/sda…"
  newSrLvmDevicePlaceHolder: 'Cihaz, örn: /dev/sda...',

  // Original text: "/path/to/directory"
  newSrLocalPathPlaceHolder: '/dizin/için/yol',

  // Original text: "Use NFSv4"
  newSrUseNfs4: 'NFSv4 kullan',

  // Original text: "Comma delimited NFS options"
  newSrNfsOptions: 'Virgülle ayrılmış NFS seçenekleri',

  // Original text: "Users/Groups"
  subjectName: 'Kullanıcılar/Gruplar',

  // Original text: "Object"
  objectName: 'Nesne',

  // Original text: "No acls found"
  aclNoneFound: 'acl bulunamadı',

  // Original text: "Role"
  roleName: 'Rol',

  // Original text: "Create"
  aclCreate: 'Oluştur',

  // Original text: "New Group Name"
  newGroupName: 'Yeni grup adı',

  // Original text: "Create Group"
  createGroup: 'Grup oluştur',

  // Original text: "Create"
  createGroupButton: 'Oluştur',

  // Original text: "Delete Group"
  deleteGroup: 'Grubu sil',

  // Original text: "Are you sure you want to delete this group?"
  deleteGroupConfirm: 'Bu grubu silmek istediğinize emin misiniz?',

  // Original text: "Remove user from Group"
  removeUserFromGroup: 'Kullanıcıyı gruptan kaldır',

  // Original text: "Are you sure you want to delete this user?"
  deleteUserConfirm: 'Bu kullanıcıyı silmek istediğinize emin misiniz?',

  // Original text: "Delete User"
  deleteUser: 'Kullanıcıyı sil',

  // Original text: "no user"
  noUser: 'kullanıcı yok',

  // Original text: "unknown user"
  unknownUser: 'bilinmeyen kullanıcı',

  // Original text: "No group found"
  noGroupFound: 'Grup bulunmadı',

  // Original text: "Name"
  groupNameColumn: 'Ad',

  // Original text: "Users"
  groupUsersColumn: 'Kullanıcılar',

  // Original text: "Add User"
  addUserToGroupColumn: 'Kullanıcı ekle',

  // Original text: "Username"
  userNameColumn: 'Kullanıcı adı',

  // Original text: "Permissions"
  userPermissionColumn: 'Yetkiler',

  // Original text: "Password"
  userPasswordColumn: 'Parola',

  // Original text: "Username"
  userName: 'Kullanıcı adı',

  // Original text: "Password"
  userPassword: 'Parola',

  // Original text: "Create"
  createUserButton: 'Oluştur',

  // Original text: "No user found"
  noUserFound: 'Kullanıcı bulunamadı',

  // Original text: "User"
  userLabel: 'Kullanıcı',

  // Original text: "Admin"
  adminLabel: 'Yönetici',

  // Original text: "No user in group"
  noUserInGroup: 'Grupta kullanıcı yok',

  // Original text: "{users, number} user{users, plural, one {} other {s}}"
  countUsers: '{users, number} kullanıcı(lar)',

  // Original text: "Select Permission"
  selectPermission: 'Yetkileri seç',

  // Original text: "No plugins found"
  noPlugins: 'Eklenti bulunamadı',

  // Original text: "Auto-load at server start"
  autoloadPlugin: 'Sunucu açılışında otomatik yükle',

  // Original text: "Save configuration"
  savePluginConfiguration: 'Yapılandırmayı kaydet',

  // Original text: "Delete configuration"
  deletePluginConfiguration: 'Yapılandırma sil',

  // Original text: "Plugin error"
  pluginError: 'Eklenti hatası',

  // Original text: "Unknown error"
  unknownPluginError: 'Bilinmeyen hata',

  // Original text: "Purge plugin configuration"
  purgePluginConfiguration: 'Eklenti yapılandırmasını temizle',

  // Original text: "Are you sure you want to purge this configuration ?"
  purgePluginConfigurationQuestion: 'Bu yapılandırmayı temizlemek istediğinize emin misiniz?',

  // Original text: "Edit"
  editPluginConfiguration: 'Düzenle',

  // Original text: "Cancel"
  cancelPluginEdition: 'İptal',

  // Original text: "Plugin configuration"
  pluginConfigurationSuccess: 'Eklenti yapılandırması',

  // Original text: "Plugin configuration successfully saved!"
  pluginConfigurationChanges: 'Eklenti yapılandırması başarıyla kaydedildi',

  // Original text: "Predefined configuration"
  pluginConfigurationPresetTitle: 'Öntanımlı yapılandırma',

  // Original text: "Choose a predefined configuration."
  pluginConfigurationChoosePreset: 'Bir öntanımlı yapılandırma seç',

  // Original text: "Apply"
  applyPluginPreset: 'Uygula',

  // Original text: "Save filter error"
  saveNewUserFilterErrorTitle: 'Filtre hatasını kaydet',

  // Original text: "Bad parameter: name must be given."
  saveNewUserFilterErrorBody: 'Kötü parametre: ad verilmeli',

  // Original text: "Name:"
  filterName: 'Ad:',

  // Original text: "Value:"
  filterValue: 'Değer:',

  // Original text: "Save new filter"
  saveNewFilterTitle: 'Yeni filtreyi kaydet',

  // Original text: "Set custom filters"
  setUserFiltersTitle: 'Özel filtreleri belirle',

  // Original text: "Are you sure you want to set custom filters?"
  setUserFiltersBody: 'Özel filtreleri belirlemek istediğinize emin misiniz?',

  // Original text: "Remove custom filter"
  removeUserFilterTitle: 'Özel filtreyi kaldır',

  // Original text: "Are you sure you want to remove custom filter?"
  removeUserFilterBody: 'Özel filtreyi kaldırmak istediğinize emin misiniz?',

  // Original text: "Default filter"
  defaultFilter: 'Varsayılan filtre',

  // Original text: "Default filters"
  defaultFilters: 'Varsayılan filtreler',

  // Original text: "Custom filters"
  customFilters: 'Özel filtreler',

  // Original text: "Customize filters"
  customizeFilters: 'Filtreleri özelleştir',

  // Original text: "Save custom filters"
  saveCustomFilters: 'Özel filtreleri kaydet',

  // Original text: "Start"
  startVmLabel: 'Çalıştır',

  // Original text: "Recovery start"
  recoveryModeLabel: 'Kurtarmayı başlat',

  // Original text: "Suspend"
  suspendVmLabel: 'Askıya al',

  // Original text: "Stop"
  stopVmLabel: 'Durdur',

  // Original text: "Force shutdown"
  forceShutdownVmLabel: 'Zorla kapat',

  // Original text: "Reboot"
  rebootVmLabel: 'Yeniden başlat',

  // Original text: "Force reboot"
  forceRebootVmLabel: 'Zorla yeniden başlat',

  // Original text: "Delete"
  deleteVmLabel: 'Sil',

  // Original text: "Migrate"
  migrateVmLabel: 'Taşı',

  // Original text: "Snapshot"
  snapshotVmLabel: 'Snapshot',

  // Original text: "Export"
  exportVmLabel: 'Dışa aktar',

  // Original text: "Resume"
  resumeVmLabel: 'Devam et',

  // Original text: "Copy"
  copyVmLabel: 'Kopyala',

  // Original text: "Clone"
  cloneVmLabel: 'Klonla',

  // Original text: "Fast clone"
  fastCloneVmLabel: 'Hızlı klonla',

  // Original text: "Convert to template"
  convertVmToTemplateLabel: 'Kalıba çevir',

  // Original text: "Console"
  vmConsoleLabel: 'Konsol',

  // Original text: "Depth"
  srUnhealthyVdiDepth: 'Derinlik',

  // Original text: "Name"
  srUnhealthyVdiNameLabel: 'Ad',

  // Original text: "Size"
  srUnhealthyVdiSize: 'Boyut',

  // Original text: "VDI to coalesce ({total, number})"
  srUnhealthyVdiTitle: 'Kaynaşma aşmasındaki VDI ({total, number})',

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
  srRescan: 'Bütün diskleri tekrar tara',

  // Original text: "Connect to all hosts"
  srReconnectAll: 'Bütün sunuculara bağla',

  // Original text: "Disconnect from all hosts"
  srDisconnectAll: 'Bütün sunuculardan bağlantıyı kes',

  // Original text: "Forget this SR"
  srForget: "Bu SR'i unut",

  // Original text: "Forget SRs"
  srsForget: "SR'leri unut",

  // Original text: "Remove this SR"
  srRemoveButton: "Bu SR'i kaldır",

  // Original text: "No VDIs in this storage"
  srNoVdis: 'Bu depolama biriminde VDI yok',

  // Original text: "Pool RAM usage:"
  poolTitleRamUsage: 'Havuz RAM kullanımı',

  // Original text: "{used} used on {total} ({free} free)"
  poolRamUsage: '{total} alanda {used} kullanılıyor ({free} boş)',

  // Original text: "Master:"
  poolMaster: 'Master:',

  // Original text: "Display all hosts of this pool"
  displayAllHosts: 'Bu havuzun tüm sunucularını göster',

  // Original text: "Display all storages of this pool"
  displayAllStorages: 'Bu havuzun tüm depolama birimlerini göster',

  // Original text: "Display all VMs of this pool"
  displayAllVMs: "Bu havuzun tüm VM'lerini göster",

  // Original text: "Hosts"
  hostsTabName: 'Sunucular',

  // Original text: "Vms"
  vmsTabName: "VM'ler",

  // Original text: "Srs"
  srsTabName: "Sr'ler",

  // Original text: 'Edit all'
  poolEditAll: undefined,

  // Original text: 'Edit remote syslog for all hosts'
  poolEditRemoteSyslog: undefined,

  // Original text: "High Availability"
  poolHaStatus: 'Yüksek kullanılabilirlik',

  // Original text: "Enabled"
  poolHaEnabled: 'Açık',

  // Original text: "Disabled"
  poolHaDisabled: 'Kapalı',

  // Original text: "GPU groups"
  poolGpuGroups: 'GPU grubu',

  // Original text: 'Logging host'
  poolRemoteSyslogPlaceHolder: undefined,

  // Original text: "Master"
  setpoolMaster: 'Master',

  // Original text: 'Remote syslog host'
  syslogRemoteHost: undefined,

  // Original text: "Name"
  hostNameLabel: 'Ad',

  // Original text: "Description"
  hostDescription: 'Açıklama',

  // Original text: "Memory"
  hostMemory: 'Bellek',

  // Original text: "No hosts"
  noHost: 'Sunucu yok',

  // Original text: "{used}% used ({free} free)"
  memoryLeftTooltip: '%{used} kullanılıyor ({free} boş)',

  // Original text: "PIF"
  pif: 'PIF',

  // Original text: "Name"
  poolNetworkNameLabel: 'Ad',

  // Original text: "Description"
  poolNetworkDescription: 'Açıklama',

  // Original text: "PIFs"
  poolNetworkPif: "PIF'ler",

  // Original text: "No networks"
  poolNoNetwork: 'Ağ yok',

  // Original text: "MTU"
  poolNetworkMTU: 'MTU',

  // Original text: "Connected"
  poolNetworkPifAttached: 'Bağlı',

  // Original text: "Disconnected"
  poolNetworkPifDetached: 'Bağlı değil',

  // Original text: "Show PIFs"
  showPifs: "PIF'leri göster",

  // Original text: "Hide PIFs"
  hidePifs: "PIF'leri gizle",

  // Original text: "Show details"
  showDetails: 'Ayrıntıları göster',

  // Original text: "Hide details"
  hideDetails: 'Ayrıntıları gizle',

  // Original text: "No stats"
  poolNoStats: 'Durum yok',

  // Original text: "All hosts"
  poolAllHosts: 'Tüm sunucular',

  // Original text: "Add SR"
  addSrLabel: 'SR ekle',

  // Original text: "Add VM"
  addVmLabel: 'VM ekle',

  // Original text: "Add Host"
  addHostLabel: 'Sunucu ekle',

  // Original text: "This host needs to install {patches, number} patch{patches, plural, one {} other {es}} before it can be added to the pool. This operation may be long."
  hostNeedsPatchUpdate: 'Havuza eklemeden önce bu sunucuya {patches, number} yama yüklenmeli. Bu işlem uzun sürebilir.',

  // Original text: "This host cannot be added to the pool because it's missing some patches."
  hostNeedsPatchUpdateNoInstall: 'Bu sunucu havuza eklenemez çünkü bazı yamaları eksik',

  // Original text: "Adding host failed"
  addHostErrorTitle: 'Sunucu ekleme başarısız',

  // Original text: "Host patches could not be homogenized."
  addHostNotHomogeneousErrorMessage: 'Sunucu yamaları homojenleştirilemedi.',

  // Original text: "Disconnect"
  disconnectServer: 'Bağlantıyı kes',

  // Original text: "Start"
  startHostLabel: 'Çalıştır',

  // Original text: "Stop"
  stopHostLabel: 'Durdur',

  // Original text: "Enable"
  enableHostLabel: 'Aktif',

  // Original text: "Disable"
  disableHostLabel: 'Pasif',

  // Original text: "Restart toolstack"
  restartHostAgent: "toolstack'ı yeniden başlat",

  // Original text: "Force reboot"
  forceRebootHostLabel: 'Zorla yeniden başlat',

  // Original text: "Reboot"
  rebootHostLabel: 'Yeniden başlat',

  // Original text: "Error while restarting host"
  noHostsAvailableErrorTitle: 'Sunucu yeniden başlatılırken hata',

  // Original text: "Some VMs cannot be migrated before restarting this host. Please try force reboot."
  noHostsAvailableErrorMessage:
    "Bazı VM'ler taşınamaz olduğu için sunucu yeniden başlatılamıyor. Zorla yeniden başlatmayı deneyin.",

  // Original text: "Error while restarting hosts"
  failHostBulkRestartTitle: 'Sunucu yeniden başlatılırken hata',

  // Original text: "{failedHosts, number}/{totalHosts, number} host{failedHosts, plural, one {} other {s}} could not be restarted."
  failHostBulkRestartMessage: '{failedHosts, number}/{totalHosts, number} sunucu yeniden başlatılamadı.',

  // Original text: "Reboot to apply updates"
  rebootUpdateHostLabel: 'Güncellemeleri uygulamak için yeniden başlat',

  // Original text: "Emergency mode"
  emergencyModeLabel: 'Acil durum modu',

  // Original text: "Storage"
  storageTabName: 'Depolama birimi',

  // Original text: "Patches"
  patchesTabName: 'Yamalar',

  // Original text: "Load average"
  statLoad: 'Ortalama yük',

  // Original text: "Host RAM usage:"
  hostTitleRamUsage: 'Sunucu RAM kullanımı:',

  // Original text: "RAM: {memoryUsed} used on {memoryTotal} ({memoryFree} free)"
  memoryHostState: 'RAM: {memoryTotal} alanda {memoryUsed} alan kullanılıyor ({memoryFree} boş)',

  // Original text: "Hardware"
  hardwareHostSettingsLabel: 'Donanım',

  // Original text: "Address"
  hostAddress: 'Adres',

  // Original text: "Status"
  hostStatus: 'Durum',

  // Original text: "Build number"
  hostBuildNumber: 'Yapım numarası',

  // Original text: "iSCSI name"
  hostIscsiName: 'iSCSI adı',

  // Original text: "Version"
  hostXenServerVersion: 'Sürüm',

  // Original text: "Enabled"
  hostStatusEnabled: 'Aktif',

  // Original text: "Disabled"
  hostStatusDisabled: 'Pasif',

  // Original text: "Power on mode"
  hostPowerOnMode: 'Power on modu',

  // Original text: "Host uptime"
  hostStartedSince: 'Sunucu çalışma süresi',

  // Original text: "Toolstack uptime"
  hostStackStartedSince: 'Toolstack çalışma süresi',

  // Original text: "CPU model"
  hostCpusModel: 'CPU modeli',

  // Original text: "GPUs"
  hostGpus: "GPU'lar",

  // Original text: "Core (socket)"
  hostCpusNumber: 'Core (soket)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: 'Üretici bilgisi',

  // Original text: "BIOS info"
  hostBiosinfo: 'BIOS bilgisi',

  // Original text: "License"
  licenseHostSettingsLabel: 'Lisans',

  // Original text: "Type"
  hostLicenseType: 'Tip',

  // Original text: "Socket"
  hostLicenseSocket: 'Soket',

  // Original text: "Expiry"
  hostLicenseExpiry: 'Zamanaşımı',

  // Original text: 'Remote syslog'
  hostRemoteSyslog: undefined,

  // Original text: "Installed supplemental packs"
  supplementalPacks: 'Yüklü ek paketler',

  // Original text: "Install new supplemental pack"
  supplementalPackNew: 'Yeni ek paket yükle',

  // Original text: "Install supplemental pack on every host"
  supplementalPackPoolNew: 'Ek paketi her sunucuya yükle',

  // Original text: "{name} (by {author})"
  supplementalPackTitle: '{name} (by {author})',

  // Original text: "Installation started"
  supplementalPackInstallStartedTitle: 'Kurulum başladı',

  // Original text: "Installing new supplemental pack…"
  supplementalPackInstallStartedMessage: 'Yeni ek paket kuruluyor...',

  // Original text: "Installation error"
  supplementalPackInstallErrorTitle: 'Kurulum hatası',

  // Original text: "The installation of the supplemental pack failed."
  supplementalPackInstallErrorMessage: 'Ek paket kurulumu başarısız oldu.',

  // Original text: "Installation success"
  supplementalPackInstallSuccessTitle: 'Kurulum başarılı',

  // Original text: "Supplemental pack successfully installed."
  supplementalPackInstallSuccessMessage: 'Ek paket başarıyla kuruldu',

  // Original text: "Add a network"
  networkCreateButton: 'Bir ağ ekle',

  // Original text: "Add a bonded network"
  networkCreateBondedButton: 'Bir bağlı ağ ekle',

  // Original text: "Device"
  pifDeviceLabel: 'Cihaz',

  // Original text: "Network"
  pifNetworkLabel: 'Ağ',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: 'Adres',

  // Original text: "Mode"
  pifModeLabel: 'Mod',

  // Original text: "MAC"
  pifMacLabel: 'MAC',

  // Original text: "MTU"
  pifMtuLabel: 'MTU',

  // Original text: "Status"
  pifStatusLabel: 'Durum',

  // Original text: "Connected"
  pifStatusConnected: 'Bağlı',

  // Original text: "Disconnected"
  pifStatusDisconnected: 'Bağlı değil',

  // Original text: "No physical interface detected"
  pifNoInterface: 'Fizisel arayüz tespit edilmedi',

  // Original text: "This interface is currently in use"
  pifInUse: 'Bu arayüz kullanımda',

  // Original text: "Action"
  pifAction: 'Aksiyon',

  // Original text: "Default locking mode"
  defaultLockingMode: 'Varsayılan kilitleme modu',

  // Original text: "Configure IP address"
  pifConfigureIp: 'IP adresini ayarla',

  // Original text: "Invalid parameters"
  configIpErrorTitle: 'Geçersiz parametre',

  // Original text: "Static IP address"
  staticIp: 'Statik IP adresi',

  // Original text: "Netmask"
  netmask: 'Ağ maskesi',

  // Original text: "DNS"
  dns: 'DNS',

  // Original text: "Gateway"
  gateway: 'Ağ geçidi',

  // Original text: "Add a storage"
  addSrDeviceButton: 'Depolama ünitesi ekle',

  // Original text: "Name"
  srNameLabel: 'Ad',

  // Original text: "Type"
  srType: 'Tip',

  // Original text: "Action"
  pbdAction: 'Aksiyon',

  // Original text: "Status"
  pbdStatus: 'Durum',

  // Original text: "Connected"
  pbdStatusConnected: 'Bağlı',

  // Original text: "Disconnected"
  pbdStatusDisconnected: 'Bağlı değil',

  // Original text: "Connect"
  pbdConnect: 'Bağlan',

  // Original text: "Disconnect"
  pbdDisconnect: 'Bağlantıyı kes',

  // Original text: "Forget"
  pbdForget: 'Unut',

  // Original text: "Shared"
  srShared: 'Paylaşımlı',

  // Original text: "Not shared"
  srNotShared: 'Paylaşımsız',

  // Original text: "No storage detected"
  pbdNoSr: 'Depolama ünitesi tespit edilmedi',

  // Original text: "Name"
  patchNameLabel: 'Ad',

  // Original text: "Install all patches"
  patchUpdateButton: 'Tüm yamaları yükle',

  // Original text: "Description"
  patchDescription: 'Açıklama',

  // Original text: 'Version'
  patchVersion: undefined,

  // Original text: "Applied date"
  patchApplied: 'Uygulanan tarih',

  // Original text: "Size"
  patchSize: 'Boyut',

  // Original text: "Status"
  patchStatus: 'Durum',

  // Original text: "Applied"
  patchStatusApplied: 'Uygulandı',

  // Original text: "Missing patches"
  patchStatusNotApplied: 'Eksik yamalar',

  // Original text: "No patches detected"
  patchNothing: 'Yama tespit edilmedi',

  // Original text: "Release date"
  patchReleaseDate: 'Yayınlanma tarihi',

  // Original text: "Guidance"
  patchGuidance: 'Yönlendirme',

  // Original text: "Action"
  patchAction: 'Aksiyon',

  // Original text: "Applied patches"
  hostAppliedPatches: 'Uygulanan yamalar',

  // Original text: "Missing patches"
  hostMissingPatches: 'Eksik yamalar',

  // Original text: "Host up-to-date!"
  hostUpToDate: 'Sunucu güncel!',

  // Original text: "Non-recommended patch install"
  installPatchWarningTitle: 'Tavsiye edilmeyen yama yüklemesi',

  // Original text: "This will install a patch only on this host. This is NOT the recommended way: please go into the Pool patch view and follow instructions there. If you are sure about this, you can continue anyway"
  installPatchWarningContent:
    'Yama yalnızca bu sunucuya yüklenecek. Bu tavsiye edilmez. Lütfen Havuz yama ekranına gidin ve oradaki talimatları takip edin. Ancak eminseniz devam edebilirsiniz',

  // Original text: "Go to pool"
  installPatchWarningReject: 'Havuza git',

  // Original text: "Install"
  installPatchWarningResolve: 'Yükle',

  // Original text: 'Release'
  patchRelease: undefined,

  // Original text: 'Update plugin is not installed on this host. Please run `yum install xcp-ng-updater` first.'
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

  // Original text: "Refresh patches"
  refreshPatches: 'Yamaları yenile',

  // Original text: "Install pool patches"
  installPoolPatches: 'Havuz yamalarını yükle',

  // Original text: "Default SR"
  defaultSr: 'Varsayılan depolama ünitesi',

  // Original text: "Set as default SR"
  setAsDefaultSr: 'Varsayılan depolama ünitesi olarak ayarla',

  // Original text: "General"
  generalTabName: 'Genel',

  // Original text: "Stats"
  statsTabName: 'Durum',

  // Original text: "Console"
  consoleTabName: 'Konsol',

  // Original text: "Container"
  containersTabName: 'Konteyner',

  // Original text: "Snapshots"
  snapshotsTabName: "Snapshot'lar",

  // Original text: "Logs"
  logsTabName: 'Günlükler',

  // Original text: "Advanced"
  advancedTabName: 'Gelişmiş',

  // Original text: "Network"
  networkTabName: 'Ağ',

  // Original text: "Disk{disks, plural, one {} other {s}}"
  disksTabName: 'Disk(ler)',

  // Original text: "halted"
  powerStateHalted: 'durduruldu',

  // Original text: "running"
  powerStateRunning: 'çalışıyor',

  // Original text: "suspended"
  powerStateSuspended: 'askıya alında',

  // Original text: "Current status:"
  vmCurrentStatus: 'Mevcut durum:',

  // Original text: "Not running"
  vmNotRunning: 'Çalışmıyor',

  // Original text: "Halted {ago}"
  vmHaltedSince: 'Durduruldu {ago}',

  // Original text: "No Xen tools detected"
  noToolsDetected: 'Xen tool tespit edilmedi',

  // Original text: "No IPv4 record"
  noIpv4Record: 'IPv4 kaydı yok',

  // Original text: "No IP record"
  noIpRecord: 'IP kaydı yok',

  // Original text: "Started {ago}"
  started: 'Başlatıldı {ago}',

  // Original text: "Paravirtualization (PV)"
  paraVirtualizedMode: 'Paravirtualization (PV)',

  // Original text: "Hardware virtualization (HVM)"
  hardwareVirtualizedMode: 'Hardware virtualization (HVM)',

  // Original text: 'Windows Update tools'
  windowsUpdateTools: undefined,

  // Original text: "CPU usage"
  statsCpu: 'CPU kullanımı',

  // Original text: "Memory usage"
  statsMemory: 'Bellek kullanımı',

  // Original text: "Network throughput"
  statsNetwork: 'Ağ veri akışı',

  // Original text: "Stacked values"
  useStackedValuesOnStats: 'Yığılmış değerler',

  // Original text: "Disk throughput"
  statDisk: 'Disk veri akışı',

  // Original text: "Last 10 minutes"
  statLastTenMinutes: 'Son 10 dakika',

  // Original text: "Last 2 hours"
  statLastTwoHours: 'Son 2 saat',

  // Original text: "Last week"
  statLastWeek: 'Son hafta',

  // Original text: "Last year"
  statLastYear: 'Son yıl',

  // Original text: "Copy"
  copyToClipboardLabel: 'Kopyala',

  // Original text: "Ctrl+Alt+Del"
  ctrlAltDelButtonLabel: 'Ctrl+Alt+Del',

  // Original text: "Tip:"
  tipLabel: 'İpucu:',

  // Original text: "Hide infos"
  hideHeaderTooltip: 'Bilgileri gizle',

  // Original text: "Show infos"
  showHeaderTooltip: 'Bilgileri göster',

  // Original text: "Name"
  containerName: 'Ad',

  // Original text: "Command"
  containerCommand: 'Komut',

  // Original text: "Creation date"
  containerCreated: 'Oluşturma tarihi',

  // Original text: "Status"
  containerStatus: 'Durum',

  // Original text: "Action"
  containerAction: 'Aksiyon',

  // Original text: "No existing containers"
  noContainers: 'Mevcutta konteyner yok',

  // Original text: "Stop this container"
  containerStop: "Bu konteyner'i durdur",

  // Original text: "Start this container"
  containerStart: "Bu konteyner'i çalıştır",

  // Original text: "Pause this container"
  containerPause: "Bu konteyner'i duraklat",

  // Original text: "Resume this container"
  containerResume: "Bu konteyner'i devam ettir",

  // Original text: "Restart this container"
  containerRestart: "Bu konteyner'i yeniden başlat",

  // Original text: "Action"
  vdiAction: 'Aksiyon',

  // Original text: "Attach disk"
  vdiAttachDevice: 'Disk tak',

  // Original text: "New disk"
  vbdCreateDeviceButton: 'Yeni disk',

  // Original text: "Boot order"
  vdiBootOrder: 'Önyükleme sıralaması',

  // Original text: "Name"
  vdiNameLabel: 'Ad',

  // Original text: "Description"
  vdiNameDescription: 'Açıklama',

  // Original text: "Pool"
  vdiPool: 'Havuz',

  // Original text: "Disconnect"
  vdiDisconnect: 'Bağlatıyı kes',

  // Original text: "Tags"
  vdiTags: 'Etiketler',

  // Original text: "Size"
  vdiSize: 'Boyut',

  // Original text: "SR"
  vdiSr: 'SR',

  // Original text: "VMs"
  vdiVms: "VM'ler",

  // Original text: "Migrate VDI"
  vdiMigrate: 'VDI taşı',

  // Original text: "Destination SR:"
  vdiMigrateSelectSr: 'Hedef SR:',

  // Original text: "No SR"
  vdiMigrateNoSr: 'SR yok',

  // Original text: "A target SR is required to migrate a VDI"
  vdiMigrateNoSrMessage: 'VDI taşımak için bir SR gereklidir',

  // Original text: "Forget"
  vdiForget: 'Unut',

  // Original text: "Remove VDI"
  vdiRemove: 'VDI kaldır',

  // Original text: "No VDIs attached to Control Domain"
  noControlDomainVdis: "Kontrol Domain'e takılı VDI yok",

  // Original text: "Boot flag"
  vbdBootableStatus: 'Önyükleme bayrağı',

  // Original text: "Status"
  vbdStatus: 'Durum',

  // Original text: "Connected"
  vbdStatusConnected: 'Bağlı',

  // Original text: "Disconnected"
  vbdStatusDisconnected: 'Bağlı değil',

  // Original text: "No disks"
  vbdNoVbd: 'Disk yok',

  // Original text: "Connect VBD"
  vbdConnect: "VBD'i bağla",

  // Original text: "Disconnect VBD"
  vbdDisconnect: "VBD'nin bağlantısı kes",

  // Original text: "Bootable"
  vbdBootable: 'Önyüklenebilir',

  // Original text: "Readonly"
  vbdReadonly: 'Yalnızca okunabilir',

  // Original text: "Action"
  vbdAction: 'Aksiyon',

  // Original text: "Create"
  vbdCreate: 'Oluştur',

  // Original text: "Attach"
  vbdAttach: 'Tak',

  // Original text: "Disk name"
  vbdNamePlaceHolder: 'Disk adı',

  // Original text: "Size"
  vbdSizePlaceHolder: 'Boyut',

  // Original text: "CD drive not completely installed"
  cdDriveNotInstalled: 'CD sürücü tamamen yüklenmedi',

  // Original text: "Stop and start the VM to install the CD drive"
  cdDriveInstallation: "CD sürücüyü yüklemek için VM'i kapatıp açın",

  // Original text: "Save"
  saveBootOption: 'Kaydet',

  // Original text: "Reset"
  resetBootOption: 'Sıfırla',

  // Original text: "Delete selected VDIs"
  deleteSelectedVdis: "Seçilen VDI'ları sil",

  // Original text: "Delete selected VDI"
  deleteSelectedVdi: "Seçilen VDI'ı sil",

  // Original text: "Creating this disk will use the disk space quota from the resource set {resourceSet} ({spaceLeft} left)"
  useQuotaWarning: 'Disk oluşturma, kaynak setindeki disk kotasını kullanacak {resourceSet} (kalan {spaceLeft})',

  // Original text: "Not enough space in resource set {resourceSet} ({spaceLeft} left)"
  notEnoughSpaceInResourceSet: 'Kaynak setinde yeterli disk alanı yok {resourceSet} (kalan {spaceLeft})',

  // Original text: "New device"
  vifCreateDeviceButton: 'Yeni cihaz',

  // Original text: "No interface"
  vifNoInterface: 'Arabirim yok',

  // Original text: "Device"
  vifDeviceLabel: 'Cihaz',

  // Original text: "MAC address"
  vifMacLabel: 'MAC adresi',

  // Original text: "MTU"
  vifMtuLabel: 'MTU',

  // Original text: "Network"
  vifNetworkLabel: 'Ağ',

  // Original text: "Status"
  vifStatusLabel: 'Status',

  // Original text: "Connected"
  vifStatusConnected: 'Bağlı',

  // Original text: "Disconnected"
  vifStatusDisconnected: 'Bağlı değil',

  // Original text: "Connect"
  vifConnect: 'Bağlan',

  // Original text: "Disconnect"
  vifDisconnect: 'Bağlantıyı kes',

  // Original text: "Remove"
  vifRemove: 'Kaldır',

  // Original text: "Remove selected VIFs"
  vifsRemove: "Seçili VIF'ları kaldır",

  // Original text: "IP addresses"
  vifIpAddresses: 'IP adresleri',

  // Original text: "Auto-generated if empty"
  vifMacAutoGenerate: 'Eğer boşsa otomatik oluştur',

  // Original text: "Allowed IPs"
  vifAllowedIps: "İzin verilen IP'ler",

  // Original text: "No IPs"
  vifNoIps: 'IP yok',

  // Original text: "Network locked"
  vifLockedNetwork: 'Ağ kilitli',

  // Original text: "Network locked and no IPs are allowed for this interface"
  vifLockedNetworkNoIps: 'Ağ kilitli ve bu arayüz için izin verilen IP yok',

  // Original text: "Network not locked"
  vifUnLockedNetwork: 'Ağ kiltli değil',

  // Original text: "Unknown network"
  vifUnknownNetwork: 'Bilinmeyen ağ',

  // Original text: "Action"
  vifAction: 'Aksiyon',

  // Original text: "Create"
  vifCreate: 'Oluştur',

  // Original text: "No snapshots"
  noSnapshots: 'Snapshot yok',

  // Original text: "New snapshot"
  snapshotCreateButton: 'Yeni snapshot',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: 'Bir tane oluşturmak için snapshot butonuna tıklayın!',

  // Original text: "Revert VM to this snapshot"
  revertSnapshot: "VM'i bu snapshot'a döndür",

  // Original text: "Remove this snapshot"
  deleteSnapshot: "Bu snapshot'ı kaldır",

  // Original text: "Remove selected snapshots"
  deleteSnapshots: "Seçili snapshot'ları kaldır",

  // Original text: "Create a VM from this snapshot"
  copySnapshot: "Bu snapshot'dan bir VM oluştur",

  // Original text: "Export this snapshot"
  exportSnapshot: "Bu snapshot'ı dışa aktar",

  // Original text: "Creation date"
  snapshotDate: 'Oluşturma tarihi',

  // Original text: "Name"
  snapshotName: 'Ad',

  // Original text: "Description"
  snapshotDescription: 'Açıklama',

  // Original text: "Action"
  snapshotAction: 'Aksiyon',

  // Original text: "Quiesced snapshot"
  snapshotQuiesce: 'Quiesced snapshot',

  // Original text: 'Revert successful'
  vmRevertSuccessfulTitle: undefined,

  // Original text: 'VM successfully reverted'
  vmRevertSuccessfulMessage: undefined,

  // Original text: "Remove all logs"
  logRemoveAll: 'Tüm günlükleri kaldır',

  // Original text: "No logs so far"
  noLogs: 'Hiç günlük yok',

  // Original text: "Creation date"
  logDate: 'Oluşturma tarihi',

  // Original text: "Name"
  logName: 'Ad',

  // Original text: "Content"
  logContent: 'İçerik',

  // Original text: "Action"
  logAction: 'Aksiyon',

  // Original text: "Remove"
  vmRemoveButton: 'Kaldır',

  // Original text: "Convert"
  vmConvertButton: 'Dönüştür',

  // Original text: "Share"
  vmShareButton: 'Paylaş',

  // Original text: "Xen settings"
  xenSettingsLabel: 'Xen ayarları',

  // Original text: "Guest OS"
  guestOsLabel: 'Konuk OS',

  // Original text: "Misc"
  miscLabel: 'Çeşitli',

  // Original text: "UUID"
  uuid: 'UUID',

  // Original text: "Virtualization mode"
  virtualizationMode: 'Sanallaştırma modu',

  // Original text: "CPU weight"
  cpuWeightLabel: 'CPU ağırlığı',

  // Original text: "Default ({value, number})"
  defaultCpuWeight: 'Varsayılan ({value, number})',

  // Original text: "CPU cap"
  cpuCapLabel: 'CPU cap',

  // Original text: "Default ({value, number})"
  defaultCpuCap: 'Varsayılan ({value, number})',

  // Original text: "PV args"
  pvArgsLabel: 'PV argümanları',

  // Original text: "Xen tools version"
  xenToolsStatus: 'Xen tools sürümü',

  // Original text: 'Not installed'
  xenToolsNotInstalled: undefined,

  // Original text: "OS name"
  osName: 'OS adı',

  // Original text: "OS kernel"
  osKernel: 'OS çekirdeği',

  // Original text: "Auto power on"
  autoPowerOn: 'Otomatik açılma',

  // Original text: "HA"
  ha: 'HA',

  // Original text: "Affinity host"
  vmAffinityHost: 'Atanmış sunucu',

  // Original text: "VGA"
  vmVga: 'VGA',

  // Original text: "Video RAM"
  vmVideoram: 'Video RAM',

  // Original text: "None"
  noAffinityHost: 'Yok',

  // Original text: 'Original template'
  originalTemplate: undefined,

  // Original text: "Unknown"
  unknownOsName: 'Bilinmiyor',

  // Original text: "Unknown"
  unknownOsKernel: 'Bilinmiyor',

  // Original text: "Unknown"
  unknownOriginalTemplate: 'Bilinmiyor',

  // Original text: "VM limits"
  vmLimitsLabel: 'VM limitleri',

  // Original text: "Resource set"
  resourceSet: 'Kaynak seti',

  // Original text: "None"
  resourceSetNone: 'Yok',

  // Original text: "CPU limits"
  vmCpuLimitsLabel: 'CPU limitleri',

  // Original text: "Topology"
  vmCpuTopology: 'Topoloji',

  // Original text: "Default behavior"
  vmChooseCoresPerSocket: 'Varsayılan davranış',

  // Original text: "{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket"
  vmSocketsWithCoresPerSocket: '{nSockets, number} soket ve her sokette  {nCores, number} çekirdek',

  // Original text: "None"
  vmCoresPerSocketNone: 'Yok',

  // Original text: "Incorrect cores per socket value"
  vmCoresPerSocketIncorrectValue: 'Soket başına geçersiz çekirdek sayısı',

  // Original text: "Please change the selected value to fix it."
  vmCoresPerSocketIncorrectValueSolution: 'Düzeltmek için lütfen seçili değeri değiştirin',

  // Original text: 'disabled'
  vmHaDisabled: undefined,

  // Original text: "Memory limits (min/max)"
  vmMemoryLimitsLabel: 'Bellek limiti (min/max)',

  // Original text: "vCPUs max:"
  vmMaxVcpus: 'vCPUs max',

  // Original text: "Memory max:"
  vmMaxRam: 'Bellek max',

  // Original text: "vGPU"
  vmVgpu: 'vGPU',

  // Original text: "GPUs"
  vmVgpus: "GPU'lar",

  // Original text: "None"
  vmVgpuNone: 'Yok',

  // Original text: "Add vGPU"
  vmAddVgpu: 'vGPU ekle',

  // Original text: "Select vGPU type"
  vmSelectVgpuType: 'vGPU tipini seçin',

  // Original text: "Long click to add a name"
  vmHomeNamePlaceholder: 'İsim eklemek için uzun tıklayın',

  // Original text: "Long click to add a description"
  vmHomeDescriptionPlaceholder: 'Açıklama eklemek için uzun tıklayın',

  // Original text: "Click to add a name"
  vmViewNamePlaceholder: 'Ad eklemek için tıklayın',

  // Original text: "Click to add a description"
  vmViewDescriptionPlaceholder: 'Açıklama eklemek için tıklayın',

  // Original text: "Click to add a name"
  templateHomeNamePlaceholder: 'Ad eklemek için tıklayın',

  // Original text: "Click to add a description"
  templateHomeDescriptionPlaceholder: 'Açıklama eklemek için tıklayın',

  // Original text: "Delete template"
  templateDelete: 'Kalıbı sil',

  // Original text: "Delete VM template{templates, plural, one {} other {s}}"
  templateDeleteModalTitle: 'VM kalıbını(larını) sil',

  // Original text: "Are you sure you want to delete {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?"
  templateDeleteModalBody: 'Kalıbı(ları) silmek istediğinize emin misiniz?',

  // Original text: "Delete template{nTemplates, plural, one {} other {s}} failed"
  failedToDeleteTemplatesTitle: 'Kalıp silme başarısız',

  // Original text: "Failed to delete {nTemplates, number} template{nTemplates, plural, one {} other {s}}."
  failedToDeleteTemplatesMessage: 'Silme başarısız',

  // Original text: "Delete default template{nDefaultTemplates, plural, one {} other {s}}"
  deleteDefaultTemplatesTitle: 'Varsayılan kalıbı(ları) sil',

  // Original text: "You are attempting to delete {nDefaultTemplates, number} default template{nDefaultTemplates, plural, one {} other {s}}. Do you want to continue?"
  deleteDefaultTemplatesMessage: 'Varsayılan kalıbı(ları) silmeye çalışıyorsunuz. Devam etmek istiyor musunuz?',

  // Original text: "Pool{pools, plural, one {} other {s}}"
  poolPanel: 'Havuz(lar)',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'Sunucu(lar)',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: 'VM(ler)',

  // Original text: "RAM Usage:"
  memoryStatePanel: 'RAM Kullanımı',

  // Original text: "Used Memory"
  usedMemory: 'Kullanılan Bellek',

  // Original text: "Total Memory"
  totalMemory: 'Toplam Bellek',

  // Original text: "CPUs Total"
  totalCpus: 'Toplam CPU',

  // Original text: "Used vCPUs"
  usedVCpus: 'Kullanılan vCPU',

  // Original text: "Used Space"
  usedSpace: 'Kullanılan Alan',

  // Original text: "Total Space"
  totalSpace: 'Toplam Alan',

  // Original text: "CPUs Usage"
  cpuStatePanel: "CPU'ların Kullanımı",

  // Original text: "VMs Power state"
  vmStatePanel: "VM'lerin Güç durumu",

  // Original text: "Halted"
  vmStateHalted: 'Durduruldu',

  // Original text: "Other"
  vmStateOther: 'Diğer',

  // Original text: "Running"
  vmStateRunning: 'Çalışıyor',

  // Original text: "All"
  vmStateAll: 'Hepsi',

  // Original text: "Pending tasks"
  taskStatePanel: 'Bekleyen görevler',

  // Original text: "Users"
  usersStatePanel: 'Kullanıcılar',

  // Original text: "Storage state"
  srStatePanel: 'Depolama ünitesi durumu',

  // Original text: "{usage} (of {total})"
  ofUsage: '{usage} (of {total})',

  // Original text: "{nVcpus, number} vCPU{nVcpus, plural, one {} other {s}} (of {nCpus, number} CPU{nCpus, plural, one {} other {s}})"
  ofCpusUsage:
    '{nVcpus, number} vCPU{nVcpus, plural, one {} other {s}} (of {nCpus, number} CPU{nCpus, plural, one {} other {s}})',

  // Original text: "No storage"
  noSrs: 'Depolama ünitesi yok',

  // Original text: "Name"
  srName: 'Ad',

  // Original text: "Pool"
  srPool: 'Havuz',

  // Original text: "Host"
  srHost: 'Sunucu',

  // Original text: "Type"
  srFormat: 'Tip',

  // Original text: "Size"
  srSize: 'Boyut',

  // Original text: "Usage"
  srUsage: 'Kullanım',

  // Original text: "used"
  srUsed: 'kullnıldı',

  // Original text: "free"
  srFree: 'boş',

  // Original text: "Storage Usage"
  srUsageStatePanel: 'Depolama Ünitesi Kullanımı',

  // Original text: "Top 5 SR Usage (in %)"
  srTopUsageStatePanel: 'En çok kullanılan 5 SR (% olarak)',

  // Original text: "Not enough permissions!"
  notEnoughPermissionsError: 'Yetersiz yetki!',

  // Original text: "{running, number} running ({halted, number} halted)"
  vmsStates: '{running, number} çalışıyor ({halted, number} durduruldu)',

  // Original text: "Clear selection"
  dashboardStatsButtonRemoveAll: 'Seçimi temizle',

  // Original text: "Add all hosts"
  dashboardStatsButtonAddAllHost: 'Tüm sunucuları ekle',

  // Original text: "Add all VMs"
  dashboardStatsButtonAddAllVM: "Tüm VM'leri ekle",

  // Original text: "Send report"
  dashboardSendReport: 'Rapor gönder',

  // Original text: "Report"
  dashboardReport: 'Rapor',

  // Original text: "This will send a usage report to your configured emails."
  dashboardSendReportMessage: 'Bu işlem ayarlanmış eposta adreslerine kullanım raporu gönderecek.',

  // Original text: "The usage report and transport email plugins need to be loaded!"
  dashboardSendReportInfo: "'usage report' ve 'transport email' eklentilerinin yüklenmesi gerekli!",

  // Original text: "{value} {date, date, medium}"
  weekHeatmapData: '{value} {date, date, medium}',

  // Original text: "No data."
  weekHeatmapNoData: 'Veri yok.',

  // Original text: "Weekly Heatmap"
  weeklyHeatmap: 'Haftalık Sıcaklık Haritası',

  // Original text: "Weekly Charts"
  weeklyCharts: 'Haftalık Grafikler',

  // Original text: "Synchronize scale:"
  weeklyChartsScaleInfo: 'Ölçeği senkronize et:',

  // Original text: "Stats error"
  statsDashboardGenericErrorTitle: 'Durum hatası',

  // Original text: "There is no stats available for:"
  statsDashboardGenericErrorMessage: 'Şunun için istatistik mevcut değil:',

  // Original text: "No selected metric"
  noSelectedMetric: 'Seçilen metrik yok',

  // Original text: "Select"
  statsDashboardSelectObjects: 'Seç',

  // Original text: "Loading…"
  metricsLoading: 'Yükleniyor...',

  // Original text: "Coming soon!"
  comingSoon: 'Yakında!',

  // Original text: "Orphaned snapshot VDIs"
  orphanedVdis: "Yetim snapshot VDI'ları",

  // Original text: "Orphaned VMs snapshot"
  orphanedVms: "Yetim VM'lerin snapshot'ı",

  // Original text: "No orphans"
  noOrphanedObject: 'Yetim yok',

  // Original text: "Remove all orphaned snapshot VDIs"
  removeAllOrphanedObject: "Tüm yetim snapshot VDI'larını kaldır",

  // Original text: "VDIs attached to Control Domain"
  vdisOnControlDomain: "Kontrol Domain'e takılı VDI'lar",

  // Original text: "Name"
  vmNameLabel: 'Ad',

  // Original text: "Description"
  vmNameDescription: 'Açıklama',

  // Original text: "Resident on"
  vmContainer: 'Üzerinde',

  // Original text: 'VM snapshots related to non-existent backups'
  vmSnapshotsRelatedToNonExistentBackups: undefined,

  // Original text: 'Snapshot of'
  snapshotOf: undefined,

  // Original text: 'Legacy backups snapshots'
  legacySnapshots: undefined,

  // Original text: "Alarms"
  alarmMessage: 'Alarmlar',

  // Original text: "No alarms"
  noAlarms: 'Alarm yok',

  // Original text: "Date"
  alarmDate: 'Tarih',

  // Original text: "Content"
  alarmContent: 'İçerik',

  // Original text: "Issue on"
  alarmObject: 'Sorun üzerinde',

  // Original text: "Pool"
  alarmPool: 'Havuz',

  // Original text: "Remove all alarms"
  alarmRemoveAll: 'Tüm alarmları kaldır',

  // Original text: "{used}% used ({free} left)"
  spaceLeftTooltip: '{used}% kullanılıyor ({free} boş)',

  // Original text: "Create a new VM on {select}"
  newVmCreateNewVmOn: '{select} üzerinden yeni bir VM oluştur',

  // Original text: "You have no permission to create a VM"
  newVmCreateNewVmNoPermission: 'Yeni VM oluşturmak için yetkiniz yok',

  // Original text: "Infos"
  newVmInfoPanel: 'Bilgiler',

  // Original text: "Name"
  newVmNameLabel: 'Ad',

  // Original text: "Template"
  newVmTemplateLabel: 'Kalıp',

  // Original text: "Description"
  newVmDescriptionLabel: 'Açıklama',

  // Original text: "Performances"
  newVmPerfPanel: 'Performanslar',

  // Original text: "vCPUs"
  newVmVcpusLabel: "vCPU'lar",

  // Original text: "RAM"
  newVmRamLabel: 'RAM',

  // Original text: "Static memory max"
  newVmStaticMaxLabel: 'En fazla statik bellek',

  // Original text: "Dynamic memory min"
  newVmDynamicMinLabel: 'En az dinamik bellek',

  // Original text: "Dynamic memory max"
  newVmDynamicMaxLabel: 'En fazla dinamik bellek',

  // Original text: "Install settings"
  newVmInstallSettingsPanel: 'Ayarları yükle',

  // Original text: "ISO/DVD"
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: "Network"
  newVmNetworkLabel: 'Ağ',

  // Original text: "e.g: http://httpredir.debian.org/debian"
  newVmInstallNetworkPlaceHolder: 'örn: http://httpredir.debian.org/debian',

  // Original text: "PV Args"
  newVmPvArgsLabel: 'PV Args',

  // Original text: "PXE"
  newVmPxeLabel: 'PXE',

  // Original text: "Interfaces"
  newVmInterfacesPanel: 'Arayüzler',

  // Original text: "MAC"
  newVmMacLabel: 'MAC',

  // Original text: "Add interface"
  newVmAddInterface: 'Arayüz ekle',

  // Original text: "Disks"
  newVmDisksPanel: 'Diskler',

  // Original text: "SR"
  newVmSrLabel: 'SR',

  // Original text: "Size"
  newVmSizeLabel: 'Boyut',

  // Original text: "Add disk"
  newVmAddDisk: 'Disk ekle',

  // Original text: "Summary"
  newVmSummaryPanel: 'Özet',

  // Original text: "Create"
  newVmCreate: 'Oluştur',

  // Original text: "Reset"
  newVmReset: 'Sıfırla',

  // Original text: "Select template"
  newVmSelectTemplate: 'Kalıp seç',

  // Original text: "SSH key"
  newVmSshKey: 'SSH anahtarı',

  // Original text: 'No config drive'
  noConfigDrive: undefined,

  // Original text: "Custom config"
  newVmCustomConfig: 'Özel yapılandırma',

  // Original text: 'Click here to see the available template variables'
  availableTemplateVarsInfo: undefined,

  // Original text: 'Available template variables'
  availableTemplateVarsTitle: undefined,

  // Original text: 'the VM\'s name. It must not contain "_"'
  templateNameInfo: undefined,

  // Original text: "the VM's index, it will take 0 in case of single VM"
  templateIndexInfo: undefined,

  // Original text: "Boot VM after creation"
  newVmBootAfterCreate: "Oluşturduktan sonra VM'i çalıştır",

  // Original text: "Auto-generated if empty"
  newVmMacPlaceholder: 'Eğer boşsa otomatik oluştur',

  // Original text: "CPU weight"
  newVmCpuWeightLabel: 'CPU ağırlığı',

  // Original text: "Default: {value, number}"
  newVmDefaultCpuWeight: 'Varsayılan: {value, number}',

  // Original text: "CPU cap"
  newVmCpuCapLabel: 'CPU cap',

  // Original text: "Default: {value, number}"
  newVmDefaultCpuCap: 'Varsayılan: {value, number}',

  // Original text: "Cloud config"
  newVmCloudConfig: 'Bulut yapılandırması',

  // Original text: "Create VMs"
  newVmCreateVms: 'VM oluştur',

  // Original text: "Are you sure you want to create {nbVms, number} VMs?"
  newVmCreateVmsConfirm: '{nbVms, number} adet VM oluşturmak istediğinize emin misiniz?',

  // Original text: "Multiple VMs:"
  newVmMultipleVms: 'Çoklu VM',

  // Original text: "Select a resource set:"
  newVmSelectResourceSet: 'Bir kaynak seti seç',

  // Original text: "Name pattern:"
  newVmMultipleVmsPattern: 'Ad deseni:',

  // Original text: "e.g.: \\{name\\}_%"
  newVmMultipleVmsPatternPlaceholder: 'örn: \\{name\\}_%',

  // Original text: "First index:"
  newVmFirstIndex: 'İlk indeks',

  // Original text: "Recalculate VMs number"
  newVmNumberRecalculate: 'VM sayısını tekrar hesapla',

  // Original text: "Refresh VMs name"
  newVmNameRefresh: 'VM isimlerini yenile',

  // Original text: "Affinity host"
  newVmAffinityHost: 'Atanmış sunucu',

  // Original text: "Advanced"
  newVmAdvancedPanel: 'Gelişmiş',

  // Original text: "Show advanced settings"
  newVmShowAdvanced: 'Gelişmiş ayarları göster',

  // Original text: "Hide advanced settings"
  newVmHideAdvanced: 'Gelişmiş ayarları gizle',

  // Original text: "Share this VM"
  newVmShare: "Bu VM'i paylaş",

  // Original text: "Resource sets"
  resourceSets: 'Kaynak setleri',

  // Original text: "No resource sets."
  noResourceSets: 'Kaynak seti yok.',

  // Original text: "Loading resource sets"
  loadingResourceSets: 'Kaynak setleri yükleniyor',

  // Original text: "Resource set name"
  resourceSetName: 'Kaynak seti adı',

  // Original text: "Users"
  resourceSetUsers: 'Kullanıcılar',

  // Original text: "Pools"
  resourceSetPools: 'Havuzlar',

  // Original text: "Templates"
  resourceSetTemplates: 'Kalıplar',

  // Original text: "SRs"
  resourceSetSrs: "SR'ler",

  // Original text: "Networks"
  resourceSetNetworks: 'Ağlar',

  // Original text: "Recompute all limits"
  recomputeResourceSets: 'Tüm limitleri tekrar hesapla',

  // Original text: "Save"
  saveResourceSet: 'Kaydet',

  // Original text: "Reset"
  resetResourceSet: 'Sıfırla',

  // Original text: "Edit"
  editResourceSet: 'Düzenle',

  // Original text: "Delete"
  deleteResourceSet: 'Sil',

  // Original text: "Delete resource set"
  deleteResourceSetWarning: 'Kaynak setini sil',

  // Original text: "Are you sure you want to delete this resource set?"
  deleteResourceSetQuestion: 'Bu kaynak setini silmek istediğinize emin misiniz?',

  // Original text: "Missing objects:"
  resourceSetMissingObjects: 'Eksik nesneler:',

  // Original text: "vCPUs"
  resourceSetVcpus: "vCPU'lar",

  // Original text: "Memory"
  resourceSetMemory: 'Bellek',

  // Original text: "Storage"
  resourceSetStorage: 'Depolama Ünitesi',

  // Original text: "Unknown"
  unknownResourceSetValue: 'Bilinmeyen',

  // Original text: "Available hosts"
  availableHosts: 'Uygun sunucular',

  // Original text: "Excluded hosts"
  excludedHosts: 'Hariç tutulan sunucular',

  // Original text: "No hosts available."
  noHostsAvailable: 'Uygun sunucu yok',

  // Original text: "VMs created from this resource set shall run on the following hosts."
  availableHostsDescription: 'Bu kaynak setinden oluşturulan sanal makineler aşağıdaki sunucularda çalışacak.',

  // Original text: "Maximum CPUs"
  maxCpus: 'En fazla CPU',

  // Original text: "Maximum RAM"
  maxRam: 'En fazla RAM',

  // Original text: "Maximum disk space"
  maxDiskSpace: 'En fazla disk alanı',

  // Original text: "IP pool"
  ipPool: 'IP havuzu',

  // Original text: "Quantity"
  quantity: 'Adet',

  // Original text: "No limits."
  noResourceSetLimits: 'Limitsiz',

  // Original text: "Remaining:"
  remainingResource: 'Kalan:',

  // Original text: "Used"
  usedResourceLabel: 'Kullanılan',

  // Original text: "Available"
  availableResourceLabel: 'Uygun',

  // Original text: "Used: {usage} (Total: {total})"
  resourceSetQuota: 'Kullanılan: {usage} (Toplam: {total})',

  // Original text: "New"
  resourceSetNew: 'Yeni',

  // Original text: "Try dropping some VMs files here, or click to select VMs to upload. Accept only .xva/.ova files."
  importVmsList:
    'Buraya VM dosyaları sürüklemeyi deneyin veya tıklayarak bir VM dosyası seçin. Yalnızca .xva/.ova dosyaları kabul edilir.',

  // Original text: "No selected VMs."
  noSelectedVms: 'Seçili VM yok',

  // Original text: "To Pool:"
  vmImportToPool: 'Havuz:',

  // Original text: "To SR:"
  vmImportToSr: 'SR:',

  // Original text: "VM{nVms, plural, one {} other {s}} to import"
  vmsToImport: "içe aktarılacak VM'ler",

  // Original text: "Reset"
  importVmsCleanList: 'Sıfırla',

  // Original text: "VM import success"
  vmImportSuccess: 'VM içe aktarma başarılı',

  // Original text: "VM import failed"
  vmImportFailed: 'VM içe aktarma başarısız',

  // Original text: "Error on setting the VM: {vm}"
  setVmFailed: "Şu VM'in ayarlarında hata: {vm}",

  // Original text: "Import starting…"
  startVmImport: 'İçe aktarma başlatılıyor...',

  // Original text: "Export starting…"
  startVmExport: 'Dışa aktarma başlatılıyor...',

  // Original text: 'Number of CPUs'
  nCpus: undefined,

  // Original text: "Memory"
  vmMemory: 'Bellek',

  // Original text: "Disk {position} ({capacity})"
  diskInfo: 'Disk {position} ({capacity})',

  // Original text: "Disk description"
  diskDescription: 'Disk Açıklaması',

  // Original text: "No disks."
  noDisks: 'Disk yok.',

  // Original text: "No networks."
  noNetworks: 'Ağ yok.',

  // Original text: "Network {name}"
  networkInfo: 'Ağ {name}',

  // Original text: "No description available"
  noVmImportErrorDescription: 'Uygun açıklama yok',

  // Original text: "Error:"
  vmImportError: 'Hata',

  // Original text: "{type} file:"
  vmImportFileType: '{type} dosyası:',

  // Original text: "Please check and/or modify the VM configuration."
  vmImportConfigAlert: 'Lütfen VM ayarlarını kontrol edin ve/veya değiştirin.',

  // Original text: "No pending tasks"
  noTasks: 'Bekleyen görev yok',

  // Original text: "Currently, there are not any pending XenServer tasks"
  xsTasks: 'Şu anda bekleyen hiç XenServer görevi yok',

  // Original text: "Cancel"
  cancelTask: 'İptal',

  // Original text: "Destroy"
  destroyTask: 'İmha et',

  // Original text: "Cancel selected tasks"
  cancelTasks: 'Seçili işleri iptal et',

  // Original text: "Destroy selected tasks"
  destroyTasks: 'Seçili işleri imha et',

  // Original text: "Pool"
  pool: 'Havuz',

  // Original text: "Task"
  task: 'Görev',

  // Original text: "Progress"
  progress: 'İlerleme',

  // Original text: "Schedules"
  backupSchedules: 'Zamanlamalar',

  // Original text: "Cron pattern"
  scheduleCron: 'Cron kalıbı:',

  // Original text: "Name"
  scheduleName: 'Ad',

  // Original text: "Timezone"
  scheduleTimezone: 'Saat dilimi',

  // Original text: "Export ret."
  scheduleExportRetention: 'Yedekleme döngüsü',

  // Original text: 'Copy ret.'
  scheduleCopyRetention: undefined,

  // Original text: "Snapshot ret."
  scheduleSnapshotRetention: 'Snaphost döngüsü',

  // Original text: "Get remote"
  getRemote: 'Hedef getir',

  // Original text: "List Remote"
  listRemote: 'Hedefleri listele',

  // Original text: "simple"
  simpleBackup: 'Basit',

  // Original text: "delta"
  delta: 'Fark',

  // Original text: "Restore Backups"
  restoreBackups: 'Yedeği geri yükle',

  // Original text: "Click on a VM to display restore options"
  restoreBackupsInfo: "Geri getirme seçenekleri için bir VM'e tıklayın",

  // Original text: "Enabled"
  remoteEnabled: 'Etkin',

  // Original text: "Error"
  remoteError: 'Hata',

  // Original text: "No backup available"
  noBackup: 'Uygun yedek yok',

  // Original text: "VM Name"
  backupVmNameColumn: 'VM adı',

  // Original text: "VM Description"
  backupVmDescriptionColumn: 'VM Açıklaması',

  // Original text: "Tags"
  backupTags: 'Etiketler',

  // Original text: "Oldest backup"
  firstBackupColumn: 'En eski yedek',

  // Original text: "Latest backup"
  lastBackupColumn: 'En yeni yedek',

  // Original text: "Available Backups"
  availableBackupsColumn: 'Uygun Yedekler',

  // Original text: "Missing parameters"
  backupRestoreErrorTitle: 'Eksik parametreler',

  // Original text: "Choose a SR and a backup"
  backupRestoreErrorMessage: 'Bir SR ve bir yedek seçin',

  // Original text: "Select default SR…"
  backupRestoreSelectDefaultSr: 'Varsayılan SR seçin...',

  // Original text: "Choose a SR for each VDI"
  backupRestoreChooseSrForEachVdis: 'Her VDI için bir SR seçin',

  // Original text: "VDI"
  backupRestoreVdiLabel: 'VDI',

  // Original text: "SR"
  backupRestoreSrLabel: 'SR',

  // Original text: "Display backups"
  displayBackup: 'Yedekleri görüntüle',

  // Original text: "Import VM"
  importBackupTitle: 'VM içe katar',

  // Original text: "Starting your backup import"
  importBackupMessage: 'Yedek içe aktarma başlatılıyor',

  // Original text: "VMs to backup"
  vmsToBackup: "Yedeklenecek VM'ler",

  // Original text: "Refresh backup list"
  refreshBackupList: 'Yedek listesini yenile',

  // Original text: "Restore"
  restoreVmBackups: 'Geri yükle',

  // Original text: "Restore {vm}"
  restoreVmBackupsTitle: 'Geri yükle {vm}',

  // Original text: "Restore {nVms, number} VM{nVms, plural, one {} other {s}}"
  restoreVmBackupsBulkTitle: '{nVms, number} VM geri yükle',

  // Original text: "Restore {nVms, number} VM{nVms, plural, one {} other {s}} from {nVms, plural, one {its} other {their}} {oldestOrLatest} backup."
  restoreVmBackupsBulkMessage: '{oldestOrLatest} yedekten {nVms, number} VM geri yükle',

  // Original text: "oldest"
  oldest: 'En eski',

  // Original text: "latest"
  latest: 'En yeni',

  // Original text: "Start VM{nVms, plural, one {} other {s}} after restore"
  restoreVmBackupsStart: "Geri yüklemeden sonra VM'i(leri) başlat",

  // Original text: "Multi-restore error"
  restoreVmBackupsBulkErrorTitle: 'Çoklu geri yüklemede hata',

  // Original text: "You need to select a destination SR"
  restoreVmBackupsBulkErrorMessage: 'Bir hedef SR seçmelisiniz',

  // Original text: "Delete backups…"
  deleteVmBackups: 'Yedek sil...',

  // Original text: "Delete {vm} backups"
  deleteVmBackupsTitle: '{vm} yedeklerini sil',

  // Original text: "Select backups to delete:"
  deleteVmBackupsSelect: 'Silinecek yedekleri seçin:',

  // Original text: "All"
  deleteVmBackupsSelectAll: 'Hepsi',

  // Original text: "Delete backups"
  deleteVmBackupsBulkTitle: 'Yedekleri sil',

  // Original text: "Are you sure you want to delete all the backups from {nVms, number} VM{nVms, plural, one {} other {s}}?"
  deleteVmBackupsBulkMessage: "{nVms, number} VM'e ait tüm yedekleri silmek istediğinize emin misiniz?",

  // Original text: "delete {nBackups} backup{nBackups, plural, one {} other {s}}"
  deleteVmBackupsBulkConfirmText: 'Yedeği(leri) sil',

  // Original text: "List remote backups"
  listRemoteBackups: 'Uzak yedekleri listele',

  // Original text: "Restore backup files"
  restoreFiles: 'Yedek dosyalarını geri yükle',

  // Original text: "Invalid options"
  restoreFilesError: 'Geçersiz seçenekler',

  // Original text: "Restore file from {name}"
  restoreFilesFromBackup: 'Şuradan dosya al {name}',

  // Original text: "Select a backup…"
  restoreFilesSelectBackup: 'Bir yedek seç...',

  // Original text: "Select a disk…"
  restoreFilesSelectDisk: 'Bir disk seç...',

  // Original text: "Select a partition…"
  restoreFilesSelectPartition: 'Bir disk bölümü seçin...',

  // Original text: "Folder path"
  restoreFilesSelectFolderPath: 'Dizin yolu',

  // Original text: "Select a file…"
  restoreFilesSelectFiles: 'Bir dosya seçin...',

  // Original text: "Content not found"
  restoreFileContentNotFound: 'İçerik bulunamadı',

  // Original text: "No files selected"
  restoreFilesNoFilesSelected: 'Hiç dosya seçilmedi',

  // Original text: "Selected files ({files}):"
  restoreFilesSelectedFiles: 'Seçilen dosyalar ({files})',

  // Original text: "Error while scanning disk"
  restoreFilesDiskError: 'Disk tarama esnasında hata',

  // Original text: "Select all this folder's files"
  restoreFilesSelectAllFiles: 'Bu dizinin tüm dosyalarını seç',

  // Original text: "Unselect all files"
  restoreFilesUnselectAll: 'Seçimi kaldır',

  // Original text: "Emergency shutdown Host"
  emergencyShutdownHostModalTitle: 'Acil durum sunucu kapatması',

  // Original text: "Are you sure you want to shutdown {host}?"
  emergencyShutdownHostModalMessage: 'Kapatmak istediğinize emin misiniz {host}',

  // Original text: "Emergency shutdown Host{nHosts, plural, one {} other {s}}"
  emergencyShutdownHostsModalTitle: 'Acil durum sunucu kapatması',

  // Original text: "Are you sure you want to shutdown {nHosts, number} Host{nHosts, plural, one {} other {s}}?"
  emergencyShutdownHostsModalMessage: '{nHosts, number} Sunucu kapatmak istediğinize emin misiniz?',

  // Original text: "Shutdown host"
  stopHostModalTitle: 'Sunucuyu Kapat',

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage:
    'Bu sunucunuzu kapatacak. Devam etmek istiyor musunuz? Eğer havuzun master sunucusu ise, havuzunuzla bağlantınız kesilecek',

  // Original text: "Add host"
  addHostModalTitle: 'Sunucu ekle',

  // Original text: "Are you sure you want to add {host} to {pool}?"
  addHostModalMessage: '{host} sunucusunu {pool} havuzuna eklemek istediğinize emin misiniz?',

  // Original text: "Restart host"
  restartHostModalTitle: 'Sunucuyu yenden başlat',

  // Original text: "This will restart your host. Do you want to continue?"
  restartHostModalMessage: 'Bu işlem sunucunuzu yeniden başlatacak. Devam etmek istiyor musunuz?',

  // Original text: "Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}"
  restartHostsAgentsModalTitle: 'Sunucu ajanını yeniden başlat',

  // Original text: "Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?"
  restartHostsAgentsModalMessage: '{nHosts, number} sunucunun ajanlarını yeniden başlatmak istediğinize emin misiniz?',

  // Original text: "Restart Host{nHosts, plural, one {} other {s}}"
  restartHostsModalTitle: 'Sunucuyu(ları) yeniden başlat',

  // Original text: "Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}}?"
  restartHostsModalMessage: '{nHosts, number} sunucuyu yeniden başlatmak istediğinize emin misiniz?',

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'VM(leri) başlat',

  // Original text: "Start a copy"
  cloneAndStartVM: 'Bir kopya başlat',

  // Original text: "Force start"
  forceStartVm: 'Zorla başlat',

  // Original text: "Forbidden operation"
  forceStartVmModalTitle: 'Yasak işlem',

  // Original text: "Start operation for this vm is blocked."
  blockedStartVmModalMessage: 'Başlatma işlemi bu VM için engellenmiş.',

  // Original text: "Forbidden operation start for {nVms, number} vm{nVms, plural, one {} other {s}}."
  blockedStartVmsModalMessage: '{nVms, number} VM için yasak işlem başladı.',

  // Original text: "Are you sure you want to start {vms, number} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage: '{vms, number} VM başlatmak istediğinize emin misiniz?',

  // Original text: "{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information"
  failedVmsErrorMessage:
    '{nVms, number} VM başarısız oldu. Daha fazla bilgi almak için lütfen günlüklerinizi inceleyin',

  // Original text: "Start failed"
  failedVmsErrorTitle: 'Başlatma başarısız',

  // Original text: "Stop Host{nHosts, plural, one {} other {s}}"
  stopHostsModalTitle: 'Sunucuyu(ları) durdur',

  // Original text: "Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?"
  stopHostsModalMessage: '{nHosts, number} sunucuyu durdurmak istediğinize emin misiniz?',

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'VM(leri) durdur',

  // Original text: "Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: '{vms, number} VM durdurmak istediğinize emin misiniz?',

  // Original text: "Restart VM"
  restartVmModalTitle: 'VM yeniden başlat',

  // Original text: "Are you sure you want to restart {name}?"
  restartVmModalMessage: 'Yeniden başlatmak istediğinize emin misiniz {name}?',

  // Original text: "Stop VM"
  stopVmModalTitle: 'VM durdur',

  // Original text: "Are you sure you want to stop {name}?"
  stopVmModalMessage: 'Durdurmak istediğinze emin misiniz {name}?',

  // Original text: "Suspend VM{vms, plural, one {} other {s}}"
  suspendVmsModalTitle: 'VM(leri) duraklat',

  // Original text: "Are you sure you want to suspend {vms, number} VM{vms, plural, one {} other {s}}?"
  suspendVmsModalMessage: '{vms, number} VM duraklatmak istediğinize emin misiniz?',

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'VM(leri) yeniden başlat',

  // Original text: "Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: '{vms, number} VM yeniden başlatmak istediğinize emin misiniz?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Snapshot VM',

  // Original text: "Are you sure you want to snapshot {vms, number} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage: '{vms, number} VM için snapshot almak istediğinize emin misiniz?',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'VM sil',

  // Original text: "Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage: '{vms, number} VM silmek istediğinize emin misiniz? BÜTÜN VM DİSKLERİ KALDIRILACAK',

  // Original text: "delete {nVms, number} vm{nVms, plural, one {} other {s}}"
  deleteVmsConfirmText: '{nVms, number} vm sil',

  // Original text: "Delete VM"
  deleteVmModalTitle: 'VM sil',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage: "Bu VM'i silmek istediğinize emin misiniz? BÜTÜN VM DİSKLERİ KALDIRILACAK",

  // Original text: "Blocked operation"
  deleteVmBlockedModalTitle: 'Engellenmiş işlem',

  // Original text: "Removing the VM is a blocked operation. Would you like to remove it anyway?"
  deleteVmBlockedModalMessage: 'VM kaldırmak engellenmiş bir işlemdir. Yine de kaldırmak istiyor musunuz?',

  // Original text: "Migrate VM"
  migrateVmModalTitle: 'VM taşı',

  // Original text: "Select a destination host:"
  migrateVmSelectHost: 'Hedef sunucuyu seçin:',

  // Original text: "Select a migration network:"
  migrateVmSelectMigrationNetwork: 'Taşımak için kullnılacak ağı seçin:',

  // Original text: "For each VIF, select a network:"
  migrateVmSelectNetworks: 'Her VIF için bir ağ seçin',

  // Original text: "Select a destination SR:"
  migrateVmsSelectSr: "Hedef SR'yi seçin",

  // Original text: "Select a destination SR for local disks:"
  migrateVmsSelectSrIntraPool: "Yerel diskler için hedef SR'yi seçin:",

  // Original text: "Select a network on which to connect each VIF:"
  migrateVmsSelectNetwork: "Her bir VIF'in bağlanacağı bir ağ seçin:",

  // Original text: "Smart mapping"
  migrateVmsSmartMapping: 'Akıllı haritalama',

  // Original text: "VIF"
  migrateVmVif: 'VIF',

  // Original text: "Network"
  migrateVmNetwork: 'Ağ',

  // Original text: "No target host"
  migrateVmNoTargetHost: 'Hedef sunucu yok',

  // Original text: "A target host is required to migrate a VM"
  migrateVmNoTargetHostMessage: 'Vm taşımak için bir hedef sunucu gereklidir',

  // Original text: "No default SR"
  migrateVmNoDefaultSrError: 'Varsayılan SR yok',

  // Original text: "Default SR not connected to host"
  migrateVmNotConnectedDefaultSrError: 'Varsayılan SR sunucuya bağlı değil',

  // Original text: "For each VDI, select an SR:"
  chooseSrForEachVdisModalSelectSr: 'Her bir VDI için bir SR seçin',

  // Original text: "Select main SR…"
  chooseSrForEachVdisModalMainSr: "Ana SR'yi seçin...",

  // Original text: "VDI"
  chooseSrForEachVdisModalVdiLabel: 'VDI',

  // Original text: "SR*"
  chooseSrForEachVdisModalSrLabel: 'SR*',

  // Original text: "* optional"
  optionalEntry: '* opsiyonel',

  // Original text: "Delete job{nJobs, plural, one {} other {s}}"
  deleteJobsModalTitle: 'İşi(leri) sil',

  // Original text: "Are you sure you want to delete {nJobs, number} job{nJobs, plural, one {} other {s}}?"
  deleteJobsModalMessage: '{nJobs, number} işi silmek istediğinize emin misiniz?',

  // Original text: "Delete VBD{nVbds, plural, one {} other {s}}"
  deleteVbdsModalTitle: 'VBD sil',

  // Original text: "Are you sure you want to delete {nVbds, number} VBD{nVbds, plural, one {} other {s}}?"
  deleteVbdsModalMessage: '{nVbds, number} VBD silmek istediğinize emin misiniz?',

  // Original text: "Delete VDI"
  deleteVdiModalTitle: 'VDI sil',

  // Original text: "Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST"
  deleteVdiModalMessage: 'Bu diski silmek istediğinize emin misiniz? DİSK ÜZERİNDEKİ TÜM VERİ KAYBOLACAK',

  // Original text: "Delete VDI{nVdis, plural, one {} other {s}}"
  deleteVdisModalTitle: 'VDI sil',

  // Original text: "Are you sure you want to delete {nVdis, number} disk{nVdis, plural, one {} other {s}}? ALL DATA ON THESE DISKS WILL BE LOST"
  deleteVdisModalMessage:
    '{nVdis, number} disk silmek istediğinize emin misiniz? DİSKLER ÜZERİNDEKİ TÜM VERİ KAYBOLACAK',

  // Original text: "Delete schedule{nSchedules, plural, one {} other {s}}"
  deleteSchedulesModalTitle: 'Zamanlama sil',

  // Original text: "Are you sure you want to delete {nSchedules, number} schedule{nSchedules, plural, one {} other {s}}?"
  deleteSchedulesModalMessage: '{nSchedules, number} zamanlama silmek istediğinize emin misiniz?',

  // Original text: "Delete remote{nRemotes, plural, one {} other {s}}"
  deleteRemotesModalTitle: 'Hedef sil',

  // Original text: "Are you sure you want to delete {nRemotes, number} remote{nRemotes, plural, one {} other {s}}?"
  deleteRemotesModalMessage: '{nRemotes, number} yedekleme hedefi silmek istediğinze emin misiniz?',

  // Original text: "Revert your VM"
  revertVmModalTitle: "VM'i eski haline döndür",

  // Original text: "Share your VM"
  shareVmInResourceSetModalTitle: "VM'i paylaş",

  // Original text: "This VM will be shared with all the members of the self-service {self}. Are you sure?"
  shareVmInResourceSetModalMessage: "Bu VM self-servis'in tüm üyeleri ile paylaşılacak. Emin misiniz?",

  // Original text: "Delete VIF{nVifs, plural, one {} other {s}}"
  deleteVifsModalTitle: 'VIF sil',

  // Original text: "Are you sure you want to delete {nVifs, number} VIF{nVifs, plural, one {} other {s}}?"
  deleteVifsModalMessage: '{nVifs, number} VIF silmek istediğinize emin misiniz?',

  // Original text: "Delete snapshot"
  deleteSnapshotModalTitle: 'Snapshot sil',

  // Original text: "Are you sure you want to delete this snapshot?"
  deleteSnapshotModalMessage: "Bu snapshot'ı silmek istediğinize emin misiniz?",

  // Original text: "Delete snapshot{nVms, plural, one {} other {s}}"
  deleteSnapshotsModalTitle: 'Snapshot sil',

  // Original text: "Are you sure you want to delete {nVms, number} snapshot{nVms, plural, one {} other {s}}?"
  deleteSnapshotsModalMessage: '{nVms, number} snapshot silmek istediğinize emin misiniz?',

  // Original text: "Disconnect VBD{nVbds, plural, one {} other {s}}"
  disconnectVbdsModalTitle: 'VBD bağlantısını kes',

  // Original text: "Are you sure you want to disconnect {nVbds, number} VBD{nVbds, plural, one {} other {s}}?"
  disconnectVbdsModalMessage: '{nVbds, number} VBD bağlantısını kesmek istediğinize emin misiniz',

  // Original text: "Are you sure you want to revert this VM to the snapshot state? This operation is irreversible."
  revertVmModalMessage: "Bu VM'i snapshot'daki haline döndürmek istiyor musunuz? Bu işlem geri alınamaz.",

  // Original text: "Snapshot before"
  revertVmModalSnapshotBefore: 'Snapshot öncesi',

  // Original text: "Import a {name} Backup"
  importBackupModalTitle: 'Bir {name} yedeği içe aktar',

  // Original text: "Start VM after restore"
  importBackupModalStart: "Geri almadan sonra VM'i çalıştır",

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: 'Yedeğinizi seçin...',

  // Original text: "Select a destination SR…"
  importBackupModalSelectSr: 'Bir hedef SR seçin...',

  // Original text: "Are you sure you want to remove all orphaned snapshot VDIs?"
  removeAllOrphanedModalWarning: "Bütün yetim VDI snapshot'larını silmek istediğinize emin misiniz?",

  // Original text: "Remove all logs"
  removeAllLogsModalTitle: 'Bütün günlükleri kaldır',

  // Original text: "Are you sure you want to remove all logs?"
  removeAllLogsModalWarning: 'Bütün günlükleri kaldırmak istediğinize emin misiniz?',

  // Original text: "This operation is definitive."
  definitiveMessageModal: 'Bu işlem kesindir.',

  // Original text: "Previous SR Usage"
  existingSrModalTitle: 'Önceki SR kullanımı',

  // Original text: "This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingSrModalText:
    'Bu yol XenServer sunucusu tarafından bir SR olarak kullanılmış. SR oluşturmaya devam ederseniz tüm veri kaybolacak.',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Önceki LUN kullanımı',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingLunModalText:
    'Bu LUN XenServer sunucusu tarafından bir SR olarak kullanılmış. SR oluşturmaya devam ederseniz tüm veri kaybolacak.',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: 'Mevcut kaydı değiştir?',

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText:
    'XO kurulumunuz zaten {email} adresine kayıtlı, Bunu unutmak ve değiştirmek istiyor musunuz?',

  // Original text: "Ready for trial?"
  trialReadyModal: 'Deneme için hazır mısınız?',

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText:
    'Deneme sürecinde XOA bir internet bağlantısı gerektirir. Bu limit satın alınan sürümlerde yoktur!',

  // Original text: "Cancel task{nTasks, plural, one {} other {s}}"
  cancelTasksModalTitle: 'Görev iptel et',

  // Original text: "Are you sure you want to cancel {nTasks, number} task{nTasks, plural, one {} other {s}}?"
  cancelTasksModalMessage: '{nTasks, number} görevi iptal etmek istediğinize emin misiniz?',

  // Original text: "Destroy task{nTasks, plural, one {} other {s}}"
  destroyTasksModalTitle: 'Görev imha et',

  // Original text: "Are you sure you want to destroy {nTasks, number} task{nTasks, plural, one {} other {s}}?"
  destroyTasksModalMessage: '{nTasks, number} görevi imha etmek istediğinize emin misiniz?',

  // Original text: "Label"
  serverLabel: 'Başlık',

  // Original text: "Host"
  serverHost: 'Sunucu',

  // Original text: "Username"
  serverUsername: 'Kullanıcı adı',

  // Original text: "Password"
  serverPassword: 'Parola',

  // Original text: "Action"
  serverAction: 'Aksiyon',

  // Original text: "Read Only"
  serverReadOnly: 'Yalnızca okunabilir',

  // Original text: "Unauthorized Certificates"
  serverUnauthorizedCertificates: 'Yetkisiz Sertifikalar',

  // Original text: "Allow Unauthorized Certificates"
  serverAllowUnauthorizedCertificates: 'Yetkisiz Sertifikalara İzin Ver',

  // Original text: "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured."
  serverUnauthorizedCertificatesInfo:
    'Sertifikanız reddedildiğinde bunu yapın ancak bağlantınız güvenli olmayacağı için tavsiye edilmez.',

  // Original text: "username"
  serverPlaceHolderUser: 'kullanıcı adı',

  // Original text: "password"
  serverPlaceHolderPassword: 'parola',

  // Original text: "address[:port]"
  serverPlaceHolderAddress: 'adres[:port]',

  // Original text: "label"
  serverPlaceHolderLabel: 'başlık',

  // Original text: "Connect"
  serverConnect: 'Bağlan',

  // Original text: "Error"
  serverError: 'Hata',

  // Original text: "Adding server failed"
  serverAddFailed: 'Server ekleme başarısız',

  // Original text: "Status"
  serverStatus: 'Durum',

  // Original text: "Connection failed. Click for more information."
  serverConnectionFailed: 'Bağlantı başarısız. Bilgi için tıklayın.',

  // Original text: "Connecting…"
  serverConnecting: 'Bağlanıyor...',

  // Original text: "Authentication error"
  serverAuthFailed: 'Kimlik doğrulama hatası',

  // Original text: "Unknown error"
  serverUnknownError: 'Bilinmeyen hata',

  // Original text: "Invalid self-signed certificate"
  serverSelfSignedCertError: 'Geçersiz kendinden imzalı sertifika',

  // Original text: "Do you want to accept self-signed certificate for this server even though it would decrease security?"
  serverSelfSignedCertQuestion:
    'Güvenliği azaltmasına rağmen kendinden imzalı sertifikayı kabul etmek istiyor musunuz?',

  // Original text: "Copy VM"
  copyVm: 'VM kopyala',

  // Original text: "Are you sure you want to copy this VM to {SR}?"
  copyVmConfirm: "Bu VM'i şuraya kopyalamak istediğinize emin misiniz {SR}?",

  // Original text: "Name"
  copyVmName: 'Ad',

  // Original text: "Name pattern"
  copyVmNamePattern: 'Ad kalıbı',

  // Original text: "If empty: name of the copied VM"
  copyVmNamePlaceholder: "Eğer boşsa: kopyalanan VM'in adı",

  // Original text: "e.g.: \"\\{name\\}_COPY\""
  copyVmNamePatternPlaceholder: 'örn: "\\{name\\}_COPY',

  // Original text: "Select SR"
  copyVmSelectSr: 'SR seç',

  // Original text: "Use compression"
  copyVmCompress: 'Sıkıştırma kullan',

  // Original text: "No target SR"
  copyVmsNoTargetSr: 'Hedef SR yok',

  // Original text: "A target SR is required to copy a VM"
  copyVmsNoTargetSrMessage: 'VM kopyalamak için hedef bir SR gereklidir',

  // Original text: "Detach host"
  detachHostModalTitle: 'Sunucuyu ayır',

  // Original text: "Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST."
  detachHostModalMessage:
    "{host} sunucusunu havuzundan ayırmak istediğinize emin misiniz? BU İŞLEM YEREL DİSKİNDEKİ TÜM VM'LERİ KALDIRIR VE SUNUCU YENİDEN BAŞLAR",

  // Original text: "Detach"
  detachHost: 'ayır',

  // Original text: "Forget host"
  forgetHostModalTitle: 'Sunucuyu unut',

  // Original text: "Are you sure you want to forget {host} from its pool? Be sure this host can't be back online, or use detach instead."
  forgetHostModalMessage:
    '{host} sunucusunu havuzunun unutmasını istediğinize emin misiniz? Bu sunucunun tekrar çevrimiçi olamayacağından emin olun veya bunun yerine ayırmayı deneyin.',

  // Original text: "Forget"
  forgetHost: 'Unut',

  // Original text: "Designate a new master"
  setPoolMasterModalTitle: 'Yeni bir master tayin et',

  // Original text: "This operation may take several minutes. Do you want to continue?"
  setPoolMasterModalMessage: 'Bu işlem birkaç dakika sürebilir. Devam etmek istiyor musunuz?',

  // Original text: "Create network"
  newNetworkCreate: 'Ağ oluştur',

  // Original text: "Create bonded network"
  newBondedNetworkCreate: 'Bağlı ağ oluştur',

  // Original text: "Interface"
  newNetworkInterface: 'Arayüz',

  // Original text: "Name"
  newNetworkName: 'Ad',

  // Original text: "Description"
  newNetworkDescription: 'Açıklama',

  // Original text: "VLAN"
  newNetworkVlan: 'VLAN',

  // Original text: "No VLAN if empty"
  newNetworkDefaultVlan: 'Boşsa VLAN yok',

  // Original text: "MTU"
  newNetworkMtu: 'MTU',

  // Original text: "Default: 1500"
  newNetworkDefaultMtu: 'Varsayılan: 1500',

  // Original text: "Name required"
  newNetworkNoNameErrorTitle: 'Ad gerekli',

  // Original text: "A name is required to create a network"
  newNetworkNoNameErrorMessage: 'Bir ağ oluşturmak için ad gereklidir',

  // Original text: "Bond mode"
  newNetworkBondMode: 'Bağlı mod',

  // Original text: "Delete network"
  deleteNetwork: 'Ağı sil',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: 'Bu ağı silmek istediğinize emin misiniz?',

  // Original text: "This network is currently in use"
  networkInUse: 'Bu ağ şu an kullanımda',

  // Original text: "Bonded"
  pillBonded: 'Bağlı',

  // Original text: "Host"
  addHostSelectHost: 'Sunucu',

  // Original text: "No host"
  addHostNoHost: 'Sunucu yok',

  // Original text: "No host selected to be added"
  addHostNoHostMessage: 'Eklemek için bir sunucu seçilmedi',

  // Original text: "Xen Orchestra"
  xenOrchestra: 'Xen Orchestra',

  // Original text: "No pro support provided!"
  noProSupport: 'Hiçbir profesyonel destek verilmez!',

  // Original text: "Use in production at your own risks"
  noProductionUse: 'Üretimde kendi risklerinizle kullanın.',

  // Original text: "You can download our turnkey appliance at {website}"
  downloadXoaFromWebsite: 'Bizim anahtar teslimi sunucumuzu şuradan indirebilirsiniz {website}',

  // Original text: "Bug Tracker"
  bugTracker: 'Hata Takibi',

  // Original text: "Issues? Report it!"
  bugTrackerText: 'Sorun mu var? Raporlayın!',

  // Original text: "Community"
  community: 'Topluluk',

  // Original text: "Join our community forum!"
  communityText: 'Topluluk forumumuza katılın!',

  // Original text: "Free Trial for Premium Edition!"
  freeTrial: 'Premium Sürüm için Bedava Deneme',

  // Original text: "Request your trial now!"
  freeTrialNow: 'Denemenizi hemen talep edin!',

  // Original text: "Any issue?"
  issues: 'Herhangi bir sorun?',

  // Original text: "Problem? Contact us!"
  issuesText: 'Problem? Bizimle iletişime geçin!',

  // Original text: "Documentation"
  documentation: 'Dokümantasyon',

  // Original text: "Read our official doc"
  documentationText: 'Resmi dokümanımızı okuyun',

  // Original text: "Pro support included"
  proSupportIncluded: 'Profesyonel destek dahildir',

  // Original text: "Access your XO Account"
  xoAccount: 'XO hesabınıza erişin',

  // Original text: "Report a problem"
  openTicket: 'Bir problemi raporlayın',

  // Original text: "Problem? Open a ticket!"
  openTicketText: 'Problem? Bir kayıt açın!',

  // Original text: "Upgrade needed"
  upgradeNeeded: 'Yükseltme gerekli',

  // Original text: "Upgrade now!"
  upgradeNow: 'Şimdi yükselt!',

  // Original text: "Or"
  or: 'Veya',

  // Original text: "Try it for free!"
  tryIt: 'Bedava dene!',

  // Original text: "This feature is available starting from {plan} Edition"
  availableIn: 'Bu özellik {plan} sürümü ile başlıyor',

  // Original text: "This feature is not available in your version, contact your administrator to know more."
  notAvailable:
    'Bu özellik sizin sürümünüzde kullanılabilir değil. Daha fazlasını öğrenmek için yöneticiniz ile temasa geçin.',

  // Original text: "Updates"
  updateTitle: 'Güncellemeler',

  // Original text: "Registration"
  registration: 'Kayıtlanma',

  // Original text: "Trial"
  trial: 'Deneme',

  // Original text: "Settings"
  settings: 'Ayarlar',

  // Original text: "Proxy settings"
  proxySettings: 'Proxy ayarları',

  // Original text: "Host (myproxy.example.org)"
  proxySettingsHostPlaceHolder: 'Sunucu (myproxy.example.org)',

  // Original text: "Port (eg: 3128)"
  proxySettingsPortPlaceHolder: 'Port (örn: 3128)',

  // Original text: "Username"
  proxySettingsUsernamePlaceHolder: 'Kullanıcı adı',

  // Original text: "Password"
  proxySettingsPasswordPlaceHolder: 'Parola',

  // Original text: "Your email account"
  updateRegistrationEmailPlaceHolder: 'Eposta hesabınız',

  // Original text: "Your password"
  updateRegistrationPasswordPlaceHolder: 'Parolanız',

  // Original text: "Troubleshooting documentation"
  updaterTroubleshootingLink: 'Sorun giderme dokümanları',

  // Original text: "Update"
  update: 'Güncelle',

  // Original text: "Refresh"
  refresh: 'Yenile',

  // Original text: "Upgrade"
  upgrade: 'Yükselt',

  // Original text: 'Downgrade'
  downgrade: undefined,

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'Topluluk sürümü için güncelleştirici sunulmuyor',

  // Original text: "Please consider subscribing and trying it with all the features for free during 30 days on {link}."
  considerSubscribe:
    'Lütfen {link} adresinden abone olun ve 30 gün boyunca ücretsiz olarak tüm özellikleri kullanmayı deneyin.',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning:
    'El ile güncelleştirme, geçerli yüklemenizi bağımlılıklar nedeniyle bozabilir, dikkatli bir şekilde yapın.',

  // Original text: "Current version:"
  currentVersion: 'Mevcut sürüm:',

  // Original text: "Register"
  register: 'Kaydol',

  // Original text: "Edit registration"
  editRegistration: 'Kaydı düzenle',

  // Original text: "Please, take time to register in order to enjoy your trial."
  trialRegistration: 'Lütfen, denemenizin tadını çıkarmak adına kaydolmak için zaman ayırın.',

  // Original text: "Start trial"
  trialStartButton: 'Denemeyi başlat',

  // Original text: "You can use a trial version until {date, date, medium}. Upgrade your appliance to get it."
  trialAvailableUntil:
    'Deneme sürümünü {date, date, medium} tarihine kadar kullanabilirsiniz. Almak için cihazınızı yeni sürüme geçirin.',

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed: 'Denemeniz süreniz sona erdi. Bize ulaşın veya Ücretsiz sürüme geçin.',

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked: "Xoa-updater hizmetiniz çalışmıyor gibi görünüyor. XOA'nız bu servise ulaşmadan tamamen çalışamaz.",

  // Original text: "No update information available"
  noUpdateInfo: 'Güncelleme bilgisi mevcut değil',

  // Original text: "Update information may be available"
  waitingUpdateInfo: 'Güncelleme bilgileri mevcut olabilir',

  // Original text: "Your XOA is up-to-date"
  upToDate: 'XOA güncel',

  // Original text: "You need to update your XOA (new version is available)"
  mustUpgrade: 'XOA güncellenmeli (yeni versiyon kullanıma hazır)',

  // Original text: "Your XOA is not registered for updates"
  registerNeeded: "XOA'nız güncellemeler için kayıtlı değil",

  // Original text: "Can't fetch update information"
  updaterError: 'Güncelleme bilgisi alınamıyor',

  // Original text: "Upgrade successful"
  promptUpgradeReloadTitle: 'Yükseltme başarılı',

  // Original text: "Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?"
  promptUpgradeReloadMessage:
    "XOA'nız başarıyla yükseltildi ve tarayıcınız uygulamayı yeniden yüklemelidir. Şimdi yeniden yüklemek istiyor musunuz?",

  // Original text: "Upgrade warning"
  upgradeWarningTitle: 'Yükseltme uyarısı',

  // Original text: "You have some backup jobs in progress. If you upgrade now, these jobs will be interrupted! Are you sure you want to continue?"
  upgradeWarningMessage:
    'Devam eden bazı yedekleme işleriniz var. Şimdi yükseltirseniz, bu işler kesilecektir! Devam etmek istediğinize emin misiniz?',

  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Kaynak koddan Xen Orchestra',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: "XO'yu kaynak koddan kullanıyorsunuz! Kişisel/kar amacı gütmeyen kullanım için mükemmeldir.",

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: 'Bir şirket iseniz, bizim hazır uygulamamızı kullanmanız daha iyidir + pro destek dahil:',

  // Original text: "This version is not bundled with any support nor updates. Use it with caution for critical tasks."
  disclaimerText3: 'Bu sürüm herhangi bir destek veya güncellemeyle birlikte verilmez. Dikkatli kullanın.',

  // Original text: "Connect PIF"
  connectPif: "PIF'e bağlan",

  // Original text: "Are you sure you want to connect this PIF?"
  connectPifConfirm: "Bu PIF'e bağlanmak istediğinize emin misiniz?",

  // Original text: "Disconnect PIF"
  disconnectPif: 'PIF bağlantısını kes',

  // Original text: "Are you sure you want to disconnect this PIF?"
  disconnectPifConfirm: 'PIF bağlantısını kesmek istediğinize emin misiniz?',

  // Original text: "Delete PIF"
  deletePif: 'PIF sil',

  // Original text: "Are you sure you want to delete this PIF?"
  deletePifConfirm: "Bu PIF'i silmek istediğinize emin misiniz?",

  // Original text: "Delete PIFs"
  deletePifs: "PIF'leri sil",

  // Original text: "Are you sure you want to delete {nPifs, number} PIF{nPifs, plural, one {} other {s}}?"
  deletePifsConfirm: '{nPifs, number} PIF silmek istediğinize emin misiniz?',

  // Original text: "Connected"
  pifConnected: 'Bağlı',

  // Original text: "Disconnected"
  pifDisconnected: 'Bağlı değil',

  // Original text: "Physically connected"
  pifPhysicallyConnected: 'Fiziksel olarak bağlı',

  // Original text: "Physically disconnected"
  pifPhysicallyDisconnected: 'Fiziksel olarak bağlı değil',

  // Original text: "Username"
  username: 'Kullanıcı adı',

  // Original text: "Password"
  password: 'Parola',

  // Original text: "Language"
  language: 'Dil',

  // Original text: "Old password"
  oldPasswordPlaceholder: 'Eski parola',

  // Original text: "New password"
  newPasswordPlaceholder: 'Yeni parola',

  // Original text: "Confirm new password"
  confirmPasswordPlaceholder: 'Yeni parolayı onayla',

  // Original text: "Confirmation password incorrect"
  confirmationPasswordError: 'Onay parola yanlış',

  // Original text: "Password does not match the confirm password."
  confirmationPasswordErrorBody: 'Parola, onaylama parolasıyla uyuşmuyor.',

  // Original text: "Password changed"
  pwdChangeSuccess: 'Parola değişti',

  // Original text: "Your password has been successfully changed."
  pwdChangeSuccessBody: 'Parolanız başarılı bir şekilde değiştirildi',

  // Original text: "Incorrect password"
  pwdChangeError: 'Yanlış parola',

  // Original text: "The old password provided is incorrect. Your password has not been changed."
  pwdChangeErrorBody: 'Girilen eski parola yanlış. Parolanız değiştirilmedi.',

  // Original text: "OK"
  changePasswordOk: 'Tamam',

  // Original text: "SSH keys"
  sshKeys: 'SSH anahtarları',

  // Original text: "New SSH key"
  newSshKey: 'Yeni SSH anahtarı',

  // Original text: "Delete"
  deleteSshKey: 'Sil',

  // Original text: "Delete selected SSH keys"
  deleteSshKeys: 'Seçilen SSH anahtarını sil',

  // Original text: "No SSH keys"
  noSshKeys: 'SSH anahtarı yok',

  // Original text: "New SSH key"
  newSshKeyModalTitle: 'Yeni SSH anahtarı',

  // Original text: "Invalid key"
  sshKeyErrorTitle: 'Geçersiz anahtar',

  // Original text: "An SSH key requires both a title and a key."
  sshKeyErrorMessage: 'Bir SSH anahtarı hem bir başlık hem de bir anahtar gerektirir.',

  // Original text: "Title"
  title: 'Başlık',

  // Original text: "Key"
  key: 'Anahtar',

  // Original text: "Delete SSH key"
  deleteSshKeyConfirm: 'SSH anahtarını sil',

  // Original text: "Are you sure you want to delete the SSH key {title}?"
  deleteSshKeyConfirmMessage: 'SSH anahtarını silmek istediğinizden emin misiniz {title}?',

  // Original text: "Delete SSH key{nKeys, plural, one {} other {s}}"
  deleteSshKeysConfirm: 'SSH anahtarı sil',

  // Original text: "Are you sure you want to delete {nKeys, number} SSH key{nKeys, plural, one {} other {s}}?"
  deleteSshKeysConfirmMessage: '{nKeys, number} SSH anahtarını silmek istediğinize emin misiniz?',

  // Original text: "Others"
  others: 'Diğerleri',

  // Original text: "Loading logs…"
  loadingLogs: 'Günlükler yükleniyor...',

  // Original text: "User"
  logUser: 'Kullanıcı',

  // Original text: "Method"
  logMethod: 'Metod',

  // Original text: "Params"
  logParams: 'Parametreler',

  // Original text: "Message"
  logMessage: 'Mesaj',

  // Original text: "Error"
  logError: 'Hata',

  // Original text: 'Logs'
  logTitle: undefined,

  // Original text: "Display details"
  logDisplayDetails: 'Ayrıntıları görüntüle',

  // Original text: "Date"
  logTime: 'Tarih',

  // Original text: "No stack trace"
  logNoStackTrace: 'Yığın izi yok',

  // Original text: "No params"
  logNoParams: 'Parametre yok',

  // Original text: "Delete log"
  logDelete: 'Günlük sil',

  // Original text: "Delete logs"
  logsDelete: 'Günlükleri sil',

  // Original text: "Delete log{nLogs, plural, one {} other {s}}"
  logDeleteMultiple: 'Günlük(leri) sil',

  // Original text: "Are you sure you want to delete {nLogs, number} log{nLogs, plural, one {} other {s}}?"
  logDeleteMultipleMessage: '{nLogs, number} günlük silmek istediğinize emin misiniz?',

  // Original text: "Delete all logs"
  logDeleteAll: 'Bütün günlükleri sil',

  // Original text: "Delete all logs"
  logDeleteAllTitle: 'Bütün günlükleri sil',

  // Original text: "Are you sure you want to delete all the logs?"
  logDeleteAllMessage: 'Bütün günlükleri silmek istediğinizden emin misiniz?',

  // Original text: "Click to enable"
  logIndicationToEnable: 'Açmak için tıklayın',

  // Original text: "Click to disable"
  logIndicationToDisable: 'Kapatmak için tıklayın',

  // Original text: "Report a bug"
  reportBug: 'Bir hata raporla',

  // Original text: "Job canceled to protect the VDI chain"
  unhealthyVdiChainError: 'VDI zincirini korumak için iş iptal edildi',

  // Original text: "Restart VM's backup"
  backupRestartVm: undefined,

  // Original text: "Click for more information"
  clickForMoreInformation: 'Daha fazla bilgi için tıklayın',

  // Original text: "Name"
  ipPoolName: 'Ad',

  // Original text: "IPs"
  ipPoolIps: "IP'ler",

  // Original text: "IPs (e.g.: 1.0.0.12-1.0.0.17;1.0.0.23)"
  ipPoolIpsPlaceholder: "IP'ler (örn: 1.0.0.12-1.0.0.17;1.0.0.23)",

  // Original text: "Networks"
  ipPoolNetworks: 'Ağlar',

  // Original text: "No IP pools"
  ipsNoIpPool: 'IP havuzu yok',

  // Original text: "Create"
  ipsCreate: 'Oluştur',

  // Original text: "Delete all IP pools"
  ipsDeleteAllTitle: 'Bütün IP havuzlarını sil',

  // Original text: "Are you sure you want to delete all the IP pools?"
  ipsDeleteAllMessage: 'Bütün IP havuzlarını silmek istediğinize emin misiniz?',

  // Original text: "VIFs"
  ipsVifs: "VIF'ler",

  // Original text: "Not used"
  ipsNotUsed: 'Kullanılmadı',

  // Original text: "unknown VIF"
  ipPoolUnknownVif: 'Bilinmeyen VIF',

  // Original text: "Name already exists"
  ipPoolNameAlreadyExists: 'Ad zaten var',

  // Original text: "Keyboard shortcuts"
  shortcutModalTitle: 'Klavye kısayolu',

  // Original text: "Global"
  shortcut_XoApp: 'Global',

  // Original text: "Go to hosts list"
  shortcut_XoApp_GO_TO_HOSTS: 'Sunucu listesine git',

  // Original text: "Go to pools list"
  shortcut_XoApp_GO_TO_POOLS: 'Havuz listesine git',

  // Original text: "Go to VMs list"
  shortcut_XoApp_GO_TO_VMS: 'VM listesine git',

  // Original text: "Go to SRs list"
  shortcut_XoApp_GO_TO_SRS: 'SR listesine git',

  // Original text: "Create a new VM"
  shortcut_XoApp_CREATE_VM: 'Yeni bir VM oluştur',

  // Original text: "Unfocus field"
  shortcut_XoApp_UNFOCUS: 'Odaklanmamış alan',

  // Original text: "Show shortcuts key bindings"
  shortcut_XoApp_HELP: 'Kısayol tuşlarını göster',

  // Original text: "Home"
  shortcut_Home: 'Ev',

  // Original text: "Focus search bar"
  shortcut_Home_SEARCH: 'Arama çubuğuna odaklan',

  // Original text: "Next item"
  shortcut_Home_NAV_DOWN: 'Sonraki öğe',

  // Original text: "Previous item"
  shortcut_Home_NAV_UP: 'Önceki öğe',

  // Original text: "Select item"
  shortcut_Home_SELECT: 'Öğe seç',

  // Original text: "Open"
  shortcut_Home_JUMP_INTO: 'Aç',

  // Original text: "Supported tables"
  shortcut_SortedTable: 'Desteklenen tablolar',

  // Original text: "Focus the table search bar"
  shortcut_SortedTable_SEARCH: 'Tablo arama çubuğuna odaklan',

  // Original text: "Next item"
  shortcut_SortedTable_NAV_DOWN: 'Sonraki öğe',

  // Original text: "Previous item"
  shortcut_SortedTable_NAV_UP: 'Önceki öğe',

  // Original text: "Select item"
  shortcut_SortedTable_SELECT: 'Öğe seç',

  // Original text: "Action"
  shortcut_SortedTable_ROW_ACTION: 'Aksiyon',

  // Original text: "VM"
  settingsAclsButtonTooltipVM: 'VM',

  // Original text: "Hosts"
  settingsAclsButtonTooltiphost: 'Sunucular',

  // Original text: "Pool"
  settingsAclsButtonTooltippool: 'Havuz',

  // Original text: "SR"
  settingsAclsButtonTooltipSR: 'SR',

  // Original text: "Network"
  settingsAclsButtonTooltipnetwork: 'Ağ',

  // Original text: 'Template'
  settingsCloudConfigTemplate: undefined,

  // Original text: 'Delete cloud config{nCloudConfigs, plural, one {} other {s}}'
  confirmDeleteCloudConfigsTitle: undefined,

  // Original text: 'Are you sure you want to delete {nCloudConfigs, number} cloud config{nCloudConfigs, plural, one {} other {s}}?'
  confirmDeleteCloudConfigsBody: undefined,

  // Original text: 'Delete cloud config'
  deleteCloudConfig: undefined,

  // Original text: 'Edit cloud config'
  editCloudConfig: undefined,

  // Original text: 'Delete selected cloud configs'
  deleteSelectedCloudConfigs: undefined,

  // Original text: "No config file selected"
  noConfigFile: 'Yapılandırma dosyası seçilmedi',

  // Original text: "Try dropping a config file here, or click to select a config file to upload."
  importTip: 'Bir yapılandırma dosyasını buraya sürükleyin veya seçmek için tıklayın',

  // Original text: "Config"
  config: 'Yapılandırma',

  // Original text: "Import"
  importConfig: 'İçe aktar',

  // Original text: "Config file successfully imported"
  importConfigSuccess: 'Yapılandırma dosyası başarıyla alındı',

  // Original text: "Error while importing config file"
  importConfigError: 'Yapılandırma dosyası içe aktarılırken hata oluştu',

  // Original text: "Export"
  exportConfig: 'Dışa aktar',

  // Original text: "Download current config"
  downloadConfig: 'Mevcut yapılandırmayı indir',

  // Original text: "No config import available for Community Edition"
  noConfigImportCommunity: 'Topluluk Sürümünde yapılandırma içe aktarma özelliği yoktur',

  // Original text: "Reconnect all hosts"
  srReconnectAllModalTitle: 'Tüm sunuculara tekrar bağlan',

  // Original text: "This will reconnect this SR to all its hosts."
  srReconnectAllModalMessage: "Bu işlem bu SR'yi sunucularına tekrar bağlayacak.",

  // Original text: "This will reconnect each selected SR to its host (local SR) or to every hosts of its pool (shared SR)."
  srsReconnectAllModalMessage:
    "Bu işlem seçili yerel SR'leri sunucularına, paylaşımlı SR'leri havuzuna tekrar bağlayacak.",

  // Original text: "Disconnect all hosts"
  srDisconnectAllModalTitle: 'Tüm sunucuların bağlantısını kes',

  // Original text: "This will disconnect this SR from all its hosts."
  srDisconnectAllModalMessage: "Bu işlem bu SR'nin sunucu bağlantısını kesecek.",

  // Original text: "This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR)."
  srsDisconnectAllModalMessage:
    "Bu işlem seçili yerel SR'nin sunucu bağlantısını, paylaşımlı SR'nin havuz bağlantısını kesecek.",

  // Original text: "Forget SR"
  srForgetModalTitle: 'SR Unut',

  // Original text: "Forget selected SRs"
  srsForgetModalTitle: "Seçili SR'leri unut",

  // Original text: "Are you sure you want to forget this SR? VDIs on this storage won't be removed."
  srForgetModalMessage: "Bu SR'yi unutmak istediğinize emin misinz? Bu işlem SR üzerindeki VDI'ları silmez.",

  // Original text: "Are you sure you want to forget all the selected SRs? VDIs on these storages won't be removed."
  srsForgetModalMessage: "Seçili SR'leri unutmak istediğinize emin misinz? Bu işlem SR'ler üzerindeki VDI'ları silmez.",

  // Original text: "Disconnected"
  srAllDisconnected: 'Bağlantıyı kes',

  // Original text: "Partially connected"
  srSomeConnected: 'Kısmen bağlı',

  // Original text: "Connected"
  srAllConnected: 'Bağlı',

  // Original text: "XOSAN"
  xosanTitle: 'XOSAN',

  // Original text: "Xen Orchestra SAN SR"
  xosanSrTitle: 'Xen Orchestra SAN SR',

  // Original text: "Select local SRs (lvm)"
  xosanAvailableSrsTitle: "Yerel SR'leri seçin (lvm)",

  // Original text: "Suggestions"
  xosanSuggestions: 'Öneriler',

  // Original text: "Warning: using disperse layout is not recommended right now. Please read {link}."
  xosanDisperseWarning: 'Uyarı: dağıtma düzeninin kullanılması şu anda önerilmez. Lütfen okuyun {link}.',

  // Original text: "Name"
  xosanName: 'Ad',

  // Original text: "Host"
  xosanHost: 'Sunucu',

  // Original text: "Connected Hosts"
  xosanHosts: 'Bağlı Sunucular',

  // Original text: "Pool"
  xosanPool: 'Havuz',

  // Original text: "Volume ID"
  xosanVolumeId: 'Volume ID',

  // Original text: "Size"
  xosanSize: 'Boyut',

  // Original text: "Used space"
  xosanUsedSpace: 'Kullanılan alan',

  // Original text: "License"
  license: 'Lisans',

  // Original text: "This XOSAN has more than 1 license!"
  xosanMultipleLicenses: "Bu XOSAN 1'den fazla lisansa sahip!",

  // Original text: "XOSAN pack needs to be installed and up to date on each host of the pool."
  xosanNeedPack: 'XOSAN paketinin havuzdaki tüm sunuculara kurulması gerekir.',

  // Original text: "Install it now!"
  xosanInstallIt: 'Şimdi kur!',

  // Original text: "Some hosts need their toolstack to be restarted before you can create an XOSAN"
  xosanNeedRestart: "XOSAN oluşturmadan önce bazı sunucuların toolstack'ı yeniden başlatılmalı",

  // Original text: "Restart toolstacks"
  xosanRestartAgents: "toolstack'ları yeniden başlat",

  // Original text: "Pool master is not running"
  xosanMasterOffline: "Havuzun master'ı çalışmıyor",

  // Original text: "Install XOSAN pack on {pool}"
  xosanInstallPackTitle: 'XOSAN paketini şuraya kur {pool}',

  // Original text: "Select at least 2 SRs"
  xosanSelect2Srs: 'En az 2 SR seçin',

  // Original text: "Layout"
  xosanLayout: 'Düzen',

  // Original text: "Redundancy"
  xosanRedundancy: 'Fazlalık',

  // Original text: "Capacity"
  xosanCapacity: 'Kapasite',

  // Original text: "Available space"
  xosanAvailableSpace: 'Kullanılabilir alan',

  // Original text: "* Can fail without data loss"
  xosanDiskLossLegend: '* Veri kaybı olmadan başarısız olabilir',

  // Original text: "Create"
  xosanCreate: 'Oluştur',

  // Original text: "Add"
  xosanAdd: 'Ekle',

  // Original text: "Installing XOSAN. Please wait…"
  xosanInstalling: 'XOSAN yükleniyor. Lütfen bekleyin...',

  // Original text: "No XOSAN available for Community Edition"
  xosanCommunity: 'Topluluk sürümünde XOSAN özelliği yoktur',

  // Original text: "New"
  xosanNew: 'Yeni',

  // Original text: "Advanced"
  xosanAdvanced: 'Gelişmiş',

  // Original text: "Remove subvolumes"
  xosanRemoveSubvolumes: "Alt volume'leri kaldır",

  // Original text: "Add subvolume…"
  xosanAddSubvolume: 'Alt volume ekle...',

  // Original text: "This version of XOSAN SR is from the first beta phase. You can keep using it, but to modify it you'll have to save your disks and re-create it."
  xosanWarning:
    "XOSAN SR'nin bu versiyonu ilk beta sürümünden. Kullanmaya devam edebilirsiniz, ancak değiştirmek için disklerinizi kaydetmeniz ve yeniden oluşturmanız gerekir.",

  // Original text: "VLAN"
  xosanVlan: 'VLAN',

  // Original text: "No XOSAN found"
  xosanNoSrs: 'XOSAN bulunamadı',

  // Original text: "Some SRs are detached from the XOSAN"
  xosanPbdsDetached: "Bazı SR'ler XOSAN'dan ayrıldı",

  // Original text: "Something is wrong with: {badStatuses}"
  xosanBadStatus: 'Şununla ilgili birşeyler yanlış: {badStatuses}',

  // Original text: "Running"
  xosanRunning: 'Çalışıyor',

  // Original text: 'Update packs'
  xosanUpdatePacks: undefined,

  // Original text: 'Checking for updates'
  xosanPackUpdateChecking: undefined,

  // Original text: 'Error while checking XOSAN packs. Please make sure that the Cloud plugin is installed and loaded and that the updater is reachable.'
  xosanPackUpdateError: undefined,

  // Original text: 'XOSAN resources are unavailable'
  xosanPackUpdateUnavailable: undefined,

  // Original text: 'Not registered for XOSAN resources'
  xosanPackUpdateUnregistered: undefined,

  // Original text: "✓ This pool's XOSAN packs are up to date!"
  xosanPackUpdateUpToDate: undefined,

  // Original text: 'Update pool with latest pack v{version}'
  xosanPackUpdateVersion: undefined,

  // Original text: "Delete XOSAN"
  xosanDelete: 'XOSAN sil',

  // Original text: "Fix"
  xosanFixIssue: 'Onar',

  // Original text: "Creating XOSAN on {pool}"
  xosanCreatingOn: '{pool} üzerinde XOSAN oluşturuluyor',

  // Original text: "Configuring network…"
  xosanState_configuringNetwork: 'Ağ yapılandırılıyor...',

  // Original text: "Importing VM…"
  xosanState_importingVm: 'VM içe aktarılıyor...',

  // Original text: "Copying VMs…"
  xosanState_copyingVms: "VM'ler kopyalanıyor...",

  // Original text: "Configuring VMs…"
  xosanState_configuringVms: "VM'ler yapılandırılıyor...",

  // Original text: "Configuring gluster…"
  xosanState_configuringGluster: 'Gluster yapılandırılıyor...',

  // Original text: "Creating SR…"
  xosanState_creatingSr: 'SR oluşturuluyor...',

  // Original text: "Scanning SR…"
  xosanState_scanningSr: 'SR taranıyor...',

  // Original text: "Install cloud plugin first"
  xosanInstallCloudPlugin: 'Önce XOA eklentisini kurun',

  // Original text: "Load cloud plugin first"
  xosanLoadCloudPlugin: 'Önce XOA eklentisini yükleyin',

  // Original text: "Register your appliance first"
  xosanRegister: "Önce XOSAN'ın kaydını yapın",

  // Original text: "Loading…"
  xosanLoading: 'Yükleniyor...',

  // Original text: "XOSAN is not available at the moment"
  xosanNotAvailable: 'XOSAN şuan kullanılabilir değil',

  // Original text: "No compatible XOSAN pack found for your XenServer versions."
  xosanNoPackFound: 'XenServer sürümünüz ile uyumlu XOSAN paketi bulunamadı.',

  // Original text: "Some XOSAN Virtual Machines are not running"
  xosanVmsNotRunning: 'Bazı XOSAN Sanal Makinaları çalışmıyor',

  // Original text: "Some XOSAN Virtual Machines could not be found"
  xosanVmsNotFound: 'Bazı XOSAN Sanal Makinaları bulunamadı',

  // Original text: "Files needing healing"
  xosanFilesNeedingHealing: 'İyileştirme ihtiyacı olan dosyalar',

  // Original text: "Some XOSAN Virtual Machines have files needing healing"
  xosanFilesNeedHealing: 'Bazı XOSAN Sanal Makinalarında iyileştirilmesi gereken dosyalar var',

  // Original text: "Host {hostName} is not in XOSAN network"
  xosanHostNotInNetwork: '{hostName} sunucusu XOSAN ağında değil',

  // Original text: "VM controller"
  xosanVm: 'VM denetleyici',

  // Original text: "SR"
  xosanUnderlyingStorage: 'SR',

  // Original text: "Replace…"
  xosanReplace: 'Değiştir...',

  // Original text: "On same VM"
  xosanOnSameVm: 'Aynı VM üzerinde',

  // Original text: "Brick name"
  xosanBrickName: 'Brick adı',

  // Original text: "Brick UUID"
  xosanBrickUuid: 'Brick UUID',

  // Original text: "Brick size"
  xosanBrickSize: 'Brick boyutu',

  // Original text: "Memory size"
  xosanMemorySize: 'Bellek boyutu',

  // Original text: "Status"
  xosanStatus: 'Durum',

  // Original text: "Arbiter"
  xosanArbiter: 'Hakem',

  // Original text: "Used Inodes"
  xosanUsedInodes: 'Kullanılan düğümler',

  // Original text: "Block size"
  xosanBlockSize: 'Blok boyutu',

  // Original text: "Device"
  xosanDevice: 'Cihaz',

  // Original text: "FS name"
  xosanFsName: 'FS adı',

  // Original text: "Mount options"
  xosanMountOptions: 'Mount seçenekleri',

  // Original text: "Path"
  xosanPath: 'Yol',

  // Original text: "Job"
  xosanJob: 'İş',

  // Original text: "PID"
  xosanPid: 'PID',

  // Original text: "Port"
  xosanPort: 'Port',

  // Original text: "Missing values"
  xosanReplaceBrickErrorTitle: 'Eksik değerler',

  // Original text: "You need to select a SR and a size"
  xosanReplaceBrickErrorMessage: 'Bir SR ve bir boyut seçmelisiniz',

  // Original text: "Bad values"
  xosanAddSubvolumeErrorTitle: 'Kötü değerler',

  // Original text: "You need to select {nSrs, number} and a size"
  xosanAddSubvolumeErrorMessage: '{nSrs, number} ve bir boyut seçmelisiniz',

  // Original text: "Select {nSrs, number} SRs"
  xosanSelectNSrs: '{nSrs, number} SR seç',

  // Original text: "Run"
  xosanRun: 'Çalıştır',

  // Original text: "Remove"
  xosanRemove: 'Kaldır',

  // Original text: "Volume"
  xosanVolume: 'Volume',

  // Original text: "Volume options"
  xosanVolumeOptions: 'Volume seçenekleri',

  // Original text: "Could not find VM"
  xosanCouldNotFindVm: 'VM bulunamadı',

  // Original text: "Using {usage}"
  xosanUnderlyingStorageUsage: 'Kullanım {usage}',

  // Original text: "Custom IP network (/24)"
  xosanCustomIpNetwork: 'Özel IP ağı (/24)',

  // Original text: "Will configure the host xosan network device with a static IP address and plug it in."
  xosanIssueHostNotInNetwork: 'Sunucu, xosan ağ cihazını statik bir IP adresiyle yapılandırır ve fişe takar.',

  // Original text: "Licenses"
  licensesTitle: 'Lisanslar',

  // Original text: "You are not registered and therefore will not be able to create or manage your XOSAN SRs. {link}"
  xosanUnregisteredDisclaimer: 'Kayıtlı değilsiniz ve bu nedenle XOSAN SR oluşturamaz veya yönetemezsiniz. {Link}',

  // Original text: "In order to create a XOSAN SR, you need to use the Xen Orchestra Appliance and buy a XOSAN license on {link}."
  xosanSourcesDisclaimer:
    "Bir XOSAN SR oluşturmak için, XOA kullanmanız ve {link} 'ten bir XOSAN lisansı satın almanız gerekir.",

  // Original text: "Register now!"
  registerNow: 'Şimdi kaydol!',

  // Original text: "You need to register your appliance to manage your licenses."
  licensesUnregisteredDisclaimer: 'Lisanlarınızı yönetmek için kaydolmalısınız.',

  // Original text: "Product"
  licenseProduct: 'Ürün',

  // Original text: "Attached to"
  licenseBoundObject: 'Şuraya ekli',

  // Original text: "Purchaser"
  licensePurchaser: 'Müşteri',

  // Original text: "Expires"
  licenseExpires: 'Süre bitimi',

  // Original text: "You"
  licensePurchaserYou: 'Siz',

  // Original text: "Support"
  productSupport: 'Destek',

  // Original text: "No XOSAN attached"
  licenseNotBoundXosan: 'Ekli XOSAN yok',

  // Original text: "License attached to an unknown XOSAN"
  licenseBoundUnknownXosan: "Lisans bilinmeyen bir XOSAN'a ekli",

  // Original text: "Manage the licenses"
  licensesManage: 'Lisansları yönet',

  // Original text: "New license"
  newLicense: 'Yeni lisans',

  // Original text: "Refresh"
  refreshLicenses: 'Yenile',

  // Original text: "Limited size because XOSAN is in trial"
  xosanLicenseRestricted: 'Limitli boyut çünkü XOSAN deneme sürecinde',

  // Original text: "You need a license on this SR to manage the XOSAN."
  xosanAdminNoLicenseDisclaimer: "XOSAN'ı yönetmek için bu SR üzerinde bir lisansa ihtiyacınız var.",

  // Original text: "Your XOSAN license has expired. You can still use the SR but cannot administrate it anymore."
  xosanAdminExpiredLicenseDisclaimer:
    "XOSAN lisansınızın süresi doldu. SR'yi hala kullanabilirsiniz ancak artık yönetemezsiniz.",

  // Original text: "Could not check the license on this XOSAN SR"
  xosanCheckLicenseError: "Bu XOSAN SR'deki lisans kontrol edilemedi",

  // Original text: "Could not fetch licenses"
  getLicensesError: 'Lisans alınamadı',

  // Original text: "License has expired."
  xosanLicenseHasExpired: "Lisnas'ın süresi doldu",

  // Original text: "License expires on {date}."
  licenseExpiresDate: 'Lisans {date} tarihinde bitecek.',

  // Original text: "Update the license now!"
  updateLicenseMessage: "Lisans'ı şimdi güncelle!",

  // Original text: "Unknown XOSAN SR."
  xosanUnknownSr: 'Bilinmeyen XOSAN SR',

  // Original text: "Contact us!"
  contactUs: 'Bizimle iletişime geçin!',

  // Original text: "No license."
  xosanNoLicense: 'Lisans yok.',

  // Original text: "Unlock now!"
  unlockNow: 'Şimdi kilidi kaldır!',

  // Original text: "Select a license"
  selectLicense: 'Bir lisans seç',

  // Original text: "Bind license"
  bindLicense: "Lisans'ı bağla",

  // Original text: "expires on {date}"
  expiresOn: '{date} tarihinde bitecek',

  // Original text: "Install XOA plugin first"
  xosanInstallXoaPlugin: 'Önce XOA eklentisini kurun',

  // Original text: "Load XOA plugin first"
  xosanLoadXoaPlugin: 'Önce XOA eklentisini yükleyin',

  // Original text: '{seconds, plural, one {# second} other {# seconds}}'
  secondsFormat: undefined,

  // Original text: "{days, plural, =0 {} one {# day } other {# days }}{hours, plural, =0 {} one {# hour } other {# hours }}{minutes, plural, =0 {} one {# minute } other {# minutes }}{seconds, plural, =0 {} one {# second} other {# seconds}}"
  durationFormat:
    '{days, plural, =0 {} one {# day } other {# days }}{hours, plural, =0 {} one {# hour } other {# hours }}{minutes, plural, =0 {} one {# minute } other {# minutes }}{seconds, plural, =0 {} one {# second} other {# seconds}}',
}
