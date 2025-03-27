import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import RecuperarSenha from './components/RecuperarSenha';
import DefinirSenha from './components/DefinirSenha';
import Login from './components/Login';
import Dashboard from "./components/Dashboard";
import Estoque from "./components/Estoque";
import CadastrarItem from "./components/CadastrarItem";
import EditarItem from "./components/EditarItem";
import DashboardEstoque from "./components/DashboardEstoque";

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/recuperar-senha" element={<RecuperarSenha />} />
                <Route path="/definir-senha" element={<DefinirSenha />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/estoque" element={<Estoque />} />
                <Route path="/cadastrar-item" element={<CadastrarItem />} />
                <Route path="/editar-item/:id" element={<EditarItem />} />
                <Route path="/dashboard-estoque" element={<DashboardEstoque />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
