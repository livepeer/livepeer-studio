import { useEffect, useState } from "react";
import { Flex } from "@livepeer/design-system";
import Button from "components/Site/Button";
import Link from "next/link";

const BlogCTA = ({
  variant,
  internalLink,
  anchorLink,
  externalLink,
  title,
}) => {
  const [document, setDocument] = useState(null);

  useEffect(() => {
    async function init() {
      const response = await fetch(
        `https://dp4k3mpw.api.sanity.io/v1/data/doc/production/${internalLink._ref}`
      );
      const { documents } = await response.json();
      setDocument(documents[0]);
    }
    if (internalLink) init();
  }, [internalLink]);

  return (
    <Flex
      align="center"
      css={{
        my: "$4",
        "@bp2": {
          my: "40px",
        },
      }}>
      {document && (
        <Link href={`/${document?.slug?.current}`} passHref legacyBehavior>
          <Button as="a" arrow css={{ mr: "$4" }} variant={variant}>
            {title}
          </Button>
        </Link>
      )}

      {externalLink && (
        <Button
          as="a"
          arrow
          css={{ mr: "$4" }}
          variant={variant}
          target="_blank"
          href={externalLink}>
          {title}
        </Button>
      )}

      {anchorLink && (
        <Link href={anchorLink} passHref legacyBehavior>
          <Button as="a" arrow css={{ mr: "$4" }} variant={variant}>
            {title}
          </Button>
        </Link>
      )}
    </Flex>
  );
};

export default BlogCTA;
