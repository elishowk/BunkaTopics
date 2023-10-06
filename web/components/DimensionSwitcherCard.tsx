import { useEffect, useState } from 'react'
import useTranslation from 'next-translate/useTranslation'
import { CustomEvent as AnalyticsCustomEvent } from '@piwikpro/react-piwik-pro'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  FormLabel,
  Icon,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import AddIcon from '@mui/icons-material/Add'
import HelpIcon from '@mui/icons-material/Help'

import { DimensionType, SearchCustomOptions, ViewDimension, ViewDimensions } from '../types'
import KeywordsSelector from './KeywordsSelector'

export type DimensionSwitcherCardProps = {
  dimension: DimensionType | string,
  dimensions: ViewDimensions,
  setDimension: (dim: string) => void
  searchCustomOptions?: SearchCustomOptions
  changeSearchCustomOptions?: (options: SearchCustomOptions) => void
  variant?: 'intensity' | 'continuum'
}

export type DimensionAutocomplete = ViewDimension & { inputValue?: string }

export default function DimensionSwitcherCard({
  dimension,
  dimensions,
  setDimension,
  searchCustomOptions,
  changeSearchCustomOptions,
  variant = 'intensity',
}: DimensionSwitcherCardProps) {
  const { t } = useTranslation('common')

  const [autocompleted, setAutocompleted] = useState<DimensionAutocomplete | null>(null)
  const [customKeywords, setCustomKeywords] = useState<string[]>()
  const [isAddSearchCustomOptionOpen, setAddSearchCustomOptionOpen] = useState(false)
  const openAddSearchCustomOption = () => setAddSearchCustomOptionOpen(true)
  const closeAddSearchCustomOption = () => {
    setAutocompleted(null)
    setCustomKeywords(undefined)
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
    const words = customKeywords ?? []
    if (id.length > 0 && words.length > 0) {
      AnalyticsCustomEvent.trackEvent('map', 'addDimension', id)
      const key = variant === 'intensity' ? 'customIntensityDimensions' : 'customContinuumDimensions' 
      changeSearchCustomOptions?.({
        ...searchCustomOptions,
        [key]: [
          ...(searchCustomOptions?.[key] ?? []),
          { id, words }
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

  return (
    <Card variant="outlined" sx={{ paddingY: "0.5em" }}>
      <Box display="flex">
        <CardHeader
          title={t("Dimensions")}
          titleTypographyProps={{ fontSize: "0.8em", fontWeight: "bold" }}
          sx={{ paddingY: "0.5em", flexGrow: 1 }}
        />
        <Box flexShrink={1}>
          <Tooltip
            title={(
              <Typography>
                {t(`By adding Dimension Filters, you can explore the map and refine your search.\nIf a region is red, it means that many tweets contain terms similar to the label.`)}
              </Typography>
            )}
          >
            <IconButton size="small">
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <List dense disablePadding>
        {
          dimensions[variant]
            .map(({ type, label }) => (
              <ListItem dense disableGutters disablePadding key={type}>
                <ListItemButton
                  dense
                  onClick={() => setDimension(type as string)}
                  selected={dimension === type}
                >
                  <Typography fontSize="0.8em">{label}</Typography>
                </ListItemButton>
              </ListItem>
            ))
        }

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
                <Box display="flex" flexDirection="column">
                  <FormControl>
                    <FormLabel>{t`Label`}</FormLabel>
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
      </List>
    </Card>
  )
}