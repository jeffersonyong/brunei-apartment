import Link from 'next/link'

/**
 * A code that opens nothing.
 *
 * One answer for a malformed code, an unknown one and one that has been
 * replaced, so a guesser learns nothing from the difference (architecture.md
 * §7). It still has to be useful to a guard at the barrier with a car waiting,
 * so it names the way that always works: the plate or the name on the list.
 */
export default function EntryCodeNotFound() {
  return (
    <>
      <h1 className="text-display-sm text-foreground">This code does not open a booking</h1>
      <p className="mt-sm text-body-md text-muted-foreground">
        It may have been replaced with a new one, or it is not a Palm Villa entry code. Guards can
        find the booking by plate or name on the{' '}
        <Link className="text-foreground underline hover:no-underline" href="/field/arrivals">
          Gate list
        </Link>
        ; guests can ask the office for their current code.
      </p>
    </>
  )
}
