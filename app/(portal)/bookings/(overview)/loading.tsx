import { ListScreenSkeleton } from '@/components/portal/page-skeletons'

export default function Loading() {
  return <ListScreenSkeleton title="Bookings" tiles={3} chips={4} columns={9} />
}
