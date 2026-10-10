import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input.tsx";

const describedBy = (element: HTMLElement) =>
  (element.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent);

describe("Input", () => {
  test("renders a text input named by its label", () => {
    render(<Input label="Email" type="email" placeholder="you@school.fr" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input.getAttribute("type")).toBe("email");
    expect(input.getAttribute("placeholder")).toBe("you@school.fr");
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  test("links the description with aria-describedby", () => {
    render(<Input label="Email" description="We never share it" />);
    expect(describedBy(screen.getByRole("textbox", { name: "Email" }))).toContain("We never share it");
  });

  test("an error sets aria-invalid and is linked with aria-describedby", () => {
    render(<Input label="Email" description="Your school email" error="Email is required" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(describedBy(input)).toEqual(expect.arrayContaining(["Your school email", "Email is required"]));
    expect(screen.getByText("Email is required")).toBeDefined();
  });

  test("the invalid style hook (data-invalid) follows the error", () => {
    render(
      <>
        <Input label="Valid" />
        <Input label="Invalid" error="Wrong" />
      </>,
    );
    expect(screen.getByRole("textbox", { name: "Valid" }).hasAttribute("data-invalid")).toBe(false);
    expect(screen.getByRole("textbox", { name: "Invalid" }).hasAttribute("data-invalid")).toBe(true);
  });

  test("typing calls onValueChange", async () => {
    const onValueChange = mock();
    render(<Input label="Name" onValueChange={onValueChange} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Ada");
    expect(onValueChange).toHaveBeenLastCalledWith("Ada");
  });

  test("a disabled input cannot be typed in", async () => {
    render(<Input label="Name" disabled defaultValue="Ada" />);
    const input = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    await userEvent.type(input, "x");
    expect(input.value).toBe("Ada");
  });

  test("forwards id, name and data-testid to the input", () => {
    render(<Input label="Name" id="name" name="fullName" data-testid="name-input" />);
    const input = screen.getByTestId("name-input");
    expect(input.id).toBe("name");
    expect(input.getAttribute("name")).toBe("fullName");
  });
});
