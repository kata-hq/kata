import { describe, expect, test } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { AppShell } from "./AppShell.tsx";
import { NavItem } from "./NavItem.tsx";

describe("AppShell", () => {
  test("renders the brand, a named nav with its entries, the actions and the main content", () => {
    render(
      <AppShell
        brand={<span>Kata</span>}
        nav={<NavItem href="/" label="Today" />}
        actions={<button type="button">Sign out</button>}
        data-testid="shell"
      >
        <h1>Today</h1>
      </AppShell>,
    );

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Today" })).toBeDefined();
    expect(within(screen.getByRole("main")).getByRole("heading", { name: "Today" })).toBeDefined();
    expect(screen.getByText("Kata")).toBeDefined();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeDefined();
    expect(screen.getByTestId("shell").className).not.toBe("");
  });

  test("fullHeight changes the classes", () => {
    render(
      <>
        <AppShell data-testid="full">a</AppShell>
        <AppShell data-testid="embedded" fullHeight={false}>
          b
        </AppShell>
      </>,
    );

    expect(screen.getByTestId("full").className).not.toBe(screen.getByTestId("embedded").className);
  });

  test("names the nav with navLabel and leaves out empty regions", () => {
    const { container } = render(<AppShell navLabel="Menu">content</AppShell>);

    expect(screen.getByRole("navigation", { name: "Menu" })).toBeDefined();
    expect(screen.getByRole("main").textContent).toBe("content");
    // aside holds only the nav: no brand or actions wrapper.
    expect(container.querySelector("aside")?.children).toHaveLength(1);
  });
});
