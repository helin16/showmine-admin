import translate from '../../i18n/translate'
import { IImageUse } from '../../Types/Website/IWebsite'

// Where the website uses an image, in words: its pages, the site settings and the published site.
const describeUses = (uses: IImageUse[]) =>
  uses
    .map((use) =>
      use.published ? translate('website-image-used-published') : use.pageTitle || translate('website-image-used-site'),
    )
    .join(', ')

export default describeUses
