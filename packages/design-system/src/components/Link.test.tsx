import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { Link } from "./Link.tsx";

/** Stands for a router link: renders an `<a>` from a `to` prop. */
const RouterLink = ({ to, ...props }: ComponentProps<"a"> & { to: string }) => (
  <a data-router="" href={to} {...props} />
);

describe("Link", () => {
  test("renders an <a> with its href and text", () => {
    render(<Link href="/sign-up">Create an account</Link>);
    const link = screen.getByRole("link", { name: "Create an account" });

    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/sign-up");
    expect(link.className).not.toBe("");
  });

  test("renders the element given in render, with the link's classes and children", () => {
    render(
      <>
        <Link render={<RouterLink to="/sign-in" />}>Sign in</Link>
        <Link href="/x">Plain</Link>
      </>,
    );
    const link = screen.getByRole("link", { name: "Sign in" });

    expect(link.hasAttribute("data-router")).toBe(true);
    expect(link.getAttribute("href")).toBe("/sign-in");
    expect(link.className).toBe(screen.getByRole("link", { name: "Plain" }).className);
  });

  test("tones produce different classes", () => {
    render(
      <>
        <Link href="/a">accent</Link>
        <Link href="/b" tone="muted">
          muted
        </Link>
      </>,
    );

    expect(screen.getByText("accent").className).not.toBe(screen.getByText("muted").className);
  });

  test("passes ARIA attributes and the test id", () => {
    render(
      <Link href="/help" aria-describedby="hint" data-testid="help">
        Help
      </Link>,
    );
    const link = screen.getByTestId("help");

    expect(link.getAttribute("aria-describedby")).toBe("hint");
  });
});
