import { keyframes, Box } from "@livepeer/design-system";

const rotate = keyframes({
  "100%": { transform: "rotate(360deg)" },
});

const Index = ({ css = {}, speed = "1s" }) => (
  <Box
    css={{
      color: "$gray4",
      border: "3px solid",
      borderColor: "$primary9",
      borderRadius: "50%",
      borderTopColor: "inherit",
      width: 26,
      height: 26,
      maxWidth: 26,
      maxHeight: 26,
      animation: `${rotate} ${speed} linear`,
      animationIterationCount: "infinite",
      ...css,
    }}
  />
);

export default Index;
