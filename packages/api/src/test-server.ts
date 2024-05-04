/**
 * This file is imported from all the integration tests. It boots up a server based on the provided argv.
 */
import fs from "fs-extra";
import { v4 as uuid } from "uuid";
import path from "path";
import os from "os";

import makeApp, { AppServer } from "./index";
import argParser from "./parse-cli";
import { rabbitMgmt, startAuxTestServer } from "./test-helpers";

const dbPath = path.resolve(os.tmpdir(), "livepeer", uuid());
const clientId = "EXPECTED_AUDIENCE";
const trustedDomain = "livepeer.org";
const jwtAudience = "livepeer";
const jwtSecret = "secret";
// enable to test SendGrid integration
const supportAddr: [string, string] = ["Livepeer Team", "angie@livepeer.org"];
const sendgridTemplateId = "iamanid";
const sendgridApiKey = "SG. iamanapikey";

fs.ensureDirSync(dbPath);

const params = argParser();
// Secret code used for back-door DB access in test env

// Some overrides... we want to run on a random port for parallel reasons
const testId = `test_${Date.now()}`;
delete params.port;
params.dbPath = dbPath;
params.clientId = clientId;
params.trustedDomain = trustedDomain;
params.jwtAudience = jwtAudience;
params.jwtSecret = jwtSecret;
params.supportAddr = supportAddr;
params.sendgridTemplateId = sendgridTemplateId;
params.sendgridApiKey = sendgridApiKey;
params.postgresUrl = `postgresql://postgres@127.0.0.1/${testId}`;
params.recordObjectStoreId = "mock_store";
params.vodObjectStoreId = "mock_vod_store";
params.trustedIpfsGateways = [
  "https://ipfs.example.com/ipfs/",
  /https:\/\/.+\.ipfs-provider.io\/ipfs\//,
];
params.ingest = [
  {
    ingest: "rtmp://test/live",
    playback: "https://test/hls",
    playbackDirect: "https://test/hls",
    base: "https://test",
    baseDirect: "https://test",
    origin: "http://test",
  },
];
params.amqpUrl = `amqp://127.0.0.1:5672/${testId}`;
if (!params.insecureTestToken) {
  params.insecureTestToken = uuid();
}
params.listen = true;
params.requireEmailVerification = true;
params.livekitHost = "livekit";
params.frontend = false;

let server: AppServer & { host?: string };
let catalystServer;

console.log(`test run parameters: ${JSON.stringify(params)}`);

async function setupServer() {
  await rabbitMgmt.createVhost(testId);

  catalystServer = await startAuxTestServer();
  catalystServer.app.post("/api/events", (req, res) => {
    res.status(200).end();
  });
  params.catalystBaseUrl = `http://127.0.0.1:${catalystServer.port}`;

  server = await makeApp(params);

  server.host = `http://127.0.0.1:${server.port}`;
  return {
    ...params,
    host: server.host,
    store: server.store,
    async close() {
      await server.close();
    },
    db: server.db,
    jobsDb: server.jobsDb,
    queue: server.queue,
    webhook: server.webhook,
    taskScheduler: server.taskScheduler,
  };
}

afterAll(async () => {
  if (server) {
    server.webhook.stop();
    await server.queue.close();
    await server.close();
    server = null;
  }
  if (catalystServer) {
    await catalystServer.close();
  }
  fs.removeSync(dbPath);
  await rabbitMgmt.deleteVhost(testId);
});

export type TestServer = Awaited<ReturnType<typeof setupServer>>;

export default (async () => {
  const serverProm = setupServer();
  await expect(serverProm).resolves.toMatchObject({
    host: expect.any(String),
    store: expect.any(Object),
    db: expect.any(Object),
    queue: expect.any(Object),
  });
  return await serverProm;
})();
