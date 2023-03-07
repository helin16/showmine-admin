import {Skeleton as AntdSkeleton, ImageProps} from 'antd';

type iSkeletonImage = ImageProps;
const SkeletonImage = ({className, ...props}: iSkeletonImage) => {
  return <AntdSkeleton.Image {...props} className={`app-skeleton-image ${className || ''}`} />;
};

export default SkeletonImage;
