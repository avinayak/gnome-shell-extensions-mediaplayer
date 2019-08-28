/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
/**
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
**/

'use strict';

// TODO: jsdoc
/* eslint-disable require-jsdoc */

const Clutter = imports.gi.Clutter;
const GObject = imports.gi.GObject;
const Pango = imports.gi.Pango;
const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
// const Signals = imports.signals;

import settings from './settings.js';
import {
  _extends,
  compileTemplate,
  setCoverIconAsync,
  getPlayerSymbolicIcon
} from './util.js';

const IndicatorMixin = {
  set manager(manager) {
    this._manager = manager;
    this.manager.connect('player-active-update', this._commonOnActivePlayerUpdate.bind(this));
    this.manager.connect('player-active-remove', this._commonOnActivePlayerRemove.bind(this));
    this.manager.connect('connect-signals', this._connectSignals.bind(this));
    this.manager.connect('disconnect-signals', this._disconnectSignals.bind(this));
  },

  get manager() {
    return this._manager;
  },

  get state() {
    if (this.manager.activePlayer) {
      return this.manager.activePlayer.state;
    }
    return {};
  },

  _onScrollEvent(actor, event) {
    if (!this.manager.activePlayer) return;
    if (settings.gsettings.get_boolean(settings.MEDIAPLAYER_ENABLE_SCROLL_EVENTS_KEY)) {
      if (settings.gsettings.get_boolean(settings.MEDIAPLAYER_ALTERNATE_MOUSE_MODE)) {
        switch (event.get_scroll_direction()) {
          case Clutter.ScrollDirection.UP:
            // TODO: maybe make this a configuration option?
            this.manager.activePlayer.volume += 0.05;
            break;
          case Clutter.ScrollDirection.DOWN:
            this.manager.activePlayer.volume -= 0.05;
            break;
        }
      } else {
        switch (event.get_scroll_direction()) {
          case Clutter.ScrollDirection.UP:
            this.manager.activePlayer.next();
            break;
          case Clutter.ScrollDirection.DOWN:
            this.manager.activePlayer.previous();
            break;
        }
      }
    }
  },

  _onButtonEvent(_actor, event) {
    let player = this.manager.activePlayer;
    if (!player || event.type() !== Clutter.EventType.BUTTON_PRESS) {
      return Clutter.EVENT_PROPAGATE;
    }
    switch (event.get_button()) {
      case 2: // scroll wheel push (usually)
        player.playPause();
        break;
      case 8: // back button
        player.previous();
        break;
      case 9: // forward button
        player.next();
        break;
      default: // something we shouldn't be handling
        return Clutter.EVENT_PROPAGATE;
    }
    return Clutter.EVENT_STOP;
  },

  _connectSignals() {
    this._signalsId.push(this._settings.connect('changed::' + settings.MEDIAPLAYER_COVER_STATUS_KEY,
      (settings, key) => {
        this._useCoverInPanel = settings.get_boolean(key);
        this._updatePanel();
      }));
    this._signalsId.push(this._settings.connect('changed::' + settings.MEDIAPLAYER_STATUS_TEXT_KEY,
      (settings, key) => {
        this._stateTemplate = settings.get_string(key);
        this._updatePanel();
      }));
    this._signalsId.push(this._settings.connect('changed::' + settings.MEDIAPLAYER_STATUS_SIZE_KEY,
      (settings, key) => {
        this._prefWidth = settings.get_int(key);
        this._updatePanel();
      }));
    this._signalsId.push(this._settings.connect('changed::' + settings.MEDIAPLAYER_PLAY_STATE_ICON_KEY,
      (settings, key) => {
        this._showPlayStateIcon = settings.get_boolean(key);
        this._updatePanel();
      }));
  },

  _disconnectSignals() {
    for (let signal of this._signalsId) {
      this._settings.disconnect(signal);
    }
    this._signalsId = [];
  },

  // method binded to classes below
  _commonOnActivePlayerUpdate() {
    this._updatePanel();
    this._onActivePlayerUpdate(this.state);
  },

  _updatePanel() {
    let state = this.state;
    if (state.status && this._showPlayStateIcon) {
      if (state.status === settings.Status.PLAY) {
        this._secondaryIndicator.icon_name = 'media-playback-start-symbolic';
      } else if (state.status === settings.Status.PAUSE) {
        this._secondaryIndicator.icon_name = 'media-playback-pause-symbolic';
      } else if (state.status === settings.Status.STOP) {
        this._secondaryIndicator.icon_name = 'media-playback-stop-symbolic';
      }
      this._secondaryIndicator.show();
      this._secondaryIndicator.set_width(-1);
      this.indicators.show();
    } else {
      this._secondaryIndicator.hide();
    }

    if (this._stateTemplate.length === 0 || state.status === settings.Status.STOP) {
      this._thirdIndicator.clutter_text.set_markup('');
      this._statusTextWidth = 0;
      this._stateText = '';
      this._thirdIndicator.hide();
    } else if (state.playerName || state.trackTitle || state.trackArtist || state.trackAlbum) {
      let stateText = this.compileTemplate(this._stateTemplate, state);
      if (this._stateText !== stateText) {
        this._stateText = stateText;
        this._thirdIndicator.clutter_text.set_markup(this._stateText);
        this._thirdIndicator.set_width(-1);
        this._statusTextWidth = this._thirdIndicator.get_width();
      }
      let desiredwidth = Math.min(this._prefWidth, this._statusTextWidth);
      let currentWidth = this._thirdIndicator.get_width();
      if (currentWidth !== desiredwidth) {
        this._thirdIndicator.set_width(desiredwidth);
      }
      this._thirdIndicator.show();
    }

    if (state.trackCoverUrl || state.desktopEntry) {
      let fallbackIcon = this.getPlayerSymbolicIcon(state.desktopEntry, 'mpi-symbolic');
      if (this._useCoverInPanel) {
        this.setCoverIconAsync(this._primaryIndicator, state.trackCoverUrl, fallbackIcon, true);
      } else if (this._primaryIndicator.icon_name !== fallbackIcon) {
        this._primaryIndicator.icon_name = fallbackIcon;
      }
    }
  },

  _commonOnActivePlayerRemove() {
    this._primaryIndicator.icon_name = 'audio-x-generic-symbolic';
    this._thirdIndicator.clutter_text.set_markup('');
    this._thirdIndicator.set_width(0);
    this._secondaryIndicator.set_width(0);
    this._thirdIndicator.hide();
    this._secondaryIndicator.hide();
    this._onActivePlayerRemove();
  }
};

