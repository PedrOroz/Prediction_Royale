import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import PredictionButtons from "../src/components/PredictionButtons";

describe("PredictionButtons", () => {
  it("renders both buttons", () => {
    render(
      <PredictionButtons
        onPredict={jest.fn()}
        disabled={false}
        selected={null}
        confirming={false}
      />
    );

    expect(screen.getByText("▲ SUBE")).toBeInTheDocument();
    expect(screen.getByText("▼ BAJA")).toBeInTheDocument();
  });

  it("calls onPredict with up when SUBE clicked", () => {
    const onPredict = jest.fn();
    render(
      <PredictionButtons
        onPredict={onPredict}
        disabled={false}
        selected={null}
        confirming={false}
      />
    );

    fireEvent.click(screen.getByText("▲ SUBE"));
    expect(onPredict).toHaveBeenCalledWith({ up: {} });
  });

  it("calls onPredict with down when BAJA clicked", () => {
    const onPredict = jest.fn();
    render(
      <PredictionButtons
        onPredict={onPredict}
        disabled={false}
        selected={null}
        confirming={false}
      />
    );

    fireEvent.click(screen.getByText("▼ BAJA"));
    expect(onPredict).toHaveBeenCalledWith({ down: {} });
  });

  it("disables buttons when disabled prop is true", () => {
    render(
      <PredictionButtons
        onPredict={jest.fn()}
        disabled={true}
        selected={null}
        confirming={false}
      />
    );

    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
