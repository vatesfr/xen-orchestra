import { test } from 'node:test'
import assert from 'node:assert'

import toOvaXml from './_toOvaXml.mjs'
import { parseOvaXml } from './_parseOvaXml.mjs'

const wrap = objects =>
  `<value><struct><member><name>version</name><value><struct><member><name>export_vsn</name><value>2</value></member></struct></value></member><member><name>objects</name><value><array><data>${objects}</data></array></value></member></struct></value>`

test('parses back what toOvaXml writes', () => {
  const snapshotTime = new Date(Date.UTC(2022, 0, 1, 10, 20, 30))
  const xml = toOvaXml({
    version: { hostname: 'host', export_vsn: 2 },
    objects: [
      {
        class: 'VM',
        id: 'Ref:000',
        snapshot: {
          name_label: 'a & b <c> "d"',
          name_description: ' two\nlines ',
          memory_static_max: 1073741824,
          is_a_template: false,
          snapshot_time: snapshotTime,
          VBDs: ['Ref:003'],
          other_config: {},
          tags: [],
        },
      },
    ],
  })
  const { version, objects } = parseOvaXml(xml)
  // untyped values are kept as strings
  assert.deepStrictEqual(version, { hostname: 'host', export_vsn: '2' })
  assert.deepStrictEqual(objects, [
    {
      class: 'VM',
      id: 'Ref:000',
      snapshot: {
        name_label: 'a & b <c> "d"',
        name_description: ' two\nlines ',
        memory_static_max: '1073741824',
        is_a_template: false,
        snapshot_time: snapshotTime,
        VBDs: ['Ref:003'],
        other_config: {},
        tags: [],
      },
    },
  ])
  // and the parsed structure can be written back identically
  assert.strictEqual(toOvaXml({ version, objects }), xml)
})

test('parses the typed values written by xapi', () => {
  const { objects } = parseOvaXml(
    wrap(
      '<value><struct><member><name>class</name><value>VM</value></member><member><name>id</name><value>Ref:0</value></member><member><name>snapshot</name><value><struct>' +
        '<member><name>HVM_shadow_multiplier</name><value><double>1.5</double></value></member>' +
        '<member><name>is_a_template</name><value><boolean>1</boolean></value></member>' +
        '<member><name>is_a_snapshot</name><value><boolean>0</boolean></value></member>' +
        '<member><name>name_description</name><value></value></member>' +
        '<member><name>allowed_operations</name><value><array><data/></array></value></member>' +
        '<member><name>snapshot_time</name><value><dateTime.iso8601>20231105T10:00:00Z</dateTime.iso8601></value></member>' +
        '<member><name>last_booted</name><value><dateTime.iso8601>2023-11-05T10:00:00Z</dateTime.iso8601></value></member>' +
        '<member><name>uuid</name><value><string>abc</string></value></member>' +
        '</struct></value></member></struct></value>'
    )
  )
  assert.deepStrictEqual(objects[0].snapshot, {
    HVM_shadow_multiplier: 1.5,
    is_a_template: true,
    is_a_snapshot: false,
    name_description: '',
    allowed_operations: [],
    snapshot_time: new Date(Date.UTC(2023, 10, 5, 10)),
    last_booted: new Date(Date.UTC(2023, 10, 5, 10)),
    uuid: 'abc',
  })
})

test('ignores the whitespace between the elements of an indented ova.xml', () => {
  const { version, objects } = parseOvaXml(`
<value>
  <struct>
    <member>
      <name>version</name>
      <value><struct/></value>
    </member>
    <member>
      <name>objects</name>
      <value>
        <array>
          <data>
            <value><struct>
              <member><name>class</name><value>VM</value></member>
              <member><name>id</name><value>Ref:0</value></member>
              <member><name>snapshot</name><value><struct><member><name>name_label</name><value> vm </value></member></struct></value></member>
            </struct></value>
          </data>
        </array>
      </value>
    </member>
  </struct>
</value>
`)
  assert.deepStrictEqual(version, {})
  assert.deepStrictEqual(objects, [{ class: 'VM', id: 'Ref:0', snapshot: { name_label: ' vm ' } }])
})

test('rejects an invalid ova.xml', () => {
  assert.throws(() => parseOvaXml('<value><struct/></value>'), /version and objects/)
  assert.throws(() => parseOvaXml(wrap('<value><struct/></value>')), /class, an id and a snapshot/)
  assert.throws(() => parseOvaXml('<value><foo>1</foo></value>'), /unsupported value type/)
  assert.throws(
    () =>
      parseOvaXml(
        wrap(
          '<value><struct><member><name>class</name><value>VM</value></member><member><name>id</name><value>Ref:0</value></member><member><name>snapshot</name><value><struct><member><name>snapshot_time</name><value><dateTime.iso8601>yesterday</dateTime.iso8601></value></member></struct></value></member></struct></value>'
        )
      ),
    /dateTime.iso8601/
  )
})
