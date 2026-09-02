const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const {
  createAdministratorAuthorization,
  createFirebaseAuthentication,
} = require("../dist/middlewares/auth.js");

const decodedToken = (email) => ({ uid: "firebase-user-1", email });

const invoke = async (middleware, request) => {
  let statusCode = 200;
  let body;
  let nextCalled = false;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      body = value;
      return this;
    },
  };

  await middleware(request, response, () => {
    nextCalled = true;
  });

  return { body, nextCalled, statusCode };
};

test("missing Authorization header returns 401", async () => {
  const result = await invoke(createFirebaseAuthentication(async () => decodedToken("admin@example.com")), {
    headers: {},
  });
  assert.equal(result.statusCode, 401);
});

test("non-Bearer authorization returns 401", async () => {
  const result = await invoke(createFirebaseAuthentication(async () => decodedToken("admin@example.com")), {
    headers: { authorization: "Token abc" },
  });
  assert.equal(result.statusCode, 401);
});

test("empty Bearer token returns 401", async () => {
  const result = await invoke(createFirebaseAuthentication(async () => decodedToken("admin@example.com")), {
    headers: { authorization: "Bearer " },
  });
  assert.equal(result.statusCode, 401);
});

test("invalid Firebase token returns 401", async () => {
  const result = await invoke(createFirebaseAuthentication(async () => {
    throw new Error("invalid token");
  }), { headers: { authorization: "Bearer invalid" } });
  assert.equal(result.statusCode, 401);
});

test("expired Firebase token returns 401", async () => {
  const result = await invoke(createFirebaseAuthentication(async () => {
    const error = new Error("expired token");
    error.code = "auth/id-token-expired";
    throw error;
  }), { headers: { authorization: "Bearer expired" } });
  assert.equal(result.statusCode, 401);
});

test("approved email reaches the handler", async () => {
  const request = { headers: { authorization: "Bearer valid" } };
  const authenticated = await invoke(
    createFirebaseAuthentication(async () => decodedToken("admin@example.com")),
    request
  );
  const authorized = await invoke(
    createAdministratorAuthorization(() => "admin@example.com"),
    request
  );
  assert.equal(authenticated.nextCalled, true);
  assert.equal(authorized.nextCalled, true);
});

test("administrator email matching is case-insensitive and trims allowlist whitespace", async () => {
  const result = await invoke(
    createAdministratorAuthorization(() => " first@example.com, ADMIN@EXAMPLE.COM "),
    { headers: {}, firebaseUser: decodedToken("admin@example.com") }
  );
  assert.equal(result.nextCalled, true);
});

test("unapproved Firebase email returns 403", async () => {
  const result = await invoke(
    createAdministratorAuthorization(() => "admin@example.com"),
    { headers: {}, firebaseUser: decodedToken("other@example.com") }
  );
  assert.equal(result.statusCode, 403);
});

test("verified Firebase token without an email returns 403", async () => {
  const result = await invoke(
    createAdministratorAuthorization(() => "admin@example.com"),
    { headers: {}, firebaseUser: decodedToken(undefined) }
  );
  assert.equal(result.statusCode, 403);
});

let server;
let baseUrl;

before(async () => {
  const app = require("../dist/app.js").default;
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("public product categories endpoint works without a token", async () => {
  const response = await fetch(`${baseUrl}/api/product/categories`);
  assert.equal(response.status, 200);
});

test("representative administrator endpoint rejects a missing token", async () => {
  const response = await fetch(`${baseUrl}/api/orders`);
  assert.equal(response.status, 401);
});

test("unmounted payment callback and webhook paths are not intercepted by Firebase", async () => {
  const callback = await fetch(`${baseUrl}/api/payments/callback`, { method: "POST" });
  const webhook = await fetch(`${baseUrl}/api/webhooks/payment`, { method: "POST" });
  assert.equal(callback.status, 404);
  assert.equal(webhook.status, 404);
});
