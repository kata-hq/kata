import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Icon, iconNames } from "./Icon.tsx";

describe("Icon", () => {
  test.each(iconNames)("renders the %s icon as an svg with paths", (name) => {
    render(<Icon name={name} data-testid="icon" />);
    const svg = screen.getByTestId("icon");
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  test("without a label it is decorative and hidden from assistive tech", () => {
    render(<Icon name="check" data-testid="icon" />);
    const svg = screen.getByTestId("icon");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("role")).toBeNull();
  });

  test("with a label it is an image with that accessible name", () => {
    render(<Icon name="alert" label="Warning" />);
    const img = screen.getByRole("img", { name: "Warning" });
    expect(img.getAttribute("aria-hidden")).toBeNull();
  });

  test("size variants produce different classes", () => {
    render(
      <>
        <Icon name="x" size="sm" label="small" />
        <Icon name="x" size="lg" label="large" />
      </>,
    );
    const small = screen.getByRole("img", { name: "small" }).getAttribute("class");
    expect(small).not.toBe(screen.getByRole("img", { name: "large" }).getAttribute("class"));
  });

  test("tone adds a class", () => {
    render(
      <>
        <Icon name="info" label="plain" />
        <Icon name="info" label="toned" tone="accent" />
      </>,
    );
    const plain = screen.getByRole("img", { name: "plain" }).getAttribute("class");
    expect(plain).not.toBe(screen.getByRole("img", { name: "toned" }).getAttribute("class"));
  });
});
