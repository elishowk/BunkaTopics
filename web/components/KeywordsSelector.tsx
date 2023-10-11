import React from 'react'
import { createRef, useState } from 'react'
import useTranslation from 'next-translate/useTranslation'
import { Box, Chip, FormControl, TextField } from '@mui/material'

export type KeywordsSelectorProps = {
  value?: string[]
  defaultValue?: string[]
  onChange?: (ks: string[]) => void
}

export default function KeywordsSelector(props: KeywordsSelectorProps) {
  const { t } = useTranslation('common')
  const hiddenRef = createRef<HTMLInputElement>()
  const [_keywords, setKeywords] = useState<string[]>(props.defaultValue ?? [])

  const keywords = props.value ?? _keywords

  const addKeyword = (word: string) => {
    const cleanWord = word.trim().toLowerCase()
    if (cleanWord.length > 0) {
      const ks =
        keywords.indexOf(cleanWord) >= 0 ? keywords : [...keywords, cleanWord]
      if (hiddenRef.current) hiddenRef.current.value = JSON.stringify(ks)
      setKeywords(ks)
      props.onChange?.(ks)
    }
  }
  const removeKeyword = (word: string) => {
    const ks = keywords.filter((k) => k !== word.toLowerCase())
    if (hiddenRef.current) hiddenRef.current.value = JSON.stringify(ks)
    setKeywords(ks)
    props.onChange?.(ks)
  }

  return (
    <>
      <input type='hidden' name='keywords' ref={hiddenRef} />
      <FormControl>
        <TextField
          placeholder={t`eg. politics`}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') {
              ev.preventDefault()
              // @ts-expect-error ev.target is the HTMLInputElement.
              addKeyword(ev.target.value)
              // @ts-expect-error ev.target is the HTMLInputElement.
              ev.target.value = ''
            }
          }}
        />
      </FormControl>
      {keywords.length > 0 && (
        <Box
          border='1px solid grey'
          mt='0.2em'
          borderRadius='1em'
          minHeight='1em'
        >
          {keywords.map((word) => (
            <Chip
              key={word}
              label={word}
              variant='outlined'
              color='default'
              onDelete={() => removeKeyword(word)}
            />
          ))}
        </Box>
      )}
    </>
  )
}
