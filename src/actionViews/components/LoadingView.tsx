import Animations from "../../components/Animations/Animations";
import { ReactComponent as Logo } from "../../images/ab-logo-ico.svg";

export default function LoadingView(): JSX.Element {
  return (
    <div className="actions--loading">
      <Animations />
      <Logo height="64" width="64px" />
    </div>
  );
}
