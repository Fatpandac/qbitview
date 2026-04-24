/// <reference types="vitest" />
import { render, screen } from "@testing-library/react";
import { initLanguage } from "@/lib/language";
import { Toolbar } from "./Toolbar";

describe("Toolbar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders actions and counts in the selected language", () => {
    localStorage.setItem("app-language", "zh-CN");
    initLanguage();

    render(
      <Toolbar
        totalCount={3}
        selectedCount={2}
        onAdd={() => {}}
        onPause={() => {}}
        onResume={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "添加" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "继续" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
    expect(screen.getByText("3 个种子 · 已选择 2 个")).toBeInTheDocument();
  });
});
