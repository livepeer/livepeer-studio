import { useCallback, useMemo } from "react";
import { PlusIcon } from "@radix-ui/react-icons";
import { useApi } from "hooks";
import Table, { useTableState, Fetcher } from "components/Dashboard/Table";
import { FilterItem } from "components/Dashboard/Table/filters";
import { Flex, Heading, Box, useSnackbar } from "@livepeer/design-system";
import { useToggleState } from "hooks/use-toggle-state";
import CreateAssetDialog from "./CreateAssetDialog";
import EmptyState from "./EmptyState";
import { AssetsTableData, makeColumns, rowsPageFromState } from "./helpers";

const filterItems: FilterItem[] = [
  { label: "Name", id: "name", type: "text" },
  { label: "Created", id: "createdAt", type: "date" },
  { label: "Updated", id: "updatedAt", type: "date" },
];

const AssetsTable = ({
  userId,
  title = "Assets",
  pageSize = 20,
  tableId,
  viewAll,
}: {
  userId: string;
  title?: string;
  pageSize?: number;
  tableId: string;
  viewAll?: string;
}) => {
  const {
    getAssets,
    uploadAssets,
    deleteAsset,
    getTasks,
    getCurrentFileUploads,
  } = useApi();
  const [openSnackbar] = useSnackbar();
  const createDialogState = useToggleState();
  const { state, stateSetter } = useTableState<AssetsTableData>({
    pageSize,
    tableId,
  });

  const columns = useMemo(makeColumns, []);

  const onDeleteAsset = (assetId: string) => {
    (async () => {
      await deleteAsset(assetId);
      await state.invalidate();
    })();
  };

  const currentFileUploads = getCurrentFileUploads();
  const fetcher: Fetcher<AssetsTableData> = useCallback(
    async (state) =>
      rowsPageFromState(
        state,
        userId,
        getAssets,
        getTasks,
        currentFileUploads,
        onDeleteAsset
      ),
    [userId, currentFileUploads]
  );

  return (
    <>
      <Table
        columns={columns}
        fetcher={fetcher}
        fetcherOptions={{ refetchInterval: 15000 }}
        state={state}
        stateSetter={stateSetter}
        filterItems={!viewAll && filterItems}
        emptyState={<EmptyState createDialogState={createDialogState} />}
        viewAll={viewAll}
        header={
          <Heading size="2">
            <Flex>
              <Box css={{ mr: "$3", fontWeight: 600, letterSpacing: 0 }}>
                {title}
              </Box>
            </Flex>
          </Heading>
        }
        initialSortBy={[{ id: "createdAt", desc: true }]}
        createAction={{
          onClick: createDialogState.onOn,
          css: { display: "flex", alignItems: "center", ml: "$1" },
          children: (
            <>
              <PlusIcon />{" "}
              <Box as="span" css={{ ml: "$2" }}>
                Upload asset
              </Box>
            </>
          ),
        }}
      />

      <CreateAssetDialog
        isOpen={createDialogState.on}
        onOpenChange={createDialogState.onToggle}
        onCreate={async ({ videoFiles }: { videoFiles: File[] }) => {
          try {
            await uploadAssets(videoFiles);
            await state.invalidate();
            createDialogState.onOff();
          } catch (e) {
            openSnackbar(`Error with uploading videos, please try again.`);
          }
        }}
      />
    </>
  );
};

export default AssetsTable;
