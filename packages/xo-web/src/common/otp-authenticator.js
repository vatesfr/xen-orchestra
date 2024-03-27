import authenticator from 'otplib/authenticator'
import crypto from 'crypto'

authenticator.options = { crypto }

export { authenticator as default }
