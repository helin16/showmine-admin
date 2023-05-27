import styled, { createGlobalStyle } from 'styled-components'
import { APP_WIDTHS } from '../Constants'

export const primaryBtnBgColor = '#1890ff'
export const dangerColor = '#ff4d4f'

export const pageMinHeight = '100vh'
export const logoMinHeight = '63px'
export const contentSideMargin = '16'
export const contentInternalMargin = `${contentSideMargin}px`
export const contentInternalPadding = `${contentSideMargin}px`

export const BoxTitleDiv = styled.div`
  font-weight: bold;
  width: 100%;
  font-size: 14px;
  margin-bottom: 10px;
  &.danger {
    color: ${dangerColor};
  }
`
export const BoxTitleSuffix = styled.div`
  font-weight: normal;
  font-size: 10px;
  display: inline-block;
  margin-left: 23px;
  font-style: italic;
`

export const inlineInputPadding = '13px 22px'
export const inlineInputPaddingHalf = '6.5px 11px'
export const inlineInputBgColor = '#fafafa;'

export const InlineInputDiv = styled.div`
  border: none;
  padding: ${inlineInputPadding};
  :hover {
    background: ${inlineInputBgColor};
  }
`

export const FormInputWrapper = styled.div`
  margin-bottom: 10px;
  width: 100%;
  &.danger {
    color: ${dangerColor};
    .input-wrapper {
      border: 1px ${dangerColor} solid;
    }
  }
  .danger {
    color: ${dangerColor};
    &.input-wrapper {
      border: 1px ${dangerColor} solid;
    }
  }
`

export const FlexContainer = styled.div`
  display: flex;

  &.justify-content-space-between {
    justify-content: space-between;
  }

  &.with-gaps {
    > * {
      padding: 5px;
    }
  }
`

export const listGutter = 16

export const AppCssWrapper = createGlobalStyle`
  @media only screen and (max-width: ${APP_WIDTHS.sm}) and (min-width: ${APP_WIDTHS.xs}) {
    .hidden-sm {
      display: none;
    }
  }
  @media only screen and (max-width: ${APP_WIDTHS.md}) and (min-width: ${APP_WIDTHS.sm}) {
    .hidden-md {
      display: none;
    }
  }
  @media only screen and (max-width: ${APP_WIDTHS.lg}) and (min-width: ${APP_WIDTHS.md}) {
    .hidden-lg {
      display: none;
    }
  }
  @media only screen and (max-width: ${APP_WIDTHS.xl}) and (min-width: ${APP_WIDTHS.lg}) {
    .hidden-xl {
      display: none;
    }
  }
  @media only screen and (min-width: ${APP_WIDTHS.xl}) {
    .hidden-xxl {
      display: none;
    }
  }

  body {
    margin: 0px !important;
  }

  body.auth-page-body {
    background: #f2f3f8 url('/img/signup-bg.png') center bottom no-repeat;
    height: 100%;
    min-height: 100vh;
    margin: 0px 0px 0px 0px;
    background-size: cover;
  }

  body.auth-page-body div#root {
    width: 100%;
    height: 100%;
    min-height: 100vh;
    background: transparent url('/img/auth-bg.png') right bottom no-repeat;
    background-size: contain;
  }

  .text-danger {
    color: ${dangerColor};
  }
`

const AppWrapper = styled.div`
  .text-right {
    text-align: right;
  }

  .ant-upload {
    background-color: white;
  }

  min-height: ${pageMinHeight};

  .ant-select-selector,
  .app-button,
  .app-input-box,
  .app-input-password-box {
    border-radius: 0px !important;
  }

  .ant-statistic {
    .ant-statistic-title {
      text-align: left;
    }
  }

  .text-danger {
    color: ${dangerColor};
  }
`

export default AppWrapper
