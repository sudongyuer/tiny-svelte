import { describe, expect, it } from 'vitest'
describe("parse",()=>{

  it('match',()=>{
    let i = 0;
    const content = "<div>hello</div>"
    function match(str){
      return content.slice(i,str.length) === str
    }
    expect(match("<div>")).toBe(true)
  })

  it('exported', () => {
    expect(1).toEqual(1)
  })

  it("parse fragment",()=>{

  })
})
