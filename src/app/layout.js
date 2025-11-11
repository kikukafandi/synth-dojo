import "./globals.css";

export const metadata = {
  title: "Synth-Dojo - Real-time Coding Learning Platform",
  description: "Master coding through AI battles and real-time PvP matches",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
