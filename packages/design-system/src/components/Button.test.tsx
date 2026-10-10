import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button.tsx";

describe("Button", () => {
  test("renders a native button of type button", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
  });

  test("variants produce different classes", () => {
    render(
      <>
        <Button variant="primary">primary</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="ghost">ghost</Button>
        <Button variant="danger">danger</Button>
      </>,
    );
    const classes = ["primary", "secondary", "ghost", "danger"].map(
      (name) => screen.getByRole("button", { name }).className,
    );
    expect(new Set(classes).size).toBe(4);
  });

  test("sizes produce different classes", () => {
    render(
      <>
        <Button size="sm">sm</Button>
        <Button size="md">md</Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "sm" }).className).not.toBe(
      screen.getByRole("button", { name: "md" }).className,
    );
  });

  test("calls onClick when clicked", async () => {
    const onClick = mock();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("a disabled button ignores clicks", async () => {
    const onClick = mock();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.hasAttribute("disabled")).toBe(true);
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  test("a loading button is busy, shows a spinner, stays focusable and ignores clicks", async () => {
    const onClick = mock();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByTestId("button-spinner").getAttribute("aria-hidden")).toBe("true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
  });

  test("a disabled button is not focusable, even while loading", async () => {
    render(
      <Button loading disabled>
        Save
      </Button>,
    );
    await userEvent.tab();
    expect(document.activeElement).toBe(document.body);
  });

  test("submit type is forwarded", () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole("button", { name: "Send" }).getAttribute("type")).toBe("submit");
  });
});
