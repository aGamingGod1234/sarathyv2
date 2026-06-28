import { Composition, Folder } from 'remotion'
import { SarathyPromo, type SarathyPromoProps } from './SarathyPromo'

export const PROMO_FPS = 30
export const PROMO_WIDTH = 1920
export const PROMO_HEIGHT = 1080
export const PROMO_DURATION_IN_FRAMES = 795

export const RemotionRoot = () => {
  return (
    <Folder name="Marketing">
      <Composition
        id="SarathyPromo"
        component={SarathyPromo}
        durationInFrames={PROMO_DURATION_IN_FRAMES}
        fps={PROMO_FPS}
        width={PROMO_WIDTH}
        height={PROMO_HEIGHT}
        defaultProps={
          {
            appName: 'Sarathy',
            audience: 'university students',
            cta: 'Start with today',
          } satisfies SarathyPromoProps
        }
      />
    </Folder>
  )
}
