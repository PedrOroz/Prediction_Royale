import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import LivesIndicator from "../src/components/LivesIndicator";

describe("LivesIndicator", () => {
  it("renders 3 lives by default", () => {
    const { container } = render(<LivesIndicator lives={3} />);
    const spheres = container.querySelectorAll(".rounded-full");
    expect(spheres).toHaveLength(3);
    expect(screen.getByText("3/3 VIDAS")).toBeInTheDocument();
  });

  it("renders 0 lives", () => {
    const { container } = render(<LivesIndicator lives={0} />);
    const spheres = container.querySelectorAll(".rounded-full");
    expect(spheres).toHaveLength(3);
    expect(screen.getByText("0/3 VIDAS")).toBeInTheDocument();
  });

  it("applies active class to living spheres and inactive to lost", () => {
    const { container } = render(<LivesIndicator lives={1} />);
    const spheres = container.querySelectorAll(".rounded-full");

    const liveSphere = spheres[0];
    expect(liveSphere.classList.contains("bg-canary-yellow-500")).toBe(true);

    const deadSphere = spheres[1];
    expect(deadSphere.classList.contains("bg-iron-grey-600")).toBe(true);
  });
});
