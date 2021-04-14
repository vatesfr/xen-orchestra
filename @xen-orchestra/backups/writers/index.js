Object.assign(
  exports,
  require('./_ContinuousReplicationWriter'),
  require('./_DeltaBackupWriter'),
  require('./_DisasterRecoveryWriter'),
  require('./_FullBackupWriter')
 )
