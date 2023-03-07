import {Upload} from 'antd';
import {DraggerProps} from 'antd/es/upload';

type iUploadDragger = DraggerProps;
const UploadDragger = ({className, ...props}: iUploadDragger) => {
  return <Upload.Dragger {...props} className={`app-UploadDragger ${className || ''}`} />;
};

export default UploadDragger;
