import * as fs from 'fs'

const content = fs.readFileSync('./app.svelte','utf-8')
const ast = parse(content)
const analysis = analyse(ast)
const js = generate(ast,analysis)

fs.writeFileSync('./app.js',js,'utf-8')

function parse(content){

}

function analyse(ast){

}

function generate(ast,analysis){

}
