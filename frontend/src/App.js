import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import RecuperarSenha from './components/RecuperarSenha';
import DefinirSenha from './components/DefinirSenha';
import Login from './components/Login';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/recuperar-senha" element={<RecuperarSenha />} />
                <Route path="/definir-senha" element={<DefinirSenha />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
