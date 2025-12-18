// app/layout.tsx
import './styles/globals.css';
import Footer from './components/Footer';
import NavBar from './components/NavBar';

export const metadata = {
  title: "GraphaRNA",
  description: "Explore the world of RNA with GraphaRNA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <div className="layout">
          <NavBar />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
