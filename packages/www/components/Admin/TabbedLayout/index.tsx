/** @jsx jsx */
import { jsx } from "theme-ui";
import Layout from "layouts/admin";
import { Flex } from "@theme-ui/components";
import Tabs, { TabType } from "@components/Admin/Tabs";
import { FunctionComponent } from "react";

type TabbedLayoutProps = {
  tabs: Array<TabType>;
  logout?: Function;
};

const TabbedLayout: FunctionComponent<TabbedLayoutProps> = ({
  tabs,
  children,
}) => {
  return (
    <Layout>
      <Flex
        sx={{
          flexDirection: "column",
          flexGrow: 1,
          alignItems: "center",
        }}>
        <Tabs tabs={tabs} />
        {children}
      </Flex>
    </Layout>
  );
};

export default TabbedLayout;
