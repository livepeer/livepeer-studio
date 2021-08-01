import PricingCard, { PricingCardContent } from "./pricingCard";
import { Box, Grid, Flex, Text } from "@livepeer.com/design-system";

const PricingCardsContainer = () => {
  return (
    <Flex
      direction="column"
      css={{
        px: "36px",
        maxWidth: "1145px",
        margin: "0 auto",
        width: "100%",
        pb: "$8",
        "@bp3": {
          px: "12px",
        },
      }}>
      <Grid
        css={{
          gap: "22px",
          grid: "1fr/repeat(4,1fr)",
          position: "relative",
        }}>
        <Box
          css={{
            alignSelf: "flex-end",
            flexDirection: "column",
            px: "$2",
          }}>
          <Box css={{ fontSize: "16px", mb: "16px" }}>Usage</Box>
          <PricingCardContent>
            <Text
              size="4"
              css={{
                fontWeight: 600,
                mb: "$1",
              }}>
              Transcoding
            </Text>
            <Text size="2" variant="gray">
              Create multiple versions of your source stream for different
              devices in real time.
            </Text>
          </PricingCardContent>
          <PricingCardContent>
            <Text
              size="4"
              css={{
                fontWeight: 600,
                mb: "$1",
              }}>
              Recording Storage
            </Text>
            <Text size="2" variant="gray">
              Automatically store your transcoded renditions for VoD playback.
            </Text>
          </PricingCardContent>
          <PricingCardContent>
            <Text
              size="4"
              css={{
                fontWeight: 600,
                mb: "$1",
              }}>
              Stream Delivery via CDN*
            </Text>
            <Text size="2" variant="gray">
              Optimize playback for your viewers across the globe via a CDN.
            </Text>
          </PricingCardContent>
        </Box>
        <PricingCard
          pricingTitle="Personal"
          pricingDescription="Free"
          cardBg="$violet6"
          titleColor="black"
          btn={{
            display: "Sign up",
            href: "/register",
            color: "$loContrast",
            bg: "$hiContrast",
          }}>
          <Box css={{ mt: "20px" }}>
            <PricingCardContent>
              <Box
                css={{
                  fontSize: "32px",
                  fontWeight: 600,
                }}>
                1000
              </Box>
              <Box
                css={{
                  fontSize: "16px",
                  lineHeight: "24px",
                }}>
                minutes/month
              </Box>
            </PricingCardContent>
            <PricingCardContent comingSoon />
            <PricingCardContent>
              <Box
                css={{
                  fontSize: "32px",
                  fontWeight: 600,
                }}>
                10
              </Box>
              <Box
                css={{
                  fontSize: "16px",
                  lineHeight: "24px",
                }}>
                current viewers
              </Box>
            </PricingCardContent>
          </Box>
        </PricingCard>
        <PricingCard
          pricingTitle="Pro"
          pricingDescription="Pay as you go"
          cardBg="$violet8"
          btn={{
            display: "Sign up",
            href: "/register",
            color: "$loContrast",
            bg: "$hiContrast",
          }}>
          <Box css={{ mt: "20px" }}>
            <PricingCardContent color="white">
              <Box
                css={{
                  fontSize: "32px",
                  fontWeight: 600,
                }}>
                $0.005
                <Box
                  as="span"
                  css={{
                    fontSize: "16px",
                    fontWeight: "normal",
                    ml: "4px",
                  }}>
                  USD
                </Box>
              </Box>
              <Box
                css={{
                  fontSize: "16px",
                  lineHeight: "24px",
                }}>
                / min video ingested
              </Box>
            </PricingCardContent>
            <PricingCardContent comingSoon color="white" />
            <PricingCardContent color="white">
              <Box
                css={{
                  fontSize: "32px",
                  fontWeight: 600,
                }}>
                $0.01
                <Box
                  as="span"
                  css={{
                    fontSize: "16px",
                    fontWeight: "normal",
                    ml: "4px",
                  }}>
                  USD
                </Box>
              </Box>
              <Box
                css={{
                  fontSize: "16px",
                  lineHeight: "24px",
                }}>
                / GB video streamed*
              </Box>
            </PricingCardContent>
          </Box>
        </PricingCard>
        <PricingCard
          pricingTitle="Business"
          pricingDescription="Custom pricing"
          cardBg="$indigo10"
          btn={{
            display: "Contact us",
            href: "/contact?utm_source=livepeer.com&utm_medium=internal_page&utm_campaign=business_plan",
            color: "$loContrast",
            bg: "$hiContrast",
          }}>
          <Box css={{ mt: "20px" }}>
            <PricingCardContent color="white" customPricing />
            <PricingCardContent comingSoon color="white" />
            <PricingCardContent color="white" customPricing />
          </Box>
        </PricingCard>
      </Grid>
      <Text
        variant="gray"
        size="2"
        css={{
          mt: "$8",
          textAlign: "center",
        }}>
        *Currently, we are not charging for Stream Delivery via CDN. We’ll be
        sure to reach out before we start to do so.
      </Text>
    </Flex>
  );
};

export default PricingCardsContainer;
