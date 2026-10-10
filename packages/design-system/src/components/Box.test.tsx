import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Box } from "./Box.tsx";

describe("Box", () => {
  test("renders its children in a div by default", () => {
    render(<Box data-testid="box">content</Box>);
    const box = screen.getByTestId("box");
    expect(box.tagName).toBe("DIV");
    expect(box.textContent).toBe("content");
  });

  test("renders as the requested element", () => {
    render(<Box as="section" aria-label="Region" />);
    expect(screen.getByRole("region", { name: "Region" }).tagName).toBe("SECTION");
  });

  test("padding variants produce different classes", () => {
    render(
      <>
        <Box data-testid="sm" padding="sm" />
        <Box data-testid="xl" padding="xl" />
      </>,
    );
    expect(screen.getByTestId("sm").className).not.toBe(screen.getByTestId("xl").className);
  });

  test("background, radius and border add classes", () => {
    render(
      <>
        <Box data-testid="plain" />
        <Box data-testid="styled" background="bgSubtle" radius="md" border />
      </>,
    );
    const plain = screen.getByTestId("plain").classList.length;
    expect(screen.getByTestId("styled").classList.length).toBeGreaterThan(plain);
  });
});
