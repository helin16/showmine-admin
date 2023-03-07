import {Upload as AntdUpload, UploadProps} from 'antd';

type iUpload = UploadProps;
const Upload = ({className, ...props}: iUpload) => {
  return <AntdUpload {...props} className={`app-upload ${className || ''}`} />;
};

export default Upload;
