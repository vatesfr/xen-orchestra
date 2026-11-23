import BackupRepositoryBenchmarkButton from '@/modules/backup-repository/components/actions/benchmark/BackupRepositoryBenchmarkButton.vue'
import { createBr } from '@/test/create-br.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import { benchmarkJobMock } from '@/test/mock-backup-repository-benchmark-job.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'

const mountButton = itRunsJobFromButton(BackupRepositoryBenchmarkButton, {
  targetProp: 'br',
  createTarget: createBr,
  getButton: wrapper => wrapper.getComponent(UiButtonIcon),
  job: benchmarkJobMock,
  // A spinner shows it busy
  expectBusy: button => expect(button.props('icon')).toBe('fa:spinner'),
})

it('shows a scan icon while the job is not running', () => {
  expect(mountButton().getComponent(UiButtonIcon).props('icon')).toBe('action:scan')
})
