import useCollectionFilter from "@/composables/collection-filter.composable";
import { expect } from "vitest";
import { nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";

vi.mock("vue-router", () => ({
  useRoute: vi.fn(() => ({
    query: {},
  })),
  useRouter: vi.fn(() => ({
    replace: () => undefined,
  })),
}));

describe("Collection Filter Composable", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const items = [{ name: "Foo" }, { name: "Bar" }, { name: "Baz" }];

  it("should add filters", () => {
    const { filters, addFilter } = useCollectionFilter();
    expect(filters.value).toHaveLength(0);
    addFilter("foo");
    addFilter("bar");
    expect(filters.value).toHaveLength(2);
    expect(filters.value).toEqual(["foo", "bar"]);
  });

  it("should remove filters", () => {
    const { filters, addFilter, removeFilter } = useCollectionFilter();
    addFilter("foo");
    addFilter("bar");
    removeFilter("foo");
    expect(filters.value).toHaveLength(1);
    expect(filters.value).toEqual(["bar"]);
  });

  it("should filter an array correctly", () => {
    const { addFilter, predicate } = useCollectionFilter();
    addFilter("name:/^Ba/");
    const filtered = items.filter(predicate.value);
    expect(filtered).toHaveLength(2);
    expect(filtered).toEqual([{ name: "Bar" }, { name: "Baz" }]);
  });

  it("should not use router when disabled", async () => {
    const replace = vi.fn();

    vi.mocked(useRouter, { partial: true }).mockImplementation(() => ({
      replace,
    }));

    const { addFilter } = useCollectionFilter({ queryStringParam: "" });

    addFilter("name:/^Ba/");
    await nextTick();

    expect(replace).not.toHaveBeenCalled();
  });

  it("should use router when enabled", async () => {
    const replace = vi.fn();

    vi.mocked(useRouter, { partial: true }).mockImplementation(() => ({
      replace,
    }));

    const { addFilter } = useCollectionFilter();

    addFilter("name:/^Ba/");
    await nextTick();

    expect(replace).toHaveBeenCalledOnce();
  });

  it("should load single initial filter from query string", () => {
    vi.mocked(useRoute, { partial: true }).mockImplementation(() => ({
      query: {
        filter: "name:Foo",
      },
    }));
    const { filters } = useCollectionFilter();
    expect(filters.value).toHaveLength(1);
  });

  it("should load multiple initial filters from query string", () => {
    vi.mocked(useRoute, { partial: true }).mockImplementation(() => ({
      query: {
        filter: "name:Foo age:20",
      },
    }));
    const { filters } = useCollectionFilter();
    expect(filters.value).toHaveLength(2);
  });
});
