import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Text } from "./Text.tsx";

describe("Text", () => {
  test("renders a span by default", () => {
    render(<Text>hello</Text>);
    expect(screen.getByText("hello").tagName).toBe("SPAN");
  });

  test("renders as the requested element", () => {
    render(<Text as="p">paragraph</Text>);
    expect(screen.getByText("paragraph").tagName).toBe("P");
  });

  test("size variants produce different classes", () => {
    render(
      <>
        <Text size="sm">small</Text>
        <Text size="xl">large</Text>
      </>,
    );
    expect(screen.getByText("small").className).not.toBe(screen.getByText("large").className);
  });

  test("weight variants produce different classes", () => {
    render(
      <>
        <Text weight="regular">regular</Text>
        <Text weight="bold">bold</Text>
      </>,
    );
    expect(screen.getByText("regular").className).not.toBe(screen.getByText("bold").className);
  });

  test("tone variants produce different classes", () => {
    render(
      <>
        <Text tone="default">default</Text>
        <Text tone="danger">danger</Text>
      </>,
    );
    expect(screen.getByText("default").className).not.toBe(screen.getByText("danger").className);
  });
});
