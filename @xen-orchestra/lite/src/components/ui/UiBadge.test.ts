import UiBadge from "@/components/ui/UiBadge.vue";
import { faDisplay } from "@fortawesome/free-solid-svg-icons";
import { render } from "@testing-library/vue";

describe("UiBadge", () => {
  it("should render with no icon", () => {
    const { getByText, queryByTestId } = render(UiBadge, {
      slots: {
        default: "3456",
      },
    });

    getByText("3456");

    expect(queryByTestId("ui-icon")).toBeNull();
  });

  it("should render with icon", () => {
    const { getByTestId } = render(UiBadge, {
      props: {
        icon: faDisplay,
      },
    });

    getByTestId("ui-icon");
  });
});
