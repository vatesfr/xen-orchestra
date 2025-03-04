<template>
  <div style="display: flex; flex-direction: column; gap: 2rem; padding: 2rem; max-width: 50rem">
    <form style="display: flex; flex-direction: column; gap: 2rem" @submit="onSubmit()">
      <template v-for="(config, name) in formConfig" :key="name">
        <UiTextarea v-if="config.type === 'textarea'" v-bind="config.bindings" :name>
          {{ config.bindings.label }}
          <template v-if="errors.description" #info>
            {{ errors.description }}
          </template>
        </UiTextarea>
        <UiCheckbox v-else-if="config.type === 'checkbox'" v-bind="config.bindings" :name>
          {{ config.bindings.label }}
        </UiCheckbox>
        <UiInput v-else v-bind="config.bindings" :name>
          {{ config.bindings.label }}
        </UiInput>
      </template>
      <UiButton style="max-width: 10rem" type="submit" variant="primary" accent="brand" size="medium">
        Submit
      </UiButton>
    </form>

    <pre>{{ values }}</pre>
  </div>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox, { type CheckboxAccent } from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInput, { type InputAccent, type InputType } from '@core/components/ui/input/UiInput.vue'
import UiTextarea, { type TextareaAccent } from '@core/components/ui/text-area/UiTextarea.vue'
import { toTypedSchema } from '@vee-validate/yup'
import { useForm } from 'vee-validate'
import * as yup from 'yup'

type FormConfig = {
  [key: string]: {
    type: 'input' | 'textarea' | 'checkbox'
    bindings: {
      accent: InputAccent | TextareaAccent | CheckboxAccent
      label: string
      required?: boolean
      type?: InputType
      value?: string
    }
    validation: yup.Schema
  }
}

const formConfig: FormConfig = {
  username: {
    type: 'input',
    bindings: {
      accent: 'brand',
      label: 'Username',
    },
    validation: yup.string().required().min(2).max(10),
  },
  email: {
    type: 'input',
    bindings: {
      required: true,
      accent: 'brand',
      label: 'Email',
    },
    validation: yup.string().email().required(),
  },
  quantity: {
    type: 'input',
    bindings: {
      accent: 'brand',
      type: 'number',
      label: 'Quantity',
    },
    validation: yup.number().max(10).label('Quantity'),
  },
  description: {
    type: 'textarea',
    bindings: {
      accent: 'brand',
      label: 'Description',
    },
    validation: yup.string().max(200),
  },
  checkbox: {
    type: 'checkbox',
    bindings: {
      accent: 'brand',
      label: 'Checkbox',
      value: 'yes',
    },
    validation: yup.boolean().required(),
  },
}

const schema = toTypedSchema(
  yup.object(Object.fromEntries(Object.entries(formConfig).map(([key, config]) => [key, config.validation])))
)

// const schema = toTypedSchema(
//   yup.object({
//     username: yup.string().required().min(2).max(10).label('Username'),
//     email: yup.string().email().required().label('Email'),
//     password: yup.string().required().min(6).ensure().label('Password'),
//     'password-confirmation': yup
//       .string()
//       .required()
//       .oneOf([yup.ref('password')], 'Passwords must match')
//       .label('Password confirmation'),
//     description: yup.string().max(200).label('Description'),
//   })
// )

const { values, handleSubmit, errors } = useForm({
  validationSchema: schema,
})

const onSubmit = handleSubmit(values => {
  if (errors.value.length) {
    return
  }

  console.log(values)
})
</script>
