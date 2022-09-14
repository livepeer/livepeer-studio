import { authorizer } from "../middleware";
import { validatePost } from "../middleware";
import { Router } from "express";
import {
  FieldsMap,
  makeNextHREF,
  parseFilters,
  parseOrder,
  toStringValues,
} from "./helpers";
import { v4 as uuid } from "uuid";
import sql from "sql-template-strings";
import { db } from "../store";

const app = Router();

const fieldsMap: FieldsMap = {
  id: `object_store.ID`,
  name: { val: `object_store.data->>'name'`, type: "full-text" },
  url: `object_store.data->>'url'`,
  publicUrl: `object_store.data->>'publicUrl'`,
  disabled: `object_store.data->'disabled'`,
  createdAt: `object_store.data->'createdAt'`,
  userId: `object_store.data->>'userId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
};

app.get("/", authorizer({}), async (req, res) => {
  let { limit, all, cursor, userId, order, filters } = toStringValues(
    req.query
  );
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }

  if (req.user.admin && !userId) {
    const query = parseFilters(fieldsMap, filters);
    if (!all || all === "false") {
      query.push(sql`object_store.data->>'deleted' IS NULL`);
    }

    const fields =
      " object_store.id as id, object_store.data as data, users.id as usersId, users.data as usersdata";
    const from = `object_store left join users on object_store.data->>'userId' = users.id`;
    const [output, newCursor] = await db.objectStore.find(query, {
      limit,
      cursor,
      fields,
      from,
      order: parseOrder(fieldsMap, order),
      process: ({ data, usersdata }) => {
        return { ...data, user: db.user.cleanWriteOnlyResponse(usersdata) };
      },
    });

    res.status(200);

    if (output.length > 0 && newCursor) {
      res.links({ next: makeNextHREF(req, newCursor) });
    }
    return res.json(output);
  }
  if (!req.user.admin) {
    userId = req.user.id;
  }

  const query = parseFilters(fieldsMap, filters);
  query.push(sql`object_store.data->>'userId' = ${userId}`);
  query.push(sql`object_store.data->>'deleted' IS NULL`);

  let [data, newCursor] = await db.objectStore.find([query], {
    cursor,
    limit,
  });
  if (!req.user.admin) {
    data = db.objectStore.cleanWriteOnlyResponses(data);
  }

  if (data.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  res.status(200).json(data);
});

app.get("/:id", authorizer({}), async (req, res) => {
  let os = await db.objectStore.get(req.params.id);
  if (!req.user.admin) {
    os = db.objectStore.cleanWriteOnlyResponse(os);
  }
  if (!os || os.deleted) {
    return res.status(404).json({ errors: ["not found"] });
  }

  if (req.user.admin !== true && req.user.id !== os.userId) {
    return res.status(403).json({
      errors: ["user can only request information on their own object stores"],
    });
  }

  res.json(os);
});

app.post(
  "/",
  authorizer({}),
  validatePost("object-store"),
  async (req, res) => {
    const id = uuid();

    await db.objectStore.create({
      id: id,
      url: req.body.url,
      name: req.body.name,
      publicUrl: req.body.publicUrl,
      userId: req.user.id,
      createdAt: Date.now(),
    });

    const store = await db.objectStore.get(id, { useReplica: false });

    if (store) {
      res.status(201);
      res.json(db.objectStore.cleanWriteOnlyResponse(store));
    } else {
      res.status(403);
      res.json({ errors: ["store not created"] });
    }
  }
);

app.delete("/:id", authorizer({}), async (req, res) => {
  const { id } = req.params;
  const objectStore = await db.objectStore.get(id);
  if (!objectStore) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (!req.user.admin && req.user.id !== objectStore.userId) {
    res.status(403);
    return res.json({
      errors: ["users may only delete their own object stores"],
    });
  }
  await db.objectStore.markDeleted(id);
  res.status(204);
  res.end();
});

app.patch("/:id", authorizer({}), async (req, res) => {
  const { id } = req.params;
  const objectStore = await db.objectStore.get(id);
  if (!objectStore) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (!req.user.admin && req.user.id !== objectStore.userId) {
    res.status(403);
    return res.json({
      errors: ["users may change only their own object stores"],
    });
  }
  const { disabled, url } = req.body;
  if (
    (disabled === undefined && url === undefined) ||
    typeof url !== "string"
  ) {
    res.status(400);
    return res.json({ errors: ["disabled or url fields required"] });
  }
  console.log(`set object store ${id} disabled=${disabled} url=${url}`);
  await db.objectStore.update(id, { disabled: !!disabled, url });
  res.status(204);
  res.end();
});

export default app;
