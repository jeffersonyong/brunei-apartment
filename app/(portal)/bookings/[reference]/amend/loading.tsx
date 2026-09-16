import { FormScreenSkeleton } from '@/components/portal/page-skeletons'

export default function Loading() {
  return <FormScreenSkeleton label="booking editor" description={false} fields={8} />
}
