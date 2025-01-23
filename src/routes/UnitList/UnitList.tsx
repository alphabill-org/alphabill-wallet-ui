import { ReactElement } from "react";
import { Outlet } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { Footer } from "../../components/Footer/Footer";
import { Header } from "../../components/Header/Header";
import { SelectBox } from "../../components/SelectBox/SelectBox";
import AddIcon from "../../images/add-ico.svg?react";
import CopyIcon from "../../images/copy-ico.svg?react";

function KeySelect(): ReactElement {
  const networkContext = [1, 2];

  return (
    <div className="select__options">
      {networkContext.map((network) => {
        return (
          <div key={network} className="select__option" onClick={() => null}>
            asd
          </div>
        );
      })}
    </div>
  );
}

export function UnitList(): ReactElement {
  return (
    <>
      <Header />
      <div className="units">
        <div className="units__key">
          <SelectBox emptyItem="--- SELECT KEY ---" selectedItem={undefined} className="units__key__select">
            <KeySelect />
          </SelectBox>
          <Button type="button" variant="primary" isRounded={true} onClick={() => null}>
            <CopyIcon />
          </Button>
          <Button type="button" variant="primary" isRounded={true} onClick={() => null}>
            <AddIcon />
          </Button>
        </div>
        <Outlet />
      </div>
      <Footer />
    </>
  );
}
