import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./Checkbox.tsx";

describe("Checkbox", () => {
  test("renders an unchecked checkbox named by its label", () => {
    render(<Checkbox label="Remember me" />);
    const checkbox = screen.getByRole("checkbox", { name: "Remember me" });
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
  });

  test("clicking toggles it and calls onCheckedChange", async () => {
    const onCheckedChange = mock();
    render(<Checkbox label="Remember me" onCheckedChange={onCheckedChange} />);
    const checkbox = screen.getByRole("checkbox", { name: "Remember me" });
    await userEvent.click(checkbox);
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    expect(checkbox.hasAttribute("data-checked")).toBe(true);
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(checkbox);
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  test("clicking the label toggles it", async () => {
    render(<Checkbox label="Remember me" />);
    await userEvent.click(screen.getByText("Remember me"));
    expect(screen.getByRole("checkbox", { name: "Remember me" }).getAttribute("aria-checked")).toBe("true");
  });

  test("Space toggles it from the keyboard", async () => {
    render(<Checkbox label="Remember me" />);
    await userEvent.tab();
    await userEvent.keyboard("[Space]");
    expect(screen.getByRole("checkbox", { name: "Remember me" }).getAttribute("aria-checked")).toBe("true");
  });

  test("defaultChecked starts checked", () => {
    render(<Checkbox label="Remember me" defaultChecked />);
    expect(screen.getByRole("checkbox", { name: "Remember me" }).getAttribute("aria-checked")).toBe("true");
  });

  test("a disabled checkbox does not toggle", async () => {
    render(<Checkbox label="Remember me" disabled />);
    const checkbox = screen.getByRole("checkbox", { name: "Remember me" });
    expect((checkbox as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(checkbox);
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
  });

  test("links the description with aria-describedby", () => {
    render(<Checkbox label="Remember me" description="For 30 days" />);
    const ids = screen.getByRole("checkbox", { name: "Remember me" }).getAttribute("aria-describedby") ?? "";
    expect(ids.split(" ").map((id) => document.getElementById(id)?.textContent)).toContain("For 30 days");
  });
});
