
import { useEffect, useState } from 'react'
import {
  ListItem,
  ListItemButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  FormControl,
  FormLabel,
  Autocomplete,
  TextField,
  FormHelperText,
  DialogActions,
  Button,
  createFilterOptions,
  Stack
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { CustomEvent as AnalyticsCustomEvent } from '@piwikpro/react-piwik-pro'
import { filter } from 'd3'

import KeywordsSelector from './KeywordsSelector'
import useTranslation from 'next-translate/useTranslation'
import { DimensionAutocomplete } from './DimensionSwitcherCard'
import { DimensionType, SearchCustomOptions, ViewDimensions } from '../types'

export type AddContinuumDimensionsListItemProps = {
  searchCustomOptions?: SearchCustomOptions
  changeSearchCustomOptions?: (options: SearchCustomOptions) => void
  variant?: 'intensity' | 'continuum'
}

export default function AddContinuumDimensionsListItem(props: AddContinuumDimensionsListItemProps) {
  const { t } = useTranslation('common')

  const { variant, searchCustomOptions, changeSearchCustomOptions } = props
  const [autocompleted, setAutocompleted] = useState<DimensionAutocomplete | null>(null)
  const [autocompleted2, setAutocompleted2] = useState<DimensionAutocomplete | null>(null)
  const [customKeywords, setCustomKeywords] = useState<string[]>()
  const [customKeywords2, setCustomKeywords2] = useState<string[]>()
  const [isAddSearchCustomOptionOpen, setAddSearchCustomOptionOpen] = useState(false)
  const openAddSearchCustomOption = () => setAddSearchCustomOptionOpen(true)
  const closeAddSearchCustomOption = () => {
    setAutocompleted(null)
    setAutocompleted2(null)
    setCustomKeywords(undefined)
    setCustomKeywords2(undefined)
    setAddSearchCustomOptionOpen(false)
  }

  const localCustomOptions = typeof window !== "undefined" && window.localStorage != null
    ? JSON.parse(window.localStorage.getItem('searchCustomOptions') ?? "[]")
    : []
  const dimensionsSuggestions: (DimensionAutocomplete & { id?: string, words?: string[] })[] = localCustomOptions?.customIntensityDimensions?.map((cid: any) => ({
    words: cid.words,
    type: cid.id.toLowerCase(),
    label: cid.id
  })) ?? []
  const filter = createFilterOptions<DimensionAutocomplete>()

  const handleSubmit = () => {
    const id = (autocompleted?.type ?? "") as string // event.currentTarget.dimensionId.value
    const id2 = (autocompleted2?.type ?? "") as string // event.currentTarget.dimensionId.value
    const words = customKeywords ?? []
    const words2 = customKeywords2 ?? []
    if (id.length > 0 && words.length > 0 && (
      variant === 'intensity' || (id2.length > 0 && words2.length > 0)
    )) {
      AnalyticsCustomEvent.trackEvent('map', 'addDimension', id)
      const key = variant === 'intensity' ? 'customIntensityDimensions' : 'customContinuumDimensions'
      changeSearchCustomOptions?.({
        ...searchCustomOptions,
        [key]: [
          ...(searchCustomOptions?.[key] ?? []),
          variant === 'intensity'
            ? { id, words }
            : { id: `${id} / ${id2}`, left_id: id, left_words: words, right_id: id2, right_words: words2 }
        ]
      })
    }
    closeAddSearchCustomOption()
  }

  useEffect(() => {
    if (autocompleted) {
      const dim = dimensionsSuggestions.find(ds => ds.type === autocompleted.type)
      if (dim != null)
        setCustomKeywords(dim.words ?? [])
    }
  }, [autocompleted])

  useEffect(() => {
    if (autocompleted2) {
      const dim = dimensionsSuggestions.find(ds => ds.type === autocompleted2.type)
      if (dim != null)
        setCustomKeywords2(dim.words ?? [])
    }
  }, [autocompleted2])

  return (
    <ListItem dense disableGutters disablePadding key={'add'}>
      <ListItemButton
        dense
        onClick={openAddSearchCustomOption}
      >
        <AddIcon fontSize="small" />&nbsp;
        <Typography fontSize="0.8em">{t`Add a dimension`}</Typography>
      </ListItemButton>
      <Dialog
        open={isAddSearchCustomOptionOpen}
        onClose={closeAddSearchCustomOption}
        aria-labelledby="addSearchCustomOption-dialog-title"
        fullWidth
      >
        <form
          id="addSearchCustomOption-form"
          onSubmit={(event) => {
            event.preventDefault()
          }}
        >
          <DialogTitle id="addSearchCustomOption-dialog-title">
            {t`Add a dimension`}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={1} direction="row">
              <Box flex="1" display="flex" flexDirection="column">
                <FormControl>
                  <FormLabel>{t`Label 1`}</FormLabel>
                  <Autocomplete
                    value={autocompleted}
                    onChange={(event, newValue) => {
                      if (typeof newValue === 'string') {
                        setAutocompleted({
                          type: newValue.toLowerCase(),
                          label: newValue,
                        });
                      } else if (newValue && newValue.inputValue) {
                        // Create a new value from the user input
                        setAutocompleted({
                          type: newValue.inputValue.toLowerCase(),
                          label: newValue.inputValue,
                        });
                      } else {
                        setAutocompleted(newValue);
                      }
                    }}
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params);
                      const { inputValue } = params;
                      // Suggest the creation of a new value
                      const isExisting = options.some((option) => inputValue === option.label);
                      if (inputValue !== '' && !isExisting) {
                        filtered.push({
                          inputValue,
                          type: inputValue,
                          label: `Add "${inputValue}"`,
                        });
                      }
                      return filtered;
                    }}
                    selectOnFocus
                    clearOnBlur
                    clearOnEscape
                    handleHomeEndKeys
                    id="addSearchCustomOption-label-input"
                    options={dimensionsSuggestions}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') {
                        return option;
                      }
                      if (option.inputValue) {
                        return option.inputValue;
                      }
                      return option.label;
                    }}
                    onKeyPress={e => e.key === 'Enter' && e.preventDefault()}
                    renderOption={(props, option) => <li {...props}>{option.label}</li>}
                    fullWidth
                    freeSolo
                    renderInput={(params) => (
                      <TextField
                        name="dimensionId"
                        {...params}
                      />
                    )}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>{t`List of related terms`}</FormLabel>
                  <KeywordsSelector
                    value={customKeywords}
                    onChange={ks => setCustomKeywords(ks)}
                  />
                  <FormHelperText>
                    {t`Enter multiple terms separated with the Enter key.`}
                  </FormHelperText>
                  {/* <TextField
                    multiline
                    name="wordsSelector"
                    placeholder="List of words"
                    helperText="Separate words with spaces"
                    rows="5"
                  /> */}
                </FormControl>
              </Box>

              <Box flex="1" display="flex" flexDirection="column">
                <FormControl>
                  <FormLabel>{t`Label 2`}</FormLabel>
                  <Autocomplete
                    value={autocompleted2}
                    onChange={(event, newValue) => {
                      if (typeof newValue === 'string') {
                        setAutocompleted2({
                          type: newValue.toLowerCase(),
                          label: newValue,
                        });
                      } else if (newValue && newValue.inputValue) {
                        // Create a new value from the user input
                        setAutocompleted2({
                          type: newValue.inputValue.toLowerCase(),
                          label: newValue.inputValue,
                        });
                      } else {
                        setAutocompleted2(newValue);
                      }
                    }}
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params);
                      const { inputValue } = params;
                      // Suggest the creation of a new value
                      const isExisting = options.some((option) => inputValue === option.label);
                      if (inputValue !== '' && !isExisting) {
                        filtered.push({
                          inputValue,
                          type: inputValue,
                          label: `Add "${inputValue}"`,
                        });
                      }
                      return filtered;
                    }}
                    selectOnFocus
                    clearOnBlur
                    clearOnEscape
                    handleHomeEndKeys
                    id="addSearchCustomOption2-label-input"
                    options={dimensionsSuggestions}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') {
                        return option;
                      }
                      if (option.inputValue) {
                        return option.inputValue;
                      }
                      return option.label;
                    }}
                    onKeyPress={e => e.key === 'Enter' && e.preventDefault()}
                    renderOption={(props, option) => <li {...props}>{option.label}</li>}
                    fullWidth
                    freeSolo
                    renderInput={(params) => (
                      <TextField
                        name="dimensionId2"
                        {...params}
                      />
                    )}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>{t`List of related terms`}</FormLabel>
                  <KeywordsSelector
                    value={customKeywords2}
                    onChange={ks => setCustomKeywords2(ks)}
                  />
                  <FormHelperText>
                    {t`Enter multiple terms separated with the Enter key.`}
                  </FormHelperText>
                  {/* <TextField
                    multiline
                    name="wordsSelector"
                    placeholder="List of words"
                    helperText="Separate words with spaces"
                    rows="5"
                  /> */}
                </FormControl>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button color="error" onClick={() => {
              (document.getElementById('addSearchCustomOption-form') as HTMLFormElement).reset()
              closeAddSearchCustomOption()
            }}>{t`Discard`}</Button>
            <Button color="info" type="submit" role="submit" onClick={handleSubmit}>{t`Save & Search`}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </ListItem>
  )
}