export let PanelIndicator = GObject.registerClass(class PanelIndicator extends PanelMenu.Button {
  _init() {
    super._init(0.0, 'mediaplayer');

    this._manager = null;
    this.actor.add_style_class_name('panel-status-button');
    this.menu.actor.add_style_class_name('aggregate-menu panel-media-indicator');
    this.compileTemplate = compileTemplate;
    this.setCoverIconAsync = setCoverIconAsync;
    this.getPlayerSymbolicIcon = getPlayerSymbolicIcon;

    this._settings = settings.gsettings;
    this._useCoverInPanel = this._settings.get_boolean(settings.MEDIAPLAYER_COVER_STATUS_KEY);
    this._stateTemplate = this._settings.get_string(settings.MEDIAPLAYER_STATUS_TEXT_KEY);
    this._prefWidth = this._settings.get_int(settings.MEDIAPLAYER_STATUS_SIZE_KEY);
    this._showPlayStateIcon = this._settings.get_boolean(settings.MEDIAPLAYER_PLAY_STATE_ICON_KEY);
    this._statusTextWidth = 0;
    this._stateText = '';
    this._signalsId = [];

    this.indicators = new St.BoxLayout({ vertical: false, style_class: 'system-status-icon' });

    this._primaryIndicator = new St.Icon({ icon_name: 'audio-x-generic-symbolic',
      style_class: 'system-status-icon no-padding' });
    this._secondaryIndicator = new St.Icon({ icon_name: 'media-playback-stop-symbolic',
      style_class: 'system-status-icon no-padding' });
    this._secondaryIndicator.hide();
    this._thirdIndicator = new St.Label({ style_class: 'system-status-icon no-padding' });
    this._thirdIndicator.clutter_text.ellipsize = Pango.EllipsizeMode.END;
    this._thirdIndicatorBin = new St.Bin({ child: this._thirdIndicator });
    this._thirdIndicator.hide();

    this.indicators.add(this._primaryIndicator);
    this.indicators.add(this._secondaryIndicator);
    this.indicators.add(this._thirdIndicatorBin);

    this.actor.add_actor(this.indicators);
    this.actor.connect('scroll-event', this._onScrollEvent.bind(this));
    this.actor.hide();
  }

  // Override PanelMenu.Button._onEvent
  _onEvent(actor, event) {
    if (this._onButtonEvent(actor, event) === Clutter.EVENT_PROPAGATE) {
      super._onEvent(actor, event);
    }
  }

  _onActivePlayerUpdate(state) {
    if (this.manager.activePlayer) {
      this.actor.show();
    }
  }

  _onActivePlayerRemove() {
    this.actor.hide();
  }
});
_extends(PanelIndicator, IndicatorMixin);

