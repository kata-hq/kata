import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Card } from "./Card.tsx";

describe("Card", () => {
  test("renders its children", () => {
    render(<Card>content</Card>);
    expect(screen.getByText("content").tagName).toBe("DIV");
  });

  test("renders as an article with an accessible name", () => {
    render(<Card as="article" aria-labelledby="t" />);
    expect(screen.getByRole("article").getAttribute("aria-labelledby")).toBe("t");
  });

  test("variants produce different classes", () => {
    render(
      <>
        <Card variant="outlined">outlined</Card>
        <Card variant="elevated">elevated</Card>
      </>,
    );
    expect(screen.getByText("outlined").className).not.toBe(screen.getByText("elevated").className);
  });

  test("padding variants produce different classes", () => {
    render(
      <>
        <Card padding="sm">sm</Card>
        <Card padding="xl">xl</Card>
      </>,
    );
    expect(screen.getByText("sm").className).not.toBe(screen.getByText("xl").className);
  });
});
