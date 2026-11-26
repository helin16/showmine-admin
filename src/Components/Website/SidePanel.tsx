import React from 'react'
import styled from 'styled-components'
import translate from '../../i18n/translate'
import { BLOCK_TILE_GAP, BLOCK_TILE_SIZE } from './Canvas/BlockPalette'

const PANEL_PADDING = '12px'

// The panel: the open tab's content, with the tab rail on the far right and a notch on the active tab. Beside the
// canvas (992px and wider) the content is as wide as a row of block tiles: 3, then 4 from 1600px and 5 from 1920px.
const PanelDiv = styled.div`
  display: flex;
  @media (min-width: 992px) {
    --block-tiles: 3;
    .panel-content {
      width: calc(
        var(--block-tiles) * ${BLOCK_TILE_SIZE} + (var(--block-tiles) - 1) * ${BLOCK_TILE_GAP} + 2 * ${PANEL_PADDING}
      );
    }
  }
  @media (min-width: 1600px) {
    --block-tiles: 4;
  }
  @media (min-width: 1920px) {
    --block-tiles: 5;
  }
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #f8f9fa;
  min-height: 300px;
  .panel-content {
    flex: 1;
    min-width: 0;
    padding: ${PANEL_PADDING};
  }
  .panel-tabs {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    border-left: 1px solid #dee2e6;
    background: #f1f3f5;
    button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px 10px;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: #495057;
      font-size: 0.8rem;
      cursor: pointer;
      position: relative;
      .anticon {
        font-size: 20px;
      }
      &.active {
        background: #fff;
        color: #212529;
        font-weight: 600;
      }
      &.active::before,
      &.active::after {
        content: '';
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-style: solid;
        border-color: transparent;
      }
      &.active::before {
        left: -10px;
        border-width: 10px 10px 10px 0;
        border-right-color: #dee2e6;
      }
      &.active::after {
        left: -9px;
        border-width: 9px 9px 9px 0;
        border-right-color: #fff;
      }
    }
  }
`

export type iPanelTab<T extends string> = {
  key: T
  label: string
  Icon: React.ComponentType<{ 'aria-hidden'?: boolean }>
}
type iSidePanel<T extends string> = {
  tabs: readonly iPanelTab<T>[]
  // The tab shown as open; none while the content is something else, as a selected block.
  active?: T
  onTab: (key: T) => void
  children: React.ReactNode
}

// The right panel of the website editors (the page editor and the Layout page), as the MConnect form designer.
const SidePanel = <T extends string>({ tabs, active, onTab, children }: iSidePanel<T>) => (
  <PanelDiv>
    <div className={'panel-content'} role={'region'} aria-label={translate('website-panel')}>
      {children}
    </div>
    <div className={'panel-tabs'} role={'group'} aria-label={translate('website-panel-tabs')}>
      {tabs.map(({ key, label, Icon }) => (
        <button
          key={key}
          type={'button'}
          className={active === key ? 'active' : ''}
          aria-pressed={active === key}
          onClick={() => onTab(key)}
        >
          <Icon aria-hidden />
          {label}
        </button>
      ))}
    </div>
  </PanelDiv>
)

export default SidePanel
