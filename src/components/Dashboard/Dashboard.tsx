import { Formik } from "formik";
import * as Yup from "yup";

import { Form, FormFooter, FormContent } from "../Form/Form";
import Button from "../Button/Button";
import Textfield from "../Textfield/Textfield";

import Logo from "../../images/ab-logo.svg";
import Spacer from "../Spacer/Spacer";
import { IAccountProps } from "../../types/Types";
import { extractFormikError } from "../../utils/utils";

function Dashboard(props: IAccountProps): JSX.Element | null {
  return (
    <div className="dashboard pad-24">
      <Spacer mb={56} />

    </div>
  );
}

export default Dashboard;
