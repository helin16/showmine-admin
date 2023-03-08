import {Collapse as AntdCollapse, CollapsePanelProps, CollapseProps} from 'antd';

type iCollapse = CollapseProps;
const Collapse = ({className, ...props}: iCollapse) => {
  return <AntdCollapse {...props} className={`app-Collapse ${className || ''}`} />;
};

type iPanel = CollapsePanelProps;
export const Panel = ({className, ...props}: iPanel) => {
  return <AntdCollapse.Panel {...props} className={`app-Collapse-Panel ${className || ''}`} />;
};

export default Collapse;
