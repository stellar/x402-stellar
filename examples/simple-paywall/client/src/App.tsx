import { BrowserRouter, Routes, Route } from "react-router";
import { Layout } from "./components/Layout.tsx";
import { Home } from "./pages/Home.tsx";
import { TryIt } from "./pages/TryIt.tsx";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="try" element={<TryIt />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
