import { Box, Button, Flex, Link } from "@livepeer/design-system";
import { DownloadIcon, Share2Icon } from "@radix-ui/react-icons";
import { Asset } from "livepeer";
import Player from "../../Player";
import AssetSharePopup from "../AssetSharePopup";
import FailedProcessing from "./FailedProcessing";
import ProcessingProgress from "./ProcessingProgress";

const AssetStatusBox = ({ asset }) => {
  if (asset?.status?.phase === "ready" && asset.playbackUrl) {
    return <Player src={asset.playbackUrl} autoPlay={false} />;
  }
  if (asset?.status?.phase === "failed") {
    return <FailedProcessing />;
  }
  return <ProcessingProgress />;
};

const DownloadLink = ({ downloadUrl }: { downloadUrl?: string }) => {
  if (!downloadUrl) {
    return null;
  }
  return (
    <Link
      css={{
        textDecorationColor: "transparent",
        "&:hover": {
          textDecorationColor: "transparent",
        },
      }}
      target="_blank"
      href={downloadUrl}>
      <Button
        size="2"
        ghost
        css={{
          mr: "$1",
        }}>
        <Box
          as={DownloadIcon}
          css={{
            mr: "$1",
          }}
        />
        Download
      </Button>
    </Link>
  );
};

const ShareComponent = ({
  playbackId,
  onEmbedVideoClick,
}: {
  playbackId?: string;
  onEmbedVideoClick(): void;
}) => {
  if (!playbackId) {
    return null;
  }
  return (
    <AssetSharePopup
      playbackId={playbackId}
      triggerNode={
        <Button size="2" ghost>
          <Box
            as={Share2Icon}
            css={{
              mr: "$1",
            }}
          />
          Share
        </Button>
      }
      onEmbedVideoClick={onEmbedVideoClick}
    />
  );
};

export type AssetPlayerBoxProps = {
  asset?: Asset;
  onEmbedVideoClick: () => void;
};

const AssetPlayerBox = ({ asset, onEmbedVideoClick }: AssetPlayerBoxProps) => {
  if (!asset) {
    return null;
  }
  return (
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
          mb: "$2",
        }}>
        <AssetStatusBox asset={asset} />
      </Box>
      <Box
        css={{
          mb: "$5",
        }}>
        <Flex align="center">
          <DownloadLink downloadUrl={asset.downloadUrl} />
          <ShareComponent
            playbackId={asset.playbackId}
            onEmbedVideoClick={onEmbedVideoClick}
          />
        </Flex>
      </Box>
    </Box>
  );
};

export default AssetPlayerBox;
