import React, { useState } from 'react'
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import { useIntl } from 'react-intl'
import { RootState } from '../../Redux/makeReduxStore'
import ArticleService from '../../Services/ArticleService'
import { ARTICLE_DETAILS_URL, getUrl } from '../../UrlMap'
import message from '../Form/message'
import { BoxTitleDiv, FormInputWrapper } from '../../Styles/AppWrapper'
import InlineInput from '../Form/InlineInput'
import Button from '../Form/Button'
import Icons from '../Icons'
import { useNavigate } from 'react-router-dom'
import AppService from '../../Services/AppService';

const NewArticleGuideDiv = styled.div``

const NewArticleGuide = () => {
  const { user, company } = useSelector((s: RootState) => s.auth)
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState('')
  const intl = useIntl()
  const navigate = useNavigate()

  const handleValueChanged = (newTitle: string) => {
    setTitle(`${newTitle || ''}`.trim())
  }

  const creatArticle = () => {
    if (isSaving) return
    const currentUserId = `${user?.id || ''}`.trim()
    const currentCompanyId = `${company?.id || ''}`.trim()
    if (currentUserId === '' || currentCompanyId === '') {
      message.error(intl.formatMessage({ id: 'no-company' }))
      return
    }
    if (title === '') {
      message.error(intl.formatMessage({ id: 'need-title' }))
      return
    }
    setIsSaving(true);
    ArticleService.create({ title })
      .then((res) => {
        navigate(getUrl(ARTICLE_DETAILS_URL, ':id', res.id))
      })
      .catch((err) => {
        message.error(intl.formatMessage({ id: 'failed-create' }, { text: err.message }))
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  return (
    <NewArticleGuideDiv>
      <FormInputWrapper>
        <BoxTitleDiv>
          <h1>{intl.formatMessage({ id: 'what-in-mind' })}</h1>
        </BoxTitleDiv>
        <InlineInput
          placeholder={intl.formatMessage({ id: 'what-in-mind' })}
          value={title}
          onKeyUp={(e: any) => handleValueChanged(e.target.value)}
          onPressEnter={creatArticle}
        />
      </FormInputWrapper>
      <Button type={'primary'} loading={isSaving} onClick={creatArticle} disabled={title === ''}>
        {intl.formatMessage({ id: 'continue' })}
        <Icons.RightOutlined />
      </Button>
    </NewArticleGuideDiv>
  )
}

export default NewArticleGuide
