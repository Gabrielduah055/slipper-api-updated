const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const {
  createAdministratorAuthorization,
  createFirebaseAuthentication,
} = require("../dist/middlewares/auth.js");
const {
  validateAuthenticationEnvironment,
} = require("../dist/config/firebaseAdmin.js");
const {
  legacyPasswordFilter,
  legacyPasswordUpdate,
  parseMigrationMode,
  runMigration,
} = require("../dist/migrations/removeLegacyAdminPasswords.js");

const decodedToken = (email) => ({ uid: "firebase-user-1", email });

const invoke = async (middleware, request) => {
  let statusCode = 200;
  let body;
  let nextCalled = false;
  let nextError;
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

  await middleware(request, response, (error) => {
    nextCalled = true;
    nextError = error;
  });

  return { body, nextCalled, nextError, statusCode };
};

test("middleware: missing Authorization header returns 401", async () => {
  const result = await invoke(
    createFirebaseAuthentication(async () => decodedToken("admin@example.com")),
    { headers: {} }
  );
  assert.equal(result.statusCode, 401);
});

test("middleware: empty Bearer token returns 401", async () => {
  const result = await invoke(
    createFirebaseAuthentication(async () => decodedToken("admin@example.com")),
    { headers: { authorization: "Bearer " } }
  );
  assert.equal(result.statusCode, 401);
});

test("middleware: expired Firebase token returns 401", async () => {
  const result = await invoke(
    createFirebaseAuthentication(async () => {
      const error = new Error("expired token");
      error.code = "auth/id-token-expired";
      throw error;
    }),
    { headers: { authorization: "Bearer expired" } }
  );
  assert.equal(result.statusCode, 401);
});

