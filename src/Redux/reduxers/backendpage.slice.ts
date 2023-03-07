import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultSelectedKey } from '../../Components/Menu/MenuItems';

export type BackendPageState ={
  collapsed?: boolean
  selectedMenuKey: string,
};

/**
 * Initial State
 */
const initialState: BackendPageState = {
  collapsed: false,
  selectedMenuKey: defaultSelectedKey,
};

/**
 * Actions
 */
const actions = {
  collapseSideMenu: (state: BackendPageState) => ({
    ...state,
    collapsed: true,
  }),
  expandSideMenu: (state: BackendPageState) => ({
    ...state,
    collapsed: false,
  }),
  toggleSideMenu: (state: BackendPageState) => ({
    ...state,
    collapsed: !state.collapsed,
  }),
  selectMenu: (state: BackendPageState,
    action: PayloadAction<BackendPageState>) => ({
    ...state,
    selectedMenuKey: action.payload.selectedMenuKey,
  }),
};
/**
 * Slice
 */
const BackendPageSlice = createSlice({
  name: 'BackendPage',
  initialState,
  reducers: actions,
});
/**
 * action
 */
export const {
  collapseSideMenu, expandSideMenu, toggleSideMenu, selectMenu,
} = BackendPageSlice.actions;
/**
 * reducer
 */
export default BackendPageSlice.reducer;
