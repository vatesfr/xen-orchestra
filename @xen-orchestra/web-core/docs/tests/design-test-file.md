# Design the test file first

A test file is designed before its first `it`, in `@xen-orchestra/web-core` and `@xen-orchestra/web` alike. Written one `it` at a time, a file collects near-copies: tests that differ only by their values, queries already held by a shared reader, cases a shared registrar already declares.

## Steps

1. **Start from the reference file of its kind** ([below](#reference-test-files)), not from the nearest sibling: a sibling may hold the duplication this page is meant to prevent.
2. **Map the branches** of the unit under test, one line per entry, `file:line` and the input reaching it: each `if` / `else`, ternary, `??` / `||` / `&&` fallback, early return, mapper arm, `v-if` / `v-else` arm, emit, prop, slot and variant, then the degenerate inputs (empty, `undefined`, `null`, `0`, a collection still loading, an error).
3. **Group the entries** whose tests would differ only by their values: each group becomes one `it.each`.
4. **Find the shared helpers** for each entry: the reader of what it asserts, the action it performs, the mount, the mock, the fixture — and the registrar that already declares it. web-core: [Shared test helpers](../tests.md#shared-test-helpers); XO 6: [Shared helpers by need](../../../web/docs/tests/helpers.md).
5. **Then write**: one local mount helper ([Setup](./setup-helpers.md)), the `it.each` groups, the remaining `it`s, the registrar calls.

## Which shape removes a repetition

| Repetition                                         | Shape                                                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| The same setup, in one file                        | a local helper at the top of the file ([Setup](./setup-helpers.md))                                        |
| The same test, only the values differ, in one file | `it.each`, one row per case                                                                                |
| The same setup, query or fixture, in 2 files       | a shared helper, reader or fixture in the package's test directory; each file keeps its own explicit `it`s |
| The same tests, in 3 files or more                 | a registrar in the package's test directory, called once per file with what differs                        |

A registrar is a function declaring the tests of one behavior: `it<Behavior>(…)` declares its `it`s where it is called, `describe<Behavior>(…)` wraps them in a `describe`. It is called at the top level of a test file (or in a `describe`), named after the behavior it asserts (`itCannotRun`, `describeV2vTargetCells`), and takes what differs between its callers: the mount, the expected values. XO 6 lists its own in [Shared test cases](../../../web/docs/tests/helpers.md#shared-test-cases).

The table says what to extract. An existing registrar is reused whatever its number of callers, and two files calling the same shared helper with their own values is not a repetition.

## Reference test files

Each file follows these docs and holds no known duplication. Start a new test of that kind from its shape.

| Kind               | Reference                                                                        |
| ------------------ | -------------------------------------------------------------------------------- |
| web-core util      | `web-core/lib/utils/to-variants.util.unit.test.ts`                               |
| web-core component | `web-core/lib/components/success-state-hero/VtsSuccessStateHero.unit.test.ts`    |
| XO 6 util          | `web/src/modules/v2v/utils/v2v-prerequisite.util.unit.test.ts`                   |
| XO 6 composable    | `web/src/modules/v2v/composables/use-v2v-source-stats.composable.unit.test.ts`   |
| XO 6 card          | `web/src/modules/v2v/components/destination/V2vDestinationPoolCard.unit.test.ts` |
| XO 6 table         | `web/src/modules/v2v/components/mapping/V2vDiskMappingTable.unit.test.ts`        |
| XO 6 job           | `web/src/modules/v2v/jobs/xo-v2v-start.job.unit.test.ts`                         |

A change that makes a reference file fall behind these docs updates it, or replaces it here, in the same change.
