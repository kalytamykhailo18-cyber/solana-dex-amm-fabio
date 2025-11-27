import { FC } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './components/WalletProvider';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Swap } from './pages/Swap';
import { Liquidity } from './pages/Liquidity';
import { CreatePool } from './pages/CreatePool';

const App: FC = () => {
  return (
    <BrowserRouter>
      <WalletProvider>
        <div className="min-h-screen bg-dark-950">
          <Header />
          <main className="px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/swap" element={<Swap />} />
              <Route path="/liquidity" element={<Liquidity />} />
              <Route path="/create-pool" element={<CreatePool />} />
            </Routes>
          </main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
              },
              success: {
                iconTheme: {
                  primary: '#0ea5e9',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </WalletProvider>
    </BrowserRouter>
  );
};

export default App;
