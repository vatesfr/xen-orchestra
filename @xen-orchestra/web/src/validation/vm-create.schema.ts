import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'

export const createVMSchema = (maxRam: number, maxVcpu: number) =>
  toTypedSchema(
    yup.object({
      vm_name: yup.string().required('VM Name is required'),
      ram: yup
        .number()
        .min(1, 'RAM must be at least 1')
        .max(maxRam, `RAM cannot exceed ${maxRam} GB`)
        .required('RAM is required'),
      vCpu: yup
        .number()
        .min(1, 'vCPU must be at least 1')
        .max(maxVcpu, `vCpu cannot exceed ${maxVcpu}`)
        .required('vCPU is required'),
    })
  )
