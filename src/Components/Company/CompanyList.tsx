import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import moment from 'moment'
import { RootState } from '../../Redux/makeReduxStore'
import CompanyService from '../../Services/CompanyService'
import InvalidAccessPanel from '../Error/InvalidAccessPanel'
import { BACK_END_URL } from '../../UrlMap'
import ICompany from '../../Types/Company/ICompany'
import UserService from '../../Services/UserService'
import { changeCompany } from '../../Redux/reduxers/auth.slice'
import CompanyDeleteBtn from './CompanyDeleteBtn'
import message from '../Form/message'
import Space from '../Form/Space'
import Tooltip from '../Form/Tooltip'
import Button from '../Form/Button'
import Icons from '../Icons'
import Card from '../Form/Card'
import Spin from '../Form/Spin'
import Table from '../Form/Table'
import Modal from '../Form/Modal'
import Steps from '../Form/Steps'
import AuthService from '../../Services/AuthService'

const CompanyListWrapper = styled.div`
  .ant-steps-item-title {
    font-size: 10px !important;
  }
  .company-name-link {
    padding: 0px;
    height: auto;
    border: none;
    background: transparent;
    white-space: initial;
    text-align: left;
    font-size: 14px;
  }
  .ant-steps-label-vertical .ant-steps-item-content {
    width: 50px !important;
  }
  .ant-steps-dot .ant-steps-item-icon,
  .ant-steps-dot.ant-steps-small .ant-steps-item-icon {
    margin-inline-start: 20px !important;
  }
  .ant-steps-dot .ant-steps-item-tail,
  .ant-steps-dot.ant-steps-small .ant-steps-item-tail {
    margin-inline-start: 24px !important;
  }

  .ant-steps-item.ant-steps-item-process.ant-steps-item-active .ant-steps-item-content {
    margin-top: 10px;
  }
`

