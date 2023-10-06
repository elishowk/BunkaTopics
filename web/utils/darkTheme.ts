import { createTheme, Theme } from '@mui/material'

const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      paper: '#505050',
      default: '#303030'
    },
    titles: {
      main: '#0E6EE3',
      contrastText: '#fff',
    },
    details: {
      main: '#828282',
      contrastText: '#fff',
    },
  },
})

export default darkTheme
