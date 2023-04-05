import serverPromise from "../test-server";
import { TestClient, clearDatabase } from "../test-helpers";
import { v4 as uuid } from "uuid";

// includes auth file tests

let server;
let store;
let postMockStore;
let mockUser;
let mockAdminUser;
let mockNonAdminUser;

// jest.setTimeout(70000)

beforeAll(async () => {
  server = await serverPromise;
  postMockStore = {
    url: "s3://abc123:abc123@us-west-2/my-bucket",
    publicUrl: "https://my-bucket.s3.amazonaws.com",
  };

  store = {
    id: "mock-store",
    kind: "object-store",
    url: "s3://abc123:abc123@us-west-1/my-bucket",
    publicUrl: "https://my-bucket.s3.amazonaws.com",
  };

  mockUser = {
    email: `mock_user@gmail.com`,
    password: "z".repeat(64),
  };

  mockAdminUser = {
    email: "user_admin@gmail.com",
    password: "x".repeat(64),
  };

  mockNonAdminUser = {
    email: "user_non_admin@gmail.com",
    password: "y".repeat(64),
  };
});

afterEach(async () => {
  await clearDatabase(server);
});

describe("controllers/object-stores", () => {
  describe("basic CRUD with JWT authorization", () => {
    let client;
    let nonAdminToken;
    let nonAdminUser;
    let adminUser;

    beforeEach(async () => {
      client = new TestClient({
        server,
      });
      // setting up admin user and token
      const userRes = await client.post(`/user/`, { ...mockAdminUser });
      adminUser = await userRes.json();

      let tokenRes = await client.post(`/user/token`, { ...mockAdminUser });
      const adminToken = await tokenRes.json();
      client.jwtAuth = `${adminToken["token"]}`;

      const user = await server.store.get(`user/${adminUser.id}`, false);
      adminUser = { ...user, admin: true, emailValid: true };
      await server.store.replace(adminUser);

      // setting up non-admin user
      const nonAdminRes = await client.post(`/user/`, { ...mockNonAdminUser });
      nonAdminUser = await nonAdminRes.json();
      tokenRes = await client.post(`/user/token`, { ...mockNonAdminUser });
      nonAdminToken = await tokenRes.json();

      const nonAdminUserRes = await server.store.get(
        `user/${nonAdminUser.id}`,
        false
      );
      nonAdminUser = { ...nonAdminUserRes, emailValid: true };
      await server.store.replace(nonAdminUser);
    });

    it("should not get all object stores without admin authorization", async () => {
      client.jwtAuth = "";
      for (let i = 0; i < 10; i += 1) {
        const storeChangeId = JSON.parse(JSON.stringify(store));
        storeChangeId.id = uuid();
        await server.store.create(storeChangeId);
        const res = await client.get(`/object-store/${store.id}`);
        expect(res.status).toBe(401);
      }
      const res = await client.get(`/object-store?userId=${store.userId}`);
      expect(res.status).toBe(401);
    });

    it("should throw 401 error if JWT is not verified", async () => {
      client.jwtAuth = "random_value";
      const storeChangeId = JSON.parse(JSON.stringify(store));
      storeChangeId.id = uuid();
      await server.store.create(storeChangeId);

      let res = await client.get(`/object-store/${store.id}`);
      const objStore = await res.json();
      expect(res.status).toBe(401);
      expect(objStore.errors[0]).toBe("jwt malformed");
    });

    it("should get all object stores with admin authorization", async () => {
      for (let i = 0; i < 4; i += 1) {
        const storeChangeId = JSON.parse(JSON.stringify(store));
        storeChangeId.userId = uuid();
        storeChangeId.id = uuid();
        await server.store.create(storeChangeId);
        const res = await client.get(`/object-store/${storeChangeId.id}`);
        expect(res.status).toBe(200);
        const objStore = await res.json();
        expect(objStore.id).toEqual(storeChangeId.id);
        // admins should be able to access the URL
        expect(objStore.url).toEqual(store.url);
      }

      const res = await client.get(`/object-store`);
      expect(res.status).toBe(200);
      const objStores = await res.json();
      expect(objStores.length).toEqual(4);
    });

    it("should get some of the object stores & get a working next Link", async () => {
      store.userId = adminUser.id;
      for (let i = 0; i < 13; i += 1) {
        const storeChangeId = JSON.parse(JSON.stringify(store));
        storeChangeId.id = uuid();
        await server.store.create(storeChangeId);
        const res = await client.get(`/object-store/${storeChangeId.id}`);
        expect(res.status).toBe(200);
        const objStore = await res.json();
        expect(objStore.id).toEqual(storeChangeId.id);
      }

      const res = await client.get(
        `/object-store?userId=${store.userId}&limit=11`
      );
      const objStores = await res.json();
      expect(res.headers.raw().link).toBeDefined();
      expect(res.headers.raw().link.length).toBe(1);
      expect(objStores.length).toEqual(11);
    });

    it("should create an object store", async () => {
      client.jwtAuth = `${nonAdminToken["token"]}`;
      const mockStore = { ...postMockStore, name: "test name" };
      const now = Date.now();
      let res = await client.post("/object-store", { ...mockStore });
      expect(res.status).toBe(201);
      const objStore = await res.json();
      expect(objStore.id).toBeDefined();
      expect(objStore.url).toEqual(undefined);
      expect(objStore.name).toEqual("test name");
      expect(objStore.createdAt).toBeGreaterThanOrEqual(now);

      const resp = await client.get(`/object-store/${objStore.id}`);
      expect(resp.status).toBe(200);
      const objStoreGet = await resp.json();
      expect(objStoreGet.url).toEqual(undefined);
      expect(objStoreGet.publicUrl).toEqual(mockStore.publicUrl);
      expect(objStoreGet.userId).toBe(objStore.userId);

      // if same request is made, should return a 201
      res = await client.post("/object-store", { ...mockStore });
      expect(res.status).toBe(201);
    });

    it("should return a 404 if objectStore not found", async () => {
      const id = uuid();
      const resp = await client.get(`/object-store/${id}`);
      expect(resp.status).toBe(404);
    });

    it("should not accept an empty body for creating an object store", async () => {
      const res = await client.post("/object-store");
      expect(res.status).toBe(422);
    });

    it("should not accept missing property for creating an object store", async () => {
      const postMockStoreMissingProp = JSON.parse(
        JSON.stringify(postMockStore)
      );
      delete postMockStoreMissingProp["url"];
      const res = await client.post("/object-store", {
        ...postMockStoreMissingProp,
      });
      expect(res.status).toBe(422);
      expect(res.statusText).toBe("Unprocessable Entity");
    });

    it("should not accept additional properties for creating an object store", async () => {
      const postMockStoreExtraField = JSON.parse(JSON.stringify(postMockStore));
      postMockStoreExtraField.extraField = "extra field";
      const res = await client.post("/object-store", {
        ...postMockStoreExtraField,
      });
      expect(res.status).toBe(422);
      expect(res.statusText).toBe("Unprocessable Entity");
    });

    it("should not accept wrong type of field for creating an object store", async () => {
      const postMockStoreWrongType = JSON.parse(JSON.stringify(postMockStore));
      postMockStoreWrongType.url = 123;
      const res = await client.post("/object-store", {
        ...postMockStoreWrongType,
      });
      expect(res.status).toBe(422);
      expect(res.statusText).toBe("Unprocessable Entity");
    });

    it("should not get another users object store with non-admin user", async () => {
      client.jwtAuth = nonAdminToken["token"];

      const storeChangeId = JSON.parse(JSON.stringify(store));
      storeChangeId.userId = adminUser.id;
      storeChangeId.id = uuid();
      await server.store.create(storeChangeId);

      let res = await client.get(`/object-store/${storeChangeId.id}`);
      expect(res.status).toBe(403);

      res = await client.get(`/object-store?userId=${adminUser.id}`);
      expect(res.status).toBe(200);
      const objStore = await res.json();
      expect(objStore.length).toEqual(0);
    });
  });

  describe("object stores endpoint with api key", () => {
    let client;
    let adminUser;
    let nonAdminUser;
    const adminApiKey = uuid();
    const nonAdminApiKey = uuid();

    beforeEach(async () => {
      client = new TestClient({
        server,
      });

      const userRes = await client.post(`/user/`, { ...mockAdminUser });
      adminUser = await userRes.json();

      const nonAdminRes = await client.post(`/user/`, { ...mockNonAdminUser });
      nonAdminUser = await nonAdminRes.json();

      await server.store.create({
        id: adminApiKey,
        kind: "api-token",
        userId: adminUser.id,
      });

      await server.store.create({
        id: nonAdminApiKey,
        kind: "api-token",
        userId: nonAdminUser.id,
      });

      const user = await server.store.get(`user/${adminUser.id}`, false);
      adminUser = { ...user, admin: true, emailValid: true };
      await server.store.replace(adminUser);

      const nonAdminUserRes = await server.store.get(
        `user/${nonAdminUser.id}`,
        false
      );
      nonAdminUser = { ...nonAdminUserRes, emailValid: true };
      await server.store.replace(nonAdminUser);
    });

    it("should not get all object stores with nonadmin token", async () => {
      await server.store.create({
        ...store,
        id: uuid(),
        userId: adminUser.id,
      });
      client.apiKey = nonAdminApiKey;
      let res = await client.get(`/object-store`);
      expect(res.status).toBe(200);
      const objStore = await res.json();
      expect(objStore.length).toEqual(0);
    });

    it("should get all object stores for another user with admin token and apiKey", async () => {
      await server.store.create({
        ...store,
        id: uuid(),
        userId: nonAdminUser.id,
      });
      client.apiKey = adminApiKey;
      const res = await client.get(`/object-store`);
      expect(res.status).toBe(200);
      const objStore = await res.json();
      expect(objStore.length).toEqual(1);
    });

    it("should throw forbidden error when using random api Key", async () => {
      client.apiKey = "random_key";
      const res = await client.get(`/object-store?userId=${nonAdminUser.id}`);
      const objStore = await res.json();
      expect(res.status).toBe(401);
    });

    it("should return 401 if user does not exist", async () => {
      // create token with no user
      const tokenId = uuid();
      await server.store.create({
        id: tokenId,
        kind: "api-token",
        userId: uuid(),
      });
      client.apiKey = tokenId;

      const res = await client.get(`/object-store/${adminUser.id}`);
      const objStore = await res.json();
      expect(res.status).toBe(401);
      expect(objStore.errors[0]).toBe(
        `no user found from authorization header: Bearer ${tokenId}`
      );
    });
  });
});
