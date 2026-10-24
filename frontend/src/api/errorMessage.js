const isNonBlankString = (value) => typeof value === 'string' && value.trim() !== ''

export const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data
  return [data?.detail, data?.message, data?.error].find(isNonBlankString) ?? fallback
}
