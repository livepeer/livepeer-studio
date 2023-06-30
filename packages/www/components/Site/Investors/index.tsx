import { Box, Grid, Text, Container } from "@livepeer/design-system";
import Guides from "components/Site/Guides";

const investorIds = [
  "northzone",
  "compound",
  "dgc",
  "collaborative-fund",
  "notation",
];
const Investors = ({ backgroundColor }) => {
  return (
    <Box
      css={{
        position: "relative",
        backgroundColor,
      }}>
      <Container
        size="3"
        css={{
          width: "100%",
          py: 64,
          px: 0,
          "@bp2": {
            py: 128,
          },
        }}>
        <Box
          css={{
            px: "$6",
            "@bp3": {
              px: "$3",
            },
          }}>
          <Text
            size="6"
            css={{
              color: "$primary9",
              textAlign: "center",
              mb: "$8",
            }}>
            Trusted by video industry and Web3 leaders
          </Text>

          <Grid
            css={{
              justifyContent: "center",
              alignItems: "center",
              gridTemplateColumns: "repeat(1,1fr)",
              "@bp1": {
                gridTemplateColumns: "repeat(3,1fr)",
              },
              "@bp2": {
                gridTemplateColumns: "repeat(5,1fr)",
              },
            }}
            gap="5">
            {investorIds.map((id) => (
              <Box
                as="img"
                key={id}
                src={`/img/investors/${id}.svg`}
                alt={`${id} logo`}
                className="lazyload"
                css={{
                  justifySelf: "center",
                  mb: "$5",
                  "@bp1": {
                    mb: 0,
                  },
                }}
              />
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Investors;
