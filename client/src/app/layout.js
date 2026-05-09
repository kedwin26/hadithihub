import { Auth0Provider } from "@auth0/nextjs-auth0";
import Navbar from "../components/layout/Navbar";
import "../styles/globals.css";

export const metadata = {
  title: "HadithiHub — Share your story",
  description: "Short-form video platform for creators",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Auth0Provider>
          <Navbar />
          <main>{children}</main>
        </Auth0Provider>
      </body>
    </html>
  );
}
