import serverPromise, { TestServer } from "../test-server";
import {
  TestClient,
  clearDatabase,
  createApiToken,
  setupUsers,
  verifyJwt,
} from "../test-helpers";
import {
  ApiToken,
  SigningKey,
  SigningKeyResponsePayload,
  User,
} from "../schema/types";
import { WithID } from "../store/types";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import { db } from "../store";
import { createProject } from "../test-helpers";

// includes auth file tests

let server: TestServer;
let mockAdminUserInput: User;
let mockNonAdminUserInput: User;

// jest.setTimeout(70000)

beforeAll(async () => {
  server = await serverPromise;

  mockAdminUserInput = {
    email: "user_admin@gmail.com",
    password: "x".repeat(64),
  };

  mockNonAdminUserInput = {
    email: "user_non_admin@gmail.com",
    password: "y".repeat(64),
  };
});

afterEach(async () => {
  await clearDatabase(server);
});

describe("controllers/signing-key", () => {
  describe("basic CRUD with JWT authorization", () => {
    let client: TestClient;
    let adminUser: User;
    let adminToken: string;
    let nonAdminUser: User;
    let nonAdminToken: string;
    let otherUserToken: string;
    let signingKey: WithID<SigningKey>;
    let samplePrivateKey: string;
    let decodedPublicKey: string;
    let otherPublicKey: string;
    let projectId: string;
    let apiKeyWithProject: WithID<ApiToken>;

    beforeEach(async () => {
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
      client.jwtAuth = nonAdminToken;
      let created: SigningKeyResponsePayload = await client
        .post("/access-control/signing-key")
        .then((res) => res.json());
      let encodedPrivateKey = created.privateKey;
      samplePrivateKey = Buffer.from(encodedPrivateKey, "base64").toString();
      let res = await client.get(`/access-control/signing-key/${created.id}`);
      signingKey = await res.json();
      // decoded public key is decoded b64 of signingKey.publicKey parsed as json
      decodedPublicKey = Buffer.from(signingKey.publicKey, "base64").toString();
      created = await (await client.post("/access-control/signing-key")).json();
      res = await client.get(`/access-control/signing-key/${created.id}`);
      let otherSigningKey = await res.json();
      otherPublicKey = Buffer.from(
        otherSigningKey.publicKey,
        "base64",
      ).toString();
      // create a new project
      client.jwtAuth = nonAdminToken;
      let project = await createProject(client);
      expect(project).toBeDefined();
      projectId = project.id;
      apiKeyWithProject = await createApiToken({
        client: client,
        projectId: project.id,
        jwtAuthToken: nonAdminToken,
      });
      expect(apiKeyWithProject).toMatchObject({
        id: expect.any(String),
        projectId: projectId,
      });
      projectId = project.id;
    });

    it("should create a signing key and display the private key only on creation", async () => {
      const preCreationTime = Date.now();
      client.jwtAuth = "";
      client.apiKey = apiKeyWithProject.id;
      let res = await client.post("/access-control/signing-key");
      expect(res.status).toBe(201);
      const created = (await res.json()) as SigningKeyResponsePayload;
      expect(created).toMatchObject({
        id: expect.any(String),
        privateKey: expect.any(String),
        publicKey: expect.any(String),
        createdAt: expect.any(Number),
        projectId: projectId,
      });
      expect(created.createdAt).toBeGreaterThanOrEqual(preCreationTime);
      res = await client.get(`/access-control/signing-key/${created.id}`);
      expect(res.status).toBe(200);
      const getResponse = await res.json();
      const { privateKey, ...withoutPvtk } = created;
      expect(getResponse).toEqual(withoutPvtk);
    });

    it("should list all user signing keys", async () => {
      client.jwtAuth = nonAdminToken;
      client.apiKey = null;
      let sigKeyWithoutProject = await client.post(
        "/access-control/signing-key",
      );
      expect(sigKeyWithoutProject.status).toBe(201);
      client.jwtAuth = "";
      client.apiKey = apiKeyWithProject.id;
      let sigkey = await client.post("/access-control/signing-key");
      expect(sigkey.status).toBe(201);
      const res = await client.get(`/access-control/signing-key`);
      expect(res.status).toBe(200);
      const output = await res.json();
      expect(output).toHaveLength(1);
      expect(output[0].projectId).toBe(projectId);
    });

    it("should create a JWT using the private key and verify it with the public key", async () => {
      client.jwtAuth = "";
      client.apiKey = apiKeyWithProject.id;
      const expiration = Math.floor(Date.now() / 1000) + 1000;
      const payload: JwtPayload = {
        sub: "b0dcxvwml48mxt2s",
        action: "pull",
        name: "Satoshi Nakamoto",
        pub: signingKey.publicKey,
        exp: expiration,
        video: "none",
      };
      const token = jwt.sign(payload, samplePrivateKey, { algorithm: "ES256" });

      const decoded = verifyJwt(token, decodedPublicKey, {
        complete: true,
      });

      expect(decoded.payload["exp"]).toEqual(expiration);

      expect(() => jwt.verify(token, decodedPublicKey)).not.toThrow();
      expect(() => jwt.verify(token, otherPublicKey)).toThrow(
        JsonWebTokenError,
      );
    });

    it("should allow disable and enable the signing key & change the name", async () => {
      client.jwtAuth = "";
      client.apiKey = apiKeyWithProject.id;
      let sigkey = await client.post("/access-control/signing-key");
      expect(sigkey.status).toBe(201);
      let signingKey = await sigkey.json();
      let res = await client.patch(
        `/access-control/signing-key/${signingKey.id}`,
        {
          disabled: true,
          name: "My test signing key 1",
        },
      );
      expect(res.status).toBe(204);
      res = await client.get(`/access-control/signing-key/${signingKey.id}`);
      let updated = await res.json();
      expect(updated.disabled).toBe(true);
      expect(updated.name).toBe("My test signing key 1");
      res = await client.patch(`/access-control/signing-key/${signingKey.id}`, {
        disabled: false,
        name: "My test signing key 2",
      });
      expect(res.status).toBe(204);
      res = await client.get(`/access-control/signing-key/${signingKey.id}`);
      updated = await res.json();
      expect(updated.disabled).toBe(false);
      expect(updated.name).toBe("My test signing key 2");
    });

    it("should delete the signing key", async () => {
      client.jwtAuth = "";
      client.apiKey = apiKeyWithProject.id;
      let sigkey = await client.post("/access-control/signing-key");
      expect(sigkey.status).toBe(201);
      let signingKey = await sigkey.json();
      let res = await client.delete(
        `/access-control/signing-key/${signingKey.id}`,
      );
      expect(res.status).toBe(204);
      res = await client.get(`/access-control/signing-key/${signingKey.id}`);
      expect(res.status).toBe(404);
      let deletedSigningKey = await db.signingKey.get(signingKey.id);
      expect(deletedSigningKey.deleted).toBe(true);
    });
  });
});
