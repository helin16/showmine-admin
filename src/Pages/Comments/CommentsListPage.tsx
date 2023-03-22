import React from 'react'
import { useSelector } from 'react-redux'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import BackendPage from '../../Layouts/BackendPage'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_COMMENTS } from '../../Components/Menu/MenuItems'
import translate from '../../i18n/translate'
import Card from '../../Components/Form/Card'
import CommentsList from '../../Components/Comments/CommentsList'

const CommentsListPage = () => {
  const { company } = useSelector((state: RootState) => state.auth)

  return (
    <BackendPage
      selectedMenu={MENU_KEY_COMMENTS}
      ContentHeader={<BackendPageContentTitle title={translate('comment')} />}
    >
      <Card>{company ? <CommentsList /> : null}</Card>
    </BackendPage>
  )
}

export default CommentsListPage
