import React, { createContext } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";

import "./css/app.scss";
import App, { PublicKey } from "./App";
import { v4 as uuidv4 } from "uuid";
import { storageVaultKey, VaultContextProvider } from "./routes/Login/Login";
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import { AppProvider } from "./components/Header/Header";


interface OnMessageListener {
  addListener: (listener: (message: unknown, sender?: unknown) => boolean) => void;
}

interface RuntimeEnvironment {
  get storage(): {
    local: {
      get: (keys: string[]) => Promise<unknown>;
      set: (data: { [key: string]: unknown }) => Promise<void>
    }
  };

  get runtime(): {
    id: string,
    // Response is onMessage response for given message
    sendMessage: (extensionId: string | undefined, message: unknown) => Promise<unknown>;
    onMessage: OnMessageListener,
    onMessageExternal: OnMessageListener
  };

  get windows(): {
    getAll: (info: { populate?: boolean | undefined }) => Promise<unknown>;
    create: (info: { url: string, type: "popup", width: number, height: number, }) => Promise<unknown>;
    remove: (id: number) => Promise<void>;
  };
}

class BrowserRuntimeMessageEvent extends Event {
  public static TYPE = "OnMessage";
  public readonly data: unknown;

  constructor(data: unknown) {
    super(BrowserRuntimeMessageEvent.TYPE);
    this.data = data;
  }
}

class BrowserRuntimeMessageResponseEvent extends Event {
  public static TYPE = "OnMessageResponse";
  public readonly data: unknown;

  constructor(data: unknown) {
    super(BrowserRuntimeMessageResponseEvent.TYPE);
    this.data = data;
  }

}

class BrowserRuntimeMessageEmitter extends EventTarget implements OnMessageListener {
  addListener(listener: (message: unknown, sender?: unknown) => boolean): void {
    this.addEventListener(BrowserRuntimeMessageEvent.TYPE, (event) => {
      const { data } = event as BrowserRuntimeMessageEvent;
      listener(data);
    });
  }
}

class BrowserRuntime {
  private readonly messageEmitter = new BrowserRuntimeMessageEmitter();

  public constructor(
    public readonly id: string = uuidv4()
  ) {
  }

  async sendMessage(extensionId: string | undefined, message: unknown): Promise<unknown> {
    this.messageEmitter.dispatchEvent(new BrowserRuntimeMessageEvent(message));
    return new Promise((resolve) => {
      const responseListener = (event: Event) => {
        this.messageEmitter.removeEventListener(BrowserRuntimeMessageResponseEvent.TYPE, responseListener);
        const { data } = event as BrowserRuntimeMessageResponseEvent;
        resolve(data);
      };
      this.messageEmitter.addEventListener(BrowserRuntimeMessageResponseEvent.TYPE, responseListener);
    });

  }

  get onMessage(): OnMessageListener {
    return this.messageEmitter;
  }

  get onMessageExternal(): OnMessageListener {
    return this.messageEmitter;
  }
}

class BrowserStorage {
  async get(keys: string[]): Promise<unknown> {
    const entries = [];
    for (const key of keys) {
      entries.push([key, localStorage.getItem(key)]);
    }

    return Object.fromEntries(entries);
  }

  async set(data: { [key: string]: unknown }): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
}

class BrowserRuntimeEnvironment implements RuntimeEnvironment {
  public readonly runtime = new BrowserRuntime();
  public readonly storage = { local: new BrowserStorage() };

  get windows(): {
    getAll: (info: { populate?: boolean | undefined; }) => Promise<unknown>;
    create: (info: { url: string; type: "popup"; width: number; height: number; }) => Promise<unknown>;
    remove: (id: number) => Promise<void>;
  } {
    throw new Error("Method not implemented.");
  }
}

// chrome?.runtime?.sendMessage
// const extensionId = chrome?.runtime?.id;
// chrome?.runtime?.sendMessage(extensionId, );
// chrome?.runtime?.onMessage?.addListener((request) => {
//   if (request.isLocked === true) {
//     chrome?.storage?.local
//       .set({ ab_is_wallet_locked: "locked" })
//       .then(() => window.close());
//   }
// });

export const RuntimeEnvironmentContext = createContext<RuntimeEnvironment | null>(null);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const queryClient = new QueryClient();
const runtimeEnvironment = new BrowserRuntimeEnvironment();

const initialStateString = await runtimeEnvironment.storage.local.get([storageVaultKey]) as {
  [storageVaultKey]: string
};
let initialState: { keys: PublicKey[] } | undefined;

if (initialStateString[storageVaultKey]) {
  const { keys } = JSON.parse(initialStateString[storageVaultKey]) as { keys: string[] };
  initialState = { keys: keys.map((key) => new PublicKey(Base16Converter.decode(key))) };
}

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <RuntimeEnvironmentContext.Provider value={runtimeEnvironment}>
          <VaultContextProvider state={initialState}>
            <AppProvider>
              <App />
            </AppProvider>
          </VaultContextProvider>
        </RuntimeEnvironmentContext.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
