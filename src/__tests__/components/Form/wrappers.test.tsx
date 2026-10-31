import React, { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../testUtils'
import Affix from '../../../Components/Form/Affix'
import Alert from '../../../Components/Form/Alert'
import Avatar from '../../../Components/Form/Avatar'
import Button from '../../../Components/Form/Button'
import Card, { CardMeta } from '../../../Components/Form/Card'
import Col from '../../../Components/Form/Col'
import Collapse, { Panel } from '../../../Components/Form/Collapse'
import Divider from '../../../Components/Form/Divider'
import Drawer from '../../../Components/Form/Drawer'
import Dropdown from '../../../Components/Form/Dropdown'
import Empty from '../../../Components/Form/Empty'
import Form from '../../../Components/Form/Form'
import FormItem from '../../../Components/Form/FormItem'
import Image from '../../../Components/Form/Image'
import InputBox from '../../../Components/Form/InputBox'
import InputPassword from '../../../Components/Form/InputPassword'
import Layout, { Content, Footer, Header, Sider } from '../../../Components/Form/Layout'
import List, { ListItem, ListItemMeta } from '../../../Components/Form/List'
import Locale from '../../../Components/Form/Locale'
import Menu, { MenuItem } from '../../../Components/Form/Menu'
import message, { useMessage } from '../../../Components/Form/message'
import Modal from '../../../Components/Form/Modal'
import Popconfirm from '../../../Components/Form/Popconfirm'
import Popover from '../../../Components/Form/Popover'
import Progress from '../../../Components/Form/Progress'
import Radio, { RadioButton, RadioGroup } from '../../../Components/Form/Radio'
import Result from '../../../Components/Form/Result'
import Row from '../../../Components/Form/Row'
import Search from '../../../Components/Form/Search'
import Select from '../../../Components/Form/Select'
import SkeletonImage from '../../../Components/Form/SkeletonImage'
import Space from '../../../Components/Form/Space'
import Spin from '../../../Components/Form/Spin'
import Statistic from '../../../Components/Form/Statistic'
import Steps from '../../../Components/Form/Steps'
import Switch from '../../../Components/Form/Switch'
import Table from '../../../Components/Form/Table'
import Tag from '../../../Components/Form/Tag'
import Timeline, { TimelineItem } from '../../../Components/Form/Timeline'
import Tooltip from '../../../Components/Form/Tooltip'
import Typography from '../../../Components/Form/Typography'
import Upload from '../../../Components/Form/Upload'
import UploadDragger from '../../../Components/Form/UploadDragger'
import { message as antdMessage } from 'antd'

beforeAll(() => {
  // antd grids subscribe to matchMedia, which jsdom lacks. Plain function: setupTests resets vi.fn mocks.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia
})

type Case = [name: string, baseClass: string, text: string, ui: (className?: string) => ReactElement]

// Each wrapper adds a base class, keeps the caller's class, and shows the content it was given.
const cases: Case[] = [
  ['Affix', 'app-Affix', 'pinned', (c) => <Affix className={c}><i>pinned</i></Affix>],
  ['Alert', 'app-alert', 'careful', (c) => <Alert className={c} message='careful' />],
  ['Avatar', 'app-Avatar', 'AB', (c) => <Avatar className={c}>AB</Avatar>],
  ['Button', 'app-button', 'Save', (c) => <Button className={c}>Save</Button>],
  ['Card', 'app-Card', 'Card body', (c) => <Card className={c}>Card body</Card>],
  ['CardMeta', 'app-CardMeta', 'Meta title', (c) => <CardMeta className={c} title='Meta title' />],
  ['Col', 'app-col', 'cell', (c) => <Col className={c}>cell</Col>],
  ['Collapse', 'app-Collapse', 'Panel head', (c) => (
    <Collapse className={c}><Panel key='1' header='Panel head' /></Collapse>
  )],
  ['Panel', 'app-Collapse-Panel', 'Panel head', (c) => (
    <Collapse><Panel className={c} key='1' header='Panel head' /></Collapse>
  )],
  ['Divider', 'app-Divider', 'or', (c) => <Divider className={c}>or</Divider>],
  ['Drawer', 'app-Drawer', 'Drawer body', (c) => <Drawer className={c} open>Drawer body</Drawer>],
  ['Dropdown', 'app-Dropdown', 'Copy', (c) => (
    <Dropdown className={c} open menu={{ items: [{ key: 'copy', label: 'Copy' }] }}><a>open</a></Dropdown>
  )],
  ['Empty', 'app-Empty', 'Nothing here', (c) => <Empty className={c} description='Nothing here' />],
  ['Form', 'app-form', 'fields', (c) => <Form className={c}>fields</Form>],
  ['FormItem', 'app-form-item', 'Name', (c) => <FormItem className={c} label='Name' />],
  ['InputBox', 'app-input-box', '', (c) => <InputBox className={c} />],
  ['InputPassword', 'app-input-password-box', '', (c) => <InputPassword className={c} />],
  ['Layout', 'app-Layout', 'page', (c) => <Layout className={c}>page</Layout>],
  ['Sider', 'app-Layout-sider', 'side', (c) => <Sider className={c}>side</Sider>],
  ['Content', 'app-Layout-content', 'main', (c) => <Content className={c}>main</Content>],
  ['Footer', 'app-Layout-footer', 'bottom', (c) => <Footer className={c}>bottom</Footer>],
  ['Header', 'app-Layout-header', 'top', (c) => <Header className={c}>top</Header>],
  ['List', 'app-List', 'row one', (c) => (
    <List className={c} dataSource={['row one']} renderItem={(row) => <ListItem>{row}</ListItem>} />
  )],
  ['Menu', 'app-Menu', 'Home', (c) => <Menu className={c}><MenuItem key='home'>Home</MenuItem></Menu>],
  ['Modal', 'app-Modal', 'Modal body', (c) => <Modal className={c} open>Modal body</Modal>],
  ['Popconfirm', 'app-popconfirm', 'Sure?', (c) => <Popconfirm className={c} open title='Sure?'><a>open</a></Popconfirm>],
  ['Popover', 'app-Popover', 'More', (c) => <Popover className={c} open content='More'><a>open</a></Popover>],
  ['Progress', 'app-progress', '40%', (c) => <Progress className={c} percent={40} />],
  ['Radio', 'app-Radio', 'Yes', (c) => <Radio className={c}>Yes</Radio>],
  ['RadioGroup', 'app-Radio', 'Yes', (c) => <RadioGroup className={c} options={['Yes']} />],
  ['RadioButton', 'app-Radio', 'Yes', (c) => <RadioButton className={c}>Yes</RadioButton>],
  ['Result', 'app-result', 'All done', (c) => <Result className={c} title='All done' />],
  ['Row', 'app-row', 'line', (c) => <Row className={c}>line</Row>],
  ['Search', 'app-search', '', (c) => <Search className={c} />],
  ['Select', 'app-Select', 'Pick one', (c) => <Select className={c} placeholder='Pick one' />],
  ['SkeletonImage', 'app-skeleton-image', '', (c) => <SkeletonImage className={c} />],
  ['Space', 'app-Space', 'gap', (c) => <Space className={c}>gap</Space>],
  ['Spin', 'app-Spin', 'wrapped', (c) => <Spin className={c}>wrapped</Spin>],
  ['Statistic', 'app-Statistic', 'Users', (c) => <Statistic className={c} title='Users' value={1} />],
  ['Steps', 'app-Steps', 'First', (c) => <Steps className={c} items={[{ title: 'First' }]} />],
  ['Switch', 'app-Switch', 'On', (c) => <Switch className={c} checked checkedChildren='On' />],
  ['Table', 'app-Table', 'Row cell', (c) => (
    <Table
      className={c}
      rowKey='id'
      columns={[{ title: 'Name', dataIndex: 'name' }]}
      dataSource={[{ id: 1, name: 'Row cell' }]}
    />
  )],
  ['Tag', 'app-Tag', 'new', (c) => <Tag className={c}>new</Tag>],
  ['Timeline', 'app-Timeline', 'Created', (c) => <Timeline className={c}><TimelineItem>Created</TimelineItem></Timeline>],
  ['TimelineItem', 'app-TimelineItem', 'Created', (c) => <TimelineItem className={c}>Created</TimelineItem>],
  ['Tooltip', 'app-Tooltip', 'Hint', (c) => <Tooltip className={c} open title='Hint'><a>open</a></Tooltip>],
  ['Upload', 'app-upload', 'Attach', (c) => <Upload className={c}>Attach</Upload>],
  ['UploadDragger', 'app-UploadDragger', 'Drop here', (c) => <UploadDragger className={c}>Drop here</UploadDragger>],
]

describe.each(cases)('%s', (_name, baseClass, text, ui) => {
  const element = () => document.querySelector(`.${baseClass}`)

  test('keeps the caller class and shows its content', () => {
    renderWithProviders(ui('custom'))
    expect(element()).toHaveClass(baseClass, 'custom')
    if (text) expect(screen.getAllByText(text)[0]).toBeInTheDocument()
  })

  test('adds no stray class without a caller class', () => {
    renderWithProviders(ui())
    expect(element()).toHaveClass(baseClass)
    expect(element()?.className).not.toContain('undefined')
  })
})

describe('props reach the antd control', () => {
  // Bug: antd reads the children's props, so TimelineItem never runs inside Timeline and its base class is lost.
  test.fails('TimelineItem keeps its base class inside Timeline', () => {
    render(<Timeline><TimelineItem>Created</TimelineItem></Timeline>)
    expect(document.querySelector('.app-TimelineItem')).toBeInTheDocument()
  })

  test('Button click and disabled state', async () => {
    const onClick = vi.fn()
    const { rerender } = render(<Button onClick={onClick}>Save</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(<Button onClick={onClick} disabled>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  test('InputBox reports typing', async () => {
    const onChange = vi.fn()
    render(<InputBox onChange={onChange} placeholder='Name' />)
    await userEvent.type(screen.getByPlaceholderText('Name'), 'a')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('InputPassword hides the text', () => {
    render(<InputPassword placeholder='Password' />)
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
  })

  test('Search reports the term on Enter', async () => {
    const onSearch = vi.fn()
    render(<Search onSearch={onSearch} placeholder='Find' />)
    await userEvent.type(screen.getByPlaceholderText('Find'), 'news{Enter}')
    expect(onSearch.mock.calls[0][0]).toBe('news')
  })

  test('Switch reports the new state', async () => {
    const onChange = vi.fn()
    render(<Switch onChange={onChange} />)
    await userEvent.click(screen.getByRole('switch'))
    expect(onChange.mock.calls[0][0]).toBe(true)
  })

  test('RadioGroup reports the chosen option', async () => {
    const onChange = vi.fn()
    render(<RadioGroup options={['One', 'Two']} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText('Two'))
    expect(onChange.mock.calls[0][0].target.value).toBe('Two')
  })

  test('Form and FormItem show a validation error and block submit', async () => {
    const onFinish = vi.fn()
    render(
      <Form onFinish={onFinish}>
        <FormItem name='title' rules={[{ required: true, message: 'Title is required' }]}>
          <InputBox />
        </FormItem>
        <Button htmlType='submit'>Save</Button>
      </Form>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(onFinish).not.toHaveBeenCalled()
  })

  test('Table shows its empty state', () => {
    renderWithProviders(
      <Table rowKey='id' columns={[{ title: 'Name', dataIndex: 'name' }]} dataSource={[]} locale={{ emptyText: 'No rows' }} />,
    )
    expect(screen.getByText('No rows')).toBeInTheDocument()
  })

  test('Spin shows the indicator only while spinning', () => {
    const { container, rerender } = render(<Spin spinning>body</Spin>)
    expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument()
    rerender(<Spin spinning={false}>body</Spin>)
    expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument()
  })

  test('Image shows the given source', () => {
    render(<Image className='custom' src='/a.png' alt='A' preview={false} />)
    const image = screen.getByAltText('A')
    expect(image).toHaveAttribute('src', '/a.png')
    expect(image).toHaveClass('custom')
  })

  test('ListItemMeta shows the title and description', () => {
    render(<ListItemMeta title='Title' description='Details' />)
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
  })
})

describe('re-exports', () => {
  test('Locale holds the two supported languages', () => {
    expect(Locale.enUS.locale).toBe('en')
    expect(Locale.zhCN.locale).toBe('zh-cn')
  })

  test('message is the antd message api', () => {
    expect(message).toBe(antdMessage)
    expect(useMessage).toBe(antdMessage.useMessage)
  })

  test('Typography renders text and paragraphs', () => {
    render(
      <>
        <Typography.Text>inline</Typography.Text>
        <Typography.Paragraph>block</Typography.Paragraph>
      </>,
    )
    expect(screen.getByText('inline').tagName).toBe('SPAN')
    expect(screen.getByText('block')).toHaveClass('ant-typography')
  })
})
