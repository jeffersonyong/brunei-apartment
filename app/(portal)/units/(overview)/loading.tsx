import { ListScreenSkeleton } from '@/components/portal/page-skeletons'

export default function Loading() {
  return (
    <ListScreenSkeleton
      title="Units"
      tiles={4}
      tilesClassName="grid-cols-2 sm:grid-cols-4"
      columns={6}
    />
  )
}
