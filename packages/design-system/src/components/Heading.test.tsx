import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Heading } from "./Heading.tsx";

describe("Heading", () => {
  test.each([1, 2, 3, 4] as const)("level %d renders an h%d heading", (level) => {
    render(<Heading level={level}>Title</Heading>);
    const heading = screen.getByRole("heading", { level, name: "Title" });
    expect(heading.tagName).toBe(`H${level}`);
  });

  test("levels produce different classes", () => {
    render(
      <>
        <Heading level={1}>one</Heading>
        <Heading level={4}>four</Heading>
      </>,
    );
    expect(screen.getByText("one").className).not.toBe(screen.getByText("four").className);
  });

  test("tone variants produce different classes", () => {
    render(
      <>
        <Heading level={2}>default</Heading>
        <Heading level={2} tone="muted">
          muted
        </Heading>
      </>,
    );
    expect(screen.getByText("default").className).not.toBe(screen.getByText("muted").className);
  });
});
