import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import RichTextEditor from './RichTextEditor'
import { inlineInputBgColor, InlineInputDiv, inlineInputPadding } from '../../Styles/AppWrapper'

const [paddingX] = inlineInputPadding.split(' ')
const InlineRichTextEditorDiv = styled(InlineInputDiv)`
  min-height: 80px;
  padding: 0px;
  .mce-content-body {
    padding: ${inlineInputPadding};
    min-height: 80px;
    &::before {
      padding-left: ${paddingX};
    }
    &.mce-edit-focus {
      background: ${inlineInputBgColor};
    }
  }
  &.has-height {
    .mce-content-body {
      overflow-y: auto;
      height: 100%;
    }
  }
`;

const initState = {
  value: null,
  height: undefined,
  maxHeight: undefined,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,react/prop-types
const InlineRichTextEditor = ({ value, height, maxHeight, onChange, isInLine = false, showToolBar = true, ...props }: React.ComponentProps<any>) => {
  // eslint-disable-line
  const [state, setState] = useState(initState)


  useEffect(() => {
    setState((s) => ({
      ...s,
      value,
      height,
      maxHeight,
    }))
  }, [value, height, maxHeight])

  const valueChanged = (content: null) => {
    const isDiff = content !== state.value
    setState({
      ...state,
      value: content,
    })
    if (typeof onChange === 'function' && isDiff === true) {
      onChange(content)
    }
  }

  const getDivStyle = () => ({ height: state.height, maxHeight: state.maxHeight || state.height })

  return (
    <InlineRichTextEditorDiv style={getDivStyle()} className={state.height ? 'has-height ' : ''}>
      <RichTextEditor {...props} isInLine={isInLine} showToolBar={showToolBar} className={'inline-input'} value={state.value} onChange={valueChanged} />
    </InlineRichTextEditorDiv>
  )
}

export default InlineRichTextEditor;
