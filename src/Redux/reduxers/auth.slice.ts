import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import ISession from '../../Types/Auth/ISession'

/**
 * Initial State
 */
const initialState: ISession = {
  isAuthenticating: false,
}

/**
 * Actions
 */
const actions = {
  changeAuthenticating: (state: ISession = initialState, action: PayloadAction<ISession>) => ({
    ...state,
    isAuthenticating: action.payload.isAuthenticating || false,
  }),
  isAuthenticated: (state: ISession = initialState, action: PayloadAction<ISession>) => ({
    ...state,
    isAuthenticated: true,
    user: action.payload.user,
    company: action.payload.company,
    // companyPackage: action.payload.companyPackage,
  }),
  changeCompany: (state: ISession = initialState, action: PayloadAction<ISession>) => ({
    ...state,
    company: action.payload.company,
    // companyPackage: action.payload.companyPackage,
  }),
  changeCompanyPackage: (state: ISession = initialState, action: PayloadAction<ISession>) => ({
    ...state,
    // companyPackage: action.payload.companyPackage,
  }),
  removedAuthentication: (state: ISession = initialState) => ({
    ...state,
    isAuthenticated: undefined,
    user: undefined,
    company: undefined,
    companyPackage: undefined,
  }),
}
/**
 * Slice
 */
const AuthSlice = createSlice({
  name: 'Auth',
  initialState,
  reducers: actions,
})
/**
 * action
 */
export const { changeAuthenticating, isAuthenticated, removedAuthentication, changeCompany, changeCompanyPackage } =
  AuthSlice.actions
/**
 * reducer
 */
export default AuthSlice.reducer
