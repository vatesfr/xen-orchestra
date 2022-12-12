import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PowerStateIcon from "@/components/PowerStateIcon.vue";

describe("PowerStateIcon.vue", () => {
  it("should render correctly", async () => {
    const wrapper = mount(PowerStateIcon, {
      props: {
        state: "Running",
      },
    });

    expect(wrapper.element.classList.contains("state-running")).toBeTruthy();

    await wrapper.setProps({
      state: "Paused",
    });

    expect(wrapper.element.classList.contains("state-paused")).toBeTruthy();

    await wrapper.setProps({
      state: "not-exists",
    });

    expect(wrapper.element.classList.contains("state-not-exists")).toBeTruthy();
  });
});
