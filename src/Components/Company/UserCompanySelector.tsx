import React, {useEffect, useState} from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import ICompany from '../../Types/Company/ICompany'
import { BACK_END_URL } from '../../UrlMap'
import Spin from '../Form/Spin'
import Select from '../Form/Select'
import message from '../Form/message'
import AuthService from '../../Services/AuthService';
import CompanyService from '../../Services/CompanyService';
import Utils from '../../Services/Utils'

/**
 *
 */
const UserCompanySelector = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companyMap, setCompanyMap] = useState<{[key: string]: ICompany}>({});
  const { user, company, companyUsers } = useSelector((s: RootState) => s.auth);

  const getSelectedValue = () => (company && company.id)
    ? { value: company.id, label: company.name }
    : { value: '', label: '' };

  useEffect(() => {
    if (user?.isSuperAdmin !== true) {
      setCompanyMap(
        (companyUsers || [])
          .map(companyUser => companyUser.Company)
          .filter(comp => comp !== undefined)
          .reduce((map, comp) => {
            return {
              ...map,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              [`${comp.id || ''}`]: comp,
            }
          }, {})
      );
      return;
    }

    let isCanceled = false;
    setIsLoading(true);
    CompanyService.getAll({
        where: JSON.stringify({isActive: true}),
        perPage: 9999,
        currentPage: 1,
      }).then(resp => {
        if (isCanceled === true) return;
        setCompanyMap((resp.data || []).reduce((map, comp) => {
          return {
            ...map,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            [`${comp.id || ''}`]: comp,
          }
        }, {}))
      }).catch(err => {
        if (isCanceled === true) return;
        message.error(`Error: ${Utils.getErrorMessage(err)}`)
      }).finally(() => {
        if (isCanceled === true) return;
        setIsLoading(false);
      })
    return () => {
      isCanceled = true;
    }
  }, [user?.id, user?.isSuperAdmin, companyUsers])

  /**
   *
   * @param newValue
   */
  const onChange = (newValue: any) => { // eslint-disable-line
    const newCompanyId = newValue.value;
    setIsSaving(true);
    Promise.all([
        AuthService.updateMe({
          lastVisitCompanyId: newCompanyId,
        }),
      ])
      .then(res => {
        window.location.href = BACK_END_URL;
      })
      .catch(err => {
        message.error(Utils.getErrorMessage(err))
      })
      .finally(() => {
        setIsSaving(false);
      })
  };

  if (Object.keys(companyMap).length === 0) {
    return null;
  }

  return (
    <Spin spinning={isSaving || isLoading}>
      <Select
        labelInValue
        showSearch
        optionFilterProp="label"
        value={getSelectedValue()}
        style={{ width: '160px' }}
        onChange={onChange}
        filterOption={(input, option) => {
          if (!option) {
            return false;
          }
          return `${option?.label || ''}`.toLowerCase().indexOf(input.toLowerCase()) >= 0;
        }}
        options={
          Object.values(companyMap).map((comp: ICompany) => {
            return ({
              label: comp.name,
              value: comp.id,
            });
          })
        }
      />
    </Spin>
  );
}

export default UserCompanySelector
