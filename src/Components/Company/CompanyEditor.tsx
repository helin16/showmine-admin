import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ICompany, {initialCompany} from '../../Types/Company/ICompany';
import CompanyService from '../../Services/CompanyService';
import SingleImageUploader from '../Form/SingleImageUploader';
import CompanyAuthors from './CompanyAuthors';
import InlineInput from '../Form/InlineInput';
import IError from '../../Types/IError';
import InlineRichTextEditor from '../Form/InlineRichTextEditor';
import ICompanyAuthor from '../../Types/Company/ICompanyAuthor';
import CompanyTags from './CompanyTags';
import IAsset from '../../Types/Asset/IAsset';
import translate from '../../i18n/translate';
import message from '../Form/message';
import Card from '../Form/Card';
import Row from '../Form/Row';
import Col from '../Form/Col';
import Space from '../Form/Space';
import {BoxTitleDiv, BoxTitleSuffix, FormInputWrapper} from '../../Styles/AppWrapper';
import Icons from '../Icons';
import Spin from '../Form/Spin';

const CompanyEditorWrapper = styled.div``;
type iState = {
  company: ICompany;
  uploadingLogo: boolean;
  isSaving: boolean;
}
const initState: iState = {
  uploadingLogo: false,
  company: initialCompany,
  isSaving: false,
};
/**
 *
 * @param company
 * @constructor
 */