test("middleware: approved email reaches the next handler", async () => {
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

test("startup validation reports all and only missing authentication variables", () => {
  const names = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "ADMIN_EMAILS",
  ];
  const originalValues = Object.fromEntries(
    names.map((name) => [name, process.env[name]])
  );

  for (const name of names) {
    delete process.env[name];
  }

  try {
    assert.throws(
      () => validateAuthenticationEnvironment(),
      (error) => names.every((name) => error.message.includes(name))
    );
  } finally {
    for (const name of names) {
      const value = originalValues[name];
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
});

test("middleware does not report missing server configuration as an invalid token", async () => {
  const names = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ];
  const originalValues = Object.fromEntries(
    names.map((name) => [name, process.env[name]])
  );
  for (const name of names) {
    delete process.env[name];
  }

  try {
    const result = await invoke(createFirebaseAuthentication(), {
      headers: { authorization: "Bearer valid-looking-token" },
    });
    assert.equal(result.nextError?.name, "AuthenticationConfigurationError");
    assert.equal(result.body, undefined);
  } finally {
    for (const name of names) {
      const value = originalValues[name];
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
});

const verifyMountedToken = async (token) => {
  if (token === "approved") {
    return { uid: "approved-user", email: "admin@example.com" };
  }
  if (token === "unapproved") {
    return { uid: "unapproved-user", email: "other@example.com" };
  }
  if (token === "no-email") {
    return { uid: "no-email-user" };
  }
  throw new Error("Firebase rejected the token");
};

let server;
let baseUrl;
let originalAdminEmails;

before(async () => {
  originalAdminEmails = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = "admin@example.com";
  const { createApp } = require("../dist/app.js");
  const app = createApp({ verifyIdToken: verifyMountedToken });

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (originalAdminEmails === undefined) {
    delete process.env.ADMIN_EMAILS;
  } else {
    process.env.ADMIN_EMAILS = originalAdminEmails;
  }

  if (server) {
    await new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    );
  }
});

const request = (path, options = {}) => fetch(`${baseUrl}${path}`, options);

const jsonPost = (authorization) => ({
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(authorization ? { Authorization: authorization } : {}),
  },
  body: "{}",
});

test("mounted route: missing token returns 401", async () => {
  const response = await request("/api/orders");
  assert.equal(response.status, 401);
});

test("mounted route: malformed authorization scheme returns 401", async () => {
  const response = await request("/api/product", jsonPost("Token abc"));
  assert.equal(response.status, 401);
});

test("mounted route: rejected Firebase token returns 401", async () => {
  const response = await request("/api/product", jsonPost("Bearer invalid"));
  assert.equal(response.status, 401);
});

test("mounted route: approved Firebase administrator passes both middleware", async () => {
  const response = await request("/api/product", jsonPost("Bearer approved"));
  assert.equal(response.status, 400);
});

test("mounted route: unapproved Firebase user returns 403", async () => {
  const response = await request("/api/product", jsonPost("Bearer unapproved"));
  assert.equal(response.status, 403);
});

test("mounted route: Firebase identity without email returns 403", async () => {
  const response = await request("/api/product", jsonPost("Bearer no-email"));
  assert.equal(response.status, 403);
});

test("mounted route: administrator allowlist normalizes case and whitespace", async () => {
  process.env.ADMIN_EMAILS = " first@example.com, ADMIN@EXAMPLE.COM ";
  try {
    const response = await request("/api/product", jsonPost("Bearer approved"));
    assert.equal(response.status, 400);
  } finally {
    process.env.ADMIN_EMAILS = "admin@example.com";
  }
});

test("mounted routes: products, customers and orders reject missing authentication", async () => {
  const [product, customer, order] = await Promise.all([
    request("/api/product", jsonPost()),
    request("/api/customers"),
    request("/api/orders"),
  ]);
  assert.equal(product.status, 401);
  assert.equal(customer.status, 401);
  assert.equal(order.status, 401);
});

test("mounted routes: public product, customer and order operations do not require Firebase", async () => {
  const Customer = require("../dist/models/CustomerSchema.js").default;
  const Product = require("../dist/models/ProductSchema.js").default;
  const Order = require("../dist/models/OrderSchema.js").default;
  const originals = {
    customerFindOne: Customer.findOne,
    customerSave: Customer.prototype.save,
    productFindById: Product.findById,
    productFindByIdAndUpdate: Product.findByIdAndUpdate,
    orderSave: Order.prototype.save,
  };
  const objectId = "507f1f77bcf86cd799439011";

  try {
    Customer.findOne = async () => null;
    Customer.prototype.save = async function saveCustomer() {
      return this;
    };

    const product = await request("/api/product/categories");
    const customer = await request("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Public",
        lastName: "Customer",
        email: "customer@example.com",
        phoneNumber: "0000000000",
      }),
    });

    Customer.findOne = async () => ({
      _id: objectId,
      firstName: "Public",
      lastName: "Customer",
      email: "customer@example.com",
      phoneNumber: "0000000000",
      save: async function saveExistingCustomer() {
        return this;
      },
    });
    Product.findById = async () => ({
      productName: "Test product",
      productPrice: 25,
      productStock: 10,
    });
    Product.findByIdAndUpdate = async () => ({});
    Order.prototype.save = async function saveOrder() {
      return this;
    };

    const order = await request("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Public",
        lastName: "Customer",
        email: "customer@example.com",
        phoneNumber: "0000000000",
        items: [{ product: objectId, quantity: 1 }],
      }),
    });

    assert.equal(product.status, 200);
    assert.equal(customer.status, 201);
    assert.equal(order.status, 201);
  } finally {
    Customer.findOne = originals.customerFindOne;
    Customer.prototype.save = originals.customerSave;
    Product.findById = originals.productFindById;
    Product.findByIdAndUpdate = originals.productFindByIdAndUpdate;
    Order.prototype.save = originals.orderSave;
  }
});

test("unmounted callback and webhook paths are not intercepted by Firebase", async () => {
  const [callback, webhook] = await Promise.all([
    request("/api/payments/callback", { method: "POST" }),
    request("/api/webhooks/payment", { method: "POST" }),
  ]);
  assert.equal(callback.status, 404);
  assert.equal(webhook.status, 404);
});

test("migration targets and unsets only the legacy password field", () => {
  assert.deepEqual(legacyPasswordFilter(), { password: { $exists: true } });
  assert.deepEqual(legacyPasswordUpdate(), { $unset: { password: "" } });
});

test("migration apply mode requires the explicit confirmation argument", () => {
  assert.throws(() => parseMigrationMode(["--apply"]), /requires --confirm=/);
  assert.equal(
    parseMigrationMode([
      "--apply",
      "--confirm=REMOVE_LEGACY_ADMIN_PASSWORDS",
    ]),
    "apply"
  );
});

test("migration fails before connecting when MONGODB_URI is missing", async () => {
  const originalMongoDbUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;

  try {
    await assert.rejects(
      runMigration(["--dry-run"]),
      /Missing required environment variable: MONGODB_URI/
    );
  } finally {
    if (originalMongoDbUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalMongoDbUri;
    }
  }
});
