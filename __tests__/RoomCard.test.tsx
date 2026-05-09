import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import RoomCard from "../src/components/RoomCard";
import { PublicKey } from "@solana/web3.js";

const mockRoom: any = {
  creator: PublicKey.default,
  entryFee: 1000000000,
  maxPlayers: 5,
  roundDuration: 300,
  isPrivate: false,
  status: "open",
  currentRound: 0,
  roundEndTime: 0,
  totalPrize: 1000000000,
  lastPrice: 0,
  winner: null,
  players: [PublicKey.default, PublicKey.default],
};

describe("RoomCard", () => {
  const roomPda = new PublicKey("8kXsQVRs6QQNZJBMNzQCzFnyNa9SLVNAs1Y4nqMctDJT");

  it("renders room data", () => {
    render(
      <RoomCard room={mockRoom} roomPda={roomPda} onJoin={jest.fn()} />
    );

    expect(screen.getByText("ABIERTA")).toBeInTheDocument();
    expect(screen.getAllByText(/1\.000.*SOL/)).toHaveLength(2);
    expect(screen.getByText("ABIERTA")).toBeInTheDocument();
    expect(screen.getByText("UNIRSE")).toBeInTheDocument();
  });

  it("calls onJoin when clicking UNIRSE", () => {
    const onJoin = jest.fn();
    render(
      <RoomCard room={mockRoom} roomPda={roomPda} onJoin={onJoin} />
    );

    fireEvent.click(screen.getByText("UNIRSE"));
    expect(onJoin).toHaveBeenCalledWith(roomPda);
  });

  it("disables button when room is not open", () => {
    const closedRoom = { ...mockRoom, status: "inProgress" };
    render(
      <RoomCard room={closedRoom} roomPda={roomPda} onJoin={jest.fn()} />
    );

    expect(screen.getByText("UNIRSE")).toBeDisabled();
  });
});
