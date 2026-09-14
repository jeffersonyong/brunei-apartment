/**
 * What a field screen says when a write never reached the server.
 *
 * A server action that cannot reach the server throws in the browser, and left
 * alone that throw replaces the screen with an error page — at the barrier, or
 * in a unit with one bar of signal. So every field write is wrapped, and a
 * throw becomes this sentence. It is true: the write never arrived, so nothing
 * was recorded, and the person can try again when a bar comes back.
 */
export const DID_NOT_GO_THROUGH =
  'That did not go through, so nothing was recorded. Check the phone has signal and try again.'

/**
 * What the gate says when taking cash may not have reached the server.
 *
 * Not `DID_NOT_GO_THROUGH`, because here that sentence can be false: the write
 * may have landed and only the answer been lost on the way back. So it sends
 * the guard to the list rather than straight back to the button. The refreshed
 * card says whether the money is still owed, and taking it again is refused
 * once it is not (`gateCashStalenessOf` in lib/domain/gate.ts).
 */
export const CASH_MAY_NOT_HAVE_GONE_THROUGH =
  'That may not have gone through. Refresh the list: if the money still shows as owed, nothing was recorded.'
