import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import CompanyService from '../../Services/CompanyService'
import translate from '../../i18n/translate'
import ICompany from '../../Types/Company/ICompany'
import ICompanyAuthor from '../../Types/Company/ICompanyAuthor'
import { changeCompany } from '../../Redux/reduxers/auth.slice'
import IError from '../../Types/IError'
import message from '../Form/message'
import Card from '../Form/Card'
import Row from '../Form/Row'
import Col from '../Form/Col'
import Space from '../Form/Space'
import { BoxTitleDiv, FormInputWrapper } from '../../Styles/AppWrapper'
import SingleImageUploader from '../Form/SingleImageUploader'
import IAsset from '../../Types/Asset/IAsset'
import InlineInput from '../Form/InlineInput'
import Icons from '../Icons'
import InlineRichTextEditor from '../Form/InlineRichTextEditor'

type iState = {
  company?: ICompany
  loading: boolean
  loadingErr?: object
}
const initState: iState = {
  loading: false,
}

const CompanyBasicInfoEditor = ({ company }: { company: ICompany }) => {
  return null
  // const [state, setState] = useState(initState);
  // const dispatch = useDispatch();
  //
  // const companyUpdated = (fieldName: string, newValue: string | object) => {
  //   if (!state.company) {
  //     return;
  //   }
  //   const comp = {
  //     ...state.company,
  //     [fieldName]: newValue,
  //   };
  //   if (!comp.id) return;
  //   CompanyService.update(comp.id, comp)
  //     .then((res) => {
  //       const newCompany = res;
  //       setState({
  //         ...state,
  //         company: newCompany,
  //       });
  //       message.success(`Company (${comp.name}) updated.`);
  //       dispatch(changeCompany({ company: newCompany }));
  //     })
  //     .catch((error: IError) => {
  //       message.error(error.message);
  //       setState({
  //         ...state,
  //         company: state.company,
  //       });
  //     });
  // };
  //
  // const companyConfigObjUpdated = (fieldName: string, newValue: ICompanyAuthor[] | string) => {
  //   if (!state.company) {
  //     return;
  //   }
  //   const obj = {
  //     ...state.company.config,
  //     [fieldName]: newValue,
  //   };
  //   companyUpdated('configObj', obj);
  // };
  //
  // useEffect(() => {
  //   if (!company || !company.id) return;
  //   setState((s) => ({
  //     ...s,
  //     company,
  //     loading: true,
  //     loadingErr: undefined,
  //   }));
  // }, [company]);
  //
  // return (
  //   state.company
  //     ? <Card>
  //     <Row gutter={32}>
  //       <Col md={{ span: 7 }}>
  //         <Space direction="vertical" style={{ width: '100%' }}>
  //           <FormInputWrapper style={{ height: '180px' }}>
  //             <SingleImageUploader onChange={(newAsset: IAsset) => companyUpdated('logoAssetId', newAsset.id)}
  //                 title={translate('upload-logo')}
  //                 initImgUrl={
  //                   state.company?.LogoAsset?.url // eslint-disable-line
  //                 }
  //             />
  //           </FormInputWrapper>
  //           <FormInputWrapper>
  //             <BoxTitleDiv>{translate('company-number')}</BoxTitleDiv>
  //             <InlineInput
  //               allowClear
  //               placeholder={translate('company-number-like')}
  //               prefix={<Icons.TrademarkCircleFilled/>}
  //               value={state.company.companyNumber}
  //               onChange={(newValue: string) => companyUpdated('companyNumber', newValue)}
  //             />
  //           </FormInputWrapper>
  //         </Space>
  //       </Col>
  //
  //       <Col md={{ span: 17 }}>
  //         <Row gutter={18}>
  //           <Col md={{ span: 8 }}>
  //             <FormInputWrapper>
  //               <BoxTitleDiv>{translate('company-website')}</BoxTitleDiv>
  //               <InlineInput
  //                 allowClear
  //                 placeholder={translate('company-url')}
  //                 prefix={<Icons.CompassFilled/>}
  //                 value={state.company.websiteUrl}
  //                 onChange={(newValue: string) => companyUpdated('websiteUrl', newValue)}
  //               />
  //             </FormInputWrapper>
  //           </Col>
  //           <Col md={{ span: 8 }}>
  //             <FormInputWrapper>
  //               <BoxTitleDiv>{translate('company-e')}</BoxTitleDiv>
  //               <InlineInput
  //                 allowClear
  //                 placeholder={translate('company-email')}
  //                 prefix={<Icons.MailFilled/>}
  //                 value={state.company.email}
  //                 onChange={(newValue: string) => companyUpdated('email', newValue)}
  //               />
  //             </FormInputWrapper>
  //           </Col>
  //           <Col md={{ span: 8 }}>
  //             <FormInputWrapper>
  //               <BoxTitleDiv>{translate('company-contact')}</BoxTitleDiv>
  //               <InlineInput
  //                 allowClear
  //                 placeholder={translate('company-contact-num')}
  //                 prefix={<Icons.PhoneFilled/>}
  //                 value={state.company.contactNumber}
  //                 onChange={(newValue: string) => companyUpdated('contactNumber', newValue)}
  //               />
  //             </FormInputWrapper>
  //           </Col>
  //           <Col md={{ span: 24 }}>
  //             <FormInputWrapper>
  //               <BoxTitleDiv>{translate('company-a')}</BoxTitleDiv>
  //               <InlineInput
  //                 allowClear
  //                 placeholder={translate('company-address')}
  //                 prefix={<Icons.EnvironmentFilled/>}
  //                 value={state.company.configObj?.address}
  //                 onChange={(newValue: string) => companyConfigObjUpdated('address', newValue)}
  //               />
  //             </FormInputWrapper>
  //           </Col>
  //           <Col md={{ span: 24 }}>
  //             <BoxTitleDiv>{translate('company-des')}</BoxTitleDiv>
  //             <InlineRichTextEditor value={state.company.description} height={180} maxHeight={180}
  //               placeholder={translate('company-description')}
  //               onChange={(newValue: string) => companyUpdated('description', newValue)}
  //             />
  //           </Col>
  //         </Row>
  //       </Col>
  //     </Row>
  //   </Card>
  //     : null
  //
  // );
}

export default CompanyBasicInfoEditor
