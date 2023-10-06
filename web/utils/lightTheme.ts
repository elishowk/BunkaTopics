import { createTheme, Theme } from '@mui/material'

const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    // primary: {
    //   main: '#0EE383'
    // },
    secondary: {
      main: '#0E6EE3'
    },
    grey: {
      400: '#828282'
    },
    titles: {
      main: '#0EE383',
      contrastText: '#fff',
    },
    details: {
      main: '#828282',
      contrastText: '#fff',
    }
  }
})

export default lightTheme
