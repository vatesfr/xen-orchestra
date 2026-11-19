declare module '@vates/otp' {
  export function verifyTotp(token: string, opts: { secret: string }): Promise<boolean>
}
