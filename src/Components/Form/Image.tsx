import { Image as AntdImage, ImageProps } from 'antd'

type iImage = ImageProps
const Image = ({ className, ...props }: iImage) => {
  return <AntdImage {...props} className={`app-image ${className || ''}`} />
}

export default Image
