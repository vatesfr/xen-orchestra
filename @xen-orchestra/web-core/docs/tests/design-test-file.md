# Design the test file first

Plan a test file before you write its first `it`, in `@xen-orchestra/web-core` and `@xen-orchestra/web` alike. A file written one `it` at a time ends up with near-copies: tests that differ only by their values, queries a shared reader already does, and cases a shared registrar already covers.

## Steps

1. **Start from the reference file for that kind of test** ([below](#reference-test-files)), not from a nearby test file. A nearby file may already contain the duplication this page helps you avoid.
2. **List the branches** of the code under test, one per line, with its `file:line` and the input that reaches it: each `if` / `else`, ternary, `??` / `||` / `&&` fallback, early return, mapper arm, `v-if` / `v-else` arm, emit, prop, slot and variant, then the edge cases (empty, `undefined`, `null`, `0`, a collection still loading, an error).
3. **Group the entries** whose tests would differ only by their values. Each group becomes one `it.each`.
4. **Look for shared helpers** for each entry: a reader for what it checks, the user action, the mount, the mock, the fixture, and a registrar that already covers it. web-core: [Shared test helpers](../tests.md#shared-test-helpers); XO 6: [Shared helpers by need](../../../web/docs/tests/helpers.md).
5. **Then write the file**: one local mount helper ([Setup](./setup-helpers.md)), the `it.each` groups, the other `it`s, and the registrar calls.

## Which shape removes a repetition

| Repetition                                         | Shape                                                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| The same setup, in one file                        | a local helper at the top of the file ([Setup](./setup-helpers.md))                                        |
| The same test, only the values differ, in one file | `it.each`, one row per case                                                                                |
| The same setup, query or fixture, in 2 files       | a shared helper, reader or fixture in the package's test directory; each file keeps its own explicit `it`s |
| The same tests, in 3 files or more                 | a registrar in the package's test directory, called once per file with what differs                        |

A registrar is a function that declares the tests for one behavior. `it<Behavior>(…)` adds its `it`s where you call it; `describe<Behavior>(…)` wraps them in a `describe`. Call it at the top level of a test file or inside a `describe`. Name it after the behavior it checks (`itCannotRun`, `describeV2vTargetCells`). Its arguments are what differs between callers, such as what to mount and the expected values. XO 6 registrars are listed in [Shared test cases](../../../web/docs/tests/helpers.md#shared-test-cases).

The table tells you when to extract. An existing registrar is always reused, however many files call it. Two files that call the same shared helper, each with its own values, are not a repetition.

## Reference test files

Each file below follows these docs and has no known duplication. Start a new test of the same kind from its structure.

| Kind               | Reference                                                                        |
| ------------------ | -------------------------------------------------------------------------------- |
| web-core util      | `web-core/lib/utils/to-variants.util.unit.test.ts`                               |
| web-core component | `web-core/lib/components/success-state-hero/VtsSuccessStateHero.unit.test.ts`    |
| XO 6 util          | `web/src/modules/v2v/utils/v2v-prerequisite.util.unit.test.ts`                   |
| XO 6 composable    | `web/src/modules/v2v/composables/use-v2v-source-stats.composable.unit.test.ts`   |
| XO 6 card          | `web/src/modules/v2v/components/destination/V2vDestinationPoolCard.unit.test.ts` |
| XO 6 table         | `web/src/modules/v2v/components/mapping/V2vDiskMappingTable.unit.test.ts`        |
| XO 6 job           | `web/src/modules/v2v/jobs/xo-v2v-start.job.unit.test.ts`                         |

If a change makes a reference file out of date with these docs, update that file, or replace it in this table, in the same change.
