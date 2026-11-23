import BackupRepositoryS3Card from '@/modules/backup-repository/components/list/panel/cards/BackupRepositoryS3Card.vue'
import { BR_S3_URL, itShowsBrUrl } from '@/test/br-url-card.ts'
import { createS3Url } from '@/test/create-br-url.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { t } from '@/test/i18n.ts'

const mountCard = itShowsBrUrl(BackupRepositoryS3Card, 'panel', BR_S3_URL)

it('truncates a long access key id but offers to copy it in full', () => {
  const username = 'AKIAIOSFODNN7EXAMPLE1234'
  const wrapper = mountCard(createS3Url({ username }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('access-key-id')]: `${username.slice(0, 20)}…` })
  expect(findCardCopiedValues(wrapper)).toContain(username)
})
