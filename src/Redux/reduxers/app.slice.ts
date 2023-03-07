import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import enUS from 'antd/es/locale/en_US';

type AppState = {
  locale: typeof enUS,
  componentSize: 'small' | 'middle' | 'large',
}
/**
 * Initial State
 */
const initialState: AppState = {
  locale: enUS,
  componentSize: 'large',
};

/**
 * Actions
 */
const actions = {
  changeLocale: (state: AppState, action: PayloadAction<AppState>) => ({
    ...state,
    locale: action.payload.locale,
  }),
  changeComponentSize: (state: AppState, action: PayloadAction<AppState>) => ({
    ...state,
    componentSize: action.payload.componentSize,
  }),
};
/**
 * Slice
 */
const AppSlice = createSlice({
  name: 'App',
  initialState,
  reducers: actions,
});
/**
 * action
 */
export const {
  changeLocale,
  changeComponentSize,
} = AppSlice.actions;
/**
 * reducer
 */
export default AppSlice.reducer;
