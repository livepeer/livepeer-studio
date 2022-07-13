import { useCallback, useMemo, useState } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import DateCell, { DateCellProps } from "components/Dashboard/Table/cells/date";
import StatusBadge, { Variant as StatusVariant } from "../StatusBadge";
import { dateSort, stringSort } from "components/Dashboard/Table/sorts";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { Column } from "react-table";
import {
  Box,
  Flex,
  Heading,
  Link as A,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  Button,
  Text,
  useSnackbar,
} from "@livepeer/design-system";
import { useToggleState } from "hooks/use-toggle-state";
import { Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import Spinner from "components/Dashboard/Spinner";
import WebhookDialog, { Action } from "components/Dashboard/WebhookDialog";
import { useRouter } from "next/router";
import { Webhook } from "@livepeer.studio/api";

type WebhooksTableData = {
  name: TextCellProps;
  url: TextCellProps;
  created: DateCellProps;
  status: TextCellProps;
};

// 1 hour
const WARNING_TIMEFRAME = 1000 * 60 * 60;

const WebhooksTable = ({ title = "Webhooks" }: { title?: string }) => {
  const router = useRouter();
  const { user, getWebhooks, deleteWebhook, deleteWebhooks, createWebhook } =
    useApi();
  const deleteDialogState = useToggleState();
  const [savingDeleteDialog, setSavingDeleteDialog] = useState(false);
  const [openSnackbar] = useSnackbar();
  const createDialogState = useToggleState();
  const { state, stateSetter } = useTableState<WebhooksTableData>({
    tableId: "webhooksTable",
  });

  const columns = useMemo(
    () => [
      {
        Header: "URL",
        accessor: "url",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.url.value", ...params),
      },
      {
        Header: "Name",
        accessor: "name",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.name.children", ...params),
      },
      {
        Header: "Created at",
        accessor: "created",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          dateSort("original.created.date", ...params),
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: TextCell,
        disableSortBy: true,
      },
    ],
    []
  );

  const fetcher: Fetcher<WebhooksTableData> = useCallback(
    async (state) => {
      const [webhooks, nextCursor, _res, count] = await getWebhooks(
        false,
        false,
        state.order,
        null,
        state.pageSize,
        state.cursor,
        true
      );

      return {
        nextCursor,
        count,
        rows: webhooks.map((webhook: Webhook) => {
          return {
            id: webhook.id,
            name: {
              children: webhook.name,
              href: `/dashboard/developers/webhooks/${webhook.id}`,
              css: {
                cursor: "pointer",
              },
            },
            url: {
              value: webhook.url,
              children: (
                <A as="div" variant="primary">
                  {webhook.url}
                </A>
              ),
              href: `/dashboard/developers/webhooks/${webhook.id}`,
              css: {
                cursor: "pointer",
              },
            },
            created: {
              date: new Date(webhook.createdAt),
              fallback: <i>unseen</i>,
              href: `/dashboard/developers/webhooks/${webhook.id}`,
              css: {
                cursor: "pointer",
              },
            },
            status: {
              children: (
                <Box>
                  {!webhook.status ? (
                    <StatusBadge
                      variant={StatusVariant.Idle}
                      tooltipText="No triggers yet"
                    />
                  ) : (webhook.status.lastFailure &&
                      +Date.now() - webhook.status.lastFailure?.timestamp <
                        WARNING_TIMEFRAME) ||
                    webhook.status.lastFailure?.timestamp >=
                      webhook.status.lastTriggeredAt ? (
                    <StatusBadge
                      variant={StatusVariant.Unhealthy}
                      timestamp={webhook.status.lastFailure.timestamp}
                      tooltipText="Last failure"
                    />
                  ) : (
                    <StatusBadge
                      variant={StatusVariant.Healthy}
                      timestamp={webhook.status.lastTriggeredAt}
                      tooltipText="Last triggered"
                    />
                  )}
                </Box>
              ),
              href: `/dashboard/developers/webhooks/${webhook.id}`,
              css: {
                cursor: "pointer",
              },
            },
          };
        }),
      };
    },
    [getWebhooks, user.id]
  );

  const onDeleteWebhooks = useCallback(async () => {
    if (state.selectedRows.length === 1) {
      await deleteWebhook(state.selectedRows[0].id);
      await state.invalidate();
      deleteDialogState.onOff();
    } else if (state.selectedRows.length > 1) {
      await deleteWebhooks(state.selectedRows.map((s) => s.id));
      await state.invalidate();
      deleteDialogState.onOff();
    }
  }, [
    deleteWebhook,
    deleteWebhooks,
    deleteDialogState.onOff,
    state.selectedRows.length,
    state.invalidate,
  ]);

  const emptyState = (
    <Flex
      direction="column"
      justify="center"
      css={{
        margin: "0 auto",
        height: "calc(100vh - 400px)",
        maxWidth: 450,
      }}>
      <Heading css={{ fontWeight: 500, mb: "$3" }}>
        Create your first webhook
      </Heading>
      <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
        Listen for events on your Livepeer Studio account so your integration
        can automatically trigger reactions.
      </Text>
      <Button
        onClick={() => createDialogState.onOn()}
        css={{ alignSelf: "flex-start" }}
        size="2"
        variant="primary">
        <PlusIcon />{" "}
        <Box as="span" css={{ ml: "$2" }}>
          Create webhook
        </Box>
      </Button>
    </Flex>
  );

  return (
    <>
      <Table
        columns={columns}
        fetcher={fetcher}
        state={state}
        stateSetter={stateSetter}
        rowSelection="all"
        emptyState={emptyState}
        header={
          <>
            <Heading size="2" css={{ fontWeight: 600 }}>
              {title}
            </Heading>
          </>
        }
        selectAction={{
          onClick: deleteDialogState.onOn,
          children: (
            <>
              <Cross1Icon />{" "}
              <Box css={{ ml: "$2" }} as="span">
                Delete
              </Box>
            </>
          ),
        }}
        createAction={{
          onClick: createDialogState.onOn,
          css: { display: "flex", alignItems: "center" },
          children: (
            <>
              <PlusIcon />{" "}
              <Box as="span" css={{ ml: "$2" }}>
                Create webhook
              </Box>
            </>
          ),
        }}
      />

      <AlertDialog
        open={deleteDialogState.on}
        onOpenChange={deleteDialogState.onOff}>
        <AlertDialogContent
          css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
          <AlertDialogTitle asChild>
            <Heading size="1">
              Delete{" "}
              {state.selectedRows.length > 1 ? state.selectedRows.length : ""}{" "}
              webhook
              {state.selectedRows.length > 1 && "s"}?
            </Heading>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <Text
              size="3"
              variant="gray"
              css={{ mt: "$2", lineHeight: "22px" }}>
              This will permanently remove the webhook
              {state.selectedRows.length > 1 && "s"}. This action cannot be
              undone.
            </Text>
          </AlertDialogDescription>

          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
            <AlertDialogCancel asChild>
              <Button size="2" onClick={deleteDialogState.onOff} ghost>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                size="2"
                disabled={savingDeleteDialog}
                onClick={async (e) => {
                  try {
                    e.preventDefault();
                    setSavingDeleteDialog(true);
                    await onDeleteWebhooks();
                    openSnackbar(
                      `${state.selectedRows.length} webhook${
                        state.selectedRows.length > 1 ? "s" : ""
                      } deleted.`
                    );
                    setSavingDeleteDialog(false);
                    deleteDialogState.onOff();
                  } catch (e) {
                    setSavingDeleteDialog(false);
                  }
                }}
                variant="red">
                {savingDeleteDialog && (
                  <Spinner
                    css={{
                      color: "$hiContrast",
                      width: 16,
                      height: 16,
                      mr: "$2",
                    }}
                  />
                )}
                Delete
              </Button>
            </AlertDialogAction>
          </Flex>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create webhook dialog */}
      <WebhookDialog
        action={Action.Create}
        isOpen={createDialogState.on}
        onOpenChange={createDialogState.onToggle}
        onSubmit={async ({ events, name, url }) => {
          const newWebhook = await createWebhook({
            events,
            name,
            url,
          });
          await state.invalidate();
          const query = router.query.admin === "true" ? { admin: true } : {};
          await router.push({
            pathname: `/dashboard/developers/webhooks/${newWebhook.id}`,
            query,
          });
        }}
      />
    </>
  );
};

export default WebhooksTable;
