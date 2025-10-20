// app/layout.tsx
import './styles/globals.css';
import Footer from './components/Footer';
import NavBar from './components/NavBar';
import CsrfProvider from './providers/CsrfProvider';

export const metadata = {
  title: "GraphaRNA-web",
  description: "Explore the world of RNA with GraphaRNA-web",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="csrf-token" content="" />
      </head>
      <body>
        <CsrfProvider />

        <div className="layout">
          <NavBar />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
