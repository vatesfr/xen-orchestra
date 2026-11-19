import { parseSchemaDescription, splitTextSegments } from '@/modules/plugin/utils/json-schema-description.util.ts'

describe('parseSchemaDescription', () => {
  it.each([undefined, '', '  \n\n  '])('returns no text for the description %j', description => {
    expect(parseSchemaDescription(description)).toEqual({ text: undefined, exampleGroups: [] })
  })

  it('puts each paragraph on its own line and keeps the code spans', () => {
    expect(parseSchemaDescription('Paths to CA.\n\nFor AD, it can also be `<user>@<domain>`.')).toEqual({
      text: 'Paths to CA.\nFor AD, it can also be `<user>@<domain>`.',
      exampleGroups: [],
    })
  })

  it.each(['<br>', '<br/>', '<br />', '<BR>'])('puts the text after a %s on its own line', lineBreak => {
    expect(
      parseSchemaDescription(
        `Specify that the IdP should always sign the assertions${lineBreak}Note: either one must be signed.`
      )
    ).toEqual({
      text: 'Specify that the IdP should always sign the assertions\nNote: either one must be signed.',
      exampleGroups: [],
    })
  })

  it('keeps the inline examples in the text', () => {
    expect(
      parseSchemaDescription('Field to use as the XO username (e.g. `displayName`, `username` or `email`)')
    ).toEqual({
      text: 'Field to use as the XO username (e.g. `displayName`, `username` or `email`)',
      exampleGroups: [],
    })
  })

  it('extracts lists of examples with the paragraph introducing them', () => {
    const description = `
Filter used to find the user.

For LDAP you can try something like:

- \`(&(uid={{name}})(memberOf=<group DN>))\`

For Microsoft Active Directory:

- \`(cn={{name}})\`
- \`(sAMAccountName={{name}}@<domain>)\` (replace \`<domain>\` by your own domain)
`

    expect(parseSchemaDescription(description)).toEqual({
      text: 'Filter used to find the user.',
      exampleGroups: [
        { caption: 'For LDAP you can try something like:', values: ['(&(uid={{name}})(memberOf=<group DN>))'] },
        { caption: 'For Microsoft Active Directory:', values: ['(cn={{name}})', '(sAMAccountName={{name}}@<domain>)'] },
      ],
    })
  })

  it('keeps the help text when a list directly follows it', () => {
    expect(parseSchemaDescription('Choose one of:\n\n- `foo`\n- `bar`')).toEqual({
      text: 'Choose one of:',
      exampleGroups: [{ caption: undefined, values: ['foo', 'bar'] }],
    })
  })

  it('keeps a list without code spans as text', () => {
    expect(parseSchemaDescription('Options:\n\n- first\n- second').text).toBe('Options:\n- first - second')
  })
})

describe('splitTextSegments', () => {
  it('splits the text around the code spans', () => {
    expect(splitTextSegments('Must be unique. e.g.: `dn` or `uid`')).toEqual([
      { kind: 'text', text: 'Must be unique. e.g.: ' },
      { kind: 'code', text: 'dn' },
      { kind: 'text', text: ' or ' },
      { kind: 'code', text: 'uid' },
    ])
  })

  it('returns the whole text without code span', () => {
    expect(splitTextSegments('Where to look for the groups.')).toEqual([
      { kind: 'text', text: 'Where to look for the groups.' },
    ])
  })

  it('turns the HTML links into links', () => {
    expect(
      splitTextSegments(
        'See the <a href="https://docs.xen-orchestra.com/backups#backups-execution" rel="noopener noreferrer" target="_blank">job\'s runId</a> or `runId`'
      )
    ).toEqual([
      { kind: 'text', text: 'See the ' },
      { kind: 'link', text: "job's runId", href: 'https://docs.xen-orchestra.com/backups#backups-execution' },
      { kind: 'text', text: ' or ' },
      { kind: 'code', text: 'runId' },
    ])
  })

  it('keeps the HTML links which do not point to a web page as text', () => {
    expect(splitTextSegments('<a href="javascript:alert(1)">click</a>')).toEqual([
      { kind: 'text', text: '<a href="javascript:alert(1)">click</a>' },
    ])
  })
})
