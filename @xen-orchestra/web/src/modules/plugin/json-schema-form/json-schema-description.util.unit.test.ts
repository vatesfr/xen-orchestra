import { parseSchemaDescription } from '@/modules/plugin/json-schema-form/json-schema-description.util.ts'

describe('parseSchemaDescription', () => {
  it.each([undefined, '', '  \n\n  '])('returns no text for the description %j', description => {
    expect(parseSchemaDescription(description)).toEqual({ text: undefined, exampleGroups: [] })
  })

  it('joins the paragraphs and removes the code spans', () => {
    expect(parseSchemaDescription('Paths to CA.\n\nFor AD, it can also be `<user>@<domain>`.')).toEqual({
      text: 'Paths to CA. For AD, it can also be <user>@<domain>.',
      exampleGroups: [],
    })
  })

  it('extracts inline examples', () => {
    expect(
      parseSchemaDescription(
        'Attribute used to find the members. e.g.: `memberUid`. The values must reference the user IDs'
      )
    ).toEqual({
      text: 'Attribute used to find the members. The values must reference the user IDs',
      exampleGroups: [{ values: ['memberUid'] }],
    })
  })

  it('extracts inline examples without colon, whatever their case', () => {
    expect(parseSchemaDescription('Port of the server, E.g. `389`')).toEqual({
      text: 'Port of the server,',
      exampleGroups: [{ values: ['389'] }],
    })
  })

  it('lists the inline examples before the lists of examples', () => {
    expect(parseSchemaDescription('Attribute, e.g. `uid`\n\nOr:\n\n- `cn`')).toEqual({
      text: 'Attribute,',
      exampleGroups: [{ values: ['uid'] }, { caption: 'Or:', values: ['cn'] }],
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
