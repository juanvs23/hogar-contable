import { HashRouter, Routes, Route, Navigate } from "react-router-dom"
import ErrorBoundary from "./components/ErrorBoundary"
import Layout from "./components/layout/Layout"
import DashboardPage from "./features/dashboard/DashboardPage"
import TransactionsPage from "./features/transactions/TransactionsPage"
import CategoriesPage from "./features/categories/CategoriesPage"
import ReportsPage from "./features/reports/ReportsPage"

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
