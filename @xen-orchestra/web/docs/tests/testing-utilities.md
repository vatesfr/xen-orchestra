# Utilities (XO 6)

How to test a util is in [Testing pure utilities](../../../web-core/docs/tests/testing-utilities.md). XO 6 adds where its utils live:

> **Prefer extracting pure logic into a util.** When a `<script setup>` holds non-trivial logic (chart series, formatting, aggregation), pull it into `modules/<mod>/utils/*.util.ts` and unit-test that — a component should not carry much complex logic. This is how the Pool and Host dashboard chart logic was made testable (`xo-pool-dashboard.util.ts`, `xo-host-dashboard.util.ts`). What remains in the component is then rendering, covered by [Testing components](./testing-components.md).

> **Logic more than one module needs goes to `src/shared/utils/`,** not copied per module. `shared/utils/chart-stats.util.ts` holds what the VM, host and pool dashboards all do — building timestamps, averaging cpu usage, deriving used memory, summing a bidirectional series, rounding an axis maximum — and is tested once, there. A `modules/<mod>/utils/*.util.ts` earns its place only for logic no other module has (`buildHostLoadAverageSeries`: hosts alone report a load average). Never add a module function that just forwards to the shared one: the component calls the shared function itself, passing the stats path it reads and the axis step it wants.
