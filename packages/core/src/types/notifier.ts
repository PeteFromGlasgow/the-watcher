export type NotifierType = 'ntfy' | 'telegram' | 'slack'

export interface NotifierConfig {
  type: NotifierType
  secretRef: string
}
