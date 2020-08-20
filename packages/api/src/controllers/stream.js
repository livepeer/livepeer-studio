import { parse as parseUrl } from 'url'
import { authMiddleware } from '../middleware'
import { validatePost } from '../middleware'
import Router from 'express/lib/router'
import logger from '../logger'
import uuid from 'uuid/v4'
import wowzaHydrate from './wowza-hydrate'
import { fetchWithTimeout } from '../util'
import { makeNextHREF, trackAction, getWebhooks } from './helpers'
import { generateStreamKey } from './generate-stream-key'
import { geolocateMiddleware } from '../middleware'
import { getBroadcasterHandler } from './broadcaster'

const WEBHOOK_TIMEOUT = 5 * 1000

const isIP = require('is-ip')
const isLocalIP = require('is-local-ip')
let resolver
const dns = require('dns')
if (dns && dns.promises && dns.promises.Resolver) {
  const Resolver = dns.promises.Resolver
  resolver = new Resolver()
}

const app = Router()
const hackMistSettings = (req, profiles) => {
  // FIXME: tempoarily, Mist can only make passthrough FPS streams with 2-second gop sizes
  if (
    !req.headers['user-agent'] ||
    !req.headers['user-agent'].toLowerCase().includes('mistserver')
  ) {
    return profiles
  }
  profiles = profiles || []
  return profiles.map((profile) => {
    profile = {
      ...profile,
      fps: 0,
    }
    if (typeof profile.gop === 'undefined') {
      profile.gop = '2.0'
    }
    return profile
  })
}

app.get('/', authMiddleware({ admin: true }), async (req, res) => {
  let { limit, cursor, streamsonly, sessionsonly, all } = req.query

  const filter1 = all ? (o) => o : (o) => !o[Object.keys(o)[0]].deleted
  let filter2 = (o) => o
  if (streamsonly) {
    filter2 = (o) => !o[Object.keys(o)[0]].parentId
  } else if (sessionsonly) {
    filter2 = (o) => o[Object.keys(o)[0]].parentId
  }

  const resp = await req.store.list({
    prefix: `stream/`,
    cursor,
    limit,
    filter: (o) => filter1(o) && filter2(o),
  })
  let output = resp.data
  res.status(200)

  if (output.length > 0) {
    res.links({ next: makeNextHREF(req, resp.cursor) })
  } // CF doesn't know what this means
  output = output.map((o) => o[Object.keys(o)[0]])
  res.json(output)
})

app.get('/sessions/:parentId', authMiddleware({}), async (req, res) => {
  const { parentId, limit, cursor } = req.params
  logger.info(`cursor params ${cursor}, limit ${limit}`)

  const stream = await req.store.get(`stream/${parentId}`)
  if (
    !stream ||
    stream.deleted ||
    (stream.userId !== req.user.id && !req.isUIAdmin)
  ) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }

  const { data: streams, cursor: cursorOut } = await req.store.queryObjects({
    kind: 'stream',
    query: { parentId },
    cursor,
    limit,
  })
  res.status(200)
  if (streams.length > 0 && cursorOut) {
    res.links({ next: makeNextHREF(req, cursorOut) })
  }
  res.json(streams)
})

app.get('/user/:userId', authMiddleware({}), async (req, res) => {
  let { limit, cursor, streamsonly, sessionsonly } = req.query
  logger.info(`cursor params ${req.query.cursor}, limit ${limit}`)

  if (req.user.admin !== true && req.user.id !== req.params.userId) {
    res.status(403)
    return res.json({
      errors: ['user can only request information on their own streams'],
    })
  }

  let filter = (o) => !o.deleted
  if (streamsonly) {
    filter = (o) => !o.deleted && !o.parentId
  } else if (sessionsonly) {
    filter = (o) => !o.deleted && o.parentId
  }

  const { data: streams, cursor: cursorOut } = await req.store.queryObjects({
    kind: 'stream',
    query: { userId: req.params.userId },
    cursor,
    limit,
    filter,
  })
  res.status(200)
  if (streams.length > 0 && cursorOut) {
    res.links({ next: makeNextHREF(req, cursorOut) })
  }
  res.json(streams)
})

