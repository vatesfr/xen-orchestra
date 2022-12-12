import useBusy from "@/composables/busy.composable";
import { expect, vi } from "vitest";

describe("Busy Composable", () => {
  it("should work", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    const promise = new Promise((r) => (resolve = r));
    const func = vi.fn(() => promise);
    const { isBusy, run, error } = useBusy(func);

    expect(isBusy.value).toBeFalsy();
    const runPromise = run();
    expect(isBusy.value).toBeTruthy();

    resolve(null);
    await runPromise;
    expect(isBusy.value).toBeFalsy();
    expect(error.value).toBeUndefined();
  });

  it("should handle error", async () => {
    const errorMessage = "SOMETHING BAD HAPPENED";
    const promise = Promise.reject(errorMessage);
    const func = vi.fn(() => promise);
    const { isBusy, run, error } = useBusy(func);

    try {
      await run();
    } catch (e) {
      /**/
    }
    expect(isBusy.value).toBeFalsy();
    expect(error.value).toBe(errorMessage);
  });
});
