import React from 'react'
import TwitterIcon from '@mui/icons-material/Twitter'
import RedditIcon from '@mui/icons-material/Reddit'
import NewsIcon from '@mui/icons-material/Newspaper'

export type Source = {
  id: string
  name: string
  icon: React.FC
}

export const getSource = (id: 'twitter.com' | 'reddit.com'): Source | undefined => {
  switch (id) {
    case 'twitter.com':
      return {
        id,
        name: "Twitter",
        icon: TwitterIcon
      }
    case 'reddit.com':
      return {
        id,
        name: "Reddit",
        icon: RedditIcon
      }
    default:
      return {
        id,
        name: "News",
        icon: NewsIcon
      }
  }
}