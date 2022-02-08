import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import { Router } from "express";
import { v4 as uuid } from "uuid";
import {
  makeNextHREF,
  parseFilters,
  parseOrder,
  toStringValues,
  FieldsMap,
} from "./helpers";
import { db } from "../store";
import sql from "sql-template-strings";
import { Task } from "../schema/types";

const app = Router();

function validateTaskPayload(
  id: string,
  userId: string,
  createdAt: number,
  payload
) {
  return {
    id,
    userId,
    createdAt,
    name: payload.name,
    type: payload.type,
  };
}

const fieldsMap: FieldsMap = {
  id: `task.ID`,
  name: { val: `task.data->>'name'`, type: "full-text" },
  createdAt: `task.data->'createdAt'`,
  userId: `task.data->>'userId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
  type: `task.data->>'type'`,
};

app.get("/", authMiddleware({}), async (req, res) => {
  let { limit, cursor, all, event, allUsers, order, filters, count } =
    toStringValues(req.query);
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }

  if (req.user.admin && allUsers && allUsers !== "false") {
    const query = parseFilters(fieldsMap, filters);
    if (!all || all === "false") {
      query.push(sql`task.data->>'deleted' IS NULL`);
    }

    let fields =
      " task.id as id, task.data as data, users.id as usersId, users.data as usersdata";
    if (count) {
      fields = fields + ", count(*) OVER() AS count";
    }
    const from = `task left join users on task.data->>'userId' = users.id`;
    const [output, newCursor] = await db.task.find(query, {
      limit,
      cursor,
      fields,
      from,
      order: parseOrder(fieldsMap, order),
      process: ({ data, usersdata, count: c }) => {
        if (count) {
          res.set("X-Total-Count", c);
        }
        return { ...data, user: db.user.cleanWriteOnlyResponse(usersdata) };
      },
    });

    res.status(200);

    if (output.length > 0 && newCursor) {
      res.links({ next: makeNextHREF(req, newCursor) });
    }
    return res.json(output);
  }

  const query = parseFilters(fieldsMap, filters);
  query.push(sql`task.data->>'userId' = ${req.user.id}`);

  if (!all || all === "false") {
    query.push(sql`task.data->>'deleted' IS NULL`);
  }

  let fields = " task.id as id, task.data as data";
  if (count) {
    fields = fields + ", count(*) OVER() AS count";
  }
  const from = `task`;
  const [output, newCursor] = await db.task.find(query, {
    limit,
    cursor,
    fields,
    from,
    order: parseOrder(fieldsMap, order),
    process: ({ data, count: c }) => {
      if (count) {
        res.set("X-Total-Count", c);
      }
      return { ...data };
    },
  });

  res.status(200);

  if (output.length > 0) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }

  return res.json(output);
});

app.get("/:id", authMiddleware({}), async (req, res) => {
  const task = await db.task.get(req.params.id);
  if (!task) {
    res.status(404);
    return res.json({
      errors: ["not found"],
    });
  }

  if (req.user.admin !== true && req.user.id !== task.userId) {
    res.status(403);
    return res.json({
      errors: ["user can only request information on their own tasks"],
    });
  }

  res.json(task);
});

app.post(
  "/",
  authMiddleware({ anyAdmin: true }),
  validatePost("task"),
  async (req, res) => {
    const id = uuid();
    const doc = validateTaskPayload(id, req.user.id, Date.now(), req.body);

    await db.task.create(doc);

    res.status(201);
    res.json(doc);
  }
);

app.post(
  "/:id/status",
  authMiddleware({ anyAdmin: true }),
  async (req, res) => {
    // update status of a specific task
    const { id } = req.params;
    const task = await db.task.get(id);
    if (!task) {
      return res.status(404).json({ errors: ["not found"] });
    }

    const doc = req.body.status;
    if (!doc) {
      return res.status(422).json({ errors: ["missing status in payload"] });
    } else if (doc.phase && doc.phase !== "running") {
      return res
        .status(422)
        .json({ errors: ["can only update phase to running"] });
    }
    const status: Task["status"] = {
      ...task.status,
      phase: "running",
      progress: doc.progress,
      updatedAt: Date.now(),
    };
    await db.task.update(id, { status });

    res.status(200);
    res.json({ id, status });
  }
);

app.delete("/:id", authMiddleware({}), async (req, res) => {
  const { id } = req.params;
  const task = await db.task.get(id);
  if (!task) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (!req.user.admin && req.user.id !== task.userId) {
    res.status(403);
    return res.json({
      errors: ["users may only delete their own tasks"],
    });
  }
  await db.task.delete(id);
  res.status(204);
  res.end();
});

// TODO: Remove this API.
app.patch(
  "/:id",
  authMiddleware({ anyAdmin: true }),
  validatePost("task"),
  async (req, res) => {
    // update a specific task
    const task = await db.task.get(req.body.id);
    if (!req.user.admin) {
      res.status(403);
      return res.json({ errors: ["Forbidden"] });
    }

    const doc = req.body;
    await db.task.update(req.body.id, doc);

    res.status(200);
    res.json({ id: req.body.id });
  }
);

export default app;
