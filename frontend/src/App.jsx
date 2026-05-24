import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Home from './pages/Home'
import Issue from './pages/Issue'
import Verify from './pages/Verify'
import Admin from './pages/Admin'
import Revoke from './pages/Revoke'

// Simple Protected Route
const ProtectedRoute = ({ children }) => {
  return children
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/issue" element={<Issue />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/:certId" element={<Verify />} />
          <Route path="/revoke" element={<Revoke />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
        }}
      />
    </Router>
  )
}

export default App