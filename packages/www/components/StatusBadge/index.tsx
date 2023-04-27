import moment from "moment";
import { Box, Badge, Status, Tooltip } from "@livepeer/design-system";
import { useMemo } from "react";

// TODO: Make this an actual variant somehow? Maybe semantic variants like good/bad/warning
export enum Variant {
  Idle = "Idle",
  Pending = "Pending",
  Offline = "Offline",
  Online = "Online",
  Healthy = "Healthy",
  Unhealthy = "Unhealthy",
}

type Style = {
  color: Parameters<typeof Badge>[0]["variant"];
  dotColor?: Parameters<typeof Status>[0]["variant"];
  noTooltip?: boolean;
};

const styleByVariant: Record<Variant, Style> = {
  Idle: { color: "gray", noTooltip: true },
  Pending: { color: "lime", dotColor: "yellow" },
  Offline: { color: "red" },
  Online: { color: "green" },
  Healthy: { color: "green" },
  Unhealthy: { color: "red" },
};

const StatusBadge = ({
  variant,
  timestamp,
  tooltipText,
}: {
  variant: Variant;
  timestamp?: string | number;
  tooltipText?: string;
}) => {
  const style = styleByVariant[variant];
  const badge = (
    <Badge size="2" variant={style.color}>
      <Box css={{ mr: "$1" }}>
        <Status size="1" variant={style.dotColor ?? (style.color as any)} />
      </Box>
      {variant}
    </Badge>
  );
  const timeAgo = useMemo(() => {
    const tsNum =
      typeof timestamp === "string" ? Date.parse(timestamp) : timestamp;
    return !tsNum ? moment.invalid() : moment.unix(tsNum / 1000);
  }, [timestamp]);
  if (!tooltipText && (!timeAgo.isValid() || style.noTooltip)) {
    return badge;
  }
  let contentText: string;
  if (tooltipText && timeAgo.isValid()) {
    contentText = `${tooltipText} ${timeAgo.fromNow()}`;
  } else {
    contentText = tooltipText;
  }
  return <Tooltip content={contentText}>{badge}</Tooltip>;
};

export default StatusBadge;
