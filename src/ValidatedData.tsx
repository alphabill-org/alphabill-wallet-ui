export type Result<T> = { data: NonNullable<T>; error: null } | { data: null; error: string };

export class ValidatedData<T extends Record<keyof T, Result<unknown>>> {
  public constructor(private readonly data: T) {}

  public getErrors(): Map<keyof T, string> {
    const errors = new Map<keyof T, string>();
    for (const key in this.data) {
      const result = this.data[key];
      if (result.error) {
        errors.set(key, result.error);
      }
    }

    return errors;
  }

  public getData():
    | { data: null; errors: Map<keyof T, string> }
    | { data: { [U in keyof T]: NonNullable<T[U]['data']> }; errors: null } {
    const errors = this.getErrors();
    if (errors.size > 0) {
      return { data: null, errors };
    }

    const data = {} as { [U in keyof T]: NonNullable<T[U]['data']> };
    for (const key in this.data) {
      const result = this.data[key];
      data[key] = result.data as NonNullable<T[typeof key]['data']>;
    }

    return { data, errors: null };
  }
}
