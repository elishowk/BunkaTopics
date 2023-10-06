import Link from 'next/link'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'
import { PageViews, CustomEvent } from '@piwikpro/react-piwik-pro'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import TwitterIcon from '@mui/icons-material/Twitter'
// import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from "@mui/icons-material/LinkedIn"
import DarkModeIcon from "@mui/icons-material/DarkMode"
import LightModeIcon from "@mui/icons-material/LightMode"

import SearchBox from '../components/SearchBox'
import LogoLightmode from '../public/bunka-logo-lightmode.png'
import LogoDarkmode from '../public/bunka-logo-darkmode.png'
import CNRSLogo from '../public/supporters/cnrs.webp'
import ENSLogo from '../public/supporters/ens.webp'
import PrairieLogo from '../public/supporters/prairie.webp'
import PSLLogo from '../public/supporters/psl.webp'
import MinistereLogo from '../public/supporters/ministere.png'
import DiscordIcon from '../icons/DiscordIcon'
import { useEffect } from 'react'
import GodMode from '../components/GodMode'

export type Suggestion = {
  keywords: string
  lang?: 'fr' | 'en'
}

export const suggestions: Suggestion[] = [
  { keywords: 'chatgpt' },
  { keywords: '"One Piece"' },
  { keywords: 'Réforme des retraites', lang: 'fr' },
  { keywords: 'Avatar' },
  { keywords: '"the last of us"' },
  { keywords: '"Artificial intelligence"' },
  { keywords: '"harry styles"' },
  { keywords: '"joe biden"' },
  { keywords: '"premier league"' },
  { keywords: '"donald trump"' },
  { keywords: '"elon musk"' },
  { keywords: 'beyonce' },
  { keywords: 'naruto' },
]

