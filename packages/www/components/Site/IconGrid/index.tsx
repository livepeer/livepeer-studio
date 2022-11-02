import { Link as A, Box as LiveBox } from "@livepeer/design-system";
import { Text, Container, Box } from "@theme-ui/components";
import Image from "next/image";

export default function IconGrid({ title, richText, icons }) {
  console.log(icons);
  return (
    <Box sx={{ paddingY: "64px" }}>
      <Container css={{ maxWidth: "1200px", textAlign: "center" }}>
        {title && (
          <Box sx={{ marginBottom: "32px" }}>
            <LiveBox
              css={{
                fontSize: 32,
                fontWeight: 600,
                lineHeight: 1,
                mb: 32,
                letterSpacing: "0px",
                "@bp1": {
                  fontSize: 40,
                  letterSpacing: "-1px",
                },
                "@bp2": {
                  fontSize: 50,
                  letterSpacing: "-2px",
                },
                "@bp3": {
                  fontSize: 58,
                  letterSpacing: "-4px",
                },
              }}>
              {title}
            </LiveBox>
            <Text sx={{ maxWidth: "640px", marginX: "auto" }}>{richText}</Text>
          </Box>
        )}
        <Box
          sx={{
            display: ["block", "flex"],
            justifyContent: ["unset", "space-between"],
            width: "100%",
            borderTop: "1px solid #666774",
            borderBottom: "1px solid #666774",
            paddingY: "64px",
            paddingX: "32px",
          }}>
          {icons.map((icon) => {
            return (
              <Box sx={{ display: "inline-block", padding: "32px" }}>
                <img
                  src={icon.asset.url}
                  alt={"Livepeer client"}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
