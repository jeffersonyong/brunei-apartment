/**
 * What a guest does on arrival, as the client wrote it (Jeff, 19 September
 * 2026).
 *
 * A stay's alone: a key, a car to park and a Wi-Fi password are an
 * apartment's, and a day pass has none of them. The booking page and the
 * confirmation email both read this list, so the steps a guest is shown and
 * the steps they are sent cannot drift apart.
 *
 * The client's copy ends on a ✨. It is left off here for the reason the
 * email's status marks are text glyphs rather than emoji: an emoji renders in
 * whatever colours each client and phone ships, and this surface draws no
 * decoration it cannot control.
 */
export const CHECK_IN_STEPS: readonly string[] = [
  'Please go to the Security Counter.',
  'Fill in and sign the Registration Form.',
  'Show the IC of the person who made the booking.',
  'Security will hand you the apartment key and tell you where to park your car.',
  'The Wi-Fi password is on a sticker attached to the TV board in the living room.',
]

export const CHECK_IN_SIGN_OFF = 'Have a pleasant stay and enjoy your time with us!'
