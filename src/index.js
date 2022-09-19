import * as fs from 'fs'
import * as acorn from 'acorn'
import * as periscopic from 'periscopic'
import * as estreewalker from 'estree-walker'
import * as escodegen from 'escodegen'

const content = fs.readFileSync('./app.svelte', 'utf-8').trim()
const ast = parse(content)
// console.log(JSON.stringify(ast, null, 2))
const analysis = analyse(ast)
console.log(analysis)
const js = generate(ast, analysis)

fs.writeFileSync('./app.js', js, 'utf-8')

export function parse(content) {
  let i = 0
  const ast = {}
  ast.html = parseFragments(() => i < content.length)

  function parseScript() {
    if (match('<script>')) {
      eat('<script>')
      const startIndex = i
      const endIndex = content.indexOf('</script>', startIndex)
      const code = content.slice(startIndex, endIndex)
      ast.script = acorn.parse(code, { sourceType: 'module', ecmaVersion: 2022 })
      i = endIndex
      eat('</script>')
    }
  }

  function eat(str) {
    if (match(str))
      i += str.length
    else
      throw new Error(`Parse error: expecting "${str}"`)
  }

  function skipWhitespace() {
    readWhileMatching(/[\s\n]/)
  }

  function parseJavaScript() {
    const startIndex = i
    const js = acorn.parseExpressionAt(content, startIndex, { ecmaVersion: 2022 })
    i = js.end
    return js
  }

  function parseAttribute() {
    const attributeName = readWhileMatching(/[^=]/)
    eat('={')
    const attributeValue = parseJavaScript()
    // need pr
    skipWhitespace()
    eat('}')
    return {
      type: 'Attribute',
      name: attributeName,
      value: attributeValue,
    }
  }

  function parseAttributeList() {
    skipWhitespace()
    const attributes = []
    while (!match('>')) {
      attributes.push(parseAttribute())
      skipWhitespace()
    }
    return attributes
  }

  function parseElement() {
    if (match('<')) {
      eat('<')
      const tagName = readWhileMatching(/[a-zA-Z]/)
      const attributes = parseAttributeList()
      eat('>')
      const endTag = `</${tagName}>`
      const element = {
        type: 'Element',
        name: tagName,
        attributes,
        children: parseFragments(() => !match(endTag)),
      }
      eat(endTag)
      return element
    }
  }

  function parseExpression() {
    if (match('{')) {
      eat('{')
      const expression = parseJavaScript()
      skipWhitespace()
      eat('}')
      return {
        type: 'Expression',
        expression,
      }
    }
  }

  function parseText() {
    const text = readWhileMatching(/[^{<]/).trim()
    if (text !== '') {
      return {
        type: 'Text',
        value: text,
      }
    }
  }

  function parseFragment() {
    return parseScript() ?? parseElement() ?? parseExpression() ?? parseText()
  }

  function parseFragments(condition) {
    const fragments = []
    while (condition()) {
      const fragment = parseFragment()
      if (fragment)
        fragments.push(fragment)
    }
    return fragments
  }

  function match(str) {
    return content.slice(i, i + str.length) === str
  }

  function readWhileMatching(regex) {
    const startIndex = i
    while (regex.test(content[i]))
      i++
    return content.slice(startIndex, i)
  }
  return ast
}

export function analyse(ast) {
  const result = {
    variables: new Set(),
    willChange: new Set(),
    willUseInTemplate: new Set(),
  }
  const { scope: rootScope, map } = periscopic.analyze(ast.script)
  result.variables = new Set(rootScope.declarations.keys())
  result.rootScope = rootScope
  result.map = map
  let currentScope = rootScope
  estreewalker.walk(ast.script, {
    enter(node) {
      if (map.has(node))currentScope = map.get(node)
      if (
        node.type === 'UpdateExpression'
      && currentScope.find_owner(node.argument.name) === rootScope
      )
        result.willChange.add(node.argument.name)
    },
    leave(node) {
      if (map.has(node)) currentScope = currentScope.parent
    },
  })

  function traverse(fragment) {
    switch (fragment.type) {
      case 'Element':
        fragment.children.forEach(child => traverse(child))
        fragment.attributes.forEach(attribute => traverse(attribute))
        break
      case 'Attribute':
        result.willUseInTemplate.add(fragment.value.name)
        break
      case 'Expression':
        result.willUseInTemplate.add(fragment.expression.name)
        break
    }
  }

  ast.html.forEach(fragment => traverse(fragment))

  return result
}

export function generate(ast, analysis) {
  const code = {
    variables: [],
    create: [],
    update: [],
    destroy: [],
  }

  let counter = 1

  function traverse(node, parent) {
    switch (node.type) {
      case 'Element' :
      { const variableName = `${node.name}_${counter++}`
        code.variables.push(variableName)
        code.create.push(
        `${variableName} = document.createElement('${node.name}')`,
        )
        node.attributes.forEach((attribute) => {
          traverse(attribute, variableName)
        })
        node.children.forEach((child) => {
          traverse(child, variableName)
        })
        code.create.push(`${parent}.appendChild(${variableName})`)
        code.destroy.push(`${parent}.removeChild(${variableName})`)
        break
      }
      case 'Text':{
        const variableName = `txt_${counter++}`
        code.variables.push(variableName)
        code.create.push(
          `${variableName} = document.createTextNode('${node.value}')`,
        )
        code.create.push(`${parent}.appendChild(${variableName})`)
        break
      }
      case 'Attribute':{
        if (node.name.startsWith('on:')) {
          const eventHandler = node.value.name
          const eventName = node.name.slice(3)
          code.create.push(
            `${parent}.addEventListener('${eventName}',${eventHandler})`,
          )
          code.destroy.push(
            `${parent}.removeEventListener('${eventName}',${eventHandler})`,
          )
        }
        break
      }
      case 'Expression':{
        const variableName = `txt_${counter++}`
        const expression = node.expression.name
        code.variables.push(variableName)
        code.create.push(
          `${variableName} = document.createTextNode(${expression})`,
        )
        code.create.push(`${parent}.appendChild(${variableName})`)
        if (analysis.willChange.has(node.expression.name)) {
          code.update.push(`if(changed.includes('${expression}')){
          ${variableName}.data = ${expression}
          }`)
        }
        break
      }
    }
  }

  ast.html.forEach(fragment => traverse(fragment, 'target'))

  return `
  export default function(){
  ${code.variables.map(v => `let ${v}`).join('\n')}
    const lifesycle = {
    create(target){
    ${code.create.join('\n')}
    },
    update(changed){
    ${code.update.join('\n')}
    },
    destroy{
    ${code.destroy.join('\n')}
    }
  }
  return lifesycle
  `
}
