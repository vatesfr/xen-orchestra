import { parseSchemaDescription, splitCodeSpans } from '@/modules/plugin/utils/json-schema-description.util.ts'

describe('parseSchemaDescription', () => {
  it.each([undefined, '', '  \n\n  '])('returns no text for the description %j', description => {
    expect(parseSchemaDescription(description)).toEqual({ text: undefined, exampleGroups: [] })
  })

  it('joins the paragraphs and keeps the code spans', () => {
    expect(parseSchemaDescription('Paths to CA.\n\nFor AD, it can also be `<user>@<domain>`.')).toEqual({
      text: 'Paths to CA. For AD, it can also be `<user>@<domain>`.',
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
    expect(parseSchemaDescription('Options:\n\n- first\n- second').text).toBe('Options: - first - second')
  })
})

describe('splitCodeSpans', () => {
  it('splits the text around the code spans', () => {
    expect(splitCodeSpans('Must be unique. e.g.: `dn` or `uid`')).toEqual([
      { text: 'Must be unique. e.g.: ', isCode: false },
      { text: 'dn', isCode: true },
      { text: ' or ', isCode: false },
      { text: 'uid', isCode: true },
    ])
  })

  it('returns the whole text without code span', () => {
    expect(splitCodeSpans('Where to look for the groups.')).toEqual([
      { text: 'Where to look for the groups.', isCode: false },
    ])
  })
})