app.get('/:id', authMiddleware({}), async (req, res) => {
  const stream = await req.store.get(`stream/${req.params.id}`)
  if (
    !stream ||
    ((stream.userId !== req.user.id || stream.deleted) && !req.isUIAdmin)
  ) {
    // do not reveal that stream exists
    res.status(404)
    return res.json({ errors: ['not found'] })
  }
  res.status(200)
  res.json(stream)
})

// returns stream by steamKey
app.get('/playback/:playbackId', authMiddleware({}), async (req, res) => {
  console.log(`headers:`, req.headers)
  const {
    data: [stream],
  } = await req.store.queryObjects({
    kind: 'stream',
    query: { playbackId: req.params.playbackId },
  })
  if (
    !stream ||
    ((stream.userId !== req.user.id || stream.deleted) && !req.user.admin)
  ) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }
  res.status(200)
  res.json(stream)
})

// returns stream by steamKey
app.get('/key/:streamKey', authMiddleware({}), async (req, res) => {
  const {
    data: [stream],
  } = await req.store.queryObjects({
    kind: 'stream',
    query: { streamKey: req.params.streamKey },
  })
  if (
    !stream ||
    ((stream.userId !== req.user.id || stream.deleted) && !req.user.admin)
  ) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }
  res.status(200)
  res.json(stream)
})

// Needed for Mist server
app.get(
  '/:streamId/broadcaster',
  geolocateMiddleware({}),
  getBroadcasterHandler,
)

async function generateUniqueStreamKey(store, otherKeys) {
  while (true) {
    const streamId = await generateStreamKey()
    const qres = await store.query({
      kind: 'stream',
      query: { streamId },
    })
    if (!qres.data.length && !otherKeys.includes(streamId)) {
      return streamId
    }
  }
}

app.post(
  '/:streamId/stream',
  authMiddleware({}),
  validatePost('stream'),
  async (req, res) => {
    if (!req.body || !req.body.name) {
      res.status(422)
      return res.json({
        errors: ['missing name'],
      })
    }

    const stream = await req.store.get(`stream/${req.params.streamId}`)
    if (
      !stream ||
      ((stream.userId !== req.user.id || stream.deleted) &&
        !(req.user.admin && !stream.deleted))
    ) {
      // do not reveal that stream exists
      res.status(404)
      return res.json({ errors: ['not found'] })
    }

    const id = uuid()
    const createdAt = Date.now()

    const doc = wowzaHydrate({
      ...req.body,
      kind: 'stream',
      userId: stream.userId,
      renditions: {},
      objectStoreId: stream.objectStoreId,
      recordObjectStoreId: stream.recordObjectStoreId,
      record: stream.record,
      id,
      createdAt,
      parentId: stream.id,
    })

    doc.profiles = hackMistSettings(req, doc.profiles)

    try {
      await req.store.create(doc)
      trackAction(
        req.user.id,
        req.user.email,
        { name: 'Stream Session Created' },
        req.config.segmentApiKey,
      )
    } catch (e) {
      console.error(e)
      throw e
    }
    res.status(201)
    res.json(doc)
  },
)

app.post('/', authMiddleware({}), validatePost('stream'), async (req, res) => {
  if (!req.body || !req.body.name) {
    res.status(422)
    return res.json({
      errors: ['missing name'],
    })
  }
  const id = uuid()
  const createdAt = Date.now()
  const streamKey = await generateUniqueStreamKey(req.store, [])
  // Mist doesn't allow dashes in the URLs
  const playbackId = (
    await generateUniqueStreamKey(req.store, [streamKey])
  ).replace(/-/g, '')

  let objectStoreId
  if (req.body.objectStoreId) {
    await req.store.get(`objectstores/${req.user.id}/${req.body.objectStoreId}`)
    objectStoreId = req.body.objectStoreId
  }

  const doc = wowzaHydrate({
    ...req.body,
    kind: 'stream',
    userId: req.user.id,
    renditions: {},
    objectStoreId,
    id,
    createdAt,
    streamKey,
    playbackId,
    createdByTokenName: req.tokenName,
  })

  doc.profiles = hackMistSettings(req, doc.profiles)

  await Promise.all([
    req.store.create(doc),
    trackAction(
      req.user.id,
      req.user.email,
      { name: 'Stream Created' },
      req.config.segmentApiKey,
    ),
  ])

  res.status(201)
  res.json(doc)
})

