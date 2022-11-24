import Dashboard from "../components/Dashboard/Dashboard";
import Header from "../components/Header/Header";
import Actions from "../components/Actions/Actions";

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
