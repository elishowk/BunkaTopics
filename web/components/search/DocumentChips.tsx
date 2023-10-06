import { Box, Chip, Stack } from '@mui/material'
import useTranslation from 'next-translate/useTranslation'

import type { Document, ViewDimension } from '../../types'

export type DocumentChipsProps = {
  document: Document
  dimensions: ViewDimension[]
}

export default function DocumentChips({ document, dimensions }: DocumentChipsProps) {
  const { t } = useTranslation('common')
  
  const chips = dimensions.filter((iD) => {
    const dimensionDoc = document.dimensions?.find((d) => d.id.toLowerCase() === iD.type)
    if (dimensionDoc?.id === 'popularity')
      return dimensionDoc.score >= (parseFloat(process.env.NEXT_PUBLIC_POPULARITY_CHIP_THRESHOLD ?? '0.8'))
    return dimensionDoc != null
      && dimensionDoc.score >= (parseFloat(process.env.NEXT_PUBLIC_DIMENSION_CHIPS_THRESHOLD ?? '0.6'))
  })
  return chips.length > 0
    ? (
      <Box paddingBottom="0.8rem">
        <Stack direction="row" spacing="0.25em">
          {chips.map((dim) =>
            /* @ts-expect-error details color is custom. */
            <Chip label={dim.label} color="details" variant="outlined" size="small" key={dim.type} />
          )}
        </Stack>
      </Box>
    )
    : <></>
}