export class AggregateMenuIndicator extends PanelMenu.SystemIndicator {
  constructor() {
    super();

    this._manager = null;
    this.compileTemplate = compileTemplate;
    this.setCoverIconAsync = setCoverIconAsync;
    this.getPlayerSymbolicIcon = getPlayerSymbolicIcon;
    this._settings = settings.gsettings;
    this._useCoverInPanel = this._settings.get_boolean(settings.MEDIAPLAYER_COVER_STATUS_KEY);
    this._stateTemplate = this._settings.get_string(settings.MEDIAPLAYER_STATUS_TEXT_KEY);
    this._prefWidth = this._settings.get_int(settings.MEDIAPLAYER_STATUS_SIZE_KEY);
    this._statusTextWidth = 0;
    this._stateText = '';
    this._signalsId = [];
    this._primaryIndicator = this._addIndicator();
    this._primaryIndicator.icon_name = 'audio-x-generic-symbolic';
    this._primaryIndicator.style_class = 'system-status-icon no-padding';
    this._secondaryIndicator = this._addIndicator();
    this._secondaryIndicator.icon_name = 'media-playback-stop-symbolic';
    this._secondaryIndicator.style_class = 'system-status-icon no-padding';
    this._secondaryIndicator.hide();
    this._thirdIndicator = new St.Label({ style_class: 'system-status-icon no-padding' });
    this._thirdIndicator.clutter_text.ellipsize = Pango.EllipsizeMode.END;
    this._thirdIndicator.hide();
    this._thirdIndicatorBin = new St.Bin({ child: this._thirdIndicator });
    this.indicators.add_actor(this._thirdIndicatorBin);
    this.indicators.connect('scroll-event', this._onScrollEvent.bind(this));
    this.indicators.connect('button-press-event', this._onButtonEvent.bind(this));

    this.indicators.hide();
    this._settings.connect('changed::' + settings.MEDIAPLAYER_HIDE_AGGINDICATOR_KEY, () => {
      let alwaysHide = this._settings.get_boolean(settings.MEDIAPLAYER_HIDE_AGGINDICATOR_KEY);
      if (alwaysHide) {
        this.indicators.hide();
      } else if (this.manager.activePlayer && this.manager.activePlayer.state.status !== settings.Status.STOP) {
        this.indicators.show();
      }
    });
  }

  _onActivePlayerUpdate(state) {
    let alwaysHide = this._settings.get_boolean(settings.MEDIAPLAYER_HIDE_AGGINDICATOR_KEY);
    if (state.status && state.status === settings.Status.STOP || alwaysHide) {
      this.indicators.hide();
    } else if (state.status && !alwaysHide) {
      this.indicators.show();
    }
  }

  _onActivePlayerRemove() {
    this.indicators.hide();
  }
}
_extends(AggregateMenuIndicator, IndicatorMixin);