app.put('/:id/setactive', authMiddleware({}), async (req, res) => {
  const { id } = req.params
  // logger.info(`got /setactive/${id}: ${JSON.stringify(req.body)}`)
  const stream = await req.store.get(`stream/${id}`, false)
  if (!stream || stream.deleted || !req.user.admin) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }
  console.log('/setactive req.body: ', req.body)
  if (req.body.active) {
    // trigger the webhooks, reference https://github.com/livepeer/livepeerjs/issues/791#issuecomment-658424388
    // this could be used instead of /webhook/:id/trigger (althoughs /trigger requires admin access )
    console.log('webhooks: sanitizing stream object..')
    // basic sanitization.
    let sanitized = { ...stream }
    delete sanitized.streamKey

    const {data: webhooksList} = await getWebhooks(
      req.store,
      stream.userId,
      'streamStarted'
    )

    console.log('webhooksList: ', webhooksList)
    try {
      const responses = await Promise.all(
        webhooksList.map(async (webhook, key) => {
          // console.log('webhook: ', webhook)
          console.log(`trying webhook ${webhook.name}: ${webhook.url}`)
          let ips, urlObj, isLocal, isIp
          try {
            isIp = isIP(webhook.url)
            urlObj = parseUrl(webhook.url)
            if (isIp && urlObj.hostname) {
              ips = [urlObj.hostname]
            } else {
              ips = await resolver.resolve4(urlObj.hostname)
            }
          } catch (e) {
            console.error('error: ', e)
            throw e
          }

          // This is mainly useful for local testing
          if (req.user.admin) {
            isLocal = false
          } else {
            try {
              if (ips && ips.length) {
                isLocal = isLocalIP(ips[0])
              } else {
                isLocal = true
              }
            } catch (e) {
              console.error('isLocal Error', isLocal, e)
              throw e
            }
          }
          if (isLocal) {
            // don't fire this webhook.
            console.log(
              `webhook ${webhook.id} resolved to a localIP, url: ${webhook.url}, resolved IP: ${ips}`,
            )
          } else {
            console.log('preparing to fire webhook ', webhook.url)
            // go ahead
            let params = {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'user-agent': 'livepeer.com',
              },
              timeout: WEBHOOK_TIMEOUT,
              body: JSON.stringify({
                id: webhook.id,
                event: webhook.event,
                stream: sanitized,
              }),
            }

            try {
              logger.info(`webhook ${webhook.id} firing`)
              let resp = await fetchWithTimeout(webhook.url, params)
              if (resp.status >= 200 && resp.status < 300) {
                // 2xx requests are cool.
                // all is good
                logger.info(`webhook ${webhook.id} fired successfully`)
                return true
              }
              console.error(
                `webhook ${webhook.id} didn't get 200 back! response status: ${resp.status}`,
              )
              return !webhook.blocking
            } catch (e) {
              console.log('firing error', e)
              return !webhook.blocking
            }
          }
        }),
      )
      if (responses.some((o) => !o)) {
        // at least one of responses is false, blocking this stream
        res.status(403)
        return res.end()
      }
    } catch (e) {
      console.error('webhook loop error', e)
      res.status(400)
      return res.end()
    }
  }

  stream.isActive = req.body.active
  stream.lastSeen = +new Date()
  await req.store.replace(stream)

  if (stream.parentId) {
    const pStream = await req.store.get(`stream/${id}`, false)
    if (pStream && !pStream.deleted) {
      pStream.isActive = req.body.active
      pStream.lastSeen = stream.lastSeen
      await req.store.replace(pStream)
    }
  }

  res.status(204)
  res.end()
})

