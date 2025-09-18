// Router.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/Home.page';
import { MatchSchedulePage } from './pages/MatchSchedule.page';

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root / Home page */}
        <Route path="/" element={<HomePage />} />

        {/* Match Schedule page */}
        <Route path="/matchSchedule" element={<MatchSchedulePage />} />
      </Routes>
    </BrowserRouter>
  );
}
