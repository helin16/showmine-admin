import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BackendPageState, toggleSideMenu } from '../Redux/reduxers/backendpage.slice';
import LogoutBtn from '../Components/Auth/LogoutBtn';
import UserAvatar from '../Components/User/UserAvatar';
import { RootState } from '../Redux/makeReduxStore';
import UserCompanySelector from '../Components/Company/UserCompanySelector';
import { MY_PROFILE_URL } from '../UrlMap';
import {contentInternalPadding} from '../Styles/AppWrapper';
import {Header} from '../Components/Form/Layout';
import Row from '../Components/Form/Row';
import Col from '../Components/Form/Col';
import Button from '../Components/Form/Button';
import Icons from '../Components/Icons';
import Space from '../Components/Form/Space';
import UpgradeBtn from '../Components/Billing/UpgradeBtn';

/**
 * Backend Page Header
 * @param children
 */
const BackendPageHeader = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { collapsed } = useSelector((state: {
    backendPage: BackendPageState
  }) => state.backendPage);

  /**
   * toggle side menu
   */
  const toggleMenu = () => {
    dispatch(toggleSideMenu());
  };
  /**
   * render
   */
  return (
    <Header className="site-layout-background"
      style={{
        padding: `0px ${contentInternalPadding}`,
        background: '#fff',
      }}>
      <Row>
        <Col flex={'auto'}>
          <Button onClick={toggleMenu}
            type={'text'}
            style={{
              background: 'transparent',
              padding: 0,
              fontSize: '20px',
            }}
          >
            {
              collapsed === true
                ? <Icons.MenuUnfoldOutlined /> : <Icons.MenuFoldOutlined />
            }
          </Button>
        </Col>
        <Col flex={'100px'} style={{
          textAlign: 'right',
        }}>
          <Space align={'center'}>
            <UpgradeBtn />
            <UserCompanySelector />
            <Button href={MY_PROFILE_URL} type={'link'}>
              <UserAvatar user={user}/>
            </Button>
            <LogoutBtn />
          </Space>
        </Col>
      </Row>

    </Header>
  );
};

export default BackendPageHeader;
