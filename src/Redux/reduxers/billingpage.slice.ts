import { createSlice } from '@reduxjs/toolkit'

export type BillingPageState = {
  showPlans: boolean
  showConfirm: boolean
  showChoosedPlan: boolean
  showInvoice: boolean
}

/**
 * Initial State
 */
const initialState: BillingPageState = {
  showPlans: false,
  showConfirm: false,
  showChoosedPlan: false,
  showInvoice: false,
}

/**
 * Actions
 */
const actions = {
  displayPlans: (state: BillingPageState) => ({
    ...state,
    showPlans: true,
  }),
  hidePlans: (state: BillingPageState) => ({
    ...state,
    showPlans: false,
  }),
  displayConfirm: (state: BillingPageState) => ({
    ...state,
    showConfirm: true,
  }),
  hideConfirm: (state: BillingPageState) => ({
    ...state,
    showConfirm: false,
  }),
  displayChoosedPlan: (state: BillingPageState) => ({
    ...state,
    showChoosedPlan: true,
  }),
  hideChoosedPlan: (state: BillingPageState) => ({
    ...state,
    showChoosedPlan: false,
  }),
  displayInvoice: (state: BillingPageState) => ({
    ...state,
    showInvoice: true,
  }),
  hideInvoice: (state: BillingPageState) => ({
    ...state,
    showInvoice: false,
  }),
}
/**
 * Slice
 */
const BillingPageSlice = createSlice({
  name: 'BillingPage',
  initialState,
  reducers: actions,
})
/**
 * action
 */
export const {
  displayPlans,
  hidePlans,
  displayConfirm,
  hideConfirm,
  displayChoosedPlan,
  hideChoosedPlan,
  displayInvoice,
  hideInvoice,
} = BillingPageSlice.actions
/**
 * reducer
 */
export default BillingPageSlice.reducer
