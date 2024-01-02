import { Box } from "@livepeer/design-system";
import { Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import Ripe from "lib/ripe";

export const makeSelectAction = (title: string, onClick: () => void) => ({
  onClick,
  css: { display: "flex", alignItems: "center" },
  size: "2",
  children: (
    <>
      <Cross1Icon /> <Box css={{ ml: "$2" }}>{title}</Box>
    </>
  ),
});

export const makeCreateAction = (title: string, onClick: () => void) => ({
  onClick: () => {
    Ripe.track({
      event: `clicked ${title} button`,
    });
    onClick();
  },
  css: { display: "flex", alignItems: "center", ml: "$2" },
  children: (
    <>
      <PlusIcon />{" "}
      <Box as="span" css={{ ml: "$2" }}>
        {title}
      </Box>
    </>
  ),
});
