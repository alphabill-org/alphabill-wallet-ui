export type QueryResult<T> =
  | {
      isError: true;
      error: Error;
      data: undefined;
      isPending: false;
    }
  | {
      isError: false;
      error: null;
      data: T;
      isPending: false;
    }
  | {
      isError: false;
      error: null;
      data: undefined;
      isPending: true;
    };
