import {
  Box,
  Heading,
  Badge,
  Flex,
  Grid,
  Link as A,
  Text,
  styled,
  Skeleton,
  Tooltip,
} from "@livepeer/design-system";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import UpcomingIcon from "../../public/img/icons/upcoming.svg";
import { useEffect, useState } from "react";
import { useApi } from "hooks";
import { products } from "@livepeer.studio/api/src/config";
import { QuestionMarkCircledIcon as Help } from "@radix-ui/react-icons";

const StyledUpcomingIcon = styled(UpcomingIcon, {
  mr: "$2",
  color: "$gray",
});

const UsageCard = ({ title, usage, limit, loading = false }) => {
  return (
    <Box
      css={{
        px: "$5",
        py: "$4",
        boxShadow: "0 0 0 1px $colors$neutral6",
        borderRadius: "$1",
        backgroundColor: "$neutral2",
        color: "$hiContrast",
        mb: "$6",
        minHeight: 92,
      }}>
      {loading ? (
        <Box
          css={{
            display: "flex",
            fd: "column",
            gap: "$3",
          }}>
          <Flex align="center">
            <Skeleton variant="title" css={{ width: "50%", mr: "$3" }} />
            <Tooltip
              multiline
              content={
                <Box>Usage minutes may take up to an hour to be reflected.</Box>
              }>
              <Help />
            </Tooltip>
          </Flex>
          <Skeleton variant="heading" css={{ width: "25%" }} />
        </Box>
      ) : (
        <>
          <Flex align="center">
            <Box css={{ mb: "$2", mr: "$3", color: "$hiContrast" }}>
              {title}
            </Box>
            <Box css={{ mb: "$2" }}>
              <Tooltip
                multiline
                content={
                  <Box>
                    Usage minutes may take up to an hour to be reflected.
                  </Box>
                }>
                <Help />
              </Tooltip>
            </Box>
          </Flex>
          <Flex align="center" css={{ fontSize: "$6" }}>
            <Box css={{ fontWeight: 700 }}>{usage}</Box>
          </Flex>
        </>
      )}
    </Box>
  );
};

const UsageSummary = () => {
  const {
    user,
    getBillingUsage,
    getSubscription,
    getInvoices,
    getUserProduct,
  } = useApi();
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const prices = getUserProduct(user).usage;
  const transcodingPrice = prices[0].price;

  useEffect(() => {
    const doGetInvoices = async (stripeCustomerId) => {
      const [res, invoices] = await getInvoices(stripeCustomerId);
      if (res.status == 200) {
        setInvoices(invoices);
      }
    };

    const doGetUsage = async (fromTime, toTime, userId) => {
      const [res, usage] = await getBillingUsage(
        fromTime * 1000,
        toTime * 1000
      );
      if (res.status == 200) {
        setUsage(usage);
      }
    };
    const getSubscriptionAndUsage = async (subscriptionId) => {
      const [res, subscription] = await getSubscription(subscriptionId);
      if (res.status == 200) {
        setSubscription(subscription);
      }
      doGetUsage(
        subscription?.current_period_start,
        subscription?.current_period_end,
        user.id
      );
    };

    if (user) {
      doGetInvoices(user.stripeCustomerId);
      getSubscriptionAndUsage(user.stripeCustomerSubscriptionId);
    }
  }, [user]);

  return (
    <>
      <Flex
        justify="between"
        align="end"
        css={{
          borderBottom: "1px solid",
          borderColor: "$neutral6",
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
              Usage
            </Box>
            <Badge
              size="1"
              variant="neutral"
              css={{ letterSpacing: 0, mt: "7px" }}>
              {user?.stripeProductId
                ? products[user.stripeProductId].name
                : products["prod_0"].name}{" "}
              Plan
            </Badge>
          </Flex>
        </Heading>
        <Flex css={{ fontSize: "$3", color: "$hiContrast" }}>
          Current billing period (
          {subscription && (
            <Flex>
              {new Date(
                subscription.current_period_start * 1000
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              to{" "}
              {new Date(
                subscription.current_period_end * 1000
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
            </Flex>
          )}
          )
        </Flex>
      </Flex>
      <Grid gap="4" columns="3">
        <UsageCard
          title="Transcoding minutes"
          loading={!usage}
          usage={usage && usage.TotalUsageMins.toFixed(2).toLocaleString()}
          limit={!products[user.stripeProductId]?.order ? 1000 : false}
        />
        <UsageCard
          title="Delivery minutes"
          loading={!usage}
          usage={usage && usage.DeliveryUsageMins.toFixed(2).toLocaleString()}
          limit={!products[user.stripeProductId]?.order ? 10000 : false}
        />
        <UsageCard
          title="Storage minutes"
          loading={!usage}
          usage={usage && usage.StorageUsageMins.toFixed(2).toLocaleString()}
          limit={!products[user.stripeProductId]?.order ? 1000 : false}
        />
      </Grid>
      <Flex
        justify="between"
        align="center"
        css={{ fontSize: "$3", color: "$hiContrast", display: "none" }}>
        <Text variant="neutral" css={{ display: "flex", ai: "center" }}>
          <StyledUpcomingIcon />
          Upcoming invoice:{" "}
          <Box css={{ ml: "$1", fontWeight: 600 }}>
            {usage &&
              `$${(
                (usage.sourceSegmentsDuration / 60) *
                transcodingPrice
              ).toFixed(2)}`}
          </Box>
        </Text>
        <Link href="/dashboard/billing" passHref legacyBehavior>
          <A variant="primary" css={{ display: "flex", alignItems: "center" }}>
            View billing <ArrowRightIcon />
          </A>
        </Link>
      </Flex>
    </>
  );
};

export default UsageSummary;
