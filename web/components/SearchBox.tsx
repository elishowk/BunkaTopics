import { Box, Button, FormControl, InputAdornment, MenuItem, Select, TextField, TextFieldProps } from '@mui/material'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { CustomEvent } from '@piwikpro/react-piwik-pro'
import SearchIcon from '@mui/icons-material/Search'

export type SearchBoxProps = TextFieldProps

export default function SearchBox(props: SearchBoxProps) {
  const { t } = useTranslation('common')
  const { push } = useRouter()

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const query = event.currentTarget.query.value
        const language = event.currentTarget.language.value
        if (query !== "") {
          CustomEvent.trackEvent('search', 'submit', query)
          push(`/search?q=${query}&lg=${language}`)
        }
      }}
      style={{ width: '100%' }}
    >
      <TextField
        variant="outlined"
        type="text"
        name="query"
        color="primary"
        placeholder={t`Explore a concept like "One Piece" or Japan`}
        sx={{
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: "unset"
          }
        }}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Box textAlign="left" color="text.secondary" mt="0.2em">
        Explore documents in <Select name="language" defaultValue="en" size="small" variant="standard" disabled={process.env.NEXT_PUBLIC_BETA === "true"}>
          <MenuItem value="en">english</MenuItem>
          {process.env.NEXT_PUBLIC_BETA !== "true" && <MenuItem value="fr">french</MenuItem>}
        </Select>
      </Box>
      <Box marginY="1em">
        <FormControl>
          <Button type="submit" variant="outlined" color="primary" size="large">
            {t('Explore')}
          </Button>
        </FormControl>
      </Box>
    </form>
  )
}