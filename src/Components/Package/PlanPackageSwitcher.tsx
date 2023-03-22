import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { RootState } from '../../Redux/makeReduxStore'
import {
  displayPlans,
  displayConfirm,
  displayChoosedPlan,
  hideChoosedPlan,
} from '../../Redux/reduxers/billingpage.slice'
import PackageCard from './PackageCard'
import PlanSubscribe from './PlanSubscribe'
import CompanyService from '../../Services/CompanyService'
import InvoiceColumns from './InvoiceColumns'
import Icons from '../Icons'
import message from '../Form/message'
import Row from '../Form/Row'
import Button from '../Form/Button'
import Col from '../Form/Col'
import Table from '../Form/Table'

const myColumns = [
  ...InvoiceColumns,
  {
    title: 'Download Invoice',
    key: 'invoice_pdf',
    dataIndex: 'invoice_pdf',
    render: (pdf: string) => (
      <a href={pdf} download='proposed_file_name'>
        <Icons.DownloadOutlined style={{ fontSize: '25px', color: '#08c' }} />
      </a>
    ),
  },
]

const PlanPackageSwitcherWrapper = styled.div``
const PlanPackageSwitcher = () => {
  return null
  // const dispatch = useDispatch();
  // const {
  //   showPlans,
  //   showConfirm,
  //   showChoosedPlan,
  // } = useSelector(
  //   (s: RootState) => s.billingPage,
  // );
  // const [state, setState] = useState(initialState);
  //
  // useEffect(() => {
  //   if (!planPackage) {
  //     return;
  //   }
  //
  //   setState((s) => ({
  //     ...s,
  //     planPackage,
  //     initLoading: true,
  //   }));
  //
  //   CompanyService.getPackages(companyId)
  //     .then((res) => {
  //       setState((s) => ({
  //         ...s,
  //         initLoading: false,
  //         packages: res.data,
  //       }));
  //     })
  //     .catch((err) => {
  //       message.error(`Error when fetching packages: ${err.message}`);
  //       setState((s) => ({
  //         ...s,
  //         initLoading: false,
  //       }));
  //     });
  //
  //   if (planPackage.name !== 'Free') {
  //     CompanyService.getInvoice(companyId)
  //       .then((res) => {
  //         setState((s) => ({
  //           ...s,
  //           initLoading: false,
  //           invoices: res.data,
  //         }));
  //       })
  //       .catch(() => {
  //         setState((s) => ({
  //           ...s,
  //           initLoading: false,
  //         }));
  //       });
  //   }
  // }, [planPackage, companyId]);
  //
  // if (!state.planPackage) {
  //   return null;
  // }
  //
  // return (
  //   <PlanPackageSwitcherWrapper>
  //     {
  //       !showChoosedPlan
  //         ? <div>
  //           <PackageCard planPackage={state.planPackage} />
  //           <Row style={{ marginTop: '10px' }} justify='end'>
  //             <Button type="primary" onClick={() => {
  //               dispatch(displayPlans());
  //             }}>
  //               <Icons.ToTopOutlined style={{ fontSize: '20px' }}/> Upgrade Plan
  //             </Button>
  //           </Row>
  //           {
  //             state.invoices
  //             && <Table
  //               style={{ marginTop: '10px' }}
  //               rowKey="id"
  //               columns={myColumns}
  //               dataSource={state.invoices}
  //               pagination={false}
  //             />
  //           }
  //           {
  //             (showPlans && state.packages)
  //             && <Row gutter={16}>
  //               {
  //                 state.packages.map((val: IPackage) => <Col key={val.id} sm={24} md={12}
  //                   onClick={() => {
  //                     setState({
  //                       ...state,
  //                       choosedPlan: val,
  //                     });
  //                     dispatch(displayConfirm());
  //                   }}>
  //                     <PackageCard planPackage={val} />
  //                   </Col>)
  //               }
  //             </Row>
  //           }
  //           {
  //             (showConfirm && state.choosedPlan)
  //             && <Row>
  //               <Col sm={24}>
  //                 <h1>Change Plan To</h1>
  //               </Col>
  //               <Col sm={24}>
  //                 <PackageCard planPackage={state.choosedPlan}>
  //                   <Row justify='center'>
  //                     <Button type='primary' onClick={() => {
  //                       dispatch(displayChoosedPlan());
  //                     }}>OK</Button>
  //                   </Row>
  //                 </PackageCard>
  //               </Col>
  //             </Row>
  //           }
  //         </div>
  //         : <PlanSubscribe companyId={companyId}
  //           planPackage={state.choosedPlan}
  //           cancelCallback={() => {
  //             dispatch(hideChoosedPlan());
  //           }}
  //         />
  //     }
  //   </PlanPackageSwitcherWrapper>
  // );
}

export default PlanPackageSwitcher
