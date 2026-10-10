import { describe, expect, mock, test } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./Select.tsx";

const options = [
  { value: "math", label: "Mathematics" },
  { value: "bio", label: "Biology" },
  { value: "art", label: "Art", disabled: true },
];

describe("Select", () => {
  test("renders a combobox named by its label with the placeholder", () => {
    render(<Select label="Subject" options={options} placeholder="Choose a subject" />);
    const trigger = screen.getByRole("combobox", { name: "Subject" });
    expect(trigger.textContent).toContain("Choose a subject");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  test("shows the label of the default value", () => {
    render(<Select label="Subject" options={options} defaultValue="bio" />);
    expect(screen.getByRole("combobox", { name: "Subject" }).textContent).toContain("Biology");
  });

  test("opening and choosing an option selects it and calls onValueChange", async () => {
    const onValueChange = mock();
    render(<Select label="Subject" options={options} onValueChange={onValueChange} />);
    const trigger = screen.getByRole("combobox", { name: "Subject" });
    await userEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await userEvent.click(await screen.findByRole("option", { name: "Biology" }));
    expect(onValueChange).toHaveBeenLastCalledWith("bio");
    await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
    expect(trigger.textContent).toContain("Biology");
  });

  test("keyboard: open with ArrowDown and choose with Enter", async () => {
    const onValueChange = mock();
    render(<Select label="Subject" options={options} onValueChange={onValueChange} />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowDown}");
    await screen.findByRole("listbox");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(onValueChange).toHaveBeenCalled());
  });

  test("Escape closes the popup without choosing", async () => {
    const onValueChange = mock();
    render(<Select label="Subject" options={options} onValueChange={onValueChange} />);
    const trigger = screen.getByRole("combobox", { name: "Subject" });
    await userEvent.click(trigger);
    await screen.findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("disabled options are marked disabled", async () => {
    render(<Select label="Subject" options={options} />);
    await userEvent.click(screen.getByRole("combobox", { name: "Subject" }));
    const art = await screen.findByRole("option", { name: "Art" });
    expect(art.getAttribute("aria-disabled")).toBe("true");
  });

  test("an error sets aria-invalid and is linked with aria-describedby", () => {
    render(<Select label="Subject" options={options} description="Pick one" error="Required" />);
    const trigger = screen.getByRole("combobox", { name: "Subject" });
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
    const ids = (trigger.getAttribute("aria-describedby") ?? "").split(" ");
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual(
      expect.arrayContaining(["Pick one", "Required"]),
    );
  });

  test("a disabled select does not open", async () => {
    render(<Select label="Subject" options={options} disabled />);
    const trigger = screen.getByRole("combobox", { name: "Subject" });
    await userEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
