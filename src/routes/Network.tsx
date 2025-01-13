import { ReactElement, useContext } from "react";
import Button from "../components/Button/Button";
import { Form, FormContent, FormFooter } from "../components/Form/Form";
import TextField from "../components/InputField/TextField";
import Spacer from "../components/Spacer/Spacer";
import { NetworkContext } from "../hooks/network";

function Network(): ReactElement {
  const network = useContext(NetworkContext);

  return (
    <div className="w-100p">
      <div className="pad-24 t-medium-small">
        <Spacer mb={16} />
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            const data = new FormData(ev.currentTarget);
            network?.addNetwork({
              alias: data.get("alias") as string,
              moneyPartitionUrl: data.get("moneyPartitionUrl") as string,
              tokenPartitionUrl: data.get("tokenPartitionUrl") as string,
            });
          }}
        >
          <Form>
            <FormContent>
              <TextField label="Alias" name="alias" focusInput />
              <TextField label="Money partition" name="moneyPartitionUrl" />
              <TextField label="Token partition" name="tokenPartitionUrl" />
            </FormContent>
            <FormFooter>
              <Button big={true} block={true} type="submit" variant="primary">
                Add
              </Button>
            </FormFooter>
          </Form>
        </form>
        <Spacer mb={24} />
        <div className="t-medium-small"></div>
      </div>
    </div>
  );
}

export default Network;
