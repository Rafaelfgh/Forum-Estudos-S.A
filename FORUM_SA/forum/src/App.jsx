import './App.css'

import {BrowserRouter, Routes, Route} from 'react-router-dom'

//pages
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Forum from './pages/Forum/Forum'
import Usuario from './pages/Usuario/Usuario'

import ProtectedRoute from './components/ProtectedRoute'


function App() {
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/usuario" element={<ProtectedRoute><Usuario /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App