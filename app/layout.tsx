import type { Metadata } from "next";
import { Crete_Round, Work_Sans } from "next/font/google";
import "./globals.css";
import { ChildProps } from '@/types'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import NextTopLoader from 'nextjs-toploader';

const createRound = Crete_Round({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-createRound',
  display: 'swap',
});

const workSans = Work_Sans({
  weight: ['500', '600'],
  subsets: ['latin'],
  variable: '--font-workSans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://test-blog.sammi.ac'),
  title: "Hozircha test uchun qilinyotgan blog sayt",
  description: "Inshaa Alloh yaxshiliklarga ishlatamiz",
  authors: [{name: 'Odilbek Samadof', url: "/?"}],
  icons: {icon: '/bebo-logo.png'},
  keywords: "samodev, sammi, dasturlash kurslari, dasturlashga oid darslar, reactjs uzbek tilida, vuejs uzbek tilida, redux uzbek tilida, sammi, sammi academy, bepul dasturlash, rezyume yozish, portfolio, sammi javascript, sammi raqamli avlod, javascript, reactjs, vuejs, javascript darslari, reactjs darslari, vuejs darslari, dasturlash darslari, o'zbek tilida dasturlash, reactjs o'zbek tilida, reactjs darslari o'zbek tilida, javascript darslari, javascript darslari o'zbek tilida, dasturash darslari o'zbek tilida, dasturlashni o'rganish, dasturlash, IT loyihalar o'zbek tilida ",
  	openGraph: {
		title: 'SamoDev dasturlashga oid maqolalar',
		description:
			'Dasturlash haqida yangiliklar, maslahatlar, va dasturlash sohasidagi eng soʻnggi xabarlar. Bizning blogda dasturlashni oʻrganish va rivojlantirish uchun qoʻllanma topishingiz mumkin.',
		type: 'website',
		url: 'https://test-blog.sammi.ac',
		locale: 'en_EN',
		images: 'https://media.graphassets.com/kXL006lyRnW46IKTHdHs',
		countryName: 'Uzbekistan',
		siteName: 'SamoDev',
		emails: 'sabran2233@gmail.com',
	}
};

function RootLayout({ children }: ChildProps) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${createRound.variable} ${workSans.variable}`}
    >
      <body 
        suppressHydrationWarning
        className="overflow-x-hidden font-workSans antialiased"
      >
        <ThemeProvider 
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader showSpinner={false} />
          {children}
          <Toaster position='top-center'/>
        </ThemeProvider>
      </body>
    </html>
  );
}

export default RootLayout;