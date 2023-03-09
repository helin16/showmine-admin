import {Drawer as AntdDrawer, DrawerProps} from 'antd';

type iDrawer = DrawerProps;
const Drawer = ({className, ...props}: iDrawer) => {
  return <AntdDrawer {...props} className={`app-Drawer ${className || ''}`} />;
};

export default Drawer;
