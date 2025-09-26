import "./globals.css";

export const metadata = {
  title: "LivePromptAI — Clean",
  description: "Minimal smoke test",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
