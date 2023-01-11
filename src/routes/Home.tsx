import Dashboard from "../components/Dashboard/Dashboard";
import Header from "../components/Header/Header";
import Actions from "../actionViews/Actions";

function Home(): JSX.Element {
  return (
    <>
      <Header />
      <Dashboard />
      <Actions />
    </>
  );
}

export default Home;
