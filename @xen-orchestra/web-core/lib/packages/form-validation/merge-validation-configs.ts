import type { FormValidationConfig, FormValidationRuleGroup, FormValidationRules } from './types.ts'

function mergeRules<T extends Record<string, unknown>>(
  baseRules?: FormValidationRules<T>,
  extraRules?: FormValidationRules<T>
): FormValidationRules<T> | undefined {
  if (!baseRules) {
    return extraRules
  }

  if (!extraRules) {
    return baseRules
  }

  const resolvedBase = typeof baseRules === 'function' ? baseRules : () => baseRules
  const resolvedExtra = typeof extraRules === 'function' ? extraRules : () => extraRules

  return () => ({ ...resolvedBase(), ...resolvedExtra() })
}

function mergeRuleGroups<T extends Record<string, unknown>>(
  baseGroup?: FormValidationRuleGroup<T>,
  extraGroup?: FormValidationRuleGroup<T>
): FormValidationRuleGroup<T> | undefined {
  if (!baseGroup && !extraGroup) {
    return undefined
  }

  return {
    onBlur: mergeRules(baseGroup?.onBlur, extraGroup?.onBlur),
    onSubmit: mergeRules(baseGroup?.onSubmit, extraGroup?.onSubmit),
  }
}

export function mergeValidationConfigs<TBase extends Record<string, unknown>, TExtra extends TBase>(
  base: FormValidationConfig<TBase>,
  extra?: FormValidationConfig<TExtra>
): FormValidationConfig<TExtra> {
  const errors = mergeRuleGroups(base.errors as FormValidationRuleGroup<TExtra>, extra?.errors)
  const warnings = mergeRuleGroups(base.warnings as FormValidationRuleGroup<TExtra>, extra?.warnings)

  return {
    ...(errors !== undefined && { errors }),
    ...(warnings !== undefined && { warnings }),
  }
}
