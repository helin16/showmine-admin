import React from 'react'
import styled from 'styled-components'
import Icons from '../../Icons'
import translate from '../../../i18n/translate'
import { ADDABLE_SECTION_TYPES } from '../SectionEditors'

// The blocks to add, as square tiles with an icon and a name, as in the MConnect form designer's Content panel
// (mgg-ui BlockPalette). The page sets --block-tiles (3, 4 or 5 a row) and sizes its panel to fit them.
export const BLOCK_TILE_SIZE = '120px'
export const BLOCK_TILE_GAP = '8px'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(var(--block-tiles, auto-fill), ${BLOCK_TILE_SIZE});
  gap: ${BLOCK_TILE_GAP};
  .block-tile {
    width: ${BLOCK_TILE_SIZE};
    height: ${BLOCK_TILE_SIZE};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.25rem;
    background: #fff;
    color: #212529;
    border: 1px solid #dee2e6;
    font-size: 0.85rem;
    line-height: 1.1;
    cursor: pointer;
    .anticon {
      font-size: 24px;
    }
    &:hover:not(:disabled) {
      border-color: #1677ff;
      color: #1677ff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }
    &:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }
  }
`

const ICONS: { [type: string]: React.ComponentType } = {
  hero: Icons.FileImageOutlined,
  text: Icons.FileTextOutlined,
  image: Icons.PictureOutlined,
  gallery: Icons.AppstoreOutlined,
  contact: Icons.ContactsOutlined,
  articles: Icons.ReadOutlined,
}

type iBlockPalette = { isFull: boolean; onAdd: (type: string) => void }

// Click a tile to add it after the selected block; dragging comes in slice 3.
const BlockPalette = ({ isFull, onAdd }: iBlockPalette) => (
  <Grid role={'group'} aria-label={translate('website-section-add')}>
    {ADDABLE_SECTION_TYPES.map((type) => {
      const Icon = ICONS[type]
      const name = translate(`website-section-type-${type}`)
      return (
        <button
          key={type}
          type={'button'}
          className={'block-tile'}
          aria-label={translate('website-section-add-named', { name })}
          disabled={isFull}
          onClick={() => onAdd(type)}
        >
          <Icon aria-hidden />
          <span>{name}</span>
        </button>
      )
    })}
  </Grid>
)

export default BlockPalette
