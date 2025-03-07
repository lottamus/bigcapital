// @ts-nocheck
import React from 'react';
import { Tabs } from '@blueprintjs/core';
import styled from 'styled-components';

/**
 * Drawer main tabs.
 */
export function DrawerMainTabs({ children, ...restProps }) {
  return (
    <DrawerMainTabsRoot>
      <Tabs animate={true} large={true} {...restProps}>
        {children}
      </Tabs>
    </DrawerMainTabsRoot>
  );
}

const DrawerMainTabsRoot = styled.div`
  .bp3-tabs {
    .bp3-tab-list {
      position: relative;
      background-color: #fff;
      padding: 0 15px;
      border-bottom: 2px solid #e1e2e8;

      > *:not(:last-child) {
        margin-right: 25px;
      }

      &.bp3-large > .bp3-tab {
        font-size: 15px;
        color: #7f8596;
        margin: 0 1rem;

        &[aria-selected='true'],
        &:not([aria-disabled='true']):hover {
          color: #0052cc;
        }
      }
      .bp3-tab-indicator-wrapper .bp3-tab-indicator {
        height: 2px;
        bottom: -2px;
      }
    }

    .bp3-tab-panel {
      margin-top: 0;

      .card {
        margin: 15px;
      }
    }
  }
`;
