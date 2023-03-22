import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_MEDIA } from '../../Components/Menu/MenuItems'
import translate from '../../i18n/translate'
import BackendPage from '../../Layouts/BackendPage'
import { listGutter } from '../../Styles/AppWrapper'
import Card from '../../Components/Form/Card'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import CompanyMediaUsage from '../../Components/Media/CompanyMediaUsage'
import MediaList from '../../Components/Media/MediaList'
import styled from 'styled-components'
import Row from '../../Components/Form/Row'
import Col from '../../Components/Form/Col'
import Search from '../../Components/Form/Search'

const initialState = {
  keyword: '',
  sortingField: 'updated_at',
  sortingDirection: 'desc',
}

const Wrapper = styled.div`
  .search-box {
    border-bottom: 1px dashed #ccc;
    margin: 18px 0px 7px 0px;
  }
  .ant-input-group-addon button,
  .ant-input-affix-wrapper {
    border: none;
  }
`

const MediaListPage = () => {
  const { company } = useSelector((state: RootState) => state.auth)
  const [state, setState] = useState(initialState)
  if (!company) {
    return null
  }
  /**
   *
   * @param searchText
   */
  const search = (searchText: string) => {
    setState({
      ...state,
      keyword: searchText,
    })
  }

  return (
    <BackendPage selectedMenu={MENU_KEY_MEDIA} ContentHeader={<BackendPageContentTitle title={translate('media')} />}>
      <Wrapper>
        <Row gutter={listGutter}>
          <Col xs={{ span: 24 }} md={{ span: 10, order: 2 }} lg={{ span: 8, order: 2 }} className={'hidden-xs'}>
            <Card>
              <CompanyMediaUsage />
            </Card>
          </Col>
          <Col xs={{ span: 24 }} md={{ span: 14, order: 1 }} lg={{ span: 16, order: 1 }}>
            <Card>
              <Search
                className={'search-box'}
                placeholder={translate('search-article-title')}
                allowClear={true}
                onSearch={search}
              />
            </Card>
          </Col>
        </Row>
        <Card>{company ? <MediaList keyword={state.keyword} /> : null}</Card>
      </Wrapper>
    </BackendPage>
  )
}

export default MediaListPage
