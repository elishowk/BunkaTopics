import React from 'react'
import { Box, Theme, useMediaQuery } from '@mui/material'
import AppBar, { AppBarProps } from './AppBar'

export type AppLayoutPropos = React.PropsWithChildren & AppBarProps

export default function AppLayout({ children, ...props }: AppLayoutPropos) {
  const matches = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
  return (
    <Box
      display='flex'
      flexDirection='column'
      height={matches ? '80vh' : '100vh'}
    >
      <AppBar {...props} />
      {children}
    </Box>
  )
}
