// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/zh-cn'

import reactIntlData from 'react-intl/locale-data/zh'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: "Long click to edit"
  editableLongClickPlaceholder: '长按编辑',

  // Original text: "Click to edit"
  editableClickPlaceholder: '点击编辑',

  // Original text: "OK"
  alertOk: '确认',

  // Original text: "OK"
  confirmOk: '确认',

  // Original text: "Cancel"
  confirmCancel: '取消',

  // Original text: "On error"
  onError: '出现错误',

  // Original text: "Successful"
  successful: '成功',

  // Original text: "Home"
  homePage: '主页',

  // Original text: "Dashboard"
  dashboardPage: '仪表盘',

  // Original text: "Overview"
  overviewDashboardPage: '概览',

  // Original text: "Visualizations"
  overviewVisualizationDashboardPage: '虚拟化',

  // Original text: "Statistics"
  overviewStatsDashboardPage: '状态统计',

  // Original text: "Health"
  overviewHealthDashboardPage: '健康状态',

  // Original text: "Self service"
  selfServicePage: '自助服务',

  // Original text: "Dashboard"
  selfServiceDashboardPage: '仪表盘',

  // Original text: "Administration"
  selfServiceAdminPage: '管理',

  // Original text: "Backup"
  backupPage: '备份',

  // Original text: "Jobs"
  jobsPage: '任务',

  // Original text: "Updates"
  updatePage: '更新',

  // Original text: "Settings"
  settingsPage: '设置',

  // Original text: "Servers"
  settingsServersPage: '服务器',

  // Original text: "Users"
  settingsUsersPage: '用户',

  // Original text: "Groups"
  settingsGroupsPage: '组',

  // Original text: "ACLs"
  settingsAclsPage: '访问控制',

  // Original text: "Plugins"
  settingsPluginsPage: '插件',

  // Original text: "About"
  aboutPage: '关于',

  // Original text: "New"
  newMenu: '新建',

  // Original text: "Tasks"
  taskMenu: '任务',

  // Original text: "Tasks"
  taskPage: '任务',

  // Original text: "VM"
  newVmPage: '虚拟机',

  // Original text: "Storage"
  newSrPage: '存储',

  // Original text: "Server"
  newServerPage: '服务器',

  // Original text: "Import"
  newImport: '导入',

  // Original text: "Overview"
  backupOverviewPage: '概览',

  // Original text: "New"
  backupNewPage: '新建',

  // Original text: "Remotes"
  backupRemotesPage: '远程',

  // Original text: "Restore"
  backupRestorePage: '恢复',

  // Original text: "Schedule"
  schedule: '计划',

  // Original text: "New VM backup"
  newVmBackup: '新建虚拟机备份',

  // Original text: "Edit VM backup"
  editVmBackup: '编辑虚拟机备份',

  // Original text: "Backup"
  backup: '备份',

  // Original text: "Rolling Snapshot"
  rollingSnapshot: '滚动快照',

  // Original text: "Delta Backup"
  deltaBackup: '差异备份',

  // Original text: "Disaster Recovery"
  disasterRecovery: '灾难恢复',

  // Original text: "Continuous Replication"
  continuousReplication: '持续复制',

  // Original text: "Overview"
  jobsOverviewPage: '概览',

  // Original text: "New"
  jobsNewPage: '新建',

  // Original text: "Scheduling"
  jobsSchedulingPage: '计划',

  // Original text: "Custom Job"
  customJob: '自定义任务',

  // Original text: "User"
  userPage: '用户',

  // Original text: "Sign out"
  signOut: '注销',

  // Original text: "Fetching data…"
  homeFetchingData: '获取数据',

  // Original text: "Welcome on Xen Orchestra!"
  homeWelcome: '欢迎使用Xen Orchestra',

  // Original text: "Add your XCP-ng hosts or pools"
  homeWelcomeText: '添加您的XenServer主机或资源池',

  // Original text: "Want some help?"
  homeHelp: '需要帮助？',

  // Original text: "Add server"
  homeAddServer: '添加服务器',

  // Original text: "Online Doc"
  homeOnlineDoc: '在线文档',

  // Original text: "Pro Support"
  homeProSupport: '专业支持',

  // Original text: "There are no VMs!"
  homeNoVms: '没有可用的虚拟机',

  // Original text: "Or…"
  homeNoVmsOr: '或',

  // Original text: "Import VM"
  homeImportVm: '导入虚拟机',

  // Original text: "Import an existing VM in xva format"
  homeImportVmMessage: '导入一个XVA格式的虚拟机',

  // Original text: "Restore a backup"
  homeRestoreBackup: '恢复到备份',

  // Original text: "Restore a backup from a remote store"
  homeRestoreBackupMessage: '恢复到远程存储上的备份',

  // Original text: "This will create a new VM"
  homeNewVmMessage: '将创建一个新的虚拟机',

  // Original text: "Filters"
  homeFilters: '过滤器',

  // Original text: "Pool"
  homeTypePool: '资源池',

  // Original text: "Host"
  homeTypeHost: '主机',

  // Original text: "VM"
  homeTypeVm: '虚拟机',

  // Original text: "SR"
  homeTypeSr: '数据存储',

  // Original text: "VDI"
  homeTypeVdi: '虚拟硬盘',

  // Original text: "Sort"
  homeSort: '排序',

  // Original text: "Pools"
  homeAllPools: '资源池',

  // Original text: "Hosts"
  homeAllHosts: '主机',

  // Original text: "Tags"
  homeAllTags: '标签',

  // Original text: "New VM"
  homeNewVm: '新建虚拟机',

  // Original text: "Running hosts"
  homeFilterRunningHosts: '正在运行的主机',

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: '不可用的主机',

  // Original text: "Running VMs"
  homeFilterRunningVms: '正在运行的虚拟机',

  // Original text: "Non running VMs"
  homeFilterNonRunningVms: '未运行的虚拟机',

  // Original text: "Pending VMs"
  homeFilterPendingVms: '正在创建的虚拟机',

  // Original text: "HVM guests"
  homeFilterHvmGuests: 'HVM客户机',

  // Original text: "Tags"
  homeFilterTags: '标签',

  // Original text: "Sort by"
  homeSortBy: '排序方式',

  // Original text: "Name"
  homeSortByName: '名称',

  // Original text: "Power state"
  homeSortByPowerstate: '电源状态',

  // Original text: "RAM"
  homeSortByRAM: '内存',

  // Original text: "vCPUs"
  homeSortByvCPUs: '虚拟机CPU',

  // Original text: "CPUs"
  homeSortByCpus: 'CPU',

  // Original text: "{displayed, number}x {icon} (on {total, number})"
  homeDisplayedItems: undefined,

  // Original text: "{selected, number}x {icon} selected (on {total, number})"
  homeSelectedItems: undefined,

  // Original text: "More"
  homeMore: '更多',

  // Original text: "Migrate to…"
  homeMigrateTo: '迁移至…',

  // Original text: "Missing patches"
  homeMissingPatches: '缺少补丁',

  // Original text: "High Availability"
  highAvailability: '高可用',

  // Original text: "Add"
  add: '添加',

  // Original text: "Remove"
  remove: '删除',

  // Original text: "Preview"
  preview: '预览',

  // Original text: "Item"
  item: '项',

  // Original text: "No selected value"
  noSelectedValue: '没有选择的值',

  // Original text: "Choose user(s) and/or group(s)"
  selectSubjects: '选择用户和/或用户组',

  // Original text: "Select Object(s)…"
  selectObjects: '选择对象',

  // Original text: "Choose a role"
  selectRole: '选择一个角色',

  // Original text: "Select Host(s)…"
  selectHosts: '选择主机',

  // Original text: "Select object(s)…"
  selectHostsVms: '选择虚拟机',

  // Original text: "Select Network(s)…"
  selectNetworks: '选择网络',

  // Original text: "Select PIF(s)…"
  selectPifs: '选择网卡',

  // Original text: "Select Pool(s)…"
  selectPools: '选择资源池',

  // Original text: "Select Remote(s)…"
  selectRemotes: '选择远程',

  // Original text: "Select resource set(s)…"
  selectResourceSets: '选择资源集',

  // Original text: "Select template(s)…"
  selectResourceSetsVmTemplate: '选择模板',

  // Original text: "Select SR(s)…"
  selectResourceSetsSr: '选择数据存储',

  // Original text: "Select network(s)…"
  selectResourceSetsNetwork: '选择网络',

  // Original text: "Select disk(s)…"
  selectResourceSetsVdi: '选择硬盘',

  // Original text: "Select SR(s)…"
  selectSrs: '选择数据存储',

  // Original text: "Select VM(s)…"
  selectVms: '选择虚拟机',

  // Original text: "Select VM template(s)…"
  selectVmTemplates: '选择虚拟机模板',

  // Original text: "Select tag(s)…"
  selectTags: '选择标签',

  // Original text: "Select disk(s)…"
  selectVdis: '选择硬盘',

  // Original text: "Fill required informations."
  fillRequiredInformations: '填写需要的信息',

  // Original text: "Fill informations (optional)"
  fillOptionalInformations: '填写信息',

  // Original text: "Reset"
  selectTableReset: '重置',

  // Original text: "Month"
  schedulingMonth: '月',

  // Original text: "Every month"
  schedulingEveryMonth: '每月',

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: '每个选定月份',

  // Original text: "Day of the month"
  schedulingMonthDay: '本月的一天',

  // Original text: "Every day"
  schedulingEveryMonthDay: '每天',

  // Original text: "Each selected day"
  schedulingEachSelectedMonthDay: '每个选定天',

  // Original text: "Day of the week"
  schedulingWeekDay: '本周的一天',

  // Original text: "Every day"
  schedulingEveryWeekDay: '每天',

  // Original text: "Each selected day"
  schedulingEachSelectedWeekDay: '每个选定天',

  // Original text: "Hour"
  schedulingHour: '小时',

  // Original text: "Every hour"
  schedulingEveryHour: '每小时',

  // Original text: "Every N hour"
  schedulingEveryNHour: '每N小时',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: '每个选定小时',

  // Original text: "Minute"
  schedulingMinute: '分钟',

  // Original text: "Every minute"
  schedulingEveryMinute: '每分钟',

  // Original text: "Every N minute"
  schedulingEveryNMinute: '每N分钟',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: '每个选定分钟',

  // Original text: "Reset"
  schedulingReset: '重置',

  // Original text: "Unknown"
  unknownSchedule: '未知',

  // Original text: "Cannot edit backup"
  backupEditNotFoundTitle: '不能编辑备份',

  // Original text: "Missing required info for edition"
  backupEditNotFoundMessage: '缺少版本所需要的信息',

  // Original text: "Job"
  job: '任务',

  // Original text: "Job ID"
  jobId: '任务ID',

  // Original text: "Name"
  jobName: '名称',

  // Original text: "Start"
  jobStart: '开始',

  // Original text: "End"
  jobEnd: '结束',

  // Original text: "Duration"
  jobDuration: '周期',

  // Original text: "Status"
  jobStatus: '状态',

  // Original text: "Action"
  jobAction: '行为',

  // Original text: "Tag"
  jobTag: '标签',

  // Original text: "Scheduling"
  jobScheduling: '计划',

  // Original text: "State"
  jobState: '状态',

  // Original text: "Run job"
  runJob: '运行任务',

  // Original text: "One shot running started. See overview for logs."
  runJobVerbose: '开始一次运行，可查看概要日志',

  // Original text: "Started"
  jobStarted: '已经开始',

  // Original text: "Finished"
  jobFinished: '已完成',

  // Original text: "Save"
  saveBackupJob: '保存',

  // Original text: "Remove backup job"
  deleteBackupSchedule: '删除备份任务',

  // Original text: "Are you sure you want to delete this backup job?"
  deleteBackupScheduleQuestion: '你确认你要删除这个备份任务吗？',

  // Original text: "Enable immediately after creation"
  scheduleEnableAfterCreation: '创建后立即启用',

  // Original text: "You are editing Schedule {name} ({id}). Saving will override previous schedule state."
  scheduleEditMessage: '你正在编辑计划{name} ({id}).保存将覆盖前一个计划状态.',

  // Original text: "You are editing job {name} ({id}). Saving will override previous job state."
  jobEditMessage: '你正在编辑任务{name} ({id}).保存将覆盖前一个任务状态',

  // Original text: "No scheduled jobs."
  noScheduledJobs: '没有计划任务',

  // Original text: "No jobs found."
  noJobs: '未找到任务',

  // Original text: "No schedules found"
  noSchedules: '未找到计划',

  // Original text: "Select a xo-server API command"
  jobActionPlaceHolder: '选择一个xo-server API 命令',

  // Original text: "Select your backup type:"
  newBackupSelection: '选择你的备份类型',

  // Original text: "Remote stores for backup"
  remoteList: '远程备份存储',

  // Original text: "New File System Remote"
  newRemote: '新建远程文件系统',

  // Original text: "Local"
  remoteTypeLocal: '本地',

  // Original text: "NFS"
  remoteTypeNfs: 'NFS',

  // Original text: "SMB"
  remoteTypeSmb: 'SMB',

  // Original text: "Type"
  remoteType: '类型',

  // Original text: "Test your remote"
  remoteTestTip: '测试你的远程配置',

  // Original text: "Test Remote"
  testRemote: '测试远程配置',

  // Original text: "Test failed for {name}"
  remoteTestFailure: '失败的测试项 {name}',

  // Original text: "Test passed for {name}"
  remoteTestSuccess: '通过的测试项{name}',

  // Original text: "Error"
  remoteTestError: '错误',

  // Original text: "Test Step"
  remoteTestStep: '测试步骤',

  // Original text: "Test file"
  remoteTestFile: '测试文件',

  // Original text: "The remote appears to work correctly"
  remoteTestSuccessMessage: '远程配置运行正常',

  // Original text: "Create a new SR"
  newSrTitle: '创建一个新的数据存储',

  // Original text: "General"
  newSrGeneral: '常规',

  // Original text: "Select Strorage Type:"
  newSrTypeSelection: '选择存储类型',

  // Original text: "Settings"
  newSrSettings: '设置',

  // Original text: "Storage Usage"
  newSrUsage: '存储利用率',

  // Original text: "Summary"
  newSrSummary: '综述',

  // Original text: "Host"
  newSrHost: '主机',

  // Original text: "Type"
  newSrType: '类型',

  // Original text: "Name"
  newSrName: '名称',

  // Original text: "Description"
  newSrDescription: '描述',

  // Original text: "Server"
  newSrServer: '服务器',

  // Original text: "Path"
  newSrPath: '路径',

  // Original text: "IQN"
  newSrIqn: 'IQN',

  // Original text: "LUN"
  newSrLun: 'LUN',

  // Original text: "with auth."
  newSrAuth: '启用认证',

  // Original text: "User Name"
  newSrUsername: '用户名',

  // Original text: "Password"
  newSrPassword: '密码',

  // Original text: "Device"
  newSrDevice: '设备',

  // Original text: "in use"
  newSrInUse: '使用中',

  // Original text: "Size"
  newSrSize: '大小',

  // Original text: "Create"
  newSrCreate: '创建',

  // Original text: "Users/Groups"
  subjectName: '用户/组',

  // Original text: "Object"
  objectName: '对象',

  // Original text: "Role"
  roleName: '角色',

  // Original text: "New Group Name"
  newGroupName: '新建组名',

  // Original text: "Create Group"
  createGroup: '创建组',

  // Original text: "Create"
  createGroupButton: '创建',

  // Original text: "Delete Group"
  deleteGroup: '删除组',

  // Original text: "Are you sure you want to delete this group?"
  deleteGroupConfirm: '你确定要删除该组？',

  // Original text: "Remove user from Group"
  removeUserFromGroup: '从组中删除用户',

  // Original text: "Are you sure you want to delete this user?"
  deleteUserConfirm: '你确定要删除该用户？',

  // Original text: "Delete User"
  deleteUser: '删除用户',

  // Original text: "unknown user"
  unknownUser: '未知用户',

  // Original text: "No group found"
  noGroupFound: '没有找到组',

  // Original text: "Name"
  groupNameColumn: '名称',

  // Original text: "Users"
  groupUsersColumn: '用户',

  // Original text: "Add User"
  addUserToGroupColumn: '增加用户',

  // Original text: "Email"
  userNameColumn: '邮件',

  // Original text: "Permissions"
  userPermissionColumn: '权限',

  // Original text: "Password"
  userPasswordColumn: '密码',

  // Original text: "Email"
  userName: '邮件',

  // Original text: "Password"
  userPassword: '密码',

  // Original text: "Create"
  createUserButton: '创建',

  // Original text: "No user found"
  noUserFound: '没有找到用户',

  // Original text: "User"
  userLabel: '用户',

  // Original text: "Admin"
  adminLabel: '管理',

  // Original text: "No user in group"
  noUserInGroup: '组中没有用户',

  // Original text: "{users} user{users, plural, one {} other {s}}"
  countUsers: '{users} 用户{users, plural, one {} 其他 {s}}',

  // Original text: "Select Permission"
  selectPermission: '选择权限',

  // Original text: "Auto-load at server start"
  autoloadPlugin: '服务器启动时自动加载',

  // Original text: "Save configuration"
  savePluginConfiguration: '保存配置',

  // Original text: "Delete configuration"
  deletePluginConfiguration: '删除配置',

  // Original text: "Plugin error"
  pluginError: '插件错误',

  // Original text: "Unknown error"
  unknownPluginError: '未知错误',

  // Original text: "Purge plugin configuration"
  purgePluginConfiguration: '清除插件配置',

  // Original text: "Are you sure you want to purge this configuration ?"
  purgePluginConfigurationQuestion: '你确定要清除此配置？',

  // Original text: "Edit"
  editPluginConfiguration: '编辑',

  // Original text: "Cancel"
  cancelPluginEdition: '取消',

  // Original text: "Plugin configuration"
  pluginConfigurationSuccess: '插件配置',

  // Original text: "Plugin configuration successfully saved!"
  pluginConfigurationChanges: '插件配置保存成功',

  // Original text: "Start"
  startVmLabel: '启动',

  // Original text: "Recovery start"
  recoveryModeLabel: '恢复启动',

  // Original text: "Suspend"
  suspendVmLabel: '暂停',

  // Original text: "Stop"
  stopVmLabel: '关机',

  // Original text: "Force shutdown"
  forceShutdownVmLabel: '强制关机',

  // Original text: "Reboot"
  rebootVmLabel: '重启',

  // Original text: "Force reboot"
  forceRebootVmLabel: '强制重启',

  // Original text: "Delete"
  deleteVmLabel: '删除',

  // Original text: "Migrate"
  migrateVmLabel: '迁移',

  // Original text: "Snapshot"
  snapshotVmLabel: '快照',

  // Original text: "Export"
  exportVmLabel: '导出',

  // Original text: "Resume"
  resumeVmLabel: '恢复',

  // Original text: "Copy"
  copyVmLabel: '复制',

  // Original text: "Clone"
  cloneVmLabel: '克隆',

  // Original text: "Fast clone"
  fastCloneVmLabel: '快速克隆',

  // Original text: "Convert to template"
  convertVmToTemplateLabel: '转换成模板',

  // Original text: "Console"
  vmConsoleLabel: '控制台',

  // Original text: "Rescan all disks"
  srRescan: '重新扫描所有磁盘',

  // Original text: "Connect to all hosts"
  srReconnectAll: '连接所有主机',

  // Original text: "Disconnect to all hosts"
  srDisconnectAll: '断开所有主机',

  // Original text: "Forget this SR"
  srForget: '移除此数据存储',

  // Original text: "Remove this SR"
  srRemoveButton: '删除此数据存储',

  // Original text: "No VDIs in this storage"
  srNoVdis: '此存储中没有VDI',

  // Original text: "Hosts"
  hostsTabName: '主机',

  // Original text: "High Availability"
  poolHaStatus: '高可用',

  // Original text: "Enabled"
  poolHaEnabled: '启用',

  // Original text: "Disabled"
  poolHaDisabled: '禁用',

  // Original text: "Name"
  hostNameLabel: '名称',

  // Original text: "Description"
  hostDescription: '描述',

  // Original text: "Memory"
  hostMemory: '内存',

  // Original text: "No hosts"
  noHost: '没有主机',

  // Original text: "Name"
  poolNetworkNameLabel: '名称',

  // Original text: "Description"
  poolNetworkDescription: '描述',

  // Original text: "PIFs"
  poolNetworkPif: 'PIFs',

  // Original text: "No networks"
  poolNoNetwork: '没有网络',

  // Original text: "MTU"
  poolNetworkMTU: 'MTU',

  // Original text: "Connected"
  poolNetworkPifAttached: '已连接',

  // Original text: "Disconnected"
  poolNetworkPifDetached: '未连接',

  // Original text: "Add SR"
  addSrLabel: '添加数据存储',

  // Original text: "Add VM"
  addVmLabel: '添加虚拟机',

  // Original text: "Add Host"
  addHostLabel: '添加主机',

  // Original text: "Disconnect"
  disconnectServer: '断开',

  // Original text: "Start"
  startHostLabel: '启动',

  // Original text: "Stop"
  stopHostLabel: '关机',

  // Original text: "Enable"
  enableHostLabel: '启用',

  // Original text: "Disable"
  disableHostLabel: '禁用',

  // Original text: "Restart toolstack"
  restartHostAgent: '重启toolstack',

  // Original text: "Force reboot"
  forceRebootHostLabel: '强制重启',

  // Original text: "Reboot"
  rebootHostLabel: '重启',

  // Original text: "Emergency mode"
  emergencyModeLabel: '紧急模式',

  // Original text: "Storage"
  storageTabName: '存储',

  // Original text: "Patches"
  patchesTabName: '补丁',

  // Original text: "Load average"
  statLoad: '负载平衡',

  // Original text: "Hardware"
  hardwareHostSettingsLabel: '硬件',

  // Original text: "Address"
  hostAddress: '地址',

  // Original text: "Status"
  hostStatus: '状态',

  // Original text: "Build number"
  hostBuildNumber: '版本号',

  // Original text: "iSCSI name"
  hostIscsiName: 'iSCSI名称',

  // Original text: "Version"
  hostXenServerVersion: '版本',

  // Original text: "Enabled"
  hostStatusEnabled: '启用',

  // Original text: "Disabled"
  hostStatusDisabled: '禁用',

  // Original text: "Power on mode"
  hostPowerOnMode: '开机模式',

  // Original text: "Host uptime"
  hostStartedSince: '系统启动时间',

  // Original text: "Toolstack uptime"
  hostStackStartedSince: 'Toolstack启动时间',

  // Original text: "CPU model"
  hostCpusModel: 'CPU型号',

  // Original text: "Core (socket)"
  hostCpusNumber: '核 (socket)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: '制造商信息',

  // Original text: "BIOS info"
  hostBiosinfo: 'BIOS 信息',

  // Original text: "Licence"
  licenseHostSettingsLabel: '授权',

  // Original text: "Type"
  hostLicenseType: '类型',

  // Original text: "Socket"
  hostLicenseSocket: '插槽',

  // Original text: "Expiry"
  hostLicenseExpiry: '过期',

  // Original text: "Add a network"
  networkCreateButton: '新建一个网络',

  // Original text: "Device"
  pifDeviceLabel: '设备',

  // Original text: "Network"
  pifNetworkLabel: '网络',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: '地址',

  // Original text: "MAC"
  pifMacLabel: 'MAC',

  // Original text: "MTU"
  pifMtuLabel: 'MTU',

  // Original text: "Status"
  pifStatusLabel: '状态',

  // Original text: "Connected"
  pifStatusConnected: '已连接',

  // Original text: "Disconnected"
  pifStatusDisconnected: '未连接',

  // Original text: "No physical interface detected"
  pifNoInterface: '没有检测到物理接口',

  // Original text: "Add a storage"
  addSrDeviceButton: '新建存储',

  // Original text: "Name"
  srNameLabel: '名称',

  // Original text: "Type"
  srType: '类型',

  // Original text: "Status"
  pdbStatus: '状态',

  // Original text: "Connected"
  pbdStatusConnected: '已连接',

  // Original text: "Disconnected"
  pbdStatusDisconnected: '未连接',

  // Original text: "Shared"
  srShared: '已共享',

  // Original text: "Not shared"
  srNotShared: '未共享',

  // Original text: "No storage detected"
  pbdNoSr: '未检测到存储',

  // Original text: "Name"
  patchNameLabel: '名称',

  // Original text: "Install all patches"
  patchUpdateButton: '安装所有补丁',

  // Original text: "Description"
  patchDescription: '描述',

  // Original text: "Applied date"
  patchApplied: '应用日期',

  // Original text: "Size"
  patchSize: '大小',

  // Original text: "Status"
  patchStatus: '状态',

  // Original text: "Applied"
  patchStatusApplied: '已应用',

  // Original text: "Missing patches"
  patchStatusNotApplied: '缺少补丁',

  // Original text: "No patch detected"
  patchNothing: '未检测到补丁',

  // Original text: "Release date"
  patchReleaseDate: '发布日期',

  // Original text: "Guidance"
  patchGuidance: '导航',

  // Original text: "Action"
  patchAction: '操作',

  // Original text: "Applied patches"
  hostAppliedPatches: '已应用补丁',

  // Original text: "Missing patches"
  hostMissingPatches: '缺少补丁',

  // Original text: "Host up-to-date!"
  hostUpToDate: '主机补丁为最新',

  // Original text: "Refresh patches"
  refreshPatches: '刷新补丁包',

  // Original text: "Install pool patches"
  installPoolPatches: '安装池补丁',

  // Original text: "General"
  generalTabName: '常规',

  // Original text: "Stats"
  statsTabName: '状态',

  // Original text: "Console"
  consoleTabName: '控制台',

  // Original text: "Snapshots"
  snapshotsTabName: '快照',

  // Original text: "Logs"
  logsTabName: '日志',

  // Original text: "Advanced"
  advancedTabName: '高级',

  // Original text: "Network"
  networkTabName: '网络',

  // Original text: "Disk{disks, plural, one {} other {s}}"
  disksTabName: '磁盘{disks, plural, one {} 其他 {s}}',

  // Original text: "halted"
  powerStateHalted: '已停止',

  // Original text: "running"
  powerStateRunning: '正在运行',

  // Original text: "suspended"
  powerStateSuspended: '已暂停',

  // Original text: "No Xen tools detected"
  vmStatus: '没有检测到Xen Tools',

  // Original text: "No IPv4 record"
  vmName: '没有IPv4记录',

  // Original text: "No IP record"
  vmDescription: '没有IP记录',

  // Original text: "Started {ago}"
  vmSettings: '已启动 {ago}',

  // Original text: "Current status:"
  vmCurrentStatus: '当前状态',

  // Original text: "Not running"
  vmNotRunning: '没有运行',

  // Original text: "No Xen tools detected"
  noToolsDetected: '没有检测到Xen Tools',

  // Original text: "No IPv4 record"
  noIpv4Record: '没有IPv4记录',

  // Original text: "No IP record"
  noIpRecord: '没有IP记录',

  // Original text: "Started {ago}"
  started: '已启动 {ago}',

  // Original text: "Paravirtualization (PV)"
  paraVirtualizedMode: '半虚拟化 (PV)',

  // Original text: "Hardware virtualization (HVM)"
  hardwareVirtualizedMode: '硬件虚拟化 (HVM)',

  // Original text: "CPU usage"
  statsCpu: 'CPU利用率',

  // Original text: "Memory usage"
  statsMemory: '内存利用率',

  // Original text: "Network throughput"
  statsNetwork: '网络流量',

  // Original text: "Stacked values"
  useStackedValuesOnStats: 'Stacked 值',

  // Original text: "Disk throughput"
  statDisk: '磁盘吞吐',

  // Original text: "Last 10 minutes"
  statLastTenMinutes: '最近10分钟',

  // Original text: "Last 2 hours"
  statLastTwoHours: '最近两小时',

  // Original text: "Last week"
  statLastWeek: '最近一周',

  // Original text: "Last year"
  statLastYear: '最近一年',

  // Original text: "Copy"
  copyToClipboardLabel: '复制',

  // Original text: "Ctrl+Alt+Del"
  ctrlAltDelButtonLabel: '发送Ctrl+Alt+Del',

  // Original text: "Tip:"
  tipLabel: '提示',

  // Original text: "non-US keyboard could have issues with console: switch your own layout to US."
  tipConsoleLabel: '非美式键盘操作控制台可能出现问题：请切换至美式键盘模式',

  // Original text: "Action"
  vdiAction: '操作',

  // Original text: "Attach disk"
  vdiAttachDevice: '附加磁盘',

  // Original text: "New disk"
  vbdCreateDeviceButton: '新建磁盘',

  // Original text: "Boot order"
  vdiBootOrder: '启动顺序',

  // Original text: "Name"
  vdiNameLabel: '名称',

  // Original text: "Description"
  vdiNameDescription: '描述',

  // Original text: "Tags"
  vdiTags: '标签',

  // Original text: "Size"
  vdiSize: '磁盘大小',

  // Original text: "SR"
  vdiSr: '数据存储',

  // Original text: "VM"
  vdiVm: '虚拟机',

  // Original text: "Boot flag"
  vbdBootableStatus: '启动标识',

  // Original text: "Status"
  vbdStatus: '状态',

  // Original text: "Connected"
  vbdStatusConnected: '已连接',

  // Original text: "Disconnected"
  vbdStatusDisconnected: '未连接',

  // Original text: "No disks"
  vbdNoVbd: '没有磁盘',

  // Original text: "New device"
  vifCreateDeviceButton: '新建设备',

  // Original text: "No interface"
  vifNoInterface: '没有网卡',

  // Original text: "Device"
  vifDeviceLabel: '设备',

  // Original text: "MAC address"
  vifMacLabel: 'MAC地址',

  // Original text: "MTU"
  vifMtuLabel: 'MTU',

  // Original text: "Network"
  vifNetworkLabel: '网络',

  // Original text: "Status"
  vifStatusLabel: '状态',

  // Original text: "Connected"
  vifStatusConnected: '已连接',

  // Original text: "Disconnected"
  vifStatusDisconnected: '未连接',

  // Original text: "IP addresses"
  vifIpAddresses: 'IP地址',

  // Original text: "Auto-generated if empty"
  vifMacAutoGenerate: '如果没有自动创建',

  // Original text: "No snapshots"
  noSnapshots: '没有快照',

  // Original text: "New snapshot"
  snapshotCreateButton: '新建快照',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: '点击快照按钮来创建快照',

  // Original text: "Creation date"
  snapshotDate: '创建日期',

  // Original text: "Name"
  snapshotName: '名称',

  // Original text: "Action"
  snapshotAction: '操作',

  // Original text: "Remove all logs"
  logRemoveAll: '删除所有日志',

  // Original text: "No logs so far"
  noLogs: '目前没有日志',

  // Original text: "Creation date"
  logDate: '创建日期',

  // Original text: "Name"
  logName: '名称',

  // Original text: "Content"
  logContent: '目录',

  // Original text: "Action"
  logAction: '操作',

  // Original text: "Remove"
  vmRemoveButton: '删除',

  // Original text: "Convert"
  vmConvertButton: '转换',

  // Original text: "Xen settings"
  xenSettingsLabel: 'Xen 设置',

  // Original text: "Guest OS"
  guestOsLabel: '客户操作系统',

  // Original text: "Misc"
  miscLabel: 'Misc',

  // Original text: "UUID"
  uuid: 'UUID',

  // Original text: "Virtualization mode"
  virtualizationMode: '虚拟化模式',

  // Original text: "CPU weight"
  cpuWeightLabel: 'CPU权重',

  // Original text: "Default"
  defaultCpuWeight: '默认',

  // Original text: "PV args"
  pvArgsLabel: 'PV参数',

  // Original text: "Xen tools status"
  xenToolsStatus: 'Xen tools状态',

  // Original text: "{status}"
  xenToolsStatusValue: '{status}',

  // Original text: "OS name"
  osName: '操作系统名称',

  // Original text: "OS kernel"
  osKernel: '操作系统内核',

  // Original text: "Auto power on"
  autoPowerOn: '自动卡机',

  // Original text: "HA"
  ha: '高可用',

  // Original text: "Original template"
  originalTemplate: '来源模板',

  // Original text: "Unknown"
  unknownOsName: '未知',

  // Original text: "Unknown"
  unknownOsKernel: '未知',

  // Original text: "Unknown"
  unknownOriginalTemplate: '未知',

  // Original text: "VM limits"
  vmLimitsLabel: '虚拟机限制',

  // Original text: "CPU limits"
  vmCpuLimitsLabel: 'CPU限制',

  // Original text: "Memory limits (min/max)"
  vmMemoryLimitsLabel: '内存限制(min/max)',

  // Original text: "vCPUs max:"
  vmMaxVcpus: '最大虚拟CPU数',

  // Original text: "Memory max:"
  vmMaxRam: '最大内存',

  // Original text: "Long click to add a name"
  vmHomeNamePlaceholder: '长按来添加名称',

  // Original text: "Long click to add a description"
  vmHomeDescriptionPlaceholder: '长按来添加描述',

  // Original text: "Click to add a name"
  vmViewNamePlaceholder: '点击添加名称',

  // Original text: "Click to add a description"
  vmViewDescriptionPlaceholder: '点击添加描述',

  // Original text: "Pool{pools, plural, one {} other {s}}"
  poolPanel: '池{pools, plural, one {} 其他 {s}}',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: '主机{hosts, plural, one {} 其他 {s}}',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: '虚拟机{vms, plural, one {} 其他 {s}}',

  // Original text: "RAM Usage"
  memoryStatePanel: '内容使用率',

  // Original text: "CPUs Usage"
  cpuStatePanel: 'CPU使用率',

  // Original text: "VMs Power state"
  vmStatePanel: '虚拟机电源状态',

  // Original text: "Pending tasks"
  taskStatePanel: '正在运行的任务',

  // Original text: "Users"
  usersStatePanel: '用户',

  // Original text: "Storage state"
  srStatePanel: '存储状态',

  // Original text: "{usage} (of {total})"
  ofUsage: '{usage} (of {total})',

  // Original text: "No storage"
  noSrs: '没有存储',

  // Original text: "Name"
  srName: '名称',

  // Original text: "Pool"
  srPool: '资源池',

  // Original text: "Host"
  srHost: '主机',

  // Original text: "Type"
  srFormat: '类型',

  // Original text: "Size"
  srSize: '大小',

  // Original text: "Usage"
  srUsage: '利用率',

  // Original text: "used"
  srUsed: '已使用',

  // Original text: "free"
  srFree: '剩余空间',

  // Original text: "Storage Usage"
  srUsageStatePanel: '存储利用率',

  // Original text: "Top 5 SR Usage (in %)"
  srTopUsageStatePanel: '数据存储使用率前5名(in %)',

  // Original text: "{running} running ({halted} halted)"
  vmsStates: '{running} 正在运行 ({halted} 已停止)',

  // Original text: "{value} {date, date, medium}"
  weekHeatmapData: '{value} {date, date, medium}',

  // Original text: "No data."
  weekHeatmapNoData: '没有数据',

  // Original text: "Weekly Heatmap"
  weeklyHeatmap: '每周热图',

  // Original text: "Weekly Charts"
  weeklyCharts: '每周图表',

  // Original text: "Synchronize scale:"
  weeklyChartsScaleInfo: '同步范围',

  // Original text: "Stats error"
  statsDashboardGenericErrorTitle: '状态错误',

  // Original text: "There is no stats available for:"
  statsDashboardGenericErrorMessage: '没有可用的状态:',

  // Original text: "No selected metric"
  noSelectedMetric: '没有选择度量标准',

  // Original text: "Select"
  statsDashboardSelectObjects: '选择',

  // Original text: "Loading…"
  metricsLoading: '加载中….',

  // Original text: "Coming soon!"
  comingSoon: '即将呈现',

  // Original text: "Orphaned VDIs"
  orphanedVdis: '孤立的VDI',

  // Original text: "Orphaned VMs"
  orphanedVms: '孤立的虚拟机',

  // Original text: "No orphans"
  noOrphanedObject: '没有孤立的内容',

  // Original text: "Remove all orphaned VDIs"
  removeAllOrphanedObject: '删除所有孤立的VDI',

  // Original text: "Name"
  vmNameLabel: '名称',

  // Original text: "Description"
  vmNameDescription: '描述',

  // Original text: "Resident on"
  vmContainer: '位于',

  // Original text: "Alarms"
  alarmMessage: '警告',

  // Original text: "No alarms"
  noAlarms: '没有警告',

  // Original text: "Date"
  alarmDate: '日期',

  // Original text: "Content"
  alarmContent: '内容',

  // Original text: "Issue on"
  alarmObject: '问题',

  // Original text: "Pool"
  alarmPool: '资源池',

  // Original text: "Remove all alarms"
  alarmRemoveAll: '删除所有警告',

  // Original text: "Create a new VM on {select}"
  newVmCreateNewVmOn: '创建一个新的位于{select}的虚拟机',

  // Original text: "Create a new VM on {select1} or {select2}"
  newVmCreateNewVmOn2: '创建一个新的位于{select1} 或 {select2}的虚拟机',

  // Original text: "You have no permission to create a VM"
  newVmCreateNewVmNoPermission: '你没有权限创建虚拟机',

  // Original text: "Infos"
  newVmInfoPanel: '信息',

  // Original text: "Name"
  newVmNameLabel: '名称',

  // Original text: "Template"
  newVmTemplateLabel: '模板',

  // Original text: "Description"
  newVmDescriptionLabel: '描述',

  // Original text: "Performances"
  newVmPerfPanel: '性能',

  // Original text: "vCPUs"
  newVmVcpusLabel: '虚拟CPU',

  // Original text: "RAM"
  newVmRamLabel: '内存',

  // Original text: "Install settings"
  newVmInstallSettingsPanel: '安装设置',

  // Original text: "ISO/DVD"
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: "Network"
  newVmNetworkLabel: '网络',

  // Original text: "PV Args"
  newVmPvArgsLabel: 'PV参数',

  // Original text: "PXE"
  newVmPxeLabel: 'PXE',

  // Original text: "Interfaces"
  newVmInterfacesPanel: '网络接口',

  // Original text: "MAC"
  newVmMacLabel: 'MAC',

  // Original text: "Add interface"
  newVmAddInterface: '添加网络接口',

  // Original text: "Disks"
  newVmDisksPanel: '磁盘',

  // Original text: "SR"
  newVmSrLabel: '数据存储',

  // Original text: "Bootable"
  newVmBootableLabel: '启动项',

  // Original text: "Size"
  newVmSizeLabel: '大小',

  // Original text: "Add disk"
  newVmAddDisk: '添加磁盘',

  // Original text: "Summary"
  newVmSummaryPanel: '概述',

  // Original text: "Create"
  newVmCreate: '创建',

  // Original text: "Reset"
  newVmReset: '重置',

  // Original text: "Select template"
  newVmSelectTemplate: '选择模板',

  // Original text: "SSH key"
  newVmSshKey: 'SSH Key',

  // Original text: "Config drive"
  newVmConfigDrive: '配置驱动器',

  // Original text: "Custom config"
  newVmCustomConfig: '自定义配置',

  // Original text: "Boot VM after creation"
  newVmBootAfterCreate: '创建后启动',

  // Original text: "Auto-generated if empty"
  newVmMacPlaceholder: '如果为空自动创建',

  // Original text: "CPU weight"
  newVmCpuWeightLabel: 'CPU权重',

  // Original text: "Quarter (1/4)"
  newVmCpuWeightQuarter: '四分之一 (1/4)',

  // Original text: "Half (1/2)"
  newVmCpuWeightHalf: '二分之一 (1/2)',

  // Original text: "Normal"
  newVmCpuWeightNormal: '普通',

  // Original text: "Double (x2)"
  newVmCpuWeightDouble: '双倍(x2)',

  // Original text: "Cloud config"
  newVmCloudConfig: '云配置',

  // Original text: "Create VMs"
  newVmCreateVms: '创建虚拟机',

  // Original text: "Are you sure you want to create {nbVms} VMs?"
  newVmCreateVmsConfirm: '你确定要创建 {nbVms} 虚拟机?',

  // Original text: "Multiple VMs:"
  newVmMultipleVms: '多个虚拟机',

  // Original text: "Select a resource set:"
  newVmSelectResourceSet: '选择资源集',

  // Original text: "Name pattern:"
  newVmMultipleVmsPattern: '命名模式',

  // Original text: "e.g.: \\{name\\}_%"
  newVmMultipleVmsPatternPlaceholder: '例如: \\{name\\}_%',

  // Original text: "First index:"
  newVmFirstIndex: '首要标识',

  // Original text: "Resource sets"
  resourceSets: '资源集',

  // Original text: "No resource sets."
  noResourceSets: '没有资源集',

  // Original text: "Resource set name"
  resourceSetName: '资源集名称',

  // Original text: "Creation and edition"
  resourceSetCreation: '创建并编辑',

  // Original text: "Save"
  saveResourceSet: '保存',

  // Original text: "Reset"
  resetResourceSet: '重置',

  // Original text: "Edit"
  editResourceSet: '编辑',

  // Original text: "Delete"
  deleteResourceSet: '删除',

  // Original text: "Delete resource set"
  deleteResourceSetWarning: '删除资源集',

  // Original text: "Are you sure you want to delete this resource set?"
  deleteResourceSetQuestion: '你确定要删除此资源集',

  // Original text: "Missing objects:"
  resourceSetMissingObjects: '缺少对象',

  // Original text: "vCPUs"
  resourceSetVcpus: '虚拟CPU',

  // Original text: "Memory"
  resourceSetMemory: '内存',

  // Original text: "Storage"
  resourceSetStorage: '存储',

  // Original text: "Unknown"
  unknownResourceSetValue: '未知',

  // Original text: "Available hosts"
  availableHosts: '可用主机',

  // Original text: "Excluded hosts"
  excludedHosts: '被排除的主机',

  // Original text: "No hosts available."
  noHostsAvailable: '没有可用主机',

  // Original text: "VMs created from this resource set shall run on the following hosts."
  availableHostsDescription: '从这些资源中创建的虚拟机将运行在以下主机上',

  // Original text: "Maximum CPUs"
  maxCpus: '最大CPU',

  // Original text: "Maximum RAM (GiB)"
  maxRam: '最大内存',

  // Original text: "Maximum disk space"
  maxDiskSpace: '最大磁盘空间',

  // Original text: "No limits."
  noResourceSetLimits: '没有限制',

  // Original text: "Total:"
  totalResource: '合计',

  // Original text: "Remaining:"
  remainingResource: '剩余',

  // Original text: "Used:"
  usedResource: '已使用',

  // Original text: "Try dropping some backups here, or click to select backups to upload. Accept only .xva files."
  importVmsList: '尝试将备份文件拖拽到这里，或点击选择备份文件上传，仅支持.xva格式的文件',

  // Original text: "No selected VMs."
  noSelectedVms: '没有选择虚拟机',

  // Original text: "To Pool:"
  vmImportToPool: '到资源池',

  // Original text: "To SR:"
  vmImportToSr: '到存储库',

  // Original text: "VM{nVms, plural, one {} other {s}} to import"
  vmsToImport: '导入虚拟机',

  // Original text: "Reset"
  importVmsCleanList: '重置',

  // Original text: "VM import success"
  vmImportSuccess: '虚拟机导入成功',

  // Original text: "VM import failed"
  vmImportFailed: '虚拟机导入失败',

  // Original text: "Import starting…"
  startVmImport: '开始导入',

  // Original text: "Export starting…"
  startVmExport: '开始导出',

  // Original text: "No pending tasks"
  noTasks: '没有等待中的任务',

  // Original text: "Currently, there are not any pending XenServer tasks"
  xsTasks: '当前，没有任何等待中的XenServer任务',

  // Original text: "List Remote"
  listRemote: '列出远程',

  // Original text: "simple"
  simpleBackup: '简单',

  // Original text: "delta"
  delta: '增量',

  // Original text: "Restore Backups"
  restoreBackups: '恢复备份',

  // Original text: "No remotes"
  noRemotes: '没有远程',

  // Original text: "enabled"
  remoteEnabled: '启用',

  // Original text: "error"
  remoteError: '错误',

  // Original text: "No backup available"
  noBackup: '没有可用的备份',

  // Original text: "VM Name"
  backupVmNameColumn: '虚拟机名称',

  // Original text: "Backup Tag"
  backupTagColumn: '备份标识',

  // Original text: "Last Backup"
  lastBackupColumn: '最后备份',

  // Original text: "Available Backups"
  availableBackupsColumn: '可用的备份',

  // Original text: "Restore"
  restoreColumn: '恢复',

  // Original text: "Restore VM"
  restoreTip: '恢复虚拟机',

  // Original text: "Import VM"
  importBackupTitle: '导入虚拟机',

  // Original text: "Starting your backup import"
  importBackupMessage: '开始你的备份导入',

  // Original text: "Emergency shutdown Host{nHosts, plural, one {} other {s}}"
  emergencyShutdownHostsModalTitle: '紧急关闭主机{nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to shutdown {nHosts} Host{nHosts, plural, one {} other {s}}?"
  emergencyShutdownHostsModalMessage: '你确定要关闭 {nHosts} 主机{nHosts, plural, one {} other {s}}？',

  // Original text: "Shutdown host"
  stopHostModalTitle: '关闭主机',

  // Original text: "This will shutdown your host. Do you want to continue?"
  stopHostModalMessage: '此操作将关闭你的主机，你确定要继续吗？',

  // Original text: "Restart host"
  restartHostModalTitle: '重启主机',

  // Original text: "This will restart your host. Do you want to continue?"
  restartHostModalMessage: '此操作将重启你的主机，你确定要继续吗？',

  // Original text: "Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}"
  restartHostsAgentsModalTitle: '重启主机{nHosts, plural, one {} other {s}} 代理{nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {nHosts} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?"
  restartHostsAgentsModalMessage:
    '你确定要重启{nHosts}主机{nHosts, plural, one {} other {s}} 代理{nHosts, plural, one {} other {s}}？',

  // Original text: "Restart Host{nHosts, plural, one {} other {s}}"
  restartHostsModalTitle: '重启主机{nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {nHosts} Host{nHosts, plural, one {} other {s}}?"
  restartHostsModalMessage: '你确定要重启{nHosts}主机{nHosts, plural, one {} other {s}}？',

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: '启动虚拟机{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to start {vms} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage: '你确定要启动 {vms} 虚拟机{vms, plural, one {} other {s}}？',

  // Original text: "Stop Host{nHosts, plural, one {} other {s}}"
  stopHostsModalTitle: '停止主机{nHosts, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {nHosts} Host{nHosts, plural, one {} other {s}}?"
  stopHostsModalMessage: '你确定要停止{nHosts}主机{nHosts, plural, one {} other {s}}？',

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: '停止虚拟机{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: '你确定要停止{vms}虚拟机{vms, plural, one {} other {s}}？',

  // Original text: "Restart VM"
  restartVmModalTitle: '重新启动虚拟机',

  // Original text: "Are you sure you want to restart {name}?"
  restartVmModalMessage: '你确定要重新启动{name}？',

  // Original text: "Stop VM"
  stopVmModalTitle: '停止虚拟机',

  // Original text: "Are you sure you want to stop {name}?"
  stopVmModalMessage: '你确定要停止 {name}？',

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: '重新启动虚拟机{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: '你确定要重新启动{vms}虚拟机{vms, plural, one {} other {s}}？',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: '执行虚拟机快照{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to snapshot {vms} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage: '你确定要执行虚拟机{vms}快照{vms, plural, one {} other {s}}？',

  // Original text: "Delete VM"
  deleteVmModalTitle: '删除虚拟机',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: '删除虚拟机{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage: '你确定要删除此虚拟机？所有的虚拟机磁盘将被删除',

  // Original text: "Are you sure you want to delete {vms} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage: '你确定要删除 {vms}虚拟机{vms, plural, one {} other {s}}？所有的虚拟机磁盘将被删除',

  // Original text: "Migrate VM"
  migrateVmModalTitle: '迁移虚拟机',

  // Original text: "Select a destination host:"
  migrateVmSelectHost: '选择一个目标主机',

  // Original text: "Select a migration network:"
  migrateVmSelectMigrationNetwork: '选择一个迁移网络',

  // Original text: "For each VDI, select an SR:"
  migrateVmSelectSrs: '为每个虚拟磁盘，选择存储库',

  // Original text: "For each VIF, select a network:"
  migrateVmSelectNetworks: '为每个虚拟网卡，选择一个网络',

  // Original text: "Select a destination SR:"
  migrateVmsSelectSr: '选择一个目标存储库',

  // Original text: "Select a destination SR for local disks:"
  migrateVmsSelectSrIntraPool: '为本地磁盘选择一个目标存储库',

  // Original text: "Select a network on which to connect each VIF:"
  migrateVmsSelectNetwork: '选择一个网络来连接每个虚拟网卡',

  // Original text: "Smart mapping"
  migrateVmsSmartMapping: '智能映射',

  // Original text: "Name"
  migrateVmName: '名称',

  // Original text: "SR"
  migrateVmSr: '存储库',

  // Original text: "VIF"
  migrateVmVif: '虚拟网卡',

  // Original text: "Network"
  migrateVmNetwork: '网络',

  // Original text: "No target host"
  migrateVmNoTargetHost: '没有目标主机',

  // Original text: "A target host is required to migrate a VM"
  migrateVmNoTargetHostMessage: '需要一个目标主机来迁移一个虚拟机',

  // Original text: "Import a {name} Backup"
  importBackupModalTitle: '导入一个{name}备份',

  // Original text: "Start VM after restore"
  importBackupModalStart: '恢复后启动虚拟机',

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: '选择你的备份…',

  // Original text: "Are you sure you want to remove all orphaned VDIs?"
  removeAllOrphanedModalWarning: '你确定要删除所有孤立的虚拟磁盘？',

  // Original text: "Remove all logs"
  removeAllLogsModalTitle: '删除所有日志',

  // Original text: "Are you sure you want to remove all logs?"
  removeAllLogsModalWarning: '你确定要删除所有日志？',

  // Original text: "This operation is definitive."
  definitiveMessageModal: '这个操作是不可更改的',

  // Original text: "Previous SR Usage"
  existingSrModalTitle: '之前存储库的使用情况',

  // Original text: "This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingSrModalText: '这条路径之前已经被一台XenServer主机用来连接存储。如果你选择继续创建存储库，所有的数据将丢失。',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: '之前LUN使用情况',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingLunModalText: '这个LUN之前已经被一台XenServer主机使用。如果你选择继续创建存储库，所有的数据将丢失。',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: '替换当前的注册？',

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText: '你的XO设备已经注册给{email}，你确定要删除并替换这个注册信息？',

  // Original text: "Ready for trial?"
  trialReadyModal: '准备试用？',

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText: '在试用期内，XOA需要Internet连接才能正常使用，如果您正式付费将不受此限制',

  // Original text: "Host"
  serverHost: '主机',

  // Original text: "Username"
  serverUsername: '用户名',

  // Original text: "Password"
  serverPassword: '密码',

  // Original text: "Action"
  serverAction: '操作',

  // Original text: "Read Only"
  serverReadOnly: '只读',

  // Original text: "Copy VM"
  copyVm: '复制虚拟机',

  // Original text: "Are you sure you want to copy this VM to {SR}?"
  copyVmConfirm: '你确定要复制此虚拟机到{SR}',

  // Original text: "Name"
  copyVmName: '名称',

  // Original text: "Name pattern"
  copyVmNamePattern: '命名规范',

  // Original text: "If empty: name of the copied VM"
  copyVmNamePlaceholder: '如果复制虚拟机名称为空',

  // Original text: "e.g.: \"\\{name\\}_COPY\""
  copyVmNamePatternPlaceholder: 'e.g.: "\\{name\\}_COPY"',

  // Original text: "Select SR"
  copyVmSelectSr: '选择存储库',

  // Original text: "Use compression"
  copyVmCompress: '使用压缩',

  // Original text: "No target SR"
  copyVmsNoTargetSr: '没有目标存储库',

  // Original text: "A target SR is required to copy a VM"
  copyVmsNoTargetSrMessage: '复制虚拟机需要选择一个目标存储库',

  // Original text: "Create network"
  newNetworkCreate: '创建网络',

  // Original text: "Interface"
  newNetworkInterface: '接口',

  // Original text: "Name"
  newNetworkName: '名称',

  // Original text: "Description"
  newNetworkDescription: '描述',

  // Original text: "VLAN"
  newNetworkVlan: 'VLAN',

  // Original text: "No VLAN if empty"
  newNetworkDefaultVlan: '如果为空则没有VLAN',

  // Original text: "MTU"
  newNetworkMtu: 'MTU',

  // Original text: "Default: 1500"
  newNetworkDefaultMtu: '默认1500',

  // Original text: "Delete network"
  deleteNetwork: '删除网络',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: '你确定要删除此网络',

  // Original text: "Xen Orchestra"
  xenOrchestra: 'Xen Orchestra',

  // Original text: "No pro support provided!"
  noProSupport: '不提供专业支持！',

  // Original text: "Use in production at your own risks"
  noProductionUse: '在生产环境中使用将存在风险',

  // Original text: "You can download our turnkey appliance at"
  downloadXoa: '您可以在这里下载我们的整套设备',

  // Original text: "Bug Tracker"
  bugTracker: '问题跟踪器',

  // Original text: "Issues? Report it!"
  bugTrackerText: '出现问题？报告！',

  // Original text: "Community"
  community: '社区',

  // Original text: "Join our community forum!"
  communityText: '加入我们的社区论坛',

  // Original text: "Free Trial for Premium Edition!"
  freeTrial: '铂金版免费试用',

  // Original text: "Request your trial now!"
  freeTrialNow: '立即请求试用',

  // Original text: "Any issue?"
  issues: '出现任何问题？',

  // Original text: "Problem? Contact us!"
  issuesText: '有问题？联系我们！',

  // Original text: "Documentation"
  documentation: '文档',

  // Original text: "Read our official doc"
  documentationText: '阅读我们官方文档',

  // Original text: "Pro support included"
  proSupportIncluded: '包含专业支持',

  // Original text: "Acces your XO Account"
  xoAccount: '进入你的XO账户',

  // Original text: "Report a problem"
  openTicket: '报告一个问题',

  // Original text: "Problem? Open a ticket !"
  openTicketText: '存在问题？开个Case！',

  // Original text: "Upgrade needed"
  upgradeNeeded: '需要升级',

  // Original text: "Upgrade now!"
  upgradeNow: '立即升级',

  // Original text: "Or"
  or: '或',

  // Original text: "Try it for free!"
  tryIt: '免费试用',

  // Original text: "This feature is available starting from {plan} Edition"
  availableIn: '这个功能将在{plan}版本中可用',

  // Original text: "Updates"
  updateTitle: '更新',

  // Original text: "Registration"
  registration: '注册',

  // Original text: "Trial"
  trial: '试用',

  // Original text: "Settings"
  settings: '设置',

  // Original text: "Update"
  update: '更新',

  // Original text: "Upgrade"
  upgrade: '升级',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: '社区版本没有可用的升级',

  // Original text: "Please consider subscribe and try it with all features for free during 30 days on"
  noUpdaterSubscribe: '请考虑订购或在30天内免费试用所有功能',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning: '由于相关依赖关系的问题，手动更新将跑坏你当前的安全，请小心使用',

  // Original text: "Current version:"
  currentVersion: '当前版本',

  // Original text: "Register"
  register: '注册',

  // Original text: "Please, take time to register in order to enjoy your trial."
  trialRegistration: '为了您的正常使用，请考虑花时间注册',

  // Original text: "Start trial"
  trialStartButton: '开始试用',

  // Original text: "You can use a trial version until {date, date, medium}. Upgrade your appliance to get it."
  trialAvailableUntil: '你可以使用试用版本直到{date, date, medium}。更新你的设备来获取',

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed: '你的使用已经结束，联系我们或下载免费版本',

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked: '你的xoa-更新服务已停止。没有此服务你的XOA不能完全正常运行',

  // Original text: "No update information available"
  noUpdateInfo: '没有更新信息可用',

  // Original text: "Update information may be available"
  waitingUpdateInfo: '更新信息可能可用',

  // Original text: "Your XOA is up-to-date"
  upToDate: '你的XOA是最新的',

  // Original text: "You need to update your XOA (new version is available)"
  mustUpgrade: '你需要更新你的XOA（有新版本可用）',

  // Original text: "Your XOA is not registered for updates"
  registerNeeded: '你的XOA没有注册更新',

  // Original text: "Can't fetch update information"
  updaterError: '不能获取更新信息',

  // Original text: "Upgrade successful"
  promptUpgradeReloadTitle: '更新成功',

  // Original text: "Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?"
  promptUpgradeReloadMessage: '你的XOA已经成功更新，你的浏览器必须重新加载，你要现在重新加载吗？',

  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Xen Orchestra 源码版',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: '你在使用XO的源码版！这非常适合个人/非商业用途',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: '如果你是一个公司，建议使用我们的设备结合专业的支持',

  // Original text: "This version is not bundled with any support nor updates. Use it with caution for critical tasks."
  disclaimerText3: '这个版本没有绑定任何支持或更新，请谨慎使用',

  // Original text: "Connect PIF"
  connectPif: '连接物理网卡',

  // Original text: "Are you sure you want to connect this PIF?"
  connectPifConfirm: '你确定要连接这个物理网卡？',

  // Original text: "Disconnect PIF"
  disconnectPif: '断开物理网卡',

  // Original text: "Are you sure you want to disconnect this PIF?"
  disconnectPifConfirm: '你确定要断开这个网卡网卡？',

  // Original text: "Delete PIF"
  deletePif: '删除物理网卡',

  // Original text: "Are you sure you want to delete this PIF?"
  deletePifConfirm: '你确定要删除这个物理网卡？',

  // Original text: "Username"
  username: '用户名',

  // Original text: "Password"
  password: '密码',

  // Original text: "Language"
  language: '语言',

  // Original text: "Old password"
  oldPasswordPlaceholder: '原密码',

  // Original text: "New password"
  newPasswordPlaceholder: '新密码',

  // Original text: "Confirm new password"
  confirmPasswordPlaceholder: '确认新密码',

  // Original text: "Confirmation password incorrect"
  confirmationPasswordError: '确认密码不正确',

  // Original text: "Password does not match the confirm password."
  confirmationPasswordErrorBody: '确认密码不匹配',

  // Original text: "Password changed"
  pwdChangeSuccess: '密码已修改',

  // Original text: "Your password has been successfully changed."
  pwdChangeSuccessBody: '你的密码已成功修改',

  // Original text: "Incorrect password"
  pwdChangeError: '密码错误',

  // Original text: "The old password provided is incorrect. Your password has not been changed."
  pwdChangeErrorBody: '原密码错误，你的密码未更改',

  // Original text: "OK"
  changePasswordOk: '确认',

  // Original text: "Others"
  others: '其他',
}
