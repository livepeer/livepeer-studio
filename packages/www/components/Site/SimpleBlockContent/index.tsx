import BlockContent from "@sanity/block-content-to-react";
import Serializers from "components/Site/Serializers";
import { Box } from "@livepeer/design-system";

const SimpleBlockContent = (props) => {
  const { blocks } = props;

  if (!blocks) {
    console.error("Missing blocks");
    return null;
  }

  return (
    <Box
      css={{
        "p, div, ul, li": {
          lineHeight: 1.8,
          color: "$gray11",
        },
        "h1, h2, h3, h4, h5, h6": {
          color: "$hiContrast",
          lineHeight: 1.5,
        },
        strong: {
          color: "$hiContrast",
        },
        em: {
          color: "$hiContrast",
        },
        figure: {
          m: 0,
        },
        img: {
          width: "100%",
        },
        a: {
          color: "$blue9",
        },
        h1: {
          fontSize: "$9",
        },
        h2: {
          fontSize: "$8",
        },
        h3: {
          fontSize: "$7",
        },
      }}>
      <BlockContent blocks={blocks} serializers={Serializers} />
    </Box>
  );
};

export default SimpleBlockContent;
