import { Request, Router } from "express";
import { db } from "../store";
import {
  getPlaybackUrl as streamPlaybackUrl,
  getRecordingFields,
} from "./stream";
import { getPlaybackUrl as assetPlaybackUrl } from "./asset";
import { NotFoundError } from "@cloudflare/kv-asset-handler";
import { DBSession } from "../store/db";
import Table from "../store/table";
import { Asset, Stream, User } from "../schema/types";
import { isExperimentSubject } from "../store/experiment-table";

// This should be compatible with the Mist format: https://gist.github.com/iameli/3e9d20c2b7f11365ea8785c5a8aa6aa6
type PlaybackInfo = {
  type: "live" | "vod" | "recording";
  meta: {
    live?: 0 | 1;
    playbackPolicy?: Asset["playbackPolicy"] | Stream["playbackPolicy"];
    source: {
      // the only supported format is HLS for now
      hrn: "HLS (TS)";
      type: "html5/application/vnd.apple.mpegurl";
      url: string;
    }[];
  };
};

const newPlaybackInfo = (
  type: PlaybackInfo["type"],
  hlsUrl: string,
  playbackPolicy?: Asset["playbackPolicy"] | Stream["playbackPolicy"],
  live?: PlaybackInfo["meta"]["live"]
): PlaybackInfo => ({
  type,
  meta: {
    live,
    playbackPolicy,
    source: [
      {
        hrn: "HLS (TS)",
        type: "html5/application/vnd.apple.mpegurl",
        url: hlsUrl,
      },
    ],
  },
});

const getAssetPlaybackUrl = async (
  config: Request["config"],
  ingest: string,
  id: string,
  user?: User
) => {
  const asset =
    (await db.asset.getByPlaybackId(id)) ??
    (await db.asset.getByIpfsCid(id, user)) ??
    (await db.asset.getBySourceURL("ipfs://" + id, user)) ??
    (await db.asset.getBySourceURL("ar://" + id, user));
  if (!asset || asset.deleted) {
    return null;
  }
  const os = await db.objectStore.get(asset.objectStoreId);
  if (!os || os.deleted || os.disabled) {
    return null;
  }
  const playbackUrl = assetPlaybackUrl(config, ingest, asset, os);
  const inExperiment = await isExperimentSubject(
    "lit-signing-condition",
    asset.userId
  );
  return !playbackUrl
    ? null
    : {
        playbackUrl,
        playbackPolicy: inExperiment ? asset.playbackPolicy : null,
      };
};

const getRecordingPlaybackUrl = async (
  ingest: string,
  id: string,
  table: Table<DBSession>
) => {
  const session = await table.get(id);
  if (!session || session.deleted) {
    return null;
  }
  const { recordingUrl } = getRecordingFields(ingest, session, false);
  return recordingUrl;
};

async function getPlaybackInfo(
  { config, user }: Request,
  ingest: string,
  id: string
): Promise<PlaybackInfo> {
  const stream = await db.stream.getByPlaybackId(id);
  if (stream && !stream.deleted) {
    return newPlaybackInfo(
      "live",
      streamPlaybackUrl(ingest, stream),
      stream.playbackPolicy,
      stream.isActive ? 1 : 0
    );
  }
  const asset = await getAssetPlaybackUrl(config, ingest, id);
  if (asset) {
    return newPlaybackInfo("vod", asset.playbackUrl, asset.playbackPolicy);
  }

  const recordingUrl =
    (await getRecordingPlaybackUrl(ingest, id, db.session)) ??
    (await getRecordingPlaybackUrl(ingest, id, db.stream));
  if (recordingUrl) {
    return newPlaybackInfo("recording", recordingUrl);
  }
  throw new NotFoundError(`No playback URL found for ${id}`);
}

const app = Router();

app.get("/:id", async (req, res) => {
  const ingests = await req.getIngest();
  if (!ingests.length) {
    res.status(501);
    return res.json({ errors: ["Ingest not configured"] });
  }
  const ingest = ingests[0].base;

  let { id } = req.params;
  const info = await getPlaybackInfo(req, ingest, id);
  res.status(200).json(info);
});

export default app;
