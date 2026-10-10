import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextArea } from "./TextArea.tsx";

const describedBy = (element: HTMLElement) =>
  (element.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent);

describe("TextArea", () => {
  test("renders a textarea named by its label", () => {
    render(<TextArea label="Notes" />);
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea.getAttribute("rows")).toBe("4");
  });

  test("rows is configurable", () => {
    render(<TextArea label="Notes" rows={8} />);
    expect(screen.getByRole("textbox", { name: "Notes" }).getAttribute("rows")).toBe("8");
  });

  test("description and error are linked and the field is invalid", () => {
    render(<TextArea label="Notes" description="Markdown is fine" error="Too long" />);
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    expect(textarea.getAttribute("aria-invalid")).toBe("true");
    expect(describedBy(textarea)).toEqual(expect.arrayContaining(["Markdown is fine", "Too long"]));
  });

  test("typing calls onValueChange", async () => {
    const onValueChange = mock();
    render(<TextArea label="Notes" onValueChange={onValueChange} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Notes" }), "hi");
    expect(onValueChange).toHaveBeenLastCalledWith("hi");
  });

  test("a disabled textarea is disabled", () => {
    render(<TextArea label="Notes" disabled />);
    expect((screen.getByRole("textbox", { name: "Notes" }) as HTMLTextAreaElement).disabled).toBe(true);
  });
});
