import serverPromise from "../test-server";
import { TestClient, clearDatabase } from "../test-helpers";
import { v4 as uuid } from "uuid";

let server;
let mockUser;
let mockAdminUser;
let mockNonAdminUser;

jest.setTimeout(70000);

beforeAll(async () => {
  server = await serverPromise;
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

describe("controllers/api-token", () => {
  describe("basic CRUD with JWT authorization", () => {
    let client;
    let adminUser;
    let nonAdminToken;
    let nonAdminUser;

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

    // it('should get all tokens with admin authorization', async () => {
    //   for (let i = 0; i < 4; i += 1) {
    //     const u = {
    //       userId: adminUser.id,
    //       id: uuid(),
    //       kind: 'api-token',
    //     }
    //     await server.store.create(u)
    //     const res = await client.get(`/api-token/${u.id}`)
    //     expect(res.status).toBe(200)
    //     const apiTokenRes = await res.json()
    //     expect(apiTokenRes.userId).toEqual(adminUser.id)
    //     expect(apiTokenRes.id).toEqual(u.id)
    //   }

    //   const res = await client.get('/api-token')
    //   expect(res.status).toBe(200)
    //   const apiTokens = await res.json()
    //   expect(apiTokens.length).toEqual(4)
    // })

    // it('should get some of the users & get a working next Link', async () => {
    //   for (let i = 0; i < 13; i += 1) {
    //     const u = {
    //       userId: adminUser.id,
    //       id: uuid(),
    //       kind: 'api-token',
    //     }
    //     await server.store.create(u)
    //     const res = await client.get(`/api-token/${u.id}`)
    //     expect(res.status).toBe(200)
    //     const apiTokenRes = await res.json()
    //     expect(apiTokenRes.userId).toEqual(adminUser.id)
    //     expect(apiTokenRes.id).toEqual(u.id)
    //   }
    //   const res = await client.get(`/api-token?limit=11`)
    //   const apiTokens = await res.json()
    //   expect(res.headers._headers.link).toBeDefined()
    //   expect(res.headers._headers.link.length).toBe(1)
    //   expect(apiTokens.length).toEqual(11)
    // })

    it("should accept empty body for creating an apiToken", async () => {
      const res = await client.post("/api-token");
      expect(res.status).toBe(201);
    });

    it("should not accept additional properties for creating an apiToken", async () => {
      const res = await client.post("/api-token", { livepeer: "livepeer" });
      expect(res.status).toBe(422);
      const apiToken = await res.json();
      expect(apiToken.id).toBeUndefined();
    });

    describe("access rules", () => {
      const testError = async (expectErr, rules) => {
        const res = await client.post("/api-token", { access: { rules } });
        expect(res.status).toBe(422);
        const body = await res.json();
        expect(body.errors[0]).toContain(expectErr);
      };

      it("should not accept invalid access rules", async () => {
        await testError(`"type"`, {});
        await testError(`"required"`, [{}]);
        await testError(`"minItems"`, [{ resources: [] }]);
        await testError(`"minItems"`, [{ resources: ["*"], methods: [] }]);
        await testError(`"enum"`, [
          { resources: ["*"], methods: ["not a method"] },
        ]);
        await testError(`"enum"`, [{ resources: ["*"], methods: ["GET"] }]); // methods are lowercase
        await testError(`Bad route /*path`, [
          { resources: ["this/is/fine", "/*path"] },
        ]);
        await testError(`Bad route dup`, [{ resources: ["dup", "dup"] }]);
        await testError(`Bad route :also/:duplicate`, [
          { resources: [":even/:separate"] },
          { resources: [":also/:duplicate"] },
        ]);
        await testError(`Bad route /path?query=error`, [
          { resources: ["/path?query=error"] },
        ]);
      });

      it("should accept valid access rules", async () => {
        let res = await client.post("/api-token", { access: { rules: [] } });
        expect(res.status).toBe(201);

        // e.g. read-only api token
        res = await client.post("/api-token", {
          access: { rules: [{ resources: ["*"], methods: ["get"] }] },
        });
        expect(res.status).toBe(201);

        // e.g. go-livepeer + infra api token
        res = await client.post("/api-token", {
          access: {
            rules: [
              {
                resources: ["stream/hook/*", "usage/update"],
                methods: ["post"],
              },
              { resources: ["region/:id"], methods: ["put"] },
            ],
          },
        });
        expect(res.status).toBe(201);
      });
    });

    it("should create an apiToken, delete it, and error when attempting additional detele or replace", async () => {
      const res = await client.post("/api-token");
      expect(res.status).toBe(201);
      const tokenRes = await res.json();
      expect(tokenRes.id).toBeDefined();

      const resGet = await server.store.get(`api-token/${tokenRes.id}`);
      expect(resGet.id).toEqual(tokenRes.id);

      // test that apiToken is deleted
      await server.store.delete(`api-token/${tokenRes.id}`);
      const deleted = await server.store.get(`api-token/${tokenRes.id}`);
      expect(deleted).toBeDefined();

      // it should return a NotFound Error when trying to delete a record that doesn't exist
      let deleteTokenErr;
      try {
        await server.store.delete(`api-token/${tokenRes.id}`);
      } catch (err) {
        deleteTokenErr = err;
      }
      expect(deleteTokenErr.status).toBe(404);

      let replaceError;
      try {
        await server.store.replace(tokenRes);
      } catch (err) {
        replaceError = err;
      }
      expect(replaceError.status).toBe(404);
    });

    // it('should not get all apiTokens with non-admin user', async () => {
    //   // setting up non-admin user
    //   client.jwtAuth = nonAdminToken['token']

    //   for (let i = 0; i < 3; i += 1) {
    //     const u = {
    //       userId: adminUser.id,
    //       id: uuid(),
    //       kind: 'api-token',
    //     }
    //     await server.store.create(u)
    //     const res = await client.get(`/api-token/${u.id}`)
    //     expect(res.status).toBe(200)
    //   }

    //   let res = await client.get('/api-token')
    //   expect(res.status).toBe(403)
    // })

    it("should return all user apiTokens that belong to a user", async () => {
      for (let i = 0; i < 4; i += 1) {
        const u = {
          userId: adminUser.id,
          id: uuid(),
          kind: "api-token",
        };
        await server.store.create(u);
        const res = await client.get(`/api-token/${u.id}`);
        expect(res.status).toBe(200);
        const apiTokenRes = await res.json();
        expect(apiTokenRes.userId).toEqual(adminUser.id);
        expect(apiTokenRes.id).toEqual(u.id);
      }

      let res = await client.get(`/api-token?userId=${adminUser.id}`);
      expect(res.status).toBe(200);
      let apiTokens = await res.json();
      expect(apiTokens.length).toEqual(4);

      // create apiToken belonging to nonadmin user
      const u = {
        userId: nonAdminUser.id,
        id: uuid(),
        kind: "api-token",
      };
      await server.store.create(u);
      res = await client.get(`/api-token/${u.id}`);
      expect(res.status).toBe(200);

      // should return all apiTokens that belong to admin user
      res = await client.get(`/api-token?userId=${adminUser.id}`);
      expect(res.status).toBe(200);
      let tokenRes = await res.json();

      expect(tokenRes.length).toEqual(4);

      // should return all apiTokens that belong to nonAdmin user as admin user
      res = await client.get(`/api-token?userId=${nonAdminUser.id}`);
      expect(res.status).toBe(200);
      tokenRes = await res.json();
      expect(tokenRes.length).toEqual(1);

      // should return all apiTokens that belong to nonAdmin user as nonAdmin user
      client.jwtAuth = `${nonAdminToken["token"]}`;
      res = await client.get(`/api-token?userId=${nonAdminUser.id}`);
      expect(res.status).toBe(200);
      tokenRes = await res.json();
      expect(tokenRes.length).toEqual(1);

      // should not return all apiTokens that belong to admin user as nonAdmin user
      res = await client.get(`/api-token?userId=${adminUser.id}`);
      expect(res.status).toBe(403);
    });

    it("should disallow meta access with api-token", async () => {
      const expect403 = async (method, path) => {
        const res = await client.fetch(path, { method });
        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body.errors[0]).toEqual("access forbidden for API keys");
      };
      const expectAll403s = async () => {
        await expect403("post", `/api-token`);
        await expect403("get", `/api-token`);
        await expect403("get", `/api-token?userId=${nonAdminUser.id}`);
        await expect403("get", `/api-token/${nonAdminToken}`);
        await expect403("delete", `/api-token/${nonAdminToken}`);
      };
      client.jwtAuth = undefined;

      const nonAdminToken = uuid();
      await server.store.create({
        userId: nonAdminUser.id,
        id: nonAdminToken,
        kind: "api-token",
      });
      client.apiKey = nonAdminToken;
      await expectAll403s();

      const adminToken = uuid();
      await server.store.create({
        userId: adminUser.id,
        id: adminToken,
        kind: "api-token",
      });
      client.apiKey = adminToken;
      await expectAll403s();
    });
  });

  /*
  describe("user endpoint with api key", () => {
    let client;
    const adminApiKey = uuid();
    const nonAdminApiKey = uuid();

    beforeEach(async () => {
      client = new TestClient({
        server,
        apiKey: uuid(),
      });

      const userRes = await client.post(`/user/`, { ...mockAdminUser });
      let adminUser = await userRes.json();

      const nonAdminRes = await client.post(`/user/`, { ...mockNonAdminUser });
      let nonAdminUser = await nonAdminRes.json();

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

    // it('should not get all apiTokens', async () => {
    //   client.apiKey = nonAdminApiKey
    //   let res = await client.get('/api-token')
    //   expect(res.status).toBe(403)

    //   client.apiKey = adminApiKey
    //   res = await client.get('/api-token')
    //   expect(res.status).toBe(403)
    // })
  });
  */
});
