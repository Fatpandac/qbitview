/// <reference types="vitest" />
import { render, screen } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import App from "./App";
import useUser from "./sotres/user";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("./router", () => ({
  default: {
    navigate: vi.fn(),
  },
}));

describe("App login screen", () => {
  beforeEach(() => {
    useUser.getState().setAuthorized(false);
    vi.mocked(invoke).mockImplementation(() => new Promise(() => {}));
  });

  it("renders a drag region on the login screen", () => {
    render(<App />);

    expect(screen.getByTestId("login-drag-region")).toHaveAttribute("data-tauri-drag-region");
  });
});
