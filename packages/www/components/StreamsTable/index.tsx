import { useCallback, useMemo, useState } from "react";
import { useApi } from "hooks";
import Table, {
  useTableState,
  Fetcher,
  DefaultSortBy,
  sortByToString,
} from "components/Table";
import { useToggleState } from "hooks/use-toggle-state";
import CreateStreamDialog from "./CreateStreamDialog";
import { useRouter } from "next/router";
import ActiveStreamsBadge from "components/ActiveStreamsBadge";
import {
  defaultCreateProfiles,
  filterItems,
  makeColumns,
  makeEmptyState,
  rowsPageFromState,
  StreamsTableData,
} from "./helpers";
import { makeSelectAction, makeCreateAction } from "../Table/helpers";
import TableHeader from "../Table/components/TableHeader";
import TableStateDeleteDialog from "../Table/components/TableStateDeleteDialog";
import StreamFilter from "./StreamFilter";
import { Flex } from "@livepeer/design-system";
import TypeFilterCard from "components/TypeFilterCard";

const filterCategory = ["All", "Active", "Unhealthy"];

const StreamsTable = ({
  title = "Streams",
  pageSize = 20,
  tableId,
  userId,
  viewAll,
}: {
  title: string;
  pageSize?: number;
  userId: string;
  tableId: string;
  viewAll?: string;
}) => {
  const router = useRouter();
  const { getStreams, createStream, deleteStream, deleteStreams } = useApi();
  const deleteDialogState = useToggleState();
  const createDialogState = useToggleState();
  const [filter, setFilter] = useState("all");
  const { state, stateSetter } = useTableState<StreamsTableData>({
    pageSize,
    tableId,
    initialOrder: sortByToString(DefaultSortBy),
  });
  const columns = useMemo(makeColumns, []);
  const fetcher: Fetcher<StreamsTableData> = useCallback(
    async (state) => rowsPageFromState(state, userId, getStreams),
    [userId]
  );

  const onCreateClick = useCallback(
    async (streamName: string) => {
      const newStream = await createStream({
        name: streamName,
        profiles: defaultCreateProfiles,
      });
      await state.invalidate();
      const query = router.query.admin === "true" ? { admin: true } : {};
      await router.push({
        pathname: `/dashboard/streams/${newStream.id}`,
        query,
      });
    },
    [createStream, state.invalidate]
  );

  const onSetFilters = (e) => {
    stateSetter.setCursor("");
    stateSetter.setPrevCursors([]);
    stateSetter.setFilters(e);
  };

  const handleFilterType = (type: string) => {
    stateSetter.setCursor("");
    stateSetter.setPrevCursors([]);
    const currentFilters = state.filters;

    setFilter(type);
    if (type === "All") {
      const newFilters = currentFilters.filter(
        (filter) => filter.id !== "isActive" && filter.id !== "isHealthy"
      );

      stateSetter.setFilters(newFilters);
    } else {
      const filter = [
        {
          id: type === "Active" ? "isActive" : "isHealthy",
          isOpen: true,
          labelOn: type === "Active" ? "Active" : "Unhealthy",
          labelOff: type === "Active" ? "Idle" : "Healthy",
          condition: {
            type: "boolean",
            value: type === "Active" ? true : false,
          },
        },
      ];

      stateSetter.setFilters(currentFilters.concat(filter));
    }
  };

  return (
    <>
      <Table
        columns={columns}
        fetcher={fetcher}
        state={state}
        stateSetter={stateSetter}
        rowSelection="all"
        filterItems={!viewAll && filterItems}
        viewAll={viewAll}
        initialSortBy={[DefaultSortBy]}
        emptyState={makeEmptyState(createDialogState)}
        selectAction={makeSelectAction("Delete", deleteDialogState.onOn)}
        createAction={makeCreateAction(
          "Create livestream",
          createDialogState.onOn
        )}
        header={
          <>
            <TableHeader title={title}>
              <ActiveStreamsBadge />
            </TableHeader>
            <>
              <Flex
                gap={4}
                css={{
                  my: "$4",
                }}>
                {filterCategory.map((category, index) => (
                  <TypeFilterCard
                    name={category}
                    value={state?.dataCount[index] || "0"}
                    isActive={filter === category}
                    handleClick={() => handleFilterType(category)}
                  />
                ))}
              </Flex>
              {!viewAll && filterItems && (
                <StreamFilter onDone={(e) => onSetFilters(e)} />
              )}
            </>
          </>
        }
      />

      <TableStateDeleteDialog
        entityName={{ singular: "stream", plural: "streams" }}
        state={state}
        dialogToggleState={deleteDialogState}
        deleteFunction={deleteStream}
        deleteMultipleFunction={deleteStreams}
      />

      <CreateStreamDialog
        isOpen={createDialogState.on}
        onOpenChange={createDialogState.onToggle}
        onCreate={onCreateClick}
      />
    </>
  );
};

export default StreamsTable;
