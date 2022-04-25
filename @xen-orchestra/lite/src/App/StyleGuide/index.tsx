// https://mui.com/components/material-icons/
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import React from 'react'
import styled from 'styled-components'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialDark as codeStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { SelectChangeEvent } from '@mui/material'
import { withState } from 'reaclette'

import ActionButton from '../../components/ActionButton'
import Button from '../../components/Button'
import Checkbox from '../../components/Checkbox'
import Icon from '../../components/Icon'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Tabs from '../../components/Tabs'
import { alert, confirm } from '../../components/Modal'
import Table from '../../components/Table'

interface ParentState {}

interface State {
  value: unknown
}

interface Props {}

interface ParentEffects {}

interface Effects {
  onChangeSelect: (e: SelectChangeEvent<unknown>) => void
  sayHello: () => void
  sendPromise: (data: Record<string, unknown>) => Promise<void>
  showAlertModal: () => void
  showConfirmModal: () => void
}

interface Computed {}

const Page = styled.div`
  margin: 30px;
`

const Container = styled.div`
  display: flex;
  column-gap: 10px;
`

const Render = styled.div`
  flex: 1;
  padding: 20px;
  border: solid 1px gray;
  border-radius: 3px;
`

const Code = styled(SyntaxHighlighter).attrs(() => ({
  language: 'jsx',
  style: codeStyle,
}))`
  flex: 1;
  border-radius: 3px;
  margin: 0 !important;
`

