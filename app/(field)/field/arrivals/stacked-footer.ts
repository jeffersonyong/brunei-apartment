/**
 * The footer of a gate dialog that offers three buttons: the main move, a
 * second way out ("Tell the office instead", "Correct the count instead") and
 * "Not yet".
 *
 * Three touch-size buttons do not fit side by side in the 440px dialog — they
 * ran out past its left edge — so the footer stacks them at every width, as it
 * already does on a phone: full width, the main move on top. The footer lays
 * its children out reversed, so the main move comes last in the markup and
 * "Not yet" first. A two-button footer keeps the ordinary row.
 */
export const STACKED_FOOTER = 'sm:flex-col-reverse sm:justify-start [&>*]:w-full'
