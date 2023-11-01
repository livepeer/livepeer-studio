import { ConsumeMessage } from "amqplib";
import { promises as dns } from "dns";
import isLocalIP from "is-local-ip";
import { Response } from "node-fetch";
import { v4 as uuid } from "uuid";
import { parse as parseUrl } from "url";
import { DB } from "../store/db";
import { DBSession } from "../store/session-table";
import messages from "../store/messages";
import Queue from "../store/queue";
import { DBWebhook } from "../store/webhook-table";
import { fetchWithTimeout, RequestInitWithTimeout, sleep } from "../util";
import logger from "../logger";
import { sign, sendgridEmail, pathJoin } from "../controllers/helpers";
import { taskScheduler } from "../task/scheduler";
import { generateUniquePlaybackId } from "../controllers/generate-keys";
import { createAsset, primaryStorageExperiment } from "../controllers/asset";
import { DBStream } from "../store/stream-table";
import { USER_SESSION_TIMEOUT } from "../controllers/stream";
import { BadRequestError, UnprocessableEntityError } from "../store/errors";
import { db } from "../store";
import { buildRecordingUrl } from "../controllers/session";
import { isExperimentSubject } from "../store/experiment-table";

const WEBHOOK_TIMEOUT = 5 * 1000;
const MAX_BACKOFF = 60 * 60 * 1000;
const BACKOFF_COEF = 2;
const MAX_RETRIES = 33;

const SIGNATURE_HEADER = "Livepeer-Signature";

function isRuntimeError(err: any): boolean {
  const runtimeErrors: ErrorConstructor[] = [
    TypeError,
    ReferenceError,
    RangeError,
    SyntaxError,
  ];
  return runtimeErrors.some((re) => err instanceof re);
}

export default class WebhookCannon {
  db: DB;
  running: boolean;
  verifyUrls: boolean;
  frontendDomain: string;
  sendgridTemplateId: string;
  sendgridApiKey: string;
  supportAddr: [string, string];
  vodCatalystObjectStoreId: string;
  secondaryVodObjectStoreId: string;
  recordCatalystObjectStoreId: string;
  secondaryRecordObjectStoreId: string;
  resolver: any;
  queue: Queue;
  constructor({
    db,
    frontendDomain,
    sendgridTemplateId,
    sendgridApiKey,
    supportAddr,
    vodCatalystObjectStoreId,
    secondaryVodObjectStoreId,
    recordCatalystObjectStoreId,
    secondaryRecordObjectStoreId,
    verifyUrls,
    queue,
  }) {
    this.db = db;
    this.running = true;
    this.verifyUrls = verifyUrls;
    this.frontendDomain = frontendDomain;
    this.sendgridTemplateId = sendgridTemplateId;
    this.sendgridApiKey = sendgridApiKey;
    this.supportAddr = supportAddr;
    this.vodCatalystObjectStoreId = vodCatalystObjectStoreId;
    this.secondaryVodObjectStoreId = secondaryVodObjectStoreId;
    this.recordCatalystObjectStoreId = recordCatalystObjectStoreId;
    this.secondaryRecordObjectStoreId = secondaryRecordObjectStoreId;
    this.resolver = new dns.Resolver();
    this.queue = queue;
    // this.start();
  }

  async start() {
    console.log("WEBHOOK CANNON STARTED");
    await this.queue.consume("webhooks", this.handleWebhookQueue.bind(this));
    await this.queue.consume("events", this.handleEventsQueue.bind(this));
  }

  async handleEventsQueue(data: ConsumeMessage) {
    let event: messages.WebhookEvent;
    try {
      event = JSON.parse(data.content.toString());
      console.log("events: got event message", event);
    } catch (err) {
      console.log("events: error parsing message", err);
      this.queue.ack(data);
      return;
    }

    let ack: boolean;
    try {
      ack = await this.processWebhookEvent(event);
    } catch (err) {
      ack = isRuntimeError(err);
      console.log("handleEventQueue Error ", err);
    } finally {
      if (ack) {
        this.queue.ack(data);
      } else {
        setTimeout(() => this.queue.nack(data), 1000);
      }
    }
  }

