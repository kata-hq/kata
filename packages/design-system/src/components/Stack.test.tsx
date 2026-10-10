import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Stack } from "./Stack.tsx";

describe("Stack", () => {
  test("renders its children", () => {
    render(
      <Stack data-testid="stack">
        <span>one</span>
        <span>two</span>
      </Stack>,
    );
    expect(screen.getByTestId("stack").children).toHaveLength(2);
  });

  test("renders a list with the list role", () => {
    render(
      <Stack as="ul">
        <li>item</li>
      </Stack>,
    );
    expect(screen.getByRole("list").tagName).toBe("UL");
  });

  test("direction variants produce different classes", () => {
    render(
      <>
        <Stack data-testid="row" direction="row" />
        <Stack data-testid="column" direction="column" />
      </>,
    );
    expect(screen.getByTestId("row").className).not.toBe(screen.getByTestId("column").className);
  });

  test("gap variants produce different classes", () => {
    render(
      <>
        <Stack data-testid="sm" gap="sm" />
        <Stack data-testid="lg" gap="lg" />
      </>,
    );
    expect(screen.getByTestId("sm").className).not.toBe(screen.getByTestId("lg").className);
  });

  test("align, justify and wrap add classes", () => {
    render(
      <>
        <Stack data-testid="plain" />
        <Stack data-testid="aligned" align="center" justify="between" wrap />
      </>,
    );
    const plain = screen.getByTestId("plain").classList.length;
    expect(screen.getByTestId("aligned").classList.length).toBeGreaterThan(plain);
  });
});
