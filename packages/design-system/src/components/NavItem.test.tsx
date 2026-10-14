import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { NavItem } from "./NavItem.tsx";

/** Stands for React Router's NavLink: sets aria-current="page" when active. */
const FakeNavLink = ({ to, active, ...props }: ComponentProps<"a"> & { to: string; active: boolean }) => (
  <a href={to} aria-current={active ? "page" : undefined} {...props} />
);

describe("NavItem", () => {
  test("renders an <a> with its label as accessible name", () => {
    render(<NavItem href="/" label="Today" icon="home" />);
    const item = screen.getByRole("link", { name: "Today" });

    expect(item.tagName).toBe("A");
    expect(item.getAttribute("href")).toBe("/");
    expect(item.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  test("without an icon it renders only the label", () => {
    render(<NavItem href="/week" label="Week" />);

    expect(screen.getByRole("link", { name: "Week" }).querySelector("svg")).toBeNull();
  });

  test("renders the element given in render and keeps its aria-current", () => {
    render(
      <nav>
        <NavItem label="Today" render={<FakeNavLink to="/" active />} />
        <NavItem label="Status" render={<FakeNavLink to="/status" active={false} />} />
      </nav>,
    );
    const today = screen.getByRole("link", { name: "Today" });
    const status = screen.getByRole("link", { name: "Status" });

    expect(today.getAttribute("aria-current")).toBe("page");
    expect(status.hasAttribute("aria-current")).toBe(false);
    expect(status.getAttribute("href")).toBe("/status");
    // Same classes: the active look comes from the aria-current attribute selector.
    expect(today.className).toBe(status.className);
    expect(today.className).not.toBe("");
  });

  test("passes the test id", () => {
    render(<NavItem href="/" label="Today" data-testid="nav-today" />);

    expect(screen.getByTestId("nav-today").textContent).toBe("Today");
  });
});
