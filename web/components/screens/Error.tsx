import useTranslation from 'next-translate/useTranslation'
import { Box, Typography } from '@mui/material'
import WarningIcon from '@mui/icons-material/Warning'

export type ErrorScreenProps = {
  error: string
}

export default function ErrorScreen({ error }: ErrorScreenProps) {
  const { t } = useTranslation('common')
  return (
    <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" width="100%" height="100%" textAlign="center">
      <Box margin="0.5em">
        <WarningIcon fontSize="large" />
      </Box>
      <Box margin="0.5em">
        <Typography component="p">{t`Oups, an error occured.`}</Typography>
      </Box>
      <Box margin="0.5em">
        <Typography component="p" color="error">{error}</Typography>
      </Box>
      <Box margin="0.5em">
        <Typography component="p">
          {t`The corpus of documents is limited while in beta.`}<br/>
          {t`Please try again with different keywords.`}
        </Typography>
      </Box>
    </Box>
  )
}
