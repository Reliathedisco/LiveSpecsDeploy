import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Home } from '@/pages/Home'
import { Pricing } from '@/pages/Pricing'
import { Success } from '@/pages/Success'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/success" element={<Success />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App