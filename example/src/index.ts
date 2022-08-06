import { HELLO } from './lib'

export function hello (input: string | number): void {
  console.log(`${HELLO} ${input}`)
}
