import { useCallback, useEffect, useMemo } from "react";
import { useApi } from "../../hooks";
import Table, {
  DefaultSortBy,
  Fetcher,
  sortByToString,
  useTableState,
} from "components/Table";
import { useSnackbar } from "@livepeer/design-system";
import {
  filterItems,
  makeColumns,
  makeEmptyState,
  rowsPageFromState,
  StreamSessionsTableData,
} from "./helpers";
import { useProjectContext } from "context/ProjectContext";

const StreamSessionsTable = ({ title = "Sessions" }: { title?: string }) => {
  const { user, getStreamSessionsByUserId } = useApi();
  const { state, stateSetter } = useTableState<StreamSessionsTableData>({
    tableId: "allSessionsTable",
    initialOrder: sortByToString(DefaultSortBy),
  });
  const [openSnackbar] = useSnackbar();
  const columns = useMemo(makeColumns, []);
  const { appendProjectId, projectId } = useProjectContext();

  const fetcher: Fetcher<StreamSessionsTableData> = useCallback(
    async (state) =>
      rowsPageFromState(
        state,
        user.id,
        getStreamSessionsByUserId,
        openSnackbar,
        appendProjectId,
      ),
    [getStreamSessionsByUserId, user.id],
  );

  useEffect(() => {
    stateSetter.setProjectId(projectId);
  }, [projectId]);

  return (
    <Table
      title={title}
      state={state}
      stateSetter={stateSetter}
      columns={columns}
      fetcher={fetcher}
      initialSortBy={[DefaultSortBy]}
      showOverflow={true}
      filterItems={filterItems}
      emptyState={makeEmptyState()}
    />
  );
};

export default StreamSessionsTable;
