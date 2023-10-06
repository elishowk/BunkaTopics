import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '../styles/globals.css'

import { useEffect, useState } from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import useTranslation from 'next-translate/useTranslation'
import { SWRConfig, unstable_serialize } from 'swr'
import PiwikPro from '@piwikpro/react-piwik-pro'
import { hotjar } from 'react-hotjar'
import { CssBaseline, ThemeProvider } from '@mui/material'

import { SearchCustomOptionsProvider } from '../utils/useSearchCustomOptions'
import darkTheme from '../utils/darkTheme'
import lightTheme from '../utils/lightTheme'

export default function App({ Component, pageProps }: AppProps) {
  const { t } = useTranslation('common')
  const [darkMode, setDarkMode] = useState(false)
  
  useEffect(() => {
    PiwikPro.initialize?.(
      process.env.NEXT_PUBLIC_PIWIK_CONTAINER_ID ?? '',
      process.env.NEXT_PUBLIC_PIWIK_CONTAINER_URL ?? ''
    )
    hotjar.initialize(
      parseInt(process.env.NEXT_PUBLIC_HOTJAR_ID ?? '0'),
      parseInt(process.env.NEXT_PUBLIC_HOTJAR_SNIPPET_VERSION ?? '0')
    )
    if (typeof window !== "undefined" && window?.localStorage != null && window.localStorage.getItem('darkMode') === 'true')
      setDarkMode(true)
  }, [])

  return (
    <>
      <SWRConfig
        value={{
          fetcher: ([resource, init]) => fetch(resource, init).then(res => res.json())
        }}
      >
        <Head>
          <title>{t`Bunka - The Exploration Engine`}</title>
          <meta name="description" content={t('Explore the Web Visually')} />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no" />
          <link rel="icon" href="/favicon.png" />
        </Head>
        <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
          <CssBaseline>
            <SearchCustomOptionsProvider>
              <Component {...pageProps} switchMode={() => {
                const newMode = !darkMode
                setDarkMode(newMode)
                if (typeof window !== "undefined" && window?.localStorage != null)
                  localStorage.setItem('darkMode', newMode.toString())
              }} />
            </SearchCustomOptionsProvider>
          </CssBaseline>
        </ThemeProvider>
      </SWRConfig>
    </>
  )
}
