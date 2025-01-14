import { ReactElement, useCallback, useState } from "react";
import Button from "../components/Button/Button";
import { Form, FormContent, FormFooter } from "../components/Form/Form";
import { TextField } from "../components/InputField/TextField";
import { useNetwork } from "../hooks/network";

type FormElements = "alias" | "moneyParititionUrl" | "tokenPartitionUrl";

export function Network(): ReactElement {
  const networkContext = useNetwork();
  const [errors, setErrors] = useState<Map<FormElements, string>>(new Map());

  const onSubmit = useCallback(
    (ev: React.FormEvent<HTMLFormElement>) => {
      ev.preventDefault();
      const errors = new Map<FormElements, string>();
      const data = new FormData(ev.currentTarget);
      try {
        new URL(data.get("moneyPartitionUrl") as string);
      } catch (e) {
        errors.set("moneyParititionUrl", "Invalid money partition URL");
      }

      try {
        new URL(data.get("tokenPartitionUrl") as string);
      } catch (e) {
        errors.set("tokenPartitionUrl", "Invalid token partition URL");
      }

      if (!data.get("alias")) {
        errors.set("alias", "Alias must be defined");
      }

      setErrors(errors);

      if (errors.size === 0) {
        networkContext.addNetwork({
          alias: data.get("alias") as string,
          moneyPartitionUrl: data.get("moneyPartitionUrl") as string,
          tokenPartitionUrl: data.get("tokenPartitionUrl") as string,
        });

        ev.currentTarget.reset();
      }
    },
    [networkContext, setErrors],
  );

  return (
    <div className="w-100p">
      <div className="pad-24 t-medium-small">
        <form onSubmit={onSubmit}>
          <Form>
            <FormContent>
              <TextField label="Alias" name="alias" error={errors.get("alias")} focusInput />
              <TextField label="Money partition" name="moneyPartitionUrl" error={errors.get("moneyParititionUrl")} />
              <TextField label="Token partition" name="tokenPartitionUrl" error={errors.get("tokenPartitionUrl")} />
            </FormContent>
            <FormFooter>
              <Button big={true} block={true} type="submit" variant="primary">
                Add
              </Button>
            </FormFooter>
          </Form>
        </form>
        <div className="t-medium-small"></div>
      </div>
    </div>
  );
}
