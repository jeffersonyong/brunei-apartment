import { ListScreenSkeleton } from '@/components/portal/page-skeletons'

export default function Loading() {
  return (
    <ListScreenSkeleton
      title="Deposits"
      tiles={6}
      tilesClassName="grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      columns={9}
    />
  )
}
