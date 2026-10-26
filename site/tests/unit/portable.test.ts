import { describe, expect, it } from 'vitest'
import { portableToHtml } from '../../src/lib/content/portable'

const externalLink = {
  _type: 'block',
  _key: 'block-external',
  style: 'normal',
  markDefs: [{ _type: 'link', _key: 'link-external', href: 'https://example.com' }],
  children: [{ _type: 'span', _key: 'span-external', text: 'Example', marks: ['link-external'] }],
}

const internalLink = {
  _type: 'block',
  _key: 'block-internal',
  style: 'normal',
  markDefs: [{ _type: 'link', _key: 'link-internal', href: '/members' }],
  children: [{ _type: 'span', _key: 'span-internal', text: 'Members', marks: ['link-internal'] }],
}

const anchorLink = {
  _type: 'block',
  _key: 'block-anchor',
  style: 'normal',
  markDefs: [{ _type: 'link', _key: 'link-anchor', href: '#committee' }],
  children: [{ _type: 'span', _key: 'span-anchor', text: 'Committee', marks: ['link-anchor'] }],
}

const javascriptLink = {
  _type: 'block',
  _key: 'block-javascript',
  style: 'normal',
  markDefs: [{ _type: 'link', _key: 'link-javascript', href: 'javascript:alert(1)' }],
  children: [{ _type: 'span', _key: 'span-javascript', text: 'Not a link', marks: ['link-javascript'] }],
}

const protocolRelativeLink = {
  _type: 'block',
  _key: 'block-protocol-relative',
  style: 'normal',
  markDefs: [{ _type: 'link', _key: 'link-protocol-relative', href: '//example.com' }],
  children: [{ _type: 'span', _key: 'span-protocol-relative', text: 'External', marks: ['link-protocol-relative'] }],
}

const imageBlock = {
  _type: 'image',
  _key: 'image-1',
  alt: 'A print on the press',
  dimensions: { width: 1200, height: 800 },
}

describe('portableToHtml', () => {
  it('returns an empty string for empty input', () => {
    expect(portableToHtml([], { lang: 'en', imageUrl: () => undefined })).toBe('')
  })

  it('adds rel="noopener" to external links only', () => {
    const external = portableToHtml([externalLink], { lang: 'en', imageUrl: () => undefined })
    expect(external).toContain('href="https://example.com"')
    expect(external).toContain('rel="noopener"')

    const internal = portableToHtml([internalLink], { lang: 'en', imageUrl: () => undefined })
    expect(internal).toContain('href="/members"')
    expect(internal).not.toContain('rel=')

    const anchor = portableToHtml([anchorLink], { lang: 'en', imageUrl: () => undefined })
    expect(anchor).toContain('href="#committee"')
    expect(anchor).not.toContain('rel=')
  })

  it('drops unsafe link schemes instead of emitting an href', () => {
    const html = portableToHtml([javascriptLink], { lang: 'en', imageUrl: () => undefined })

    expect(html).toContain('Not a link')
    expect(html).not.toContain('href=')
    expect(html).not.toContain('javascript:')
  })

  it('treats protocol-relative links as external', () => {
    const html = portableToHtml([protocolRelativeLink], {
      lang: 'en',
      imageUrl: () => undefined,
    })

    expect(html).toContain('href="//example.com"')
    expect(html).toContain('rel="noopener"')
  })

  it('reserves dimensions and defaults alt to empty for images', () => {
    const html = portableToHtml([{ ...imageBlock, alt: undefined }], {
      lang: 'en',
      imageUrl: () => 'https://cdn.example.com/print.jpg',
    })

    expect(html).toContain('<img')
    expect(html).toContain('src="https://cdn.example.com/print.jpg"')
    expect(html).toContain('alt=""')
    expect(html).toContain('width="1200"')
    expect(html).toContain('height="800"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('decoding="async"')
  })

  it('renders the shared rule placeholder when no image URL is available', () => {
    const html = portableToHtml([imageBlock], { lang: 'en', imageUrl: () => undefined })

    expect(html).toContain('<figure')
    expect(html).toContain('figure__placeholder')
    expect(html).toContain('border: var(--rule)')
    expect(html).toContain('aspect-ratio: 1200 / 800')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('aria-hidden')
  })

  it('hides a placeholder only when it carries no alt text', () => {
    const withAlt = portableToHtml([imageBlock], {
      lang: 'en',
      imageUrl: () => undefined,
    })
    expect(withAlt).not.toContain('aria-hidden')

    const withoutAlt = portableToHtml([{ ...imageBlock, alt: undefined }], {
      lang: 'en',
      imageUrl: () => undefined,
    })
    expect(withoutAlt).toContain('aria-hidden="true"')
  })
})
