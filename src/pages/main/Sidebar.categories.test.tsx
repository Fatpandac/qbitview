/// <reference types="vitest" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar";

describe("Sidebar categories", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the category section including 未分类", () => {
    render(
      <Sidebar
        version="v1"
        filter="all"
        counts={{
          all: 5,
          downloading: 0,
          completed: 0,
          paused: 0,
          active: 0,
          inactive: 0,
          stalled: 0,
          errored: 0,
        }}
        categories={[
          { label: "Movies", count: 2 },
          { label: "未分类", count: 3 },
        ]}
        activeCategory={null}
        onFilterChange={() => {}}
        onCategoryChange={() => {}}
        onOpenSettings={() => {}}
      />,
    );

    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Movies" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "未分类" })).toBeInTheDocument();
  });

  it("can collapse and expand the category section", async () => {
    const user = userEvent.setup();

    render(
      <Sidebar
        version="v1"
        filter="all"
        counts={{
          all: 2,
          downloading: 0,
          completed: 0,
          paused: 0,
          active: 0,
          inactive: 0,
          stalled: 0,
          errored: 0,
        }}
        categories={[
          { label: "Movies", count: 1 },
          { label: "未分类", count: 1 },
        ]}
        activeCategory={null}
        onFilterChange={() => {}}
        onCategoryChange={() => {}}
        onOpenSettings={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Collapse categories" }));
    expect(screen.queryByRole("button", { name: "Movies" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand categories" }));
    expect(screen.getByRole("button", { name: "Movies" })).toBeInTheDocument();

  });
});
