import {describe, expect, it} from 'vitest'

describe("parse", () => {

  it('match', () => {
    let i = 0;
    const content = "<div>hello</div>"
    function match(str) {
      return content.slice(i, str.length) === str
    }

    expect(match("<div>")).toBe(true)
  })

  it('eat', () => {
    let i = 0;
    const content = "<div>hello</div>"
    function match(str) {
      return content.slice(i, str.length) === str
    }
    function eat(str) {
      if (match(str)) {
        i += str.length
      } else {
        throw new Error(`Parse error: expecting "${str}"`)
      }
    }
    eat("<div>")
    expect(i).toEqual(5)
  })

  it('eat error', () => {
    let i = 0;
    const content = "<div>hello</div>"
    function match(str) {
      return content.slice(i, str.length) === str
    }
    function eat(str) {
      if (match(str)) {
        i += str.length
      } else {
        throw new Error(`Parse error: expecting "${str}"`)
      }
    }
    expect(()=>eat("<button>")).toThrowError()
  })

  it("readWhileMatching",()=>{
    let i = 5
    const content = "<div>hello</div>"
    function readWhileMatching(regex){
      let startIndex = i
      while(regex.test(content[i])){
        i++
      }
      return content.slice(startIndex,i)
    }
    expect(readWhileMatching(/[^<]/)).toEqual("hello")
    expect(i).toEqual(10)
  })

  it("parse fragment", () => {

  })
})
