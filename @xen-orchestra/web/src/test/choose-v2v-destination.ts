import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { V2vDestinationFormData } from '@/modules/v2v/form/use-v2v-destination-form.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { nextTick } from 'vue'

type DestinationForm = { formData: V2vDestinationFormData }

// The SR and the network are prefilled once the pool change has been handled
export async function chooseV2vDestinationPool(form: DestinationForm, poolId: FrontXoPool['id']) {
  form.formData.pool = poolId
  await nextTick()
}

// The template is the only default with no prefill
export async function chooseCompleteV2vDestination(
  form: DestinationForm,
  poolId: FrontXoPool['id'],
  templateId: FrontXoVmTemplate['id']
) {
  await chooseV2vDestinationPool(form, poolId)
  form.formData.template = templateId
}
