import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import RoundCountdown from "../src/components/RoundCountdown";

describe("RoundCountdown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("displays remaining time in MM:SS format", () => {
    const future = Math.floor(Date.now() / 1000) + 187;
    render(<RoundCountdown endTime={future} onRoundEnd={jest.fn()} />);

    expect(screen.getByText("03:07")).toBeInTheDocument();
  });

  it("calls onRoundEnd when time reaches zero", () => {
    const onRoundEnd = jest.fn();
    const now = Math.floor(Date.now() / 1000);

    render(<RoundCountdown endTime={now} onRoundEnd={onRoundEnd} />);

    expect(onRoundEnd).toHaveBeenCalled();
  });
});
