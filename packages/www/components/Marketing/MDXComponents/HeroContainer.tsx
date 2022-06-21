import React from "react";
import { Box } from "@livepeer/design-system";

const HeroContainer = ({
  css,
  children,
}: {
  css?: any;
  children?: React.ReactNode;
}) => {
  return (
    <Box
      // In case any semantic content sneaks through in a hero, let's hide it
      // from the a11y tree since this is a presentational component.
      role="presentation"
      css={{
        backgroundImage: "linear-gradient(330deg, $purple9 0%, $blue9 100%)",
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        py: 100,
        borderRadius: "$3",
        ...(css as any),

        "@bp3": { mx: "-$7" },
        "@bp4": { mx: "-$8" },
      }}>
      {children}
    </Box>
  );
};

export default HeroContainer;
