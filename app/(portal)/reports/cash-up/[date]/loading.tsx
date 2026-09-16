import { ListScreenSkeleton } from '@/components/portal/page-skeletons'

export default function Loading() {
  return (
    <ListScreenSkeleton
      title="Cash-up"
      description={false}
      tiles={4}
      tilesClassName="grid-cols-2 lg:grid-cols-4"
      chips={0}
      columns={6}
    />
  )
}
