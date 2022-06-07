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
import Table, { Column } from '../../components/Table'
import { ObjectsByType, Vm } from '../../libs/xapi'
import { translate } from '../../components/IntlMessage'

const VM_TABLE_COLUMN: Array<Column<any>> = [
  {
    icon: 'power-off',
    render: vm => <Icon icon='circle' htmlColor={vm.power_state === 'Running' ? '#00BA34' : '#E8E8E8'} />,
    center: true,
  },
  { header: 'IPv4', render: vm => vm.IPv4 },
  { header: 'VM Name', render: vm => vm.name_label },
  { header: 'CPU', render: vm => vm.CPU, isNumeric: true },
]

const VMs: Array<any> = []

for (let index = 1; index < 16; index++) {
  VMs.push(
    {
      power_state: 'Running',
      name_label: `Foo${index} VM`,
      IPv4: `127.0.0.${index}`,
      CPU: index * 2,
    },
    {
      power_state: 'Running',
      name_label: `Bar${index} VM`,
      IPv4: `127.0.0.${index}`,
      CPU: index * 2,
    }
  )
}

interface ParentState {
  objectsByType: ObjectsByType
}

interface State {
  tableSelectedVms: Array<Vm>
  value: unknown
}

interface Props {}

interface ParentEffects {}

interface Effects {
  onChangeSelect: (e: SelectChangeEvent<unknown>) => void
  sayHello: () => void
  sendPromise: (data: Record<string, unknown>) => Promise<void>
  setSelectedVms: (vms: Array<Vm>) => void
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
      tableSelectedVms: [],
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
      setSelectedVms: function (vms) {
        this.state.tableSelectedVms = [...vms]
      },
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
      <h2>Table</h2>
      <Container>
        <Render>
          <Table
            collection={VMs}
            columns={VM_TABLE_COLUMN}
            dataType={translate({ id: 'VMs' })}
            onSelectItems={effects.setSelectedVms}
            selectedItems={state.tableSelectedVms}
            stateUrlParam='foo_table'
          />
        </Render>
        <Code>
          {`const VM_TABLE_COLUMN: Array<Column<Vm>> = [
  {
    icon: 'power-off',
    render: vm => <Icon icon='circle' htmlColor={vm.power_state === 'Running' ? '#00BA34' : '#E8E8E8'} />,
    center: true,
  },
  { header: 'VM Name', render: vm => vm.name_label },
  { header: 'IPv4', render: vm => vm.IPv4 },
  { header: 'CPU', render: vm => vm.CPU, isNumeric: true },
]
<Table
  collection={state.vms}
  columns={VM_TABLE_COLUMN}
  dataType='VMs'
  isItemSelectable
  onSelectItems={vms => state.selectedVms = [...vms]}
  rowsPerPageOptions={[10, 25, 50, 100]}
  selectedItems={state.selectedVms}
  stateUrlParam='foo_table'
/>
`}
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
