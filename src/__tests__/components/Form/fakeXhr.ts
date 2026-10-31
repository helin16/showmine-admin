// Stands in for XMLHttpRequest so upload tests stay off the network and can script each server reply.
export class FakeXHR {
  static instances: FakeXHR[] = []

  static get last() {
    return FakeXHR.instances[FakeXHR.instances.length - 1]
  }

  method = ''
  url = ''
  status = 0
  responseText = ''
  withCredentials = true
  headers: Record<string, string> = {}
  body?: FormData
  upload: { onprogress?: (e: { loaded: number; total: number }) => void } = {}
  onload?: () => void
  onerror?: () => void

  constructor() {
    FakeXHR.instances.push(this)
  }

  open(method: string, url: string) {
    this.method = method
    this.url = url
  }

  setRequestHeader(key: string, value: string) {
    this.headers[key] = value
  }

  send(body: FormData) {
    this.body = body
  }

  abort() {
    // Nothing is in flight.
  }

  respond(status: number, body: unknown) {
    this.status = status
    this.responseText = typeof body === 'string' ? body : JSON.stringify(body)
    this.onload?.()
  }
}
