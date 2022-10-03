import { Asset, Task } from "@livepeer.studio/api";
import { Box } from "@livepeer/design-system";
import { get } from "lodash";
import ActionCell, { ActionCellProps } from "../Table/cells/action";
import CreatedAtCell, { CreatedAtCellProps } from "../Table/cells/createdAt";
import DateCell, { DateCellProps } from "../Table/cells/date";
import NameCell, { NameCellProps } from "../Table/cells/name";
import TextCell, { TextCellProps } from "../Table/cells/text";
import { formatFiltersForApiRequest } from "../Table/filters";
import { stringSort, dateSort } from "../Table/sorts";
import { SortTypeArgs } from "../Table/types";

export const makeColumns = () => [
  {
    Header: "Name",
    accessor: "name",
    Cell: NameCell,
    sortType: (...params: SortTypeArgs) =>
      stringSort("original.name.value", ...params),
  },
  {
    Header: "Created",
    accessor: "createdAt",
    Cell: CreatedAtCell,
    sortType: (...params: SortTypeArgs) =>
      dateSort("original.createdAt.date", ...params),
  },
  {
    Header: "Updated",
    accessor: "updatedAt",
    Cell: DateCell,
    sortType: (...params: SortTypeArgs) =>
      dateSort("original.updatedAt.date", ...params),
  },
  {
    Header: "Source",
    accessor: "source",
    Cell: TextCell,
    disableSortBy: true,
  },
  {
    Header: "",
    accessor: "action",
    Cell: ActionCell,
    disableSortBy: true,
    width: "$5",
  },
];

export type AssetsTableData = {
  id: string;
  name: NameCellProps;
  source: TextCellProps;
  createdAt: CreatedAtCellProps;
  updatedAt: DateCellProps;
  action: ActionCellProps;
};

export type RowsPageFromStateResult = {
  rows: AssetsTableData[];
  nextCursor: any;
  count: any;
};

export const rowsPageFromState = async (
  state,
  userId,
  getAssets,
  getTasks,
  onDeleteAsset
): Promise<RowsPageFromStateResult> => {
  const [assets, nextCursor, count] = await getAssets(userId, {
    filters: formatFiltersForApiRequest(state.filters),
    limit: state.pageSize.toString(),
    cursor: state.cursor,
    order: state.order,
    count: true,
  });

  const [tasks] = await getTasks(userId);

  const rows: AssetsTableData[] = assets.map(
    (asset: Asset): AssetsTableData => {
      const source: Task =
        tasks && tasks.find((task: Task) => task.outputAssetId === asset.id);
      const sourceUrl = get(source, "params.import.url");
      const isStatusFailed = asset.status.phase === "failed";

      return {
        id: asset.id,
        name: {
          id: asset.id,
          href: `/dashboard/assets/${asset.id}`,
          assetName: asset.name,
          isStatusFailed,
          errorMessage: asset.status.errorMessage,
        },
        source: {
          children: (
            <Box>
              {sourceUrl &&
              (sourceUrl.indexOf("https://livepeercdn.com") === 0 ||
                sourceUrl.indexOf("https://cdn.livepeer.com") === 0)
                ? "Live Stream"
                : "Upload"}
            </Box>
          ),
          fallback: <Box css={{ color: "$primary8" }}>—</Box>,
          href: `/dashboard/assets/${asset.id}`,
        },
        createdAt: {
          id: asset.id,
          date: new Date(asset.createdAt),
          fallback: <Box css={{ color: "$primary8" }}>—</Box>,
          href: `/dashboard/assets/${asset.id}`,
          isStatusFailed,
          errorMessage: asset.status.errorMessage,
        },
        updatedAt: {
          date:
            asset.status.updatedAt && asset.status.updatedAt !== asset.createdAt
              ? new Date(asset.status.updatedAt)
              : null,
          fallback: <Box css={{ color: "$primary8" }}>—</Box>,
          href: `/dashboard/assets/${asset.id}`,
        },
        action: {
          id: asset.id,
          isStatusFailed,
          onDelete: () => onDeleteAsset(asset.id),
        },
      };
    }
  );
  return { rows, nextCursor, count };
};
