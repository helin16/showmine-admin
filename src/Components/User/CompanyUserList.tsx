import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { useSelector } from 'react-redux';
import ICompany from '../../Types/Company/ICompany';
import UserAvatar from './UserAvatar';
import CompanyService from '../../Services/CompanyService';
import ICompanyUser from '../../Types/User/ICompanyUser';
import { RootState } from '../../Redux/makeReduxStore';
import translate from '../../i18n/translate';
import message from '../Form/message';
import List, {ListItem, ListItemMeta} from '../Form/List';
import Button from '../Form/Button';
import PopConfirm from '../Form/Popconfirm';
import Icons from '../Icons';
import Switch from '../Form/Switch';

type iState = {
  loading: boolean,
  list: Array<ICompanyUser>,
}
const initialState: iState = {
  loading: false,
  list: [],
};

const CompanyUserList = ({ company, searchKeyWord, onUpdated }:
  {company: ICompany, searchKeyWord?: string, onUpdated?: Function}) => {
  const [state, setState] = useState(initialState);
  const { user } = useSelector(
    (s: RootState) => s.auth,
  );

  useEffect(() => {
    if (!company.id) return;

    let isCancelled = false;
    setState((s) => ({
      ...s,
      loading: true,
    }));
    CompanyService.getCompanyUsers(company.id, { 'key-word': searchKeyWord })
      .then((res) => {
        if (isCancelled === true) return;
        const list = res.data.list.sort((a: ICompanyUser, b: ICompanyUser) => (
          a.user.nick_name >= b.user.nick_name ? 0 : 1
        ));
        setState((s) => ({
          ...s,
          loading: false,
          list,
        }));
        if (typeof (onUpdated) === 'function') {
          onUpdated(list);
        }
      })
      .catch((err) => {
        if (isCancelled === true) return;
        message.error(err.data.message);
      });

    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [company.id, searchKeyWord, onUpdated]);
  /**
   *
   * @param index
   * @param companyUser
   * @param newValue
   */
  const changeCompanyUserRole = (index: number, companyUser: ICompanyUser, newValue: boolean) => {
    state.list[index] = {
      ...companyUser,
      role_id: (newValue === true ? 1 : 0),
    };
    setState({
      ...state,
      list: state.list,
    });
    if (!company.id || !companyUser.user || !companyUser.user.id) {
      return;
    }
    CompanyService.updateCompanyUser(company.id, companyUser.user.id, { is_admin: newValue === true })
      .then((res) => {
        if (res.data.success === true) {
          message.success(translate('user-updated', { text: companyUser.user.nick_name }));
        }
      })
      .catch((err) => {
        message.error(translate('error-update', {
          text1: companyUser.user.nick_name, text2: err.response.data.message,
        }));
      });
  };
  /**
   *
   * @param companyUser
   */
  const isCurrentUser = (companyUser: ICompanyUser) => (!user || !user.id || user.id === companyUser.user_id);
  /**
   *
   * @param companyUser
   * @param index
   */
  const deleteCompanyUser = (companyUser: ICompanyUser, index: number) => {
    if (!company.id || !companyUser.user || !companyUser.user.id) {
      return;
    }
    CompanyService.removeCompanyUser(company.id, companyUser.user.id)
      .then((res) => {
        if (res.data.success === true) {
          state.list.splice(index, 1);
          setState({
            ...state,
            list: state.list,
          });
          message.success(translate('user-removed', { text: companyUser.user.nick_name }));
        }
      })
      .catch((err) => {
        message.error(translate('error-remove', {
          text1: companyUser.user.nick_name, text2: err.response.data.message,
        }));
      });
  };
  /**
   *
   * @param companyUser
   * @param index
   */
  const approveCompanyUser = (companyUser: ICompanyUser, index: number) => {
    // TODO: !!!!!
    console.log(companyUser); // eslint-disable-line
    console.log(index); // eslint-disable-line
  };
  /**
   * Rendering
   */
  return (
    <List
      className="company-users-list"
      loading={state.loading}
      itemLayout="horizontal"
      dataSource={state.list}
      renderItem={(companyUser: ICompanyUser, index: number) => (
        <ListItem
          actions={[
            (
              (isCurrentUser(companyUser) || companyUser.pending === false) ? null : (
                <PopConfirm
                  title={<div><div>Are you sure approve</div><h4>{companyUser.user.nick_name}</h4></div>}
                  onConfirm={() => {
                    approveCompanyUser(companyUser, index);
                  }}
                  okText={translate('yes')}
                  cancelText={translate('no')}
                >
                  <Button type="link">
                    <Icons.DeleteOutlined/>
                    Approve
                  </Button>
                </PopConfirm>
              )
            ),
            (
              <Switch
                checkedChildren={translate('is-admin')}
                unCheckedChildren={translate('not-admin')}
                checked={companyUser.role_id === 1}
                onChange={(e: boolean) => changeCompanyUserRole(index, companyUser, e)}
                disabled={isCurrentUser(companyUser)}
              />
            ),
            (
              <PopConfirm
                title={<div><div>Are you sure remove</div><h4>{companyUser.user.nick_name}</h4></div>}
                onConfirm={() => {
                  deleteCompanyUser(companyUser, index);
                }}
                okText={translate('yes')}
                cancelText={translate('no')}
              >
                <Button danger type="text" style={{
                  visibility: isCurrentUser(companyUser) ? 'hidden' : 'visible',
                }}>
                  <Icons.DeleteOutlined/>
                  delete
                </Button>
              </PopConfirm>
            ),
          ]}
        >
          <ListItemMeta
            avatar={<UserAvatar user={companyUser.user} />}
            title={companyUser.user.nick_name}
            description={
              <div>{moment(companyUser.created_at).format('ll')}</div>
            }
          />
        </ListItem>
      )}
    />
  );
};

export default CompanyUserList;
