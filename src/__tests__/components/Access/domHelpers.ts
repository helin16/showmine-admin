import { fireEvent } from '@testing-library/react'

// jsdom has no matchMedia, and antd's Row, List and Sider all subscribe to it.
export const stubMatchMedia = (matches = false) => {
  window.matchMedia = ((media: string) => ({
    matches,
    media,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

// InlineInput only commits its value on blur.
export const typeInline = (input: HTMLElement, value: string) => {
  fireEvent.change(input, { target: { value } })
  fireEvent.blur(input)
}

export const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } })

export const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

export const apiError = (text: string) => Object.assign(new Error(text), { response: { data: { message: text } } })
