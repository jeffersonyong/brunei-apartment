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
