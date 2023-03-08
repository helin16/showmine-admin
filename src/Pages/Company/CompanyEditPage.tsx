import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CompanyEditor from '../../Components/Company/CompanyEditor';
import { RootState } from '../../Redux/makeReduxStore';
import { MENU_KEY_COMPANY_ADMIN } from '../../Components/Menu/MenuItems';
import ICompany from '../../Types/Company/ICompany';
import { changeCompany } from '../../Redux/reduxers/auth.slice';
import CompanyDeleteBtn from '../../Components/Company/CompanyDeleteBtn';
import translate from '../../i18n/translate';
import BackendPage from '../../Layouts/BackendPage';
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle';

type iState = {
  company?: ICompany,
  loading: boolean,
  loadingErr?: object,
}
const initState: iState = {
  loading: false,
};
const CompanyEditPage = () => {
  const [state, setState] = useState(initState);
  const { company, companyPackage } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch();

  const companyUpdated = (newCompany: ICompany) => {
    dispatch(changeCompany({ company: newCompany, companyPackage }));
  };

  useEffect(() => {
    if (!company || !company.id) return;
    setState((s) => ({
      ...s,
      company,
      loading: true,
      loadingErr: undefined,
    }));
  }, [company]);

  const getControls = () => (
      <CompanyDeleteBtn company={state.company} onDeleted={companyUpdated} />
  );

  return (
    <BackendPage
      selectedMenu={MENU_KEY_COMPANY_ADMIN}
      ContentHeader={
        <BackendPageContentTitle
          title={state.company ? state.company.name : translate('company')}
          controls={getControls()}
        />
      }
      >
      {state.company
        ? <CompanyEditor company={state.company} onSaved={companyUpdated} />
        : null
      }
    </BackendPage>
  );
};

export default CompanyEditPage;
