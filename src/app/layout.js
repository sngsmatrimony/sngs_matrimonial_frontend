import { Maven_Pro, Viga, Telex } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const maven = Maven_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--maven-pro",
});

const viga = Viga({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--viga",
});

const telex = Telex({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--telex",
});

export const metadata = {
  title: "SNGS Matrimonial",
  description: "Find your perfect match on SNGS Matrimonial",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased ${maven.className} ${viga.className} ${telex.className}`} style={{
        "--maven-pro": maven.style?.fontFamily || "system-ui",
        "--viga": viga.style?.fontFamily || "system-ui",
        "--telex": telex.style?.fontFamily || "system-ui",
      }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
