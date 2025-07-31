import '../styles/globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AuthProvider } from '../utils/auth';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24">
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}