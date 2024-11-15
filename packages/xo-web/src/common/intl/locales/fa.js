// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/fa'

import reactIntlData from 'react-intl/locale-data/fa'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)
// ===================================================================

export default {
  // Original text: '{key}: {value}'
  keyValue: 'undefined',

  // Original text: 'Connecting'
  statusConnecting: 'در حال اتصال',

  // Original text: 'Disconnected'
  statusDisconnected: 'قطع شده است',

  // Original text: 'Loading…'
  statusLoading: 'در حال بارگذاری…',

  // Original text: 'Page not found'
  errorPageNotFound: 'صفحه پیدا نشد',

  // Original text: 'no such item'
  errorNoSuchItem: 'هیچ موردی وجود ندارد',

  // Original text: 'unknown item'
  errorUnknownItem: 'مورد ناشناخته',

  // Original text: 'Long click to edit'
  editableLongClickPlaceholder: 'برای ویرایش کلیک کرده و کلیک را نگه دارید',

  // Original text: 'Click to edit'
  editableClickPlaceholder: 'برای ویرایش کلیک کنید',

  // Original text: 'Browse files'
  browseFiles: 'مرور فایل ها',

  // Original text: 'Show logs'
  showLogs: 'نمایش گزارش ها',

  // Original text: 'OK'
  alertOk: 'اوکی',

  // Original text: 'OK'
  confirmOk: 'اوکی',

  // Original text: 'Cancel'
  genericCancel: 'لغو',

  // Original text: 'Enter the following text to confirm:'
  enterConfirmText: 'به منظور تایید، متن زیر را وارد کنید',

  // Original text: 'On error'
  onError: 'خطا',

  // Original text: 'Successful'
  successful: 'موفق',

  // Original text: 'Managed disks'
  filterOnlyManaged: 'دیسک های مدیریت شده',

  // Original text: 'Orphaned disks'
  filterOnlyOrphaned: 'دیسک های بدون سرپرست',

  // Original text: 'Normal disks'
  filterOnlyRegular: 'دیسک های عادی',

  // Original text: 'Snapshot disks'
  filterOnlySnapshots: 'دیسک های اسنپ شات',

  // Original text: 'Unmanaged disks'
  filterOnlyUnmanaged: 'دیسک های مدیریت نشده',

  // Original text: 'Save…'
  filterSaveAs: 'ذخیره…',

  // Original text: 'Explore the search syntax in the documentation'
  filterSyntaxLinkTooltip: 'نحوه جستجو در اسناد را کاوش کنید',

  // Original text: 'Connected VIFs'
  filterVifsOnlyConnected: 'VIFهای متصل شده',

  // Original text: 'Disconnected VIFs'
  filterVifsOnlyDisconnected: 'VIFهای قطع شده',

  // Original text: 'Connected remotes'
  filterRemotesOnlyConnected: 'از راه دور وصل شده',

  // Original text: 'Disconnected remotes'
  filterRemotesOnlyDisconnected: 'از راه دور قطع شده',

  // Original text: 'Copy to clipboard'
  copyToClipboard: 'کپی در حافظه',

  // Original text: 'Copy {uuid}'
  copyUuid: 'کپی {uuid}',

  // Original text: 'Master'
  pillMaster: 'اصلی',

  // Original text: 'Home'
  homePage: 'خانه',

  // Original text: 'VMs'
  homeVmPage: 'ماشین های مجازی',

  // Original text: 'Hosts'
  homeHostPage: 'میزبان ها',

  // Original text: 'Pools'
  homePoolPage: 'استخرها',

  // Original text: 'Templates'
  homeTemplatePage: 'قالب ها',

  // Original text: 'Storages'
  homeSrPage: 'ذخیره سازها',

  // Original text: 'Dashboard'
  dashboardPage: 'داشبورد',

  // Original text: 'Overview'
  overviewDashboardPage: 'مرور کلی',

  // Original text: 'Visualizations'
  overviewVisualizationDashboardPage: 'تصویر سازی',

  // Original text: 'Statistics'
  overviewStatsDashboardPage: 'آمار',

  // Original text: 'Health'
  overviewHealthDashboardPage: 'سلامت',

  // Original text: 'Self service'
  selfServicePage: 'سلف سرویس',

  // Original text: 'Backup'
  backupPage: 'پشتیبان گیری',

  // Original text: 'Jobs'
  jobsPage: 'کارها',

  // Original text: 'XOA'
  xoaPage: 'XOA',

  // Original text: 'Updates'
  updatePage: 'به روز رسانی ها',

  // Original text: 'Licenses'
  licensesPage: 'لایسنس ها',

  // Original text: 'Settings'
  settingsPage: 'تنظیمات',

  // Original text: 'Servers'
  settingsServersPage: 'سرورها',

  // Original text: 'Users'
  settingsUsersPage: 'کاربران',

  // Original text: 'Groups'
  settingsGroupsPage: 'گروه ها',

  // Original text: 'ACLs'
  settingsAclsPage: 'لیست های کنترل دسترسی',

  // Original text: 'Plugins'
  settingsPluginsPage: 'پلاگین ها',

  // Original text: 'Logs'
  settingsLogsPage: 'گزارش ها',

  // Original text: 'Cloud configs'
  settingsCloudConfigsPage: 'تنظیمات ابر',

  // Original text: 'IPs'
  settingsIpsPage: 'آدرس های آی پی',

  // Original text: 'Config'
  settingsConfigPage: 'پیکربندی',

  // Original text: 'About'
  aboutPage: 'درباره',

  // Original text: 'About XO {xoaPlan}'
  aboutXoaPlan: 'درباره XO {xoaPlan}',

  // Original text: 'New'
  newMenu: 'جدید',

  // Original text: 'Tasks'
  taskMenu: 'وظایف',

  // Original text: 'Tasks'
  taskPage: 'وظایف',

  // Original text: 'VM'
  newVmPage: 'ماشین مجازی',

  // Original text: 'Storage'
  newSrPage: 'ذخیره ساز',

  // Original text: 'Server'
  newServerPage: 'سرور',

  // Original text: 'Import'
  newImport: 'وارد کردن',

  // Original text: 'XOSAN'
  xosan: 'XOSAN',

  // Original text: 'Warning: Backup is deprecated, use Backup NG instead.'
  backupDeprecatedMessage: 'هشدار: پشتیبان گیری منسوخ شده است، به جای آن از Backup NG استفاده کنید.',

  // Original text: 'How to migrate to Backup NG'
  backupMigrationLink: 'چگونه به Backup NG مهاجرت کنیم',

  // Original text: 'Create a new backup with Backup NG'
  backupNgNewPage: 'ساخت یک پشتیبان گیری جدید با Backup NG',

  // Original text: 'Overview'
  backupOverviewPage: 'مرور کلی',

  // Original text: 'New'
  backupNewPage: 'جدید',

  // Original text: 'Remotes'
  backupRemotesPage: 'ریموت ها',

  // Original text: 'Restore'
  backupRestorePage: 'بازیابی',

  // Original text: 'File restore'
  backupFileRestorePage: 'بازیابی فایل',

  // Original text: 'Schedule'
  schedule: 'زمان بندی',

  // Original text: 'New VM backup'
  newVmBackup: 'پشتیبان گیری جدید از ماشین مجازی',

  // Original text: 'Edit VM backup'
  editVmBackup: 'ویرایش نسخه پشتیبان ماشین مجازی',

  // Original text: 'Backup'
  backup: 'پشتیبان گیری',

  // Original text: 'Rolling Snapshot'
  rollingSnapshot: 'گردش اسنپ شات',

  // Original text: 'Delta Backup'
  deltaBackup: 'پشتیبان گیری دلتا',

  // Original text: 'Disaster Recovery'
  disasterRecovery: 'بازیابی بعد از حادثه',

  // Original text: 'Continuous Replication'
  continuousReplication: 'تکثیر مداوم',

  // Original text: 'Overview'
  jobsOverviewPage: 'مرور کلی',

  // Original text: 'New'
  jobsNewPage: 'جدید',

  // Original text: 'Scheduling'
  jobsSchedulingPage: 'زمان بندی کردن',

  // Original text: 'Custom Job'
  customJob: 'کار سفارشی',

  // Original text: 'User'
  userPage: 'کاربر',

  // Original text: 'XOA'
  xoa: 'XOA',

  // Original text: 'No support'
  noSupport: 'بدون پشتیبانی',

  // Original text: 'Free upgrade!'
  freeUpgrade: '!ارتقاء رایگان',

  // Original text: 'Sign out'
  signOut: 'خروج',

  // Original text: 'Edit my settings {username}'
  editUserProfile: 'ویرایش تنظیمات من {username}',

  // Original text: 'Fetching data…'
  homeFetchingData: 'واکشی داده…',

  // Original text: 'Welcome to Xen Orchestra!'
  homeWelcome: 'به Xen Orchestra خوش آمدید!',

  // Original text: 'Add your XenServer hosts or pools'
  homeWelcomeText: 'میزبان ها یا استخرهای XenServer خود را اضافه کنید',

  // Original text: 'Some XenServers have been registered but are not connected'
  homeConnectServerText: 'برخی از XenServer ها ثبت شده اند اما متصل نشده اند',

  // Original text: 'Want some help?'
  homeHelp: 'احتیاج به کمک دارید؟',

  // Original text: 'Add server'
  homeAddServer: 'اضافه کردن سرور',

  // Original text: 'Connect servers'
  homeConnectServer: 'اتصال سرورها',

  // Original text: 'Online Doc'
  homeOnlineDoc: 'اسناد آنلاین',

  // Original text: 'Pro Support'
  homeProSupport: 'پشتیبانی حرفه ای',

  // Original text: 'There are no VMs!'
  homeNoVms: 'هیچ ماشین مجازی وجود ندارد!',

  // Original text: 'Or…'
  homeNoVmsOr: 'یا…',

  // Original text: 'Import VM'
  homeImportVm: 'وارد کردن ماشین مجازی',

  // Original text: 'Import an existing VM in xva format'
  homeImportVmMessage: 'وارد کردن یک ماشین مجازی موجود در فرمت xva',

  // Original text: 'Restore a backup'
  homeRestoreBackup: 'بازگرداندن پشتیبان',

  // Original text: 'Restore a backup from a remote store'
  homeRestoreBackupMessage: 'بازگرداندن یک پشتیبان از یک ذخیره ساز راه دور',

  // Original text: 'This will create a new VM'
  homeNewVmMessage: 'این یک ماشین مجازی جدید را ایجاد خواهد کرد',

  // Original text: 'Filters'
  homeFilters: 'فیلترها',

  // Original text: 'No results! Click here to reset your filters'
  homeNoMatches: 'بدون نتیجه! برای ریست کردن فیلترهایتان اینجا کلیک کنید',

  // Original text: 'Pool'
  homeTypePool: 'استخر',

  // Original text: 'Host'
  homeTypeHost: 'میزبان',

  // Original text: 'VM'
  homeTypeVm: 'ماشین مجازی',

  // Original text: 'SR'
  homeTypeSr: 'مخزن ذخیره سازی (SR)',

  // Original text: 'Template'
  homeTypeVmTemplate: 'قالب',

  // Original text: 'Sort'
  homeSort: 'مرتب سازی',

  // Original text: 'Pools'
  homeAllPools: 'استخرها',

  // Original text: 'Hosts'
  homeAllHosts: 'میزبان ها',

  // Original text: 'Tags'
  homeAllTags: 'برچسب ها',

  // Original text: 'Resource sets'
  homeAllResourceSets: 'مجموعه منابع',

  // Original text: 'New VM'
  homeNewVm: 'ماشین مجازی جدید',

  // Original text: 'None'
  homeFilterNone: 'هیچ',

  // Original text: 'Running hosts'
  homeFilterRunningHosts: 'میزبان های در حال اجرا',

  // Original text: 'Disabled hosts'
  homeFilterDisabledHosts: 'میزبان های غیرفعال',

  // Original text: 'Running VMs'
  homeFilterRunningVms: 'ماشین های مجازی در حال اجرا',

  // Original text: 'Non running VMs'
  homeFilterNonRunningVms: 'ماشین های مجازی که در حال اجرا نیستند',

  // Original text: 'Pending VMs'
  homeFilterPendingVms: 'ماشین های مجازی معلق',

  // Original text: 'HVM guests'
  homeFilterHvmGuests: ' HVM مهمان های',

  // Original text: 'Tags'
  homeFilterTags: 'برچسب ها',

  // Original text: 'Sort by'
  homeSortBy: 'مرتب سازی بر اساس',

  // Original text: 'CPUs'
  homeSortByCpus: 'پردازنده ها',

  // Original text: 'Name'
  homeSortByName: 'نام',

  // Original text: 'Power state'
  homeSortByPowerstate: 'وضعیت نیرو',

  // Original text: 'RAM'
  homeSortByRAM: 'حافظه',

  // Original text: 'Shared/Not shared'
  homeSortByShared: 'به اشتراک گذاشته شده/به اشتراک گذاشته نشده',

  // Original text: 'Size'
  homeSortBySize: 'اندازه',

  // Original text: 'Type'
  homeSortByType: 'نوع',

  // Original text: 'Usage'
  homeSortByUsage: 'استفاده',

  // Original text: 'vCPUs'
  homeSortByvCPUs: 'پردازنده های مجازی',

  // Original text: 'Snapshots'
  homeSortVmsBySnapshots: 'اسنپ شات ها',

  // Original text: 'Container'
  homeSortByContainer: 'کانتینر',

  // Original text: 'Pool'
  homeSortByPool: 'استخر',

  // Original text: '{displayed, number}x {icon} (on {total, number})'
  homeDisplayedItems: 'undefined',

  // Original text: '{selected, number}x {icon} selected (on {total, number})'
  homeSelectedItems: 'undefined',

  // Original text: 'More'
  homeMore: 'بیشتر',

  // Original text: 'Migrate to…'
  homeMigrateTo: 'مهاجرت به',

  // Original text: 'Missing patches'
  homeMissingPaths: 'وصله هایی که موجود نیستند',

  // Original text: 'Master:'
  homePoolMaster: ':اصلی',

  // Original text: 'Resource set: {resourceSet}'
  homeResourceSet: 'مجموعه منابع: {resourceSet}',

  // Original text: 'High Availability'
  highAvailability: '(HA) دسترسی در سطح بالا',

  // Original text: 'Shared {type}'
  srSharedType: 'به اشتراک گذاشته شده {type}',

  // Original text: 'Not shared {type}'
  srNotSharedType: 'به اشتراک گذاشته نشده {type}',

  // Original text: 'All of them are selected'
  sortedTableAllItemsSelected: 'همه آن ها انتخاب شده اند',

  // Original text: 'No items found'
  sortedTableNoItems: 'موردی یافت نشد',

  // Original text: '{nFiltered, number} of {nTotal, number} items'
  sortedTableNumberOfFilteredItems: 'undefined',

  // Original text: '{nTotal, number} items'
  sortedTableNumberOfItems: 'undefined',

  // Original text: '{nSelected, number} selected'
  sortedTableNumberOfSelectedItems: 'undefined',

  // Original text: 'Click here to select all items'
  sortedTableSelectAllItems: 'برای انتخاب همه موارد اینجا کلیک کنید',

  // Original text: 'State'
  state: 'حالت',

  // Original text: 'Disabled'
  stateDisabled: 'غیرفعال شده',

  // Original text: 'Enabled'
  stateEnabled: 'فعال شده',

  // Original text: 'Cancel'
  formCancel: 'لغو',

  // Original text: 'Create'
  formCreate: 'ایجاد',

  // Original text: 'Edit'
  formEdit: 'ویرایش',

  // Original text: 'ID'
  formId: 'شناسه',

  // Original text: 'Name'
  formName: 'نام',

  // Original text: 'Reset'
  formReset: 'ریست',

  // Original text: 'Save'
  formSave: 'ذخیره',

  // Original text: 'Notes'
  formNotes: 'یادداشت',

  // Original text: 'Add'
  add: 'اضافه',

  // Original text: 'Select all'
  selectAll: 'انتخاب همه',

  // Original text: 'Remove'
  remove: 'حذف کردن',

  // Original text: 'Preview'
  preview: 'پیش نمایش',

  // Original text: 'Action'
  action: 'عمل',

  // Original text: 'Item'
  item: 'مورد',

  // Original text: 'No selected value'
  noSelectedValue: 'هیچ مقدار انتخاب شده ای وجود ندارد',

  // Original text: 'Choose user(s) and/or group(s)'
  selectSubjects: 'کاربر(ها) و/یا گروه(ها) را انتخاب کنید',

  // Original text: 'Select Object(s)…'
  selectObjects: '…انتخاب شی(ها)',

  // Original text: 'Choose a role'
  selectRole: 'یک رل را انتخاب کنید',

  // Original text: 'Select Host(s)…'
  selectHosts: 'انتخاب میزبان(ها)…',

  // Original text: 'Select object(s)…'
  selectHostsVms: 'انتخاب شی(ها)…',

  // Original text: 'Select Network(s)…'
  selectNetworks: 'انتخاب شبکه(ها)…',

  // Original text: 'Select PIF(s)…'
  selectPifs: 'انتخاب کارت(های) شبکه',

  // Original text: 'Select Pool(s)…'
  selectPools: 'انتخاب استخر(ها)…',

  // Original text: 'Select Remote(s)…'
  selectRemotes: '(ها)انتخاب ریموت…',

  // Original text: 'Select resource set(s)…'
  selectResourceSets: 'انتخاب مجموعه منابع…',

  // Original text: 'Select template(s)…'
  selectResourceSetsVmTemplate: 'انتخاب قالب(ها)…',

  // Original text: 'Select SR(s)…'
  selectResourceSetsSr: 'انتخاب مخزن(های) ذخیره سازی…',

  // Original text: 'Select network(s)…'
  selectResourceSetsNetwork: 'انتخاب شبکه(ها)…',

  // Original text: 'Select disk(s)…'
  selectResourceSetsVdi: 'انتخاب دیسک(ها)…',

  // Original text: 'Select SSH key(s)…'
  selectSshKey: 'SSH انتخاب کلید(های)',

  // Original text: 'Select SR(s)…'
  selectSrs: 'انتخاب مخزن(های) ذخیره سازی…',

  // Original text: 'Select VM(s)…'
  selectVms: 'انتخاب ماشین(های) مجازی…',

  // Original text: 'Select snapshot(s)…'
  selectVmSnapshots: 'انتخاب اسنپ شات(ها)…',

  // Original text: 'Select VM template(s)…'
  selectVmTemplates: 'انتخاب قالب(های) ماشین مجازی…',

  // Original text: 'Select tag(s)…'
  selectTags: 'انتخاب برچسب(ها)…',

  // Original text: 'Select disk(s)…'
  selectVdis: 'انتخاب دیسک(ها)',

  // Original text: 'Select timezone…'
  selectTimezone: 'انتخاب منطقه زمانی…',

  // Original text: 'Select IP(s)…'
  selectIp: 'انتخاب آدرس(های) آی پی…',

  // Original text: 'Select IP pool(s)…'
  selectIpPool: 'انتخاب استخر(های) IP',

  // Original text: 'Select VGPU type(s)…'
  selectVgpuType: 'انتخاب نوع GPUهای مجازی',

  // Original text: 'Fill required information.'
  fillRequiredInformations: 'اطلاعات مورد نیاز را پر کنید.',

  // Original text: 'Fill information (optional)'
  fillOptionalInformations: 'اطلاعات را پر کنید (اختیاری)',

  // Original text: 'Reset'
  selectTableReset: 'ریست',

  // Original text: 'Select Cloud Config(s)…'
  selectCloudConfigs: 'پیکربندی (های) فضای ابری را انتخاب کنید',

  // Original text: 'Month'
  schedulingMonth: 'ماه',

  // Original text: 'Every N month'
  schedulingEveryNMonth: 'هر N ماه',

  // Original text: 'Each selected month'
  schedulingEachSelectedMonth: 'هر ماه انتخاب شده',

  // Original text: 'Day'
  schedulingDay: 'روز',

  // Original text: 'Every N day'
  schedulingEveryNDay: 'هر N روز',

  // Original text: 'Each selected day'
  schedulingEachSelectedDay: 'هر روز انتخاب شده',

  // Original text: 'Switch to week days'
  schedulingSetWeekDayMode: 'تغییر به روزهای هفته',

  // Original text: 'Switch to month days'
  schedulingSetMonthDayMode: 'تغییر به روزهای ماه',

  // Original text: 'Hour'
  schedulingHour: 'ساعت',

  // Original text: 'Each selected hour'
  schedulingEachSelectedHour: 'هر ساعت انتخاب شده',

  // Original text: 'Every N hour'
  schedulingEveryNHour: 'هر N ساعت',

  // Original text: 'Minute'
  schedulingMinute: 'دقیقه',

  // Original text: 'Each selected minute'
  schedulingEachSelectedMinute: 'هر دقیقه انتخاب شده',

  // Original text: 'Every N minute'
  schedulingEveryNMinute: 'هر N دقیقه',

  // Original text: 'Every month'
  selectTableAllMonth: 'هر ماه',

  // Original text: 'Every day'
  selectTableAllDay: 'هر روز',

  // Original text: 'Every hour'
  selectTableAllHour: 'هر ساعت',

  // Original text: 'Every minute'
  selectTableAllMinute: 'هر دقیقه',

  // Original text: 'Reset'
  schedulingReset: 'ریست',

  // Original text: 'Unknown'
  unknownSchedule: 'ناشناخته',

  // Original text: 'Web browser timezone'
  timezonePickerUseLocalTime: 'منطقه زمانی تحت مرورگر وب',

  // Original text: 'Server timezone ({value})'
  serverTimezoneOption: 'سرور منطقه زمانی ({value})',

  // Original text: 'Cron Pattern:'
  cronPattern: 'الگوی Cron:',

  // Original text: 'Cannot edit backup'
  backupEditNotFoundTitle: 'امکان ویرایش نسخه پشتیبان وجود ندارد',

  // Original text: 'Missing required info for edition'
  backupEditNotFoundMessage: 'اطلاعات لازم برای ویرایش وجود ندارد',

  // Original text: 'Successful'
  successfulJobCall: 'موفقیت آمیز',

  // Original text: 'Failed'
  failedJobCall: 'ناموفق',

  // Original text: 'Skipped'
  jobCallSkipped: 'رد شدن',

  // Original text: 'In progress'
  jobCallInProgess: 'در حال انجام',

  // Original text: 'Transfer size:'
  jobTransferredDataSize: 'اندازه انتقال:',

  // Original text: 'Transfer speed:'
  jobTransferredDataSpeed: 'سرعت انتقال:',

  // Original text: 'Size'
  operationSize: 'اندازه',

  // Original text: 'Speed'
  operationSpeed: 'سرعت',

  // Original text: 'Type'
  exportType: 'نوع',

  // Original text: 'Merge size:'
  jobMergedDataSize: 'اندازه ادغام:',

  // Original text: 'Merge speed:'
  jobMergedDataSpeed: 'سرعت ادغام:',

  // Original text: 'All'
  allJobCalls: 'همه',

  // Original text: 'Job'
  job: 'کار',

  // Original text: 'Job {job}'
  jobModalTitle: 'کار {job}',

  // Original text: 'ID'
  jobId: 'شناسه',

  // Original text: 'Type'
  jobType: 'نوع',

  // Original text: 'Name'
  jobName: 'نام',

  // Original text: 'Mode'
  jobMode: 'حالت',

  // Original text: 'Name of your job (forbidden: "_")'
  jobNamePlaceholder: 'نام کار شما (ممنوع: "_"(',

  // Original text: 'Start'
  jobStart: 'شروع',

  // Original text: 'End'
  jobEnd: 'پایان',

  // Original text: 'Duration'
  jobDuration: 'مدت زمان',

  // Original text: 'Status'
  jobStatus: 'وضعیت',

  // Original text: 'Action'
  jobAction: 'عمل',

  // Original text: 'Tag'
  jobTag: 'برچسب',

  // Original text: 'Scheduling'
  jobScheduling: 'زمان بندی',

  // Original text: 'Timezone'
  jobTimezone: 'منطقه زمانی',

  // Original text: 'Server'
  jobServerTimezone: 'سرور',

  // Original text: 'Run job'
  runJob: 'اجرای کار',

  // Original text: 'Cancel job'
  cancelJob: 'لغو کار',

  // Original text: 'Are you sure you want to run {backupType} {id} ({tag})?'
  runJobConfirm: 'آیا مطمئن هستید که می خواهید {backupType} {id} ({tag}) را اجرا کنید؟',

  // Original text: 'One shot running started. See overview for logs.'
  runJobVerbose: 'undefined',

  // Original text: 'Edit job'
  jobEdit: 'ویرایش کار',

  // Original text: 'Delete'
  jobDelete: 'حذف کردن',

  // Original text: 'Finished'
  jobFinished: 'تمام شده',

  // Original text: 'Interrupted'
  jobInterrupted: 'وقفه دار',

  // Original text: 'Started'
  jobStarted: 'شروع شده',

  // Original text: 'Failed'
  jobFailed: 'ناموفق',

  // Original text: 'Skipped'
  jobSkipped: 'رد شده',

  // Original text: 'Successful'
  jobSuccess: 'موفقیت آمیز',

  // Original text: 'All'
  allTasks: 'همه',

  // Original text: 'Start'
  taskStart: 'شروع',

  // Original text: 'End'
  taskEnd: 'پایان',

  // Original text: 'Duration'
  taskDuration: 'مدت زمان',

  // Original text: 'Successful'
  taskSuccess: 'موفقیت آمیز',

  // Original text: 'Failed'
  taskFailed: 'ناموفق',

  // Original text: 'Skipped'
  taskSkipped: 'رد شده',

  // Original text: 'Started'
  taskStarted: 'شروع شده',

  // Original text: 'Interrupted'
  taskInterrupted: 'وقفه دار',

  // Original text: 'Transfer size'
  taskTransferredDataSize: 'اندازه انتقال',

  // Original text: 'Transfer speed'
  taskTransferredDataSpeed: 'سرعت انتقال',

  // Original text: 'Merge size'
  taskMergedDataSize: 'اندازه ادغام',

  // Original text: 'Merge speed'
  taskMergedDataSpeed: 'سرعت ادغام',

  // Original text: 'Error'
  taskError: 'خطا',

  // Original text: 'Reason'
  taskReason: 'دلیل',

  // Original text: 'Save'
  saveBackupJob: 'ذخیره',

  // Original text: 'Remove backup job'
  deleteBackupSchedule: 'حذف کار مربوط به پشتیبان گیری',

  // Original text: 'Are you sure you want to delete this backup job?'
  deleteBackupScheduleQuestion: 'آیا مطمئن هستید که می خواهید این کار مربوط به پشتیبان گیری را حذف کنید؟',

  // Original text: 'Delete selected jobs'
  deleteSelectedJobs: 'حذف کارهای انتخاب شده',

  // Original text: 'Enable immediately after creation'
  scheduleEnableAfterCreation: 'بلافاصله پس از ایجاد فعال شود',

  // Original text: 'You are editing Schedule {name} ({id}). Saving will override previous schedule state.'
  scheduleEditMessage: 'شما در حال ویرایش زمانبندی {name} ({id}) هستید. ذخیره کردن وضعیت زمان بندی قبلی را لغو می کند.',

  // Original text: 'You are editing job {name} ({id}). Saving will override previous job state.'
  jobEditMessage: 'شما در حال ویرایش شغل {name} ({id}) هستید. ذخیره کردن وضعیت کار قبلی را لغو می کند.',

  // Original text: 'Edit schedule'
  scheduleEdit: 'ویرایش زمان بندی',

  // Original text: "A name is required to create the backup's job!"
  missingBackupName: 'برای ایجاد کار پشتیبان گیری یک نام مورد نیاز است!',

  // Original text: 'Missing VMs!'
  missingVms: 'ماشین های مجازی که وجود ندارند!',

  // Original text: 'You need to choose a backup mode!'
  missingBackupMode: 'شما باید یک حالت پشتیبان را انتخاب کنید!',

  // Original text: 'Missing remotes!'
  missingRemotes: 'ریموت هایی که وجود ندارند!',

  // Original text: 'Missing SRs!'
  missingSrs: 'مخازن ذخیره سازی که وجود ندارند!',

  // Original text: 'Missing schedules!'
  missingSchedules: 'زمان بندی هایی که وجود ندارند!',

  // Original text: 'The Backup mode and The Delta Backup mode require export retention to be higher than 0!'
  missingExportRetention: 'حالت پشتیبان گیری و حالت پشتیبان گیری دلتا نیاز به Export Retention بالاتر از 0 دارند!',

  // Original text: 'The CR mode and The DR mode require copy retention to be higher than 0!'
  missingCopyRetention: 'حالت CR و حالت DR نیاز به Copy Retention بالاتر از 0 دارند!',

  // Original text: 'The Rolling Snapshot mode requires snapshot retention to be higher than 0!'
  missingSnapshotRetention: 'حالت Rolling Snapshot نیاز به Snapshot Retention دارد که بالاتر از 0 باشد!',

  // Original text: 'One of the retentions needs to be higher than 0!'
  retentionNeeded: 'یکی از Retention ها باید بالاتر از 0 باشد!',

  // Original text: 'No remotes found, please click on the remotes settings button to create one!'
  createRemoteMessage: 'هیچ ریموتی پیدا نشد، لطفاً روی دکمه تنظیمات ریموت کلیک کنید تا یکی بسازید!',

  // Original text: 'Remotes settings'
  remotesSettings: 'تنظیمات ریموت ها',

  // Original text: 'Add a schedule'
  scheduleAdd: 'ایجاد یک زمان بندی',

  // Original text: 'Delete'
  scheduleDelete: 'حذف',

  // Original text: 'Run schedule'
  scheduleRun: 'اجرای زمان بندی',

  // Original text: 'Delete selected schedules'
  deleteSelectedSchedules: 'حذف زمان بندی های انتخاب شده',

  // Original text: 'No scheduled jobs.'
  noScheduledJobs: 'کار زمان بندی شده وجود نداد.',

  // Original text: 'You can delete all your legacy backup snapshots.'
  legacySnapshotsLink: 'می‌توانید تمام اسنپ شات های قدیمی مربوط به نسخه پشتیبان خود را حذف کنید.',

  // Original text: 'New schedule'
  newSchedule: 'زمان بندی جدید',

  // Original text: 'No jobs found.'
  noJobs: 'هیچ کاری پیدا نشد.',

  // Original text: 'No schedules found'
  noSchedules: 'هیچ زمان بندی پیدا نشد',

  // Original text: 'Select a xo-server API command'
  jobActionPlaceHolder: 'یک دستور API مربوط به xo-server را انتخاب کنید',

  // Original text: 'Timeout (number of seconds after which a VM is considered failed)'
  jobTimeoutPlaceHolder: 'وقفه (تعداد ثانیه هایی که پس از آن یک ماشین مجازی ناموفق در نظر گرفته می شود)',

  // Original text: 'Schedules'
  jobSchedules: 'زمان بندی ها',

  // Original text: 'Name of your schedule'
  jobScheduleNamePlaceHolder: 'نام زمان بندی شما',

  // Original text: 'Select a Job'
  jobScheduleJobPlaceHolder: 'یک کار را انتخاب کنید',

  // Original text: 'Job owner'
  jobOwnerPlaceholder: 'صاحب کار',

  // Original text: "This job's creator no longer exists"
  jobUserNotFound: 'سازنده این کار دیگر وجود ندارد',

  // Original text: "This backup's creator no longer exists"
  backupUserNotFound: 'سازنده این نسخه پشتیبان دیگر وجود ندارد',

  // Original text: 'Click here to see the matching VMs'
  redirectToMatchingVms: 'برای دیدن ماشین های مجازی منطبق اینجا کلیک کنید',

  // Original text: 'Migrate to backup NG'
  migrateToBackupNg: 'مهاجرت به backup NG',

  // Original text: 'There are no matching VMs!'
  noMatchingVms: 'هیچ ماشین مجازی منطبقی وجود ندارد!',

  // Original text: '{icon} See the matching VMs ({nMatchingVms, number})'
  allMatchingVms: '{icon} ماشین‌های مجازی منطبق را ببینید ({nMatchingVms, number})',

  // Original text: 'Backup owner'
  backupOwner: 'صاحب نسخه پشتیبان',

  // Original text: 'Migrate to backup NG'
  migrateBackupSchedule: 'مهاجرت به backup NG',

  // Original text: 'This will migrate this backup to a backup NG. This operation is not reversible. Do you want to continue?'
  migrateBackupScheduleMessage:
    'این کار نسخه پشتیبان را به یک backup NG مهاجرت خواهد داد. این عملیات قابل برگشت نیست. آیا می خواهید ادامه دهید؟',

  // Original text: 'Are you sure you want to run {name} ({id})?'
  runBackupNgJobConfirm: 'آیا مطمئن هستید که می خواهید {name} ({id}) را اجرا کنید؟',

  // Original text: 'Are you sure you want to cancel {name} ({id})?'
  cancelJobConfirm: 'آیا مطمئنید که می‌خواهید {name} ({id}) را لغو کنید؟',

  // Original text: 'Advanced settings'
  newBackupAdvancedSettings: 'تنظیمات پیشرفته',

  // Original text: 'Always'
  reportWhenAlways: 'همیشه',

  // Original text: 'Failure'
  reportWhenFailure: 'شکست',

  // Original text: 'Never'
  reportWhenNever: 'هرگز',

  // Original text: 'Report when'
  reportWhen: 'undefined',

  // Original text: 'Concurrency'
  concurrency: 'همزمانی',

  // Original text: 'Select your backup type:'
  newBackupSelection: 'نوع نسخه پشتیبان خود را انتخاب کنید:',

  // Original text: 'Select backup mode:'
  smartBackupModeSelection: 'حالت نسخه پشتیبان را انتخاب کنید:',

  // Original text: 'Normal backup'
  normalBackup: 'پشتیبان گیری معمولی',

  // Original text: 'Smart backup'
  smartBackup: 'پشتیبان گیری هوشمند',

  // Original text: 'Export retention'
  exportRetention: 'نگهداری صدور',

  // Original text: 'Copy retention'
  copyRetention: 'نگهداری کپی',

  // Original text: 'Snapshot retention'
  snapshotRetention: 'نگهداری اسنپ شات',

  // Original text: 'Name'
  backupName: 'نام',

  // Original text: 'Use delta'
  useDelta: 'استفاده از دلتا',

  // Original text: 'Use compression'
  useCompression: 'استفاده از فشرده سازی',

  // Original text: 'Offline snapshot'
  offlineSnapshot: 'اسنپ شات آفلاین',

  // Original text: 'Shutdown VMs before snapshotting them'
  offlineSnapshotInfo: 'ماشین های مجازی را قبل از گرفتن اسنپ شات خاموش کنید',

  // Original text: 'Timeout'
  timeout: 'وقفه',

  // Original text: 'Number of seconds after which a job is considered failed'
  timeoutInfo: 'تعداد ثانیه هایی که پس از آن یک کار شکست خورده در نظر گرفته می شود',

  // Original text: 'Delta Backup and DR require Entreprise plan'
  dbAndDrRequireEntreprisePlan: 'پشتیبان گیری دلتا و DR به طرح سازمانی نیاز دارند',

  // Original text: 'CR requires Premium plan'
  crRequiresPremiumPlan: 'CR به طرح Premium نیاز دارد',

  // Original text: 'Smart mode'
  smartBackupModeTitle: 'حالت هوشمند',

  // Original text: 'Target remotes (for Export)'
  backupTargetRemotes: 'هدف راه دور (برای صادر کردن)',

  // Original text: 'Target SRs (for Replication)'
  backupTargetSrs: 'مخازن ذخیره سازی هدف (برای تکرار)',

  // Original text: 'Local remote selected'
  localRemoteWarningTitle: 'ریموت محلی انتخاب شده است',

  // Original text: 'Warning: local remotes will use limited XOA disk space. Only for advanced users.'
  localRemoteWarningMessage: 'هشدار: ریموت‌های محلی از فضای محدود دیسک XOA استفاده می‌کنند. فقط برای کاربران حرفه ای.',

  // Original text: 'Warning: this feature works only with XenServer 6.5 or newer.'
  backupVersionWarning: 'هشدار: این ویژگی فقط با XenServer 6.5 یا جدیدتر کار می کند.',

  // Original text: 'VMs'
  editBackupVmsTitle: 'ماشین های مجازی',

  // Original text: 'VMs statuses'
  editBackupSmartStatusTitle: 'وضعیت ماشین های مجازی',

  // Original text: 'Resident on'
  editBackupSmartResidentOn: 'ساکن در',

  // Original text: 'Not resident on'
  editBackupSmartNotResidentOn: 'ساکن نیست',

  // Original text: 'Pools'
  editBackupSmartPools: 'استخرها',

  // Original text: 'Tags'
  editBackupSmartTags: 'برچسب ها',

  // Original text: 'Sample of matching Vms'
  sampleOfMatchingVms: 'نمونه ای از ماشین های مجازی منطبق',

  // Original text: 'VMs Tags'
  editBackupSmartTagsTitle: 'برچسب های مربوط به ماشین های مجازی',

  // Original text: 'Excluded VMs tags'
  editBackupSmartExcludedTagsTitle: 'برچسب های حذف شده مربوط به ماشین های مجازی',

  // Original text: 'Reverse'
  editBackupNot: 'معکوس',

  // Original text: 'Tag'
  editBackupTagTitle: 'برچسب',

  // Original text: 'Report'
  editBackupReportTitle: 'گزارش',

  // Original text: 'Automatically run as scheduled'
  editBackupScheduleEnabled: 'طبق برنامه به صورت خودکار اجرا شود',

  // Original text: 'Retention'
  editBackupRetentionTitle: 'حفظ',

  // Original text: 'Remote'
  editBackupRemoteTitle: 'ریموت',

  // Original text: 'Delete the old backups first'
  deleteOldBackupsFirst: 'ابتدا نسخه های پشتیبان قدیمی را حذف کنید',

  // Original text: 'Remote stores for backup'
  remoteList: 'ذخیره‌سازی از راه دور برای پشتیبان‌گیری',

  // Original text: 'New File System Remote'
  newRemote: 'سیستم فایل جدید از راه دور',

  // Original text: 'Local'
  remoteTypeLocal: 'محلی',

  // Original text: 'NFS'
  remoteTypeNfs: 'NFS',

  // Original text: 'SMB'
  remoteTypeSmb: 'SMB',

  // Original text: 'Type'
  remoteType: 'نوع',

  // Original text: 'SMB remotes are meant to work on Windows Server. For other systems (Linux Samba, which means almost all NAS), please use NFS.'
  remoteSmbWarningMessage:
    'ریموت های SMB برای کار روی ویندوز سرور طراحی شده اند. برای سیستم های دیگر (Linux Samba، که به معنای تقریباً تمام NAS ها است)، لطفاً از NFS استفاده کنید.',

  // Original text: 'Test your remote'
  remoteTestTip: 'ریموت خود را تست کنید',

  // Original text: 'Test Remote'
  testRemote: 'تست ریموت',

  // Original text: 'Test failed for {name}'
  remoteTestFailure: 'تست ناموفق بودن برای {name}',

  // Original text: 'Test passed for {name}'
  remoteTestSuccess: 'تست موفق بودن برای {name}',

  // Original text: 'Error'
  remoteTestError: 'خطا',

  // Original text: 'Test Step'
  remoteTestStep: 'مرحله تست',

  // Original text: 'Test file'
  remoteTestFile: 'فایل تست',

  // Original text: 'Test name'
  remoteTestName: 'نام تست',

  // Original text: 'Remote name already exists!'
  remoteTestNameFailure: 'نام ریموت از قبل وجود دارد!',

  // Original text: 'The remote appears to work correctly'
  remoteTestSuccessMessage: 'به نظر می رسد ریموت به درستی کار می کند',

  // Original text: 'Connection failed'
  remoteConnectionFailed: 'ارتباط ناموفق بود',

  // Original text: 'Delete backup job{nJobs, plural, one {} other {s}}'
  confirmDeleteBackupJobsTitle: 'حذف کار پشتیبان{nJobs, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nJobs, number} backup job{nJobs, plural, one {} other {s}}?'
  confirmDeleteBackupJobsBody:
    'آیا مطمئن هستید که می‌خواهید {nJobs, number} کار پشتیبان{nJobs، plural، one {} other {s}} را حذف کنید؟',

  // Original text: 'Name'
  remoteName: 'نام',

  // Original text: 'Path'
  remotePath: 'مسیر',

  // Original text: 'State'
  remoteState: 'وضعیت',

  // Original text: 'Device'
  remoteDevice: 'دستگاه',

  // Original text: 'Share'
  remoteShare: 'اشتراک گذاری',

  // Original text: 'Action'
  remoteAction: 'عمل',

  // Original text: 'Auth'
  remoteAuth: 'احراز هویت',

  // Original text: 'Mounted'
  remoteMounted: 'نصب شده است',

  // Original text: 'Unmounted'
  remoteUnmounted: 'نصب نشده است',

  // Original text: 'Connect'
  remoteConnectTip: 'اتصال',

  // Original text: 'Disconnect'
  remoteDisconnectTip: 'قطع شدن',

  // Original text: 'Connected'
  remoteConnected: 'متصل شده است',

  // Original text: 'Disconnected'
  remoteDisconnected: 'قطع شده است',

  // Original text: 'Delete'
  remoteDeleteTip: 'حذف',

  // Original text: 'Delete selected remotes'
  remoteDeleteSelected: 'ریموت های انتخاب شده را حذف کنید',

  // Original text: 'remote name *'
  remoteNamePlaceHolder: 'نام ریموت *',

  // Original text: 'Name *'
  remoteMyNamePlaceHolder: 'نام *',

  // Original text: '/path/to/backup'
  remoteLocalPlaceHolderPath: '/مسیر/برای/نسخه پشتیبان',

  // Original text: 'host *'
  remoteNfsPlaceHolderHost: 'میزبان *',

  // Original text: 'Port'
  remoteNfsPlaceHolderPort: 'پورت',

  // Original text: 'path/to/backup'
  remoteNfsPlaceHolderPath: '/مسیر/برای/نسخه پشتیبان',

  // Original text: 'subfolder [path\\\\to\\\\backup]'
  remoteSmbPlaceHolderRemotePath: '[مسیر\\\\برای\\\\نسخه پشتیبان]',

  // Original text: 'Username'
  remoteSmbPlaceHolderUsername: 'نام کاربری',

  // Original text: 'Password'
  remoteSmbPlaceHolderPassword: 'کلمه عبور',

  // Original text: 'Domain'
  remoteSmbPlaceHolderDomain: 'دامنه',

  // Original text: '<address>\\\\<share> *'
  remoteSmbPlaceHolderAddressShare: '<آدرس>\\\\<اشتراک گذاری> *',

  // Original text: 'password(fill to edit)'
  remotePlaceHolderPassword: 'کلمه عبور (برای ویرایش پر کنید)',

  // Original text: 'Create a new SR'
  newSrTitle: 'یک مخزن ذخیره سازی (SR) جدید ایجاد کنید',

  // Original text: 'General'
  newSrGeneral: 'عمومی',

  // Original text: 'Select Storage Type:'
  newSrTypeSelection: 'انتخاب نوع ذخیره سازی:',

  // Original text: 'Settings'
  newSrSettings: 'تنظیمات',

  // Original text: 'Storage Usage'
  newSrUsage: 'استفاده از فضای ذخیره سازی',

  // Original text: 'Summary'
  newSrSummary: 'خلاصه',

  // Original text: 'Host'
  newSrHost: 'میزبان',

  // Original text: 'Type'
  newSrType: 'نوع',

  // Original text: 'Name'
  newSrName: 'نام',

  // Original text: 'Description'
  newSrDescription: 'شرح',

  // Original text: 'Server'
  newSrServer: 'سرور',

  // Original text: 'Path'
  newSrPath: 'مسیر',

  // Original text: 'IQN'
  newSrIqn: 'IQN',

  // Original text: 'LUN'
  newSrLun: 'LUN',

  // Original text: 'No HBA devices'
  newSrNoHba: 'دستگاه HBA وجود ندارد',

  // Original text: 'with auth.'
  newSrAuth: 'با اعتبار.',

  // Original text: 'User Name'
  newSrUsername: 'نام کاربری',

  // Original text: 'Password'
  newSrPassword: 'کلمه عبور',

  // Original text: 'Device'
  newSrDevice: 'دستگاه',

  // Original text: 'in use'
  newSrInUse: 'در حال استفاده',

  // Original text: 'Size'
  newSrSize: 'اندازه',

  // Original text: 'Create'
  newSrCreate: 'ایجاد',

  // Original text: 'Storage name'
  newSrNamePlaceHolder: 'نام فضای ذخیره سازی',

  // Original text: 'Storage description'
  newSrDescPlaceHolder: 'شرح فضای ذخیره سازی',

  // Original text: 'Address'
  newSrAddressPlaceHolder: 'آدرس',

  // Original text: '[port]'
  newSrPortPlaceHolder: '[پورت]',

  // Original text: 'Username'
  newSrUsernamePlaceHolder: 'نام کاربری',

  // Original text: 'Password'
  newSrPasswordPlaceHolder: 'کلمه عبور',

  // Original text: 'Device, e.g /dev/sda…'
  newSrLvmDevicePlaceHolder: 'دستگاه, برای مثال /dev/sda…',

  // Original text: '/path/to/directory'
  newSrLocalPathPlaceHolder: '/مسیر/برای/دایرکتوری',

  // Original text: 'Use NFSv4'
  newSrUseNfs4: 'استفاده از NFSv4',

  // Original text: 'Comma delimited NFS options'
  newSrNfsOptions: 'گزینه های NFS با ویرگول محدود شده است',

  // Original text: 'Users/Groups'
  subjectName: 'کاربران/گروه ها',

  // Original text: 'Object'
  objectName: 'شی',

  // Original text: 'No acls found'
  aclNoneFound: 'acl پیدا نشد',

  // Original text: 'Role'
  roleName: 'نقش',

  // Original text: 'Create'
  aclCreate: 'ایجاد',

  // Original text: 'New Group Name'
  newGroupName: 'نام گروه جدید',

  // Original text: 'Create Group'
  createGroup: 'ایجاد گروه',

  // Original text: 'Create'
  createGroupButton: 'ایجاد',

  // Original text: 'Delete Group'
  deleteGroup: 'حذف گروه',

  // Original text: 'Are you sure you want to delete this group?'
  deleteGroupConfirm: 'آیا مطمئن هستید که می خواهید این گروه را حذف کنید؟',

  // Original text: 'Remove user from Group'
  removeUserFromGroup: 'حذف کاربر از گروه',

  // Original text: 'Are you sure you want to delete this user?'
  deleteUserConfirm: 'آیا مطمئن هستید که می خواهید این کاربر را حذف کنید؟',

  // Original text: 'Delete User'
  deleteUser: 'حذف کاربر',

  // Original text: 'no user'
  noUser: 'بدون کاربر',

  // Original text: 'unknown user'
  unknownUser: 'کاربر ناشناس',

  // Original text: 'No group found'
  noGroupFound: 'گروهی پیدا نشد',

  // Original text: 'Name'
  groupNameColumn: 'نام',

  // Original text: 'Users'
  groupUsersColumn: 'کاربران',

  // Original text: 'Add User'
  addUserToGroupColumn: 'اضافه کردن کاربر',

  // Original text: 'Username'
  userNameColumn: 'نام کاربری',

  // Original text: 'Permissions'
  userPermissionColumn: 'مجوزها',

  // Original text: 'Password'
  userPasswordColumn: 'کلمه عبور',

  // Original text: 'Username'
  userName: 'نام کاربری',

  // Original text: 'Password'
  userPassword: 'کلمه عبور',

  // Original text: 'Create'
  createUserButton: 'ایجاد',

  // Original text: 'No user found'
  noUserFound: 'کاربری پیدا نشد',

  // Original text: 'User'
  userLabel: 'کاربر',

  // Original text: 'Admin'
  adminLabel: 'مدیر',

  // Original text: 'No user in group'
  noUserInGroup: 'کاربری در گروه وجود ندارد',

  // Original text: '{users, number} user{users, plural, one {} other {s}}'
  countUsers: '{users, number} user{users, plural, one {} other {s}}',

  // Original text: 'Select Permission'
  selectPermission: 'مجوز را انتخاب کنید',

  // Original text: 'No plugins found'
  noPlugins: 'هیچ افزونه ای پیدا نشد',

  // Original text: 'Auto-load at server start'
  autoloadPlugin: 'بارگیری خودکار در سرور شروع شد',

  // Original text: 'Save configuration'
  savePluginConfiguration: 'ذخیره کردن پیکربندی',

  // Original text: 'Delete configuration'
  deletePluginConfiguration: 'حذف کردن پیکربندی',

  // Original text: 'Plugin error'
  pluginError: 'خطای افزونه',

  // Original text: 'Unknown error'
  unknownPluginError: 'خطای ناشناخته',

  // Original text: 'Purge plugin configuration'
  purgePluginConfiguration: 'پاکسازی پیکربندی افزونه',

  // Original text: 'Are you sure you want to purge this configuration ?'
  purgePluginConfigurationQuestion: 'آیا مطمئن هستید که می خواهید این پیکربندی را پاک کنید؟',

  // Original text: 'Edit'
  editPluginConfiguration: 'ویرایش',

  // Original text: 'Cancel'
  cancelPluginEdition: 'لغو کردن',

  // Original text: 'Plugin configuration'
  pluginConfigurationSuccess: 'پیکربندی افزونه',

  // Original text: 'Plugin configuration successfully saved!'
  pluginConfigurationChanges: 'پیکربندی افزونه با موفقیت ذخیره شد!',

  // Original text: 'Predefined configuration'
  pluginConfigurationPresetTitle: 'پیکربندی از پیش تعریف شده',

  // Original text: 'Choose a predefined configuration.'
  pluginConfigurationChoosePreset: 'یک پیکربندی از پیش تعریف شده را انتخاب کنید.',

  // Original text: 'Apply'
  applyPluginPreset: 'اعمال کردن',

  // Original text: 'Save filter error'
  saveNewUserFilterErrorTitle: 'خطا در ذخیره کردن فیلتر',

  // Original text: 'Bad parameter: name must be given.'
  saveNewUserFilterErrorBody: 'پارامتر بد: نام باید داده شود.',

  // Original text: 'Name:'
  filterName: 'نام:',

  // Original text: 'Value:'
  filterValue: 'مقدار:',

  // Original text: 'Save new filter'
  saveNewFilterTitle: 'ذخیره کردن فیلتر جدید',

  // Original text: 'Set custom filters'
  setUserFiltersTitle: 'تنظیم فیلترهای سفارشی',

  // Original text: 'Are you sure you want to set custom filters?'
  setUserFiltersBody: 'آیا مطمئن هستید که می خواهید فیلترهای سفارشی را تنظیم کنید؟',

  // Original text: 'Remove custom filter'
  removeUserFilterTitle: 'حذف فیلتر سفارشی',

  // Original text: 'Are you sure you want to remove custom filter?'
  removeUserFilterBody: 'آیا مطمئن هستید که می خواهید فیلتر سفارشی را حذف کنید؟',

  // Original text: 'Default filter'
  defaultFilter: 'فیلتر پیش فرض',

  // Original text: 'Default filters'
  defaultFilters: 'فیلتر های پیش فرض',

  // Original text: 'Custom filters'
  customFilters: 'فیلتر های سفارشی',

  // Original text: 'Customize filters'
  customizeFilters: 'سفارشی کردن فیلترها',

  // Original text: 'Save custom filters'
  saveCustomFilters: 'ذخیره کردن فیلترهای سفارشی',

  // Original text: 'Start'
  startVmLabel: 'شروع',

  // Original text: 'Recovery start'
  recoveryModeLabel: 'شروع بازیابی',

  // Original text: 'Suspend'
  suspendVmLabel: 'تعلیق',

  // Original text: 'Stop'
  stopVmLabel: 'توقف',

  // Original text: 'Force shutdown'
  forceShutdownVmLabel: 'خاموش شدن اجباری',

  // Original text: 'Reboot'
  rebootVmLabel: 'راه اندازی مجدد',

  // Original text: 'Force reboot'
  forceRebootVmLabel: 'راه اندازی مجدد اجباری',

  // Original text: 'Delete'
  deleteVmLabel: 'حذف کردن',

  // Original text: 'Migrate'
  migrateVmLabel: 'مهاجرت',

  // Original text: 'Snapshot'
  snapshotVmLabel: 'اسنپ شات',

  // Original text: 'Export'
  exportVmLabel: 'صادر کردن',

  // Original text: 'Resume'
  resumeVmLabel: 'از سرگیری',

  // Original text: 'Copy'
  copyVmLabel: 'کپی',

  // Original text: 'Clone'
  cloneVmLabel: 'شبیه سازی',

  // Original text: 'Fast clone'
  fastCloneVmLabel: 'شبیه سازی سریع',

  // Original text: 'Convert to template'
  convertVmToTemplateLabel: 'تبدیل به قالب',

  // Original text: 'Console'
  vmConsoleLabel: 'کنسول',

  // Original text: 'Depth'
  srUnhealthyVdiDepth: 'عمق',

  // Original text: 'Name'
  srUnhealthyVdiNameLabel: 'نام',

  // Original text: 'Size'
  srUnhealthyVdiSize: 'اندازه',

  // Original text: 'VDI to coalesce ({total, number})'
  srUnhealthyVdiTitle: 'VDI برای ادغام ({total, number})',

  // Original text: 'UUID'
  srUnhealthyVdiUuid: 'UUID',

  // Original text: 'No stats'
  srNoStats: 'هیچ آماری وجود ندارد',

  // Original text: 'IOPS'
  statsIops: 'IOPS',

  // Original text: 'IO throughput'
  statsIoThroughput: 'توان عملیاتی IO',

  // Original text: 'Latency'
  statsLatency: 'تاخیر',

  // Original text: 'IOwait'
  statsIowait: 'IOwait',

  // Original text: 'Rescan all disks'
  srRescan: 'همه دیسک ها را دوباره اسکن کنید',

  // Original text: 'Connect to all hosts'
  srReconnectAll: 'به همه میزبان ها متصل شوید',

  // Original text: 'Disconnect from all hosts'
  srDisconnectAll: 'از همه میزبان ها جدا شوید',

  // Original text: 'Forget this SR'
  srForget: 'صرف نظر کردن از این مخزن ذخیره سازی (SR)',

  // Original text: 'Forget SRs'
  srsForget: 'صرف نظر کردن از مخزن های ذخیره سازی',

  // Original text: 'Remove this SR'
  srRemoveButton: 'حذف کردن این مخزن ذخیره سازی (SR)',

  // Original text: 'No VDIs in this storage'
  srNoVdis: 'هیچ VDI در این فضای ذخیره سازی وجود ندارد',

  // Original text: 'Pool RAM usage:'
  poolTitleRamUsage: 'میزان مصرف رم استخر:',

  // Original text: '{used} used on {total} ({free} free)'
  poolRamUsage: '{used} استفاده شده در {total} ({free} free)',

  // Original text: 'Master:'
  poolMaster: 'ارشد:',

  // Original text: 'Display all hosts of this pool'
  displayAllHosts: 'نمایش تمام میزبان های این استخر',

  // Original text: 'Display all storages of this pool'
  displayAllStorages: 'نمایش تمام مخزن های این استخر',

  // Original text: 'Display all VMs of this pool'
  displayAllVMs: 'نمایش تمام ماشین های مجازی این استخر',

  // Original text: 'Hosts'
  hostsTabName: 'میزبان ها',

  // Original text: 'Vms'
  vmsTabName: 'ماشین های مجازی',

  // Original text: 'Srs'
  srsTabName: 'مخزن های ذخیره سازی',

  // Original text: 'Edit all'
  poolEditAll: 'ویرایش همه',

  // Original text: 'Edit remote syslog for all hosts'
  poolEditRemoteSyslog: 'ویرایش syslog راه دور برای تمام میزبان ها',

  // Original text: 'High Availability'
  poolHaStatus: 'در دسترس بودن بالا',

  // Original text: 'Enabled'
  poolHaEnabled: 'فعال شده',

  // Original text: 'Disabled'
  poolHaDisabled: 'غیرفعال شده',

  // Original text: 'GPU groups'
  poolGpuGroups: 'گروه های GPU',

  // Original text: 'Logging host'
  poolRemoteSyslogPlaceHolder: 'ورود به میزبان',

  // Original text: 'Master'
  setpoolMaster: 'ارشد',

  // Original text: 'Remote syslog host'
  syslogRemoteHost: 'میزبان syslog راه دور',

  // Original text: 'Name'
  hostNameLabel: 'نام',

  // Original text: 'Description'
  hostDescription: 'شرح',

  // Original text: 'Memory'
  hostMemory: 'حافظه',

  // Original text: 'No hosts'
  noHost: 'بدون میزبان',

  // Original text: '{used}% used ({free} free)'
  memoryLeftTooltip: '{used}% استفاده شده ({free} free)',

  // Original text: 'PIF'
  pif: 'کارت شبکه',

  // Original text: 'Name'
  poolNetworkNameLabel: 'نام',

  // Original text: 'Description'
  poolNetworkDescription: 'شرح',

  // Original text: 'PIFs'
  poolNetworkPif: 'کارت های شبکه',

  // Original text: 'No networks'
  poolNoNetwork: 'بدون شبکه',

  // Original text: 'MTU'
  poolNetworkMTU: 'حداکثر واحد انتقال',

  // Original text: 'Connected'
  poolNetworkPifAttached: 'متصل شده است',

  // Original text: 'Disconnected'
  poolNetworkPifDetached: 'قطع شده است',

  // Original text: 'Show PIFs'
  showPifs: 'undefined',

  // Original text: 'Hide PIFs'
  hidePifs: 'نمایش کارت های شبکه',

  // Original text: 'Show details'
  showDetails: 'نمایش جزئیات',

  // Original text: 'Hide details'
  hideDetails: 'پنهان کردن جزئیات',

  // Original text: 'No stats'
  poolNoStats: 'هیچ آماری وجود ندارد',

  // Original text: 'All hosts'
  poolAllHosts: 'تمام میزبان ها',

  // Original text: 'Add SR'
  addSrLabel: 'اضافه کردن مخزن ذخیره سازی (SR)',

  // Original text: 'Add VM'
  addVmLabel: 'اضافه کردن ماشین مجازی',

  // Original text: 'Add Host'
  addHostLabel: 'اضافه کردن میزبان',

  // Original text: 'This host needs to install {patches, number} patch{patches, plural, one {} other {es}} before it can be added to the pool. This operation may be long.'
  hostNeedsPatchUpdate:
    'این میزبان قبل از اینکه بتواند به استخر اضافه شود نیاز به نصب {patches, number} وصله {patches, plural, one {} other {es}} دارد. این عملیات ممکن است طولانی باشد.',

  // Original text: "This host cannot be added to the pool because it's missing some patches."
  hostNeedsPatchUpdateNoInstall: '.این میزبان نمی تواند به استخر اضافه شود زیرا برخی از وصله ها را ندارد.',

  // Original text: 'Adding host failed'
  addHostErrorTitle: 'افزودن میزبان ناموفق بود',

  // Original text: 'Host patches could not be homogenized.'
  addHostNotHomogeneousErrorMessage: 'وصله های میزبان نمی توانند همگن شوند.',

  // Original text: 'Disconnect'
  disconnectServer: 'قطع شدن',

  // Original text: 'Start'
  startHostLabel: 'شروع',

  // Original text: 'Stop'
  stopHostLabel: 'توقف',

  // Original text: 'Enable'
  enableHostLabel: 'فعال کردن',

  // Original text: 'Disable'
  disableHostLabel: 'غیرفعال کردن',

  // Original text: 'Restart toolstack'
  restartHostAgent: 'ریست کردن toolstack',

  // Original text: 'Force reboot'
  forceRebootHostLabel: 'راه اندازی مجدد اجباری',

  // Original text: 'Reboot'
  rebootHostLabel: 'راه اندازی مجدد',

  // Original text: 'Error while restarting host'
  noHostsAvailableErrorTitle: 'خطا هنگام راه اندازی مجدد میزبان',

  // Original text: 'Some VMs cannot be migrated before restarting this host. Please try force reboot.'
  noHostsAvailableErrorMessage:
    'برخی از ماشین های مجازی را نمی توان قبل از راه اندازی مجدد این میزبان منتقل کرد. لطفاً راه اندازی مجدد اجباری را امتحان کنید.',

  // Original text: 'Error while restarting hosts'
  failHostBulkRestartTitle: 'خطا هنگام راه اندازی مجدد میزبان ها',

  // Original text: '{failedHosts, number}/{totalHosts, number} host{failedHosts, plural, one {} other {s}} could not be restarted.'
  failHostBulkRestartMessage:
    '{failedHosts, number}/{totalHosts, number} میزبان{failedHosts, plural, one {} other {s}} نمی توان راه اندازی مجدد کرد.',

  // Original text: 'Reboot to apply updates'
  rebootUpdateHostLabel: 'راه اندازی مجدد برای اعمال به روز رسانی',

  // Original text: 'Emergency mode'
  emergencyModeLabel: 'حالت اضطراری',

  // Original text: 'Storage'
  storageTabName: 'ذخیره سازی',

  // Original text: 'Patches'
  patchesTabName: 'وصله ها',

  // Original text: 'Load average'
  statLoad: 'متوسط ​​بار',

  // Original text: 'Host RAM usage:'
  hostTitleRamUsage: 'مصرف حافظه میزبان:',

  // Original text: 'RAM: {memoryUsed} used on {memoryTotal} ({memoryFree} free)'
  memoryHostState: 'حافظه: {memoryUsed} استفاده شده در {memoryTotal} ({memoryFree} free)',

  // Original text: 'Hardware'
  hardwareHostSettingsLabel: 'سخت افزار',

  // Original text: 'Address'
  hostAddress: 'آدرس',

  // Original text: 'Status'
  hostStatus: 'وضعیت',

  // Original text: 'Build number'
  hostBuildNumber: 'شماره ساخت',

  // Original text: 'iSCSI name'
  hostIscsiName: 'نام iSCSI',

  // Original text: 'Version'
  hostXenServerVersion: 'نسخه',

  // Original text: 'Enabled'
  hostStatusEnabled: 'فعال شده',

  // Original text: 'Disabled'
  hostStatusDisabled: 'غیر فعال شده',

  // Original text: 'Power on mode'
  hostPowerOnMode: 'حالت روشن',

  // Original text: 'Host uptime'
  hostStartedSince: 'آپ تایم میزبان',

  // Original text: 'Toolstack uptime'
  hostStackStartedSince: 'آپ تایم Toolstack',

  // Original text: 'CPU model'
  hostCpusModel: 'مدل پردازنده',

  // Original text: 'GPUs'
  hostGpus: 'GPUها',

  // Original text: 'Core (socket)'
  hostCpusNumber: 'هسته (سوکت)',

  // Original text: 'Manufacturer info'
  hostManufacturerinfo: 'اطلاعات تولید کننده',

  // Original text: 'BIOS info'
  hostBiosinfo: 'اطلاعات BIOS',

  // Original text: 'License'
  licenseHostSettingsLabel: 'مجوز',

  // Original text: 'Type'
  hostLicenseType: 'نوع',

  // Original text: 'Socket'
  hostLicenseSocket: 'سوکت',

  // Original text: 'Expiry'
  hostLicenseExpiry: 'انقضا',

  // Original text: 'Remote syslog'
  hostRemoteSyslog: 'Syslog راه دور',

  // Original text: 'Installed supplemental packs'
  supplementalPacks: 'بسته های تکمیلی نصب شده',

  // Original text: 'Install new supplemental pack'
  supplementalPackNew: 'نصب بسته تکمیلی جدید',

  // Original text: 'Install supplemental pack on every host'
  supplementalPackPoolNew: 'بسته تکمیلی را روی هر میزبان نصب کنید',

  // Original text: '{name} (by {author})'
  supplementalPackTitle: '{name} (توسط {author})',

  // Original text: 'Installation started'
  supplementalPackInstallStartedTitle: 'نصب شروع شد',

  // Original text: 'Installing new supplemental pack…'
  supplementalPackInstallStartedMessage: 'در حال نصب بسته تکمیلی جدید…',

  // Original text: 'Installation error'
  supplementalPackInstallErrorTitle: 'خطای نصب',

  // Original text: 'The installation of the supplemental pack failed.'
  supplementalPackInstallErrorMessage: 'نصب بسته مکمل ناموفق بود.',

  // Original text: 'Installation success'
  supplementalPackInstallSuccessTitle: 'نصب موفقیت آمیز بود',

  // Original text: 'Supplemental pack successfully installed.'
  supplementalPackInstallSuccessMessage: 'بسته تکمیلی با موفقیت نصب شد.',

  // Original text: 'Add a network'
  networkCreateButton: 'اضافه کردن یک شبکه',

  // Original text: 'Add a bonded network'
  networkCreateBondedButton: 'یک شبکه پیوندی اضافه کنید',

  // Original text: 'Device'
  pifDeviceLabel: 'دستگاه',

  // Original text: 'Network'
  pifNetworkLabel: 'شبکه',

  // Original text: 'VLAN'
  pifVlanLabel: 'شبکه محلی مجازی',

  // Original text: 'Address'
  pifAddressLabel: 'آدرس',

  // Original text: 'Mode'
  pifModeLabel: 'حالت',

  // Original text: 'MAC'
  pifMacLabel: 'آدرس MAC',

  // Original text: 'MTU'
  pifMtuLabel: 'حداکثر واحد انتقال',

  // Original text: 'Status'
  pifStatusLabel: 'وضعیت',

  // Original text: 'Connected'
  pifStatusConnected: 'متصل شده است',

  // Original text: 'Disconnected'
  pifStatusDisconnected: 'قطع شده است',

  // Original text: 'No physical interface detected'
  pifNoInterface: 'هیچ رابط فیزیکی شناسایی نشد',

  // Original text: 'This interface is currently in use'
  pifInUse: 'این رابط در حال حاضر در حال استفاده است',

  // Original text: 'Action'
  pifAction: 'عمل',

  // Original text: 'Default locking mode'
  defaultLockingMode: 'حالت قفل پیش فرض',

  // Original text: 'Configure IP address'
  pifConfigureIp: 'پیکربندی آدرس IP',

  // Original text: 'Invalid parameters'
  configIpErrorTitle: 'پارامترهای نامعتبر',

  // Original text: 'IP address and netmask required'
  configIpErrorMessage: 'آدرس IP و netmask مورد نیاز است',

  // Original text: 'Static IP address'
  staticIp: 'آدرس IP استاتیک',

  // Original text: 'Netmask'
  netmask: 'Netmask',

  // Original text: 'DNS'
  dns: 'DNS',

  // Original text: 'Gateway'
  gateway: 'Gateway',

  // Original text: 'Add a storage'
  addSrDeviceButton: 'یک فضای ذخیره سازی اضافه کنید',

  // Original text: 'Name'
  srNameLabel: 'نام',

  // Original text: 'Type'
  srType: 'نوع',

  // Original text: 'Action'
  pbdAction: 'عمل',

  // Original text: 'Status'
  pbdStatus: 'وضعیت',

  // Original text: 'Connected'
  pbdStatusConnected: 'متصل شده است',

  // Original text: 'Disconnected'
  pbdStatusDisconnected: 'قطع شده است',

  // Original text: 'Connect'
  pbdConnect: 'اتصال',

  // Original text: 'Disconnect'
  pbdDisconnect: 'قطع شدن',

  // Original text: 'Forget'
  pbdForget: 'صرف نظر کردن',

  // Original text: 'Shared'
  srShared: 'به اشتراک گذاشته شده است',

  // Original text: 'Not shared'
  srNotShared: 'به اشتراک گذاشته نشده است',

  // Original text: 'No storage detected'
  pbdNoSr: 'فضای ذخیره‌سازی شناسایی نشد',

  // Original text: 'Name'
  patchNameLabel: 'نام',

  // Original text: 'Install all patches'
  patchUpdateButton: 'نصب تمام وصله ها',

  // Original text: 'Description'
  patchDescription: 'شرح',

  // Original text: 'Version'
  patchVersion: 'نسخه',

  // Original text: 'Applied date'
  patchApplied: 'تاریخ اعمال شده',

  // Original text: 'Size'
  patchSize: 'اندازه',

  // Original text: 'Status'
  patchStatus: 'وضعیت',

  // Original text: 'Applied'
  patchStatusApplied: 'اعمال شده',

  // Original text: 'Missing patches'
  patchStatusNotApplied: 'وصله های نصب نشده',

  // Original text: 'No patches detected'
  patchNothing: 'هیچ وصله ای شناسایی نشد',

  // Original text: 'Release date'
  patchReleaseDate: 'تاریخ انتشار',

  // Original text: 'Guidance'
  patchGuidance: 'راهنمایی',

  // Original text: 'Action'
  patchAction: 'عمل',

  // Original text: 'Applied patches'
  hostAppliedPatches: 'وصله های اعمال شده',

  // Original text: 'Missing patches'
  hostMissingPatches: 'وصله های نصب نشده',

  // Original text: 'Host up-to-date!'
  hostUpToDate: 'میزبان به روز است!',

  // Original text: 'Non-recommended patch install'
  installPatchWarningTitle: 'نصب وصله توصیه نشده',

  // Original text: 'This will install a patch only on this host. This is NOT the recommended way: please go into the Pool patch view and follow instructions there. If you are sure about this, you can continue anyway'
  installPatchWarningContent:
    'این کار فقط یک وصله را بر روی این میزبان نصب می کند. این روش توصیه‌شده نیست: لطفاً به نمای وصله استخر بروید و دستورالعمل‌های آنجا را دنبال کنید. اگر در این مورد مطمئن هستید، به هر حال می توانید ادامه دهید',

  // Original text: 'Go to pool'
  installPatchWarningReject: 'رفتن به استخر',

  // Original text: 'Install'
  installPatchWarningResolve: 'نصب',

  // Original text: 'Release'
  patchRelease: 'انتشار',

  // Original text: 'Update plugin is not installed on this host. Please run `yum install xcp-ng-updater` first.'
  updatePluginNotInstalled:
    'افزونه آپدیت روی این میزبان نصب نیست. لطفا ابتدا دستور yum install xcp-ng-updater را اجرا کنید.',

  // Original text: 'Show changelog'
  showChangelog: 'نمایش تغییرات',

  // Original text: 'Changelog'
  changelog: 'تغییرات',

  // Original text: 'Patch'
  changelogPatch: 'وصله',

  // Original text: 'Author'
  changelogAuthor: 'سازنده',

  // Original text: 'Date'
  changelogDate: 'تاریخ',

  // Original text: 'Description'
  changelogDescription: 'شرح',

  // Original text: 'Refresh patches'
  refreshPatches: 'به روز کردن وصله ها',

  // Original text: 'Install pool patches'
  installPoolPatches: 'نصب وصله های استخر',

  // Original text: 'Default SR'
  defaultSr: 'مخزن ذخیره سازی (SR) پیش فرض',

  // Original text: 'Set as default SR'
  setAsDefaultSr: 'تنظیم کردن به عنوان مخزن ذخیره سازی (SR) پیش فرض',

  // Original text: 'General'
  generalTabName: 'عمومی',

  // Original text: 'Stats'
  statsTabName: 'آمار',

  // Original text: 'Console'
  consoleTabName: 'کنسول',

  // Original text: 'Container'
  containersTabName: 'کانتینر',

  // Original text: 'Snapshots'
  snapshotsTabName: 'اسنپ شات ها',

  // Original text: 'Logs'
  logsTabName: 'گزارش ها',

  // Original text: 'Advanced'
  advancedTabName: 'پیشرفته',

  // Original text: 'Network'
  networkTabName: 'شبکه',

  // Original text: 'Disk{disks, plural, one {} other {s}}'
  disksTabName: 'دیسک{disks, plural, one {} other {s}}',

  // Original text: 'halted'
  powerStateHalted: 'متوقف شده',

  // Original text: 'running'
  powerStateRunning: 'در حال اجرا',

  // Original text: 'suspended'
  powerStateSuspended: 'معلق شده',

  // Original text: 'Current status:'
  vmCurrentStatus: 'وضعیت فعلی:',

  // Original text: 'Not running'
  vmNotRunning: 'در حال اجرا نیست',

  // Original text: 'Halted {ago}'
  vmHaltedSince: 'متوقف شده {ago}',

  // Original text: 'No Xen tools detected'
  noToolsDetected: 'Xen tools شناسایی نشد',

  // Original text: 'No IPv4 record'
  noIpv4Record: 'رکورد IPv4 وجود ندارد',

  // Original text: 'No IP record'
  noIpRecord: 'رکورد IP وجود ندارد',

  // Original text: 'Started {ago}'
  started: 'شروع شده {ago}',

  // Original text: 'Paravirtualization (PV)'
  paraVirtualizedMode: 'Paravirtualization (PV)',

  // Original text: 'Hardware virtualization (HVM)'
  hardwareVirtualizedMode: 'مجازی سازی سخت افزاری (HVM)',

  // Original text: 'Windows Update tools'
  windowsUpdateTools: 'ابزارهای به روز رسانی ویندوز',

  // Original text: 'CPU usage'
  statsCpu: 'میزان استفاده از CPU',

  // Original text: 'Memory usage'
  statsMemory: 'میزان استفاده از حافظه',

  // Original text: 'Network throughput'
  statsNetwork: 'توان عملیاتی شبکه',

  // Original text: 'Stacked values'
  useStackedValuesOnStats: 'مقادیر انباشته شده',

  // Original text: 'Disk throughput'
  statDisk: 'توان عملیاتی دیسک',

  // Original text: 'Last 10 minutes'
  statLastTenMinutes: '10 دقیقه گذشته',

  // Original text: 'Last 2 hours'
  statLastTwoHours: '2 ساعت گذشته',

  // Original text: 'Last week'
  statLastWeek: 'هفته گذشته',

  // Original text: 'Last year'
  statLastYear: 'سال گذشته',

  // Original text: 'Copy'
  copyToClipboardLabel: 'کپی',

  // Original text: 'Ctrl+Alt+Del'
  ctrlAltDelButtonLabel: 'Ctrl+Alt+Del',

  // Original text: 'Tip:'
  tipLabel: 'نکته:',

  // Original text: 'Hide infos'
  hideHeaderTooltip: 'مخفی کردن اطلاعات',

  // Original text: 'Show infos'
  showHeaderTooltip: 'نمایش اطلاعات',

  // Original text: 'Name'
  containerName: 'نام',

  // Original text: 'Command'
  containerCommand: 'دستور',

  // Original text: 'Creation date'
  containerCreated: 'تاریخ ایجاد',

  // Original text: 'Status'
  containerStatus: 'وضعیت',

  // Original text: 'Action'
  containerAction: 'عمل',

  // Original text: 'No existing containers'
  noContainers: 'هیچ کانتینری وجود ندارد',

  // Original text: 'Stop this container'
  containerStop: 'متوقف کردن این کانتینر',

  // Original text: 'Start this container'
  containerStart: 'اجرا کردن این کانتینر',

  // Original text: 'Pause this container'
  containerPause: 'مکث کردن این کانتینر',

  // Original text: 'Resume this container'
  containerResume: 'از سرگیری این کانتینر',

  // Original text: 'Restart this container'
  containerRestart: 'راه اندازی مجدد این کانتینر',

  // Original text: 'Action'
  vdiAction: 'عمل',

  // Original text: 'Attach disk'
  vdiAttachDeviceButton: 'وصل کردن دیسک',

  // Original text: 'New disk'
  vbdCreateDeviceButton: 'دیسک جدید',

  // Original text: 'Boot order'
  vdiBootOrder: 'ترتیب بوت',

  // Original text: 'Name'
  vdiNameLabel: 'نام',

  // Original text: 'Description'
  vdiNameDescription: 'شرح',

  // Original text: 'Pool'
  vdiPool: 'استخر',

  // Original text: 'Disconnect'
  vdiDisconnect: 'قطع شدن',

  // Original text: 'Tags'
  vdiTags: 'برچسب ها',

  // Original text: 'Size'
  vdiSize: 'اندازه',

  // Original text: 'SR'
  vdiSr: 'مخزن ذخیره سازی (SR)',

  // Original text: 'VMs'
  vdiVms: 'ماشین های مجازی',

  // Original text: 'Migrate VDI'
  vdiMigrate: 'انتقال VDI',

  // Original text: 'Destination SR:'
  vdiMigrateSelectSr: 'مقصد مخزن ذخیره سازی (SR):',

  // Original text: 'Migrate all VDIs'
  vdiMigrateAll: 'انتقال تمام VDIها',

  // Original text: 'No SR'
  vdiMigrateNoSr: 'مخزن ذخیره سازی (SR) وجود ندارد',

  // Original text: 'A target SR is required to migrate a VDI'
  vdiMigrateNoSrMessage: 'یک مخزن ذهیره سازی هدف برای انتقال VDI مورد نیاز است',

  // Original text: 'Forget'
  vdiForget: 'صرف نظر کردن',

  // Original text: 'Remove VDI'
  vdiRemove: 'حذف کردن VDI',

  // Original text: 'No VDIs attached to Control Domain'
  noControlDomainVdis: 'هیچ VDI به کنترل دامنه متصل نشده است',

  // Original text: 'Boot flag'
  vbdBootableStatus: 'پرچم بوت',

  // Original text: 'Status'
  vbdStatus: 'وضعیت',

  // Original text: 'Connected'
  vbdStatusConnected: 'متصل شده است',

  // Original text: 'Disconnected'
  vbdStatusDisconnected: 'قطع شده است',

  // Original text: 'No disks'
  vbdNoVbd: 'دیسکی وجود ندارد',

  // Original text: 'Connect VBD'
  vbdConnect: 'متصل کردن VBD',

  // Original text: 'Disconnect VBD'
  vbdDisconnect: 'قطع کردن VBD',

  // Original text: 'Bootable'
  vbdBootable: 'قابل بوت شدن',

  // Original text: 'Readonly'
  vbdReadonly: 'فقط خواندنی',

  // Original text: 'Action'
  vbdAction: 'عمل',

  // Original text: 'Create'
  vbdCreate: 'ایجاد',

  // Original text: 'Attach'
  vbdAttach: 'متصل کردن',

  // Original text: 'Disk name'
  vbdNamePlaceHolder: 'نام دیسک',

  // Original text: 'Size'
  vbdSizePlaceHolder: 'اندازه',

  // Original text: 'CD drive not completely installed'
  cdDriveNotInstalled: 'درایو CD به طور کامل نصب نشده است',

  // Original text: 'Stop and start the VM to install the CD drive'
  cdDriveInstallation: 'برای نصب CD درایو، ماشین مجازی را متوقف و اجرا کنید.',

  // Original text: 'Save'
  saveBootOption: 'ذخیره کردن',

  // Original text: 'Reset'
  resetBootOption: 'ریست کردن',

  // Original text: 'Delete selected VDIs'
  deleteSelectedVdis: 'حذف VDIهای انتخاب شده',

  // Original text: 'Delete selected VDI'
  deleteSelectedVdi: 'حذف VDI انتخاب شده',

  // Original text: 'Export VDI content'
  exportVdi: 'صدور محتوای VDI',

  // Original text: 'Import VDI content'
  importVdi: 'وارد کردن محتوای VDI',

  // Original text: 'No file selected'
  importVdiNoFile: 'هیچ فایلی انتخاب نشده است',

  // Original text: 'Drop VHD file here'
  selectVdiMessage: 'فایل VHD را اینجا رها کنید',

  // Original text: 'Creating this disk will use the disk space quota from the resource set {resourceSet} ({spaceLeft} left)'
  useQuotaWarning:
    'ایجاد این دیسک از سهمیه فضای دیسک از مجموعه منابع {resourceSet} ({spaceLeft} left) استفاده خواهد کرد',

  // Original text: 'Not enough space in resource set {resourceSet} ({spaceLeft} left)'
  notEnoughSpaceInResourceSet: 'فضای کافی در مجموعه منابع {resourceSet} ({spaceLeft} left) وجود ندارد',

  // Original text: 'New device'
  vifCreateDeviceButton: 'دستگاه جدید',

  // Original text: 'No interface'
  vifNoInterface: 'بدون رابط',

  // Original text: 'Device'
  vifDeviceLabel: 'دستگاه',

  // Original text: 'MAC address'
  vifMacLabel: 'آدرس MAC',

  // Original text: 'MTU'
  vifMtuLabel: 'حداکثر واحد انتقال',

  // Original text: 'Network'
  vifNetworkLabel: 'شبکه',

  // Original text: 'Status'
  vifStatusLabel: 'وضعیت',

  // Original text: 'Connected'
  vifStatusConnected: 'متصل شده است',

  // Original text: 'Disconnected'
  vifStatusDisconnected: 'قطع شده است',

  // Original text: 'Connect'
  vifConnect: 'اتصال',

  // Original text: 'Disconnect'
  vifDisconnect: 'قطع شدن',

  // Original text: 'Remove'
  vifRemove: 'حذف کردن',

  // Original text: 'Remove selected VIFs'
  vifsRemove: 'حذف VIFهای انتخاب شده',

  // Original text: 'IP addresses'
  vifIpAddresses: 'آدرس های IP',

  // Original text: 'Auto-generated if empty'
  vifMacAutoGenerate: 'در صورت خالی بودن به صورت خودکار تولید می شود',

  // Original text: 'Allowed IPs'
  vifAllowedIps: 'IP های مجاز',

  // Original text: 'No IPs'
  vifNoIps: 'بدون IP',

  // Original text: 'Network locked'
  vifLockedNetwork: 'شبکه قفل شده است',

  // Original text: 'Network locked and no IPs are allowed for this interface'
  vifLockedNetworkNoIps: 'شبکه قفل شده است و هیچ IP برای این رابط مجاز نیست',

  // Original text: 'Network not locked'
  vifUnLockedNetwork: 'شبکه قفل نیست',

  // Original text: 'Unknown network'
  vifUnknownNetwork: 'شبکه ناشناس',

  // Original text: 'Action'
  vifAction: 'عمل',

  // Original text: 'Create'
  vifCreate: 'ایجاد',

  // Original text: 'No snapshots'
  noSnapshots: 'بدون snapshot',

  // Original text: 'New snapshot'
  snapshotCreateButton: 'snapshot جدید',

  // Original text: 'Just click on the snapshot button to create one!'
  tipCreateSnapshotLabel: 'فقط روی دکمه snapshot کلیک کنید تا یکی بسازید!',

  // Original text: 'Revert VM to this snapshot'
  revertSnapshot: 'ماشین مجازی را به این snapshot برگردانید',

  // Original text: 'Remove this snapshot'
  deleteSnapshot: 'حذف این snapshot',

  // Original text: 'Remove selected snapshots'
  deleteSnapshots: 'حذف snapshotهای انتخاب شده',

  // Original text: 'Create a VM from this snapshot'
  copySnapshot: 'ایجاد یک ماشین مجازی از این snapshot',

  // Original text: 'Export this snapshot'
  exportSnapshot: 'صدور این snapshot',

  // Original text: 'Creation date'
  snapshotDate: 'تاریخ ایجاد',

  // Original text: 'Name'
  snapshotName: 'نام',

  // Original text: 'Description'
  snapshotDescription: 'شرح',

  // Original text: 'Action'
  snapshotAction: 'عمل',

  // Original text: 'Quiesced snapshot'
  snapshotQuiesce: 'خاموش کردن snapshot',

  // Original text: 'Revert successful'
  vmRevertSuccessfulTitle: 'برگرداندن با موفقیت انجام شد',

  // Original text: 'VM successfully reverted'
  vmRevertSuccessfulMessage: 'ماشین مجازی با موفقیت برگردانده شد',

  // Original text: 'Remove all logs'
  logRemoveAll: 'حذف کردن تمام گزارش ها',

  // Original text: 'No logs so far'
  noLogs: 'هیچ گزارشی تا کنون وجود ندارد',

  // Original text: 'Creation date'
  logDate: 'تاریخ ایجاد',

  // Original text: 'Name'
  logName: 'نام',

  // Original text: 'Content'
  logContent: 'محتوا',

  // Original text: 'Action'
  logAction: 'عمل',

  // Original text: 'Remove'
  vmRemoveButton: 'حذف کردن',

  // Original text: 'Convert'
  vmConvertButton: 'تبدیل کردن',

  // Original text: 'Share'
  vmShareButton: 'اشتراک گذاری',

  // Original text: 'Xen settings'
  xenSettingsLabel: 'تنظیمات Xen',

  // Original text: 'Guest OS'
  guestOsLabel: 'سیستم عامل مهمان',

  // Original text: 'Misc'
  miscLabel: 'متفرقه',

  // Original text: 'UUID'
  uuid: 'UUID',

  // Original text: 'Virtualization mode'
  virtualizationMode: 'حالت مجازی سازی',

  // Original text: 'CPU weight'
  cpuWeightLabel: 'زمان CPU در میزبان که برای اجرای CPUهای مجازی در دسترس است',

  // Original text: 'Default ({value, number})'
  defaultCpuWeight: 'پیش فرض ({value, number})',

  // Original text: 'CPU cap'
  cpuCapLabel: 'محدودیت های کاملا دقیق در میزان منابع CPU که می تواند توسط یک پروژه یا یک منطقه مصرف شود',

  // Original text: 'Default ({value, number})'
  defaultCpuCap: 'پیش فرض ({value, number})',

  // Original text: 'PV args'
  pvArgsLabel: 'آرگومان های PV',

  // Original text: 'Xen tools version'
  xenToolsStatus: 'نسخه Xen tools',

  // Original text: 'Not installed'
  xenToolsNotInstalled: 'نصب نشده',

  // Original text: 'OS name'
  osName: 'نام سیستم عامل',

  // Original text: 'OS kernel'
  osKernel: 'هسته سیستم عامل',

  // Original text: 'Auto power on'
  autoPowerOn: 'روشن شدن خودکار',

  // Original text: 'HA'
  ha: '(HA) دسترسی در سطح بالا',

  // Original text: 'Affinity host'
  vmAffinityHost: 'وابستگی میزبان',

  // Original text: 'VGA'
  vmVga: 'کارت گرافیک',

  // Original text: 'Video RAM'
  vmVideoram: 'حافظه کارت گرافیک',

  // Original text: 'None'
  noAffinityHost: 'هیچ یک',

  // Original text: 'Original template'
  originalTemplate: 'قالب اصلی',

  // Original text: 'Unknown'
  unknownOsName: 'ناشناخته',

  // Original text: 'Unknown'
  unknownOsKernel: 'ناشناخته',

  // Original text: 'Unknown'
  unknownOriginalTemplate: 'ناشناخته',

  // Original text: 'VM limits'
  vmLimitsLabel: 'محدودیت های ماشین مجازی',

  // Original text: 'Resource set'
  resourceSet: 'مجموعه منابع',

  // Original text: 'None'
  resourceSetNone: 'هیچ یک',

  // Original text: 'CPU limits'
  vmCpuLimitsLabel: 'محدودیت های CPU',

  // Original text: 'Topology'
  vmCpuTopology: 'توپولوژی',

  // Original text: 'Default behavior'
  vmChooseCoresPerSocket: 'رفتار پیش فرض',

  // Original text: '{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket'
  vmCoresPerSocket:
    '{nSockets, number} سوکت{nSockets, plural, one {} other {s}} با {nCores, number} هسته{nCores, plural, one {} other {s}} در هر سوکت',

  // Original text: 'None'
  vmCoresPerSocketNone: 'هیچ یک',

  // Original text: 'Incorrect cores per socket value'
  vmCoresPerSocketIncorrectValue: 'مقدار نادرست برای cores per socket',

  // Original text: 'Please change the selected value to fix it.'
  vmCoresPerSocketIncorrectValueSolution: 'لطفاً مقدار انتخاب شده را برای درست کردن آن تغییر دهید.',

  // Original text: 'disabled'
  vmHaDisabled: 'غیرفعال شده',

  // Original text: 'Memory limits (min/max)'
  vmMemoryLimitsLabel: 'محدودیت حافظه (حداقل/حداکثر)',

  // Original text: 'vCPUs max:'
  vmMaxVcpus: 'حداکثر پردارنده های مجازی:',

  // Original text: 'Memory max:'
  vmMaxRam: 'حداکثر حافظه:',

  // Original text: 'vGPU'
  vmVgpu: 'GPU مجازی',

  // Original text: 'GPUs'
  vmVgpus: 'GPUها',

  // Original text: 'None'
  vmVgpuNone: 'هیچ یک',

  // Original text: 'Add vGPU'
  vmAddVgpu: 'اضافه کردن GPU مجازی',

  // Original text: 'Select vGPU type'
  vmSelectVgpuType: 'انتخاب نوع GPU مجازی',

  // Original text: 'Long click to add a name'
  vmHomeNamePlaceholder: 'برای افزودن نام کلیک کرده و نگه دارید',

  // Original text: 'Long click to add a description'
  vmHomeDescriptionPlaceholder: 'برای افزودن توضیحات کلیک کرده و نگه دارید',

  // Original text: 'Click to add a name'
  vmViewNamePlaceholder: 'برای افزودن نام کلیک کنید',

  // Original text: 'Click to add a description'
  vmViewDescriptionPlaceholder: 'برای افزودن توضیحات کلیک کنید',

  // Original text: 'Click to add a name'
  templateHomeNamePlaceholder: 'برای افزودن نام کلیک کنید',

  // Original text: 'Click to add a description'
  templateHomeDescriptionPlaceholder: 'برای افزودن توضیحات کلیک کنید',

  // Original text: 'Delete template'
  templateDelete: 'حذف قالب',

  // Original text: 'Delete VM template{templates, plural, one {} other {s}}'
  templateDeleteModalTitle: 'حذف قالب ماشین مجازی{templates, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?'
  templateDeleteModalBody:
    'آیا مطمئنید که میخواهید {templates, plural, one {this} other {these}} قالب {templates, plural, one {} other {s}} را حذف کنید؟',

  // Original text: 'Delete template{nTemplates, plural, one {} other {s}} failed'
  failedToDeleteTemplatesTitle: 'حذف قالب {nTemplates, plural, one {} other {s}} انجام نشد',

  // Original text: 'Failed to delete {nTemplates, number} template{nTemplates, plural, one {} other {s}}.'
  failedToDeleteTemplatesMessage: '{nTemplates, number} قالب {nTemplates, plural, one {} other {s}} حذف نشد.',

  // Original text: 'Delete default template{nDefaultTemplates, plural, one {} other {s}}'
  deleteDefaultTemplatesTitle: 'حذف قالب پیش فرض {nDefaultTemplates, plural, one {} other {s}}',

  // Original text: 'You are attempting to delete {nDefaultTemplates, number} default template{nDefaultTemplates, plural, one {} other {s}}. Do you want to continue?'
  deleteDefaultTemplatesMessage:
    'شما در حال تلاش برای حذف کردن {nDefaultTemplates, number} default template{nDefaultTemplates, plural, one {} other {s}} هستید. آیا میخواهید ادامه بدهید؟',

  // Original text: 'Pool{pools, plural, one {} other {s}}'
  poolPanel: 'استخر{pools, plural, one {} other {s}}',

  // Original text: 'Host{hosts, plural, one {} other {s}}'
  hostPanel: 'میزبان{hosts, plural, one {} other {s}}',

  // Original text: 'VM{vms, plural, one {} other {s}}'
  vmPanel: 'ماشین مجازی{vms, plural, one {} other {s}}',

  // Original text: 'RAM Usage:'
  memoryStatePanel: 'میزان استفاده از حافظه:',

  // Original text: 'Used Memory'
  usedMemory: 'حافظه استفاده شده',

  // Original text: 'Total Memory'
  totalMemory: 'مجموع حافظه',

  // Original text: 'CPUs Total'
  totalCpus: 'مجموع پردازنده ها',

  // Original text: 'Used vCPUs'
  usedVCpus: 'پردازنده های مجازی استفاده شده',

  // Original text: 'Used Space'
  usedSpace: 'فضای استفاده شده',

  // Original text: 'Total Space'
  totalSpace: 'مجموع فضا',

  // Original text: 'CPUs Usage'
  cpuStatePanel: 'میزان استفاده از پردازنده ها',

  // Original text: 'VMs Power state'
  vmStatePanel: 'وضعیت خاموش یا روشن بودن ماشین های مجازی',

  // Original text: 'Halted'
  vmStateHalted: 'متوقف شده',

  // Original text: 'Other'
  vmStateOther: 'دیگر',

  // Original text: 'Running'
  vmStateRunning: 'در حال اجرا',

  // Original text: 'All'
  vmStateAll: 'همه',

  // Original text: 'Pending tasks'
  taskStatePanel: 'وظایف در حال انتظار',

  // Original text: 'Users'
  usersStatePanel: 'کاربران',

  // Original text: 'Storage state'
  srStatePanel: 'وضعیت ذخیره سازی',

  // Original text: '{usage} (of {total})'
  ofUsage: '{usage} (of {total})',

  // Original text: '{nVcpus, number} vCPU{nVcpus, plural, one {} other {s}} (of {nCpus, number} CPU{nCpus, plural, one {} other {s}})'
  ofCpusUsage:
    '{nVcpus, number} vCPU{nVcpus, plural, one {} other {s}} (of {nCpus, number} CPU{nCpus, plural, one {} other {s}})',

  // Original text: 'No storage'
  noSrs: 'ذخیره ساز وجود ندارد',

  // Original text: 'Name'
  srName: 'نام',

  // Original text: 'Pool'
  srPool: 'استخر',

  // Original text: 'Host'
  srHost: 'میزبان',

  // Original text: 'Type'
  srFormat: 'نوع',

  // Original text: 'Size'
  srSize: 'اندازه',

  // Original text: 'Usage'
  srUsage: 'استفاده',

  // Original text: 'used'
  srUsed: 'استفاده شده',

  // Original text: 'free'
  srFree: 'آزاد',

  // Original text: 'Storage Usage'
  srUsageStatePanel: 'میزان استفاده از فضای ذخیره سازی',

  // Original text: 'Top 5 SR Usage (in %)'
  srTopUsageStatePanel: '۵ مورد از مخزن های ذخیره سازی که بیشترین استفاده را دارند (به ٪)',

  // Original text: 'Not enough permissions!'
  notEnoughPermissionsError: 'مجوز کافی نیست!',

  // Original text: '{running, number} running ({halted, number} halted)'
  vmsStates: '{running, number} در حال اجرای ({halted, number} halted)',

  // Original text: 'Clear selection'
  dashboardStatsButtonRemoveAll: 'پاک کردن انتخاب',

  // Original text: 'Add all hosts'
  dashboardStatsButtonAddAllHost: 'اضافه کردن تمام میزبان ها',

  // Original text: 'Add all VMs'
  dashboardStatsButtonAddAllVM: 'اضافه کردن تمام ماشین های مجازی',

  // Original text: 'Send report'
  dashboardSendReport: 'ارسال گزارش',

  // Original text: 'Report'
  dashboardReport: 'گزارش',

  // Original text: 'This will send a usage report to your configured emails.'
  dashboardSendReportMessage: 'با این کار یک گزارش استفاده به ایمیل های پیکربندی شده شما ارسال می شود.',

  // Original text: 'The usage report and transport email plugins need to be loaded!'
  dashboardSendReportInfo: 'افزونه های مربوط به گزارش استفاده و ایمیل باید بارگیری شوند!',

  // Original text: '{value} {date, date, medium}'
  weekHeatmapData: '{value} {date, date, medium}',

  // Original text: 'No data.'
  weekHeatmapNoData: 'بدون اطلاعات.',

  // Original text: 'Weekly Heatmap'
  weeklyHeatmap: 'نقشه حرارتی هفتگی',

  // Original text: 'Weekly Charts'
  weeklyCharts: 'نمودارهای هفتگی',

  // Original text: 'Synchronize scale:'
  weeklyChartsScaleInfo: 'مقیاس همگام سازی:',

  // Original text: 'Stats error'
  statsDashboardGenericErrorTitle: 'خطای آماری',

  // Original text: 'There is no stats available for:'
  statsDashboardGenericErrorMessage: 'هیچ آماری برای مورد روبرو در دسترس نیست:',

  // Original text: 'No selected metric'
  noSelectedMetric: 'معیار انتخاب شده وجود ندارد',

  // Original text: 'Select'
  statsDashboardSelectObjects: 'انتخاب',

  // Original text: 'Loading…'
  metricsLoading: 'بارگذاری…',

  // Original text: 'Coming soon!'
  comingSoon: 'به زودی!',

  // Original text: 'Orphaned snapshot VDIs'
  orphanedVdis: 'اسنپ شات VDIهای بی سرپرست',

  // Original text: 'Orphaned VMs snapshot'
  orphanedVms: 'اسنپ شات ماشین های مجازی بی سرپرست',

  // Original text: 'No orphans'
  noOrphanedObject: 'بی سرپرست وجود ندارد',

  // Original text: 'Remove all orphaned snapshot VDIs'
  removeAllOrphanedObject: 'حذف کردن تمام اسنپ شات VDIهای بی سرپرست',

  // Original text: 'VDIs attached to Control Domain'
  vdisOnControlDomain: 'VDIهای متصل شده به کنترل دامنه',

  // Original text: 'Name'
  vmNameLabel: 'نام',

  // Original text: 'Description'
  vmNameDescription: 'شرح',

  // Original text: 'Resident on'
  vmContainer: 'ساکن در',

  // Original text: 'VM snapshots related to non-existent backups'
  vmSnapshotsRelatedToNonExistentBackups: 'اسنپ شات های ماشین مجازی مربوط به پشتیبان گیری ناموجود',

  // Original text: 'Snapshot of'
  snapshotOf: 'اسنپ شات از',

  // Original text: 'Legacy backups snapshots'
  legacySnapshots: 'نسخه پشتیبان قدیمی از اسنپ شات ها',

  // Original text: 'Alarms'
  alarmMessage: 'هشدارها',

  // Original text: 'No alarms'
  noAlarms: 'هشداری وجود ندارد',

  // Original text: 'Date'
  alarmDate: 'تاریخ',

  // Original text: 'Content'
  alarmContent: 'محتوا',

  // Original text: 'Issue on'
  alarmObject: 'موضوع درباره',

  // Original text: 'Pool'
  alarmPool: 'استخر',

  // Original text: 'Remove all alarms'
  alarmRemoveAll: 'حذف کردن تمام هشدارها',

  // Original text: '{used}% used ({free} left)'
  spaceLeftTooltip: '{used}% استفاده شده ({free} left)',

  // Original text: 'Create a new VM on {select}'
  newVmCreateNewVmOn: 'ایجاد یک ماشین مجازی جدید در {select}',

  // Original text: 'You have no permission to create a VM'
  newVmCreateNewVmNoPermission: 'شما اجازه ایجاد ماشین مجازی را ندارید',

  // Original text: 'Infos'
  newVmInfoPanel: 'اطلاعات',

  // Original text: 'Name'
  newVmNameLabel: 'نام',

  // Original text: 'Template'
  newVmTemplateLabel: 'قالب',

  // Original text: 'Description'
  newVmDescriptionLabel: 'شرح',

  // Original text: 'Performances'
  newVmPerfPanel: 'کارایی',

  // Original text: 'vCPUs'
  newVmVcpusLabel: 'پردازنده های مجازی',

  // Original text: 'RAM'
  newVmRamLabel: 'حافظه',

  // Original text: 'Static memory max'
  newVmStaticMaxLabel: 'حداکثر حافظه ایستا',

  // Original text: 'Dynamic memory min'
  newVmDynamicMinLabel: 'حداقل حافظه پویا',

  // Original text: 'Dynamic memory max'
  newVmDynamicMaxLabel: 'حداکثر حافظه پویا',

  // Original text: 'Install settings'
  newVmInstallSettingsPanel: 'تنظیمات مربوط به نصب',

  // Original text: 'ISO/DVD'
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: 'Network'
  newVmNetworkLabel: 'شبکه',

  // Original text: 'e.g: http://httpredir.debian.org/debian'
  newVmInstallNetworkPlaceHolder: 'به عنوان مثال: http://httpredir.debian.org/debian',

  // Original text: 'PV Args'
  newVmPvArgsLabel: 'آرگومان های PV',

  // Original text: 'PXE'
  newVmPxeLabel: 'بوت از طریق شبکه (PXE)',

  // Original text: 'Interfaces'
  newVmInterfacesPanel: 'رابط ها',

  // Original text: 'MAC'
  newVmMacLabel: 'آدرس MAC',

  // Original text: 'Add interface'
  newVmAddInterface: 'اضافه کردن رابط',

  // Original text: 'Disks'
  newVmDisksPanel: 'دیسک ها',

  // Original text: 'SR'
  newVmSrLabel: 'مخزن ذخیره سازی',

  // Original text: 'Size'
  newVmSizeLabel: 'اندازه',

  // Original text: 'Add disk'
  newVmAddDisk: 'اضافه کردن دیسک',

  // Original text: 'Summary'
  newVmSummaryPanel: 'خلاصه',

  // Original text: 'Create'
  newVmCreate: 'ایجاد',

  // Original text: 'Reset'
  newVmReset: 'ریست',

  // Original text: 'Select template'
  newVmSelectTemplate: 'انتخاب قالب',

  // Original text: 'SSH key'
  newVmSshKey: 'کلید SSH',

  // Original text: 'No config drive'
  noConfigDrive: 'درایو پیکربندی وجود ندارد',

  // Original text: 'Custom config'
  newVmCustomConfig: 'پیکربندی سفارشی',

  // Original text: 'Click here to see the available template variables'
  availableTemplateVarsInfo: 'برای مشاهده متغیرهای قالب موجود اینجت کلیک کنید',

  // Original text: 'Available template variables'
  availableTemplateVarsTitle: 'متغیرهای قالب موجود',

  // Original text: 'the VM\'s name. It must not contain "_"'
  templateNameInfo: 'نام ماشین (های) مجازی نباید شامل کاراکتر "_" باشد.',

  // Original text: "the VM's index, it will take 0 in case of single VM"
  templateIndexInfo: 'در مورد تنها یک ماشین مجازی، شاخص ماشین مجازی مقدار 0 را خواهد گرفت',

  // Original text: 'Boot VM after creation'
  newVmBootAfterCreate: 'پس از ایجاد ماشین مجازی را بوت کنید',

  // Original text: 'Auto-generated if empty'
  newVmMacPlaceholder: 'در صورت خالی بودن به صورت خودکار تولید می شود',

  // Original text: 'CPU weight'
  newVmCpuWeightLabel: 'زمان CPU در میزبان که برای اجرای CPUهای مجازی در دسترس است',

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuWeight: 'پیش فرض: {value, number}',

  // Original text: 'CPU cap'
  newVmCpuCapLabel: 'محدودیت های کاملا دقیق در میزان منابع CPU که می تواند توسط یک پروژه یا یک منطقه مصرف شود',

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuCap: 'پیش فرض: {value, number}',

  // Original text: 'Cloud config'
  newVmCloudConfig: 'تنظیمات ابر',

  // Original text: 'Create VMs'
  newVmCreateVms: 'ایجاد ماشین مجازی',

  // Original text: 'Are you sure you want to create {nbVms, number} VMs?'
  newVmCreateVmsConfirm: 'آیا مطمئن هستید که می خواهید ماشین های مجازی {nbVms, number} ایجاد کنید؟',

  // Original text: 'Multiple VMs:'
  newVmMultipleVms: 'ماشین های مجازی چندگانه:',

  // Original text: 'Select a resource set:'
  newVmSelectResourceSet: 'یک مجموعه منابع انتخاب کنید:',

  // Original text: 'Name pattern:'
  newVmMultipleVmsPattern: 'نام الگو:',

  // Original text: 'e.g.: \\{name\\}_%'
  newVmMultipleVmsPatternPlaceholder: 'به عنوان مثال: \\{name\\}_%',

  // Original text: 'First index:'
  newVmFirstIndex: 'اولین شاخص:',

  // Original text: 'Recalculate VMs number'
  newVmNumberRecalculate: 'محاسبه مجدد تعداد ماشین های مجازی',

  // Original text: 'Refresh VMs name'
  newVmNameRefresh: 'تازه کردن نام ماشین های مجازی',

  // Original text: 'Affinity host'
  newVmAffinityHost: 'وابستگی میزبان',

  // Original text: 'Advanced'
  newVmAdvancedPanel: 'پیشرفته',

  // Original text: 'Show advanced settings'
  newVmShowAdvanced: 'نمایش تنظیمات پیشرفته',

  // Original text: 'Hide advanced settings'
  newVmHideAdvanced: 'مخفی کردن تنظیمات پیشرفته',

  // Original text: 'Share this VM'
  newVmShare: 'به اشتراک گذاشتن این ماشین مجازی',

  // Original text: 'Resource sets'
  resourceSets: 'مجموعه منابع',

  // Original text: 'No resource sets.'
  noResourceSets: 'بدون مجموعه منابع',

  // Original text: 'Loading resource sets'
  loadingResourceSets: 'بارگذاری مجموعه منابع',

  // Original text: 'Resource set name'
  resourceSetName: 'نام مجموعه منابع',

  // Original text: 'Users'
  resourceSetUsers: 'کاربران',

  // Original text: 'Pools'
  resourceSetPools: 'استخرها',

  // Original text: 'Templates'
  resourceSetTemplates: 'قالب ها',

  // Original text: 'SRs'
  resourceSetSrs: 'مخزن های ذخیره سازی',

  // Original text: 'Networks'
  resourceSetNetworks: 'شبکه ها',

  // Original text: 'Recompute all limits'
  recomputeResourceSets: 'محاسبه مجدد تمام محدودیت ها',

  // Original text: 'Save'
  saveResourceSet: 'ذخیره',

  // Original text: 'Reset'
  resetResourceSet: 'ریست',

  // Original text: 'Edit'
  editResourceSet: 'ویرایش',

  // Original text: 'Delete'
  deleteResourceSet: 'حذف کردن',

  // Original text: 'Delete resource set'
  deleteResourceSetWarning: 'حذف کردن مجموعه منابع',

  // Original text: 'Are you sure you want to delete this resource set?'
  deleteResourceSetQuestion: 'آیا مطمئن هستید که می خواهید این مجموعه منابع را حذف کنید؟',

  // Original text: 'Missing objects:'
  resourceSetMissingObjects: 'اشیاء گم شده:',

  // Original text: 'vCPUs'
  resourceSetVcpus: 'پردازنده های مجازی',

  // Original text: 'Memory'
  resourceSetMemory: 'حافظه',

  // Original text: 'Storage'
  resourceSetStorage: 'ذخیره ساز',

  // Original text: 'Unknown'
  unknownResourceSetValue: 'ناشناخته',

  // Original text: 'Available hosts'
  availableHosts: 'میزبان های موجود',

  // Original text: 'Excluded hosts'
  excludedHosts: 'میزبان های مستثنی شده',

  // Original text: 'No hosts available.'
  noHostsAvailable: 'هیچ میزبانی در دسترس نیست.',

  // Original text: 'VMs created from this resource set shall run on the following hosts.'
  availableHostsDescription: 'ماشین های مجازی ایجاد شده از این مجموعه منابع باید روی میزبان های زیر اجرا شوند.',

  // Original text: 'Maximum CPUs'
  maxCpus: 'حداکثر پردازنده ها',

  // Original text: 'Maximum RAM'
  maxRam: 'حداکثر حافظه',

  // Original text: 'Maximum disk space'
  maxDiskSpace: 'حداکثر فضای دیسک',

  // Original text: 'IP pool'
  ipPool: 'استخر IP',

  // Original text: 'Quantity'
  quantity: 'تعداد',

  // Original text: 'No limits.'
  noResourceSetLimits: 'بدون محدودیت.',

  // Original text: 'Remaining:'
  remainingResource: 'باقی مانده:',

  // Original text: 'Used'
  usedResourceLabel: 'استفاده شده',

  // Original text: 'Available'
  availableResourceLabel: 'در دسترس',

  // Original text: 'Used: {usage} (Total: {total})'
  resourceSetQuota: 'استفاده شده: {usage} (Total: {total})',

  // Original text: 'New'
  resourceSetNew: 'جدید',

  // Original text: 'Try dropping some VMs files here, or click to select VMs to upload. Accept only .xva/.ova files.'
  importVmsList:
    'سعی کنید برخی از فایل های ماشین مجازی را در اینجا رها کنید یا برای انتخاب ماشین های مجازی برای بارگذاری کلیک کنید. فقط فایل‌های xva/.ova قابل قبول است.',

  // Original text: 'No selected VMs.'
  noSelectedVms: 'هیچ ماشین مجازی انتخاب شده ای وجود ندارد.',

  // Original text: 'To Pool:'
  vmImportToPool: 'به استخر:',

  // Original text: 'To SR:'
  vmImportToSr: 'به مخزن ذخیره سازی:',

  // Original text: 'VMs to import'
  vmsToImport: 'ماشین های مجازی برای وارد کردن',

  // Original text: 'Reset'
  importVmsCleanList: 'ریست',

  // Original text: 'VM import success'
  vmImportSuccess: 'ماشین مجازی با موفقیت وارد شد',

  // Original text: 'VM import failed'
  vmImportFailed: 'وارد کردن ماشین مجازی انجام نشد',

  // Original text: 'VDI import success'
  vdiImportSuccess: 'VDI با موفقیت وارد شد',

  // Original text: 'VDI import failed'
  vdiImportFailed: 'وارد کردن VDI انجام نشد',

  // Original text: 'Error on setting the VM: {vm}'
  setVmFailed: 'خطا در تنظیم ماشین مجازی: {vm}',

  // Original text: 'Import starting…'
  startVmImport: 'شروع وارد کردن…',

  // Original text: 'VDI import starting…'
  startVdiImport: 'شروع وارد کردن VDI…',

  // Original text: 'Export starting…'
  startVmExport: 'شروع صادر کردن…',

  // Original text: 'VDI export starting…'
  startVdiExport: 'شروع صادر کردن VDI…',

  // Original text: 'N CPUs'
  nCpus: 'N پردازنده',

  // Original text: 'Memory'
  vmMemory: 'حافظه',

  // Original text: 'Disk {position} ({capacity})'
  diskInfo: 'دیسک {position} ({capacity})',

  // Original text: 'Disk description'
  diskDescription: 'توضیحات دیسک',

  // Original text: 'No disks.'
  noDisks: 'بدون دیسک.',

  // Original text: 'No networks.'
  noNetworks: 'بدون شبکه.',

  // Original text: 'Network {name}'
  networkInfo: 'شبکه {name}',

  // Original text: 'No description available'
  noVmImportErrorDescription: 'توضیحی در دسترس نیست',

  // Original text: 'Error:'
  vmImportError: 'خطا:',

  // Original text: '{type} file:'
  vmImportFileType: '{type} فایل:',

  // Original text: 'Please check and/or modify the VM configuration.'
  vmImportConfigAlert: 'لطفاً پیکربندی ماشین مجازی را بررسی و/یا تغییر دهید.',

  // Original text: 'No pending tasks'
  noTasks: 'هیچ کار در حال انتظاری وجود ندارد',

  // Original text: 'Currently, there are not any pending XenServer tasks'
  xsTasks: 'در حال حاضر، هیچ کار در حال انتظاری برای XenServer وجود ندارد',

  // Original text: 'Cancel'
  cancelTask: 'لغو کردن',

  // Original text: 'Destroy'
  destroyTask: 'از بین بردن',

  // Original text: 'Cancel selected tasks'
  cancelTasks: 'لغو کردن کارهای انتخاب شده',

  // Original text: 'Destroy selected tasks'
  destroyTasks: 'از بین بردن کارهای انتخاب شده',

  // Original text: 'Pool'
  pool: 'استخر',

  // Original text: 'Task'
  task: 'کار',

  // Original text: 'Progress'
  progress: 'پیشرفت',

  // Original text: 'Schedules'
  backupSchedules: 'زمان بندی',

  // Original text: 'Cron pattern'
  scheduleCron: 'الگوی Cron',

  // Original text: 'Name'
  scheduleName: 'نام',

  // Original text: 'Timezone'
  scheduleTimezone: 'منطقه زمانی',

  // Original text: 'Export ret.'
  scheduleExportRetention: 'صدور ret',

  // Original text: 'Copy ret.'
  scheduleCopyRetention: 'کپی ret',

  // Original text: 'Snapshot ret.'
  scheduleSnapshotRetention: 'اسنپ شات ret',

  // Original text: 'Get remote'
  getRemote: 'گرفتن ریموت',

  // Original text: 'List Remote'
  listRemote: 'لیست کردن ریموت',

  // Original text: 'simple'
  simpleBackup: 'ساده',

  // Original text: 'delta'
  delta: 'دلتا',

  // Original text: 'Restore Backups'
  restoreBackups: 'بازیابی نسخه های پشتیبان',

  // Original text: 'Click on a VM to display restore options'
  restoreBackupsInfo: 'برای نمایش گزینه های بازیابی روی ماشین مجازی کلیک کنید',

  // Original text: 'Only the files of Delta Backup which are not on a SMB remote can be restored'
  restoreDeltaBackupsInfo: 'فقط فایل‌های پشتیبان دلتا که روی ریموت SMB نیستند قابل بازیابی هستند',

  // Original text: 'Enabled'
  remoteEnabled: 'فعال شد',

  // Original text: 'Error'
  remoteError: 'خطا',

  // Original text: 'The URL ({url}) is invalid (colon in path). Click this button to change the URL to {newUrl}.'
  remoteErrorMessage: 'آدرس ({url}) نامعتبر است (دونقطه در مسیر). برای تغییر آدرس به {newUrl} روی این دکمه کلیک کنید.',

  // Original text: 'No backup available'
  noBackup: 'هیچ نسخه پشتیبانی در دسترس نیست',

  // Original text: 'VM Name'
  backupVmNameColumn: 'نام ماشین مجازی',

  // Original text: 'VM Description'
  backupVmDescriptionColumn: 'توضیحات ماشین مجازی',

  // Original text: 'Tags'
  backupTags: 'برچسب ها',

  // Original text: 'Oldest backup'
  firstBackupColumn: 'قدیمی ترین نسخه پشتیبان',

  // Original text: 'Latest backup'
  lastBackupColumn: 'آخرین نسخه پشتیبان',

  // Original text: 'Available Backups'
  availableBackupsColumn: 'نسخه های پشتیبان موجود',

  // Original text: 'Missing parameters'
  backupRestoreErrorTitle: 'پارامترهای گم شده',

  // Original text: 'Choose a SR and a backup'
  backupRestoreErrorMessage: 'یک مخزن ذخیره سازی (SR) و یک نسخه پشتیبان انتخاب کنید',

  // Original text: 'Select default SR…'
  backupRestoreSelectDefaultSr: 'مخزن ذخیره سازی (SR) پیش فرض را انتخاب کنید…',

  // Original text: 'Choose a SR for each VDI'
  backupRestoreChooseSrForEachVdis: 'برای هر VDI یک مخزن ذخیره سازی (SR) انتخاب کنید',

  // Original text: 'VDI'
  backupRestoreVdiLabel: 'VDI',

  // Original text: 'SR'
  backupRestoreSrLabel: 'مخزن ذخیره سازی (SR)',

  // Original text: 'Display backups'
  displayBackup: 'نمایش نسخه های پشتیبان',

  // Original text: 'Import VM'
  importBackupTitle: 'وارد کردن ماشین مجازی',

  // Original text: 'Starting your backup import'
  importBackupMessage: 'شروع وارد کردن نسخه پشتیبان',

  // Original text: 'VMs to backup'
  vmsToBackup: 'ماشین های مجازی برای پشتیبان گیری',

  // Original text: 'Refresh backup list'
  restoreResfreshList: 'تازه کردن لیست نسخه پشتیبان',

  // Original text: 'Restore'
  restoreVmBackups: 'بازیابی',

  // Original text: 'Restore {vm}'
  restoreVmBackupsTitle: 'بازیابی {vm}',

  // Original text: 'Restore {nVms, number} VM{nVms, plural, one {} other {s}}'
  restoreVmBackupsBulkTitle: 'بازیابی {nVms, number} VM{nVms, plural, one {} other {s}}',

  // Original text: 'Restore {nVms, number} VM{nVms, plural, one {} other {s}} from {nVms, plural, one {its} other {their}} {oldestOrLatest} backup.'
  restoreVmBackupsBulkMessage:
    'بازیابی {nVms, number} ماشین مجازی{nVms, plural, one {} other {s}} از {nVms, plural, one {its} other {their}} {oldestOrLatest} نسخه پشتیبان.',

  // Original text: 'oldest'
  oldest: 'قدیمی ترین',

  // Original text: 'latest'
  latest: 'آخرین',

  // Original text: 'Start VM{nVms, plural, one {} other {s}} after restore'
  restoreVmBackupsStart: 'ماشین مجازی{nVms, plural, one {} other {s}} را بعد از بازیابی اجرا کنید',

  // Original text: 'Multi-restore error'
  restoreVmBackupsBulkErrorTitle: 'خطای بازیابی چندگانه',

  // Original text: 'You need to select a destination SR'
  restoreVmBackupsBulkErrorMessage: 'شما باید یک مخزن ذخیره سازی (SR) مقصد را انتخاب کنید',

  // Original text: 'Delete backups…'
  deleteVmBackups: 'حذف نسخه پشتیبان…',

  // Original text: 'Delete {vm} backups'
  deleteVmBackupsTitle: 'حذف نسخه پشتیبان {vm}',

  // Original text: 'Select backups to delete:'
  deleteVmBackupsSelect: 'انتخاب نسخه های پشتیبان برای حذف:',

  // Original text: 'All'
  deleteVmBackupsSelectAll: 'همه',

  // Original text: 'Delete backups'
  deleteVmBackupsBulkTitle: 'حذف کردن نسخه های پشتیبان',

  // Original text: 'Are you sure you want to delete all the backups from {nVms, number} VM{nVms, plural, one {} other {s}}?'
  deleteVmBackupsBulkMessage:
    'آیا مطمئن هستید که می‌خواهید همه نسخه‌های پشتیبان را از {nVms, number} ماشین مجازی{nVms, plural, one {} other {s}} حذف کنید؟',

  // Original text: 'delete {nBackups} backup{nBackups, plural, one {} other {s}}'
  deleteVmBackupsBulkConfirmText: 'حذف {nBackups} نسخه پشتیبان{nBackups, plural, one {} other {s}}',

  // Original text: 'List remote backups'
  listRemoteBackups: 'لیست نسخه های پشتیبان راه دور',

  // Original text: 'Restore backup files'
  restoreFiles: 'بازیابی فایل های پشتیبان',

  // Original text: 'Invalid options'
  restoreFilesError: 'گزینه های نامعتبر',

  // Original text: 'Restore file from {name}'
  restoreFilesFromBackup: 'بازیابی فایل از {name}',

  // Original text: 'Select a backup…'
  restoreFilesSelectBackup: 'انتخاب یک نسخه پشتیبان…',

  // Original text: 'Select a disk…'
  restoreFilesSelectDisk: 'انتخاب یک دیسک…',

  // Original text: 'Select a partition…'
  restoreFilesSelectPartition: 'انتخاب یک پارتیشن…',

  // Original text: 'Folder path'
  restoreFilesSelectFolderPath: 'مسیر پوشه',

  // Original text: 'Select a file…'
  restoreFilesSelectFiles: 'انتخاب یک فایل…',

  // Original text: 'Content not found'
  restoreFileContentNotFound: 'محتوا یافت نشد',

  // Original text: 'No files selected'
  restoreFilesNoFilesSelected: 'هیچ فایلی انتخاب نشده است',

  // Original text: 'Selected files ({files}):'
  restoreFilesSelectedFiles: 'فایل های انتخاب شده ({files}):',

  // Original text: 'Error while scanning disk'
  restoreFilesDiskError: 'خطا هنگام اسکن کردن دیسک',

  // Original text: "Select all this folder's files"
  restoreFilesSelectAllFiles: 'انتخاب تمام فایل های این پوشه',

  // Original text: 'Unselect all files'
  restoreFilesUnselectAll: 'از حالت انتخاب خارج کردن تمام فایل ها',

  // Original text: 'Emergency shutdown Host'
  emergencyShutdownHostModalTitle: 'خاموش کردن اضطراری میزبان',

  // Original text: 'Are you sure you want to shutdown {host}?'
  emergencyShutdownHostModalMessage: 'آیا مطمئن هستید که می خواهید {host} را خاموش کنید؟',

  // Original text: 'Emergency shutdown Host{nHosts, plural, one {} other {s}}'
  emergencyShutdownHostsModalTitle: 'خاموش کردن اضطراری میزبان{nHosts, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to shutdown {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  emergencyShutdownHostsModalMessage:
    'آیا مطمئن هستید که می‌خواهید {nHosts, number} میزبان {nHosts, plural, one {} other {s}} را خاموش کنید؟',

  // Original text: 'Shutdown host'
  stopHostModalTitle: 'خاموش کردن میزبان',

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage:
    'با این کار میزبان شما خاموش می شود. می خواهید ادامه دهید؟ اگر استخر اصلی باشد، ارتباط شما با استخر قطع خواهد شد',

  // Original text: 'Add host'
  addHostModalTitle: 'اضافه کردن میزبان',

  // Original text: 'Are you sure you want to add {host} to {pool}?'
  addHostModalMessage: 'آیا مطمئن هستید که می خواهید {host} را به {pool} اضافه کنید؟',

  // Original text: 'Restart host'
  restartHostModalTitle: 'راه اندازی مجدد میزبان',

  // Original text: 'This will restart your host. Do you want to continue?'
  restartHostModalMessage: 'با این کار میزبان شما راه اندازی مجدد می شود. می خواهید ادامه دهید؟',

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}'
  restartHostsAgentsModalTitle:
    'راه اندازی مجدد میزبان{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?'
  restartHostsAgentsModalMessage:
    'آیا مطمئن هستید که می‌خواهید {nHosts, number} از میزبان {nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}} را راه اندازی مجدد کنید؟',

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}}'
  restartHostsModalTitle: 'راه اندازی مجدد میزبان{nHosts, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  restartHostsModalMessage:
    'آیا مطمئن هستید که می خواهید {nHosts, number} از میزبان {nHosts, plural, one {} other {s}} را راه اندازی مجدد کنید؟',

  // Original text: 'Start VM{vms, plural, one {} other {s}}'
  startVmsModalTitle: 'اجرای ماشین مجازی{vms, plural, one {} other {s}}',

  // Original text: 'Start a copy'
  cloneAndStartVM: 'شروع یک کپی',

  // Original text: 'Force start'
  forceStartVm: 'شروع اجباری',

  // Original text: 'Forbidden operation'
  forceStartVmModalTitle: 'عملیات ممنوع',

  // Original text: 'Start operation for this vm is blocked.'
  blockedStartVmModalMessage: 'عملیات شروع برای این ماشین مجازی مسدود شده است.',

  // Original text: 'Forbidden operation start for {nVms, number} vm{nVms, plural, one {} other {s}}.'
  blockedStartVmsModalMessage: 'عملیات شروع برای {nVms, number} ماشین مجازی{nVms, plural, one {} other {s}} ممنوع است.',

  // Original text: 'Are you sure you want to start {vms, number} VM{vms, plural, one {} other {s}}?'
  startVmsModalMessage:
    'آیا مطمئن هستید که می خواهید {vms, number} ماشین مجازی {vms, plural, one {} other {s}} را اجرا کنید؟',

  // Original text: '{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information'
  failedVmsErrorMessage:
    '{nVms, number} ماشین مجازی{nVms, plural, one {} other {s}} ناموفق بوده اند.لطفا برای دریافت اطلاعات بیشتر گزارش های خود را بررسی کنید.',

  // Original text: 'Start failed'
  failedVmsErrorTitle: 'شروع ناموفق بود',

  // Original text: 'Stop Host{nHosts, plural, one {} other {s}}'
  stopHostsModalTitle: 'توقف میزبان{nHosts, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  stopHostsModalMessage:
    'آیا مطمئن هستید که می‌خواهید {nHosts, number} از میزبان{nHosts, plural, one {} other {s}} را متوقف کنید؟',

  // Original text: 'Stop VM{vms, plural, one {} other {s}}'
  stopVmsModalTitle: 'متوقف کردن ماشین مجازی{vms, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?'
  stopVmsModalMessage:
    'آیا مطمئن هستید که می خواهید {vms, number} ماشین مجازی{vms, plural, one {} other {s}} را متوقف کنید؟',

  // Original text: 'Restart VM'
  restartVmModalTitle: 'راه اندازی مجدد ماشین مجازی',

  // Original text: 'Are you sure you want to restart {name}?'
  restartVmModalMessage: 'آیا مطمئن هستید که می خواهید {name} را راه اندازی مجدد کنید؟',

  // Original text: 'Stop VM'
  stopVmModalTitle: 'متوقف کردن ماشین مجازی',

  // Original text: 'Are you sure you want to stop {name}?'
  stopVmModalMessage: 'آیا مطمئن هستید که می خواهید {name} را متوقف کنید؟',

  // Original text: 'Suspend VM{vms, plural, one {} other {s}}'
  suspendVmsModalTitle: 'ماشین مجازی{vms, plural, one {} other {s}} معلق شده است',

  // Original text: 'Are you sure you want to suspend {vms, number} VM{vms, plural, one {} other {s}}?'
  suspendVmsModalMessage:
    'آیا مطمئن هستید که می‌خواهید {vms, number} ماشین مجازی{vms, plural, one {} other {s}} را به حالت تعلیق درآورید؟',

  // Original text: 'Restart VM{vms, plural, one {} other {s}}'
  restartVmsModalTitle: 'راه اندازی مجدد ماشین مجازی{vms, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?'
  restartVmsModalMessage:
    'آیا مطمئن هستید که می خواهید {vms, number} ماشین مجازی{vms, plural, one {} other {s}} را راه اندازی مجدد کنید؟',

  // Original text: 'Snapshot VM{vms, plural, one {} other {s}}'
  snapshotVmsModalTitle: 'اسنپ شات ماشین مجازی{vms, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to snapshot {vms, number} VM{vms, plural, one {} other {s}}?'
  snapshotVmsModalMessage:
    'آیا مطمئن هستید که می‌خواهید {vms, number} ماشین مجازی{vms, plural, one {} other {s}} را اسنپ شات کنید؟',

  // Original text: 'Delete VM{vms, plural, one {} other {s}}'
  deleteVmsModalTitle: 'حذف ماشین مجازی{vms, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED'
  deleteVmsModalMessage:
    'آیا مطمئنید که می خواهید {vms, number} ماشین مجازی{vms, plural, one {} other {s}} را حذف کنید؟ همه دیسک های ماشین مجازی حذف خواهند شد',

  // Original text: 'delete {nVms, number} vm{nVms, plural, one {} other {s}}'
  deleteVmsConfirmText: 'حذف {nVms, number} ماشین مجازی{nVms, plural, one {} other {s}}',

  // Original text: 'Delete VM'
  deleteVmModalTitle: 'حذف ماشین مجازی',

  // Original text: 'Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED'
  deleteVmModalMessage:
    'آیا مطمئن هستید که می خواهید این ماشین مجازی را حذف کنید؟ همه دیسک های ماشین مجازی حذف خواهند شد',

  // Original text: 'Blocked operation'
  deleteVmBlockedModalTitle: 'عملیات مسدود شده است',

  // Original text: 'Removing the VM is a blocked operation. Would you like to remove it anyway?'
  deleteVmBlockedModalMessage: 'حذف ماشین مجازی یک عملیات مسدود شده است. آیا می خواهید در هر صورت آن را حذف کنید؟',

  // Original text: 'Migrate VM'
  migrateVmModalTitle: 'مهاجرت ماشین مجازی',

  // Original text: 'Select a destination host:'
  migrateVmSelectHost: 'انتخاب یک میزبان مقصد:',

  // Original text: 'Select a migration network:'
  migrateVmSelectMigrationNetwork: 'انتخاب یک شبکه مهاجرت:',

  // Original text: 'For each VIF, select a network:'
  migrateVmSelectNetworks: 'برای هر VIF یک شبکه انتخاب کنید:',

  // Original text: 'Select a destination SR:'
  migrateVmsSelectSr: 'انتخاب یک مخزن ذخیره سازی (SR) مقصد',

  // Original text: 'Select a destination SR for local disks:'
  migrateVmsSelectSrIntraPool: 'برای دیسک های محلی یک مخزن ذخیره سازی مقصد (SR) انتخاب کنید:',

  // Original text: 'Select a network on which to connect each VIF:'
  migrateVmsSelectNetwork: 'شبکه ای را برای اتصال هر VIF انتخاب کنید:',

  // Original text: 'Smart mapping'
  migrateVmsSmartMapping: 'نقشه برداری هوشمند',

  // Original text: 'VIF'
  migrateVmVif: 'VIF',

  // Original text: 'Network'
  migrateVmNetwork: 'شبکه',

  // Original text: 'No target host'
  migrateVmNoTargetHost: 'میزبان هدف وجود ندارد',

  // Original text: 'A target host is required to migrate a VM'
  migrateVmNoTargetHostMessage: 'برای مهاجرت یک ماشین مجازی یک میزبان هدف مورد نیاز است',

  // Original text: 'No default SR'
  migrateVmNoDefaultSrError: 'مخزن ذخیره سازی (SR) وجود ندارد',

  // Original text: 'Default SR not connected to host'
  migrateVmNotConnectedDefaultSrError: 'مخزن ذخیره سازی (SR) پیش‌فرض به میزبان متصل نیست',

  // Original text: 'For each VDI, select an SR:'
  chooseSrForEachVdisModalSelectSr: 'برای هر VDI یک مخزن ذخیره سازی (SR) انتخاب کنید',

  // Original text: 'Select main SR…'
  chooseSrForEachVdisModalMainSr: 'انتخاب مخزن ذخیره سازی (SR) اصلی…',

  // Original text: 'VDI'
  chooseSrForEachVdisModalVdiLabel: 'VDI',

  // Original text: 'SR*'
  chooseSrForEachVdisModalSrLabel: 'مخزن های ذخیره سازی* (SR)',

  // Original text: '* optional'
  chooseSrForEachVdisModalOptionalEntry: '* اختیاری',

  // Original text: 'Delete job{nJobs, plural, one {} other {s}}'
  deleteJobsModalTitle: 'حذف کار{nJobs, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nJobs, number} job{nJobs, plural, one {} other {s}}?'
  deleteJobsModalMessage:
    'آیا مطمئن هستید که می خواهید {nJobs, number} کار{nJobs, plural, one {} other {s}} را حذف کنید؟',

  // Original text: 'Delete VBD{nVbds, plural, one {} other {s}}'
  deleteVbdsModalTitle: 'حذف VBD{nVbds, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nVbds, number} VBD{nVbds, plural, one {} other {s}}?'
  deleteVbdsModalMessage:
    'آیا مطمئن هستید که می خواهید {nVbds, number} از VBD{nVbds, plural, one {} other {s}} را حذف کنید؟',

  // Original text: 'Delete VDI'
  deleteVdiModalTitle: 'حذف VDI',

  // Original text: 'Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST'
  deleteVdiModalMessage:
    'آیا مطمئن هستید که می خواهید این دیسک را حذف کنید؟ تمام داده های روی این دیسک از بین خواهد رفت',

  // Original text: 'Delete VDI{nVdis, plural, one {} other {s}}'
  deleteVdisModalTitle: 'حذف VDI{nVdis, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nVdis, number} disk{nVdis, plural, one {} other {s}}? ALL DATA ON THESE DISKS WILL BE LOST'
  deleteVdisModalMessage:
    'آیا مطمئن هستید که می خواهید {nVdis, number} از دیسک{nVdis, plural, one {} other {s}} را حذف کنید؟ تمام داده های روی این دیسک ها از بین خواهند رفت',

  // Original text: 'Delete schedule{nSchedules, plural, one {} other {s}}'
  deleteSchedulesModalTitle: 'حذف زمان بندی{nSchedules, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nSchedules, number} schedule{nSchedules, plural, one {} other {s}}?'
  deleteSchedulesModalMessage:
    'آیا مطمئن هستید که می خواهید {nSchedules, number} از زمان بندی{nSchedules, plural, one {} other {s}} را حذف کنید؟',

  // Original text: 'Delete remote{nRemotes, plural, one {} other {s}}'
  deleteRemotesModalTitle: 'حذف ریموت{nRemotes, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nRemotes, number} remote{nRemotes, plural, one {} other {s}}?'
  deleteRemotesModalMessage:
    'آیا مطمئن هستید که می خواهید {nRemotes, number} از ریموت{nRemotes, plural, one {} other {s}} را حذف کنید؟',

  // Original text: 'Revert your VM'
  revertVmModalTitle: 'ماشین مجازی خود را برگردانید',

  // Original text: 'Share your VM'
  shareVmInResourceSetModalTitle: 'ماشین مجازی خود را به اشتراک بگذارید',

  // Original text: 'This VM will be shared with all the members of the self-service {self}. Are you sure?'
  shareVmInResourceSetModalMessage:
    'این ماشین مجازی با همه اعضای سلف سرویس {self} به اشتراک گذاشته خواهد شد. آیا مطمئن هستید؟',

  // Original text: 'Delete VIF{nVifs, plural, one {} other {s}}'
  deleteVifsModalTitle: 'حذف VIF{nVifs, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nVifs, number} VIF{nVifs, plural, one {} other {s}}?'
  deleteVifsModalMessage:
    'آیا مطمئن هستید که می خواهید {nVifs, number} از VIF{nVifs, plural, one {} other {s}} را حذف کنید؟',

  // Original text: 'Delete snapshot'
  deleteSnapshotModalTitle: 'حذف اسنپ شات',

  // Original text: 'Are you sure you want to delete this snapshot?'
  deleteSnapshotModalMessage: 'آیا مطمئن هستید که می خواهید این اسنپ شات را حذف کنید؟',

  // Original text: 'Delete snapshot{nVms, plural, one {} other {s}}'
  deleteSnapshotsModalTitle: 'حذف اسنپ شات{nVms, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nVms, number} snapshot{nVms, plural, one {} other {s}}?'
  deleteSnapshotsModalMessage:
    'آیا مطمئن هستید که می خواهید {nVms, number} از اسنپ شات{nVms, plural, one {} other {s}} را حذف کنید؟',

  // Original text: 'Disconnect VBD{nVbds, plural, one {} other {s}}'
  disconnectVbdsModalTitle: 'قطع کردن VBD{nVbds, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to disconnect {nVbds, number} VBD{nVbds, plural, one {} other {s}}?'
  disconnectVbdsModalMessage:
    'آیا مطمئن هستید که می خواهید {nVbds, number} از VBD{nVbds, plural, one {} other {s}} را قطع کنید؟',

  // Original text: 'Are you sure you want to revert this VM to the snapshot state? This operation is irreversible.'
  revertVmModalMessage:
    'آیا مطمئن هستید که می خواهید این ماشین مجازی را به حالت اسنپ شات برگردانید؟ این عمل غیر قابل برگشت است.',

  // Original text: 'Snapshot before'
  revertVmModalSnapshotBefore: 'اسنپ شات قبل',

  // Original text: 'Import a {name} Backup'
  importBackupModalTitle: 'وارد کردن یک نسخه پشتیبان {name}',

  // Original text: 'Start VM after restore'
  importBackupModalStart: 'اجرای ماشین مجازی بعد از بازیابی',

  // Original text: 'Select your backup…'
  importBackupModalSelectBackup: 'نسخه پشتیبان خود را انتخاب کنید…',

  // Original text: 'Select a destination SR…'
  importBackupModalSelectSr: 'انتخاب مخزن ذخیره سازی (SR) مقصد…',

  // Original text: 'Are you sure you want to remove all orphaned snapshot VDIs?'
  removeAllOrphanedModalWarning: 'آیا مطمئن هستید که می خواهید تمام اسنپ شات VDIهای بدون سرپرست را حذف کنید؟',

  // Original text: 'Remove all logs'
  removeAllLogsModalTitle: 'حذف تمام گزارش ها',

  // Original text: 'Are you sure you want to remove all logs?'
  removeAllLogsModalWarning: 'آیا مطمئن هستید که می خواهید تمام گزارش ها را حذف کنید؟',

  // Original text: 'This operation is definitive.'
  definitiveMessageModal: 'این عملیات قطعی است.',

  // Original text: 'Previous SR Usage'
  existingSrModalTitle: 'استفاده قبلی از مخزن ذخیره سازی (SR)',

  // Original text: 'This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation.'
  existingSrModalText:
    'این مسیر قبلاً به عنوان یک ذخیره ساز توسط یک میزبان XenServer استفاده شده است. اگر ادامه ایجاد مخزن ذخیره سازی (SR) را انتخاب کنید، همه داده ها از بین خواهند رفت.',

  // Original text: 'Previous LUN Usage'
  existingLunModalTitle: 'استفاده قبلی از LUN',

  // Original text: 'This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation.'
  existingLunModalText:
    'این LUN قبلاً به عنوان یک ذخیره ساز توسط یک میزبان XenServer استفاده شده است. اگر ادامه ایجاد مخزن ذخیره سازی (SR) را انتخاب کنید، همه داده ها از بین خواهند رفت.',

  // Original text: 'Replace current registration?'
  alreadyRegisteredModal: 'ثبت نام فعلی جایگزین شود؟',

  // Original text: 'Your XO appliance is already registered to {email}, do you want to forget and replace this registration?'
  alreadyRegisteredModalText:
    'دستگاه XO شما قبلاً با {email} ثبت شده است، آیا می خواهید این ثبت نام را فراموش کرده و جایگزین کنید؟',

  // Original text: 'Ready for trial?'
  trialReadyModal: 'آماده برای آزمایش؟',

  // Original text: 'During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!'
  trialReadyModalText:
    'در طول دوره آزمایشی، XOA باید یک اتصال اینترنتی فعال داشته باشد. این محدودیت برای طرح های پولی ما اعمال نمی شود!',

  // Original text: 'Cancel task{nTasks, plural, one {} other {s}}'
  cancelTasksModalTitle: 'لغو کار{nTasks, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to cancel {nTasks, number} task{nTasks, plural, one {} other {s}}?'
  cancelTasksModalMessage:
    'آیا مطمئن هستید که می‌خواهید {nTasks, number} کار{nTasks, plural, one {} other {s}} را لغو کنید؟',

  // Original text: 'Destroy task{nTasks, plural, one {} other {s}}'
  destroyTasksModalTitle: 'از بین بردن کار{nTasks, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to destroy {nTasks, number} task{nTasks, plural, one {} other {s}}?'
  destroyTasksModalMessage:
    'آیا مطمئن هستید که می خواهید {nTasks, number} کار{nTasks, plural, one {} other {s}} را از بین ببرید؟',

  // Original text: 'Label'
  serverLabel: 'برچسب',

  // Original text: 'Host'
  serverHost: 'میزبان',

  // Original text: 'Username'
  serverUsername: 'نام کاربری',

  // Original text: 'Password'
  serverPassword: 'کلمه عبور',

  // Original text: 'Action'
  serverAction: 'عمل',

  // Original text: 'Read Only'
  serverReadOnly: 'فقط خواندنی',

  // Original text: 'Unauthorized Certificates'
  serverUnauthorizedCertificates: 'گواهینامه های غیر مجاز',

  // Original text: 'Allow Unauthorized Certificates'
  serverAllowUnauthorizedCertificates: 'اجازه دادن به گواهینامه های غیرمجاز',

  // Original text: "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured."
  serverUnauthorizedCertificatesInfo:
    'اگر گواهی شما رد شد، آن را فعال کنید، اما این کار توصیه نمی شود زیرا اتصال شما ایمن نخواهد بود.',

  // Original text: 'Disconnect server'
  serverDisconnect: 'قطع کردن سرور',

  // Original text: 'username'
  serverPlaceHolderUser: 'نام کاربری',

  // Original text: 'password'
  serverPlaceHolderPassword: 'کلمه عبور',

  // Original text: 'address[:port]'
  serverPlaceHolderAddress: 'آدرس[:پورت]',

  // Original text: 'label'
  serverPlaceHolderLabel: 'برچسب',

  // Original text: 'Connect'
  serverConnect: 'اتصال',

  // Original text: 'Error'
  serverError: 'خطا',

  // Original text: 'Adding server failed'
  serverAddFailed: 'افزودن سرور انجام نشد',

  // Original text: 'Status'
  serverStatus: 'وضعیت',

  // Original text: 'Connection failed. Click for more information.'
  serverConnectionFailed: 'ارتباط ناموفق بود. برای اطلاعات بیشتر کلیک کنید.',

  // Original text: 'Connecting…'
  serverConnecting: 'در حال اتصال…',

  // Original text: 'Connected'
  serverConnected: 'متصل شده است',

  // Original text: 'Disconnected'
  serverDisconnected: 'قطع شده است',

  // Original text: 'Authentication error'
  serverAuthFailed: 'خطای احراز هویت',

  // Original text: 'Unknown error'
  serverUnknownError: 'خطای ناشناخته',

  // Original text: 'Invalid self-signed certificate'
  serverSelfSignedCertError: 'گواهینامه self-signed نامعتبر است',

  // Original text: 'Do you want to accept self-signed certificate for this server even though it would decrease security?'
  serverSelfSignedCertQuestion:
    'آیا می خواهید گواهینامه self-signed را برای این سرور بپذیرید حتی اگر امنیت را کاهش دهد؟',

  // Original text: 'Copy VM'
  copyVm: 'کپی کردن ماشین مجازی',

  // Original text: 'Are you sure you want to copy this VM to {SR}?'
  copyVmConfirm: 'آیا مطمئن هستید که می‌خواهید این ماشین مجازی را در {SR} کپی کنید؟',

  // Original text: 'Name'
  copyVmName: 'نام',

  // Original text: 'Name pattern'
  copyVmNamePattern: 'نام الگو',

  // Original text: 'If empty: name of the copied VM'
  copyVmNamePlaceholder: 'اگر خالی باشد: نام ماشین مجازی کپی شده',

  // Original text: 'e.g.: "\\{name\\}_COPY"'
  copyVmNamePatternPlaceholder: 'به عنوان مثال: "\\{name\\}_COPY"',

  // Original text: 'Select SR'
  copyVmSelectSr: 'انتخاب مخزن ذخیره سازی (SR)',

  // Original text: 'Use compression'
  copyVmCompress: 'استفاده از فشرده سازی',

  // Original text: 'No target SR'
  copyVmsNoTargetSr: 'مخزن ذخیره سازی (SR) هدف وجود ندارد',

  // Original text: 'A target SR is required to copy a VM'
  copyVmsNoTargetSrMessage: 'برای کپی کردن یک ماشین مجازی یک مخزن ذخیره سازی (SR) هدف مورد نیاز است',

  // Original text: 'Fast clone'
  fastCloneMode: 'کلون کردن سریع',

  // Original text: 'Full copy'
  fullCopyMode: 'کپی کامل',

  // Original text: 'Detach host'
  detachHostModalTitle: 'جدا کردن میزبان',

  // Original text: 'Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST.'
  detachHostModalMessage:
    'آیا مطمئن هستید که می خواهید {host} را از استخر آن جدا کنید؟ این کار تمام ماشین های مجازی در ذخیره ساز محلی را از بین خواهد برد و میزبان راه اندازی مجدد می شود.',

  // Original text: 'Detach'
  detachHost: 'جدا کردن',

  // Original text: 'Forget host'
  forgetHostModalTitle: 'فراموش کردن میزبان',

  // Original text: "Are you sure you want to forget {host} from its pool? Be sure this host can't be back online, or use detach instead."
  forgetHostModalMessage:
    'آیا مطمئن هستید که می‌خواهید {host} را از استخر آن فراموش کنید؟ مطمئن باشید که این میزبان نمی تواند دوباره آنلاین شود یا به جای آن از جدا کردن استفاده کنید.',

  // Original text: 'Forget'
  forgetHost: 'فراموش کردن',

  // Original text: 'Designate a new master'
  setPoolMasterModalTitle: 'تعیین یک مستر جدید',

  // Original text: 'This operation may take several minutes. Do you want to continue?'
  setPoolMasterModalMessage: 'این عملیات ممکن است چند دقیقه طول بکشد. می خواهید ادامه دهید؟',

  // Original text: 'Create network'
  newNetworkCreate: 'ایجاد شبکه',

  // Original text: 'Create bonded network'
  newBondedNetworkCreate: 'ایجاد شبکه پیوندی',

  // Original text: 'Interface'
  newNetworkInterface: 'رابط',

  // Original text: 'Name'
  newNetworkName: 'نام',

  // Original text: 'Description'
  newNetworkDescription: 'سرح',

  // Original text: 'VLAN'
  newNetworkVlan: 'شبکه محلی مجازی',

  // Original text: 'No VLAN if empty'
  newNetworkDefaultVlan: 'اگر خالی باشد بدون شبکه محلی مجازی',

  // Original text: 'MTU'
  newNetworkMtu: 'حداکثر واحد انتقال',

  // Original text: 'Default: 1500'
  newNetworkDefaultMtu: 'پیش فرض: 1500',

  // Original text: 'Name required'
  newNetworkNoNameErrorTitle: 'نام مورد نیاز است',

  // Original text: 'A name is required to create a network'
  newNetworkNoNameErrorMessage: 'برای ایجاد یک شبکه یک نام مورد نیاز است',

  // Original text: 'Bond mode'
  newNetworkBondMode: 'حالت پیوند',

  // Original text: 'Delete network'
  deleteNetwork: 'حذف شبکه',

  // Original text: 'Are you sure you want to delete this network?'
  deleteNetworkConfirm: 'آیا مطمئن هستید که می خواهید این شبکه را حذف کنید؟',

  // Original text: 'This network is currently in use'
  networkInUse: 'در حال حاضر این شبکه در حال استفاده است',

  // Original text: 'Bonded'
  pillBonded: 'پیوند خورده',

  // Original text: 'Host'
  addHostSelectHost: 'میزبان',

  // Original text: 'No host'
  addHostNoHost: 'بدون میزبان',

  // Original text: 'No host selected to be added'
  addHostNoHostMessage: 'هیچ میزبانی برای اضافه شدن انتخاب نشده است',

  // Original text: 'Xen Orchestra'
  xenOrchestra: 'Xen Orchestra',

  // Original text: 'Xen Orchestra server'
  xenOrchestraServer: 'سرور Xen Orchestra',

  // Original text: 'Xen Orchestra web client'
  xenOrchestraWeb: 'سرویس گیرنده وب Xen Orchestra',

  // Original text: 'No pro support provided!'
  noProSupport: 'هیچ پشتیبانی حرفه ای ارائه نمی شود!',

  // Original text: 'Use in production at your own risks'
  noProductionUse: 'استفاده در محیط تولید با ریسک خودتان',

  // Original text: 'You can download our turnkey appliance at {website}'
  downloadXoaFromWebsite: 'می توانید برنامه های ما که برای استفاده فوری آماده شده است را از {website} دانلود کنید',

  // Original text: 'Bug Tracker'
  bugTracker: 'ردیاب اشکال',

  // Original text: 'Issues? Report it!'
  bugTrackerText: 'مشکلات؟ آنرا گزارش کن!',

  // Original text: 'Community'
  community: 'انجمن',

  // Original text: 'Join our community forum!'
  communityText: 'به اجتماع ما بپیوندید!',

  // Original text: 'Free Trial for Premium Edition!'
  freeTrial: 'نسخه آزمایشی رایگان برای نسخه پرمیوم!',

  // Original text: 'Request your trial now!'
  freeTrialNow: 'اکنون نسخه آزمایشی خود را درخواست کنید!',

  // Original text: 'Any issue?'
  issues: 'مشکلی وجود دارد؟',

  // Original text: 'Problem? Contact us!'
  issuesText: 'مشکل؟ با ما تماس بگیرید!',

  // Original text: 'Documentation'
  documentation: 'مستندات',

  // Original text: 'Read our official doc'
  documentationText: 'سند رسمی ما را مطالعه کنید',

  // Original text: 'Pro support included'
  proSupportIncluded: 'شامل پشتیبانی حرفه ای',

  // Original text: 'Access your XO Account'
  xoAccount: 'به حساب XO خود دسترسی پیدا کنید',

  // Original text: 'Report a problem'
  openTicket: 'گزارش یک مشکل',

  // Original text: 'Problem? Open a ticket!'
  openTicketText: 'مشکل؟ یک تیکت پشتیبانی باز کن!',

  // Original text: 'Upgrade needed'
  upgradeNeeded: 'ارتقاء مورد نیاز است',

  // Original text: 'Upgrade now!'
  upgradeNow: 'اکنون ارتقا دهید!',

  // Original text: 'Or'
  or: 'یا',

  // Original text: 'Try it for free!'
  tryIt: 'به صورت رایگان امتحان کنید!',

  // Original text: 'This feature is available starting from {plan} Edition'
  availableIn: 'این ویژگی از نسخه {plan} در دسترس است',

  // Original text: 'This feature is not available in your version, contact your administrator to know more.'
  notAvailable: 'این ویژگی در نسخه شما موجود نیست، برای اطلاعات بیشتر با مدیر خود تماس بگیرید.',

  // Original text: 'Updates'
  updateTitle: 'به روزرسانی ها',

  // Original text: 'Registration'
  registration: 'ثبت نام',

  // Original text: 'Trial'
  trial: 'آزمایشی',

  // Original text: 'Settings'
  settings: 'تنظیمات',

  // Original text: 'Proxy settings'
  proxySettings: 'تنظیمات پروکسی',

  // Original text: 'Host (myproxy.example.org)'
  proxySettingsHostPlaceHolder: 'میزبان (myproxy.example.org)',

  // Original text: 'Port (eg: 3128)'
  proxySettingsPortPlaceHolder: 'پورت (به عنوان مثال: 3128)',

  // Original text: 'Username'
  proxySettingsUsernamePlaceHolder: 'نام کاربری',

  // Original text: 'Password'
  proxySettingsPasswordPlaceHolder: 'کلمه عبور',

  // Original text: 'Your email account'
  updateRegistrationEmailPlaceHolder: 'حساب ایمیل شما',

  // Original text: 'Your password'
  updateRegistrationPasswordPlaceHolder: 'کلمه عبور شما',

  // Original text: 'Troubleshooting documentation'
  updaterTroubleshootingLink: 'مستندات عیب یابی',

  // Original text: 'Update'
  update: 'به روز رسانی',

  // Original text: 'Refresh'
  refresh: 'تاره کردن',

  // Original text: 'Upgrade'
  upgrade: 'ارتقا دادن',

  // Original text: 'Downgrade'
  downgrade: 'تنزل دادن',

  // Original text: 'No updater available for Community Edition'
  noUpdaterCommunity: 'هیچ به‌روزرسانی‌کننده‌ای برای نسخه عمومی در دسترس نیست',

  // Original text: 'Please consider subscribing and trying it with all the features for free during 30 days on {link}.'
  considerSubscribe:
    'لطفاً مشترک شدن را در نظر داشته باشید و این محصول را با تمام ویژگی های آن به صورت رایگان در مدت 30 روز در {link} امتحان کنید.',

  // Original text: 'Manual update could break your current installation due to dependencies issues, do it with caution'
  noUpdaterWarning:
    'به‌روزرسانی دستی می‌تواند نصب فعلی شما را به دلیل مشکلات وابستگی خراب کند، این کار را با احتیاط انجام دهید',

  // Original text: 'Current version:'
  currentVersion: 'نسخه فعلی:',

  // Original text: 'Register'
  register: 'ثبت نام',

  // Original text: 'Edit registration'
  editRegistration: 'ویرایش ثبت نام',

  // Original text: 'Please, take time to register in order to enjoy your trial.'
  trialRegistration: 'لطفاً برای ثبت نام وقت بگذارید تا از نسخه آزمایشی خود لذت ببرید.',

  // Original text: 'Start trial'
  trialStartButton: 'اجرای نسخه آزمایشی',

  // Original text: 'You can use a trial version until {date, date, medium}. Upgrade your appliance to get it.'
  trialAvailableUntil:
    'می توانید از نسخه آزمایشی تا {date, date, medium} استفاده کنید. برای دریافت آن، دستگاه خود را ارتقا دهید.',

  // Original text: 'Your trial has been ended. Contact us or downgrade to Free version'
  trialConsumed: 'نسخه آزمایشی شما به پایان رسیده است. با ما تماس بگیرید یا به نسخه رایگان برگردید',

  // Original text: 'Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service.'
  trialLocked:
    'به نظر می رسد سرویس xoa-updater شما از کار افتاده است. XOA شما بدون دسترسی به این سرویس نمی تواند به طور کامل اجرا شود.',

  // Original text: 'No update information available'
  noUpdateInfo: 'اطلاعات به روز رسانی در دسترس نیست',

  // Original text: 'Update information may be available'
  waitingUpdateInfo: 'اطلاعات به روز رسانی ممکن است در دسترس باشد',

  // Original text: 'Your XOA is up-to-date'
  upToDate: 'XOA شما به روز است',

  // Original text: 'You need to update your XOA (new version is available)'
  mustUpgrade: 'شما باید XOA خود را به روز کنید (نسخه جدید در دسترس است)',

  // Original text: 'Your XOA is not registered for updates'
  registerNeeded: 'XOA شما برای به‌روزرسانی‌ها ثبت نشده است',

  // Original text: "Can't fetch update information"
  updaterError: 'نمی توان اطلاعات به روز رسانی را دریافت کرد',

  // Original text: 'Upgrade successful'
  promptUpgradeReloadTitle: 'ارتقا با موفقیت انجام شد',

  // Original text: 'Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now?'
  promptUpgradeReloadMessage:
    'XOA شما با موفقیت ارتقا یافته است و مرورگر شما باید برنامه را دوباره بارگیری کند. آیا می خواهید اکنون بارگیری مجدد را انجام دهید؟',

  // Original text: 'Upgrade warning'
  upgradeWarningTitle: 'هشدار ارتقا',

  // Original text: 'You have some backup jobs in progress. If you upgrade now, these jobs will be interrupted! Are you sure you want to continue?'
  upgradeWarningMessage:
    'شما چند کار پشتیبان گیری در حال انجام دارید. اگر همین الان ارتقا دهید، این کارها قطع می شود! آیا مطمئن هستید که میخواهید ادامه دهید؟',

  // Original text: 'Xen Orchestra from the sources'
  disclaimerTitle: 'Xen Orchestra از منابع',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: 'شما از XO از منابع استفاده می کنید! این برای استفاده شخصی/غیرانتفاعی عالی است.',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2:
    'اگر یک شرکت هستید، بهتر است از آن با برنامه های ما که برای استفاده فوری آماده شده است + پشتیبانی حرفه ای که گنجانده شده است استفاده کنید:',

  // Original text: 'This version is not bundled with any support nor updates. Use it with caution for critical tasks.'
  disclaimerText3: 'این نسخه با هیچ پشتیبانی و به روز رسانی همراه نیست. برای کارهای مهم با احتیاط از آن استفاده کنید.',

  // Original text: 'Connect PIF'
  connectPif: 'PIF وصل کردن',

  // Original text: 'Are you sure you want to connect this PIF?'
  connectPifConfirm: 'آیا مطمئن هستید که می خواهید این PIF را وصل کنید؟',

  // Original text: 'Disconnect PIF'
  disconnectPif: 'قطع کردن PIF',

  // Original text: 'Are you sure you want to disconnect this PIF?'
  disconnectPifConfirm: 'آیا مطمئن هستید که می خواهید این PIF را قطع کنید؟',

  // Original text: 'Delete PIF'
  deletePif: 'حذف کردن PIF',

  // Original text: 'Are you sure you want to delete this PIF?'
  deletePifConfirm: 'آیا مطمئن هستید که می خواهید این PIF را حذف کنید؟',

  // Original text: 'Delete PIFs'
  deletePifs: 'حذف کردن PIFها',

  // Original text: 'Are you sure you want to delete {nPifs, number} PIF{nPifs, plural, one {} other {s}}?'
  deletePifsConfirm: 'آیا مطمئن هستید که می‌خواهید {nPifs, number} PIF{nPifs, plural, one {} other {s}} را حذف کنید؟',

  // Original text: 'Connected'
  pifConnected: 'متصل شده است',

  // Original text: 'Disconnected'
  pifDisconnected: 'قطع شده است',

  // Original text: 'Physically connected'
  pifPhysicallyConnected: 'به صورت فیزیکی متصل شده است',

  // Original text: 'Physically disconnected'
  pifPhysicallyDisconnected: 'به صورت فیزیکی قطع شده است',

  // Original text: 'Username'
  username: 'نام کاربری',

  // Original text: 'Password'
  password: 'کلمه عبور',

  // Original text: 'Language'
  language: 'زبان',

  // Original text: 'Old password'
  oldPasswordPlaceholder: 'کلمه عبور قدیمی',

  // Original text: 'New password'
  newPasswordPlaceholder: 'کلمه عبور جدید',

  // Original text: 'Confirm new password'
  confirmPasswordPlaceholder: 'تاییدیه کلمه عبور جدید',

  // Original text: 'Confirmation password incorrect'
  confirmationPasswordError: 'تاییدیه کلمه عبور اشتباه است',

  // Original text: 'Password does not match the confirm password.'
  confirmationPasswordErrorBody: 'کلمه عبور با تاییدیه کلمه عبور مطابقت ندارد',

  // Original text: 'Password changed'
  pwdChangeSuccess: 'کلمه عبور تغییر کرد',

  // Original text: 'Your password has been successfully changed.'
  pwdChangeSuccessBody: 'کلمه عبور شما با موفقیت تغییر کرد.',

  // Original text: 'Incorrect password'
  pwdChangeError: 'کلمه عبور اشتباه است',

  // Original text: 'The old password provided is incorrect. Your password has not been changed.'
  pwdChangeErrorBody: 'کلمه عبور قدیمی ارائه شده نادرست است. کلمه عبور شما تغییر نکرده است.',

  // Original text: 'OK'
  changePasswordOk: 'اوکی',

  // Original text: 'SSH keys'
  sshKeys: 'کلیدهای SSH',

  // Original text: 'New SSH key'
  newSshKey: 'کلید جدید SSH',

  // Original text: 'Delete'
  deleteSshKey: 'حذف کردن',

  // Original text: 'Delete selected SSH keys'
  deleteSshKeys: 'حذف کلیدهای SSH انتخاب شده',

  // Original text: 'No SSH keys'
  noSshKeys: 'کلیدهای SSH وجود ندارند',

  // Original text: 'New SSH key'
  newSshKeyModalTitle: 'کلید جدید SSH',

  // Original text: 'Invalid key'
  sshKeyErrorTitle: 'کلید نامعتبر',

  // Original text: 'An SSH key requires both a title and a key.'
  sshKeyErrorMessage: 'یک کلید SSH هم به یک عنوان و هم به یک کلید نیاز دارد.',

  // Original text: 'Title'
  title: 'عنوان',

  // Original text: 'Key'
  key: 'کلید',

  // Original text: 'Delete SSH key'
  deleteSshKeyConfirm: 'حذف کلید SSH',

  // Original text: 'Are you sure you want to delete the SSH key {title}?'
  deleteSshKeyConfirmMessage: 'آیا مطمئن هستید که می خواهید کلید SSH {title} را حذف کنید؟',

  // Original text: 'Delete SSH key{nKeys, plural, one {} other {s}}'
  deleteSshKeysConfirm: 'حذف کلید SSH{nKeys, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nKeys, number} SSH key{nKeys, plural, one {} other {s}}?'
  deleteSshKeysConfirmMessage:
    'آیا مطمئن هستید که می خواهید {nKeys, number} کلید SSH{nKeys, plural, one {} other {s}} را حذف کنید؟',

  // Original text: 'Others'
  others: 'دیگران',

  // Original text: 'Loading logs…'
  loadingLogs: 'در حال بارگیری گزارش‌ها…',

  // Original text: 'User'
  logUser: 'نام کاربری',

  // Original text: 'Method'
  logMethod: 'روش',

  // Original text: 'Params'
  logParams: 'پارامترها',

  // Original text: 'Message'
  logMessage: 'پیام',

  // Original text: 'Error'
  logError: 'خطا',

  // Original text: 'Logs'
  logTitle: 'گزارش ها',

  // Original text: 'Display details'
  logDisplayDetails: 'نمایش جزئیات',

  // Original text: 'Date'
  logTime: 'تاریخ',

  // Original text: 'No stack trace'
  logNoStackTrace: 'بدون ردیابی پشته',

  // Original text: 'No params'
  logNoParams: 'بدون پارامتر',

  // Original text: 'Delete log'
  logDelete: 'حذف گزارش',

  // Original text: 'Delete logs'
  logsDelete: 'حذف گزارش ها',

  // Original text: 'Delete log{nLogs, plural, one {} other {s}}'
  logDeleteMultiple: 'حذف گزارش{nLogs, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nLogs, number} log{nLogs, plural, one {} other {s}}?'
  logDeleteMultipleMessage:
    'آیا مطمئن هستید که می خواهید {nLogs, number} گزارش{nLogs, plural, one {} other {s}} را حذف کنید؟',

  // Original text: 'Delete all logs'
  logDeleteAll: 'حذف کردن تمام گزارش ها',

  // Original text: 'Delete all logs'
  logDeleteAllTitle: 'حذف کردن تمام گزارش ها',

  // Original text: 'Are you sure you want to delete all the logs?'
  logDeleteAllMessage: 'آیا مطمئن هستید که می خواهید همه گزارش ها را حذف کنید؟',

  // Original text: 'Click to enable'
  logIndicationToEnable: 'برای فعال کردن کلیک کنید',

  // Original text: 'Click to disable'
  logIndicationToDisable: 'برای غیر فعال کردن کلیک کنید',

  // Original text: 'Report a bug'
  reportBug: 'گزارش یک اشکال',

  // Original text: 'Job canceled to protect the VDI chain'
  unhealthyVdiChainError: 'برای محافظت از زنجیره VDI، کار لغو شد',

  // Original text: "Restart VM's backup"
  backupRestartVm: 'نسخه پشتیبان ماشین مجازی را راه اندازی مجدد کنید',

  // Original text: 'Click for more information'
  clickForMoreInformation: 'برای اطلاعات بیشتر کلیک کنید',

  // Original text: 'Name'
  ipPoolName: 'نام',

  // Original text: 'IPs'
  ipPoolIps: 'آدرس های IP',

  // Original text: 'IPs (e.g.: 1.0.0.12-1.0.0.17;1.0.0.23)'
  ipPoolIpsPlaceholder: 'آدرس های IP (به عنوان مثال: 1.0.0.12-1.0.0.17;1.0.0.23)',

  // Original text: 'Networks'
  ipPoolNetworks: 'شبکه ها',

  // Original text: 'No IP pools'
  ipsNoIpPool: 'بدون استخر IP',

  // Original text: 'Create'
  ipsCreate: 'ایجاد',

  // Original text: 'Delete all IP pools'
  ipsDeleteAllTitle: 'حذف تمام استخرهای IP',

  // Original text: 'Are you sure you want to delete all the IP pools?'
  ipsDeleteAllMessage: 'آیا مطمئن هستید که می خواهید تمام استخرهای IP را حذف کنید؟',

  // Original text: 'VIFs'
  ipsVifs: 'VIFها',

  // Original text: 'Not used'
  ipsNotUsed: 'استفاده نشده',

  // Original text: 'unknown VIF'
  ipPoolUnknownVif: 'VIF ناشناس',

  // Original text: 'Name already exists'
  ipPoolNameAlreadyExists: 'نام از قبل وجود دارد',

  // Original text: 'Keyboard shortcuts'
  shortcutModalTitle: 'میانبرهای صفحه کلید',

  // Original text: 'Global'
  shortcut_XoApp: 'سراسری',

  // Original text: 'Go to hosts list'
  shortcut_XoApp_GO_TO_HOSTS: 'رفتن به لیست میزبان ها',

  // Original text: 'Go to pools list'
  shortcut_XoApp_GO_TO_POOLS: 'رفتن به لیست استخرها',

  // Original text: 'Go to VMs list'
  shortcut_XoApp_GO_TO_VMS: 'رفتن به لیست ماشین های مجازی',

  // Original text: 'Go to SRs list'
  shortcut_XoApp_GO_TO_SRS: 'رفتن به لیست مخزن های ذخیره سازی (SR)',

  // Original text: 'Create a new VM'
  shortcut_XoApp_CREATE_VM: 'ایجاد یک ماشین مجازی جدید',

  // Original text: 'Unfocus field'
  shortcut_XoApp_UNFOCUS: 'فیلد عدم تمرکز',

  // Original text: 'Show shortcuts key bindings'
  shortcut_XoApp_HELP: 'نمایش اتصالات کلید میانبرها',

  // Original text: 'Home'
  shortcut_Home: 'خانه',

  // Original text: 'Focus search bar'
  shortcut_Home_SEARCH: 'نوار جستجوی فوکوس',

  // Original text: 'Next item'
  shortcut_Home_NAV_DOWN: 'مورد بعدی',

  // Original text: 'Previous item'
  shortcut_Home_NAV_UP: 'مورد قبلی',

  // Original text: 'Select item'
  shortcut_Home_SELECT: 'انتخاب مورد',

  // Original text: 'Open'
  shortcut_Home_JUMP_INTO: 'باز کردن',

  // Original text: 'Supported tables'
  shortcut_SortedTable: 'جداول پشتیبانی شده',

  // Original text: 'Focus the table search bar'
  shortcut_SortedTable_SEARCH: 'روی نوار جستجوی جدول تمرکز کنید',

  // Original text: 'Next item'
  shortcut_SortedTable_NAV_DOWN: 'مورد بعدی',

  // Original text: 'Previous item'
  shortcut_SortedTable_NAV_UP: 'مورد قبلی',

  // Original text: 'Select item'
  shortcut_SortedTable_SELECT: 'انتخاب مورد',

  // Original text: 'Action'
  shortcut_SortedTable_ROW_ACTION: 'عمل',

  // Original text: 'VM'
  settingsAclsButtonTooltipVM: 'ماشین مجازی',

  // Original text: 'Hosts'
  settingsAclsButtonTooltiphost: 'میزبان ها',

  // Original text: 'Pool'
  settingsAclsButtonTooltippool: 'استخر',

  // Original text: 'SR'
  settingsAclsButtonTooltipSR: 'مخزن ذخیره سازی (SR)',

  // Original text: 'Network'
  settingsAclsButtonTooltipnetwork: 'شبکه',

  // Original text: 'Template'
  settingsCloudConfigTemplate: 'قالب',

  // Original text: 'Delete cloud config{nCloudConfigs, plural, one {} other {s}}'
  confirmDeleteCloudConfigsTitle: 'حذف پیکربندی ابری{nCloudConfigs, plural, one {} other {s}}',

  // Original text: 'Are you sure you want to delete {nCloudConfigs, number} cloud config{nCloudConfigs, plural, one {} other {s}}?'
  confirmDeleteCloudConfigsBody:
    'آیا مطمئن هستید که می‌خواهید {nCloudConfigs, number} پیکربندی ابری{nCloudConfigs, plural, one {} other {s}} را حذف کنید؟',

  // Original text: 'Delete cloud config'
  deleteCloudConfig: 'حذف پیکربندی ابری',

  // Original text: 'Edit cloud config'
  editCloudConfig: 'ویرایش پیکربندی ابری',

  // Original text: 'Delete selected cloud configs'
  deleteSelectedCloudConfigs: 'حذف پیکربندی ابری انتخاب شده',

  // Original text: 'No config file selected'
  noConfigFile: 'هیچ فایل پیکربندی انتخاب نشده است',

  // Original text: 'Try dropping a config file here, or click to select a config file to upload.'
  importTip: 'سعی کنید یک فایل پیکربندی را در اینجا رها کنید یا برای انتخاب یک فایل پیکربندی برای آپلود کلیک کنید.',

  // Original text: 'Config'
  config: 'پیکربندی',

  // Original text: 'Import'
  importConfig: 'وارد کردن',

  // Original text: 'Config file successfully imported'
  importConfigSuccess: 'فایل پیکربندی با موفقیت وارد شد',

  // Original text: 'Error while importing config file'
  importConfigError: 'خطا هنگام وارد کردن فایل پیکربندی',

  // Original text: 'Export'
  exportConfig: 'صادر کردن',

  // Original text: 'Download current config'
  downloadConfig: 'پیکربندی فعلی را دانلود کنید',

  // Original text: 'No config import available for Community Edition'
  noConfigImportCommunity: 'هیچ پیکربندی وارد شده ای برای نسخه عمومی موجود نیست',

  // Original text: 'Reconnect all hosts'
  srReconnectAllModalTitle: 'وصل دوباره همه میزبان ها',

  // Original text: 'This will reconnect this SR to all its hosts.'
  srReconnectAllModalMessage: 'این کار این مخزن ذخیره سازی (SR) را دوباره به همه میزبان هایش متصل می کند.',

  // Original text: 'This will reconnect each selected SR to its host (local SR) or to every hosts of its pool (shared SR).'
  srsReconnectAllModalMessage:
    'این کار هر مخزن ذخیره سازی (SR) انتخاب شده را به میزبان خود (مخزن ذخیره سازی محلی) یا به هر میزبان از استخر خود (مخزن ذخیره سازی مشترک) دوباره متصل می کند.',

  // Original text: 'Disconnect all hosts'
  srDisconnectAllModalTitle: 'قطع کردن تمام میزبان ها',

  // Original text: 'This will disconnect this SR from all its hosts.'
  srDisconnectAllModalMessage: 'این کار مخزن ذخیره سازی (SR) را از همه میزبان هایش جدا می کند.',

  // Original text: 'This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR).'
  srsDisconnectAllModalMessage:
    'این کار هر مخزن ذخیره سازی (SR) انتخاب شده را از میزبان خود (مخزن ذخیره سازی محلی) یا از هر میزبان از استخر خود (مخزن ذخیره سازی مشترک) جدا می کند.',

  // Original text: 'Forget SR'
  srForgetModalTitle: 'فراموش کردن مخزن ذخیره سازی (SR)',

  // Original text: 'Forget selected SRs'
  srsForgetModalTitle: 'فراموش کردن مخزن های ذخیره سازی (SR) انتخاب شده',

  // Original text: "Are you sure you want to forget this SR? VDIs on this storage won't be removed."
  srForgetModalMessage:
    'آیا مطمئن هستید که می خواهید این مخزن ذخیره سازی (SR) را فراموش کنید؟ VDIها روی این ذخیره ساز حذف نمی شوند.',

  // Original text: "Are you sure you want to forget all the selected SRs? VDIs on these storages won't be removed."
  srsForgetModalMessage:
    'آیا مطمئن هستید که می خواهید همه مخزن های ذخیره سازی (SR) انتخاب شده را فراموش کنید؟ VDIهای موجود در این ذخیره سازها حذف نمی شوند.',

  // Original text: 'Disconnected'
  srAllDisconnected: 'قطع شده است',

  // Original text: 'Partially connected'
  srSomeConnected: 'تا حدی متصل است',

  // Original text: 'Connected'
  srAllConnected: 'متصل شده است',

  // Original text: 'XOSAN'
  xosanTitle: 'XOSAN',

  // Original text: 'Xen Orchestra SAN SR'
  xosanSrTitle: 'مخزن ذخیره سازی (SR) از نوع SAN برای Xen Orchestra',

  // Original text: 'Select local SRs (lvm)'
  xosanAvailableSrsTitle: 'انتخاب مخزن های ذخیره سازی (SR) محلی (lvm)',

  // Original text: 'Suggestions'
  xosanSuggestions: 'پیشنهادها',

  // Original text: 'Warning: using disperse layout is not recommended right now. Please read {link}.'
  xosanDisperseWarning: 'هشدار: در حال حاضر استفاده از طرح پراکنده توصیه نمی شود. لطفاً {link} را بخوانید.',

  // Original text: 'Name'
  xosanName: 'نام',

  // Original text: 'Host'
  xosanHost: 'میزبان',

  // Original text: 'Connected Hosts'
  xosanHosts: 'میزبان های متصل',

  // Original text: 'Pool'
  xosanPool: 'استخر',

  // Original text: 'Volume ID'
  xosanVolumeId: 'شناسه حجم (Volume ID)',

  // Original text: 'Size'
  xosanSize: 'اندازه',

  // Original text: 'Used space'
  xosanUsedSpace: 'فضای استفاده شده',

  // Original text: 'License'
  xosanLicense: 'مجوز',

  // Original text: 'This XOSAN has more than 1 license!'
  xosanMultipleLicenses: 'این XOSAN بیش از 1 لایسنس دارد!',

  // Original text: 'XOSAN pack needs to be installed and up to date on each host of the pool.'
  xosanNeedPack: 'بسته XOSAN باید بر روی هر میزبان از استخر نصب و به روز رسانی شود.',

  // Original text: 'Install it now!'
  xosanInstallIt: 'اکنون آن را نصب کنید!',

  // Original text: 'Some hosts need their toolstack to be restarted before you can create an XOSAN'
  xosanNeedRestart:
    'برخی از هاست ها قبل از اینکه بتوانید یک XOSAN ایجاد کنید، نیاز به راه اندازی مجدد toolstack خود دارند',

  // Original text: 'Restart toolstacks'
  xosanRestartAgents: 'راه اندازی مجدد toolstackها',

  // Original text: 'Pool master is not running'
  xosanMasterOffline: 'استخر اصلی در حال اجرا نیست',

  // Original text: 'Install XOSAN pack on {pool}'
  xosanInstallPackTitle: 'نصب بسته XOSAN بر روی {pool}',

  // Original text: 'Select at least 2 SRs'
  xosanSelect2Srs: 'حداقل دو مخزن ذخیره سازی (SR) را انتخاب کنید',

  // Original text: 'Layout'
  xosanLayout: 'چیدمان',

  // Original text: 'Redundancy'
  xosanRedundancy: 'افزونگی',

  // Original text: 'Capacity'
  xosanCapacity: 'ظرفیت',

  // Original text: 'Available space'
  xosanAvailableSpace: 'فضای موجود',

  // Original text: '* Can fail without data loss'
  xosanDiskLossLegend: '* می تواند بدون از دست دادن داده ها شکست بخورد',

  // Original text: 'Create'
  xosanCreate: 'ایجاد',

  // Original text: 'Add'
  xosanAdd: 'اضافه کردن',

  // Original text: 'Installing XOSAN. Please wait…'
  xosanInstalling: 'نصب XOSAN. لطفا صبر کنید…',

  // Original text: 'No XOSAN available for Community Edition'
  xosanCommunity: 'XOSAN برای نسخه عمومی موجود نیست',

  // Original text: 'New'
  xosanNew: 'جدید',

  // Original text: 'Advanced'
  xosanAdvanced: 'پیشرفته',

  // Original text: 'Remove subvolumes'
  xosanRemoveSubvolumes: 'حذف حجم های فرعی (subvolume)',

  // Original text: 'Add subvolume…'
  xosanAddSubvolume: 'افزودن حجم فرعی…',

  // Original text: "This version of XOSAN SR is from the first beta phase. You can keep using it, but to modify it you'll have to save your disks and re-create it."
  xosanWarning:
    'این نسخه از مخزن ذخیره سازی (SR) XOSAN از اولین فاز بتا است. می توانید به استفاده از آن ادامه دهید، اما برای تغییر آن باید دیسک های خود را ذخیره کرده و دوباره آن را ایجاد کنید.',

  // Original text: 'VLAN'
  xosanVlan: 'شبکه مجازی محلی',

  // Original text: 'No XOSAN found'
  xosanNoSrs: 'XOSAN پیدا نشد',

  // Original text: 'Some SRs are detached from the XOSAN'
  xosanPbdsDetached: 'برخی از مخزن های ذخیره سازی (SR) از XOSAN جدا شده اند',

  // Original text: 'Something is wrong with: {badStatuses}'
  xosanBadStatus: 'مشکلی در این مورد وجود دارد: {badStatuses}',

  // Original text: 'Running'
  xosanRunning: 'در حال اجرا',

  // Original text: 'Update packs'
  xosanUpdatePacks: 'به روز رسانی بسته ها',

  // Original text: 'Checking for updates'
  xosanPackUpdateChecking: 'در حال بررسی برای روز رسانی',

  // Original text: 'Error while checking XOSAN packs. Please make sure that the Cloud plugin is installed and loaded and that the updater is reachable.'
  xosanPackUpdateError:
    'خطا هنگام بررسی بسته های XOSAN. لطفاً مطمئن شوید که افزونه Cloud نصب و بارگذاری شده است و به‌روزرسانی‌کننده قابل دسترسی است.',

  // Original text: 'XOSAN resources are unavailable'
  xosanPackUpdateUnavailable: 'منابع XOSAN در دسترس نیستند',

  // Original text: 'Not registered for XOSAN resources'
  xosanPackUpdateUnregistered: 'برای منابع XOSAN ثبت نشده است',

  // Original text: "✓ This pool's XOSAN packs are up to date!"
  xosanPackUpdateUpToDate: '✓ بسته های XOSAN این استخر به روز هستند!',

  // Original text: 'Update pool with latest pack v{version}'
  xosanPackUpdateVersion: 'به روز رسانی استخر با آخرین پک v{version}',

  // Original text: 'Delete XOSAN'
  xosanDelete: 'حذف XOSAN',

  // Original text: 'Fix'
  xosanFixIssue: 'تعمیر',

  // Original text: 'Creating XOSAN on {pool}'
  xosanCreatingOn: 'ایجاد XOSAN در {pool}',

  // Original text: 'Configuring network…'
  xosanState_configuringNetwork: 'در حال پیکربندی شبکه…',

  // Original text: 'Importing VM…'
  xosanState_importingVm: 'در حال وارد کردن ماشین مجازی…',

  // Original text: 'Copying VMs…'
  xosanState_copyingVms: 'در حال کپی کردن ماشین های مجازی…',

  // Original text: 'Configuring VMs…'
  xosanState_configuringVms: 'در حال پیکربندی ماشین های مجازی',

  // Original text: 'Configuring gluster…'
  xosanState_configuringGluster: 'در حال پیکربندی گلاستر…',

  // Original text: 'Creating SR…'
  xosanState_creatingSr: 'در حال ایجاد کردن مخزن ذخیره سازی (SR)…',

  // Original text: 'Scanning SR…'
  xosanState_scanningSr: 'در حال اسکن کردن مخزن ذخیره سازی (SR)…',

  // Original text: 'Install cloud plugin first'
  xosanInstallCloudPlugin: 'ابتدا افزونه ابری را نصب کنید',

  // Original text: 'Load cloud plugin first'
  xosanLoadCloudPlugin: 'ابتدا افزونه ابری را بارگیری کنید',

  // Original text: 'Register your appliance first'
  xosanRegister: 'ابتدا دستگاه خود را ثبت کنید',

  // Original text: 'Loading…'
  xosanLoading: 'بارگذاری…',

  // Original text: 'XOSAN is not available at the moment'
  xosanNotAvailable: 'در حال حاضر XOSAN در دسترس نیست',

  // Original text: 'No compatible XOSAN pack found for your XenServer versions.'
  xosanNoPackFound: 'هیچ بسته XOSAN سازگاری برای نسخه‌های XenServer شما یافت نشد.',

  // Original text: 'Some XOSAN Virtual Machines are not running'
  xosanVmsNotRunning: 'برخی از ماشین های مجازی XOSAN در حال اجرا نیستند',

  // Original text: 'Some XOSAN Virtual Machines could not be found'
  xosanVmsNotFound: 'برخی از ماشین های مجازی XOSAN یافت نشد',

  // Original text: 'Files needing healing'
  xosanFilesNeedingHealing: 'فایل هایی که نیاز به تعمیر کردن دارند',

  // Original text: 'Some XOSAN Virtual Machines have files needing healing'
  xosanFilesNeedHealing: 'برخی از ماشین‌های مجازی XOSAN دارای فایل‌هایی هستند که نیاز به تعمیر کردن دارند',

  // Original text: 'Host {hostName} is not in XOSAN network'
  xosanHostNotInNetwork: 'میزبان {hostName} در شبکه XOSAN نیست',

  // Original text: 'VM controller'
  xosanVm: 'کنترلر ماشین مجازی',

  // Original text: 'SR'
  xosanUnderlyingStorage: 'مخزن ذخیره سازی (SR)',

  // Original text: 'Replace…'
  xosanReplace: 'جایگزین کردن…',

  // Original text: 'On same VM'
  xosanOnSameVm: 'در همان ماشین مجازی',

  // Original text: 'Brick name'
  xosanBrickName: 'نام برک',

  // Original text: 'Brick UUID'
  xosanBrickUuid: 'UUID برک',

  // Original text: 'Brick size'
  xosanBrickSize: 'اندازه برک',

  // Original text: 'Memory size'
  xosanMemorySize: 'اندازه حافظه',

  // Original text: 'Status'
  xosanStatus: 'وضعیت',

  // Original text: 'Arbiter'
  xosanArbiter: 'میانجی',

  // Original text: 'Used Inodes'
  xosanUsedInodes: 'اینودهای (Inode) استفاده شده',

  // Original text: 'Block size'
  xosanBlockSize: 'اندازه بلوک',

  // Original text: 'Device'
  xosanDevice: 'دستگاه',

  // Original text: 'FS name'
  xosanFsName: 'نام سیستم فایل',

  // Original text: 'Mount options'
  xosanMountOptions: 'گزینه های نصب',

  // Original text: 'Path'
  xosanPath: 'مسیر',

  // Original text: 'Job'
  xosanJob: 'کار',

  // Original text: 'PID'
  xosanPid: 'شماره شناسایی فرآیند (PID)',

  // Original text: 'Port'
  xosanPort: 'پورت',

  // Original text: 'Missing values'
  xosanReplaceBrickErrorTitle: 'مقادیر از دست رفته',

  // Original text: 'You need to select a SR and a size'
  xosanReplaceBrickErrorMessage: 'شما باید یک مخزن ذخیره سازی (SR) و یک اندازه را انتخاب کنید',

  // Original text: 'Bad values'
  xosanAddSubvolumeErrorTitle: 'مقادیر بد',

  // Original text: 'You need to select {nSrs, number} and a size'
  xosanAddSubvolumeErrorMessage: 'شما باید {nSrs, number} و یک اندازه را انتخاب کنید',

  // Original text: 'Select {nSrs, number} SRs'
  xosanSelectNSrs: 'مخزن های ذخیره سازی (SR) {nSrs, number} را انتخاب کنید',

  // Original text: 'Run'
  xosanRun: 'اجرا',

  // Original text: 'Remove'
  xosanRemove: 'حذف کردن',

  // Original text: 'Volume'
  xosanVolume: 'حجم',

  // Original text: 'Volume options'
  xosanVolumeOptions: 'گزینه های حجم',

  // Original text: 'Could not find VM'
  xosanCouldNotFindVm: 'ماشین مجازی پیدا نشد',

  // Original text: 'Using {usage}'
  xosanUnderlyingStorageUsage: 'استفاده از {usage}',

  // Original text: 'Custom IP network (/24)'
  xosanCustomIpNetwork: 'شبکه IP سفارشی (/24)',

  // Original text: 'Will configure the host xosan network device with a static IP address and plug it in.'
  xosanIssueHostNotInNetwork: 'دستگاه شبکه میزبان xosan رابا یک آدرس IP ثابت پیکربندی و آن را وصل خواهد کرد.',

  // Original text: 'Licenses'
  licensesTitle: 'لایسنس ها',

  // Original text: 'You are not registered and therefore will not be able to create or manage your XOSAN SRs. {link}'
  xosanUnregisteredDisclaimer:
    'شما ثبت نام نکرده اید و بنابراین نمی توانید مخزن های ذخیره سازی (SR) XOSAN خود را ایجاد یا مدیریت کنید. {link}',

  // Original text: 'In order to create a XOSAN SR, you need to use the Xen Orchestra Appliance and buy a XOSAN license on {link}.'
  xosanSourcesDisclaimer:
    'برای ایجاد یک مخزن ذخیره سازی (SR) XOSAN باید از دستگاه Xen Orchestra استفاده کنید و یک مجوز XOSAN در {link} خریداری کنید.',

  // Original text: 'Register now!'
  registerNow: 'اکنون ثبت نام کنید!',

  // Original text: 'You need to register your appliance to manage your licenses.'
  licensesUnregisteredDisclaimer: 'برای مدیریت لایسنس های خود باید دستگاه خود را ثبت کنید.',

  // Original text: 'Product'
  licenseProduct: 'محصول',

  // Original text: 'Attached to'
  licenseBoundObject: 'پیوست به',

  // Original text: 'Purchaser'
  licensePurchaser: 'خریدار',

  // Original text: 'Expires'
  licenseExpires: 'انقضا',

  // Original text: 'You'
  licensePurchaserYou: 'شما',

  // Original text: 'Support'
  productSupport: 'پشتیبانی',

  // Original text: 'No XOSAN attached'
  licenseNotBoundXosan: 'XOSAN متصل نشده است',

  // Original text: 'License attached to an unknown XOSAN'
  licenseBoundUnknownXosan: 'لایسنس به یک XOSAN ناشناخته متصل شده است',

  // Original text: 'Manage the licenses'
  licensesManage: 'مدیریت لایسنس ها',

  // Original text: 'New license'
  newLicense: 'لایسنس جدید',

  // Original text: 'Refresh'
  refreshLicenses: 'تازه کردن',

  // Original text: 'Limited size because XOSAN is in trial'
  xosanLicenseRestricted: 'اندازه محدود زیرا XOSAN در حال آزمایشی است',

  // Original text: 'You need a license on this SR to manage the XOSAN.'
  xosanAdminNoLicenseDisclaimer: 'برای مدیریت XOSAN به یک لایسنس در این مخزن ذخیره سازی (SR) نیاز دارید.',

  // Original text: 'Your XOSAN license has expired. You can still use the SR but cannot administrate it anymore.'
  xosanAdminExpiredLicenseDisclaimer:
    'لایسنس XOSAN شما منقضی شده است. شما همچنان می توانید از مخزن ذخیره سازی (SR) استفاده کنید اما دیگر نمی توانید آن را مدیریت کنید.',

  // Original text: 'Could not check the license on this XOSAN SR'
  xosanCheckLicenseError: 'نمی‌توان لایسنس را بر روی این مخزن ذخیره سازی (SR) XOSAN بررسی کرد',

  // Original text: 'Could not fetch licenses'
  xosanGetLicensesError: 'لایسنس ها دریافت نشدند',

  // Original text: 'License has expired.'
  xosanLicenseHasExpired: 'لایسنس منقضی شده است.',

  // Original text: 'License expires on {date}.'
  xosanLicenseExpiresDate: 'لایسنس در {date} منقضی می شود.',

  // Original text: 'Update the license now!'
  xosanUpdateLicenseMessage: 'اکنون لایسنس را به روز رسانی کنید!',

  // Original text: 'Unknown XOSAN SR.'
  xosanUnknownSr: 'مخزن ذخیره سازی (SR) ناشناس XOSAN.',

  // Original text: 'Contact us!'
  contactUs: 'با ما تماس بگیرید!',

  // Original text: 'No license.'
  xosanNoLicense: 'بدون لایسنس.',

  // Original text: 'Unlock now!'
  xosanUnlockNow: 'اکنون قفل را باز کنید!',

  // Original text: 'Select a license'
  selectLicense: 'انتخاب یک لایسنس',

  // Original text: 'Bind license'
  bindLicense: 'بستن لایسنس',

  // Original text: 'expires on {date}'
  expiresOn: 'در {date} منقضی می شود',

  // Original text: 'Install XOA plugin first'
  xosanInstallXoaPlugin: 'ابتدا افزونه XOA را نصب کنید',

  // Original text: 'Load XOA plugin first'
  xosanLoadXoaPlugin: 'ابتدا افزونه XOA را بارگیری کنید',

  // Original text: '{seconds, plural, one {# second} other {# seconds}}'
  secondsFormat: '{seconds, plural, one {# second} other {# seconds}}',

  // Original text: '{days, plural, =0 {} one {# day } other {# days }}{hours, plural, =0 {} one {# hour } other {# hours }}{minutes, plural, =0 {} one {# minute } other {# minutes }}{seconds, plural, =0 {} one {# second} other {# seconds}}'
  durationFormat:
    '{days, plural, =0 {} one {# day } other {# days }}{hours, plural, =0 {} one {# hour } other {# hours }}{minutes, plural, =0 {} one {# minute } other {# minutes }}{seconds, plural, =0 {} one {# second} other {# seconds}}',
}
