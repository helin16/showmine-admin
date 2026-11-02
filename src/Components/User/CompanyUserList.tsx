import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { useSelector } from 'react-redux'
import UserAvatar from './UserAvatar'
import ICompanyUser, {ROLE_ADMIN, ROLE_NON_ADMIN} from '../../Types/Company/ICompanyUser'
import { RootState } from '../../Redux/makeReduxStore'
import translate from '../../i18n/translate'
import message from '../Form/message'
import List, { ListItem, ListItemMeta } from '../Form/List'
import Button from '../Form/Button'
import PopConfirm from '../Form/Popconfirm'
import Icons from '../Icons'
import Switch from '../Form/Switch'
import CompanyUserService from '../../Services/CompanyUserService';
import MathHelper from '../../Helpers/MathHelper';
import IResList from '../../Types/IResList';
import Utils from '../../Services/Utils'

type iCompanyUserList = {
  searchKeyWord?: string
  onRemoved?: () => void
}
const CompanyUserList = ({ searchKeyWord, onRemoved }: iCompanyUserList) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [count, setCount] = useState(0);
  const [companyUserList, setCompanyUserList] = useState<IResList<ICompanyUser> | null>(null);
  const { user } = useSelector(    (s: RootState) => s.auth );

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    CompanyUserService.getAll({
        where: JSON.stringify({isActive: true, }),
        include: 'User',
      })
      .then((res) => {
        if (isCancelled === true) return;
        setCompanyUserList(res);
      })
      .catch((err) => {
        if (isCancelled === true) return;
        message.error(Utils.getErrorMessage(err));
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [searchKeyWord, count]);
  /**
   *
   * @param companyUser
   */
  const isCurrentUser = (companyUser: ICompanyUser) => (!user || !user.id || user.id === companyUser.userId);
  /**
   *
   * @param companyUser
   * @param index
   */
  const deleteCompanyUser = (companyUser: ICompanyUser) => {
    const companyUserId = `${companyUser.id || ''}`.trim();
    if (companyUserId === '') {
      return;
    }
    setIsSaving(true);
    CompanyUserService.deactivate(companyUserId)
      .then((res) => {
        message.success(translate('user-removed', { text: companyUser.User?.nickName }));
        onRemoved?.();
      })
      .catch((err) => {
        message.error(translate('error-remove', {
          text1: companyUser.User?.nickName, text2: Utils.getErrorMessage(err),
        }));
      })
      .finally(() => {
        setIsSaving(false);
        setCount(MathHelper.add(count, 1))
      })
  };

  const updateCompanyUser = (companyUser: ICompanyUser, data: {[key: string]: string | boolean}) => {
    const companyUserId = `${companyUser.id || ''}`.trim();
    if (companyUserId === '') {
      return;
    }
    setIsSaving(true);
    CompanyUserService.update(companyUserId, data)
      .then((res) => {
        message.success(translate('user-updated', { text: companyUser.User?.nickName }));
      })
      .catch((err) => {
        message.error(translate('error-update', {
          text1: companyUser.User?.nickName, text2: Utils.getErrorMessage(err),
        }));
      })
      .finally(() => {
        setIsSaving(false);
        setCount(MathHelper.add(count, 1))
      })
  }
  /**
   * Rendering
   */
  return (
    <List
      className="company-users-list"
      loading={isLoading || isSaving}
      itemLayout="horizontal"
      dataSource={(companyUserList?.data || []).sort((a: ICompanyUser, b: ICompanyUser) => (
          `${a.User?.nickName || ''}`.trim().localeCompare(`${b.User?.nickName || ''}`.trim())
        ))
      }
      renderItem={(companyUser: ICompanyUser, index: number) => (
        <ListItem
          actions={[
            (
              <Switch
                key={'admin-switch'}
                checkedChildren={translate('is-admin')}
                unCheckedChildren={translate('not-admin')}
                checked={companyUser.role === ROLE_ADMIN}
                onChange={(e: boolean) => updateCompanyUser(companyUser, {role: e === true ? ROLE_ADMIN : ROLE_NON_ADMIN})}
                disabled={isCurrentUser(companyUser)}
              />
            ),
            (
              <PopConfirm
                key={'delete-btn'}
                title={<div><div>Are you sure remove</div><h4>{companyUser.User?.nickName}</h4></div>}
                onConfirm={() => {
                  deleteCompanyUser(companyUser);
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
            avatar={<UserAvatar user={companyUser.User} />}
            title={companyUser.User?.nickName}
            description={
              <div>{moment(companyUser.createdAt).format('ll')}</div>
            }
          />
        </ListItem>
      )}
    />
  );
}

export default CompanyUserList
