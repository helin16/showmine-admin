import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import wx from 'wechat-jssdk-ts'
import IError from '../../Types/IError'

export type WeChatSliceState = {
  isInWeChat: boolean
  wx?: typeof wx
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
