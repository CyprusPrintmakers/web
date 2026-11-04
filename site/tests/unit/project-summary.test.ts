import { describe, expect, it } from 'vitest'
import { bodyWithoutLead } from '../../src/lib/projects/summary'
import type { PortableTextValue } from '../../src/lib/content/portable'

const block = (text: string): PortableTextValue => ({
  _type: 'block',
  _key: text.slice(0, 6),
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: 's1', text, marks: [] }],
})

describe('bodyWithoutLead', () => {
  it('drops the first paragraph when it repeats the summary exactly', () => {
    const body = [block('A printmaking workshop.'), block('Second paragraph.')]
    expect(bodyWithoutLead(body, 'A printmaking workshop.')).toEqual([body[1]])
  })

  it('drops the first paragraph when the summary is a truncated prefix', () => {
    const body = [block('A printmaking workshop with many artists and a long description.'), block('Second.')]
    expect(bodyWithoutLead(body, 'A printmaking workshop with many artists')).toEqual([body[1]])
  })

  it('keeps a distinct summary and the full body', () => {
    const body = [block('Body starts here.'), block('More.')]
    expect(bodyWithoutLead(body, 'A separate standfirst')).toEqual(body)
  })

  it('handles an empty summary or body', () => {
    const body = [block('Body.')]
    expect(bodyWithoutLead(body, '')).toEqual(body)
    expect(bodyWithoutLead([], 'Summary')).toEqual([])
  })

  it('normalises whitespace before comparing', () => {
    const body = [block('A   workshop\nwith line breaks.')]
    expect(bodyWithoutLead(body, 'A workshop with line breaks.')).toEqual([])
  })
})
