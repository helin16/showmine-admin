import React, { useState } from 'react'
import styled from 'styled-components'
import ICompany from '../../Types/Company/ICompany'
import CompanyService from '../../Services/CompanyService'
import SingleImageUploader from '../Form/SingleImageUploader'
import CompanyAuthors from './CompanyAuthors'
import InlineInput from '../Form/InlineInput'
import IError from '../../Types/IError'
import InlineRichTextEditor from '../Form/InlineRichTextEditor'
import CompanyTags from './CompanyTags'
import IAsset, {ASSET_TYPE_COMPANY_LOGO, ASSET_TYPE_COMPANY_PROFILE} from '../../Types/Asset/IAsset'
import translate from '../../i18n/translate'
import message from '../Form/message'
import Card from '../Form/Card'
import Row from '../Form/Row'
import Col from '../Form/Col'
import Space from '../Form/Space'
import { BoxTitleDiv, BoxTitleSuffix, FormInputWrapper } from '../../Styles/AppWrapper'
import Icons from '../Icons'
import Spin from '../Form/Spin'

const CompanyEditorWrapper = styled.div``
/**
 *
 * @param company
 * @constructor
 */
const CompanyEditor = ({ company, onSaved }: { company: ICompany; onSaved?: (newCom: ICompany) => void }) => {
  // return null
  const [isSaving, setIsSaving] = useState(false);

  /**
   *
   * @param fieldName
   * @param newValue
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyUpdated = (fieldName: string, newValue: any, savedFn?: (newCom: ICompany) => void) => {
    if (!company.id) return;
    const comp = {
      [fieldName]: newValue,
    };

    setIsSaving(true);
    return CompanyService.update(company.id, comp)
      .then((res) => {
        const newCompany = res;
        message.success(`Company (${newCompany.name}) updated.`);
        if (typeof (savedFn) === 'function') {
          savedFn(newCompany);
        }
      })
      .catch((error: IError) => {
        message.error(error.message);
      })
      .finally(() => {
        setIsSaving(false);
      })
  };

  /**
   * Rendering
   */
  return (
    <CompanyEditorWrapper>
      <Spin spinning={isSaving}>
        <Card>
          <InlineInput
            allowClear
            placeholder={translate('company-name')}
            value={company.name || ''}
            onChange={(newValue: string) => companyUpdated('name', newValue, onSaved)}
          />
        </Card>

        <Card>
          <Row gutter={32}>
            <Col md={{ span: 7 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <FormInputWrapper style={{ height: '180px' }}>
                  <SingleImageUploader
                     assetType={ASSET_TYPE_COMPANY_LOGO}
                     onChange={(newAsset: IAsset | null) => companyUpdated('logoAssetId', newAsset?.id || null, onSaved)}
                     title={translate('upload-logo')}
                     onSetIsSaving={(saving) => setIsSaving(saving)}
                     initImgUrl={
                       company.LogoAsset?.url // eslint-disable-line
                     }
                  />
                </FormInputWrapper>
                <FormInputWrapper>
                  <BoxTitleDiv>{translate('company-number')}</BoxTitleDiv>
                  <InlineInput
                    allowClear
                    placeholder={translate('company-number-like')}
                    prefix={<Icons.TrademarkCircleFilled/>}
                    value={company.companyNumber}
                    onChange={(newValue: string) => companyUpdated('companyNumber', newValue, onSaved)}
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
                      value={company.websiteUrl || ''}
                      onChange={(newValue: string) => companyUpdated('websiteUrl', newValue, onSaved)}
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
                      value={company.email || ''}
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
                      value={company.contactNumber || ''}
                      onChange={(newValue: string) => companyUpdated('contactNumber', newValue, onSaved)}
                    />
                  </FormInputWrapper>
                </Col>
                <Col md={{ span: 24 }}>
                  <BoxTitleDiv>{translate('company-des')}</BoxTitleDiv>
                  <InlineRichTextEditor
                    isInLine
                    value={company.description}
                    height={180}
                    maxHeight={180}
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
            <CompanyAuthors />
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
            <CompanyTags />
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
            <InlineRichTextEditor
              isInLine
              value={company.itemDefaultFooter || ''}
              assetType={ASSET_TYPE_COMPANY_PROFILE}
              height={380}
              placeholder={translate('content-in-bottom')}
              onChange={(newValue: string) => companyUpdated('itemDefaultFooter', newValue)}
            />
          </FormInputWrapper>
        </Card>
      </Spin>
    </CompanyEditorWrapper>
  );
}

export default CompanyEditor
