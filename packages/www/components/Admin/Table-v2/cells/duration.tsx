/** @jsx jsx */
import { jsx } from "theme-ui";
import { formatDuration, intervalToDuration } from "date-fns";
import { CellComponentProps, TableData } from "../types";

export type DurationCellProps = { duration: number; status?: string };

const DurationCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, DurationCellProps>) => {
  if (cell.value.status === "waiting") {
    return "In progress";
  }
  if (cell.value.duration === 0) {
    return "n/a";
  }
  try {
    const dur = intervalToDuration({
      start: new Date(0),
      end: new Date(Math.ceil(cell.value.duration / 60) * 60 * 1000 || 0),
    });
    return formatDuration(dur);
  } catch (error) {
    return "n/a";
  }
};

export default DurationCell;
