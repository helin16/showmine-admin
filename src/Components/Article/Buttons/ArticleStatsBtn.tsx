import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useIntl } from 'react-intl'
import IArticle from '../../../Types/Article/IArticle'
import VisitStats from '../../Stats/VisitStats'
import { RootState } from '../../../Redux/makeReduxStore'
import Button, { iButton } from '../../Form/Button'
import Modal from '../../Form/Modal'

type iState = {
  article?: IArticle
  showingDiv: boolean
}
const initialState: iState = {
  showingDiv: false,
}

const ArticleStatsBtn = ({ article, children, ...props }: iButton & { article?: IArticle }) => {
  const [state, setState] = useState(initialState)
  const { company } = useSelector((s: RootState) => s.auth)
  const intl = useIntl()

  const showOrHideConfirmDiv = (showing: boolean) => {
    setState({
      ...state,
      showingDiv: showing,
    })
  }

  if (!article) {
    return null
  }

  return (
    <>
      <Button
        {...props}
        onClick={() => {
          showOrHideConfirmDiv(true)
        }}
      >
        {children || intl.formatMessage({ id: 'visit_stat' })}
      </Button>
      {state.showingDiv !== true ? null : (
        <Modal
          open={state.showingDiv === true}
          title={`${intl.formatMessage({ id: 'visit_stat' })}:`}
          footer={null}
          width={'80%'}
          onCancel={() => {
            showOrHideConfirmDiv(false)
          }}
        >
          <VisitStats article={state.article} />
        </Modal>
      )}
    </>
  )
}

export default ArticleStatsBtn
