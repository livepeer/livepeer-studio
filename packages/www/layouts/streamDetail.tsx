import {
  Box,
  Button,
  Flex,
  Heading,
  Link as A,
  Status,
  Badge,
  Tooltip,
  Text,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  HoverCardRoot,
  HoverCardContent,
  HoverCardTrigger,
  useSnackbar,
} from "@livepeer/design-system";
import Layout from "layouts/dashboard";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useRouter } from "next/router";
import { useApi, useLoggedIn } from "hooks";
import { useEffect, useState, useRef, useMemo } from "react";
import { isStaging } from "lib/utils";
import RelativeTime from "components/Dashboard/RelativeTime";
import {
  CopyIcon as Copy,
  QuestionMarkCircledIcon as Help,
  PauseIcon,
  ChevronDownIcon,
} from "@radix-ui/react-icons";
import Spinner from "components/Dashboard/Spinner";
import Player from "components/Dashboard/Player";
import Record from "components/Dashboard/StreamDetails/Record";
import Terminate from "components/Dashboard/StreamDetails/Terminate";
import Suspend from "components/Dashboard/StreamDetails/Suspend";
import Delete from "components/Dashboard/StreamDetails/Delete";
import StatusBadge, {
  Variant as StatusVariant,
} from "@components/Dashboard/StatusBadge";

type ShowURLProps = {
  url: string;
  shortendUrl?: string;
  anchor?: boolean;
};

const ShowURL = ({ url, shortendUrl, anchor = false }: ShowURLProps) => {
  const [isCopied, setCopied] = useState(0);
  const [openSnackbar] = useSnackbar();

  useEffect(() => {
    if (isCopied) {
      const interval = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(interval);
    }
  }, [isCopied]);

  return (
    <HoverCardRoot openDelay={200}>
      <HoverCardTrigger>
        <Flex css={{ ai: "center" }}>
          <CopyToClipboard
            text={url}
            onCopy={() => {
              openSnackbar("Copied to clipboard");
              setCopied(2000);
            }}>
            <Flex
              css={{
                alignItems: "center",
                cursor: "pointer",
                ml: 0,
                mr: 0,
              }}>
              {anchor ? (
                <A
                  css={{ fontSize: "$2", mr: "$1" }}
                  href={url}
                  target="_blank">
                  {shortendUrl ? shortendUrl : url}
                </A>
              ) : (
                <Box css={{ fontSize: "$2", mr: "$1" }}>
                  {shortendUrl ? shortendUrl : url}
                </Box>
              )}
              <Copy
                css={{
                  mr: "$2",
                  width: 14,
                  height: 14,
                  color: "$hiContrast",
                }}
              />
            </Flex>
          </CopyToClipboard>
        </Flex>
      </HoverCardTrigger>
      <HoverCardContent>
        <Text
          variant="gray"
          css={{
            backgroundColor: "$panel",
            borderRadius: 6,
            px: "$3",
            py: "$1",
            fontSize: "$1",
            display: "flex",
            ai: "center",
          }}>
          <Box>{isCopied ? "Copied" : "Copy to Clipboard"}</Box>
        </Text>
      </HoverCardContent>
    </HoverCardRoot>
  );
};

const Cell = ({ children, css = {} }) => {
  return (
    <Flex align="center" css={{ height: 22, mb: "$3", ...css }}>
      {children}
    </Flex>
  );
};

const ClipBut = ({ text }) => {
  const [isCopied, setCopied] = useState(0);
  const [openSnackbar] = useSnackbar();

  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  return (
    <HoverCardRoot openDelay={200}>
      <HoverCardTrigger>
        <Flex css={{ ai: "center" }}>
          <CopyToClipboard
            text={text}
            onCopy={() => {
              openSnackbar("Copied to clipboard");
              setCopied(2000);
            }}>
            <Flex
              css={{
                alignItems: "center",
                cursor: "pointer",
                ml: 0,
                mr: 0,
              }}>
              <Box css={{ mr: "$1" }}>{text}</Box>
              <Copy
                css={{
                  mr: "$2",
                  width: 14,
                  height: 14,
                  color: "$hiContrast",
                }}
              />
            </Flex>
          </CopyToClipboard>
        </Flex>
      </HoverCardTrigger>
      <HoverCardContent>
        <Text
          variant="gray"
          css={{
            backgroundColor: "$panel",
            borderRadius: 6,
            px: "$3",
            py: "$1",
            fontSize: "$1",
            display: "flex",
            ai: "center",
          }}>
          <Box>{isCopied ? "Copied" : "Copy to Clipboard"}</Box>
        </Text>
      </HoverCardContent>
    </HoverCardRoot>
  );
};

