import Link from "next/link";
import ReactTooltip from "react-tooltip";
import { CellComponentProps, TableData } from "../types";
import { Box, Link as A } from "@livepeer/design-system";

export type TextCellProps = {
  children?: React.ReactNode;
  tooltipChildren?: React.ReactNode;
  href?: string;
  id?: string;
};

const TextCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, TextCellProps>) => {
  const pid = "tooltip-" + cell.value.id;
  return (
    <Box css={{ lineHeight: 1.5 }}>
      {cell.value.tooltipChildren ? (
        <ReactTooltip
          id={pid}
          className="tooltip"
          place="top"
          type="dark"
          effect="solid">
          {cell.value.tooltipChildren}
        </ReactTooltip>
      ) : null}
      <Box data-tip data-for={pid}>
        {cell.value.children}
      </Box>
    </Box>
  );
};

export default TextCell;
