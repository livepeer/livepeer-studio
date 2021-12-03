import Layout from "../../../layouts/dashboard";
import { Box, Flex, Heading } from "@livepeer.com/design-system";
import { useApi, useLoggedIn } from "hooks";
import { withEmailVerifyMode } from "layouts/withEmailVerifyMode";
import Plans from "components/Dashboard/Plans";
import { DashboardPlans as Content } from "content";

const PlansPage = () => {
  useLoggedIn();
  const { user } = useApi();

  return (
    <Layout
      id="billing/plans"
      breadcrumbs={[
        { title: "Billing", href: "/dashboard/billing" },
        { title: "Plans" },
      ]}
      {...Content.metaData}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$6" }}>
          <Flex
            justify="between"
            align="end"
            css={{
              borderBottom: "1px solid",
              borderColor: "$mauve6",
              pb: "$4",
              mb: "$5",
              width: "100%",
            }}>
            <Heading size="2">
              <Flex>
                <Box
                  css={{
                    mr: "$3",
                    fontWeight: 600,
                    letterSpacing: "0",
                  }}>
                  Plans
                </Box>
              </Flex>
            </Heading>
          </Flex>
        </Box>
        <Plans
          dashboard={true}
          stripeProductId={
            user?.stripeProductId ? user.stripeProductId : "prod_0"
          }
        />
      </Box>
    </Layout>
  );
};

export default withEmailVerifyMode(PlansPage);
