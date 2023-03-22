import en from './en'
import cn from './cn'

export interface IMessage {
  [name: string]: string
}

export const messages: { [key: string]: IMessage } = {
  ...en,
  ...cn,
}
