/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const Main = imports.ui.main;
// const Gettext = imports.gettext.domain('gnome-shell-extensions-mediaplayer');
const Me = imports.misc.extensionUtils.getCurrentExtension();
import { addIcon, initTranslations } from './lib.js';
import PlayerManager from './manager.js';
import { AggregateMenuIndicator, PanelIndicator } from './panel.js';
import settings from './settings.js';

// global stuff
/** @type {PlayerManager} */
export let manager;
/** @type {AggregateMenuIndicator|PanelIndicator} */
export let indicator;
let _stockMpris;
let _stockMprisOldShouldShow;

/** Extension init function */
export function init() {
  initTranslations(Me);
  addIcon(Me);
  settings.init();
  if (settings.MINOR_VERSION > 19) {
    // Monkey patch
    _stockMpris = Main.panel.statusArea.dateMenu._messageList._mediaSection;
    _stockMprisOldShouldShow = _stockMpris._shouldShow;
  }
  settings.gsettings.connect('changed::' + settings.MEDIAPLAYER_INDICATOR_POSITION_KEY, function() {
    _reset();
  });
}

/** Reset extension */
function _reset() {
  if (manager) {
    disable();
    enable();
  }
}

/** Extension enable function */
export function enable() {
  let position = settings.gsettings.get_enum(settings.MEDIAPLAYER_INDICATOR_POSITION_KEY);
  let menu;
  let desiredMenuPosition;

  if (position === settings.IndicatorPosition.VOLUMEMENU) {
    indicator = new AggregateMenuIndicator();
    menu = Main.panel.statusArea.aggregateMenu.menu;
    desiredMenuPosition = Main.panel.statusArea.aggregateMenu.menu
      ._getMenuItems().indexOf(Main.panel.statusArea.aggregateMenu._rfkill.menu);
  } else {
    indicator = new PanelIndicator();
    menu = indicator.menu;
    desiredMenuPosition = 0;
  }

  manager = new PlayerManager(menu, desiredMenuPosition);
  if (position === settings.IndicatorPosition.LEFT) {
    Main.panel.addToStatusArea('mediaplayer', indicator, 999, 'left');
  } else if (position === settings.IndicatorPosition.RIGHT) {
    Main.panel.addToStatusArea('mediaplayer', indicator);
  } else if (position === settings.IndicatorPosition.CENTER) {
    Main.panel.addToStatusArea('mediaplayer', indicator, 999, 'center');
  } else {
    Main.panel.statusArea.aggregateMenu._indicators
      .insert_child_below(
        indicator.indicators,
        Main.panel.statusArea.aggregateMenu._screencast.indicators
      );
  }

  indicator.manager = manager;
}

/** Extension disable function */
export function disable() {
  manager.destroy();
  manager = null;
  if (indicator instanceof PanelIndicator) indicator.destroy();
  else indicator.indicators.destroy();
  indicator = null;
  if (settings.MINOR_VERSION > 19) {
    // Revert Monkey patch
    _stockMpris._shouldShow = _stockMprisOldShouldShow;
    if (_stockMpris._shouldShow()) {
      _stockMpris.actor.show();
    }
  }
}
