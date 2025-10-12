import type { Metadata } from "next";
import {  Crete_Round, Work_Sans } from "next/font/google";
import "./globals.css";
import { ChildProps } from '@/types'
import { ThemeProvider } from '@/components/providers/theme-provider'



const createRound = Crete_Round({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-createRound',
});

const workSans = Work_Sans({
  weight: ['500', '600'],
  subsets: ['latin'],
  variable: '--font-workSans',
})

export const metadata: Metadata = {
  title: "Hozircha test uchun qilinyotgan blog sayt",
  description: "Inshaa Alloh yaxshiliklarga ishlatamiz",
};

function RootLayout({children}: ChildProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning
        className={`${createRound.variable} ${workSans.variable} overflow-x-hidden `}
      >
        <ThemeProvider attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange>
        {children}
        </ThemeProvider>

      </body>
    </html>
  );
}

export default RootLayout