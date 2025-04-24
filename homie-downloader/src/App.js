import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Components/Firebase/AuthContext';
import Home from './Pages/Home/Home';
import Search from './Pages/Search/Search';
import AccountPage from './Pages/AccountPage/AccountPage';
import Login from './Components/Auth/Login';
import Signup from './Components/Auth/Signup';
import Header from './Components/Header/Header';
import './Styles/globals.css';

function App() {
    return (

        <Router>
            <AuthProvider>
                <Header />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;