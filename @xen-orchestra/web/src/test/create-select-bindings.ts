import type { FormSelectId } from '@core/packages/form-select'
import type { FieldMetadata } from '@core/packages/validated-form'

// No select is defined behind the id: only a component rendering a stubbed `FormSelect` can take these bindings
export function createSelectBindings(label: string): { id: FormSelectId; label: string } & FieldMetadata {
  return { id: Symbol(label) as FormSelectId, label, error: undefined, warning: undefined, onBlur: () => {} }
}
