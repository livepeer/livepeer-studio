import imageUrlBuilder from "@sanity/image-url";
import { useRouter } from "next/router";
import { client } from "lib/client";
import Layout from "layouts/main";
import {
  Box,
  Flex,
  Button,
  Container,
  Text,
  Link as A,
} from "@livepeer/design-system";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import Why from "components/Site/Why";

const benefitsListItems = [
  {
    icon: {
      provider: "mdi",
      name: "MdMoneyOff",
    },
    title: "Affordable",
    description: (
      <Box>
        Save up to 90% on costs with{" "}
        <Link href="/pricing" passHref legacyBehavior>
          <A variant="primary">streamlined pricing</A>
        </Link>{" "}
        that takes advantage of the Livepeer Network's open marketplace of
        infrastructure providers representing access to 70k+ GPUs.
      </Box>
    ),
  },
  {
    icon: {
      provider: "fi",
      name: "FiSmile",
    },
    title: "Easy-to-use",
    description:
      "The Livepeer API untangles the intricate web of video infrastructure workflows, offering developers one unified and intuitive API that can fulfill all video application requirements.",
  },
  {
    icon: {
      provider: "fi",
      name: "FiMove",
    },
    title: "Scalable",
    description:
      "The Livepeer Network harnesses the power of cryptoeconomic incentives, drawing a global network of providers to process and deliver video, enabling near-infinite scalability.",
  },
  {
    icon: {
      provider: "mdi",
      name: "MdVerified",
    },
    title: "Reliable",
    description:
      "An always-on, incentivized network and intelligent distribution keeps your application’s video streams flowing 24/7.",
  },
  {
    icon: {
      provider: "mdi",
      name: "MdBolt",
    },
    title: "Performant",
    description:
      "Deliver outstanding performance by leveraging the network's highly competitive infrastructure providers transmitting high-quality video at astonishing speeds.",
  },
  {
    icon: {
      provider: "fi",
      name: "FiGlobe",
    },
    title: "Open",
    description:
      "The Livepeer Network runs on open source software. Tap into a worldwide network of Livepeer experts committed to driving value and solutions.",
  },
];

const ProductPage = ({
  title,
  metaTitle,
  metaDescription,
  metaUrl,
  openGraphImage,
  content,
  noindex = false,
  preview,
}) => {
  const router = useRouter();
  const builder = imageUrlBuilder(client as any);

  if (router.isFallback) {
    return (
      <Layout>
        <Box
          css={{
            py: "$5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}>
          Loading...
        </Box>
      </Layout>
    );
  }

  if (!content || !title) {
    return (
      <Layout>
        <Box
          css={{
            py: "$5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}>
          Error
        </Box>
      </Layout>
    );
  }

  return (
    <Layout
      title={metaTitle}
      description={metaDescription}
      noindex={noindex}
      image={{
        url: builder.image(openGraphImage).url(),
        alt: openGraphImage?.asset?.altText,
      }}
      url={metaUrl}
      preview={preview}>
      <Box css={{ position: "relative" }}>
        <Container
          size="4"
          css={{
            maxWidth: "1245px",
            px: "$6",
            py: "$7",
            width: "100%",
            "@bp3": {
              pt: "$6",
              pb: "$8",
              px: "$4",
            },
          }}>
          <Box css={{ textAlign: "center", maxWidth: 890, m: "0 auto" }}>
            <Box
              as="h1"
              css={{
                fontSize: 70,
                lineHeight: "60px",
                fontWeight: 600,
                letterSpacing: "-1px",
                mb: "$6",
              }}>
              BUILD ON-DEMAND VIDEO IN MINUTES
            </Box>
            <Text size={5} css={{ lineHeight: 1.7, mb: "$5" }}>
              Livepeer Studio enables you to build video into your product super
              fast, and process video even faster.
            </Text>
            <Flex align="center" justify="center">
              <Link href="/register" passHref>
                <Button
                  target="_blank"
                  size={4}
                  as="a"
                  css={{ mr: "$2", gap: "$2" }}
                  variant="green">
                  Get Started
                  <FiArrowUpRight />
                </Button>
              </Link>
            </Flex>
          </Box>
        </Container>
        <Box css={{ bc: "$neutral3" }}>
          <Container>
            <Why
              backgroundColor="$neutral3"
              reasons={benefitsListItems}
              ctas={
                <Link href="https://livepeer.org" target="_blank">
                  <Button variant="green" size="4" css={{ gap: "$1" }}>
                    Learn more <FiArrowUpRight />
                  </Button>
                </Link>
              }
            />
          </Container>
        </Box>
      </Box>
    </Layout>
  );
};

export async function getStaticPaths() {
  const queryForPaths = `*[_type=='page' && defined(slug.current)][].slug.current`;
  const data: string[] = (await client.fetch(queryForPaths)) ?? [];
  const paths = data
    .filter((path) => path !== "jobs" && path !== "team")
    .map((path) => ({ params: { slug: path } }));
  return {
    fallback: true,
    paths,
  };
}

export async function getStaticProps({ params, locale }) {
  const { slug } = params;
  const queryParams = {
    slug,
  };

  const query = `*[_type=="page" && slug.current == $slug][0]`;
  const pageData = (await client.fetch(query, queryParams)) ?? {};

  return {
    props: {
      ...pageData,
    },
    revalidate: 86400,
  };
}

ProductPage.theme = "light-theme-green";
export default ProductPage;
