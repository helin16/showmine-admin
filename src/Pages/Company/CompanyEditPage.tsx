import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CompanyEditor from '../../Components/Company/CompanyEditor'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_COMPANY_ADMIN } from '../../Components/Menu/MenuItems'
import ICompany from '../../Types/Company/ICompany'
import { changeCompany } from '../../Redux/reduxers/auth.slice'
import CompanyDeleteBtn from '../../Components/Company/CompanyDeleteBtn'
import translate from '../../i18n/translate'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import CompanyService from '../../Services/CompanyService';
import message from '../../Components/Form/message';
import MathHelper from '../../Helpers/MathHelper';
import Utils from '../../Services/Utils'

type iState = {
  company?: ICompany
  loading: boolean;
  count: number;
}
const initState: iState = {
  loading: false,
  count: 0,
}
const CompanyEditPage = () => {
  const [state, setState] = useState(initState);
  const { company } = useSelector((s: RootState) => s.auth)
  const dispatch = useDispatch()

  const companyUpdated = (newCompany: ICompany) => {
    dispatch(changeCompany({ company: newCompany }));
    setState((s) => ({
      ...s,
      count: MathHelper.add(s.count, 1),
    }))
  }

  useEffect(() => {
    const companyId = `${company?.id || ''}`.trim();
    if (companyId === '') return
    setState((s) => ({
      ...s,
      loading: true,
    }))
    CompanyService.getItemById(companyId, {
        include: 'LogoAsset',
      }).then(resp => {
        setState((s) => ({
          ...s,
          company: resp,
        }))
      }).catch(err => {
        message.error(Utils.getErrorMessage(err));
      }).finally(() => {
        setState((s) => ({
          ...s,
          loading: false,
        }))
      })
  }, [company?.id, state.count])

  const getControls = () => {
    if (!state.company) {
      return null
    }
    return <CompanyDeleteBtn company={state.company} onDeleted={companyUpdated} />
  }

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
      {state.company ? <CompanyEditor company={state.company} onSaved={companyUpdated} /> : null}
    </BackendPage>
  )
}

export default CompanyEditPage
