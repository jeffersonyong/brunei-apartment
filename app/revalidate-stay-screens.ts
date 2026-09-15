import { revalidatePath } from 'next/cache'

/**
 * Everything that shows a booking's state, a unit's state, or a deposit.
 *
 * Shared by the portal's check-in and check-out, the gate's check-in, and
 * housekeeping's check-out, inspection and mark-ready — which move the same
 * stay and must refresh the same screens. Two private copies of this list
 * would be the first to disagree about one of them.
 *
 * Longer than the other revalidation lists in the product because a stay's
 * moves touch all three registers at once: the booking moves, the unit's state
 * moves, and the deposit's stage moves with the guest. Both field screens are
 * here because a guest checked in or out at the desk has to leave the guard's
 * list of cars to expect, and arrive on the cleaner's list of rooms to turn.
 */
export function revalidateStayScreens(reference: string, unitRef: string | null): void {
  revalidatePath('/bookings')
  revalidatePath(`/bookings/${reference}`)
  revalidatePath('/deposits')
  revalidatePath(`/deposits/${reference}`)
  revalidatePath('/units')

  if (unitRef) {
    revalidatePath(`/units/${unitRef}`)
  }

  revalidatePath('/dashboard')
  revalidatePath('/field/arrivals')
  revalidatePath('/field/departures')
}
