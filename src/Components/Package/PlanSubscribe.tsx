import React, { useEffect, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import PackageCard from './PackageCard'
import CompanyService from '../../Services/CompanyService'
import CardForm from './CardForm'
import message from '../Form/message'
import Card from '../Form/Card'
import Row from '../Form/Row'
import Button from '../Form/Button'
import Col from '../Form/Col'

// const stripePromise = loadStripe('pk_test_XXNYbPYuSkvSppjs0kwo29O3');

const PlanSubscribe = () => {
  return null
  // const [state, setState] = useState(initialState);
  // useEffect(() => {
  //   if (planPackage) {
  //     setState((s) => ({
  //       ...s,
  //       planPackage,
  //     }));
  //   }
  // }, [planPackage]);
  //
  // useEffect(() => {
  //   if (companyId) {
  //     setState((s) => ({
  //       ...s,
  //       companyId,
  //       initLoading: true,
  //     }));
  //
  //     CompanyService.getPackages(companyId)
  //       .then((res) => {
  //         setState((s) => ({
  //           ...s,
  //           initLoading: false,
  //           packages: res.data,
  //         }));
  //       })
  //       .catch((err) => {
  //         message.error(`Error when fetching packages: ${err.message}`);
  //         setState((s) => ({
  //           ...s,
  //           initLoading: false,
  //         }));
  //       });
  //   }
  // }, [companyId]);
  //
  // if (!state.planPackage) {
  //   return null;
  // }
  //
  // return (
  //   <Card>
  //     <Row justify='start'>
  //       <Button type="primary" onClick={() => {
  //         cancelCallback && cancelCallback(false);
  //       }}>
  //         Cancel
  //       </Button>
  //     </Row>
  //     <Row>
  //       <Col sm={24}>
  //         <PackageCard planPackage={state.planPackage} />
  //       </Col>
  //     </Row>
  //     <Row>
  //       <Col sm={24}>
  //         <Elements stripe={stripePromise}>
  //           <CardForm planPackage={state.planPackage} />
  //         </Elements>
  //       </Col>
  //     </Row>
  //   </Card>
  // );
}

export default PlanSubscribe
