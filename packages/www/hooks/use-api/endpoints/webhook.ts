import qs from "qs";
import { ApiState, WebhookLogs } from "../types";
import { SetStateAction } from "react";
import { Webhook } from "@livepeer.studio/api";
import { getCursor } from "../helpers";

let context: any;
let setState: (value: SetStateAction<ApiState>) => void;

export const setSharedScope = (
  _context: any,
  _setState: (value: SetStateAction<ApiState>) => void
) => {
  context = _context;
  setState = _setState;
};

export const getWebhooks = async (
  allUsers: boolean,
  all: boolean,
  order?: string,
  filters?: Array<{ id: string; value: string | object }>,
  limit?: number,
  cursor?: string,
  count?: boolean
): Promise<[Webhook[], string, Response, number]> => {
  const f = filters ? JSON.stringify(filters) : undefined;
  const [res, streams] = await context.fetch(
    `/webhook?${qs.stringify({
      allUsers: allUsers ? true : undefined,
      all: all ? true : undefined,
      order,
      limit,
      cursor,
      filters: f,
      count,
    })}`
  );
  const nextCursor = getCursor(res.headers.get("link"));
  const c = res.headers.get("X-Total-Count");
  return [streams, nextCursor, res, c];
};

export const getWebhook = async (webhookId): Promise<Webhook> => {
  const [res, webhook] = await context.fetch(`/webhook/${webhookId}`);
  if (res.status !== 200) {
    throw webhook && typeof webhook === "object"
      ? { ...webhook, status: res.status }
      : new Error(webhook);
  }
  return webhook;
};

export const createWebhook = async (params): Promise<Webhook> => {
  const [res, webhook] = await context.fetch(`/webhook`, {
    method: "POST",
    body: JSON.stringify(params),
    headers: {
      "content-type": "application/json",
    },
  });

  if (res.status !== 201) {
    throw new Error(webhook.errors.join(", "));
  }
  return webhook;
};

export const updateWebhook = async (id, params): Promise<Webhook> => {
  const [res, webhook] = await context.fetch(`/webhook/${id}`, {
    method: "PUT",
    body: JSON.stringify(params),
    headers: {
      "content-type": "application/json",
    },
  });

  if (res.status !== 200) {
    throw new Error(webhook.errors.join(", "));
  }
  return webhook;
};

export const deleteWebhook = async (id: string): Promise<void> => {
  const [res, body] = await context.fetch(`/webhook/${id}`, {
    method: "DELETE",
  });
  if (res.status !== 204) {
    throw new Error(body.errors.join(", "));
  }
};

export const deleteWebhooks = async (ids: Array<string>): Promise<void> => {
  const [res, body] = await context.fetch(`/webhook`, {
    method: "DELETE",
    body: JSON.stringify({ ids }),
    headers: {
      "content-type": "application/json",
    },
  });
  if (res.status !== 204) {
    throw new Error(body);
  }
};

export const getWebhookLogs = async (webhookId): Promise<WebhookLogs[]> => {
  const [res, logs] = await context.fetch(`/webhook/${webhookId}/log`);
  if (res.status !== 200) {
    throw logs && typeof logs === "object"
      ? { ...logs, status: res.status }
      : new Error(logs);
  }
  return logs;
};

export const resendWebhook = async (params: {
  webhookId: string;
  logId: string;
}): Promise<WebhookLogs> => {
  const [res, webhook] = await context.fetch(
    `/webhook/${params.webhookId}/log/${params.logId}/resend`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    }
  );

  if (res.status !== 200) {
    throw new Error(webhook.errors.join(", "));
  }
  return webhook;
};
