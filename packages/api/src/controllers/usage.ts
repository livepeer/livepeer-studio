import Router from "express/lib/router";
import { db } from "../store";
import { authorizer, validatePost } from "../middleware";
import { products } from "../config";
import { reportUsage } from "./stripe";

const app = Router();

app.get("/", authorizer({ anyAdmin: true }), async (req, res) => {
  let { fromTime, toTime } = req.query;

  // if time range isn't specified return all usage
  if (!fromTime && !toTime) {
    fromTime = +new Date(2020, 0); // start at beginning
    toTime = +new Date();
  }

  const cachedUsageHistory = await db.stream.cachedUsageHistory(
    fromTime,
    toTime,
    {
      useReplica: true,
    }
  );

  res.status(200);
  res.json(cachedUsageHistory);
});

app.post(
  "/update",
  authorizer({ anyAdmin: true }),
  validatePost("usage"),
  async (req, res) => {
    let { fromTime, toTime } = req.query;

    /* New usage report for billing
    let token = req.token;
    // New automated billing usage report
    let result = await reportUsage(req, token);

    res.status(200);
    res.json(result);
    let { fromTime, toTime } = req.query;
    */

    // if time range isn't specified return all usage
    if (!fromTime) {
      let rows = (
        await db.usage.find(
          {},
          { limit: 1, order: "data->>'date' DESC", useReplica: true }
        )
      )[0];

      if (rows.length) {
        fromTime = rows[0].date; // get last updated date from cache
      } else {
        fromTime = +new Date(2020, 0); // start at beginning
      }
    }

    if (!toTime) {
      toTime = +new Date();
    }

    let usageHistory = await db.stream.usageHistory(fromTime, toTime, {
      useReplica: true,
    });

    // store each day of usage
    for (const row of usageHistory) {
      const dbRow = await req.store.get(`usage/${row.id}`);
      // if row already exists in cache, update it, otherwise create it
      if (dbRow) {
        await req.store.replace({ kind: "usage", ...row });
      } else {
        await req.store.create({ kind: "usage", ...row });
      }
    }

    res.status(200);
    res.json(usageHistory);
  }
);

export default app;