export default function Home({ switchMode }: { switchMode: () => void }) {
  const { t } = useTranslation('common')
  const theme = useTheme()
  const matchesSm = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    PageViews.trackPageView('landingPage')
  }, [])

  return (
    <Box display="flex" flex={1} flexDirection="column" sx={({ palette }) => palette.mode === 'dark' ? ({
      background: 'linear-gradient(90deg, rgba(3,3,3,0.2) 0%, rgba(48,48,48,1) 50%, rgba(3,3,3,0.2) 100%)',
    }) : ({})}>
      {matchesSm && (
        <Box flexShrink={1}>
          <Alert severity="warning">
            {t`Bunka is not yet optimized for mobile.`}
          </Alert>
        </Box>
      )}
      <Box flexGrow={1} position="relative">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          marginY="3em"
        >
          <Container sx={({ breakpoints }) => ({
            width: '70%',
            [breakpoints.down('sm')]: {
              width: '100%'
            }
          })}>
            <Stack
              spacing={6}
              display="flex"
              justifyContent="center"
              alignItems="center"
              textAlign="center"
            >
              <Box width="100%" display="flex" flexDirection="column" alignItems="center">
                <Box>
                  <Image
                    src={theme.palette.mode === 'dark' ? LogoDarkmode : LogoLightmode}
                    width={!matchesSm ? 410 : 328} // 820
                    height={!matchesSm ? 146 : 116.8} // 292
                    alt="Bunka"
                    priority
                  />
                </Box>

                <Box marginTop="4em" marginBottom="5em">
                  <Typography fontSize="1.7em" variant="h2">
                    {t`Explore controversies surrounding cultural and political phenomena on social media.`}
                  </Typography>
                </Box>

                <Box width="100%" marginBottom="5em">
                  <Card>
                    <CardContent>
                      <Typography
                        component="h5"
                        color="primary"
                        textAlign="left"
                        fontWeight="bold"
                        marginBottom="0.5em"
                      >
                        {t`Try on top Twitter trends:`}
                      </Typography>
                      <Grid container display="flex">
                        <Grid item flex={1}>
                          <List dense disablePadding>
                            {
                              suggestions
                                .filter((_, i) => i < Math.ceil(suggestions.length / 2))
                                .map(({ keywords, lang }) => (
                                  <ListItem key={keywords} dense disablePadding>
                                    <ListItemText sx={({ palette }) => ({
                                      'a': { color: palette.text.primary, textDecoration: 'none' }
                                    })}>
                                      <Link href={`/search?q=${keywords}${lang != null ? `&lg=${lang}` : ''}`} onClick={() => {
                                        CustomEvent.trackEvent('suggestion', 'click', keywords)
                                      }}>
                                        {keywords}
                                      </Link>
                                    </ListItemText>
                                  </ListItem>
                                ))
                            }
                          </List>
                        </Grid>
                        <Grid item flex={1}>
                          <List dense disablePadding>
                            {
                              suggestions
                                .filter((_, i) => i >= Math.ceil(suggestions.length / 2))
                                .map(({ keywords, lang }) => (
                                  <ListItem key={keywords} dense disablePadding>
                                    <ListItemText sx={({ palette }) => ({
                                      'a': { color: palette.text.primary, textDecoration: 'none' }
                                    })}>
                                      <Link href={`/search?q=${keywords}${lang != null ? `&lg=${lang}` : ''}`}>
                                        {keywords}
                                      </Link>
                                    </ListItemText>
                                  </ListItem>
                                ))
                            }
                          </List>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>

                <Box
                  width="100%"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <SearchBox />
                </Box>
              </Box>

              <Box width="100%" paddingTop="2em">
                <Typography component="p">
                  {t`Bunka is an exploration engine that utilizes Large Language Models (LLMs) to generate information territories and facilitate visual exploration of the web. However, the accuracy of the information is constrained by the search results and the capabilities of the language models.`}
                </Typography>
              </Box>

              <Box
                display="flex"
                flexDirection="row"
                width="100%"
                flexWrap="wrap"
                justifyContent="space-around"
                alignItems="center"
                paddingY="3em"
                sx={({ palette }) => ({
                  '& > div': { margin: '1em' },
                  '& a > img': { opacity: palette.mode === "dark" ? 1 : 0.7 },
                })}
              >
                <div>
                  <a
                    href="https://www.inp.cnrs.fr/fr/le-programme-de-prematuration-du-cnrs"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Image
                      src={CNRSLogo}
                      height="50"
                      alt="CNRS"
                    />
                  </a>
                </div>
                <div>
                  <a
                    href="https://cognition.ens.fr/en"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Image
                      src={ENSLogo}
                      height="50"
                      alt="ENS"
                    />
                  </a>
                </div>
                <div>
                  <a
                    href="https://prairie-institute.fr/"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Image
                      src={PrairieLogo}
                      height="50"
                      alt="Prairie"
                    />
                  </a>
                </div>
                <div>
                  <a
                    href="https://psl.eu/en/research/research-psl"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Image
                      src={PSLLogo}
                      height="50"
                      alt="PSL"
                    />
                  </a>
                </div>
                <div>
                  <a
                    href="https://www.culture.gouv.fr/"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Image
                      src={MinistereLogo}
                      height="50"
                      alt="Ministère de la Culture"
                    />
                  </a>
                </div>
              </Box>
            </Stack>
          </Container>
        </Box>

        <Box
          position="absolute"
          top="1em"
          right="1em"
        >
          <Stack
            spacing={5}
            direction="row"
            width="100%"
            justifyContent="center"
            alignItems="center"
            sx={({ palette }) => ({
              'a': { color: palette.text.secondary },
              '& > div': { lineHeight: '1em' }
            })}
          >
            <div>
              <a href="https://twitter.com/Bunka_ai" title="Twitter @Bunka_ai" target="_blank" rel="noreferrer noopener">
                <TwitterIcon />
              </a>
            </div>
            <div>
              <a href="https://www.linkedin.com/company/bunka-ai" title="LinkedIn bunka-ai" target="_blank" rel="noreferrer noopener">
                <LinkedInIcon />
              </a>
            </div>
            <div>
              <a href="https://discord.gg/ANMczdtyVg" title="Discord Bunka" target="_blank" rel="noreferrer noopener">
                <DiscordIcon />
              </a>
            </div>
            <IconButton
              onClick={switchMode}
              size="small"
            >
              {theme.palette.mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Stack>
        </Box>

        <Box
          margin="1em"
          sx={{ '& > a': { textDecoration: "none", color: "text.primary" }}}
          textAlign="center"
        >
          <Link
            href="https://www.notion.so/charlesdedampierre/Privacy-Policy-c6c23444bba2437684d2c4ee53c1edde"
            target="_blank"
            rel="noreferrer noopener"
          >
            {t('Privacy policy')}
          </Link>
        </Box>

        {process.env.NEXT_PUBLIC_GOD_MODE === "true" && <GodMode />}
      </Box>
    </Box>
  )
}
