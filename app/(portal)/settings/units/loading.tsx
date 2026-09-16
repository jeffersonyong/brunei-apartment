import { ListScreenSkeleton } from '@/components/portal/page-skeletons'

export default function Loading() {
  return <ListScreenSkeleton title="Unit registry" chips={0} columns={5} />
}
