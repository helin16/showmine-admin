import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import CompanyService from '../Services/CompanyService';
import MenuItems, { MENU_ACCESS_LEVEL_COMPANY_ADMIN, MENU_ACCESS_LEVEL_SUPER_ADMIN } from '../Components/Menu/MenuItems';
import { RootState } from '../Redux/makeReduxStore';
import Menu from '../Components/Form/Menu';
import {Link} from 'react-router-dom';

const SideMenuWrapper = styled.div`
  .ant-menu-item {
    border-radius: 0px !important;
  }
  .group-div {
    font-size: 10px;
    color: rgb(70, 75, 102);
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`;
const BackendPageSideMenu = () => {
  const { selectedMenuKey } = useSelector(
    (s: RootState) => s.backendPage,
  );
  const { user, company } = useSelector(
    (s: RootState) => s.auth,
  );


  const getMenuItems = ()  => {
    return MenuItems.map((item) => {
      if (CompanyService.isUserCompanyAdmin(user, company) !== true
        && CompanyService.isUserSuperAdmin(user) !== true
        && item.access === MENU_ACCESS_LEVEL_COMPANY_ADMIN) {
        return undefined;
      }
      if (CompanyService.isUserSuperAdmin(user) !== true
        && item.access === MENU_ACCESS_LEVEL_SUPER_ADMIN) {
        return undefined;
      }
      if (!item.items) {
        return ({
          label: <Link to={item.url}>{item.name}</Link>,
          key: item.key,
          icon: item.icon,
        });
      }
      return ({
          type: 'group',
          label: <div className={'group-div'}>{item.name}</div>,
          key: item.key,
          children: item.items.map((subItem) => ( {
            label: <Link type={'link'} to={subItem.url}>{subItem.name}</Link>,
            key: subItem.key,
            icon: subItem.icon,
          }))
        }
      );
    }).filter(item => item !== undefined)
  }

  return (
    <SideMenuWrapper>
      <Menu
        theme="dark"
        selectedKeys={selectedMenuKey ? [selectedMenuKey] : undefined}
        // @ts-ignore
        items={getMenuItems()}
      />
    </SideMenuWrapper>
  );
};

export default BackendPageSideMenu;
