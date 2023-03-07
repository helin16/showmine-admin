import React, {useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../Redux/makeReduxStore';
import {changeCompany, changeCompanyPackage} from '../../Redux/reduxers/auth.slice';
import ICompany from '../../Types/Company/ICompany';
import Utils from '../../Services/Utils';
import UserService from '../../Services/UserService';
import { BACK_END_URL } from '../../UrlMap';
import {Select} from 'antd';
import Spin from '../Form/Spin';
import message from '../Form/message';
import CompanyService from '../../Services/CompanyService';
// import Select, {Option} from '../Form/Select';

/**
 *
 */
const UserCompanySelector = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { user, company } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedValue = (company && company.id)
    ? { value: company.id, label: company.name }
    : { value: '', label: '' };

  if (!user || !user.userCompany) {
    return null;
  }
  /**
   *
   * @param newValue
   */
  const onChange = (newValue: any) => { // eslint-disable-line
    const newCompanyId = newValue.key;
    const companies = (user && user.userCompany) ? user.userCompany : [];
    const companyMap = Utils.convertArrayToObject(companies, 'id');
    setIsSaving(true);
    Promise.all([
        UserService.setLastVisitCompany(companyMap[newCompanyId]),
        CompanyService.getPackageDetails(newCompanyId),
      ])
      .then(res => {
        dispatch(changeCompany({ company: companyMap[newCompanyId] }));
        dispatch(changeCompanyPackage({ companyPackage: res[1].data }));
        navigate(BACK_END_URL);
      })
      .catch(err => {
        message.error(err.data.message)
      })
      .finally(() => {
        setIsSaving(false);
      })
  };

  if (user.userCompany.length === 0) {
    return null;
  }
  /**
   *
   */
  return (
    <Spin spinning={isSaving}>
      <Select
        labelInValue
        showSearch
        optionFilterProp="children"
        value={selectedValue}
        style={{ width: '160px' }}
        onChange={onChange}
        filterOption={(input, option) => {
          if (!option) {
            return false;
          }
          return `${option?.children || ''}`.toLowerCase().indexOf(input.toLowerCase()) >= 0;
        }}
        // @ts-ignore
        options={
          user.userCompany.map((comp: ICompany) => {
            if (!comp.id) return null;
            return ({
              label: comp.name,
              value: comp.id,
            });
          }).filter(item => item !== null)
        }
      />
    </Spin>
  );
};

export default UserCompanySelector;
