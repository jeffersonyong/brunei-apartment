import { ListScreenSkeleton } from '@/components/portal/page-skeletons'

export default function Loading() {
  return <ListScreenSkeleton title="Audit log" chips={4} columns={5} />
}
