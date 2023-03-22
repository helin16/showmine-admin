import { COMPANY_BILLING_URL } from '../../UrlMap'
import translate from '../../i18n/translate'
import Button from '../Form/Button'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import CompanyService from '../../Services/CompanyService'
import message from '../Form/message'
import Spin from '../Form/Spin'

const UpgradeBtn = () => {
  return null
  // const { company, companyPackage } = useSelector((s: RootState) => s.auth);
  // const [isLoading, setIsLoading] = useState(false);
  // const [isShowing, setIsShowing] = useState(false);
  //
  // useEffect(() => {
  //   const companyId = `${company?.id || ''}`.trim();
  //   if (companyId === '') {
  //     return;
  //   }
  //
  //   let isCancel = false;
  //   setIsLoading(true);
  //   CompanyService.getPackages(companyId)
  //     .then((res) => {
  //       if (isCancel) return;
  //       const lastPackageId = (res.data.sort((package1: IPackage, package2: IPackage) => package1.order > package2.order ? -1 : 1))[0].id;
  //       setIsShowing(lastPackageId === companyPackage?.id);
  //     })
  //     .catch((err) => {
  //       message.error(`Error when fetching packages: ${err.message}`);
  //       if (isCancel) return;
  //     })
  //     .finally(() => {
  //       setIsLoading(false);
  //     })
  //     ;
  // }, [company, companyPackage]);
  //
  // if (isShowing) {
  //   return null;
  // }
  //
  // return (
  //   <Spin spinning={isLoading}>
  //     <Button type="primary" href={COMPANY_BILLING_URL}>{translate('upgrade')}</Button>
  //   </Spin>
  // )
}

export default UpgradeBtn
