import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'

export const danger = (content: string): InputWrapperMessage => ({ content, accent: 'danger' })

export const warning = (content: string): InputWrapperMessage => ({ content, accent: 'warning' })
