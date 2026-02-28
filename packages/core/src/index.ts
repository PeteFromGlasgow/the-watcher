export function getHelloWorld(output: (message: string) => void) {
  return function (name: string) {
    output(`Hello ${name}!`)
  }
}
