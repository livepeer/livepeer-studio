import logger from "../logger";
import fetch from "node-fetch";
import crypto from "crypto";
import querystring from "querystring";

let challengeResponse;
let challenge;

function hashChallenge(authChallenge, password) {
  const passHashed = crypto.createHash("md5").update(password).digest("hex");
  challengeResponse = crypto
    .createHash("md5")
    .update(passHashed + authChallenge)
    .digest("hex");
  challenge = authChallenge;
}

export async function listActiveStreams(
  mistHost,
  mistPort,
  login,
  password,
  isRetry = false
) {
  try {
    const req = {
      active_streams: 1,
      ...(!challengeResponse
        ? {}
        : {
            authorize: {
              username: login,
              password: challengeResponse,
            },
          }),
    };
    const params = {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: querystring.encode({ command: JSON.stringify(req) }),
    };
    logger.info(
      `requesting active streams list with request ${JSON.stringify(
        req,
        null,
        2
      )}`
    );
    const res1 = await fetch(`http://${mistHost}:${mistPort}/api2`, params);

    if (res1.status != 200) {
      logger.error(`Unexpected status=${res1.status}`);
      return false;
    }
    const body = await res1.json();
    const authStatus = ((body || {}).authorize || {}).status;
    if (authStatus === "CHALL" && !isRetry) {
      hashChallenge(((body || {}).authorize || {}).challenge, password);
      return await listActiveStreams(mistHost, mistPort, login, password, true);
    } else if (authStatus !== "OK") {
      logger.error(`Unexpected authorize status=${authStatus}`);
      return [];
    }
    const activeStreams = (body || {}).active_streams;
    return Array.isArray(activeStreams) ? activeStreams : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function terminateStream(
  mistHost,
  mistPort,
  streamName,
  login,
  password,
  isRetry = false
) {
  try {
    const req = {
      nuke_stream: streamName,
      ...(!challengeResponse
        ? {}
        : {
            authorize: {
              username: login,
              password: challengeResponse,
            },
          }),
    };
    const params = {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: querystring.encode({ command: JSON.stringify(req) }),
    };
    const res1 = await fetch(`http://${mistHost}:${mistPort}/api2`, params);

    if (res1.status != 200) {
      logger.error(`Unexpected status=${res1.status}`);
      return false;
    }
    const body = await res1.json();
    const authStatus = ((body || {}).authorize || {}).status;
    if (authStatus === "CHALL" && !isRetry) {
      hashChallenge(((body || {}).authorize || {}).challenge, password);
      return await terminateStream(
        mistHost,
        mistPort,
        streamName,
        login,
        password,
        true
      );
    } else if (authStatus !== "OK") {
      logger.error(`Unexpected authorize status=${authStatus}`);
      return false;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
  return true;
}
