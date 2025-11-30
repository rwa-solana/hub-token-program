import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { PropertiesPage } from './pages/PropertiesPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { RevenuePage } from './pages/RevenuePage';
import { KycPage } from './pages/KycPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:mint" element={<PropertyDetailPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/revenue" element={<RevenuePage />} />
        <Route path="/kyc" element={<KycPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
