import { Heading, Text, Box, Flex, Link as A } from "@livepeer/design-system";
import Button from "@components/Marketing/Button";
import Link from "next/link";
import CutOut from "@components/Marketing/CutOut";

const Footer = () => {
  return (
    <Box
      css={{
        position: "relative",
        overflow: "hidden",
        color: "$loContrast",
        mx: "$3",
        mb: "$3",
        zIndex: 1,
      }}>
      <Flex
        css={{
          flexDirection: "column",
          "@bp2": {
            flexDirection: "row",
          },
        }}>
        <Flex
          css={{
            width: "100%",
            flexDirection: "column",
            "@bp2": {
              flexDirection: "row",
              width: "64%",
            },
          }}>
          <Box css={{ width: "100%" }}>
            <Box
              css={{
                position: "relative",
                borderRadius: 40,
                height: 40,
                width: "100%",
              }}>
              <CutOut orientation="left" backgroundColor="$hiContrast" />
            </Box>
            <Box
              css={{
                bc: "$hiContrast",
                width: "100%",
                borderTopLeftRadius: 18,
                borderBottomLeftRadius: 18,
                pl: "$3",
                pb: "$3",
                pt: "$7",
                zIndex: 4,
                height: "calc(100% - 40px)",
                "@bp2": {
                  pt: "$9",
                },
              }}>
              <Box
                css={{
                  fontSize: 96,
                  fontWeight: 600,
                  lineHeight: 0.8,
                  letterSpacing: "-4px",
                  mb: 80,
                  "@bp1": {
                    mb: 120,
                    maxWidth: 400,
                    fontSize: 120,
                  },
                  "@bp2": {
                    mb: 120,
                    maxWidth: 400,
                    fontSize: 140,
                  },
                  "@bp3": {
                    fontSize: 210,
                  },
                }}>
                <Box>
                  Get
                  <br />
                  Started
                </Box>
              </Box>
              <Box css={{ mt: "$9", maxWidth: 600 }}>
                <Box css={{ mb: "$7", fontSize: "$4" }}>
                  Join the next-gen, creator-owned video ecosystem. From
                  “decentralized YouTube” to video NFT marketplaces, Livepeer
                  Studio empowers developers to build video-enabled applications
                  that give creators total control over their content with no
                  middlemen.
                </Box>
                <Flex align="center">
                  <Button
                    css={{
                      mr: "$3",
                      backgroundColor: "transparent",
                      color: "$loContrast",
                      borderColor: "$loContrast",
                      fontSize: 20,
                      fontWeight: 500,
                      borderRadius: "$1",
                      px: "6px",
                      py: 0,
                      "@bp2": {
                        fontSize: 34,
                        px: "4px",
                        py: "2px",
                        mr: "$3",
                      },
                      "&:hover": {
                        bc: "$loContrast",
                        color: "white",
                      },
                    }}>
                    Contact
                  </Button>
                  <Button
                    small
                    variant="blue"
                    css={{
                      bc: "#0A5CD8",
                      fontSize: 20,
                      fontWeight: 500,
                      borderRadius: "$1",
                      px: "6px",
                      py: 0,
                      "@bp2": {
                        fontSize: 34,
                        px: "4px",
                        py: "2px",
                        mr: "$3",
                      },
                    }}>
                    Let's Go
                  </Button>
                </Flex>
              </Box>
            </Box>
          </Box>
          <Flex
            css={{
              mt: 1,
              bc: "#0001AE",
              position: "relative",
              height: "100%",
              flexDirection: "column",
              "@bp2": {
                flexDirection: "row",
              },
            }}>
            <Box
              css={{
                borderBottomRightRadius: "18px",
                borderBottomLeftRadius: "18px",
                bc: "$hiContrast",
                height: 34,
                width: "100%",
                zIndex: 3,
                mt: -16,
                "@bp2": {
                  mt: 0,
                  ml: -16,
                  height: "100%",
                  width: 34,
                  borderBottomRightRadius: "18px",
                  borderTopRightRadius: "18px",
                  borderBottomLeftRadius: 0,
                },
              }}
            />
            <Box
              css={{
                borderBottomRightRadius: "18px",
                borderBottomLeftRadius: "18px",
                bc: "#37B8EE",
                height: 34,
                mt: -16,
                width: "100%",
                zIndex: 2,
                "@bp2": {
                  mt: 0,
                  ml: -16,
                  height: "100%",
                  width: 34,
                  borderBottomRightRadius: "18px",
                  borderTopRightRadius: "18px",
                  borderBottomLeftRadius: 0,
                },
              }}
            />
            <Box
              css={{
                borderBottomRightRadius: "18px",
                borderBottomLeftRadius: "18px",
                bc: "#0197D5",
                height: 34,
                mt: -16,
                width: "100%",
                zIndex: 1,
                "@bp2": {
                  mt: 0,
                  ml: -16,
                  height: "100%",
                  width: 34,
                  borderBottomRightRadius: "18px",
                  borderTopRightRadius: "18px",
                  borderBottomLeftRadius: 0,
                },
              }}
            />
            <Box
              css={{
                borderBottomRightRadius: "18px",
                borderBottomLeftRadius: "18px",
                bc: "#0A5CD8",
                height: 34,
                mt: -16,
                width: "100%",
                zIndex: 0,
                "@bp2": {
                  mt: 0,
                  ml: -16,
                  height: "100%",
                  width: 34,
                  borderBottomRightRadius: "18px",
                  borderTopRightRadius: "18px",
                  borderBottomLeftRadius: 0,
                },
              }}
            />
          </Flex>
        </Flex>
        <Flex
          direction="column"
          justify="between"
          css={{
            px: "$4",
            py: "$5",
            mt: 1,
            width: "100%",
            bc: "#0001AE",
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            "@bp2": {
              borderTopRightRadius: 18,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 18,
              width: "36%",
            },
          }}>
          <Box>
            <Box css={{ mb: "$5" }}>
              <Heading
                css={{
                  fontWeight: 600,
                  mb: "$1",
                  fontSize: 15,
                  letterSpacing: 0,
                  color: "white",
                }}>
                Why Livepeer Studio
              </Heading>
              <Text
                css={{
                  color: "white",
                  fontWeight: 300,
                  lineHeight: "18px",
                  opacity: ".8",
                }}>
                Livepeer Studio is a powerful suite of web3 tools that make it
                easy for builders to create new video experiences and access the
                decentralized Livepeer network. More than a product, Livepeer
                Studio is a growing community of web3 developers and creators
                creating the future of web3 video.
              </Text>
            </Box>
            <Box css={{ mb: "$9" }}>
              <Heading
                css={{
                  fontWeight: 600,
                  mb: "$1",
                  fontSize: 15,
                  letterSpacing: 0,
                  color: "white",
                }}>
                Why Livepeer
              </Heading>
              <Text
                css={{
                  color: "white",
                  fontWeight: 300,
                  lineHeight: "18px",
                  opacity: ".8",
                }}>
                Livepeer is the world's open video infrastructure. Founded in
                2017, Livepeer provides cost efficient, secure, scalable, and
                reliable infrastructure that can handle today's high demand for
                video processing. Livepeer's decentralized network includes over
                70,000 GPUs and currently processes millions of minutes a week.
              </Text>
            </Box>
            <Heading
              css={{
                color: "white",
                mb: "$6",
                fontSize: 75,
                letterSpacing: "-3px",
              }}>
              Social
            </Heading>
            <Flex gap="2" align="center" css={{ mb: "$6" }}>
              <Box
                css={{
                  fontSize: 54,
                  fontWeight: 500,
                  border: "2px solid white",
                  borderRadius: "4px",
                  lineHeight: 0.9,
                  px: "3px",
                  color: "white",
                }}>
                IG
              </Box>
              <Box
                css={{
                  fontSize: 54,
                  fontWeight: 500,
                  border: "2px solid white",
                  borderRadius: "4px",
                  lineHeight: 0.9,
                  px: "3px",
                  color: "white",
                }}>
                TW
              </Box>
              <Box
                css={{
                  fontSize: 54,
                  fontWeight: 500,
                  border: "2px solid white",
                  borderRadius: "4px",
                  lineHeight: 0.9,
                  px: "3px",
                  color: "white",
                }}>
                TIK
              </Box>
              <Box
                css={{
                  fontSize: 54,
                  fontWeight: 500,
                  border: "2px solid white",
                  borderRadius: "4px",
                  lineHeight: 0.9,
                  px: "3px",
                  color: "white",
                }}>
                GH
              </Box>
            </Flex>
          </Box>
          <Box
            css={{
              a: {
                fontSize: "$4",
                display: "block",
                color: "#F7F7F7",
                opacity: 0.6,
                transition: ".15s",
                textDecoration: "none",
                "&:hover": {
                  opacity: 1,
                  transition: ".15s",
                  textDecoration: "none",
                },
              },
            }}>
            <Link href="/pricing-faq" passHref>
              <A>Pricing</A>
            </Link>
            <A href="https://livepeer.org/jobs" target="_blank">
              Jobs
            </A>
            <Link href="/privacy-policy" passHref>
              <A>Privacy Policy</A>
            </Link>
            <Link href="/terms-of-service" passHref>
              <A>Terms of Service</A>
            </Link>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Footer;