const App = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      value: '',
    }),
    effects: {
      onChangeSelect: function (e) {
        this.state.value = e.target.value
      },
      sayHello: () => alert('hello'),
      sendPromise: data =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve()
            window.alert(data.foo)
          }, 1000)
        }),
      showAlertModal: () => alert({ message: 'This is an alert modal', title: 'Alert modal', icon: 'info' }),
      showConfirmModal: () =>
        confirm({
          message: 'This is a confirm modal test',
          title: 'Confirm modal',
          icon: 'download',
        }),
    },
  },
  ({ effects, state }) => (
    <Page>
      <h2>Table</h2>
      <Container>
        <Render>
          <Table
            isItemSelectable
            stateUrlParam='foo_table'
            // rowsPerPageOptions={[10, 20, 30]}
            collection={[
              {
                name: 'Mathieu Foo',
                description: 'Foo',
                host_name: 'Host Foo',
                pool_name: 'Pool Foo',
                ipv4: '172.16.210.11',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Foo',
                snapshot_name: 'Snapshot Foo',
              },
              {
                name: 'Mathieu Bar',
                description: 'Bar',
                host_name: 'Host Bar',
                pool_name: 'Pool Bar',
                ipv4: '172.16.210.11',
                ipv6: 'fe80::e35f:46da:83cb:44012a01:240:ab08:4:607e:f6bb:b59f:b61',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Bar',
                snapshot_name: 'Snapshot Bar',
              },
              {
                name: 'Mathieu Baz',
                description: 'Baz',
                host_name: 'Host Baz',
                pool_name: 'Pool Baz',
                ipv4: '172.16.210.11',
                ipv6: 'fe80::e35f:46da:83cb:44012a01:240:ab08:4:607e:f6bb:b59f:b61',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Baz',
                snapshot_name: 'Snapshot Baz',
              },
              {
                name: 'Mathieu Foo1',
                description: 'Foo',
                host_name: 'Host Foo',
                pool_name: 'Pool Foo',
                ipv4: '172.16.210.11',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Foo',
                snapshot_name: 'Snapshot Foo',
              },
              {
                name: 'Mathieu Bar1',
                description: 'Bar',
                host_name: 'Host Bar',
                pool_name: 'Pool Bar',
                ipv4: '172.16.210.11',
                ipv6: 'fe80::e35f:46da:83cb:44012a01:240:ab08:4:607e:f6bb:b59f:b61',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Bar',
                snapshot_name: 'Snapshot Bar',
              },
              {
                name: 'Mathieu Baz1',
                description: 'Baz',
                host_name: 'Host Baz',
                pool_name: 'Pool Baz',
                ipv4: '172.16.210.11',
                ipv6: 'fe80::e35f:46da:83cb:44012a01:240:ab08:4:607e:f6bb:b59f:b61',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Baz',
                snapshot_name: 'Snapshot Baz',
              },
              {
                name: 'Mathieu Foo2',
                description: 'Foo',
                host_name: 'Host Foo',
                pool_name: 'Pool Foo',
                ipv4: '172.16.210.11',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Foo',
                snapshot_name: 'Snapshot Foo',
              },
              {
                name: 'Mathieu Bar2',
                description: 'Bar',
                host_name: 'Host Bar',
                pool_name: 'Pool Bar',
                ipv4: '172.16.210.11',
                ipv6: 'fe80::e35f:46da:83cb:44012a01:240:ab08:4:607e:f6bb:b59f:b61',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Bar',
                snapshot_name: 'Snapshot Bar',
              },
              {
                name: 'Mathieu Baz2',
                description: 'Baz',
                host_name: 'Host Baz',
                pool_name: 'Pool Baz',
                ipv4: '172.16.210.11',
                ipv6: 'fe80::e35f:46da:83cb:44012a01:240:ab08:4:607e:f6bb:b59f:b61',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Baz',
                snapshot_name: 'Snapshot Baz',
              },
              {
                name: 'Mathieu Foo3',
                description: 'Foo',
                host_name: 'Host Foo',
                pool_name: 'Pool Foo',
                ipv4: '172.16.210.11',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Foo',
                snapshot_name: 'Snapshot Foo',
              },
              {
                name: 'Mathieu Bar3',
                description: 'Bar',
                host_name: 'Host Bar',
                pool_name: 'Pool Bar',
                ipv4: '172.16.210.11',
                ipv6: 'fe80::e35f:46da:83cb:44012a01:240:ab08:4:607e:f6bb:b59f:b61',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Bar',
                snapshot_name: 'Snapshot Bar',
              },
              {
                name: 'Mathieu Baz3',
                description: 'Baz',
                host_name: 'Host Baz',
                pool_name: 'Pool Baz',
                ipv4: '172.16.210.11',
                ipv6: 'fe80::e35f:46da:83cb:44012a01:240:ab08:4:607e:f6bb:b59f:b61',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Baz',
                snapshot_name: 'Snapshot Baz',
              },
              {
                name: 'Mathieu Foo4',
                description: 'Foo',
                host_name: 'Host Foo',
                pool_name: 'Pool Foo',
                ipv4: '172.16.210.11',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Foo',
                snapshot_name: 'Snapshot Foo',
              },
              {
                name: 'Mathieu Bar4',
                description: 'Bar',
                host_name: 'Host Bar',
                pool_name: 'Pool Bar',
                ipv4: '172.16.210.11',
                ipv6: 'fe80::e35f:46da:83cb:44012a01:240:ab08:4:607e:f6bb:b59f:b61',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Bar',
                snapshot_name: 'Snapshot Bar',
              },
              {
                name: 'Mathieu Baz4',
                description: 'Baz',
                host_name: 'Host Baz',
                pool_name: 'Pool Baz',
                ipv4: '172.16.210.11',
                ipv6: 'fe80::e35f:46da:83cb:44012a01:240:ab08:4:607e:f6bb:b59f:b61',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Baz',
                snapshot_name: 'Snapshot Baz',
              },
              {
                name: 'Mathieu Foo5',
                description: 'Foo',
                host_name: 'Host Foo',
                pool_name: 'Pool Foo',
                ipv4: '172.16.210.11',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Foo',
                snapshot_name: 'Snapshot Foo',
              },
              {
                name: 'Mathieu Bar5',
                description: 'Bar',
                host_name: 'Host Bar',
                pool_name: 'Pool Bar',
                ipv4: '172.16.210.11',
                ipv6: 'fe80::e35f:46da:83cb:44012a01:240:ab08:4:607e:f6bb:b59f:b61',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Bar',
                snapshot_name: 'Snapshot Bar',
              },
              {
                name: 'Mathieu Baz5',
                description: 'Baz',
                host_name: 'Host Baz',
                pool_name: 'Pool Baz',
                ipv4: '172.16.210.11',
                ipv6: 'fe80::e35f:46da:83cb:44012a01:240:ab08:4:607e:f6bb:b59f:b61',
                cpu: 1,
                ram: 4,
                sr_name: 'SR Baz',
                snapshot_name: 'Snapshot Baz',
              },
            ]}
            columns={[
              { id: 'vm_name', header: 'VM Name', render: item => item.name },
              { id: 'description', header: 'Description', render: item => item.description },
              { id: 'host_name', header: 'Host Name', render: item => item.host_name },
              { id: 'pool_name', header: 'Pool Name', render: item => item.pool_name },
              { id: 'ipv4', header: 'IPv4', render: item => item.ipv4 },
              { id: 'ipv6', header: 'IPv6', render: item => item.ipv6 },
              { id: 'cpu', header: 'CPU', render: item => item.cpu, isNumeric: true },
              { id: 'ram', header: 'RAM', render: item => item.ram, isNumeric: true },
              { id: 'sr_name', header: 'SR Name', render: item => item.sr_name },
              { id: 'snapshot_name', header: 'Snapshot Name', render: item => item.snapshot_name },
            ]}
          />
        </Render>
      </Container>
      <h2>ActionButton</h2>
      <Container>
        <Render>
          <ActionButton data-foo='forwarded data props' onClick={effects.sendPromise}>
            Send promise
          </ActionButton>
        </Render>
        <Code>
          {`<ActionButton data-foo='forwarded data props' onClick={effects.sendPromise}>
  Send promise
</ActionButton>`}
        </Code>
      </Container>
      <h2>Button</h2>
      <Container>
        <Render>
          <Button color='primary' onClick={effects.sayHello} startIcon={<AccountCircleIcon />}>
            Primary
          </Button>
          <Button color='secondary' endIcon={<DeleteIcon />} onClick={effects.sayHello}>
            Secondary
          </Button>
          <Button color='success' onClick={effects.sayHello}>
            Success
          </Button>
          <Button color='warning' onClick={effects.sayHello}>
            Warning
          </Button>
          <Button color='error' onClick={effects.sayHello}>
            Error
          </Button>
          <Button color='info' onClick={effects.sayHello}>
            Info
          </Button>
        </Render>
        <Code>{`<Button color='primary' onClick={doSomething} startIcon={<AccountCircleIcon />}>
  Primary
</Button>
<Button color='secondary' endIcon={<DeleteIcon />} onClick={doSomething}>
  Secondary
</Button>
<Button color='success' onClick={doSomething}>
  Success
</Button>
<Button color='warning' onClick={doSomething}>
  Warning
</Button>
<Button color='error' onClick={doSomething}>
  Error
</Button>
<Button color='info' onClick={doSomething}>
  Info
</Button>`}</Code>
      </Container>
      <h2>Icon</h2>
      <Container>
        <Render>
          <Icon icon='truck' htmlColor='#0085FF' />
          <Icon icon='truck' color='primary' size='2x' />
        </Render>
        <Code>{`// https://fontawesome.com/icons
<Icon icon='truck' htmlColor='#0085FF'/>
<Icon icon='truck' color='primary' size='2x' />`}</Code>
      </Container>
      <h2>Input</h2>
      <Container>
        <Render>
          <Input label='Input' />
          <Checkbox />
        </Render>
        <Code>{`<TextInput label='Input' />
<Checkbox />`}</Code>
      </Container>
      <h2>Modal</h2>
      <Container>
        <Render>
          <Button
            color='primary'
            onClick={effects.showAlertModal}
            sx={{
              marginBottom: 1,
            }}
          >
            Alert
          </Button>
          <Button color='primary' onClick={effects.showConfirmModal}>
            Confirm
          </Button>
        </Render>
        <Code>{`<Button
  color='primary'
  onClick={() =>
    alert({
      message: 'This is an alert modal',
      title: 'Alert modal',
      icon: 'info'
    })
  }
>
  Alert
</Button>
<Button
  color='primary'
  onClick={async () => {
    try {
      await confirm({
        message: 'This is a confirm modal',
        title: 'Confirm modal',
        icon: 'download',
      })
      // The modal has been confirmed
    } catch (reason) { // "cancel"
      // The modal has been closed
    }
  }}
>
  Confirm
</Button>`}</Code>
      </Container>
      <h2>Select</h2>
      <Container>
        <Render>
          <Select
            onChange={effects.onChangeSelect}
            options={[
              { name: 'Bar', value: 1 },
              { name: 'Foo', value: 2 },
            ]}
            value={state.value}
            valueRenderer='value'
          />
        </Render>
        <Code>
          {`<Select
  onChange={handleChange}
  optionRenderer={item => item.name}
  options={[
    { name: 'Bar', value: 1 },
    { name: 'Foo', value: 2 },
  ]}
  value={state.value}
  valueRenderer='value'
/>`}
        </Code>
      </Container>
      <h2>Tabs</h2>
      <Container>
        <Render>
          <Tabs
            tabs={[
              { component: 'Hello BAR!', label: 'BAR', pathname: '/styleguide' },
              { label: 'FOO', pathname: '/styleguide/foo' },
            ]}
            useUrl
          />
        </Render>
        <Code>
          {`<Tabs
  tabs={[
    { component: 'Hello BAR!', label: 'BAR', pathname: '/styleguide' },
    { label: 'FOO', pathname: '/styleguide/foo' },
  ]}
  useUrl
/>`}
        </Code>
      </Container>
    </Page>
  )
)

export default App
