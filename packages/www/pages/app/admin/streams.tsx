/** @jsx jsx */
import { jsx } from "theme-ui";
import useApi from "../../../hooks/use-api";
import useLoggedIn from "../../../hooks/use-logged-in";
import TabbedLayout from "@components/Admin/TabbedLayout";
import AdminStreamsTable from "@components/Admin/AdminStreamsTable";
import { getTabs } from "../admin";

const AdminStreamsPage = () => {
  useLoggedIn();
  const { logout } = useApi();
  const tabs = getTabs(2);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <AdminStreamsTable id="Admin API Token Table" />
    </TabbedLayout>
  );
};

export default AdminStreamsPage;
