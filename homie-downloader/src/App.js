import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Components/Firebase/AuthContext';
import Home from './Pages/Home/Home';
import AccountPage from './Pages/AccountPage/AccountPage';
import Login from './Components/Auth/Login';
import Signup from './Components/Auth/Signup';
import Header from './Components/Header/Header';
import Footer from './Components/Footer/Footer';
import VideoDetailsPage from './Pages/VideoDetailsPage/VideoDetailsPage';
import AboutUs from './Pages/AboutUs/AboutUs';
import './Styles/globals.css';


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


function App() {
    return (
        <Router>
            <AuthProvider>
                <Header />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/video/details" element={<VideoDetailsPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/aboutus" element={<AboutUs />} />
                </Routes>
                <Footer />
            </AuthProvider>
        </Router>
    );
}

export default App;