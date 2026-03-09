import { BrowserRouter, Routes, Route } from "react-router";
import { Layout } from "./components/Layout.tsx";
import { BASE_ROUTE } from "./constants.ts";
import { Home } from "./pages/Home.tsx";
import { TryIt } from "./pages/TryIt.tsx";

export function App() {
  return (
    <BrowserRouter basename={BASE_ROUTE}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="try" element={<TryIt />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
