import Actions from "../actionViews/Actions";
import Dashboard from "../components/Dashboard/Dashboard";
import Header from "../components/Header/Header";
import { ToolBar } from "../components/ToolBar/ToolBar";

function Home(): JSX.Element {
  return (
    <>
      <Header />
      <Dashboard />
      <Actions />
      <ToolBar />
    </>
  );
}

export default Home;
