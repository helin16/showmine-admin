import React, { ChangeEvent, useState } from 'react'
import ICompany from '../../Types/Company/ICompany'
import CompanyService from '../../Services/CompanyService'
import { FormInputWrapper } from '../../Styles/AppWrapper'
import Icons from '../Icons'
import Button, { iButton } from '../Form/Button'
import Modal from '../Form/Modal'
import InputBox from '../Form/InputBox'
import Typography from '../Form/Typography'
import message from '../Form/message'

type iState = {
  confirming: boolean
  confirmingNameDiff?: boolean
  confirmingName: string
  deleting: boolean
}
const initialState: iState = {
  confirming: false,
  confirmingName: '',
  deleting: false,
}


type iCompanyDeleteBtn = iButton & {
  company: ICompany
  onDeleted?: (deletedCompany: ICompany) => void;
  noText?: boolean
}
const CompanyDeleteBtn = ({
  company,
  onDeleted,
  noText,
  children,
  ...props
}: iCompanyDeleteBtn) => {
  const [state, setState] = useState(initialState)
  const deleteComp = () => {
    if (!company || !company.id) {
      return
    }
    if (state.confirmingName !== company.name) {
      setState({
        ...state,
        confirmingNameDiff: true,
      })
      return
    }
    setState({
      ...state,
      deleting: true,
      confirmingNameDiff: undefined,
    })
    CompanyService.deactivate(company.id)
      .then((res) => {
        setState(initialState)
        message.success('Company deleted successfully.')
        setState({
          ...state,
          deleting: false,
        })
        if (typeof onDeleted === 'function') {
          onDeleted(res)
        }
      })
      .catch((err) => {
        message.error(`Error when deleting company: ${err.message}`)
        setState(initialState)
      })
  }

  const cancel = () => {
    setState({
      ...state,
      confirming: false,
    })
  }

  const getErrorMsg = () => {
    if (state.confirmingNameDiff === undefined) {
      return null
    }

    return (
      <Typography.Text type='danger'>
        <Typography.Text type='warning'>
          <Icons.WarningOutlined />
        </Typography.Text>{' '}
        {state.confirmingName === ''
          ? 'Please type in the company name to confirm'
          : 'Provided name is different from company name'}
      </Typography.Text>
    )
  }

  /**
   * rendering
   */
  return (
    <div>
      <Button
        {...{
          type: 'primary',
          danger: true,
          icon: <Icons.DeleteOutlined />,
          ...props,
        }}
        onClick={() => setState({ ...state, confirming: true })}
      >
        {noText === true ? null : children || 'Delete'}
      </Button>
      <Modal
        open={state.confirming === true}
        title={<h3>Deleting this company?</h3>}
        onOk={deleteComp}
        onCancel={cancel}
        okText={'Confirm Delete'}
        okButtonProps={{ icon: <Icons.DeleteOutlined />, danger: true, loading: state.deleting }}
        cancelButtonProps={{ type: 'link' }}
      >
        <p>
          After deleting this company, you will <b>NOT be able to recover it anymore</b>. To avoid accidental deleting,
          please type in the company name to confirm deletion
        </p>
        <FormInputWrapper>
          <div>
            Please type in <b>{company.name}</b> to confirm:
          </div>
          <InputBox
            allowClear
            placeholder={'Type in the company name to confirm'}
            value={state.confirmingName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setState({ ...state, confirmingName: e.target.value })}
          />
        </FormInputWrapper>
        {getErrorMsg()}
      </Modal>
    </div>
  )
}

export default CompanyDeleteBtn
