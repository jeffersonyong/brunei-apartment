import {
  ControlRowSkeleton,
  LoadingScreen,
  PageHeaderSkeleton,
} from '@/components/portal/page-skeletons'
import { Skeleton } from '@/components/ui/skeleton'

/** The control line, then the grid as one block the height of a month of units. */
export default function Loading() {
  return (
    <LoadingScreen label="Booking calendar">
      <PageHeaderSkeleton title="Booking calendar" />
      <div className="mt-xl">
        <ControlRowSkeleton chips={2} actions={2} />
      </div>
      <Skeleton className="mt-md h-[560px] w-full rounded-lg" />
    </LoadingScreen>
  )
}
