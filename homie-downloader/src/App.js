import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home/Home';
import Search from './Pages/Search/Search';
import AccountPage from './Pages/AccountPage/AccountPage';
import './Styles/globals.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/search" element={<Search />} />
            </Routes>
        </Router>
    );
}

export default App;