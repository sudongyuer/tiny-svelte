import * as fs from 'fs'
import * as path from 'path'
import { describe, expect, it } from 'vitest'
import * as acorn from 'acorn'
const cwd = () => process.cwd()
describe('parse', () => {
  it('match', () => {
    const i = 0
    const content = '<div>hello</div>'
    function match(str) {
      return content.slice(i, str.length) === str
    }

    expect(match('<div>')).toBe(true)
  })

  it('eat', () => {
    let i = 0
    const content = '<div>hello</div>'
    function match(str) {
      return content.slice(i, str.length) === str
    }

    function eat(str) {
      if (match(str))
        i += str.length
      else
        throw new Error(`Parse error: expecting "${str}"`)
    }
    eat('<div>')
    expect(i).toEqual(5)
  })

  it('eat error', () => {
    let i = 0
    const content = '<div>hello</div>'
    function match(str) {
      return content.slice(i, str.length) === str
    }
    function eat(str) {
      if (match(str))
        i += str.length
      else
        throw new Error(`Parse error: expecting "${str}"`)
    }
    expect(() => eat('<button>')).toThrowError()
  })

  it('readWhileMatching', () => {
    let i = 5
    const content = '<div>hello</div>'
    function readWhileMatching(regex) {
      const startIndex = i
      while (regex.test(content[i])) {
        i++
      }
      return content.slice(startIndex, i)
    }
    expect(readWhileMatching(/[^<]/)).toEqual('hello')
    expect(i).toEqual(10)
  })

  it('parse fragment', () => {

  })

  it('test acorn parse expression', () => {
    const content = 'function printTips() {\n'
      + '  console.log("hello")\n'
      + '}'
    const js = acorn.parseExpressionAt(content, 0, { ecmaVersion: 2022 })
    console.warn(js)
  })

  it('parse expression', () => {
    let i = 8
    const content = fs.readFileSync(path.resolve(cwd(), './src/app.svelte'), 'utf-8')
    console.warn(content)
    function parseJavaScript() {
      const startIndex = i
      const js = acorn.parseExpressionAt(content, startIndex, { ecmaVersion: 2022 })
      i = js.end
      return js
    }
    const js = parseJavaScript()
    console.warn(js)
  })
})
