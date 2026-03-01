import "./globals.css";

export const metadata = {
  title: "Cycle Vote Board",
  description: "US vs UK class vote board",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
