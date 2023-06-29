import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import {
  Box,
  Heading,
  Badge,
  Flex,
  Text,
  Link as A,
} from "@livepeer/design-system";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { products } from "@livepeer.studio/api/src/config";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import PaymentMethodDialog from "components/PaymentMethodDialog";
import PaymentMethod from "components/PaymentMethod";
import UpcomingInvoiceTable from "components/UpcomingInvoiceTable";
import PastInvoicesTable from "components/PastInvoicesTable";
import { useQuery, useQueryClient } from "react-query";
import { DashboardBilling as Content } from "content";
import React, { PureComponent } from "react";

export interface OverUsageBill {
  transcodingBill: OverUsageItem;
  deliveryBill: OverUsageItem;
  storageBill: OverUsageItem;
}

export interface OverUsageItem {
  units: number;
  total: number;
}

const Billing = () => {
  useLoggedIn();
  const {
    user,
    getUsage,
    getBillingUsage,
    getSubscription,
    getInvoices,
    getPaymentMethod,
    getUserProduct,
    getUpcomingInvoice,
  } = useApi();
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const [upcomingInvoiceTotal, setUpcomingInvoiceTotal] = useState(0);
  const [upcomingInvoice, setUpcomingInvoice] = useState<any>(null);
  const [overUsageBill, setOverUsageBill] = useState<OverUsageBill | null>(
    null
  );
  const product = getUserProduct(user);

  const fetcher = useCallback(async () => {
    if (user?.stripeCustomerPaymentMethodId) {
      const [_res, paymentMethod] = await getPaymentMethod(
        user.stripeCustomerPaymentMethodId
      );
      return paymentMethod;
    }
  }, [user?.stripeCustomerPaymentMethodId]);

  const queryKey = useMemo(() => {
    return [user?.stripeCustomerPaymentMethodId];
  }, [user?.stripeCustomerPaymentMethodId]);

  const { data, isLoading } = useQuery([queryKey], () => fetcher());

  const queryClient = useQueryClient();

  const invalidateQuery = useCallback(() => {
    return queryClient.invalidateQueries(queryKey);
  }, [queryClient, queryKey]);

  useEffect(() => {
    const doGetInvoices = async (stripeCustomerId) => {
      const [res, invoices] = await getInvoices(stripeCustomerId);
      if (res.status == 200) {
        setInvoices(invoices);
      }
    };

    const doGetUsage = async (fromTime, toTime, status) => {
      fromTime = 1685311200000; // fromTime * 1000; // TMP Fixed billing cycle to test usage
      toTime = 1687989600000; // toTime * 1000; // TMP Fixed billing cycle to test usage

      if (status === "canceled") {
        const now = new Date();
        fromTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        toTime = now.getTime();
      }

      let [
        res,
        usage = {
          TotalUsageMins: 0,
          DeliveryUsageMins: 0,
          StorageUsageMins: 0,
        },
      ] = await getBillingUsage(fromTime, toTime);

      if (res.status == 200) {
        setUsage(usage);
        doCaculateOverUsage(usage);
      }
    };

    const doCaculateOverUsage = async (usage) => {
      const overusage = await calculateOverUsage(product, usage);
      if (overusage) {
        const oBill = await calculateOverUsageBill(overusage);
        setOverUsageBill(oBill);
        let [res, uInvoice] = await getUpcomingInvoice(user.stripeCustomerId);
        setUpcomingInvoice(uInvoice?.invoices);
        setUpcomingInvoiceTotal((uInvoice?.invoices.amount_due / 100) | 0);
      }
    };

    const calculateOverUsage = async (product, usage) => {
      const limits = {
        transcoding: product?.usage[0].limit,
        streaming: product?.usage[1].limit,
        storage: product?.usage[2].limit,
      };

      const overUsage = {
        TotalUsageMins: Math.max(usage?.TotalUsageMins - limits.transcoding, 0),
        DeliveryUsageMins: Math.max(
          usage?.DeliveryUsageMins - limits.streaming,
          0
        ),
        StorageUsageMins: Math.max(usage?.StorageUsageMins - limits.storage, 0),
      };

      return overUsage;
    };

    const calculateOverUsageBill = async (overusage) => {
      const payAsYouGoData = products["prod_O9XuWMU1Up6QKf"];

      const overUsageBill: OverUsageBill = {
        transcodingBill: {
          units: overusage.TotalUsageMins,
          total: Number(
            (overusage.TotalUsageMins * payAsYouGoData.usage[0].price).toFixed(
              2
            )
          ),
        },
        deliveryBill: {
          units: overusage.DeliveryUsageMins,
          total: Number(
            (
              overusage.DeliveryUsageMins * payAsYouGoData.usage[1].price
            ).toFixed(2)
          ),
        },
        storageBill: {
          units: overusage.StorageUsageMins,
          total: Number(
            (
              overusage.StorageUsageMins * payAsYouGoData.usage[2].price
            ).toFixed(2)
          ),
        },
      };

      return overUsageBill;
    };

    const getSubscriptionAndUsage = async (subscriptionId) => {
      const [res, subscription] = await getSubscription(subscriptionId);
      if (res.status == 200) {
        setSubscription(subscription);
      }
      doGetUsage(
        subscription?.current_period_start,
        subscription?.current_period_end,
        subscription?.status
      );
    };

    if (user) {
      doGetInvoices(user.stripeCustomerId);
      getSubscriptionAndUsage(user.stripeCustomerSubscriptionId);
    }
  }, [user]);

  if (!user) {
    return <Layout />;
  }
  return (
    <Layout
      id="billing"
      breadcrumbs={[{ title: "Billing" }]}
      {...Content.metaData}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$7" }}>
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
                  Billing
                </Box>
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
        </Box>
        <Box css={{ mb: "$8" }}>
          <Flex
            justify="between"
            align="end"
            css={{
              borderBottom: "1px solid",
              borderColor: "$neutral6",
              pb: "$3",
              mb: "$4",
              width: "100%",
            }}>
            <Heading size="1">
              <Flex align="center">
                <Box
                  css={{
                    mr: "$3",
                    fontWeight: 600,
                    letterSpacing: "0",
                  }}>
                  Current Plan
                </Box>
              </Flex>
            </Heading>
          </Flex>
          <Flex
            justify="between"
            align="center"
            css={{ fontSize: "$3", color: "$hiContrast" }}>
            <Text variant="neutral">
              You are currently on the
              <Badge
                size="1"
                variant="neutral"
                css={{ mx: "$1", fontWeight: 700, letterSpacing: 0 }}>
                {user?.stripeProductId
                  ? products[user.stripeProductId]?.name ||
                    products[user.newStripeProductId]?.name
                  : products["hacker_1"]?.name}
              </Badge>
              plan.
            </Text>
            <Link href="/dashboard/billing/plans" passHref legacyBehavior>
              <A
                variant="primary"
                css={{ display: "flex", alignItems: "center" }}>
                View Plans & Upgrade <ArrowRightIcon />
              </A>
            </Link>
          </Flex>
        </Box>
        <Box css={{ mb: "$9" }}>
          <Flex
            justify="between"
            align="end"
            css={{
              borderBottom: "1px solid",
              borderColor: "$neutral6",
              pb: "$3",
              mb: "$5",
              width: "100%",
            }}>
            <Heading size="1">
              <Flex align="center" justify="between">
                <Box
                  css={{
                    mr: "$3",
                    fontWeight: 600,
                    letterSpacing: "0",
                  }}>
                  Payment Method
                </Box>
              </Flex>
            </Heading>
            <PaymentMethodDialog invalidateQuery={invalidateQuery} />
          </Flex>
          <Flex
            css={{
              ".rccs__card__background": {
                background:
                  "linear-gradient(to right, $colors$green11, $colors$green11) !important",
              },
              ".rccs__card--front": {
                color: "white !important",
              },
            }}>
            {user?.stripeCustomerPaymentMethodId ? (
              <>
                <PaymentMethod data={data} />
              </>
            ) : (
              "No payment method on file."
            )}
          </Flex>
        </Box>
        <Box css={{ mb: "$9" }}>
          <Flex
            justify="between"
            align="end"
            css={{
              mb: "$4",
              width: "100%",
            }}>
            <Heading size="1">
              <Flex align="center">
                <Box
                  css={{
                    mr: "$3",
                    fontWeight: 600,
                    letterSpacing: "0",
                  }}>
                  Usage
                </Box>
              </Flex>
            </Heading>
          </Flex>
          <Link href="/dashboard/usage" passHref legacyBehavior>
            <A
              variant="primary"
              css={{ display: "flex", alignItems: "center" }}>
              View Usage Details <ArrowRightIcon />
            </A>
          </Link>
        </Box>
        <Box css={{ mb: "$9" }}>
          <Flex
            justify="between"
            align="end"
            css={{
              mb: "$4",
              width: "100%",
            }}>
            <Heading size="1">
              <Flex align="center">
                <Box
                  css={{
                    mr: "$3",
                    fontWeight: 600,
                    letterSpacing: "0",
                  }}>
                  Upcoming Invoice
                </Box>
              </Flex>
            </Heading>
          </Flex>
          {!products[user.stripeProductId]?.order ? (
            <Text variant="neutral">
              The Hacker plan is free of charge up to 1000 minutes per month and
              limited to 10 concurrent viewers per account.
            </Text>
          ) : (
            subscription && (
              <UpcomingInvoiceTable
                subscription={subscription}
                usage={usage}
                overUsageBill={overUsageBill}
                upcomingInvoice={upcomingInvoice}
                prices={products[user.stripeProductId].usage}
              />
            )
          )}
        </Box>

        {invoices?.data.filter((invoice) => invoice.lines.total_count > 1)
          .length > 0 && (
          <Box css={{ mb: "$6" }}>
            <Flex
              justify="between"
              align="end"
              css={{
                mb: "$4",
                width: "100%",
              }}>
              <Heading size="1">
                <Flex align="center">
                  <Box
                    css={{
                      mr: "$3",
                      fontWeight: 600,
                      letterSpacing: "0",
                    }}>
                    Past Invoices
                  </Box>
                </Flex>
              </Heading>
            </Flex>
            <PastInvoicesTable invoices={invoices} />
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default Billing;
