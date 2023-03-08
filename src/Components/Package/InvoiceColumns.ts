const columns = [
  {
    title: 'Invoice',
    dataIndex: 'number',
    key: 'number',
  },
  {
    title: 'Total Amount',
    key: 'total',
    render: (record: any) => { // eslint-disable-line
      return `${record.currency.toUpperCase()} ${record.total / 100}`;
    },
  },
  {
    title: 'Paid Amount',
    key: 'amount_paid',
    render: (record: any) => { // eslint-disable-line
      return `${record.currency.toUpperCase()} ${record.amount_paid / 100}`;
    },
  },
  {
    title: 'Email',
    key: 'customer_email',
    dataIndex: 'customer_email',
  },
  {
    title: 'Date',
    key: 'created',
    dataIndex: 'created',
    render: (val: any) => { // eslint-disable-line
      return new Date(val * 1000).toLocaleString().split(',')[0];
    },
  },
];

export default columns;
