export class Role {
  #id: string
  #name: string
  #description?: string

  constructor(name: string, description?: string) {
    this.#id = crypto.randomUUID()
    this.#name = name
    this.#description = description
  }

  get id() {
    return this.#id
  }

  get name() {
    return this.#name
  }

  get description() {
    return this.#description
  }
}
