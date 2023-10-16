import { validatePost } from "../middleware";
import { Request, Response, Router } from "express";
import _ from "lodash";
import { db } from "../store";
import { ForbiddenError, NotFoundError } from "../store/errors";
import {
  createAsset,
  validateAssetPayload,
  defaultObjectStoreId,
  catalystPipelineStrategy,
} from "./asset";
import { generateUniquePlaybackId } from "./generate-keys";
import { v4 as uuid } from "uuid";
import { DBSession } from "../store/session-table";
import { authorizer } from "../middleware";
import { toExternalAsset } from "./asset";
import mung from "express-mung";
import { Asset } from "../schema/types";
import { WithID } from "../store/types";
import { buildRecordingUrl, getRunningRecording } from "./session";
import {
  toStringValues,
  parseFilters,
  parseOrder,
  makeNextHREF,
} from "./helpers";
import sql from "sql-template-strings";
import { DBStream } from "../store/stream-table";
import crypto from "crypto";

const app = Router();
export const LVPR_SDK_EMAILS = ["livepeerjs@livepeer.org"];
const MAX_PROCESSING_CLIPS = 5;

// Generate a salt on server startup, so that we can hash the origin of the requester
const SALT = crypto.randomBytes(32).toString("hex");

app.use(
  mung.jsonAsync(async function cleanWriteOnlyResponses(
    data: WithID<Asset>[] | WithID<Asset> | { asset: WithID<Asset> },
    req
  ) {
    const { details } = toStringValues(req.query);
    const toExternalAssetFunc = (a: Asset) =>
      toExternalAsset(a, req.config, !!details, req.user.admin);

    if (Array.isArray(data)) {
      return Promise.all(data.map(toExternalAssetFunc));
    }
    if ("id" in data) {
      return toExternalAssetFunc(data);
    }
    if ("asset" in data) {
      return {
        ...data,
        asset: await toExternalAssetFunc(data.asset),
      };
    }
    return data;
  })
);

async function getProcessingClipsByRequesterId(
  requesterId: string
): Promise<WithID<Asset>[]> {
  const createdAfter = Date.now() - 10 * 60 * 1000;
  const assets = await db.asset.find([
    sql`data->'status'->>'phase' IN ('waiting', 'processing', 'running')`,
    sql`data->'source'->>'requesterId' = ${requesterId}`,
    sql`coalesce((data->>'createdAt')::bigint, 0) > ${createdAfter}`,
  ]);

  return assets[0];
}

app.post("/", validatePost("clip-payload"), async (req, res) => {
  const playbackId = req.body.playbackId;
  const clippingUser = req.user;
  const origin =
    req.headers["CF-Connecting-IP"] ||
    req.headers["True-Client-IP"] ||
    req.headers["X-Forwarded-For"];
  let requesterId: string = null;

  if (!origin) {
    console.log(`
      clip: unable to determine origin of requester for user=${clippingUser.id} when clipping playbackId=${playbackId}
    `);
    requesterId = "UNKNOWN";
  } else {
    //TODO: remove - staging debug log
    console.log(`
      clip: cf-connecting-ip=${req.headers["CF-Connecting-IP"]} true-client-ip=${req.headers["True-Client-IP"]} xforwardedfor=${req.headers["x-forwarded-for"]}
    `);
    console.log(`
       clip: user=${clippingUser.id} is clipping playbackId=${playbackId} from origin=${origin}
    `);
    let originString = Array.isArray(origin) ? origin.join(",") : origin;
    originString = originString + SALT + playbackId;

    // hash the origin to anonymize it
    requesterId = crypto
      .createHash("sha256")
      .update(originString)
      .digest("hex");
  }

  const id = uuid();
  let uPlaybackId = await generateUniquePlaybackId(id);

  const content = await db.stream.getByPlaybackId(playbackId); //||
  //(await db.asset.getByPlaybackId(playbackId));

  let isStream: boolean;
  if (content && "streamKey" in content) {
    isStream = true;
  }

  if (!content) {
    throw new NotFoundError("Content not found");
  }

  const owner = await db.user.get(content.userId);

  if (!owner) {
    throw new NotFoundError(
      "Content not found - unable to find owner of content"
    );
  }

  // If the user is neither an admin, nor part of LVPR_SDK_EMAILS and doesn't own the content, throw an error.
  if (
    !clippingUser.admin &&
    !LVPR_SDK_EMAILS.includes(clippingUser.email) &&
    clippingUser.id !== owner.id
  ) {
    console.log(`
        clip: user=${clippingUser.email} does not have permission to clip stream=${content.id} - owner=${owner?.id}
      `);
    throw new ForbiddenError("You do not have permission to clip this stream");
  }

  if ("suspended" in content && content.suspended) {
    throw new NotFoundError("Content not found");
  }

  const processingClips = await getProcessingClipsByRequesterId(requesterId);

  if (processingClips.length >= MAX_PROCESSING_CLIPS) {
    throw new ForbiddenError("Too many clips are being processed.");
  }

  let url: string;
  let session: DBSession;
  let objectStoreId: string;

  if (isStream) {
    if (req.body.sessionId) {
      session = await db.session.get(req.body.sessionId);
      if (!session) {
        throw new NotFoundError("Session not found");
      }
      if (session.parentId !== content.id) {
        throw new NotFoundError(
          "The provided session id does not belong to this stream"
        );
      }
      ({ url, objectStoreId } = await buildRecordingUrl(session, req));
    } else {
      ({ url, session, objectStoreId } = await getRunningRecording(
        content,
        req
      ));
    }
  } else {
    res
      .status(400)
      .json({ errors: ["Clipping for assets is not implemented yet"] });
    return;
  }

  if (!session) {
    throw new Error("Recording session not found");
  }

  let asset = await validateAssetPayload(
    id,
    uPlaybackId,
    owner.id,
    Date.now(),
    await defaultObjectStoreId(req),
    req.config,
    {
      name: req.body.name || `clip-${uPlaybackId}`,
    },
    {
      type: "clip",
      playbackId,
      requesterId,
      ...(isStream ? { sessionId: session.id } : { assetId: content.id }),
    }
  );

  asset = await createAsset(asset, req.queue);

  const task = await req.taskScheduler.createAndScheduleTask(
    "clip",
    {
      clip: {
        clipStrategy: {
          playbackId,
          startTime: req.body.startTime,
          endTime: req.body.endTime,
        },
        catalystPipelineStrategy: catalystPipelineStrategy(req),
        url,
        sessionId: session.id,
        inputId: content.id,
        sourceObjectStoreId: objectStoreId,
      },
    },
    null,
    asset,
    owner.id
  );

  res.json({
    task: { id: task.id },
    asset,
  });
});

