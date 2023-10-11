import React from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from '@mui/material'
import { useEffect, useState } from 'react'
import { defaultQueryOptions } from '../utils/useSearch'

export default function GodMode() {
  const [buff, setBuff] = useState<string>()
  const [open, setOpen] = useState(false)

  const captureKey = (event: KeyboardEvent) => {
    setBuff((b) => {
      let newB = `${b}${event.key}`
      if (newB.length > 7) {
        newB = newB.substring(newB.length - 7)
      }
      return newB
    })
  }

  useEffect(() => {
    if (buff === 'godmode') {
      if (typeof window !== 'undefined') {
        setOpen(true)
      }
      setBuff('')
    }
  }, [buff])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.document.body.addEventListener('keyup', captureKey)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.document.body.removeEventListener('keyup', captureKey)
      }
    }
  }, [])

  const defaultValueStr =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('searchOverride')
      : null
  let defaultValue = JSON.stringify(defaultQueryOptions, null, 2)

  try {
    if (defaultValueStr) {
      defaultValue = JSON.stringify(JSON.parse(defaultValueStr), null, 2)
    }
  } catch (e) {}

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>God Mode</DialogTitle>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            window.localStorage.setItem(
              'searchOverride',
              e.currentTarget.override.value
            )
            setOpen(false)
          }}
        >
          <DialogContent>
            <DialogContentText>
              Update this JSON file to change the query parameters for all
              website searches.
            </DialogContentText>
            <TextField
              defaultValue={defaultValue}
              autoFocus
              margin='dense'
              multiline
              rows={14}
              name='override'
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                window.localStorage.removeItem('searchOverride')
                setOpen(false)
              }}
              color='error'
            >
              Clear
            </Button>
            <Button type='submit' role='submit'>
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}
