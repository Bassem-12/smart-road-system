import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AnalysisProvider } from "./context/AnalysisContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AnalysisProvider>
          <AppRoutes />
        </AnalysisProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
