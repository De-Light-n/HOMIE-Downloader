import useSessionTracking from "./hooks/useSessionTracking";

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'; // Додано useLocation
import { AuthProvider } from './Components/Firebase/AuthContext';

import Home from './Pages/Home/Home';
import AccountPage from './Pages/AccountPage/AccountPage';
import Login from './Components/Auth/Login';
import Signup from './Components/Auth/Signup';
import VideoDetailsPage from './Pages/VideoDetailsPage/VideoDetailsPage';
import AboutUs from './Pages/AboutUs/AboutUs';
import Guide from './Pages/Guide/Guide';
import LetsChat from "./Pages/Chat/LetsChat";

import Header from './Components/Header/Header';
import Footer from './Components/Footer/Footer';

import Background from './Components/Background';
import ScrollToTop from './Components/ScrollToTop';
import { ThemeProvider } from './Components/ThemeContext';

import './Styles/themes.css';
// TODO: Maybe Footer
// TODO: Validation for login and signup forms
// TODO: Info about us
// TODO: Sorting and filtering videos
// TODO: Maybe coments under video
// TODO: IF we have time, add more themes
// TODO: Перевести сайт на одну мову
// TODO: в сторінці акаунта надпис My account без стилю
// TODO: Забрати останній візит на сайт з акаунта
// TODO: Доробити аналітику
// TODO: ДОРОБИТИ ФУТЕР

// Компонент, що містить логіку відображення Header, Routes та Footer
function AppLayout() {
    const location = useLocation();
    const pathsWithoutFooter = ['/login', '/signup'];

    // Перевіряємо, чи поточний шлях НЕ знаходиться у списку шляхів без футера
    const showFooter = !pathsWithoutFooter.includes(location.pathname.toLowerCase());

    return (
        <>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/video/details" element={<VideoDetailsPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/aboutus" element={<AboutUs />} />
                <Route path="/guide" element={<Guide />} />
                <Route path="/letschat" element={<LetsChat />} />
            </Routes>
            {showFooter && <Footer />}
        </>
    );
}

function App() {
    useSessionTracking();

    return (
        <Router>
            <ThemeProvider>
                <Background />
                <ScrollToTop />
                <AuthProvider>
                    {/* Використовуємо AppLayout замість прямого рендерингу Header, Routes, Footer */}
                    <AppLayout />
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
}

export default App;
// --- END OF FILE App.js ---