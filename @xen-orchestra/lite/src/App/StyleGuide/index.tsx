// https://mui.com/components/material-icons/
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import React from 'react'
import styled from 'styled-components'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialDark as codeStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { SelectChangeEvent } from '@mui/material'
import { withState } from 'reaclette'

import Button from '../../components/Button'
import Checkbox from '../../components/Checkbox'
import Icon from '../../components/Icon'
import Input from '../../components/Input'
import Select from '../../components/Select'
import { alert, confirm } from '../../components/Modal'

interface ParentState {}

interface State {
  value: unknown
}

interface Props {}

interface ParentEffects {}

interface Effects {
  onChangeSelect: (e: SelectChangeEvent<unknown>) => void
  sayHello: () => void
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
          <Icon icon='truck' />
          <Icon icon='truck' size='2x' />
        </Render>
        <Code>{`// https://fontawesome.com/icons
<Icon icon='truck' />
<Icon icon='truck' size='2x' />`}</Code>
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
    </Page>
  )
)

export default App