type iState = {
  currentCompany?: ICompany
  companies: ICompany[]
  loading: boolean
  selectedCompanyIds: React.Key[]
  selectedCompanies: ICompany[]
  showingCompany?: ICompany
}
const initialState: iState = {
  companies: [],
  loading: false,
  selectedCompanyIds: [],
  selectedCompanies: [],
}
const CompanyList = () => {
  return null
  // const [state, setState] = useState(initialState);
  // const { user, company } = useSelector((s: RootState) => s.auth);
  // const dispatch = useDispatch();
  //
  // useEffect(() => {
  //   if (!company) return;
  //   setState((s) => ({
  //     ...s,
  //     currentCompany: company,
  //   }));
  // }, [company]);
  //
  // useEffect(() => {
  //   if (user?.isSuperAdmin !== true) return;
  //
  //   setState((s) => ({
  //     ...s,
  //     loading: true,
  //   }));
  //   let isCancelled = false;
  //   CompanyService.getAll()
  //     .then((res) => {
  //       if (isCancelled === true) return;
  //       setState((s) => ({
  //         ...s,
  //         companies: res.data,
  //         loading: false,
  //       }));
  //     })
  //     .catch((err) => {
  //       if (isCancelled === true) return;
  //       message.error(`Error when fetching companies: ${err.message}`);
  //       setState((s) => ({
  //         ...s,
  //         loading: false,
  //       }));
  //     });
  //   return () => { // eslint-disable-line
  //     isCancelled = true;
  //   };
  // }, [user]);
  //
  // const getCompanyFromId = (id: string) => {
  //   const companies = state.companies.filter((comp: ICompany) => comp.id === id);
  //   if (companies.length === 0) return undefined;
  //   return companies[0];
  // };
  //
  // const getOptionBtns = (id: string) => {
  //   const comp = getCompanyFromId(id);
  //   if (!comp) return null;
  //   return (
  //     <Space>
  //       {(`${comp.contactNumber || ''}` !== '') ? (
  //         <Tooltip title={comp.contactNumber}>
  //           <Button icon={<Icons.PhoneOutlined />} type={'link'} href={`tel:${comp.contactNumber}`} target={'__blank'}/>
  //         </Tooltip>
  //       ) : null}
  //       {(`${comp.email || ''}` !== '') ? (
  //         <Tooltip title={comp.email}>
  //           <Button icon={<Icons.MailOutlined />} type={'link'} href={`mailto:${comp.email}`} target={'__blank'}/>
  //         </Tooltip>
  //       ) : null}
  //       {(`${comp.websiteUrl || ''}` !== '') ? (
  //         <Tooltip title={comp.websiteUrl}>
  //           <Button icon={<Icons.GlobalOutlined />} type={'link'} href={`${comp.websiteUrl}`} target={'__blank'}/>
  //         </Tooltip>
  //       ) : null}
  //     </Space>
  //   );
  // };
  //
  // const getNameLink = (id: string) => {
  //   const comp = getCompanyFromId(id);
  //   if (!comp) return null;
  //
  //   return (
  //     <div>
  //       <Tooltip title={'click to view the json'}>
  //         <Button type={'link'} className={'company-name-link'}
  //           onClick={() => { setState({ ...state, showingCompany: comp }); }}>
  //           {comp.name}
  //         </Button>
  //       </Tooltip>
  //       <div><small>{moment(comp.createdAt).format('ll')}</small></div>
  //     </div>
  //   );
  // };
  // const getStatusDiv = (id: string) => {
  //   const comp = getCompanyFromId(id);
  //   if (!comp) return null;
  //   if (comp.config?.onBoard?.has_been_setup !== true) {
  //     return (
  //       <h1>Not on-boarded</h1>
  //     );
  //   }
  //
  //   let currentStep = 0;
  //   if (comp.config?.onBoard?.has_set_channel === true) {
  //     currentStep = 1;
  //     if (comp.config?.onBoard?.has_set_article === true) {
  //       currentStep = 2;
  //     }
  //   }
  //   if (comp.config?.onBoard?.has_done_wizard === true) {
  //     currentStep = 3;
  //   }
  //
  //   return (
  //     <Steps
  //       progressDot
  //       current={currentStep}
  //       size={'small'}
  //       items={[
  //         {title: "Started"},
  //         {title: "Channels"},
  //         {title: "Articles"},
  //         {title: "Done"},
  //       ]}
  //     />
  //   );
  // };
  //
  // const switchCompany = (id: string) => {
  //   const comp = getCompanyFromId(id);
  //   if (!comp) return null;
  //   AuthService.updateMe({
  //       lastVisitCompanyId: comp.id
  //     })
  //     .then(() => {
  //       dispatch(changeCompany({ company: comp }));
  //       message.success(`Successfully switch to: ${comp.name}`);
  //     })
  //     .catch((err) => {
  //       message.error(`Switch company error ${err.message}`);
  //     });
  //   return null;
  // };
  //
  // const companyDeleted = (comp: ICompany) => {
  //   setState({
  //     ...state,
  //     companies: state.companies.filter((com: ICompany) => com.id !== comp.id),
  //   });
  // };
  //
  // const getBtns = (id: string) => {
  //   if (state.currentCompany && id === state.currentCompany.id) return null;
  //   return (
  //     <Space>
  //       <Tooltip title="Impersonate as admin of this company">
  //         <Button type={'primary'} onClick={() => switchCompany(id)} icon={<Icons.UserOutlined />}></Button>
  //       </Tooltip>
  //       <CompanyDeleteBtn company={getCompanyFromId(id)} onDeleted={companyDeleted} noText={true}/>
  //     </Space>
  //   );
  // };
  //
  // if (CompanyService.isUserSuperAdmin(user) !== true) {
  //   return (<InvalidAccessPanel homeUrl={BACK_END_URL}/>);
  // }
  //
  // return (
  //   <CompanyListWrapper className={'company-list'}>
  //     <Card>
  //       <Spin spinning={state.loading}>
  //         <Table
  //           pagination={{
  //             total: state.companies.length,
  //             pageSize: state.companies.length,
  //             hideOnSinglePage: true,
  //           }}
  //           className={'company-table'}
  //           // rowSelection={{
  //           //   type: 'checkbox',
  //           //   onChange: (selectedRowKeys, selectedRows) => {
  //           //     setState({
  //           //       ...state,
  //           //       selectedCompanyIds: selectedRowKeys,
  //           //       selectedCompanies: selectedRows,
  //           //     });
  //           //   },
  //           // }}
  //           columns={[
  //             {
  //               title: 'Name',
  //               dataIndex: 'id',
  //               render: getNameLink,
  //             },
  //             {
  //               title: 'Contacts',
  //               dataIndex: 'id',
  //               width: 160,
  //               render: getOptionBtns,
  //             },
  //             {
  //               title: 'Setup',
  //               align: 'center',
  //               dataIndex: 'id',
  //               width: 250,
  //               render: getStatusDiv,
  //             },
  //             {
  //               title: '',
  //               dataIndex: 'id',
  //               width: 100,
  //               render: getBtns,
  //             },
  //           ]}
  //           dataSource={
  //             state.companies
  //               .sort((a: ICompany, b: ICompany) => (a.created_at > b.created_at ? 0 : 1))
  //               .map((comp: ICompany) => ({ ...comp, key: comp.id }))
  //           }
  //         />
  //       </Spin>
  //     </Card>
  //     {!state.showingCompany ? null : (
  //       <Modal
  //         width={'80%'}
  //         open={state.showingCompany !== undefined}
  //         title={state.showingCompany.name}
  //         footer={null}
  //         onCancel={() => { setState({ ...state, showingCompany: undefined }); }}
  //       >
  //         <pre>{JSON.stringify(state.showingCompany, null, 2)}</pre>
  //       </Modal>
  //     )}
  //   </CompanyListWrapper>
  // );
}

export default CompanyList
