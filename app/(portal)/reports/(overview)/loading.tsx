import { ListScreenSkeleton } from '@/components/portal/page-skeletons'

export default function Loading() {
  return (
    <ListScreenSkeleton
      title="Reports"
      tiles={4}
      tilesClassName="grid-cols-2 lg:grid-cols-4"
      columns={6}
    />
  )
}
