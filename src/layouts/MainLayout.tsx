import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Chatbot from '../components/Chatbot';
import UpdatesWidget from '../components/UpdatesWidget';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <Outlet />
      <Footer />
      <Chatbot />
      <UpdatesWidget />
    </div>
  );
}