const fieldsMap = {
  id: `asset.ID`,
  createdAt: { val: `asset.data->'createdAt'`, type: "int" },
  updatedAt: { val: `asset.data->'status'->'updatedAt'`, type: "int" },
  userId: `asset.data->>'userId'`,
  playbackId: `asset.data->>'playbackId'`,
  sourceType: `asset.data->'source'->>'type'`,
  sourceSessionId: `asset.data->'source'->>'sessionId'`,
  sourceAssetId: `asset.data->'source'->>'assetId'`,
} as const;

app.get("/:id", authorizer({}), async (req, res) => {
  const id = req.params.id;

  const content =
    (await db.session.get(id)) ||
    (await db.stream.getByIdOrPlaybackId(id)) ||
    (await db.asset.getByPlaybackId(id)) ||
    (await db.asset.get(id)) ||
    (await db.asset.getByIpfsCid(id));

  if (!content) {
    throw new NotFoundError("Content not found");
  }

  let response = await getClips(content, req, res);
  return response;
});

export const getClips = async (
  content: DBSession | DBStream | WithID<Asset>,
  req: Request,
  res: Response
) => {
  let { limit, cursor, all, allUsers, order, filters, count, cid, ...otherQs } =
    toStringValues(req.query);

  if (!order) {
    order = "updatedAt-true,createdAt-true";
  }

  const query = [...parseFilters(fieldsMap, filters)];

  if (!req.user.admin || !all || all === "false") {
    query.push(sql`asset.data->>'deleted' IS NULL`);
  }

  let output: WithID<Asset>[];
  let newCursor: string;

  query.push(sql`asset.data->>'userId' = ${req.user.id}`);

  if (!content) {
    throw new NotFoundError("Content not found");
  }

  let contentType: string;

  if ("objectStoreId" in content) {
    contentType = "asset";
  } else if ("streamKey" in content) {
    contentType = "stream";
  } else {
    contentType = "session";
  }
  query.push(sql`asset.data->'source'->>'type' = 'clip'`);
  switch (contentType) {
    case "asset":
      query.push(sql`asset.data->'source'->>'assetId' = ${content.id}`);
      break;
    case "session":
      query.push(sql`asset.data->'source'->>'sessionId' = ${content.id}`);
      break;
    case "stream":
      const sessionQuery = [];
      sessionQuery.push(sql`data->>'parentId' = ${content.id}`);
      const [sessions] = await db.session.find(sessionQuery, {
        order: `data->>'lastSeen' DESC NULLS LAST`,
        cursor,
      });

      if (sessions.length === 0) {
        return res.json([]);
      }

      const sessionIds = sessions.map((s) => `${s.id}`);

      query.push(
        sql`asset.data->'source'->>'sessionId' IN `.append(
          sqlQueryGroup(sessionIds)
        )
      );

      break;
  }

  let fields = " asset.id as id, asset.data as data";
  if (count) {
    fields = fields + ", count(*) OVER() AS count";
  }
  [output, newCursor] = await db.asset.find(query, {
    limit,
    cursor,
    fields,
    order: parseOrder(fieldsMap, order),
    process: ({ data, count: c }) => {
      if (count) {
        res.set("X-Total-Count", c);
      }
      return data;
    },
  });

  res.status(200);
  if (output.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }

  return res.json(output);
};

function sqlQueryGroup(values: string[]) {
  const query = sql`(`;
  values.forEach((value, i) => {
    if (i) query.append(`, `);
    query.append(sql`${value}`);
  });
  query.append(`)`);
  return query;
}

export default app;
