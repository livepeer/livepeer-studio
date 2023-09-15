import { Box, Button as ButtonBase } from "@livepeer/design-system";
import React from "react";

export const Button = React.forwardRef(
  ({ arrow = false, children, css = {}, ...props }: any, forwardedRef) => (
    <ButtonBase
      ref={forwardedRef}
      variant="green"
      css={{
        display: "flex",
        ai: "center",
        boxShadow: "none",
        cursor: "pointer",
        textDecoration: "none",
        p: 0,
        "&:hover": {
          textDecoration: "none",
          boxShadow: "none",
        },
        "&:disabled": {
          background: "none",
          pointerEvents: "none",
          boxShadow: "inset 0 0 0 1px $colors$gray7",
          "&:hover": {
            boxShadow: "inset 0 0 0 1px $colors$gray7",
            color: "$mauve8",
            background: "none",
          },
        },
        ...css,
      }}
      size="3"
      {...props}>
      <Box
        css={{
          px: "$3",
          display: "flex",
          ai: "center",
          width: "100%",
          justifyContent: "center",
          ".HoverArrow": {
            position: "relative",
            marginLeft: "8px",
            strokeWidth: "2",
            fill: "none",
            stroke: "currentColor",
          },
          ".HoverArrow__linePath": {
            opacity: "0",
            transition: "opacity cubic-bezier(0.215,0.61,0.355,1) .1s",
          },
          ".HoverArrow__tipPath": {
            transition:
              "transform cubic-bezier(0.215,0.61,0.355,1) .1s, transform cubic-bezier(0.215,0.61,0.355,1) .1s",
          },
          "&:hover .HoverArrow": {
            transition: "cubic-bezier(0.215,0.61,0.355,1) .1s",
            ".HoverArrow__linePath": {
              opacity: 1,
            },
            ".HoverArrow__tipPath": {
              transform: "translateX(3px)",
            },
          },
        }}>
        {children}
        {arrow && (
          <svg
            className="HoverArrow"
            width="10"
            height="10"
            viewBox="0 0 10 10"
            aria-hidden="true">
            <g fillRule="evenodd">
              <path className="HoverArrow__linePath" d="M0 5h7" />
              <path className="HoverArrow__tipPath" d="M1 1l4 4-4 4" />
            </g>
          </svg>
        )}
      </Box>
    </ButtonBase>
  )
);

export default Button;
