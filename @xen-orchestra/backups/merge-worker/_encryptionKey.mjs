/**
 * Should be imported first to remove the ENCRYPTION_KEY environment
 * varible ASAP.
 */

const { ENCRYPTION_KEY } = process.env
export { ENCRYPTION_KEY }

if (ENCRYPTION_KEY !== undefined) {
  delete process.env.ENCRYPTION_KEY
}
