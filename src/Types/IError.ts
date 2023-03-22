type IError = {
  message: string
  errors: []
}

export const initError: IError = {
  message: '',
  errors: [],
}

export default IError
