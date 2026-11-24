import type { InputWrapperAccent, InputWrapperController } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { useInputWrapperController } from '@core/composables/input-wrapper-controller.composable.ts'
import { IK_INPUT_WRAPPER_CONTROLLER } from '@core/utils/injection-keys.util.ts'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mountComposable } from '@core-test/mount-composable.ts'
import { nextTick, reactive, type Ref, ref } from 'vue'

type Accent = 'neutral' | 'warning' | 'danger'

const ACCENTS: Accent[] = ['neutral', 'warning', 'danger']

function createWrapperController(accent: InputWrapperAccent = 'neutral') {
  return reactive<InputWrapperController>({
    id: 'wrapper-id',
    accent,
    required: false,
    describedBy: undefined,
    invalid: false,
  })
}

function mountController({
  accent = ref<Accent>('neutral'),
  required,
  detached = false,
  wrapperController,
}: {
  accent?: Ref<Accent>
  required?: Ref<boolean>
  detached?: boolean
  wrapperController?: InputWrapperController
} = {}) {
  const { wrapper } = mountComposable(
    () => useInputWrapperController({ accent, accents: ACCENTS, required, detached }),
    createGlobalTestConfig({
      provide: wrapperController === undefined ? {} : { [IK_INPUT_WRAPPER_CONTROLLER]: wrapperController },
    })
  )

  return wrapper.vm
}

describe('useInputWrapperController', () => {
  describe('accent', () => {
    it('follows the accent of the input outside a wrapper', () => {
      const accent = ref<Accent>('warning')
      const controller = mountController({ accent })

      expect(controller.accent).toBe('warning')

      accent.value = 'danger'

      expect(controller.accent).toBe('danger')
    })

    it('keeps the accent of the input when the wrapper is neutral', () => {
      const controller = mountController({ accent: ref('warning'), wrapperController: createWrapperController() })

      expect(controller.accent).toBe('warning')
    })

    it.each(['warning', 'danger'] as const)('takes the %s accent of the wrapper when the input supports it', accent => {
      const controller = mountController({ wrapperController: createWrapperController(accent) })

      expect(controller.accent).toBe(accent)
    })

    it('keeps the accent of the input when it does not support the accent of the wrapper', () => {
      const controller = mountController({
        accent: ref('danger'),
        wrapperController: createWrapperController('success'),
      })

      expect(controller.accent).toBe('danger')
    })

    it('follows the accent of the wrapper', () => {
      const wrapperController = createWrapperController('warning')
      const controller = mountController({ wrapperController })

      wrapperController.accent = 'neutral'

      expect(controller.accent).toBe('neutral')
    })

    it('ignores the wrapper when detached', () => {
      const controller = mountController({ detached: true, wrapperController: createWrapperController('danger') })

      expect(controller.accent).toBe('neutral')
    })
  })

  describe('wrapperController', () => {
    it('returns the wrapper the input is in', () => {
      const wrapperController = createWrapperController()

      expect(mountController({ wrapperController }).wrapperController).toBe(wrapperController)
    })

    it.each([
      ['outside a wrapper', {}],
      ['when detached', { detached: true, wrapperController: createWrapperController() }],
    ])('returns no wrapper %s', (_, options) => {
      expect(mountController(options).wrapperController).toBeUndefined()
    })
  })

  describe('required', () => {
    it('pushes the required state of the input to the wrapper', async () => {
      const required = ref(true)
      const wrapperController = createWrapperController()

      mountController({ required, wrapperController })

      expect(wrapperController.required).toBe(true)

      required.value = false
      await nextTick()

      expect(wrapperController.required).toBe(false)
    })

    it.each([
      { label: 'when detached', options: { required: ref(true), detached: true }, wrapperRequired: false },
      { label: 'without a required state of its own', options: {}, wrapperRequired: true },
    ])('leaves the wrapper untouched $label', ({ options, wrapperRequired }) => {
      const wrapperController = createWrapperController()
      wrapperController.required = wrapperRequired

      mountController({ ...options, wrapperController })

      expect(wrapperController.required).toBe(wrapperRequired)
    })
  })
})
