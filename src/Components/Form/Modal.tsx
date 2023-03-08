import {Modal as AntdModal, ModalProps} from 'antd';

type iModal = ModalProps;
const Modal = ({className, ...props}: iModal) => {
  return <AntdModal {...props} className={`app-Modal ${className || ''}`} />;
};

export default Modal;
