import Layout from "layouts/main";
import { Box, Heading, Text, Container } from "@livepeer/design-system";
import Prefooter from "@components/Site/Prefooter";
import PricingCalculator from "@components/Site/Pricing/pricingCalculator";
import PricingCardsContainer from "@components/Site/Pricing/pricingCardsContainer";
import { Pricing as Content } from "content";

const PricingPage = () => {
  return (
    <Layout {...Content.metaData}>
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            px: "$6",
            py: "$7",
            width: "100%",
            "@bp3": {
              py: "$8",
              px: "$4",
            },
          }}>
          <Box css={{ textAlign: "center", mb: "$5" }}>
            <Heading as="h1" size="4" css={{ fontWeight: 600, mb: "$5" }}>
              Start free.
              <Box css={{ fontWeight: 400 }}>Then pay as you grow.</Box>
            </Heading>
            <Text as="h2" variant="gray" size="6">
              Flexible pricing for projects of all sizes.
            </Text>
          </Box>
        </Container>
        <PricingCardsContainer />
        <Box>
          <Box css={{ position: "relative" }}>
            <Container
              size="3"
              css={{
                px: "$6",
                py: "$7",
                width: "100%",
                "@bp3": {
                  py: "$8",
                  px: "$4",
                },
              }}>
              <PricingCalculator />
            </Container>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

PricingPage.theme = "dark-theme-blue";
export default PricingPage;
