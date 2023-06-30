import {
  Container,
  Heading,
  Text,
  Flex,
  Box,
  Link as A,
} from "@livepeer/design-system";
import Button from "components/Site/Button";
import Guides from "components/Site/Guides";
import Link from "next/link";

const Prefooter = ({ backgroundColor = "$loContrast" }) => (
  <Box css={{ position: "relative" }}>
    <Guides backgroundColor={backgroundColor} />
    <Container
      size="3"
      css={{
        px: "$6",
        py: 70,
        width: "100%",
        "@bp3": {
          px: "$3",
          py: 120,
        },
      }}>
      <Box
        css={{
          px: 32,
          py: 60,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          borderRadius: 24,
          color: "white",
          background:
            "linear-gradient(90deg, $colors$blue9 0%, $colors$blue10 33%,  $colors$blue11 66%, $colors$blue11 100%);",
          backgroundSize: "cover",
          "@bp2": {
            px: 72,
            py: 126,
          },
        }}>
        <Heading
          size="4"
          as="h2"
          css={{
            color: "white",
            fontWeight: 700,
            mb: "$6",
          }}>
          Ready to get started?
        </Heading>
        <Text
          variant="neutral"
          size="4"
          css={{
            color: "white",
            mb: "$7",
            maxWidth: "700px",
            mx: "auto",
          }}>
          Contact us anytime about custom pricing for your business.
        </Text>
        <Flex
          css={{
            ai: "center",
            justifyContent: "center",
            flexDirection: "column",
            "@bp2": {
              flexDirection: "row",
            },
          }}>
          <Link href="/register" passHref legacyBehavior>
            <Button
              size="4"
              as="a"
              arrow
              css={{
                mr: "$4",
                mb: "$3",
                "@bp2": {
                  mb: 0,
                },
              }}>
              Sign up for free
            </Button>
          </Link>
          <Link href="/contact" passHref legacyBehavior>
            <A
              css={{
                textDecoration: "none",
                fontWeight: 500,
                display: "flex",
                color: "white",
                ai: "center",
                ".HoverArrow": {
                  position: "relative",
                  top: "1px",
                  marginLeft: "4px",
                  strokeWidth: "2",
                  fill: "none",
                  stroke: "currentColor",
                },
                ".HoverArrow__linePath": {
                  opacity: "0",
                  transition: "opacity cubic-bezier(0.215,0.61,0.355,1) .1s",
                },
                ".HoverArrow__tipPath": {
                  transition:
                    "transform cubic-bezier(0.215,0.61,0.355,1) .1s, transform cubic-bezier(0.215,0.61,0.355,1) .1s",
                },
                "&:hover .HoverArrow": {
                  transition: "cubic-bezier(0.215,0.61,0.355,1) .1s",
                  ".HoverArrow__linePath": {
                    opacity: 1,
                  },
                  ".HoverArrow__tipPath": {
                    transform: "translateX(3px)",
                  },
                },
              }}>
              <Box>Contact us</Box>
              <svg
                className="HoverArrow"
                width="10"
                height="10"
                viewBox="0 0 10 10"
                aria-hidden="true">
                <g fillRule="evenodd">
                  <path className="HoverArrow__linePath" d="M0 5h7" />
                  <path className="HoverArrow__tipPath" d="M1 1l4 4-4 4" />
                </g>
              </svg>
            </A>
          </Link>
        </Flex>
      </Box>
    </Container>
  </Box>
);

export default Prefooter;
