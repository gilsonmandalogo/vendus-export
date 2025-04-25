export interface ExportFileOptions {
  'base-url': string
  user: string
  password: string
  month?: string | number
  output: string
}

export function exportFile(options: ExportFileOptions): Promise<void>
