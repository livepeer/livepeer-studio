import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "react-query";
import { Stream } from "@livepeer.com/api";
import { useApi, useAnalyzer } from "hooks";
import { StreamInfo } from "hooks/use-api";
import StreamDetail from "layouts/streamDetail";
import StreamSessionsTable from "@components/Dashboard/SessionsTable";
import Logger from "@components/Dashboard/Logger";
import Chart from "@components/Dashboard/Chart";
import HealthChecksTable from "@components/Dashboard/HealthChecksTable";
import MultistreamTargetsTable from "@components/Dashboard/MultistreamTargetsTable";
import { Text, Box, Heading } from "@livepeer.com/design-system";

const ingestInterval = 10 * 1000;
const maxItems = 6;
const refetchInterval = 5 * 1000;

const Overview = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getStream, getStreamInfo } = useApi();
  const { getHealth } = useAnalyzer();
  const [switchTab, setSwitchTab] = useState<"Overview" | "Health">("Overview");
  const [dataChart, setDataChart] = useState<{ name: number; kbps: number }[]>([
    { name: 0, kbps: 0 },
  ]);
  const [info, setInfo] = useState<StreamInfo | null>(null);

  const { query } = router;
  const id = query.id as string;

  const { data: stream } = useQuery([id], () => getStream(id), {
    refetchInterval,
  });
  const invalidateStream = useCallback(
    (optimistic?: Stream) => {
      if (optimistic) {
        queryClient.setQueryData([id], optimistic);
      }
      return queryClient.invalidateQueries([id]);
    },
    [queryClient, id]
  );
  const { data: streamHealth } = useQuery({
    queryKey: ["health", stream?.region, stream?.id, stream?.isActive],
    queryFn: async () =>
      !stream?.region ? null : await getHealth(stream.region, stream.id),
    refetchInterval,
  });

  const doGetInfo = useCallback(
    async (id: string) => {
      setInfo(null);
      const [, rinfo] = await getStreamInfo(id);
      if (!rinfo || rinfo.isSession === undefined) {
        return;
      } else if (rinfo.stream) {
        const info = rinfo as StreamInfo;
        setInfo(info);
      }
    },
    [getStreamInfo]
  );

  const getIngestRate = useCallback(
    async (id: string) => {
      const [, rinfo] = await getStreamInfo(id);
      if (!rinfo?.session) {
        return;
      }
      const newInfo = rinfo as StreamInfo;
      setDataChart((prev) => {
        const lastItem = prev[prev.length - 1];
        return [
          ...prev,
          {
            name: lastItem ? lastItem.name + ingestInterval / 1000 : 0,
            kbps: Math.round((newInfo.session.ingestRate / 1000) * 8), // kilobits rather than bytes here
          },
        ].slice(Math.max(prev.length - maxItems, 0));
      });
    },
    [getStreamInfo]
  );

  useEffect(() => {
    if (!id) {
      return;
    }
    doGetInfo(typeof id === "string" ? id : null);
  }, [doGetInfo]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (info) {
        getIngestRate(typeof id === "string" ? id : null);
      } else return null;
    }, ingestInterval);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [getIngestRate, info]);

  return (
    <StreamDetail
      activeTab={switchTab}
      stream={stream}
      streamHealth={streamHealth}
      invalidateStream={invalidateStream}
      setSwitchTab={setSwitchTab}
      breadcrumbs={[
        { title: "Streams", href: "/dashboard/streams" },
        { title: stream?.name },
      ]}>
      {switchTab === "Overview" ? (
        <>
          <MultistreamTargetsTable
            stream={stream}
            streamHealth={streamHealth}
            invalidateStream={invalidateStream}
            css={{ mb: "$7" }}
            emptyState={
              <Text variant="gray" size="2">
                No targets
              </Text>
            }
            tableLayout="auto"
            border
          />
          <StreamSessionsTable
            streamId={id}
            emptyState={
              <Text variant="gray" size="2">
                No sessions
              </Text>
            }
            tableLayout="auto"
            border
          />
        </>
      ) : (
        <>
          <HealthChecksTable
            stream={stream}
            streamHealth={streamHealth}
            invalidateStream={invalidateStream}
            css={{ mb: "$7" }}
            emptyState={
              <Text variant="gray" size="2">
                No targets
              </Text>
            }
            tableLayout="auto"
            border
          />
          <Logger stream={stream} css={{ mb: "$7" }} />
          <Box
            css={{
              borderBottom: "1px solid",
              borderColor: "$mauve6",
              pb: "$2",
              mb: "$7",
              width: "100%",
            }}>
            <Heading size="1" css={{ fontWeight: 500, mb: "$1" }}>
              Session ingest rate
            </Heading>
            <Text variant="gray" size="3">
              After the stream loads, ingest rate updates every 10 seconds.
            </Text>
          </Box>
          <Chart data={dataChart} />
        </>
      )}
    </StreamDetail>
  );
};

export default Overview;
