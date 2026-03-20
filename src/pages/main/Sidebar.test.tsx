/// <reference types="vitest" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("collapses into icon and count only mode and persists the preference", async () => {
    const user = userEvent.setup();

    render(
      <Sidebar
        version="v1"
        filter="all"
        counts={{
          all: 12,
          downloading: 3,
          completed: 4,
          paused: 1,
          active: 5,
          inactive: 2,
          stalled: 0,
          errored: 0,
        }}
        categories={[]}
        activeCategory={null}
        onFilterChange={() => {}}
        onCategoryChange={() => {}}
        onOpenSettings={() => {}}
      />,
    );

    expect(screen.getByText("Downloading")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(screen.queryByText("Downloading")).not.toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(localStorage.getItem("sidebar-collapsed")).toBe("true");
  });

  it("restores the collapsed state from localStorage", () => {
    localStorage.setItem("sidebar-collapsed", "true");

    render(
      <Sidebar
        version="v1"
        filter="all"
        counts={{
          all: 0,
          downloading: 0,
          completed: 0,
          paused: 0,
          active: 0,
          inactive: 0,
          stalled: 0,
          errored: 0,
        }}
        categories={[]}
        activeCategory={null}
        onFilterChange={() => {}}
        onCategoryChange={() => {}}
        onOpenSettings={() => {}}
      />,
    );

    expect(screen.queryByText("Downloading")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
  });

  it("renders a settings action in the sidebar", async () => {
    const user = userEvent.setup();
    const openSettings = vi.fn();

    render(
      <Sidebar
        version="v1"
        filter="all"
        counts={{
          all: 0,
          downloading: 0,
          completed: 0,
          paused: 0,
          active: 0,
          inactive: 0,
          stalled: 0,
          errored: 0,
        }}
        categories={[]}
        activeCategory={null}
        onFilterChange={() => {}}
        onCategoryChange={() => {}}
        onOpenSettings={openSettings}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open settings" }));

    expect(openSettings).toHaveBeenCalledOnce();
  });
});
