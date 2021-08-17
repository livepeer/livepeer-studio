import Fade from "react-reveal/Fade";
import Layout from "layouts/main";
import DefaultError from "@components/Marketing/DefaultError";
import { GraphQLClient, request } from "graphql-request";
import { print } from "graphql/language/printer";
import allPages from "../queries/allPages.gql";
import { getComponent } from "lib/utils";
import { useRouter } from "next/router";
import { Box } from "@livepeer.com/design-system";

const Page = ({
  title,
  slug,
  description,
  content,
  noindex = false,
  preview,
}) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout>
        <Box
          css={{
            py: "$5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          Loading...
        </Box>
      </Layout>
    );
  }

  if (!content || !title) {
    return <DefaultError />;
  }

  return (
    <Layout
      title={`${title} - Livepeer.com`}
      description={description}
      url={`https://livepeer.com/${slug.current}`}
      noindex={noindex}
      preview={preview}>
      {content.map((component, i) => (
        <Fade key={i}>{getComponent(component)}</Fade>
      ))}
    </Layout>
  );
};

export async function getStaticPaths() {
  const { allPage } = await request(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    print(allPages),
    {
      where: {},
    }
  );
  let paths = [];
  for (const page of allPage) {
    paths.push({ params: { slug: page.slug.current } });
  }
  // TODO, next errors when it tries to build and /team and /jobs, a page that's already here.
  // Remove from sanity maybe?
  paths = paths.filter(
    (p) => p.params.slug !== "jobs" && p.params.slug !== "team"
  );
  return {
    fallback: true,
    paths,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  );

  let data: any = await graphQLClient.request(print(allPages), {
    where: {
      slug: { current: { eq: slug } },
    },
  });

  let page = data.allPage.find((p) => p.slug.current === slug);

  return {
    props: {
      ...page,
    },
    revalidate: 1,
  };
}

export default Page;
