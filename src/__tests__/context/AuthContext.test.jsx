import { render, screen, act } from "@testing-library/react";
import { useEffect, useContext } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, AuthContext } from "../../context/AuthContext";

function TestConsumer({ onMount }) {
  const ctx = useContext(AuthContext);
  useEffect(() => { onMount?.(ctx); }, [ctx, onMount]);
  return null;
}

function renderWithProvider(onMount) {
  return render(
    <AuthProvider>
      <TestConsumer onMount={onMount} />
    </AuthProvider>
  );
}

beforeEach(() => {
  sessionStorage.clear();
});

it("login stores user in state and sessionStorage", async () => {
  let ctx;
  renderWithProvider((c) => { ctx = c; });

  const userData = { id: "u1", name: "Test", role: "hospital", token: "tok" };
  await act(async () => { ctx.login(userData); });

  expect(ctx.user).toEqual(userData);
  expect(JSON.parse(sessionStorage.getItem("medtrack_user"))).toEqual(userData);
});

it("logout clears user from state and sessionStorage", async () => {
  sessionStorage.setItem("medtrack_user", JSON.stringify({ id: "u1", name: "Test", token: "tok" }));

  let ctx;
  renderWithProvider((c) => { ctx = c; });

  await act(async () => { ctx.logout(); });

  expect(ctx.user).toBeNull();
  expect(sessionStorage.getItem("medtrack_user")).toBeNull();
});

it("logout clears authority state from sessionStorage", async () => {
  sessionStorage.setItem("medtrack_authority", JSON.stringify({ authorityVersion: 5, permissions: ["admin"] }));

  let ctx;
  renderWithProvider((c) => { ctx = c; });

  await act(async () => { ctx.logout(); });

  expect(ctx.authorityState).toEqual({ authorityVersion: 1, permissions: [] });
  expect(sessionStorage.getItem("medtrack_authority")).toBeNull();
});

it("hasPermission returns true when permissionName is empty", async () => {
  let ctx;
  renderWithProvider((c) => { ctx = c; });

  expect(ctx.hasPermission("")).toBe(true);
  expect(ctx.hasPermission(null)).toBe(true);
  expect(ctx.hasPermission(undefined)).toBe(true);
});

it("hasPermission checks permissions array", async () => {
  let ctx;
  renderWithProvider((c) => { ctx = c; });

  expect(ctx.hasPermission("manage_equipment")).toBe(false);

  await act(async () => {
    ctx.login({ id: "u1", name: "Test", token: "tok" });
  });

  expect(ctx.user.id).toBe("u1");
});

it("refreshAuthority resolves when no user", async () => {
  let ctx;
  renderWithProvider((c) => { ctx = c; });

  const result = await ctx.refreshAuthority();
  expect(result).toBeUndefined();
});

it("logs out user and restores initial authority state", async () => {
  let ctx;
  renderWithProvider((c) => { ctx = c; });

  await act(async () => {
    ctx.login({ id: "u1", name: "Test", role: "hospital", token: "tok" });
  });
  expect(ctx.user).not.toBeNull();

  await act(async () => { ctx.logout(); });

  expect(ctx.user).toBeNull();
  expect(ctx.authorityState).toEqual({ authorityVersion: 1, permissions: [] });
});
