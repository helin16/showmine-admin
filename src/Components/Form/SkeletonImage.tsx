import { ComponentProps } from 'react'
import { Skeleton as AntdSkeleton } from 'antd'

type iSkeletonImage = ComponentProps<typeof AntdSkeleton.Image>
const SkeletonImage = ({ className, ...props }: iSkeletonImage) => {
  return <AntdSkeleton.Image {...props} className={`app-skeleton-image ${className || ''}`} />
}

export default SkeletonImage
