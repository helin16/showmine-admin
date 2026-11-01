import { configureStore, combineReducers, Action, ThunkAction } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import AppReducer, { changeLocale } from './reduxers/app.slice'
import AuthReducer from './reduxers/auth.slice'
import BackEndPageReducer from './reduxers/backendpage.slice'
import WeChatReducer, { openedInWeChat } from './reduxers/wechat.slice'
import Locale from '../Components/Form/Locale'

const reducers = {
  app: AppReducer,
  auth: AuthReducer,
  backendPage: BackEndPageReducer,
  weChat: WeChatReducer,
}

const getCombinedReducer = () => combineReducers(reducers)

const store = configureStore({
  reducer: getCombinedReducer(),
})

const isInWeChat = /micromessenger/i.test(navigator.userAgent)
store.dispatch(openedInWeChat({ isInWeChat }))
// A user's language is only known after sign-in, and a WeChat sign-in problem shows before that.
if (isInWeChat && /^zh/i.test(navigator.language)) {
  store.dispatch(changeLocale({ ...store.getState().app, locale: Locale.zhCN }))
}

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppThunk = ThunkAction<void, RootState, null, Action<string>>
export const useAppDispatch = () => useDispatch<AppDispatch>() // Export a hook that can be reused to resolve types

export default store