  async processWebhookEvent(msg: messages.WebhookEvent): Promise<boolean> {
    const { event, streamId, sessionId, userId } = msg;

    if (event === "playback.accessControl") {
      // Cannot fire this event as a webhook, this is specific to access control and fired there
      return true;
    }

    if (event === "recording.waiting" && sessionId) {
      try {
        await this.handleRecordingWaitingChecks(sessionId);
      } catch (e) {
        console.log(
          `Error handling recording.waiting event sessionId=${sessionId} err=`,
          e
        );
        // only ack the event if it's an explicit unprocessable entity error
        if (e instanceof UnprocessableEntityError) {
          return true;
        }
        throw e;
      }
    }

    const { data: webhooks } = await this.db.webhook.listSubscribed(
      userId,
      event
    );

    console.log(
      `fetched webhooks. userId=${userId} event=${event} webhooks=`,
      webhooks
    );
    if (webhooks.length === 0) {
      return true;
    }

    let stream: DBStream | undefined;
    if (streamId) {
      stream = await this.db.stream.get(streamId, {
        useReplica: false,
      });
      if (!stream) {
        // if stream isn't found. don't fire the webhook, log an error
        throw new Error(
          `webhook Cannon: onTrigger: Stream Not found , streamId: ${streamId}`
        );
      }
      // basic sanitization.
      stream = this.db.stream.addDefaultFields(
        this.db.stream.removePrivateFields({ ...stream })
      );
      delete stream.streamKey;
    }

    let user = await this.db.user.get(userId);
    if (!user || user.suspended) {
      // if user isn't found. don't fire the webhook, log an error
      throw new Error(
        `webhook Cannon: onTrigger: User Not found , userId: ${userId}`
      );
    }

    try {
      const baseTrigger = {
        type: "webhook_trigger" as const,
        timestamp: Date.now(),
        streamId,
        event: msg,
        stream,
        user,
      };
      await Promise.all(
        webhooks.map((webhook) =>
          this.queue.publishWebhook("webhooks.triggers", {
            ...baseTrigger,
            id: uuid(),
            webhook,
          })
        )
      );
    } catch (error) {
      console.log("Error publish webhook trigger message: ", error);
      return false; // nack to retry processing the event
    }
    return true;
  }

  async handleWebhookQueue(data: ConsumeMessage) {
    let trigger: messages.WebhookTrigger;
    try {
      trigger = JSON.parse(data.content.toString());
      console.log("webhookCannon: got trigger message", trigger);
    } catch (err) {
      console.log("webhookCannon: error parsing message", err);
      this.queue.ack(data);
      return;
    }
    try {
      // TODO Activate URL Verification
      await this._fireHook(trigger, false);
    } catch (err) {
      console.log("_fireHook error", err);
      await this.retry(trigger, null, err);
    } finally {
      this.queue.ack(data);
    }
  }

  stop() {
    // this.db.queue.unsetMsgHandler();
    this.running = false;
  }

  disableUrlVerify() {
    this.verifyUrls = false;
  }

  public calcBackoff = (lastInterval?: number): number => {
    if (!lastInterval || lastInterval < 1000) {
      return 5000;
    }
    let newInterval = lastInterval * BACKOFF_COEF;
    if (newInterval > MAX_BACKOFF) {
      return MAX_BACKOFF;
    }
    // RabbitMQ expects integer
    return newInterval | 0;
  };

  retry(
    trigger: messages.WebhookTrigger,
    webhookPayload?: RequestInitWithTimeout,
    err?: Error
  ) {
    if (trigger?.retries >= MAX_RETRIES) {
      console.log(
        `Webhook Cannon| Max Retries Reached, id: ${trigger.id}, streamId: ${trigger.stream?.id}`
      );
      try {
        trigger = webhookFailNotification(trigger, webhookPayload, err);
      } catch (err) {
        console.error(
          `Webhook Cannon| Error sending notification email to user, id: ${trigger.id}, streamId: ${trigger.stream?.id}`
        );
      }
      return;
    }

    trigger = {
      ...trigger,
      id: uuid(),
      timestamp: Date.now(),
      lastInterval: this.calcBackoff(trigger.lastInterval),
      retries: trigger.retries ? trigger.retries + 1 : 1,
    };
    return this.queue.delayedPublishWebhook(
      "webhooks.delayedEmits",
      trigger,
      trigger.lastInterval
    );
  }

