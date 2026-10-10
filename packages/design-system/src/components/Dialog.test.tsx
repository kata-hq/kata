import { describe, expect, mock, test } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button.tsx";
import { Dialog, DialogClose } from "./Dialog.tsx";

const renderDialog = (onOpenChange = mock()) =>
  render(
    <Dialog
      title="Delete note"
      description="This cannot be undone."
      trigger={<Button variant="danger">Delete</Button>}
      onOpenChange={onOpenChange}
      actions={
        <>
          <DialogClose>Cancel</DialogClose>
          <Button variant="danger">Confirm</Button>
        </>
      }
    >
      Body text
    </Dialog>,
  );

const openDialog = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Delete" }));
  return screen.findByRole("dialog", { name: "Delete note" });
};

describe("Dialog", () => {
  test("is closed until the trigger is clicked", () => {
    renderDialog();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Delete" }).getAttribute("aria-haspopup")).toBe("dialog");
  });

  test("opens from the trigger with a title, description and content", async () => {
    const onOpenChange = mock();
    renderDialog(onOpenChange);
    const dialog = await openDialog();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(dialog.textContent).toContain("Body text");
    const describedBy = dialog.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(describedBy)?.textContent).toBe("This cannot be undone.");
    // The page behind a modal dialog is hidden from assistive tech, the trigger included.
    const trigger = screen.getByRole("button", { name: "Delete", hidden: true });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  test("Escape closes it and focus returns to the trigger", async () => {
    const onOpenChange = mock();
    renderDialog(onOpenChange);
    await openDialog();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Delete" })));
  });

  test("the close (x) button closes it", async () => {
    renderDialog();
    await openDialog();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  test("DialogClose closes it", async () => {
    renderDialog();
    await openDialog();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  test("controlled: open renders the dialog without a trigger", () => {
    render(<Dialog title="Settings" open data-testid="settings-dialog" />);
    expect(screen.getByRole("dialog", { name: "Settings" })).toBe(screen.getByTestId("settings-dialog"));
  });

  test("sizes produce different classes", () => {
    const { unmount } = render(<Dialog title="Small" size="sm" open />);
    const small = screen.getByRole("dialog", { name: "Small" }).className;
    unmount();
    render(<Dialog title="Large" size="lg" open />);
    expect(screen.getByRole("dialog", { name: "Large" }).className).not.toBe(small);
  });
});
