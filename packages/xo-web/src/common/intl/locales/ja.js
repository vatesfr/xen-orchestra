// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/ja'

import reactIntlData from 'react-intl/locale-data/ja'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: "{key}: {value}"
  keyValue: '{key} : {value}',

  // Original text: "Connecting"
  statusConnecting: '接続中……',

  // Original text: "Disconnected"
  statusDisconnected: '切断',

  // Original text: "Loading…"
  statusLoading: '読み込み中……',

  // Original text: "Page not found"
  errorPageNotFound: 'ページが見つかりません',

  // Original text: "no such item"
  errorNoSuchItem: 'アイテムが見つかりません',

  // Original text: "Long click to edit"
  editableLongClickPlaceholder: '押し続けることで編集',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'クリックで編集',

  // Original text: "Browse files"
  browseFiles: 'ブラウズファイル',

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "OK"
  confirmOk: 'OK',

  // Original text: "Cancel"
  genericCancel: 'キャンセル',

  // Original text: "On error"
  onError: 'エラー',

  // Original text: "Successful"
  successful: '成功',

  // Original text: "Managed disks"
  filterOnlyManaged: 'ディスクの管理',

  // Original text: "Orphaned disks"
  filterOnlyOrphaned: '関連するものが存在しないディスク一覧',

  // Original text: "Normal disks"
  filterOnlyRegular: '正常なディスク一覧',

  // Original text: "Snapshot disks"
  filterOnlySnapshots: 'スナップショットのディスク一覧',

  // Original text: "Unmanaged disks"
  filterOnlyUnmanaged: '管理されていないディスク一覧',

  // Original text: "Copy to clipboard"
  copyToClipboard: 'クリップボードにコピー',

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

  // Original text: "Storages"
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

  // Original text: "Updates"
  updatePage: '更新',

  // Original text: "Settings"
  settingsPage: '設定',

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

  // Original text: "New VM backup"
  newVmBackup: 'VMバックアップの新規追加',

  // Original text: "Edit VM backup"
  editVmBackup: 'VMバックアップの編集',

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

  // Original text: "No support"
  noSupport: 'サポート適応外',

  // Original text: "Free upgrade!"
  freeUpgrade: 'フリーアップグレード',

  // Original text: "Sign out"
  signOut: 'サインアウト',

  // Original text: "Edit my settings {username}"
  editUserProfile: '{username} 設定の変更',

  // Original text: "Fetching data…"
  homeFetchingData: 'データ取得中……',

  // Original text: "Welcome on Xen Orchestra!"
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

  // Original text: "Online Doc"
  homeOnlineDoc: 'オンラインドキュメント',

  // Original text: "Pro Support"
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

  // Original text: "New VM"
  homeNewVm: 'VMの新規作成',

  // Original text: "None"
  homeFilterNone: 'なし',

  // Original text: "Running hosts"
  homeFilterRunningHosts: '起動中のホスト',

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: '無効化されたホスト',

  // Original text: "Running VMs"
  homeFilterRunningVms: '起動中のVM',

  // Original text: "Non running VMs"
  homeFilterNonRunningVms: '起動していないVM',

  // Original text: "Pending VMs"
  homeFilterPendingVms: 'ペンディング中のVM',

  // Original text: "HVM guests"
  homeFilterHvmGuests: 'HVMゲストVM',

  // Original text: "Tags"
  homeFilterTags: 'タグ',

  // Original text: "Sort by"
  homeSortBy: 'ソート',

  // Original text: "Name"
  homeSortByName: '名前',

  // Original text: "Power state"
  homeSortByPowerstate: '電源状態',

  // Original text: "RAM"
  homeSortByRAM: 'RAM',

  // Original text: "vCPUs"
  homeSortByvCPUs: 'vCPUs',

  // Original text: "CPUs"
  homeSortByCpus: 'CPUs',

  // Original text: "Shared/Not shared"
  homeSortByShared: '共有/専有',

  // Original text: "Size"
  homeSortBySize: 'サイズ',

  // Original text: "Usage"
  homeSortByUsage: '使用量',

  // Original text: "Type"
  homeSortByType: 'タイプ',

  // Original text: "{displayed, number}x {icon} (on {total, number})"
  homeDisplayedItems: '{displayed, number}x {icon} (on {total, number})',

  // Original text: "{selected, number}x {icon} selected (on {total, number})"
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

  // Original text: "High Availability"
  highAvailability: 'High Availability',

  // Original text: "Shared {type}"
  srSharedType: '共有{type}',

  // Original text: "Not shared {type}"
  srNotSharedType: '専有{type}',

  // Original text: 'All of them are selected'
  sortedTableAllItemsSelected: '選択中({nItems, number})',

  // Original text: '{nFiltered, number} of {nTotal, number} items'
  sortedTableNumberOfFilteredItems: 'フィルタ中({nFiltered, number}) 全体({nTotal, number})',

  // Original text: '{nTotal, number} items'
  sortedTableNumberOfItems: '{nTotal, number} 個',

  // Original text: '{nSelected, number} selected'
  sortedTableNumberOfSelectedItems: '{nSelected, number} 選択中',

  // Original text: 'Click here to select all items'
  sortedTableSelectAllItems: '全てを選択します',

  // Original text: "Add"
  add: '追加',

  // Original text: "Select all"
  selectAll: '全てを選択',

  // Original text: "Remove"
  remove: '除去',

  // Original text: "Preview"
  preview: 'プレビュー',

  // Original text: "Item"
  item: 'アイテム',

  // Original text: "No selected value"
  noSelectedValue: '値が未選択',

  // Original text: "Choose user(s) and/or group(s)"
  selectSubjects: 'ユーザとグループの選択',

  // Original text: "Select Object(s)…"
  selectObjects: 'オブジェクトを選択……',

  // Original text: "Choose a role"
  selectRole: '権限を選択',

  // Original text: "Select Host(s)…"
  selectHosts: 'ホストの選択……',

  // Original text: "Select object(s)…"
  selectHostsVms: 'ホストとVMを選択…',

  // Original text: "Select Network(s)…"
  selectNetworks: 'ネットワークの選択……',

  // Original text: "Select PIF(s)…"
  selectPifs: '物理インタフェイスPIFの選択……',

  // Original text: "Select Pool(s)…"
  selectPools: 'プールの選択……',

  // Original text: "Select Remote(s)…"
  selectRemotes: 'リモートの選択……',

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

  // Original text: "Fill required informations."
  fillRequiredInformations: '必要情報を入力してください。',

  // Original text: "Fill informations (optional)"
  fillOptionalInformations: '情報を入力してください (オプション)',

  // Original text: "Reset"
  selectTableReset: '設定初期化',

  // Original text: "Month"
  schedulingMonth: '月',

  // Original text: "Every N month"
  schedulingEveryNMonth: 'Nヶ月毎',

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: '選択月',

  // Original text: "Day"
  schedulingDay: '日',

  // Original text: "Every N day"
  schedulingEveryNDay: 'N日毎',

  // Original text: "Each selected day"
  schedulingEachSelectedDay: '選択日',

  // Original text: "Switch to week days"
  schedulingSetWeekDayMode: '週・日モードに変更',

  // Original text: "Switch to month days"
  schedulingSetMonthDayMode: '月・日モードに変更',

  // Original text: "Hour"
  schedulingHour: '時間',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: '選択時間毎',

  // Original text: "Every N hour"
  schedulingEveryNHour: 'N時間毎',

  // Original text: "Minute"
  schedulingMinute: '分',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: '選択分毎',

  // Original text: "Every N minute"
  schedulingEveryNMinute: 'N分毎',

  // Original text: "Every month"
  selectTableAllMonth: '毎月',

  // Original text: "Every day"
  selectTableAllDay: '毎日',

  // Original text: "Every hour"
  selectTableAllHour: '毎時',

  // Original text: "Every minute"
  selectTableAllMinute: '毎分',

  // Original text: "Reset"
  schedulingReset: '設定の初期化',

  // Original text: "Unknown"
  unknownSchedule: '不明',

  // Original text: "Web browser timezone"
  timezonePickerUseLocalTime: 'ウェブブラウザのタイムゾーン',

  // Original text: "Server timezone ({value})"
  serverTimezoneOption: 'サーバのタイムゾーン ({value})',

  // Original text: "Cron Pattern:"
  cronPattern: 'Cronのパターン:',

  // Original text: "Cannot edit backup"
  backupEditNotFoundTitle: 'バックアップが編集できません',

  // Original text: "Missing required info for edition"
  backupEditNotFoundMessage: '編集のための必要情報がありません。',

  // Original text: "Successful"
  successfulJobCall: '成功しました',

  // Original text: "Failed"
  failedJobCall: '失敗しました',

  // Original text: "In progress"
  jobCallInProgess: '処理中',

  // Original text: "size:"
  jobTransferredDataSize: 'データ量 :',

  // Original text: "speed:"
  jobTransferredDataSpeed: '速度 :',

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

  // Original text: "State"
  jobState: '状態',

  // Original text: "Enabled"
  jobStateEnabled: '有効',

  // Original text: "Disabled"
  jobStateDisabled: '無効',

  // Original text: "Timezone"
  jobTimezone: 'タイムゾーン',

  // Original text: "Server"
  jobServerTimezone: 'xo-server',

  // Original text: "Run job"
  runJob: 'ジョブの実行',

  // Original text: "One shot running started. See overview for logs."
  runJobVerbose: '1回のみ実行しています。ログを確認してください。',

  // Original text: "Started"
  jobStarted: 'スタートしました',

  // Original text: "Finished"
  jobFinished: '終了しました',

  // Original text: "Save"
  saveBackupJob: 'バックアップジョブの保存',

  // Original text: "Remove backup job"
  deleteBackupSchedule: 'バックアップジョブを削除',

  // Original text: "Are you sure you want to delete this backup job?"
  deleteBackupScheduleQuestion: 'バックアップジョブを削除しても良いですか？',

  // Original text: "Enable immediately after creation"
  scheduleEnableAfterCreation: '作成後、すぐに有効化する',

  // Original text: "You are editing Schedule {name} ({id}). Saving will override previous schedule state."
  scheduleEditMessage: 'スケジュール{name}({id})を編集しています。保存は、前回のスケジュール状態を上書きします。',

  // Original text: "You are editing job {name} ({id}). Saving will override previous job state."
  jobEditMessage: 'ジョブ{name} ({id})を編集しています。保存は、前回のジョブ状態を上書きします。',

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'スケジュールジョブがありません。',

  // Original text: "No jobs found."
  noJobs: 'ジョブがありません。',

  // Original text: "No schedules found"
  noSchedules: 'スケジュールがありません。',

  // Original text: "Select a xo-server API command"
  jobActionPlaceHolder: 'xo-server APIコマンドを選択してください。',

  // Original text: "Timeout (number of seconds after which a VM is considered failed)"
  jobTimeoutPlaceHolder: 'タイムアウト(VMが故障したと見なされるまでの秒数)',

  // Original text: "Schedules"
  jobSchedules: 'スケジュール',

  // Original text: "Name of your schedule"
  jobScheduleNamePlaceHolder: 'スケジュールの名称',

  // Original text: "Select a Job"
  jobScheduleJobPlaceHolder: 'ジョブの選択',

  // Original text: "Job owner"
  jobOwnerPlaceholder: 'ジョブのオーナー',

  // Original text: "This job's creator no longer exists"
  jobUserNotFound: 'このジョブの作成者は既にいません。',

  // Original text: "This backup's creator no longer exists"
  backupUserNotFound: 'バックアップユーザが存在しません。',

  // Original text: "Backup owner"
  backupOwner: 'バックアップオーナー',

  // Original text: "Select your backup type:"
  newBackupSelection: 'バックアップタイプ:',

  // Original text: "Select backup mode:"
  smartBackupModeSelection: 'バックアップモードの選択:',

  // Original text: "Normal backup"
  normalBackup: '通常のバックアップモード',

  // Original text: "Smart backup"
  smartBackup: '自動バックアップモード',

  // Original text: "Local remote selected"
  localRemoteWarningTitle: '選択されたローカル、リモート',

  // Original text: "Warning: local remotes will use limited XOA disk space. Only for advanced users."
  localRemoteWarningMessage:
    '注意：ローカルリモートは、限定されたXOAディスク空間を利用します。アドバンスユーザのみの機能です。',

  // Original text: "Warning: this feature works only with XenServer 6.5 or newer."
  backupVersionWarning: '注意：この機能は、XenServer 6.5以上でのみ利用可能です。',

  // Original text: "VMs"
  editBackupVmsTitle: 'VMs',

  // Original text: "VMs statuses"
  editBackupSmartStatusTitle: 'VMの状態',

  // Original text: "Resident on"
  editBackupSmartResidentOn: '搭載中：',

  // Original text: "Pools"
  editBackupSmartPools: 'プール',

  // Original text: "Tags"
  editBackupSmartTags: 'スマートタグ',

  // Original text: "VMs Tags"
  editBackupSmartTagsTitle: 'VMのスマートタグ',

  // Original text: "Reverse"
  editBackupNot: 'リバース',

  // Original text: "Tag"
  editBackupTagTitle: 'タグ',

  // Original text: "Report"
  editBackupReportTitle: 'レポート',

  // Original text: "Automatically run as scheduled"
  editBackupScheduleEnabled: 'スケジュールによる自動実行',

  // Original text: "Depth"
  editBackupDepthTitle: 'バックアップ深度',

  // Original text: "Remote"
  editBackupRemoteTitle: 'リモート',

  // Original text: "Delete the old backups first"
  deleteOldBackupsFirst: '古いバックアップを最初に削除する',

  // Original text: "Remote stores for backup"
  remoteList: 'バックアップのためのリモートストア',

  // Original text: "New File System Remote"
  newRemote: '新規リモートファイルシステム',

  // Original text: "Local"
  remoteTypeLocal: 'ローカル',

  // Original text: "NFS"
  remoteTypeNfs: 'NFS',

  // Original text: "SMB"
  remoteTypeSmb: 'SMB',

  // Original text: "Type"
  remoteType: 'タイプ',

  // Original text: "Test your remote"
  remoteTestTip: 'リモートのテストをすると良いでしょう',

  // Original text: "Test Remote"
  testRemote: 'リモートのテスト',

  // Original text: "Test failed for {name}"
  remoteTestFailure: 'リモートテスト名：{name}',

  // Original text: "Test passed for {name}"
  remoteTestSuccess: 'リモートテストの成功 {name}',

  // Original text: "Error"
  remoteTestError: 'テストエラー',

  // Original text: "Test Step"
  remoteTestStep: 'テストステップ',

  // Original text: "Test file"
  remoteTestFile: 'テストファイル',

  // Original text: 'Test name'
  remoteTestName: 'テスト名',

  // Original text: "Remote name already exists!"
  remoteTestNameFailure: 'リモートテスト名は既に存在しています。',

  // Original text: "The remote appears to work correctly"
  remoteTestSuccessMessage: 'リモートテストは正常に動作しました',

  // Original text: "Connection failed"
  remoteConnectionFailed: '接続に失敗しました',

  // Original text: "Name"
  remoteName: 'リモート名',

  // Original text: "Path"
  remotePath: 'リモートパス',

  // Original text: "State"
  remoteState: 'リモートの状態',

  // Original text: "Device"
  remoteDevice: 'リモートデバイス',

  // Original text: "Share"
  remoteShare: 'リモート共有',

  // Original text: "Action"
  remoteAction: 'リモートアクション',

  // Original text: "Auth"
  remoteAuth: '認証(Auth)',

  // Original text: "Mounted"
  remoteMounted: 'リモートのマウント済',

  // Original text: "Unmounted"
  remoteUnmounted: 'アンマウント済',

  // Original text: "Connect"
  remoteConnectTip: '接続',

  // Original text: "Disconnect"
  remoteDisconnectTip: '接続を解除',

  // Original text: "Connected"
  remoteConnected: '接続済',

  // Original text: "Disconnected"
  remoteDisconnected: '未接続',

  // Original text: "Delete"
  remoteDeleteTip: '削除',

  // Original text: "remote name *"
  remoteNamePlaceHolder: 'リモート名*',

  // Original text: "Name *"
  remoteMyNamePlaceHolder: '名前*',

  // Original text: "/path/to/backup"
  remoteLocalPlaceHolderPath: '/path/to/backup',

  // Original text: "host *"
  remoteNfsPlaceHolderHost: 'host *',

  // Original text: "path/to/backup"
  remoteNfsPlaceHolderPath: 'path/to/backup',

  // Original text: "subfolder [path\\to\\backup]"
  remoteSmbPlaceHolderRemotePath: 'subfolder [path\\to\\backup]',

  // Original text: "Username"
  remoteSmbPlaceHolderUsername: 'ユーザ名',

  // Original text: "Password"
  remoteSmbPlaceHolderPassword: 'パスワード',

  // Original text: "Domain"
  remoteSmbPlaceHolderDomain: 'ドメイン',

  // Original text : "Use HTTPS"
  remoteS3LabelUseHttps: 'HTTPSを利用する',

  // Original text : "Allow unauthorized"
  remoteS3LabelAllowInsecure: 'Insecureを許可する',

  // Original text : "AWS S3 endpoint (ex: s3.us-east-2.amazonaws.com)"
  remoteS3PlaceHolderEndpoint: 'AWS S3 endpoint (ex: s3.us-east-2.amazonaws.com)',

  // Original text : "AWS S3 bucket name"
  remoteS3PlaceHolderBucket: 'AWS S3 bucket name',

  // Original text : "Directory"
  remoteS3PlaceHolderDirectory: 'Directory',

  // Original text : "Access key ID"
  remoteS3PlaceHolderAccessKeyID: 'Access key ID',

  // Original text : "Paste secret here to change it"
  remoteS3PlaceHolderSecret: 'Paste secret here to change it',

  // Original text : "Enter your encryption key here (32 characters)"
  remoteS3PlaceHolderEncryptionKey: 'Enter your encryption key here (32 characters)',

  // Original text : "Region, leave blank for default"
  remoteS3Region: 'Region, leave blank for default',

  // Original text : "Uncheck if you want HTTP instead of HTTPS"
  remoteS3TooltipProtocol: 'Uncheck if you want HTTP instead of HTTPS',

  // Original text : "Check if you want to accept self signed certificates"
  remoteS3TooltipAcceptInsecure: 'Check if you want to accept self signed certificates',

  // Original text: "<address>\\<share> *"
  remoteSmbPlaceHolderAddressShare: '<address>\\<share> *',

  // Original text: "password(fill to edit)"
  remotePlaceHolderPassword: 'password(fill to edit)',

  // Original text: "Create a new SR"
  newSrTitle: '新規ストレージリソース(SR)を作成します',

  // Original text: "General"
  newSrGeneral: '一般',

  // Original text: "Select Storage Type:"
  newSrTypeSelection: 'ストレージタイプの選択:',

  // Original text: "Settings"
  newSrSettings: 'SRの設定',

  // Original text: "Storage Usage"
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

  // Original text: "with auth."
  newSrAuth: '(要認証)',

  // Original text: "User Name"
  newSrUsername: 'ユーザ名',

  // Original text: "Password"
  newSrPassword: 'パスワード',

  // Original text: "Device"
  newSrDevice: 'デバイス',

  // Original text: "in use"
  newSrInUse: '使用中',

  // Original text: "Size"
  newSrSize: 'サイズ',

  // Original text: "Create"
  newSrCreate: '作成',

  // Original text: "Storage name"
  newSrNamePlaceHolder: 'ストレージ名',

  // Original text: "Storage description"
  newSrDescPlaceHolder: 'ストレージの説明',

  // Original text: "Address"
  newSrAddressPlaceHolder: 'Address',

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

  // Original text: "Users/Groups"
  subjectName: 'Users/Groups',

  // Original text: "Object"
  objectName: 'Object',

  // Original text: "No acls found"
  aclNoneFound: 'No acls found',

  // Original text: "Role"
  roleName: 'Role',

  // Original text: "Create"
  aclCreate: 'Create',

  // Original text: "New Group Name"
  newGroupName: 'New Group Name',

  // Original text: "Create Group"
  createGroup: 'Create Group',

  // Original text: "Create"
  createGroupButton: 'Create',

  // Original text: "Delete Group"
  deleteGroup: 'Delete Group',

  // Original text: "Are you sure you want to delete this group?"
  deleteGroupConfirm: 'Are you sure you want to delete this group?',

  // Original text: "Remove user from Group"
  removeUserFromGroup: 'Remove user from Group',

  // Original text: "Are you sure you want to delete this user?"
  deleteUserConfirm: 'Are you sure you want to delete this user?',

  // Original text: "Delete User"
  deleteUser: 'Delete User',

  // Original text: "no user"
  noUser: 'no user',

  // Original text: "unknown user"
  unknownUser: 'unknown user',

  // Original text: "No group found"
  noGroupFound: 'No group found',

  // Original text: "Name"
  groupNameColumn: 'Name',

  // Original text: "Users"
  groupUsersColumn: 'Users',

  // Original text: "Add User"
  addUserToGroupColumn: 'Add User',

  // Original text: "Email"
  userNameColumn: 'Email',

  // Original text: "Permissions"
  userPermissionColumn: 'Permissions',

  // Original text: "Password"
  userPasswordColumn: 'Password',

  // Original text: "Email"
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

  // Original text: "Select Permission"
  selectPermission: 'Select Permission',

  // Original text: "No plugins found"
  noPlugins: 'No plugins found',

  // Original text: "Auto-load at server start"
  autoloadPlugin: 'Auto-load at server start',

  // Original text: "Save configuration"
  savePluginConfiguration: 'Save configuration',

  // Original text: "Delete configuration"
  deletePluginConfiguration: 'Delete configuration',

  // Original text: "Plugin error"
  pluginError: 'Plugin error',

  // Original text: "Unknown error"
  unknownPluginError: 'Unknown error',

  // Original text: "Purge plugin configuration"
  purgePluginConfiguration: 'Purge plugin configuration',

  // Original text: "Are you sure you want to purge this configuration ?"
  purgePluginConfigurationQuestion: 'Are you sure you want to purge this configuration ?',

  // Original text: "Edit"
  editPluginConfiguration: 'Edit',

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

  // Original text: "Set custom filters"
  setUserFiltersTitle: 'Set custom filters',

  // Original text: "Are you sure you want to set custom filters?"
  setUserFiltersBody: 'Are you sure you want to set custom filters?',

  // Original text: "Remove custom filter"
  removeUserFilterTitle: 'Remove custom filter',

  // Original text: "Are you sure you want to remove custom filter?"
  removeUserFilterBody: 'Are you sure you want to remove custom filter?',

  // Original text: "Default filter"
  defaultFilter: 'Default filter',

  // Original text: "Default filters"
  defaultFilters: 'Default filters',

  // Original text: "Custom filters"
  customFilters: 'Custom filters',

  // Original text: "Customize filters"
  customizeFilters: 'Customize filters',

  // Original text: "Save custom filters"
  saveCustomFilters: 'Save custom filters',

  // Original text: "Start"
  startVmLabel: '仮想マシンの起動',

  // Original text: "Recovery start"
  recoveryModeLabel: 'Recovery start',
  // 'Pause',
  pauseVmLabel: '一時停止',

  // Original text: "Suspend"
  suspendVmLabel: 'サスペンド(停止)',

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

  // Original text: "Fast clone"
  fastCloneVmLabel: 'Fast clone',

  // Original text: "Convert to template"
  convertVmToTemplateLabel: 'テンプレートに変換',

  // Original text: "Console"
  vmConsoleLabel: 'コンソール',

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

  // Original text: "Remove this SR"
  srRemoveButton: 'Remove this SR',

  // Original text: "No VDIs in this storage"
  srNoVdis: 'No VDIs in this storage',

  // Original text: "Pool RAM usage:"
  poolTitleRamUsage: 'Pool RAM usage:',

  // Original text: "{used} used on {total}"
  poolRamUsage: '{used} used on {total}',

  // Original text: "Master:"
  poolMaster: 'Master:',

  // Original text: "Display all hosts of this pool"
  displayAllHosts: 'Display all hosts of this pool',

  // Original text: "Display all storages of this pool"
  displayAllStorages: 'Display all storages of this pool',

  // Original text: "Display all VMs of this pool"
  displayAllVMs: 'Display all VMs of this pool',

  // Original text: "Hosts"
  hostsTabName: 'Hosts',

  // Original text: "Vms"
  vmsTabName: 'Vms',

  // Original text: "Srs"
  srsTabName: 'Srs',

  // Original text: "High Availability"
  poolHaStatus: 'High Availability',

  // Original text: "Enabled"
  poolHaEnabled: 'Enabled',

  // Original text: "Disabled"
  poolHaDisabled: 'Disabled',

  // Original text: "Name"
  hostNameLabel: 'Name',

  // Original text: "Description"
  hostDescription: 'Description',

  // Original text: "Memory"
  hostMemory: 'Memory',

  // Original text: "No hosts"
  noHost: 'No hosts',

  // Original text: "{used}% used ({free} free)"
  memoryLeftTooltip: '{used}% used ({free} free)',

  // Original text: "PIF"
  pif: 'PIF',

  // Original text: "Name"
  poolNetworkNameLabel: 'Name',

  // Original text: "Description"
  poolNetworkDescription: 'Description',

  // Original text: "PIFs"
  poolNetworkPif: 'PIFs',

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

  // Original text: "Show details"
  showDetails: 'Show details',

  // Original text: "Hide details"
  hideDetails: 'Hide details',

  // Original text: "No stats"
  poolNoStats: 'No stats',

  // Original text: "All hosts"
  poolAllHosts: 'All hosts',

  // Original text: "Add SR"
  addSrLabel: 'Add SR',

  // Original text: "Add VM"
  addVmLabel: 'Add VM',

  // Original text: "Add Host"
  addHostLabel: 'Add Host',

  // Original text: "This host needs to install {patches, number} patch{patches, plural, one {} other {es}} before it can be added to the pool. This operation may be long."
  hostNeedsPatchUpdate:
    'This host needs to install {patches, number} patch{patches, plural, one {} other {es}} before it can be added to the pool. This operation may be long.',

  // Original text: "This host cannot be added to the pool because it's missing some patches."
  hostNeedsPatchUpdateNoInstall: "This host cannot be added to the pool because it's missing some patches.",

  // Original text: "Adding host failed"
  addHostErrorTitle: 'Adding host failed',

  // Original text: "Host patches could not be homogenized."
  addHostNotHomogeneousErrorMessage: 'Host patches could not be homogenized.',

  // Original text: "Disconnect"
  disconnectServer: 'Disconnect',

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

  // Original text: "Force reboot"
  forceRebootHostLabel: 'Force reboot',

  // Original text: "Reboot"
  rebootHostLabel: 'Reboot',

  // Original text: "Error while restarting host"
  noHostsAvailableErrorTitle: 'Error while restarting host',

  // Original text: "Some VMs cannot be migrated before restarting this host. Please try force reboot."
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

  // Original text: "RAM Usage: {memoryUsed}"
  memoryHostState: 'RAM Usage: {memoryUsed}',

  // Original text: "Hardware"
  hardwareHostSettingsLabel: 'Hardware',

  // Original text: "Address"
  hostAddress: 'Address',

  // Original text: "Status"
  hostStatus: 'Status',

  // Original text: "Build number"
  hostBuildNumber: 'Build number',

  // Original text: "iSCSI name"
  hostIscsiName: 'iSCSI name',

  // Original text: "Version"
  hostXenServerVersion: 'Version',

  // Original text: "Enabled"
  hostStatusEnabled: 'Enabled',

  // Original text: "Disabled"
  hostStatusDisabled: 'Disabled',

  // Original text: "Power on mode"
  hostPowerOnMode: 'Power on mode',

  // Original text: "Host uptime"
  hostStartedSince: 'Host uptime',

  // Original text: "Toolstack uptime"
  hostStackStartedSince: 'Toolstack uptime',

  // Original text: "CPU model"
  hostCpusModel: 'CPU model',

  // Original text: "Core (socket)"
  hostCpusNumber: 'Core (socket)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: 'Manufacturer info',

  // Original text: "BIOS info"
  hostBiosinfo: 'BIOS info',

  // Original text: "Licence"
  licenseHostSettingsLabel: 'Licence',

  // Original text: "Type"
  hostLicenseType: 'Type',

  // Original text: "Socket"
  hostLicenseSocket: 'Socket',

  // Original text: "Expiry"
  hostLicenseExpiry: 'Expiry',

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

  // Original text: "Add a network"
  networkCreateButton: 'Add a network',

  // Original text: "Add a bonded network"
  networkCreateBondedButton: 'Add a bonded network',

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

  // Original text: "Status"
  pifStatusLabel: 'Status',

  // Original text: "Connected"
  pifStatusConnected: 'Connected',

  // Original text: "Disconnected"
  pifStatusDisconnected: 'Disconnected',

  // Original text: "No physical interface detected"
  pifNoInterface: 'No physical interface detected',

  // Original text: "This interface is currently in use"
  pifInUse: 'This interface is currently in use',

  // Original text: "Action"
  pifAction: 'Action',

  // Original text: "Default locking mode"
  defaultLockingMode: 'Default locking mode',

  // Original text: "Configure IP address"
  pifConfigureIp: 'Configure IP address',

  // Original text: "Invalid parameters"
  configIpErrorTitle: 'Invalid parameters',

  // Original text: "Static IP address"
  staticIp: 'Static IP address',

  // Original text: "Netmask"
  netmask: 'Netmask',

  // Original text: "DNS"
  dns: 'DNS',

  // Original text: "Gateway"
  gateway: 'Gateway',

  // Original text: "Add a storage"
  addSrDeviceButton: 'Add a storage',

  // Original text: "Name"
  srNameLabel: 'Name',

  // Original text: "Type"
  srType: 'Type',

  // Original text: "Action"
  pbdAction: 'Action',

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

  // Original text: "Applied date"
  patchApplied: 'Applied date',

  // Original text: "Size"
  patchSize: 'Size',

  // Original text: "Status"
  patchStatus: 'Status',

  // Original text: "Applied"
  patchStatusApplied: 'Applied',

  // Original text: "Missing patches"
  patchStatusNotApplied: 'Missing patches',

  // Original text: "No patch detected"
  patchNothing: 'No patch detected',

  // Original text: "Release date"
  patchReleaseDate: 'Release date',

  // Original text: "Guidance"
  patchGuidance: 'Guidance',

  // Original text: "Action"
  patchAction: 'Action',

  // Original text: "Applied patches"
  hostAppliedPatches: 'Applied patches',

  // Original text: "Missing patches"
  hostMissingPatches: 'Missing patches',

  // Original text: "Host up-to-date!"
  hostUpToDate: 'Host up-to-date!',

  // Original text: "Non-recommended patch install"
  installPatchWarningTitle: 'Non-recommended patch install',

  // Original text: "This will install a patch only on this host. This is NOT the recommended way: please go into the Pool patch view and follow instructions there. If you are sure about this, you can continue anyway"
  installPatchWarningContent:
    'This will install a patch only on this host. This is NOT the recommended way: please go into the Pool patch view and follow instructions there. If you are sure about this, you can continue anyway',

  // Original text: "Go to pool"
  installPatchWarningReject: 'Go to pool',

  // Original text: "Install"
  installPatchWarningResolve: 'Install',

  // Original text: "Refresh patches"
  refreshPatches: 'Refresh patches',

  // Original text: "Install pool patches"
  installPoolPatches: 'Install pool patches',

  // Original text: "Default SR"
  defaultSr: 'Default SR',

  // Original text: "Set as default SR"
  setAsDefaultSr: 'Set as default SR',

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

  // Original text: "halted"
  powerStateHalted: 'halted',

  // Original text: "running"
  powerStateRunning: '実行中',

  // Original text: "suspended"
  powerStateSuspended: 'suspended',

  // Original text: "No Xen tools detected"
  vmStatus: 'No Xen tools detected',

  // Original text: "No IPv4 record"
  vmName: 'No IPv4 record',

  // Original text: "No IP record"
  vmDescription: 'No IP record',

  // Original text: "Started {ago}"
  vmSettings: 'Started {ago}',

  // ----- VM home -----
  // Original text: "Current status:"
  vmCurrentStatus: 'Current status:',
  // Original text: "Not running"
  vmNotRunning: 'Not running',
  // Original text: "Halted {ago}"
  vmHaltedSince: 'Halted {ago}',

  // ----- VM general tab -----
  // Original text: "No Xen tools detected"
  noToolsDetected: '仮想マシン(VM)に準仮想ドライバ(Xen tools)がインストールされていません',
  // 'Management agent {version} detected
  managementAgentDetected: '管理エージェント {version} のインストールを認識中',
  managementAgentOutOfDate: '古いバージョン {version} の管理エージェントがインストールされています',
  managementAgentNotDetected: '管理エージェントがインストールされていません。',

  // Original text: "No IPv4 record"
  noIpv4Record: 'IPv4アドレスが検出されていません',

  // Original text: "No IP record"
  noIpRecord: 'IPアドレスが検出されていません',

  // Original text: "Started {ago}"
  started: '{ago}から起動中',

  // Original text: "Paravirtualization (PV)"
  paraVirtualizedMode: '準仮想化モード(PV)',

  // Original text: "Hardware virtualization (HVM)"
  hardwareVirtualizedMode: '完全仮想化モード(HVM)',

  // 'Hardware virtualization with paravirtualization drivers enabled (PVHVM)',
  hvmModeWithPvDriversEnabled: '準仮想化ドライバ(PV Driver)がインストール済の完全仮想モード(PVHVM)',

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

  // Original text: "Last week"
  statLastWeek: '1週間前まで表示',

  // Original text: "Last year"
  statLastYear: '1年前まで表示',

  // ----- VM console tab -----
  // Original text: "Copy"
  copyToClipboardLabel: 'コピー',

  // Original text: "Ctrl+Alt+Del"
  ctrlAltDelButtonLabel: 'Ctrl+Alt+Del',
  // 'Send Ctrl+Alt+Del to VM?',
  ctrlAltDelConfirmation: 'Ctrl+Alt+DelをVMに送信しますか？',
  disabledConsole: 'このVMのコンソールを無効化します',
  multilineCopyToClipboard: '複数行のクリップボードコピー',

  // Original text: "Tip:"
  tipLabel: 'Tip:',
  // Original text: "Hide infos"
  hideHeaderTooltip: 'Hide infos',
  // Original text: "Show infos"
  showHeaderTooltip: 'Show infos',
  // 'Send to clipboard',
  sendToClipboard: 'クリップボードに送信',
  // 'Connect using external SSH tool as root',
  sshRootTooltip: '外部SSHツールを用いてroot権限で接続',
  sshRootLabel: 'SSH',
  // 'Connect using external SSH tool as user…',
  sshUserTooltip: '外部SSHツールを用いてユーザ権限で接続',
  sshUserLabel: 'SSH as…',
  sshUsernameLabel: 'SSH ユーザID',
  remoteNeedClientTools: 'IPアドレスがクライアントツールから検出できません',
  rdp: 'RDP',
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

  // ----- VM disk tab -----
  rescanIsoSrs: '再検出(全てのISO SR)',

  // Original text: "Action"
  vdiAction: 'Action',

  // Original text: "Attach disk"
  vdiAttachDevice: '仮想ディスクの追加',

  // Original text: "New disk"
  vbdCreateDeviceButton: '新規仮想ディスクを作成',

  // Original text: "Boot order"
  vdiBootOrder: 'ブート順',

  // Original text: "Name"
  vdiNameLabel: '仮想ディスク名',

  // Original text: "Description"
  vdiNameDescription: '説明',

  // Original text: "Pool"
  vdiPool: 'Pool',

  // Original text: "Disconnect"
  vdiDisconnect: '仮想ディスクの切断',

  // Original text: "Tags"
  vdiTags: 'Tags',

  // Original text: "Size"
  vdiSize: 'Size',

  // Original text: "SR"
  vdiSr: 'SR',

  // Original text: "VM"
  vdiVm: 'VM',

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

  // Original text: "Remove VDI"
  vdiRemove: 'Remove VDI',

  // Original text: "No VDIs attached to Control Domain"
  noControlDomainVdis: 'No VDIs attached to Control Domain',

  // Original text: "Boot flag"
  vbdBootableStatus: 'Boot flag',

  // Original text: "Status"
  vbdStatus: 'Status',

  // Original text: "Connected"
  vbdStatusConnected: 'Connected',

  // Original text: "Disconnected"
  vbdStatusDisconnected: 'Disconnected',

  // Original text: "No disks"
  vbdNoVbd: 'No disks',

  // Original text: "Connect VBD"
  vbdConnect: 'Connect VBD',

  // Original text: "Disconnect VBD"
  vbdDisconnect: 'Disconnect VBD',

  // Original text: "Bootable"
  vbdBootable: 'Bootable',

  // Original text: "Readonly"
  vbdReadonly: 'Readonly',

  // Original text: "Action"
  vbdAction: 'Action',

  // Original text: "Create"
  vbdCreate: 'Create',

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

  // Original text: "New device"
  vifCreateDeviceButton: 'New device',

  // Original text: "No interface"
  vifNoInterface: 'No interface',

  // Original text: "Device"
  vifDeviceLabel: 'Device',

  // Original text: "MAC address"
  vifMacLabel: 'MAC address',

  // Original text: "MTU"
  vifMtuLabel: 'MTU',

  // Original text: "Network"
  vifNetworkLabel: 'Network',

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

  // Original text: "IP addresses"
  vifIpAddresses: 'IP addresses',

  // Original text: "Auto-generated if empty"
  vifMacAutoGenerate: 'Auto-generated if empty',

  // Original text: "Allowed IPs"
  vifAllowedIps: 'Allowed IPs',

  // Original text: "No IPs"
  vifNoIps: 'No IPs',

  // Original text: "Network locked"
  vifLockedNetwork: 'Network locked',

  // Original text: "Network locked and no IPs are allowed for this interface"
  vifLockedNetworkNoIps: 'Network locked and no IPs are allowed for this interface',

  // Original text: "Network not locked"
  vifUnLockedNetwork: 'Network not locked',

  // Original text: "Unknown network"
  vifUnknownNetwork: 'Unknown network',

  // Original text: "Action"
  vifAction: 'Action',

  // Original text: "Create"
  vifCreate: 'Create',

  // Original text: "No snapshots"
  noSnapshots: 'No snapshots',

  // Original text: "New snapshot"
  snapshotCreateButton: 'New snapshot',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: 'Just click on the snapshot button to create one!',

  // Original text: "Revert VM to this snapshot"
  revertSnapshot: 'Revert VM to this snapshot',

  // Original text: "Remove this snapshot"
  deleteSnapshot: 'Remove this snapshot',

  // Original text: "Create a VM from this snapshot"
  copySnapshot: 'Create a VM from this snapshot',

  // Original text: "Export this snapshot"
  exportSnapshot: 'Export this snapshot',

  // Original text: "Creation date"
  snapshotDate: 'Creation date',

  // Original text: "Name"
  snapshotName: 'Name',

  // Original text: "Name"
  snapshotDescription: 'Name',

  // Original text: "Action"
  snapshotAction: 'Action',

  // Original text: "Quiesced snapshot"
  snapshotQuiesce: 'Quiesced snapshot',

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

  // Original text: "Remove"
  vmRemoveButton: 'Remove',

  // Original text: "Convert"
  vmConvertButton: 'Convert',

  // Original text: "Xen settings"
  xenSettingsLabel: 'Xen settings',

  // Original text: "Guest OS"
  guestOsLabel: 'Guest OS',

  // Original text: "Misc"
  miscLabel: 'Misc',

  // Original text: "UUID"
  uuid: 'UUID',

  // Original text: "Virtualization mode"
  virtualizationMode: 'Virtualization mode',

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

  // Original text: "Xen tools status"
  xenToolsStatus: 'Xen tools status',

  // Original text: "{status}"
  xenToolsStatusValue: '{status}',

  // Original text: "OS name"
  osName: 'OS name',

  // Original text: "OS kernel"
  osKernel: 'OS kernel',

  // Original text: "Auto power on"
  autoPowerOn: 'Auto power on',

  // Original text: "HA"
  ha: 'HA',

  // Original text: "Affinity host"
  vmAffinityHost: 'Affinity host',

  // Original text: "VGA"
  vmVga: 'VGA',

  // Original text: "Video RAM"
  vmVideoram: 'Video RAM',

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

  // Original text: "CPU limits"
  vmCpuLimitsLabel: 'CPU limits',

  // Original text: "Topology"
  vmCpuTopology: 'Topology',

  // Original text: "Default behavior"
  vmChooseCoresPerSocket: 'Default behavior',

  // Original text: "{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket"
  vmSocketsWithCoresPerSocket:
    '{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket',

  // Original text: "Incorrect cores per socket value"
  vmCoresPerSocketIncorrectValue: 'Incorrect cores per socket value',

  // Original text: "Please change the selected value to fix it."
  vmCoresPerSocketIncorrectValueSolution: 'Please change the selected value to fix it.',

  // Original text: "Memory limits (min/max)"
  vmMemoryLimitsLabel: 'Memory limits (min/max)',

  // Original text: "vCPUs max:"
  vmMaxVcpus: 'vCPUs max:',

  // Original text: "Memory max:"
  vmMaxRam: 'Memory max:',

  // Original text: "Long click to add a name"
  vmHomeNamePlaceholder: 'Long click to add a name',

  // Original text: "Long click to add a description"
  vmHomeDescriptionPlaceholder: 'Long click to add a description',

  // Original text: "Click to add a name"
  vmViewNamePlaceholder: 'Click to add a name',

  // Original text: "Click to add a description"
  vmViewDescriptionPlaceholder: 'Click to add a description',

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

  // Original text: "Pool{pools, plural, one {} other {s}}"
  poolPanel: 'プール数',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'ホスト数',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: 'VM数',

  // Original text: "RAM Usage:"
  memoryStatePanel: 'メモリ利用量:',

  // Original text: "CPUs Usage"
  cpuStatePanel: 'CPU利用量',

  // Original text: "VMs Power state"
  vmStatePanel: 'VMの稼働と停止率',

  // Original text: "Pending tasks"
  taskStatePanel: '実行待ちタスク数',

  // Original text: "Users"
  usersStatePanel: 'ユーザ数',

  // Original text: "Storage state"
  srStatePanel: 'Storage state',

  // Original text: "{usage} (of {total})"
  ofUsage: '{usage} (of {total})',

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

  // Original text: "{running, number} running ({halted, number} halted)"
  vmsStates: '可動中：{running, number} 停止中：{halted, number}',

  // Original text: "Clear selection"
  dashboardStatsButtonRemoveAll: 'Clear selection',

  // Original text: "Add all hosts"
  dashboardStatsButtonAddAllHost: 'Add all hosts',

  // Original text: "Add all VMs"
  dashboardStatsButtonAddAllVM: 'Add all VMs',

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

  // Original text: "Coming soon!"
  comingSoon: 'Coming soon!',

  // Original text: "Orphaned snapshot VDIs"
  orphanedVdis: 'Orphaned snapshot VDIs',

  // Original text: "Orphaned VMs snapshot"
  orphanedVms: 'Orphaned VMs snapshot',

  // Original text: "No orphans"
  noOrphanedObject: 'No orphans',

  // Original text: "Remove all orphaned snapshot VDIs"
  removeAllOrphanedObject: 'Remove all orphaned snapshot VDIs',

  // Original text: "VDIs attached to Control Domain"
  vdisOnControlDomain: 'VDIs attached to Control Domain',

  // Original text: "Name"
  vmNameLabel: 'Name',

  // Original text: "Description"
  vmNameDescription: 'Description',

  // Original text: "Resident on"
  vmContainer: 'Resident on',

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

  // Original text: "Remove all alarms"
  alarmRemoveAll: 'Remove all alarms',

  // Original text: "{used}% used ({free} left)"
  spaceLeftTooltip: '{used}% used ({free} left)',

  // Original text: "Create a new VM on {select}"
  newVmCreateNewVmOn: '仮想マシン(VM)の新規作成 プール：{select}',

  // Original text: "Create a new VM on {select1} or {select2}"
  newVmCreateNewVmOn2: '仮想マシン(VM)の新規作成 プール： {select1} あるいは {select2}',

  // Original text: "You have no permission to create a VM"
  newVmCreateNewVmNoPermission: 'VM作成権限がありません。',

  // Original text: "Infos"
  newVmInfoPanel: '仮想マシン(VM)情報',

  // Original text: "Name"
  newVmNameLabel: '仮想マシン(VM)名',

  // Original text: "Template"
  newVmTemplateLabel: 'テンプレート',

  // Original text: "Description"
  newVmDescriptionLabel: 'VMの説明文',

  // Original text: "Performances"
  newVmPerfPanel: 'スペック',

  // Original text: "vCPUs"
  newVmVcpusLabel: 'vCPU数',

  // Original text: "RAM"
  newVmRamLabel: 'RAM',

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

  // Original text: "Config drive"
  newVmConfigDrive: 'Config drive',

  // Original text: "Custom config"
  newVmCustomConfig: 'Custom config',

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

  // Original text: "Select a resource set:"
  newVmSelectResourceSet: 'Select a resource set:',

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

  // Original text: "Resource sets"
  resourceSets: 'リソースセット',

  // Original text: "No resource sets."
  noResourceSets: 'リソースセット外',

  // Original text: "Loading resource sets"
  loadingResourceSets: 'リソースセットの読み込み中',

  // Original text: "Resource set name"
  resourceSetName: 'リソースセット名',

  // Original text: "Recompute all limits"
  recomputeResourceSets: 'リソースセットの再計算',

  // Original text: "Save"
  saveResourceSet: '保存',

  // Original text: "Reset"
  resetResourceSet: '元に戻す',

  // Original text: "Edit"
  editResourceSet: '編集',

  // Original text: "Delete"
  deleteResourceSet: '削除',

  // Original text: "Delete resource set"
  deleteResourceSetWarning: 'リソースセットの消去',

  // Original text: "Are you sure you want to delete this resource set?"
  deleteResourceSetQuestion: '本当にリソースセットを消してもよろしいですか？',

  // Original text: "Missing objects:"
  resourceSetMissingObjects: '存在しないオブジェクト:',

  // Original text: "vCPUs"
  resourceSetVcpus: 'vCPU',

  // Original text: "Memory"
  resourceSetMemory: 'メモリ(RAM)',

  // Original text: "Storage"
  resourceSetStorage: 'ストレージ',

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

  // Original text: "Maximum RAM (GiB)"
  maxRam: '合計最大メモリ(RAM GiB)',

  // Original text: "Maximum disk space"
  maxDiskSpace: '合計最大仮想ディスク容量',

  // Original text: "IP pool"
  ipPool: 'IP予約領域',

  // Original text: "Quantity"
  quantity: 'Quantity',

  // Original text: "No limits."
  noResourceSetLimits: 'No limits.',

  // Original text: "Total:"
  totalResource: '合計:',

  // Original text: "Remaining:"
  remainingResource: '残り:',

  // Original text: "Used:"
  usedResource: '使用済:',

  // Original text: "New"
  resourceSetNew: '新規リソースセット',

  // Original text: "Drop OVA or XVA files here to import Virtual Machines."
  importVmsList: 'OVA、あるいはXVAファイルをドラッグアンドドロップしてください。',

  // Original text: "No selected VMs."
  noSelectedVms: 'VMが選択されていません。',

  // Original text: "To Pool:"
  vmImportToPool: '作成先プール:',

  // Original text: "To SR:"
  vmImportToSr: '作成先SR:',

  // Original text: "VM{nVms, plural, one {} other {s}}  to import"
  vmsToImport: '仮想マシンのインポート',

  // Original text: "Reset"
  importVmsCleanList: 'Reset',

  // Original text: "VM import success"
  vmImportSuccess: '仮想マシン(VM)のインポートに成功しました。',

  // Original text: "VM import failed"
  vmImportFailed: '仮想マシン(VM)のインポートに失敗しました。',

  // Original text: "Import starting…"
  startVmImport: '仮想マシン(VM)インポート開始……',

  // Original text: "Export starting…"
  startVmExport: '仮想マシン(VM)エクスポート開始……',

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

  // Original text: "Please to check and/or modify the VM configuration."
  vmImportConfigAlert: 'Please to check and/or modify the VM configuration.',

  // Original text: "No pending tasks"
  noTasks: 'No pending tasks',

  // Original text: "Currently, there are not any pending XenServer tasks"
  xsTasks: 'Currently, there are not any pending XenServer tasks',

  // Original text: "Schedules"
  backupSchedules: 'Schedules',

  // Original text: "Get remote"
  getRemote: 'Get remote',

  // Original text: "List Remote"
  listRemote: 'List Remote',

  // Original text: "simple"
  simpleBackup: 'simple',

  // Original text: "delta"
  delta: 'delta',

  // Original text: "Restore Backups"
  restoreBackups: 'Restore Backups',

  // Original text: "Click on a VM to display restore options"
  restoreBackupsInfo: 'Click on a VM to display restore options',

  // Original text: "Enabled"
  remoteEnabled: 'Enabled',

  // Original text: "Error"
  remoteError: 'Error',

  // Original text: "No backup available"
  noBackup: 'No backup available',

  // Original text: "VM Name"
  backupVmNameColumn: 'VM Name',

  // Original text: "Tags"
  backupTags: 'Tags',

  // Original text: "Last Backup"
  lastBackupColumn: 'Last Backup',

  // Original text: "Available Backups"
  availableBackupsColumn: 'Available Backups',

  // Original text: "Missing parameters"
  backupRestoreErrorTitle: 'Missing parameters',

  // Original text: "Choose a SR and a backup"
  backupRestoreErrorMessage: 'Choose a SR and a backup',

  // Original text: "Select default SR…"
  backupRestoreSelectDefaultSr: 'Select default SR…',

  // Original text: "Choose a SR for each VDI"
  backupRestoreChooseSrForEachVdis: 'Choose a SR for each VDI',

  // Original text: "VDI"
  backupRestoreVdiLabel: 'VDI',

  // Original text: "SR"
  backupRestoreSrLabel: 'SR',

  // Original text: "Display backups"
  displayBackup: 'Display backups',

  // Original text: "Import VM"
  importBackupTitle: 'Import VM',

  // Original text: "Starting your backup import"
  importBackupMessage: 'Starting your backup import',

  // Original text: "VMs to backup"
  vmsToBackup: 'VMs to backup',

  // Original text: "List remote backups"
  listRemoteBackups: 'List remote backups',

  // Original text: "Restore backup files"
  restoreFiles: 'Restore backup files',

  // Original text: "Invalid options"
  restoreFilesError: 'Invalid options',

  // Original text: "Restore file from {name}"
  restoreFilesFromBackup: 'Restore file from {name}',

  // Original text: "Select a backup…"
  restoreFilesSelectBackup: 'Select a backup…',

  // Original text: "Select a disk…"
  restoreFilesSelectDisk: 'Select a disk…',

  // Original text: "Select a partition…"
  restoreFilesSelectPartition: 'Select a partition…',

  // Original text: "Folder path"
  restoreFilesSelectFolderPath: 'Folder path',

  // Original text: "Select a file…"
  restoreFilesSelectFiles: 'Select a file…',

  // Original text: "Content not found"
  restoreFileContentNotFound: 'Content not found',

  // Original text: "No files selected"
  restoreFilesNoFilesSelected: 'No files selected',

  // Original text: "Selected files ({files}):"
  restoreFilesSelectedFiles: 'Selected files ({files}):',

  // Original text: "Error while scanning disk"
  restoreFilesDiskError: 'Error while scanning disk',

  // Original text: "Select all this folder's files"
  restoreFilesSelectAllFiles: "Select all this folder's files",

  // Original text: "Unselect all files"
  restoreFilesUnselectAll: 'Unselect all files',

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

  // Original text: "{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information"
  failedVmsErrorMessage:
    '{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information',

  // Original text: "Start failed"
  failedVmsErrorTitle: 'Start failed',

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

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'Restart VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: 'Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Snapshot VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to snapshot {vms, number} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage: 'Are you sure you want to snapshot {vms, number} VM{vms, plural, one {} other {s}}?',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Delete VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage:
    'Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED',

  // Original text: "Delete VM"
  deleteVmModalTitle: 'Delete VM',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage: 'Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED',

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

  // Original text: "No default SR"
  migrateVmNoDefaultSrError: 'No default SR',

  // Original text: "Default SR not connected to host"
  migrateVmNotConnectedDefaultSrError: 'Default SR not connected to host',

  // Original text: "For each VDI, select an SR:"
  chooseSrForEachVdisModalSelectSr: 'For each VDI, select an SR:',

  // Original text: "Select main SR…"
  chooseSrForEachVdisModalMainSr: 'Select main SR…',

  // Original text: "VDI"
  chooseSrForEachVdisModalVdiLabel: 'VDI',

  // Original text: "SR*"
  chooseSrForEachVdisModalSrLabel: 'SR*',

  // Original text: "* optional"
  optionalEntry: '* optional',

  // Original text: "Delete VDI"
  deleteVdiModalTitle: 'Delete VDI',

  // Original text: "Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST"
  deleteVdiModalMessage: 'Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST',

  // Original text: "Revert your VM"
  revertVmModalTitle: 'Revert your VM',

  // Original text: "Delete snapshot"
  deleteSnapshotModalTitle: 'Delete snapshot',

  // Original text: "Are you sure you want to delete this snapshot?"
  deleteSnapshotModalMessage: 'Are you sure you want to delete this snapshot?',

  // Original text: "Are you sure you want to revert this VM to the snapshot state? This operation is irreversible."
  revertVmModalMessage:
    'Are you sure you want to revert this VM to the snapshot state? This operation is irreversible.',

  // Original text: "Snapshot before"
  revertVmModalSnapshotBefore: 'Snapshot before',

  // Original text: "Import a {name} Backup"
  importBackupModalTitle: 'Import a {name} Backup',

  // Original text: "Start VM after restore"
  importBackupModalStart: 'Start VM after restore',

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: 'Select your backup…',

  // Original text: "Are you sure you want to remove all orphaned snapshot VDIs?"
  removeAllOrphanedModalWarning: 'Are you sure you want to remove all orphaned snapshot VDIs?',

  // Original text: "Remove all logs"
  removeAllLogsModalTitle: 'Remove all logs',

  // Original text: "Are you sure you want to remove all logs?"
  removeAllLogsModalWarning: 'Are you sure you want to remove all logs?',

  // Original text: "This operation is definitive."
  definitiveMessageModal: 'This operation is definitive.',

  // Original text: "Previous SR Usage"
  existingSrModalTitle: 'Previous SR Usage',

  // Original text: "This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingSrModalText:
    'This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation.',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Previous LUN Usage',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
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

  // Original text: "Label"
  serverLabel: 'Label',

  // Original text: "Host"
  serverHost: 'Host',

  // Original text: "Username"
  serverUsername: 'Username',

  // Original text: "Password"
  serverPassword: 'Password',

  // Original text: "Action"
  serverAction: 'Action',

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

  // Original text: "Connecting…"
  serverConnecting: 'Connecting…',

  // Original text: "Authentication error"
  serverAuthFailed: 'Authentication error',

  // Original text: "Unknown error"
  serverUnknownError: 'Unknown error',

  // Original text: "Invalid self-signed certificate"
  serverSelfSignedCertError: 'Invalid self-signed certificate',

  // Original text: "Do you want to accept self-signed certificate for this server even though it would decrease security?"
  serverSelfSignedCertQuestion:
    'Do you want to accept self-signed certificate for this server even though it would decrease security?',

  // Original text: "Copy VM"
  copyVm: 'Copy VM',

  // Original text: "Are you sure you want to copy this VM to {SR}?"
  copyVmConfirm: 'Are you sure you want to copy this VM to {SR}?',

  // Original text: "Name"
  copyVmName: 'Name',

  // Original text: "Name pattern"
  copyVmNamePattern: 'Name pattern',

  // Original text: "If empty: name of the copied VM"
  copyVmNamePlaceholder: 'If empty: name of the copied VM',

  // Original text: "e.g.: \"\\{name\\}_COPY\""
  copyVmNamePatternPlaceholder: 'e.g.: "\\{name\\}_COPY"',

  // Original text: "Select SR"
  copyVmSelectSr: 'Select SR',

  // Original text: "Use compression"
  copyVmCompress: 'Use compression',

  // Original text: "No target SR"
  copyVmsNoTargetSr: 'No target SR',

  // Original text: "A target SR is required to copy a VM"
  copyVmsNoTargetSrMessage: 'A target SR is required to copy a VM',

  // Original text: "Detach host"
  detachHostModalTitle: 'Detach host',

  // Original text: "Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST."
  detachHostModalMessage:
    'Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST.',

  // Original text: "Detach"
  detachHost: 'Detach',

  // Original text: "Forget host"
  forgetHostModalTitle: 'Forget host',

  // Original text: "Are you sure you want to forget {host} from its pool? Be sure this host can't be back online, or use detach instead."
  forgetHostModalMessage:
    "Are you sure you want to forget {host} from its pool? Be sure this host can't be back online, or use detach instead.",

  // Original text: "Forget"
  forgetHost: 'Forget',

  // Original text: "Create network"
  newNetworkCreate: 'Create network',

  // Original text: "Create bonded network"
  newBondedNetworkCreate: 'Create bonded network',

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

  // Original text: "Name required"
  newNetworkNoNameErrorTitle: 'Name required',

  // Original text: "A name is required to create a network"
  newNetworkNoNameErrorMessage: 'A name is required to create a network',

  // Original text: "Bond mode"
  newNetworkBondMode: 'Bond mode',

  // Original text: "Delete network"
  deleteNetwork: 'Delete network',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: 'Are you sure you want to delete this network?',

  // Original text: "This network is currently in use"
  networkInUse: 'This network is currently in use',

  // Original text: "Bonded"
  pillBonded: 'Bonded',

  // Original text: "Host"
  addHostSelectHost: 'Host',

  // Original text: "No host"
  addHostNoHost: 'No host',

  // Original text: "No host selected to be added"
  addHostNoHostMessage: 'No host selected to be added',

  // Original text: "Xen Orchestra"
  xenOrchestra: 'Xen Orchestra',

  // Original text: "No pro support provided!"
  noProSupport: 'No pro support provided!',

  // Original text: "Use in production at your own risks"
  noProductionUse: 'Use in production at your own risks',

  // Original text: "You can download our turnkey appliance at {website}"
  downloadXoaFromWebsite: 'You can download our turnkey appliance at {website}',

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

  // Original text: "Updates"
  updateTitle: 'Updates',

  // Original text: "Registration"
  registration: 'Registration',

  // Original text: "Trial"
  trial: 'Trial',

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

  // Original text: "Update"
  update: 'Update',

  // Original text: "Refresh"
  refresh: 'Refresh',

  // Original text: "Upgrade"
  upgrade: 'Upgrade',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'No updater available for Community Edition',

  // Original text: "Please consider subscribe and try it with all features for free during 15 days on {link}."
  considerSubscribe: 'Please consider subscribe and try it with all features for free during 15 days on {link}.',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning:
    'Manual update could break your current installation due to dependencies issues, do it with caution',

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

  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Xen Orchestra (ソースコードベースの開発版)',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1:
    'このバージョンは、ソースコードよりインストールされた開発版です！ 個人や、非営利での利用に最適です。',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: '企業利用の場合、プロサポートが含まれるアプライアンスを利用することを推奨します。:',

  // Original text: "This version is not bundled with any support nor updates. Use it with caution for critical tasks."
  disclaimerText3:
    'このバージョンは開発中のものであり、サポート、アップデートはできません。クリティカルな用途には、細心の注意を払ってご利用ください。',

  // Why do I see this message?
  disclaimerText4: 'なぜこのメッセージが表示されますか？',

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

  // Original text: "Connected"
  pifConnected: 'Connected',

  // Original text: "Disconnected"
  pifDisconnected: 'Disconnected',

  // Original text: "Physically connected"
  pifPhysicallyConnected: 'Physically connected',

  // Original text: "Physically disconnected"
  pifPhysicallyDisconnected: 'Physically disconnected',

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

  // 'Forget all authentication tokens'
  forgetTokens: '全ての認証トークン破棄',

  // 'This prevents authenticating with existing tokens but the one used by the current session'
  forgetTokensExplained: '現在のセッションで利用している認証トークン以外の既存の認証トークンを消去します。',

  // 'Successfully forgot authentication tokens'
  forgetTokensSuccess: '認証トークンの破棄に成功しました。',

  // 'Error while forgetting authentication tokens'
  forgetTokensError: '認証トークンの破棄の最中にエラーが発生しました。',

  // Original text: "SSH keys"
  sshKeys: 'SSH keys',

  // Original text: "New SSH key"
  newSshKey: 'New SSH key',

  // Original text: "Delete"
  deleteSshKey: 'Delete',

  // Original text: "No SSH keys"
  noSshKeys: 'No SSH keys',

  // Original text: "New SSH key"
  newSshKeyModalTitle: 'New SSH key',

  // Original text: "Invalid key"
  sshKeyErrorTitle: 'Invalid key',

  // Original text: "An SSH key requires both a title and a key."
  sshKeyErrorMessage: 'An SSH key requires both a title and a key.',

  // Original text: "Title"
  title: 'Title',

  // Original text: "Key"
  key: 'Key',

  // Original text: "Delete SSH key"
  deleteSshKeyConfirm: 'Delete SSH key',

  // Original text: "Are you sure you want to delete the SSH key {title}?"
  deleteSshKeyConfirmMessage: 'Are you sure you want to delete the SSH key {title}?',

  // 'Add OTP authentication'
  addOtpConfirm: 'ワンタイムパスワード(OTP)認証を追加します',

  // 'To enable OTP authentication, add it to your application and then enter the current password to validate.',
  addOtpConfirmMessage:
    'ワンタイムパスワード(OTP)認証を有効するには、アプリにOTPを追加し、正しいパスワードを入力する必要があります。',
  addOtpInvalidPassword: 'パスワードが間違っています。',
  removeOtpConfirm: 'OTP認証を無効化',
  removeOtpConfirmMessage: 'OTP認証を無効化してもよいですか？',
  OtpAuthentication: 'OTP認証設定',

  // Original text: "Others"
  others: 'Others',

  // Original text: "Loading logs…"
  loadingLogs: 'Loading logs…',

  // Original text: "User"
  logUser: 'User',

  // Original text: "Method"
  logMethod: 'Method',

  // Original text: "Params"
  logParams: 'Params',

  // Original text: "Message"
  logMessage: 'Message',

  // Original text: "Error"
  logError: 'Error',

  // Original text: "Display details"
  logDisplayDetails: 'Display details',

  // Original text: "Date"
  logTime: 'Date',

  // Original text: "No stack trace"
  logNoStackTrace: 'No stack trace',

  // Original text: "No params"
  logNoParams: 'No params',

  // Original text: "Delete log"
  logDelete: 'Delete log',

  // Original text: "Delete all logs"
  logDeleteAll: 'Delete all logs',

  // Original text: "Delete all logs"
  logDeleteAllTitle: 'Delete all logs',

  // Original text: "Are you sure you want to delete all the logs?"
  logDeleteAllMessage: 'Are you sure you want to delete all the logs?',

  // Original text: "Click to enable"
  logIndicationToEnable: 'Click to enable',

  // Original text: "Click to disable"
  logIndicationToDisable: 'Click to disable',

  // Original text: "Report a bug"
  reportBug: 'Report a bug',

  // Original text: "Name"
  ipPoolName: 'Name',

  // Original text: "IPs"
  ipPoolIps: 'IPs',

  // Original text: "IPs (e.g.: 1.0.0.12-1.0.0.17;1.0.0.23)"
  ipPoolIpsPlaceholder: 'IPs (e.g.: 1.0.0.12-1.0.0.17;1.0.0.23)',

  // Original text: "Networks"
  ipPoolNetworks: 'Networks',

  // Original text: "No IP pools"
  ipsNoIpPool: 'No IP pools',

  // Original text: "Create"
  ipsCreate: 'Create',

  // Original text: "Delete all IP pools"
  ipsDeleteAllTitle: 'Delete all IP pools',

  // Original text: "Are you sure you want to delete all the IP pools?"
  ipsDeleteAllMessage: 'Are you sure you want to delete all the IP pools?',

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

  // Original text: "Go to hosts list"
  shortcut_GO_TO_HOSTS: 'Go to hosts list',

  // Original text: "Go to pools list"
  shortcut_GO_TO_POOLS: 'Go to pools list',

  // Original text: "Go to VMs list"
  shortcut_GO_TO_VMS: 'Go to VMs list',

  // Original text: "Go to SRs list"
  shortcut_GO_TO_SRS: 'Go to SRs list',

  // Original text: "Create a new VM"
  shortcut_CREATE_VM: 'Create a new VM',

  // Original text: "Unfocus field"
  shortcut_UNFOCUS: 'Unfocus field',

  // Original text: "Show shortcuts key bindings"
  shortcut_HELP: 'Show shortcuts key bindings',

  // Original text: "Home"
  shortcut_Home: 'Home',

  // Original text: "Focus search bar"
  shortcut_SEARCH: 'Focus search bar',

  // Original text: "Next item"
  shortcut_NAV_DOWN: 'Next item',

  // Original text: "Previous item"
  shortcut_NAV_UP: 'Previous item',

  // Original text: "Select item"
  shortcut_SELECT: 'Select item',

  // Original text: "Open"
  shortcut_JUMP_INTO: 'Open',

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

  // Original text: "No config file selected"
  noConfigFile: 'No config file selected',

  // Original text: "Try dropping a config file here, or click to select a config file to upload."
  importTip: 'Try dropping a config file here, or click to select a config file to upload.',

  // Original text: "Config"
  config: 'Config',

  // Original text: "Import"
  importConfig: 'Import',

  // Original text: "Config file successfully imported"
  importConfigSuccess: 'Config file successfully imported',

  // Original text: "Error while importing config file"
  importConfigError: 'Error while importing config file',

  // Original text: "Export"
  exportConfig: 'Export',

  // Original text: "Download current config"
  downloadConfig: 'Download current config',

  // Original text: "No config import available for Community Edition"
  noConfigImportCommunity: 'No config import available for Community Edition',

  // Original text: "Reconnect all hosts"
  srReconnectAllModalTitle: 'Reconnect all hosts',

  // Original text: "This will reconnect this SR to all its hosts."
  srReconnectAllModalMessage: 'This will reconnect this SR to all its hosts.',

  // Original text: "This will reconnect each selected SR to its host (local SR) or to every hosts of its pool (shared SR)."
  srsReconnectAllModalMessage:
    'This will reconnect each selected SR to its host (local SR) or to every hosts of its pool (shared SR).',

  // Original text: "Disconnect all hosts"
  srDisconnectAllModalTitle: 'Disconnect all hosts',

  // Original text: "This will disconnect this SR from all its hosts."
  srDisconnectAllModalMessage: 'This will disconnect this SR from all its hosts.',

  // Original text: "This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR)."
  srsDisconnectAllModalMessage:
    'This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR).',

  // Original text: "Forget SR"
  srForgetModalTitle: 'Forget SR',

  // Original text: "Forget selected SRs"
  srsForgetModalTitle: 'Forget selected SRs',

  // Original text: "Are you sure you want to forget this SR? VDIs on this storage won't be removed."
  srForgetModalMessage: "Are you sure you want to forget this SR? VDIs on this storage won't be removed.",

  // Original text: "Are you sure you want to forget all the selected SRs? VDIs on these storages won't be removed."
  srsForgetModalMessage:
    "Are you sure you want to forget all the selected SRs? VDIs on these storages won't be removed.",

  // Original text: "Disconnected"
  srAllDisconnected: 'Disconnected',

  // Original text: "Partially connected"
  srSomeConnected: 'Partially connected',

  // Original text: "Connected"
  srAllConnected: 'Connected',

  // Original text: "XOSAN"
  xosanTitle: 'XOSAN',

  // Original text: "Xen Orchestra SAN SR"
  xosanSrTitle: 'Xen Orchestra SAN SR',

  // Original text: "Select local SRs (lvm)"
  xosanAvailableSrsTitle: 'Select local SRs (lvm)',

  // Original text: "Suggestions"
  xosanSuggestions: 'Suggestions',

  // Original text: "Name"
  xosanName: 'Name',

  // Original text: "Host"
  xosanHost: 'Host',

  // Original text: "Hosts"
  xosanHosts: 'Hosts',

  // Original text: "Volume ID"
  xosanVolumeId: 'Volume ID',

  // Original text: "Size"
  xosanSize: 'Size',

  // Original text: "Used space"
  xosanUsedSpace: 'Used space',

  // Original text: "XOSAN pack needs to be installed on each host of the pool."
  xosanNeedPack: 'XOSAN pack needs to be installed on each host of the pool.',

  // Original text: "Install it now!"
  xosanInstallIt: 'Install it now!',

  // Original text: "Some hosts need their toolstack to be restarted before you can create an XOSAN"
  xosanNeedRestart: 'Some hosts need their toolstack to be restarted before you can create an XOSAN',

  // Original text: "Restart toolstacks"
  xosanRestartAgents: 'Restart toolstacks',

  // Original text: "Pool master is not running"
  xosanMasterOffline: 'Pool master is not running',

  // Original text: "Install XOSAN pack on {pool}"
  xosanInstallPackTitle: 'Install XOSAN pack on {pool}',

  // Original text: "Select at least 2 SRs"
  xosanSelect2Srs: 'Select at least 2 SRs',

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

  // Original text: "Installing XOSAN. Please wait…"
  xosanInstalling: 'Installing XOSAN. Please wait…',

  // Original text: "No XOSAN available for Community Edition"
  xosanCommunity: 'No XOSAN available for Community Edition',

  // Original text: "Install cloud plugin first"
  xosanInstallCloudPlugin: 'Install cloud plugin first',

  // Original text: "Load cloud plugin first"
  xosanLoadCloudPlugin: 'Load cloud plugin first',

  // Original text: "Loading…"
  xosanLoading: 'Loading…',

  // Original text: "XOSAN is not available at the moment"
  xosanNotAvailable: 'XOSAN is not available at the moment',

  // Original text: "Register for the XOSAN beta"
  xosanRegisterBeta: 'Register for the XOSAN beta',

  // Original text: "You have successfully registered for the XOSAN beta. Please wait until your request has been approved."
  xosanSuccessfullyRegistered:
    'You have successfully registered for the XOSAN beta. Please wait until your request has been approved.',

  // Original text: "Install XOSAN pack on these hosts:"
  xosanInstallPackOnHosts: 'Install XOSAN pack on these hosts:',

  // Original text: "Install {pack} v{version}?"
  xosanInstallPack: 'Install {pack} v{version}?',

  // Original text: "No compatible XOSAN pack found for your XenServer versions."
  xosanNoPackFound: 'No compatible XOSAN pack found for your XenServer versions.',

  // Original text: "At least one of these version requirements must be satisfied by all the hosts in this pool:"
  xosanPackRequirements: 'At least one of these version requirements must be satisfied by all the hosts in this pool:',
}
