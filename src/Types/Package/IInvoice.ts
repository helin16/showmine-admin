type IInvoice = {
  id: string,
  number: string,
  amount_due: number, // eslint-disable-line
  amount_paid: number, // eslint-disable-line
  amount_remaining: number, // eslint-disable-line
  total: number,
  subtotal: number,
  customer_email: string, // eslint-disable-line
  status_transitions: { // eslint-disable-line
    finalized_at: number, // eslint-disable-line
    paid_at: number, // eslint-disable-line
  },
  invoice_pdf: string, // eslint-disable-line
  created: number,
  currency: string,
}

export default IInvoice;
