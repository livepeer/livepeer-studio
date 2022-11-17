import Layout from "layouts/main";
import { Home as Content } from "content";
import HomeHero from "components/Site/HomeHero";
import ToolkitSection from "components/Site/ToolkitSection";
import GuideSection from "components/Site/GuideSection";
import FeaturedAppsSection from "components/Site/FeaturedAppsSection";
import PrinciplesSection from "components/Site/PrinciplesSection";
import { GraphQLClient } from "graphql-request";
import allHome from "../queries/allHome.gql";
import { print } from "graphql/language/printer";
import Head from "next/head";

const HeadGTMScript = () => (
  <Head>
    <script
      dangerouslySetInnerHTML={{
        __html: `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-3EELQ181ZT%22%3E</script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-3EELQ181ZT');
</script>
`,
      }}
    />
  </Head>
);

const HomePage = (props) => {
  return (
    <>
      <HeadGTMScript />
      <Layout navBackgroundColor="$hiContrast" {...Content.metaData}>
        <HomeHero content={props.heroSection} />
        <ToolkitSection content={props.toolkitSection} />
        <GuideSection content={props.guideSection} />
        <FeaturedAppsSection content={props.featuredAppSection} />
        <PrinciplesSection content={props.principlesSection} />
      </Layout>
    </>
  );
};

export async function getStaticProps({ locale }) {
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  );

  const id = {
    en: "",
    es: "i18n_es-ES",
  };

  const variables = {
    where: { _id: { matches: id[locale] } },
  };

  let data: any = await graphQLClient.request(print(allHome), variables);

  return {
    props: {
      ...data.allHome[0],
      preview: false,
    },
    revalidate: 1,
  };
}

HomePage.theme = "dark-theme-blue";
export default HomePage;
