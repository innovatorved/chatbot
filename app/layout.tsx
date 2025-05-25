import { Toaster } from 'sonner';
import type { Metadata } from 'next';
// Removed Geist fonts, will use Inter and Noto Sans from Google Fonts
import { ThemeProvider } from '@/components/theme-provider';

import './globals.css'; // This should contain the @tailwind base, components, utilities and the font-family definition

export const metadata: Metadata = {
  metadataBase: new URL('https://chatbot-in.vercel.app'), // Replace with actual URL if needed
  title: 'AI Writing Assistant', // Updated title
  description: 'An AI assistant for writing tasks.', // Updated description
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

// Removed Geist font loading

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)'; // Assuming default light theme
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)'; // Assuming default dark theme
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      // Removed Geist font variables from className
    >
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://fonts.googleapis.com/css2?display=swap&family=Inter%3Awght%40400%3B500%3B700%3B900&family=Noto+Sans%3Awght%40400%3B500%3B700%3B900"
        />
        {/* Removed Tailwind CDN script */}
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
        {/* The font-family will be set in globals.css for the body tag */}
      </head>
      <body className="antialiased"> {/* Removed inline style for font-family */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system" // Or "light" / "dark" as per new design preference
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
