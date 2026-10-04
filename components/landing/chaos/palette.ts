/** Flat semantic tokens so a Partial override can change any token independently. */
export type ChaosPalette = {
  clearColor: string
  clearOpacity: number
  debitFace: string
  creditFace: string
  cardInk: string
  cardSheen: string
  cardSheenOpacity: number
  cardSheenEdgeOpacity: number
  cardMark: string
  cardMarkOpacity: number
  chipSurface: string
  chipDetail: string
  receiptPaper: string
  ink: string
  mutedInk: string
  receiptRule: string
  pillSurface: string
  pillIcon: string
  positiveIcon: string
  iconInk: string
  positiveAmount: string
  negativeAmount: string
  coinMetal: string
  coinFaceTint: string
  coinDetail: string
  coinNumeral: string
  coinRoughness: number
  coinMetalness: number
  coinEnvironmentIntensity: number
  shadowColor: string
  shadowOpacity: number
  shadowRadius: number
  floatingShadowRadius: number
  shadowBias: number
  shadowNormalBias: number
  keyLightColor: string
  keyLightIntensity: number
  keyLightX: number
  keyLightY: number
  hemisphereSky: string
  hemisphereGround: string
  hemisphereIntensity: number
  exposure: number
  environmentIntensity: number
  environmentBlur: number
  cardRoughness: number
  cardClearcoat: number
  cardClearcoatRoughness: number
  paperRoughness: number
  paperSheen: number
  pillRoughness: number
  pillClearcoat: number
  faceSpecularIntensity: number
  printTint: string
  textureFontFamily: string
  textureFontFallback: string
  coinFontFamily: string
}

export const defaultPalette: ChaosPalette = {
  clearColor: '#000000', clearOpacity: 0,
  debitFace: '#2D1147', creditFace: '#F97316', cardInk: '#FFFDF8',
  cardSheen: '#FFFFFF', cardSheenOpacity: 0.13, cardSheenEdgeOpacity: 0.02, cardMark: '#FFFFFF', cardMarkOpacity: 0.3,
  chipSurface: '#DCC48B', chipDetail: '#AA925B', receiptPaper: '#FFFDF8',
  ink: '#1C0A00', mutedInk: '#6F5A4C', receiptRule: '#CDBFB1',
  pillSurface: '#FFFFFF', pillIcon: '#2D1147', positiveIcon: '#10B981', iconInk: '#FFFFFF',
  positiveAmount: '#0F7A55', negativeAmount: '#1C0A00',
  coinMetal: '#D4A24C', coinFaceTint: '#F2CA72', coinDetail: '#AD7D32', coinNumeral: '#B1843B',
  coinRoughness: 0.5, coinMetalness: 0.78, coinEnvironmentIntensity: 0.25,
  shadowColor: '#3A1A0A', shadowOpacity: 0.12, shadowRadius: 3, floatingShadowRadius: 12,
  shadowBias: -0.00012, shadowNormalBias: 0.4,
  keyLightColor: '#FFF6EC', keyLightIntensity: 1.8, keyLightX: -0.32, keyLightY: 0.48,
  hemisphereSky: '#FFF6EC', hemisphereGround: '#E9DCCB', hemisphereIntensity: 1.25,
  exposure: 1.05, environmentIntensity: 0.65, environmentBlur: 0.04,
  cardRoughness: 0.42, cardClearcoat: 0.5, cardClearcoatRoughness: 0.3,
  paperRoughness: 0.92, paperSheen: 0.12, pillRoughness: 0.3, pillClearcoat: 0.8,
  faceSpecularIntensity: 0.15, printTint: '#FFFFFF', textureFontFamily: 'var(--font-manrope)', textureFontFallback: 'system-ui, sans-serif', coinFontFamily: 'Georgia, serif',
}

export function cardColor(id: string, palette: ChaosPalette): string {
  return id === 'debit' ? palette.debitFace : palette.creditFace
}
