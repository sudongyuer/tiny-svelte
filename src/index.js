import * as fs from 'fs'

const content = fs.readFileSync('./app.svelte', 'utf-8')
const ast = parse(content)
const analysis = analyse(ast)
const js = generate(ast, analysis)

fs.writeFileSync('./app.js', js, 'utf-8')

export function parse(content) {
  let i = 0
  const ast = {}

  ast.html = parseFragments(() => i < content.length)

  function readWhileMatching(regex) {
    const startIndex = i
    while (regex.test(content[i])) {
      i++
    }
    return content.slice(startIndex, i)
  }

  function parseScript() {
    if (match('<script>')) {
      eat('<script>')
      const script = readWhileMatching(/[^<]/)
      eat('</script>')
      return script
    }
  }

  function eat(str) {
    if (match(str))
      i += str.length
    else
      throw new Error(`Parse error: expecting "${str}"`)
  }

  function parseElement() {
    return undefined
  }

  function parseExpression() {
    return undefined
  }

  function parseText() {
    return undefined
  }

  function parseFragment() {
    return parseScript() ?? parseElement() ?? parseExpression() ?? parseText()
  }

  function parseFragments(condition) {
    const fragments = []
    while (condition()) {
      const fragment = parseFragment()
      fragments.push(fragment)
    }
    return fragments
  }

  function match(str) {
    return content.slice(i, str.length) === str
  }
}

export function analyse(ast) {

}

export function generate(ast, analysis) {

}
