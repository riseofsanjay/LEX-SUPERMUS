import assert from "node:assert/strict";
import test from "node:test";
import {
  getProfessionalAuthProfile,
  patchProfessionalAuthProfile,
  postProfessionalAuth,
} from "../src/lib/professional-auth.mjs";

test("registration and login send JSON to the matching authentication endpoint", async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({
      success: true,
      data: {
        id: "account-1",
        role: "STUDENT",
        verificationStatus: "NOT_REQUIRED",
        token: "jwt",
      },
    }), { status: 201 });
  };
  const payload = { email: "student@example.test", password: "passphrase" };

  await postProfessionalAuth({
    baseUrl: "http://localhost:8081/",
    action: "register",
    payload,
    fetcher,
  });
  await postProfessionalAuth({
    baseUrl: "http://localhost:8081",
    action: "login",
    payload,
    fetcher,
  });

  assert.equal(calls[0].url, "http://localhost:8081/api/auth/register");
  assert.deepEqual(JSON.parse(calls[0].options.body), payload);
  assert.equal(calls[1].url, "http://localhost:8081/api/auth/login");
});

test("authentication errors are surfaced to the caller", async () => {
  await assert.rejects(
    postProfessionalAuth({
      baseUrl: "http://localhost:8081",
      action: "login",
      payload: { email: "student@example.test", password: "wrong" },
      fetcher: async () => new Response(JSON.stringify({
        success: false,
        message: "Invalid email, password, or account type.",
      }), { status: 401 }),
    }),
    /Invalid email, password, or account type/,
  );
});

test("unreachable authentication service reports an actionable error", async () => {
  await assert.rejects(
    postProfessionalAuth({
      baseUrl: "http://localhost:8081",
      action: "register",
      payload: { email: "student@example.test", password: "passphrase" },
      fetcher: async () => {
        throw new TypeError("Failed to fetch");
      },
    }),
    /Unable to reach the professional account service at http:\/\/localhost:8081/,
  );
});

test("current profile and profile updates include the bearer token", async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({
      success: true,
      data: {
        id: "account-1",
        role: "STUDENT",
        verificationStatus: "NOT_REQUIRED",
        token: "jwt",
      },
    }), { status: 200 });
  };

  await getProfessionalAuthProfile({
    baseUrl: "http://localhost:8081",
    token: "jwt",
    fetcher,
  });
  await patchProfessionalAuthProfile({
    baseUrl: "http://localhost:8081",
    token: "jwt",
    updates: { schoolName: "Example School" },
    fetcher,
  });

  assert.equal(calls[0].options.headers.Authorization, "Bearer jwt");
  assert.equal(calls[1].options.method, "PATCH");
  assert.equal(calls[1].options.headers.Authorization, "Bearer jwt");
  assert.deepEqual(JSON.parse(calls[1].options.body), { schoolName: "Example School" });
});