  async notifyFailedWebhook(
    trigger: messages.WebhookTrigger,
    params?: RequestInitWithTimeout,
    err?: any
  ) {
    if (!trigger.user.emailValid) {
      console.error(
        `Webhook Cannon| User email is not valid, id: ${trigger.id}, streamId: ${trigger.stream?.id}`
      );
      return;
    }
    if (!(this.supportAddr && this.sendgridTemplateId && this.sendgridApiKey)) {
      console.error(
        `Webhook Cannon| Unable to send notification email to user, id: ${trigger.id}, streamId: ${trigger.stream?.id}`
      );
      console.error(
        `Sending emails requires supportAddr, sendgridTemplateId, and sendgridApiKey`
      );
      return;
    }

    let signatureHeader = "";
    if (params.headers[SIGNATURE_HEADER]) {
      signatureHeader = `-H  "${SIGNATURE_HEADER}: ${params.headers[SIGNATURE_HEADER]}"`;
    }

    let payload = params.body;

    await sendgridEmail({
      email: trigger.user.email,
      supportAddr: this.supportAddr,
      sendgridTemplateId: this.sendgridTemplateId,
      sendgridApiKey: this.sendgridApiKey,
      subject: "Your webhook is failing",
      preheader: "Failure notification",
      buttonText: "Manage your webhooks",
      buttonUrl: `https://${this.frontendDomain}/dashboard/developers/webhooks`,
      unsubscribe: `https://${this.frontendDomain}/contact`,
      text: [
        `Your webhook ${trigger.webhook.name} with url ${trigger.webhook.url} failed to receive our payload in the last 24 hours`,
        //`<code>${payload}</code>`,
        `This is the error we are receiving:`,
        `${err}`,
        //`We disabled your webhook, please check your configuration and try again.`,
        //`If you want to try yourself the call we are making, here is a curl command for that:`,
        //`<code>curl -X POST -H "Content-Type: application/json" -H "user-agent: livepeer.studio" ${signatureHeader} -d '${payload}' ${trigger.webhook.url}</code>`,

        // TODO: Uncomment the additional information here once we get access to Sendgrid to change the tempalte
      ].join("\n\n"),
    });

    console.log(
      `Webhook Cannon| Email sent to user="${trigger.user.email}" id=${trigger.id} streamId=${trigger.stream?.id}`
    );
  }

