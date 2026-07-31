export const USER_PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128

export function validateNewPassword(value: string): string | null {
  if (!value) return 'Informe uma senha.'
  if (value.length < USER_PASSWORD_MIN_LENGTH) {
    return `A senha deve ter pelo menos ${USER_PASSWORD_MIN_LENGTH} caracteres.`
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`
  }
  return null
}
