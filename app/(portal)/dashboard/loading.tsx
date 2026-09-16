import {
  LoadingScreen,
  PageHeaderSkeleton,
  StatTilesSkeleton,
  TableSkeleton,
} from '@/components/portal/page-skeletons'
import { Skeleton } from '@/components/ui/skeleton'

/** The four tiles, then today's arrivals and departures, each a heading over a table. */
export default function Loading() {
  return (
    <LoadingScreen label="Dashboard">
      <PageHeaderSkeleton title="Dashboard" actions={2} />
      <StatTilesSkeleton count={4} className="grid-cols-2 lg:grid-cols-4" />
      {[7, 6].map((columns, index) => (
        <div key={index} className="mt-2xl">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-xs h-4 w-64" />
          <TableSkeleton columns={columns} rows={4} />
        </div>
      ))}
    </LoadingScreen>
  )
}
