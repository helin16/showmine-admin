import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import IError from '../../Types/IError'

// What the page needs from WeChat's official script, which puts this on window.wx.
export type WeChatJs = {
  config: (config: object) => void
  ready: (callback: () => void) => void
  error: (callback: (err: unknown) => void) => void
}

export type WeChatSliceState = {
  isInWeChat: boolean
  wx?: WeChatJs
  loadJsError?: IError
}

/**
 * Initial State
 */
const initialState: WeChatSliceState = {
  isInWeChat: false,
}

/**
 * Actions
 */
const actions = {
  openedInWeChat: (state: WeChatSliceState, action: PayloadAction<WeChatSliceState>) => ({
    ...state,
    isInWeChat: action.payload.isInWeChat,
  }),
  loadedWeChatJs: (state: WeChatSliceState, action: PayloadAction<WeChatSliceState>) => ({
    ...state,
    wx: action.payload.wx,
    loadJsError: action.payload.loadJsError,
  }),
}
/**
 * Slice
 */
const WeChatSlice = createSlice({
  name: 'WeChat',
  initialState,
  reducers: actions,
})
/**
 * action
 */
export const { loadedWeChatJs, openedInWeChat } = WeChatSlice.actions
/**
 * reducer
 */
export default WeChatSlice.reducer
