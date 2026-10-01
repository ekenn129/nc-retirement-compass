import "./globals.css";
import { Geist } from "next/font/google";
const geist=Geist({subsets:["latin"],display:"swap"});
export const metadata={title:"NC Retirement Compass | LGERS Pension Calculator",description:"Plan your North Carolina LGERS retirement."};
export default function RootLayout({children}){return <html lang="en"><body className={geist.className}>{children}</body></html>}