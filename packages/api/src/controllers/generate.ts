import { RequestHandler, Router } from "express";
import FormData from "form-data";
import multer from "multer";
import { BodyInit } from "node-fetch";
import logger from "../logger";
import { authorizer, validateFormData, validatePost } from "../middleware";
import { fetchWithTimeout } from "../util";
import { experimentSubjectsOnly } from "./experiment";
import { pathJoin2 } from "./helpers";

const AI_GATEWAY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

const multipart = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10485760 }, // 10MiB
});

const app = Router();

app.use(experimentSubjectsOnly("ai-generate"));

function registerGenerateHandler(
  name: string,
  defaultModel: string,
  isJSONReq = false,
): RequestHandler {
  const path = `/${name}`;
  const middlewares = isJSONReq
    ? [validatePost(`${name}-payload`)]
    : [multipart.any(), validateFormData(`${name}-payload`)];
  return app.post(
    path,
    authorizer({}),
    ...middlewares,
    async function proxyGenerate(req, res) {
      const { aiGatewayUrl } = req.config;
      if (!aiGatewayUrl) {
        res.status(500).json({ errors: ["AI Gateway URL is not set"] });
        return;
      }

      const apiUrl = pathJoin2(aiGatewayUrl, path);

      let payload: BodyInit;
      if (isJSONReq) {
        payload = JSON.stringify({
          model_id: defaultModel,
          ...req.body,
        });
      } else {
        const form = new FormData();
        if (!("model_id" in req.body)) {
          form.append("model_id", defaultModel);
        }
        for (const [key, value] of Object.entries(req.body)) {
          form.append(key, value);
        }

        if (!Array.isArray(req.files)) {
          return res.status(400).json({
            errors: ["Expected an array of files"],
          });
        }
        for (const file of req.files) {
          form.append(file.fieldname, file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
            knownLength: file.size,
          });
        }
        payload = form;
      }

      const response = await fetchWithTimeout(apiUrl, {
        method: "POST",
        body: payload,
        timeout: AI_GATEWAY_TIMEOUT,
        headers: isJSONReq ? { "content-type": "application/json" } : {},
      });

      const body = await response.json();
      if (!response.ok) {
        logger.error(
          `Error from generate API ${path} status=${
            response.status
          } body=${JSON.stringify(body)}`,
        );
      }
      if (response.status >= 500) {
        return res.status(500).json({ errors: [`Failed to generate ${name}`] });
      }

      res.status(response.status).json(body);
    },
  );
}

registerGenerateHandler(
  "text-to-image",
  "SG161222/RealVisXL_V4.0_Lightning",
  true,
);
registerGenerateHandler("image-to-image", "timbrooks/instruct-pix2pix");
registerGenerateHandler(
  "image-to-video",
  "stabilityai/stable-video-diffusion-img2vid-xt-1-1",
);
registerGenerateHandler("upscale", "stabilityai/stable-diffusion-x4-upscaler");

export default app;