  async _fireHook(trigger: messages.WebhookTrigger, verifyUrl = true) {
    const { event, webhook, stream, user } = trigger;
    if (!event || !webhook || !user) {
      console.error(
        `invalid webhook trigger message received. type=${trigger.type} message=`,
        trigger
      );
      return;
    }
    console.log(`trying webhook ${webhook.name}: ${webhook.url}`);
    let ips, urlObj, isLocal;
    if (verifyUrl) {
      try {
        urlObj = parseUrl(webhook.url);
        if (urlObj.host) {
          ips = await this.resolver.resolve4(urlObj.hostname);
        }
      } catch (e) {
        console.error("error: ", e);
        throw e;
      }
    }

    // This is mainly useful for local testing
    if (user.admin || verifyUrl === false) {
      isLocal = false;
    } else {
      try {
        if (ips && ips.length) {
          isLocal = isLocalIP(ips[0]);
        } else {
          isLocal = true;
        }
      } catch (e) {
        console.error("isLocal Error", isLocal, e);
        throw e;
      }
    }
    if (isLocal) {
      // don't fire this webhook.
      console.log(
        `webhook ${webhook.id} resolved to a localIP, url: ${webhook.url}, resolved IP: ${ips}`
      );
    } else {
      console.log("preparing to fire webhook ", webhook.url);
      const timestamp = Date.now();
      // go ahead
      let params = {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "livepeer.studio",
        },
        timeout: WEBHOOK_TIMEOUT,
        body: JSON.stringify({
          id: event.id, // allows receiver to check if they have already processed the same event (possible when retrying)
          webhookId: webhook.id,
          createdAt: event.timestamp, // allows receiver to know how long ago event was emitted
          timestamp,
          event: event.event,
          stream,
          payload: event.payload,
        }),
      };

      const sigHeaders = signatureHeaders(
        params.body,
        webhook.sharedSecret,
        timestamp
      );
      params.headers = { ...params.headers, ...sigHeaders };

      const triggerTime = Date.now();
      const startTime = process.hrtime();
      let resp: Response;
      let errorMessage: string;
      let responseBody: string;
      let statusCode: number;
      try {
        logger.info(`webhook ${webhook.id} firing`);
        resp = await fetchWithTimeout(webhook.url, params);
        responseBody = await resp.text();
        statusCode = resp.status;

        if (resp.status >= 200 && resp.status < 300) {
          // 2xx requests are cool. all is good
          logger.info(`webhook ${webhook.id} fired successfully`);
          return true;
        }
        if (resp.status >= 500) {
          await this.retry(
            trigger,
            params,
            new Error("Status code: " + resp.status)
          );
        }

        console.error(
          `webhook ${webhook.id} didn't get 200 back! response status: ${resp.status}`
        );
        // we don't retry on non 400 responses. only on timeouts
        // this.retry(event);
      } catch (e) {
        console.log("firing error", e);
        errorMessage = e.message;
        await this.retry(trigger, params, e);
      } finally {
        await this.storeResponse(webhook, event, resp, startTime, responseBody);
        await this.storeTriggerStatus(
          trigger.webhook,
          triggerTime,
          statusCode,
          errorMessage,
          responseBody
        );
        return;
      }
    }
  }

  async storeTriggerStatus(
    webhook: DBWebhook,
    triggerTime: number,
    statusCode: number,
    errorMessage: string,
    responseBody: string
  ) {
    await storeTriggerStatus(
      webhook,
      triggerTime,
      statusCode,
      errorMessage,
      responseBody
    );
  }

  async storeResponse(
    webhook: DBWebhook,
    event: messages.WebhookEvent,
    resp: Response,
    startTime: [number, number],
    responseBody: string
  ) {
    try {
      const hrDuration = process.hrtime(startTime);
      let encodedResponseBody = Buffer.from(responseBody).toString("base64");

      await this.db.webhookResponse.create({
        id: uuid(),
        webhookId: webhook.id,
        eventId: event.id,
        createdAt: Date.now(),
        duration: hrDuration[0] + hrDuration[1] / 1e9,
        statusCode: resp.status,
        response: {
          body: encodedResponseBody,
          headers: resp.headers.raw(),
          redirected: resp.redirected,
          status: resp.status,
          statusText: resp.statusText,
        },
      });
    } catch (e) {
      console.log(
        `Unable to store response of webhook ${webhook.id} url: ${webhook.url}`
      );
    }
  }

  async handleRecordingWaitingChecks(
    sessionId: string,
    isRetry = false
  ): Promise<string> {
    const session = await this.db.session.get(sessionId, {
      useReplica: false,
    });
    if (!session) {
      throw new UnprocessableEntityError("Session not found");
    }

    const { lastSeen, sourceSegments } = session;
    const activeThreshold = Date.now() - USER_SESSION_TIMEOUT;
    if (!lastSeen || !sourceSegments) {
      throw new UnprocessableEntityError("Session is unused");
    }
    if (lastSeen > activeThreshold) {
      if (isRetry) {
        throw new UnprocessableEntityError("Session is still active");
      }
      // there was an update after the delayed event was sent, so sleep a few
      // secs (up to USER_SESSION_TIMEOUT) and re-check if it actually stopped.
      await sleep(5000 + (lastSeen - activeThreshold));
      return this.handleRecordingWaitingChecks(sessionId, true);
    }

    // if we got to this point, it means we're confident this session is inactive
    // and we can set the child streams isActive=false
    const [childStreams] = await this.db.stream.find({ sessionId });
    await Promise.all(
      childStreams.map((child) => {
        return this.db.stream.update(child.id, { isActive: false });
      })
    );
    const res = await this.db.asset.get(sessionId);
    if (res) {
      throw new UnprocessableEntityError("Session recording already handled");
    }

    await this.recordingToVodAsset(session);
  }

  async recordingToVodAsset(session: DBSession) {
    const id = session.id;
    const playbackId = await generateUniquePlaybackId(id);

    const secondaryStorageEnabled = !(await isExperimentSubject(
      primaryStorageExperiment,
      session.userId
    ));
    const secondaryObjectStoreId =
      secondaryStorageEnabled && this.secondaryVodObjectStoreId;

    // trim the second precision from the time string
    var startedAt = new Date(session.createdAt).toISOString();
    startedAt = startedAt.substring(0, startedAt.length - 8) + "Z";

    try {
      const asset = await createAsset(
        {
          id,
          playbackId,
          userId: session.userId,
          createdAt: session.createdAt,
          source: { type: "recording", sessionId: session.id },
          status: { phase: "waiting", updatedAt: Date.now() },
          name: `live-${startedAt}`,
          objectStoreId:
            secondaryObjectStoreId || this.vodCatalystObjectStoreId,
        },
        this.queue
      );

      const os = await db.objectStore.get(this.recordCatalystObjectStoreId);
      // we can't rate limit this task because it's not a user action
      let url = pathJoin(
        os.publicUrl,
        session.playbackId,
        session.id,
        "output.m3u8"
      );

      const secondaryOs = this.secondaryRecordObjectStoreId
        ? await db.objectStore.get(this.secondaryRecordObjectStoreId)
        : undefined;
      if (secondaryOs) {
        let params = {
          method: "HEAD",
          timeout: 5 * 1000,
        };
        const resp = await fetchWithTimeout(url, params);

        if (resp.status != 200) {
          url = pathJoin(
            secondaryOs.publicUrl,
            session.playbackId,
            session.id,
            "output.m3u8"
          );
        }
      }

      await taskScheduler.createAndScheduleTask(
        "upload",
        {
          upload: {
            url: url,
          },
        },
        undefined,
        asset
      );
    } catch (e) {
      if (e instanceof BadRequestError) {
        throw new UnprocessableEntityError(
          "Asset for the recording session already added"
        );
      } else {
        throw e;
      }
    }
  }
}

