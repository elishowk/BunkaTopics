import { useRouter } from 'next/router'
import Link from 'next/link'
import type { SWRResponse } from 'swr'
import { CustomEvent } from '@piwikpro/react-piwik-pro'
import {
  AppBar as MuiAppBar,
  Box,
  IconButton,
  TextField,
  Toolbar,
  Typography
} from '@mui/material'
import BackIcon from '@mui/icons-material/ArrowBack'

import type { SearchResponse } from '../types'

export type AppBarProps = {
  query?: string
  viewSelector?: JSX.Element
  response?: SWRResponse<SearchResponse>
}

export default function AppBar({ query, viewSelector, response }: AppBarProps) {
  const { push } = useRouter()

  return (
    <MuiAppBar position="static" color="transparent" variant="elevation" elevation={0} sx={{
      position: 'relative',
      zIndex: 1000,
      borderBottom: '1px solid lightgrey',
      flexShrink: 1
    }}>
      <Toolbar variant="dense">
        <Link href="/">
          <IconButton edge="start" color="primary" aria-label="menu" sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
        </Link>
        <Box display="flex" justifyContent="space-between" width="100%">
          <Box display="flex" flexDirection="column" justifyContent="center">
            <Box>
              {query && (
                <Box>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    const q = e.currentTarget.query.value
                    if (q !== "") {
                      CustomEvent.trackEvent('search', 'submit', q)
                      push(`/search?q=${q}`)
                    }
                  }}>
                    <TextField
                      fullWidth
                      variant="standard"
                      name="query"
                      defaultValue={query ?? ""}
                    />
                  </form>
                </Box>
              )}

              <Box display="flex" flexGrow="1">
                {viewSelector}
              </Box>
            </Box>
          </Box>
          <Box display="flex" flexGrow={1} alignItems="center" margin="0em" marginLeft="1.5em">
            {response?.data != null && (
              <Typography component="p" fontSize="1em" color="text.secondary" marginY="0.5em">
                Map of the topics related to <Typography
                  component="span"
                  fontStyle="italic"
                >
                  {query}
                </Typography><br/>
                <Typography component="span" fontSize="0.8em" color="text.secondary" marginY="0.5em">
                  {response.data.nb_documents} representative tweets displayed.
                  {/*** @todo Fix t() when building static. Needed for interpolation of variables.
                    {t('map-of-topics-of', { query })}<br />
                      {response.data?.nb_documents != null
                        && t('search-results-count', { count: response.data.nb_documents })}
                  */}
                </Typography>
              </Typography>
            )}
          </Box>
        </Box>
      </Toolbar>
    </MuiAppBar>
  )
}