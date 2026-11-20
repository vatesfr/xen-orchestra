import { macAddress, or } from '@core/packages/form-validation'

export const vifMacAddress = or(macAddress(':'), macAddress('-'))
