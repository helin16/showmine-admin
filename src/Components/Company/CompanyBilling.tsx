import React, { useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import { changeCompany } from '../../Redux/reduxers/auth.slice'
import CompanyService from '../../Services/CompanyService'
import Utils from '../../Services/Utils'
import { listGutter } from '../../Styles/AppWrapper'
import Alert from '../Form/Alert'
import Button from '../Form/Button'
import Card from '../Form/Card'
import Col from '../Form/Col'
import message from '../Form/message'
import Row from '../Form/Row'
import Tag from '../Form/Tag'
import Typography from '../Form/Typography'

// Long enough for Stripe's webhook, which can land after the person does.
const CHECK_EVERY_MS = 5000
const MAX_CHECKS = 12

// What the marketing site sells. The API holds the limits, and Stripe the prices it actually charges.
const PLANS = [
  { id: 'free', price: 0, maxUsers: 1, storageGb: 2 },
  { id: 'starter', price: 49, maxUsers: 10, storageGb: 50 },
  { id: 'unlimited', price: 129, maxUsers: null, storageGb: 50 },
]

const CompanyBilling = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const dispatch = useDispatch()
  const intl = useIntl()
  const [redirecting, setRedirecting] = useState('')
  // Read straight from the address and only once, as the effect below removes it.
  const [isWaiting, setIsWaiting] = useState(() => new URLSearchParams(window.location.search).has('checkout'))
  const companyId = company?.id

  // The company in the store is from sign-in, and a plan changes while the person is away at Stripe.
  useEffect(() => {
    window.history.replaceState(window.history.state, '', window.location.pathname)
    if (!companyId) return
    let isCancelled = false
    const refresh = () =>
      CompanyService.getItemById(companyId)
        .then((res) => {
          if (isCancelled === true) return
          dispatch(changeCompany({ company: res }))
        })
        .catch((err) => message.error(Utils.getErrorMessage(err)))
    refresh()
    let checks = 0
    const timer = isWaiting
      ? setInterval(() => {
          checks += 1
          refresh()
          if (checks >= MAX_CHECKS) {
            clearInterval(timer)
            setIsWaiting(false)
          }
        }, CHECK_EVERY_MS)
      : undefined
    return () => {
      isCancelled = true
      clearInterval(timer)
    }
  }, [companyId, dispatch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Back from Stripe can restore this page as it was, with its button still spinning.
  useEffect(() => {
    const onPageShow = ({ persisted }: PageTransitionEvent) => {
      if (persisted) setRedirecting('')
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  const goTo = (key: string, request: Promise<{ url: string }>) => {
    setRedirecting(key)
    request
      .then(({ url }) => window.location.assign(url))
      .catch((err) => {
        setRedirecting('')
        message.error(Utils.getErrorMessage(err))
      })
  }

  const currentPlan = company?.adminConfig?.plan
  if (!currentPlan) {
    return <Alert type='info' message={intl.formatMessage({ id: 'billing-no-plan' })} />
  }
  const isComplimentary = company?.adminConfig?.complimentary === true
  const hasSubscription = Boolean(company?.adminConfig?.stripeSubscriptionId)
  const hasCustomer = Boolean(company?.adminConfig?.stripeCustomerId)

  const getAction = (planId: string) => {
    if (planId === currentPlan) {
      return <Tag color='blue'><FormattedMessage id='billing-current' /></Tag>
    }
    // Changing or ending a subscription happens on Stripe's portal, so Free has no button of its own.
    if (isComplimentary === true || hasSubscription === true || planId === 'free') return null
    return (
      <Button
        type='primary'
        block
        loading={redirecting === planId}
        // A payment still on its way must not be paid again.
        disabled={redirecting !== '' || isWaiting === true}
        onClick={() => goTo(planId, CompanyService.startCheckout(planId))}
      >
        <FormattedMessage id='billing-choose' />
      </Button>
    )
  }

  return (
    <>
      {isComplimentary === true ? (
        <Alert type='info' message={intl.formatMessage({ id: 'billing-complimentary' })} />
      ) : null}
      {isWaiting === true ? <Alert type='info' message={intl.formatMessage({ id: 'billing-processing' })} /> : null}
      <Row gutter={listGutter}>
        {PLANS.map((plan) => (
          <Col key={plan.id} xs={{ span: 24 }} md={{ span: 8 }}>
            <Card title={<FormattedMessage id={`plan-${plan.id}`} />}>
              <h2>
                ${plan.price} <small><FormattedMessage id='billing-monthly' /></small>
              </h2>
              <ul>
                <li>
                  {plan.maxUsers === null ? (
                    <FormattedMessage id='billing-unlimited-users' />
                  ) : (
                    <FormattedMessage id='billing-users' values={{ count: plan.maxUsers }} />
                  )}
                </li>
                <li><FormattedMessage id='billing-unlimited-articles' /></li>
                <li><FormattedMessage id='billing-storage' values={{ size: plan.storageGb }} /></li>
                <li><FormattedMessage id='billing-unlimited-channels' /></li>
              </ul>
              {getAction(plan.id)}
            </Card>
          </Col>
        ))}
      </Row>
      {hasCustomer === true ? (
        <Card>
          <Typography.Paragraph><FormattedMessage id='billing-manage-help' /></Typography.Paragraph>
          <Button
            type='primary'
            loading={redirecting === 'portal'}
            onClick={() => goTo('portal', CompanyService.openBillingPortal())}
          >
            <FormattedMessage id='billing-manage' />
          </Button>
        </Card>
      ) : null}
    </>
  )
}

export default CompanyBilling
