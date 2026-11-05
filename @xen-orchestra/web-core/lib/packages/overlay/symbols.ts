/** Returned from an event handler to keep the overlay open (e.g. after a validation failure) */
export const KEEP_OVERLAY_OPEN = Symbol('keep overlay open')

/** `event` of the response resolved when an overlay is torn down without a user decision (e.g. the opener's scope was disposed) */
export const OVERLAY_ABORT_EVENT = Symbol('overlay aborted')