app.patch('/:id/record', authMiddleware({}), async (req, res) => {
  const { id } = req.params
  const stream = await req.store.get(`stream/${id}`, false)
  if (!stream || stream.deleted) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }
  if (stream.parentId) {
    res.status(400)
    return res.json({ errors: ["can't set for session"] })
  }
  if (req.body.record === undefined) {
    res.status(400)
    return res.json({ errors: ['record field required'] })
  }
  console.log(`set stream ${id} record ${req.body.record}`)

  stream.record = !!req.body.record
  await req.store.replace(stream)

  res.status(204)
  res.end()
})

app.delete('/:id', authMiddleware({}), async (req, res) => {
  const { id } = req.params
  const stream = await req.store.get(`stream/${id}`, false)
  if (
    !stream ||
    stream.deleted ||
    (stream.userId !== req.user.id && !req.isUIAdmin)
  ) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }

  stream.deleted = true
  await req.store.replace(stream)

  res.status(204)
  res.end()
})

app.post('/hook', async (req, res) => {
  if (!req.body || !req.body.url) {
    res.status(422)
    return res.json({
      errors: ['missing url'],
    })
  }
  // logger.info(`got webhook: ${JSON.stringify(req.body)}`)
  // These are of the form /live/:manifestId/:segmentNum.ts
  let { pathname, protocol } = parseUrl(req.body.url)
  // Protocol is sometimes undefined, due to https://github.com/livepeer/go-livepeer/issues/1006
  if (!protocol) {
    protocol = 'http:'
  }
  if (protocol === 'https:') {
    protocol = 'http:'
  }
  if (protocol !== 'http:' && protocol !== 'rtmp:') {
    res.status(422)
    return res.json({ errors: [`unknown protocol: ${protocol}`] })
  }

  // Allowed patterns, for now:
  // http(s)://broadcaster.example.com/live/:streamId/:segNum.ts
  // rtmp://broadcaster.example.com/live/:streamId
  const [live, streamId, ...rest] = pathname.split('/').filter((x) => !!x)
  // logger.info(`live=${live} streamId=${streamId} rest=${rest}`)

  if (!streamId) {
    res.status(401)
    return res.json({ errors: ['stream key is required'] })
  }
  if (protocol === 'rtmp:' && rest.length > 0) {
    res.status(422)
    return res.json({
      errors: [
        'RTMP address should be rtmp://example.com/live. Stream key should be a UUID.',
      ],
    })
  }
  if (protocol === 'http:' && rest.length > 3) {
    res.status(422)
    return res.json({
      errors: [
        'acceptable URL format: http://example.com/live/:streamId/:number.ts',
      ],
    })
  }

  if (live !== 'live' && live !== 'recordings') {
    res.status(404)
    return res.json({ errors: ['ingest url must start with /live/'] })
  }

  const stream = await req.store.get(`stream/${streamId}`, false)
  if (!stream) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }
  let objectStore,
    recordObjectStore = undefined
  if (stream.objectStoreId) {
    const os = await req.store.get(
      `object-store/${stream.objectStoreId}`,
      false,
    )
    if (!os) {
      res.status(500)
      return res.json({
        errors: [
          `data integity error: object store ${stream.objectStoreId} not found`,
        ],
      })
    }
    objectStore = os.url
  }
  if (
    stream.record &&
    req.config.recordObjectStoreId &&
    !stream.recordObjectStoreId
  ) {
    stream.recordObjectStoreId = req.config.recordObjectStoreId
    await req.store.replace(stream)
  }
  if (
    (live === 'live' && stream.record && stream.recordObjectStoreId) ||
    (live !== 'live' && stream.recordObjectStoreId)
  ) {
    const ros = await req.store.get(
      `object-store/${stream.recordObjectStoreId}`,
      false,
    )
    if (!ros) {
      res.status(500)
      return res.json({
        errors: [
          `data integity error: record object store ${stream.recordObjectStoreId} not found`,
        ],
      })
    }
    recordObjectStore = ros.url
  }

  res.json({
    manifestId: streamId,
    presets: stream.presets,
    profiles: stream.profiles,
    objectStore,
    recordObjectStore,
  })
})

export default app
