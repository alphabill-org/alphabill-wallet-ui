import { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { CreateWallet } from './routes/CreateWallet/CreateWallet';
import { Home } from './routes/Home';
import { Login } from './routes/Login/Login';
import { Network } from './routes/Network';
import { AggregatedTokenList } from './routes/TokenList/Fungible/AggregatedTokenList';
import { TokenDetails } from './routes/TokenList/Fungible/TokenDetails';
import { TokenList } from './routes/TokenList/TokenList';

export function App(): ReactElement {
  return (
    <div className="app">
      <div className="app__content">
        <Routes>
          <Route path="/" element={<Home />}>
            <Route path="network" element={<Network />} />
            <Route path="units" element={<TokenList />}>
              <Route path="fungible" element={<AggregatedTokenList />} />
            </Route>
            <Route path="units/fungible/:id" element={<TokenDetails />} />
            <Route path="" element={<Navigate to="/units/fungible" replace={true} />} />
          </Route>
          <Route path="/create-wallet" element={<CreateWallet />} />
          <Route path="/recover-wallet" element={<CreateWallet isWalletRecovery={true} />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </div>
  );
}
