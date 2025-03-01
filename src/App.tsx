
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import store from './store/store';
import { Provider } from 'react-redux';

export default function App() {
  // You might want to add authentication state here later
  const isAuthenticated = true;

  return (
    <Provider store={store}>
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/dashboard/*"
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/signin" replace />
          }
        />
      </Routes>
    </BrowserRouter>
    </Provider>
  );
}