export async function storeTriggerStatus(
  webhook: DBWebhook,
  triggerTime: number,
  statusCode?: number,
  errorMessage?: string,
  responseBody?: string
): Promise<void> {
  try {
    let status: DBWebhook["status"] = { lastTriggeredAt: triggerTime };
    let encodedResponseBody = Buffer.from(responseBody).toString("base64");
    if (statusCode >= 300 || !statusCode) {
      status = {
        ...status,
        lastFailure: {
          timestamp: triggerTime,
          statusCode,
          error: errorMessage,
          response: encodedResponseBody,
        },
      };
    }
    await db.webhook.updateStatus(webhook.id, status);
  } catch (e) {
    console.log(
      `Unable to store status of webhook ${webhook.id} url: ${webhook.url}`
    );
  }
}

export function webhookFailNotification(
  trigger: messages.WebhookTrigger,
  webhookPayload: RequestInitWithTimeout,
  err: Error
): messages.WebhookTrigger {
  const lastFailureNotification = trigger?.lastFailureNotification;
  const currentTime = Date.now();
  if (
    !lastFailureNotification ||
    currentTime - lastFailureNotification > 24 * 60 * 60 * 1000
  ) {
    this.notifyFailedWebhook(trigger, webhookPayload, err);
  }

  trigger = {
    ...trigger,
    lastFailureNotification: currentTime,
  };

  return trigger;
}

export function signatureHeaders(
  payload: string,
  sharedSecret: string,
  timestamp: number
): { [key: string]: string } | {} {
  if (!sharedSecret) return {};
  let signature = sign(payload, sharedSecret);
  return { [SIGNATURE_HEADER]: `t=${timestamp},v1=${signature}` };
}
