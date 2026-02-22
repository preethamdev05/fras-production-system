import "./globals.css";

export const metadata = {
  title: "Face Recognition Attendance System",
  description: "Production-ready FRAS using Next.js and Cloud Run",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}