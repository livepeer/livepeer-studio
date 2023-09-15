import {
  Container,
  Box,
  Flex,
  Text,
  Grid,
  Heading,
  Link as A,
} from "@livepeer/design-system";
import Guides from "components/Site/Guides";
import Link from "next/link";

const CaseStudy = ({
  heading,
  about,
  testimonial,
  problem,
  solution,
  externalLink = null,
  internalLink = null,
  backgroundColor = "$loContrast",
}) => {
  return (
    <Box css={{ position: "relative" }}>
      <Guides backgroundColor={backgroundColor} />
      <Box css={{ position: "relative", py: 120 }}>
        <Container size="3" css={{ p: 0 }}>
          <Box
            css={{
              px: "$4",
              mx: "$4",
              "@bp3": {
                px: "$4",
                mx: "auto",
              },
            }}>
            <Text size="5" css={{ fontWeight: 600, mb: "$4" }}>
              Case Study
            </Text>
            <Grid
              css={{
                gap: "$6",
                grid: "1fr/repeat(1,1fr)",
                "@bp2": {
                  grid: "1fr/repeat(2,1fr)",
                },
              }}>
              <Heading
                size="3"
                as="h2"
                css={{
                  maxWidth: 600,
                  fontWeight: 700,
                  "@bp2": { letterSpacing: 0, mb: "$7" },
                }}>
                {heading}
              </Heading>
              <Text variant="neutral" size="5" css={{ mt: "$1", mb: "$7" }}>
                {about}
              </Text>
            </Grid>
          </Box>

          <Grid
            css={{
              gap: "$6",
              grid: "1fr/repeat(1,1fr)",
              width: "100%",
              mb: "$6",
              "@bp2": {
                grid: "1fr/repeat(2,1fr)",
              },
            }}>
            <Flex direction="column">
              <Box
                css={{
                  position: "relative",
                  height: "100%",
                }}>
                <Box
                  css={{
                    mb: "$6",

                    px: "$4",
                    mx: "$4",
                    "@bp3": {
                      px: 0,
                    },
                  }}>
                  <Text
                    css={{
                      position: "relative",
                      fontWeight: 500,
                      mb: "$2",
                      "&:before": {
                        position: "absolute",
                        top: "4px",
                        left: "-15px",
                        width: "1px",
                        height: "$3",
                        backgroundColor: "$green9",
                        content: '""',
                      },
                    }}>
                    Problem
                  </Text>
                  <Text
                    variant="neutral"
                    css={{
                      lineHeight: 1.6,
                    }}>
                    {problem}
                  </Text>
                </Box>
                <Box
                  css={{
                    mb: "$6",
                    px: "$4",
                    mx: "$4",
                    "@bp3": {
                      px: 0,
                    },
                  }}>
                  <Text
                    css={{
                      position: "relative",
                      fontWeight: 500,
                      mb: "$2",
                      "&:before": {
                        position: "absolute",
                        top: "4px",
                        left: "-15px",
                        width: "1px",
                        height: "$3",
                        backgroundColor: "$green9",
                        content: '""',
                      },
                    }}>
                    Solution
                  </Text>
                  <Text variant="neutral" css={{ lineHeight: 1.6, mb: "$3" }}>
                    {solution}
                  </Text>
                  {externalLink && (
                    <Link
                      href={externalLink.slug.current}
                      passHref
                      legacyBehavior>
                      <A
                        target="_blank"
                        css={{ fontSize: "$3" }}
                        variant="primary">
                        Read the full story
                      </A>
                    </Link>
                  )}
                  {internalLink && (
                    <Link
                      href={`/blog/${internalLink.slug.current}`}
                      passHref
                      legacyBehavior>
                      <A css={{ fontSize: "$3" }} variant="primary">
                        Read the full story
                      </A>
                    </Link>
                  )}
                </Box>
              </Box>
            </Flex>
            <Box
              css={{
                pl: "$4",
                pr: "$4",
                ml: "$4",
                mr: "$4",
                "@bp2": {
                  ml: 0,
                  pl: 0,
                  mr: "$4",
                },
                "@bp3": {
                  ml: 0,
                  pl: 0,
                  mr: 0,
                },
              }}>
              <Flex
                direction="column"
                css={{
                  justifyContent: "center",
                  width: "100%",
                  borderRadius: "12px",
                  boxShadow: "0px 14px 34px rgba(0, 0, 0, 0.21)",
                  overflow: "visible",
                  position: "relative",
                  p: "$7",
                  backgroundColor: "$panel",
                }}>
                <Text
                  size="4"
                  css={{
                    position: "relative",
                    mb: "$4",
                    "&:before": {
                      content: "open-quote",
                      position: "absolute",
                      fontFamily: "serif",
                      left: "-10px",
                    },
                    "&:after": {
                      content: "close-quote",
                      position: "absolute",
                      fontFamily: "serif",
                      transform: "translateX(2px)",
                    },
                  }}>
                  {testimonial.quote}
                </Text>
                <Flex css={{ ai: "center" }}>
                  <Text css={{ fontWeight: 600 }}>{testimonial.name}</Text>
                  <Text>, {testimonial.role}</Text>
                </Flex>
              </Flex>
            </Box>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default CaseStudy;
