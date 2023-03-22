import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_COMPANY_BILLING } from '../../Components/Menu/MenuItems'
import PlanPackageSwitcher from '../../Components/Package/PlanPackageSwitcher'
import translate from '../../i18n/translate'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'

const BillingPage = () => {
  const { company } = useSelector((s: RootState) => s.auth)

  return (
    <BackendPage
      selectedMenu={MENU_KEY_COMPANY_BILLING}
      ContentHeader={<BackendPageContentTitle title={translate('billing')} checkPackage={false} />}
    >
      {company && company.id ? <PlanPackageSwitcher /> : null}
    </BackendPage>
  )
}

export default BillingPage