const CompanyEditor = ({ company, onSaved }: {company: ICompany, onSaved?: (newCom: ICompany) => void}) => {
  const [state, setState] = useState(initState);
  /**
   * format company
   */
  useEffect(() => {
    setState((s) => ({
      ...s,
      company,
    }));
  }, [company]);

  /**
   *
   * @param fieldName
   * @param newValue
   */
  const companyUpdated = (fieldName: string, newValue: string | object, savedFn?: (newCom: ICompany) => void) => {
    const comp = {
      ...state.company,
      [fieldName]: newValue,
    };
    if (!comp.id) return;

    setState({
      ...state,
      isSaving: true,
    })
    return CompanyService.updateCompany(comp.id, comp)
      .then((res) => {
        const newCompany = res.data;
        setState({
          ...state,
          company: newCompany,
          isSaving: false,
        });
        message.success(`Company (${comp.name}) updated.`);
        if (typeof (savedFn) === 'function') {
          savedFn(newCompany);
        }
      })
      .catch((error: IError) => {
        message.error(error.message);
        setState({
          ...state,
          company: state.company,
          isSaving: false,
        });
      });
  };

  const companyConfigObjUpdated = (fieldName: string, newValue: ICompanyAuthor[] | string) => {
    const obj = {
      ...state.company.configObj,
      [fieldName]: newValue,
    };
    companyUpdated('configObj', obj, onSaved);
  };

  /**
   * Rendering
   */
  return (
    <CompanyEditorWrapper>
      <Spin spinning={state.isSaving}>
        <Card>
          <InlineInput
            allowClear
            placeholder={translate('company-name')}
            value={state.company.name}
            onChange={(newValue: string) => companyUpdated('name', newValue, onSaved)}
          />
        </Card>

        <Card>
          <Row gutter={32}>
            <Col md={{ span: 7 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <FormInputWrapper style={{ height: '180px' }}>
                  <SingleImageUploader onChange={(newAsset: IAsset) => companyUpdated('logo_img', newAsset, onSaved)}
                     title={translate('upload-logo')}
                     initImgUrl={
                       state.company?.logo_img?.url // eslint-disable-line
                     }
                  />
                </FormInputWrapper>
                <FormInputWrapper>
                  <BoxTitleDiv>{translate('company-number')}</BoxTitleDiv>
                  <InlineInput
                    allowClear
                    placeholder={translate('company-number-like')}
                    prefix={<Icons.TrademarkCircleFilled/>}
                    value={state.company.company_number}
                    onChange={(newValue: string) => companyUpdated('company_number', newValue, onSaved)}
                  />
                </FormInputWrapper>
                <FormInputWrapper>
                  <BoxTitleDiv>{translate('company-slogan')}</BoxTitleDiv>
                  <InlineInput
                    allowClear
                    placeholder={translate('company-slogan')}
                    prefix={<Icons.FlagFilled/>}
                    value={state.company.configObj?.slogan}
                    onChange={(newValue: string) => companyConfigObjUpdated('slogan', newValue)}
                  />
                </FormInputWrapper>
              </Space>
            </Col>

            <Col md={{ span: 17 }}>
              <Row gutter={18}>
                <Col md={{ span: 8 }}>
                  <FormInputWrapper>
                    <BoxTitleDiv>{translate('company-website')}</BoxTitleDiv>
                    <InlineInput
                      allowClear
                      placeholder={translate('company-url')}
                      prefix={<Icons.CompassFilled/>}
                      value={state.company.website}
                      onChange={(newValue: string) => companyUpdated('website', newValue, onSaved)}
                    />
                  </FormInputWrapper>
                </Col>
                <Col md={{ span: 8 }}>
                  <FormInputWrapper>
                    <BoxTitleDiv>{translate('company-e')}</BoxTitleDiv>
                    <InlineInput
                      allowClear
                      placeholder={translate('company-email')}
                      prefix={<Icons.MailFilled/>}
                      value={state.company.email}
                      onChange={(newValue: string) => companyUpdated('email', newValue, onSaved)}
                    />
                  </FormInputWrapper>
                </Col>
                <Col md={{ span: 8 }}>
                  <FormInputWrapper>
                    <BoxTitleDiv>{translate('company-contact')}</BoxTitleDiv>
                    <InlineInput
                      allowClear
                      placeholder={translate('company-contact-num')}
                      prefix={<Icons.PhoneFilled/>}
                      value={state.company.contact_number}
                      onChange={(newValue: string) => companyUpdated('contact_number', newValue, onSaved)}
                    />
                  </FormInputWrapper>
                </Col>
                <Col md={{ span: 24 }}>
                  <FormInputWrapper>
                    <BoxTitleDiv>{translate('company-a')}</BoxTitleDiv>
                    <InlineInput
                      allowClear
                      placeholder={translate('company-address')}
                      prefix={<Icons.EnvironmentFilled/>}
                      value={state.company.configObj?.address}
                      onChange={(newValue: string) => companyConfigObjUpdated('address', newValue)}
                    />
                  </FormInputWrapper>
                </Col>
                <Col md={{ span: 24 }}>
                  <BoxTitleDiv>{translate('company-des')}</BoxTitleDiv>
                  <InlineRichTextEditor value={state.company.description} height={180} maxHeight={180}
                    placeholder={translate('company-description')}
                    onChange={(newValue: string) => companyUpdated('description', newValue, onSaved)}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        <Card>
          <FormInputWrapper>
            <BoxTitleDiv>
              {translate('authors')}
              <BoxTitleSuffix>
                {translate('authors-contents')}
              </BoxTitleSuffix>
            </BoxTitleDiv>
            <CompanyAuthors
              authors={state.company.configObj?.authorInfo || []}
              onChange={(newArray: Array<ICompanyAuthor>) => companyConfigObjUpdated('authorInfo', newArray)}
            />
          </FormInputWrapper>
        </Card>
        <Card>
          <FormInputWrapper>
            <BoxTitleDiv>
              {translate('tags')}
              <BoxTitleSuffix>
                {translate('tags-contents')}
              </BoxTitleSuffix>
            </BoxTitleDiv>
            <CompanyTags company={state.company} onChange={companyUpdated} />
          </FormInputWrapper>
        </Card>
        <Card>
          <FormInputWrapper>
            <BoxTitleDiv>
              {translate('content-footer')}
              <BoxTitleSuffix>
                {translate('content-in-bottom-2')}
              </BoxTitleSuffix>
            </BoxTitleDiv>
            <InlineRichTextEditor value={state.company.configObj?.defaultContact}
              height={380}
              placeholder={translate('content-in-bottom')}
              onChange={(newValue: string) => companyConfigObjUpdated('defaultContact', newValue)}
            />
          </FormInputWrapper>
        </Card>
      </Spin>
    </CompanyEditorWrapper>
  );
};

export default CompanyEditor;