const StreamDetail = ({
  breadcrumbs,
  children,
  stream,
  streamHealth,
  invalidateStream,
  setSwitchTab,
  activeTab = "Overview",
}) => {
  useLoggedIn();
  const { user, getIngest, getAdminStreams } = useApi();
  const userIsAdmin = user && user.admin;
  const router = useRouter();
  const { query } = router;
  const id = query.id;
  const [_, setIngest] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [isCopied, setCopied] = useState(0);
  const [keyRevealed, setKeyRevealed] = useState(false);
  const [lastSession, setLastSession] = useState(null);
  const [lastSessionLoading, setLastSessionLoading] = useState(false);

  useEffect(() => {
    if (user && user.admin && stream && !lastSessionLoading) {
      setLastSessionLoading(true);
      getAdminStreams({
        sessionsonly: true,
        limit: 1,
        order: "createdAt-true",
        filters: [{ id: "parentId", value: stream.id }],
        userId: stream.userId,
      })
        .then((res) => {
          const [streamsOrError] = res;
          if (Array.isArray(streamsOrError) && streamsOrError.length > 0) {
            setLastSession(streamsOrError[0]);
          }
        })
        .catch((e) => console.log(e))
        .finally(() => setLastSessionLoading(false));
    }
  }, [user, stream]);

  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  useEffect(() => {
    getIngest(true)
      .then((ingest) => {
        if (Array.isArray(ingest)) {
          ingest.sort((a, b) => a.base.localeCompare(b.base));
        }
        setIngest(ingest);
      })
      .catch((err) => console.error(err)); // todo: surface this
  }, [id]);

  const healthState = useMemo(() => {
    if (!stream?.isActive) return null;

    const activeCond = streamHealth?.conditions.find(
      (c) => c.type === "Active"
    );
    const healthyCond = streamHealth?.healthy;
    const healthValid =
      activeCond?.status &&
      healthyCond?.status != null &&
      healthyCond.lastProbeTime >= activeCond.lastTransitionTime;
    return !healthValid
      ? StatusVariant.Pending
      : healthyCond.status
      ? StatusVariant.Healthy
      : StatusVariant.Unhealthy;
  }, [stream?.isActive, streamHealth]);

  if (!user) {
    return <Layout />;
  }

  let { broadcasterHost, region } = stream || {};
  if (!broadcasterHost && lastSession && lastSession.broadcasterHost) {
    broadcasterHost = lastSession.broadcasterHost;
  }
  if (!region && lastSession && lastSession.region) {
    region = lastSession.region;
  }

  const playbackId = (stream || {}).playbackId || "";
  const domain = isStaging() ? "monster" : "com";
  const globalIngestUrl = `rtmp://rtmp.livepeer.${domain}/live`;
  const globalPlaybackUrl = `https://livepeercdn.${domain}/hls/${playbackId}/index.m3u8`;
  const globalSrtIngestUrl = `srt://rtmp.livepeer.${domain}:2935?streamid=${
    stream?.streamKey || ""
  }`;

  return (
    <Layout id="streams" breadcrumbs={breadcrumbs}>
      <Box css={{ px: "$6", py: "$7" }}>
        {stream ? (
          <>
            <Flex>
              <Box
                css={{
                  minWidth: 424,
                  flex: "0 0 33%",
                }}>
                <Flex
                  justify="between"
                  align="end"
                  css={{
                    pb: "$3",
                    mb: "$5",
                    width: "100%",
                  }}>
                  <Heading size="2">
                    <Flex css={{ ai: "center" }}>
                      <Box
                        css={{
                          fontWeight: 600,
                          letterSpacing: "0",
                          mr: "$2",
                        }}>
                        {stream.name}
                      </Box>
                      {!healthState ? null : (
                        <StatusBadge
                          variant={healthState}
                          timestamp={streamHealth?.healthy?.lastProbeTime}
                          css={{ mt: "$1", letterSpacing: 0 }}
                        />
                      )}
                      {stream.suspended && (
                        <Badge
                          size="2"
                          variant="red"
                          css={{
                            ml: "$1",
                            mt: "$1",
                            letterSpacing: 0,
                          }}>
                          <Box css={{ mr: 5 }}>
                            <PauseIcon />
                          </Box>
                          Suspended
                        </Badge>
                      )}
                    </Flex>
                  </Heading>
                </Flex>

                <Box>
                  <Box
                    css={{
                      maxWidth: "470px",
                      justifySelf: "flex-end",
                      width: "100%",
                    }}>
                    <Box
                      css={{
                        borderRadius: "$3",
                        overflow: "hidden",
                        position: "relative",
                        mb: "$7",
                      }}>
                      {stream.isActive ? (
                        <>
                          <Badge
                            size="2"
                            variant="green"
                            css={{
                              position: "absolute",
                              zIndex: 1,
                              left: 10,
                              top: 10,
                              letterSpacing: 0,
                            }}>
                            <Box css={{ mr: 5 }}>
                              <Status size="1" variant="green" />
                            </Box>
                            Active
                          </Badge>
                          <Player src={globalPlaybackUrl} />
                        </>
                      ) : (
                        <Box
                          css={{
                            width: "100%",
                            height: 265,
                            borderRadius: "$2",
                            overflow: "hidden",
                            position: "relative",
                            bc: "#28282c",
                          }}>
                          <Badge
                            size="2"
                            css={{
                              backgroundColor: "$primary7",
                              position: "absolute",
                              zIndex: 1,
                              left: 10,
                              top: 10,
                              letterSpacing: 0,
                            }}>
                            <Box css={{ mr: 5 }}>
                              <Status
                                css={{ backgroundColor: "$primary9" }}
                                size="1"
                              />
                            </Box>
                            Idle
                          </Badge>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Box
                    css={{
                      borderBottom: "1px solid",
                      borderColor: "$neutral6",
                      pb: "$2",
                      mb: "$4",
                      width: "100%",
                    }}>
                    <Heading size="1" css={{ fontWeight: 600 }}>
                      Details
                    </Heading>
                  </Box>
                  <Flex
                    css={{
                      justifyContent: "flex-start",
                      alignItems: "baseline",
                      flexDirection: "column",
                    }}>
                    <Box
                      css={{
                        display: "grid",
                        alignItems: "center",
                        gridTemplateColumns: "10em auto",
                        width: "100%",
                        fontSize: "$2",
                        position: "relative",
                      }}>
                      <Cell css={{ color: "$primary11" }}>Stream name</Cell>
                      <Cell>{stream.name}</Cell>
                      <Cell css={{ color: "$primary11" }}>Stream ID</Cell>
                      <Cell>
                        <ClipBut text={stream.id} />
                      </Cell>
                      <Cell css={{ color: "$primary11" }}>Stream key</Cell>
                      <Cell>
                        {keyRevealed ? (
                          <Flex>
                            <ClipBut text={stream.streamKey} />
                          </Flex>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => setKeyRevealed(true)}>
                            Reveal stream key
                          </Button>
                        )}
                      </Cell>
                      <Cell css={{ color: "$primary11" }}>RTMP ingest URL</Cell>
                      <Cell css={{ cursor: "pointer" }}>
                        <ShowURL url={globalIngestUrl} anchor={false} />
                      </Cell>
                      <Cell css={{ color: "$primary11" }}>SRT ingest URL</Cell>
                      <Cell css={{ cursor: "pointer" }}>
                        <ShowURL
                          url={globalSrtIngestUrl}
                          shortendUrl={globalSrtIngestUrl.replace(
                            globalSrtIngestUrl.slice(38),
                            "…"
                          )}
                          anchor={false}
                        />
                      </Cell>
                      <Cell css={{ color: "$primary11" }}>Playback URL</Cell>
                      <Cell css={{ cursor: "pointer" }}>
                        <ShowURL
                          url={globalPlaybackUrl}
                          shortendUrl={globalPlaybackUrl.replace(
                            globalPlaybackUrl.slice(29, 45),
                            "…"
                          )}
                          anchor={false}
                        />
                        <Tooltip
                          content={
                            <Box>
                              We changed our playback domain, but
                              cdn.livepeer.studio is still working.
                            </Box>
                          }>
                          <Help />
                        </Tooltip>
                      </Cell>
                      <Cell css={{ color: "$primary11" }}>Record sessions</Cell>
                      <Cell>
                        <Flex css={{ position: "relative", top: "2px" }}>
                          <Box css={{ mr: "$2" }}>
                            <Record
                              stream={stream}
                              invalidate={invalidateStream}
                            />
                          </Box>
                          <Tooltip
                            multiline
                            content={
                              <Box>
                                When enabled, transcoded streaming sessions will
                                be recorded and stored by Livepeer Studio. Each
                                recorded session will have a recording .m3u8 URL
                                for playback and an MP4 download link. This
                                feature is currently free.
                              </Box>
                            }>
                            <Help />
                          </Tooltip>
                        </Flex>
                      </Cell>
                      <Cell css={{ color: "$primary11" }}>Created at</Cell>
                      <Cell>
                        <RelativeTime
                          id="cat"
                          prefix="createdat"
                          tm={stream.createdAt}
                          swap={true}
                        />
                      </Cell>
                      <Cell css={{ color: "$primary11" }}>Last seen</Cell>
                      <Cell>
                        <RelativeTime
                          id="last"
                          prefix="lastSeen"
                          tm={stream.lastSeen}
                          swap={true}
                        />
                      </Cell>
                      <Cell css={{ color: "$primary11" }}>Status</Cell>
                      <Cell>{stream.isActive ? "Active" : "Idle"}</Cell>
                      <Cell css={{ color: "$primary11" }}>Suspended</Cell>
                      <Cell>{stream.suspended ? "Suspended" : "Normal"}</Cell>
                    </Box>
                  </Flex>
                </Box>
              </Box>
              <Box css={{ flexGrow: 1, ml: "$8" }}>
                <Flex
                  justify="between"
                  css={{
                    borderBottom: "1px solid",
                    borderColor: "$neutral6",
                    mb: "$4",
                    width: "100%",
                  }}>
                  <Box css={{ display: "flex" }}>
                    <Box
                      as="div"
                      onClick={() => setSwitchTab("Overview")}
                      css={{
                        pb: "$2",
                        width: "100%",
                        cursor: "pointer",
                        textDecoration: "none",
                        borderBottom: "2px solid",
                        borderColor:
                          activeTab === "Overview" ? "$blue9" : "transparent",
                        mr: "$5",
                        "&:hover": {
                          textDecoration: "none",
                        },
                      }}>
                      Overview
                    </Box>

                    <Box
                      as="div"
                      onClick={() => setSwitchTab("Health")}
                      css={{
                        textDecoration: "none",
                        pb: "$2",
                        width: "100%",
                        cursor: "pointer",
                        borderBottom: "2px solid",
                        borderColor:
                          activeTab === "Health" ? "$blue9" : "transparent",
                        "&:hover": {
                          textDecoration: "none",
                        },
                      }}>
                      Health
                    </Box>
                  </Box>
                  <Box css={{ position: "relative", top: "-8px" }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="primary"
                          size="2"
                          css={{ display: "flex", ai: "center", mr: "$1" }}>
                          Actions
                          <Box as={ChevronDownIcon} css={{ ml: "$1" }} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <Record
                            stream={stream}
                            invalidate={invalidateStream}
                            isSwitch={false}
                          />
                          <Suspend
                            stream={stream}
                            invalidate={invalidateStream}
                          />
                          <Delete
                            stream={stream}
                            invalidate={invalidateStream}
                          />
                          {userIsAdmin && stream.isActive && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Admin only</DropdownMenuLabel>
                              <Terminate
                                stream={stream}
                                invalidate={invalidateStream}
                              />
                            </>
                          )}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Box>
                </Flex>
                <Box css={{ py: "$4" }}>{children}</Box>
              </Box>
            </Flex>
          </>
        ) : notFound ? (
          <Box>Not found</Box>
        ) : (
          <Flex
            css={{
              height: "calc(100vh - 300px)",
              justifyContent: "center",
              alignItems: "center",
            }}>
            <Spinner />
          </Flex>
        )}
      </Box>
    </Layout>
  );
};

export default StreamDetail;
