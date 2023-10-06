import { Box, Container, Grid, Typography } from '@mui/material'
import useTranslation from 'next-translate/useTranslation'
import Lottie from "lottie-react"

import searchingAnimation from "../../public/lottie-searching.json"

export default function LoadingScreen() {
  const { t } = useTranslation('common')
  return (
    <Box display="flex" width="100%" height="100%" flexDirection="column" justifyContent="center" alignItems="center">
      <Container>
        <Typography component="p" fontSize="1.2em" fontWeight="bold" color="grey" textAlign="center">
          {t`We are currently generating explorations, which may take a few seconds. Please stay with us!`}
        </Typography>
        <Grid container justifyContent="center">
          <Grid item sm={10} md={8}>
            <Typography component="p" fontSize="1.2em" color="grey" marginTop="1em" textAlign="center">
              {t`Our process involves grouping related documents together to create a map that features topics you can explore, providing you with an overview of your query.`}
            </Typography>
          </Grid>
        </Grid>
      </Container>
      <Box width="50vw" marginTop="2em">
        <Lottie animationData={searchingAnimation} />
      </Box>
    </Box>
  )
}