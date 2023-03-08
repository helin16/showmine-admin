import React, { useState, useMemo } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/makeReduxStore';
import CompanyService from '../../Services/CompanyService';
import useResponsiveFontSize from './useResponsiveFontSize';
import IPackage from '../../Types/Package/IPackage';
import Form from '../Form/Form';
import FormItem from '../Form/FormItem';
import Row from '../Form/Row';
import Button from '../Form/Button';

const useOptions = () => {
  const fontSize = useResponsiveFontSize();
  const options = useMemo(
    () => ({
      style: {
        base: {
          fontSize,
          color: '#424770',
          letterSpacing: '0.025em',
          fontFamily: 'Source Code Pro, monospace',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#9e2146',
        },
      },
    }),
    [fontSize],
  );

  return options;
};

const CardForm = ({ planPackage }: { planPackage: IPackage }) => {
  const stripe = useStripe();
  const elements = useElements();
  const options = useOptions();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => { // eslint-disable-line
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    setLoading(true);
    const cardElement = elements.getElement(CardElement);
    if (cardElement && user?.last_visit_company_id) { // eslint-disable-line
      // @ts-ignore
      const { data: { client_secret } } = await createSetupIntent(user.last_visit_company_id) // eslint-disable-line
      // @ts-ignore
      const { setupIntent: { payment_method } } = await stripe.confirmCardSetup(client_secret, { // eslint-disable-line
        payment_method: {
          card: cardElement,
        },
      });
      await CompanyService.addPaymentMethod({
        companyId: user.last_visit_company_id,
        paymentMethodId: payment_method,
      });
      // update subscription
      const { data: { success } } = await CompanyService.updateSubscription({
        companyId: user.last_visit_company_id,
        packageId: planPackage.id,
      });

      if (success) {
        window.location.reload();
      }
    }
    setLoading(false);
  };

  return (
    <Form onFinish={handleSubmit}>
      <label>
        Card details
        <CardElement options={options} />
      </label>
      <FormItem>
        <Row justify='center'>
          <Button type="primary" htmlType="submit" disabled={!stripe} loading={loading}>
            Subscribe
          </Button>
        </Row>
      </FormItem>
    </Form>
  );
};

export default CardForm;
