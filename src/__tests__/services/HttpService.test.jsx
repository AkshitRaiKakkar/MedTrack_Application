import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";

const server = setupServer(
  http.get(`${BASE_URL}/api/test`, () => HttpResponse.json({ ok: true })),
);

const mockAlert = vi.fn();

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal("alert", mockAlert);
  vi.stubGlobal("location", { href: "" });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function getInterceptorBehavior() {
  const HttpService = (await import("../../services/HttpService")).default;
  return HttpService;
}

it("attaches JWT Bearer token from sessionStorage", async () => {
  sessionStorage.setItem("medtrack_user", JSON.stringify({
    id: "u1", token: "my-jwt-token",
  }));

  const API = await getInterceptorBehavior();

  let capturedHeaders;
  server.use(
    http.get(`${BASE_URL}/api/test`, ({ request }) => {
      capturedHeaders = request.headers;
      return HttpResponse.json({ ok: true });
    }),
  );

  await API.get("/api/test");
  expect(capturedHeaders.get("Authorization")).toBe("Bearer my-jwt-token");
});

it("handles 401 by clearing sessionStorage and redirecting", async () => {
  sessionStorage.setItem("medtrack_user", JSON.stringify({ id: "u1", token: "tok" }));

  const API = await getInterceptorBehavior();

  server.use(
    http.get(`${BASE_URL}/api/test`, () => HttpResponse.json(null, { status: 401 })),
  );

  await expect(API.get("/api/test")).rejects.toThrow();

  expect(sessionStorage.getItem("medtrack_user")).toBeNull();
  expect(mockAlert).toHaveBeenCalledWith("Session expired. Please login again.");
  expect(window.location.href).toBe("/login");
});

it("handles 403 without redirect", async () => {
  sessionStorage.setItem("medtrack_user", JSON.stringify({ id: "u1", token: "tok" }));

  const API = await getInterceptorBehavior();

  server.use(
    http.get(`${BASE_URL}/api/test`, () => HttpResponse.json(null, { status: 403 })),
  );

  await expect(API.get("/api/test")).rejects.toThrow();

  expect(sessionStorage.getItem("medtrack_user")).not.toBeNull();
  expect(mockAlert).toHaveBeenCalledWith(
    "Access denied: You are not authorised to perform this action.",
  );
  expect(window.location.href).not.toBe("/login");
});

it("does not attach token when no user in sessionStorage", async () => {
  const API = await getInterceptorBehavior();

  let capturedHeaders;
  server.use(
    http.get(`${BASE_URL}/api/test`, ({ request }) => {
      capturedHeaders = request.headers;
      return HttpResponse.json({ ok: true });
    }),
  );

  await API.get("/api/test");
  expect(capturedHeaders.get("Authorization")).toBeNull();
});
