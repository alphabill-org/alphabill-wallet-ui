import { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AddKey } from './routes/CreateWallet/AddKey';
import { CreateWallet } from './routes/CreateWallet/CreateWallet';
import { Fees } from './routes/Fees/Fees';
import { Home } from './routes/Home';
import { Login } from './routes/Login/Login';
import { Network } from './routes/Network/Network';
import { Settings } from './routes/Settings/Settings';
import { AggregatedAlphaList } from './routes/TokenList/Alpha/AggregatedAlphaList';
import { AlphaDetails } from './routes/TokenList/Alpha/AlphaDetails';
import { AlphaTransfer } from './routes/TokenList/Alpha/AlphaTransfer';
import { AggregatedFungibleTokenList } from './routes/TokenList/Fungible/AggregatedFungibleTokenList';
import { FungibleTokenDetails } from './routes/TokenList/Fungible/FungibleTokenDetails';
import { FungibleTokenTransfer } from './routes/TokenList/Fungible/FungibleTokenTransfer';
import { NonFungibleTokenList } from './routes/TokenList/NonFungible/NonFungibleTokenList';
import { NonFungibleTokenTransfer } from './routes/TokenList/NonFungible/NonFungibleTokenTransfer';
import { TokenList } from './routes/TokenList/TokenList';

export function App(): ReactElement {
  return (
    <div className="app">
      <div className="app__content">
        <Routes>
          <Route path="/" element={<Home />}>
            <Route path="fees" element={<Fees />} />
            <Route path="network" element={<Network />} />
            <Route path="units" element={<TokenList />}>
              <Route path="fungible" element={<AggregatedFungibleTokenList />} />
              <Route path="non-fungible" element={<NonFungibleTokenList />} />
              <Route path="alpha" element={<AggregatedAlphaList />} />
            </Route>
            <Route path="units/alpha/:id" element={<AlphaDetails />} />
            <Route path="units/alpha/:id/transfer" element={<AlphaTransfer />} />
            <Route path="units/fungible/:id" element={<FungibleTokenDetails />} />
            <Route path="units/fungible/:id/transfer" element={<FungibleTokenTransfer />} />
            <Route path="units/non-fungible/:id/transfer" element={<NonFungibleTokenTransfer />} />
            <Route path="" element={<Navigate to="/units/fungible" replace={true} />} />
          </Route>
          <Route path="/add-key" element={<AddKey />} />
          <Route path="/create-wallet" element={<CreateWallet />} />
          <Route path="/recover-wallet" element={<CreateWallet isWalletRecovery={true} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}
