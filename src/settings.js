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

const Me = imports.misc.extensionUtils.getCurrentExtension();
import { getSettings } from './lib.js';

const Config = imports.misc.config;

const Gettext = imports.gettext.domain('gnome-shell-extensions-mediaplayer');
const _ = Gettext.gettext;

export default {
  MEDIAPLAYER_INDICATOR_POSITION_KEY: 'indicator-position',
  MEDIAPLAYER_COVER_STATUS_KEY: 'cover-status',
  MEDIAPLAYER_STATUS_TEXT_KEY: 'status-text',
  MEDIAPLAYER_STATUS_SIZE_KEY: 'status-size',
  MEDIAPLAYER_PLAY_STATE_ICON_KEY: 'play-state-icon',
  MEDIAPLAYER_VOLUME_KEY: 'volume',
  MEDIAPLAYER_HIDE_AGGINDICATOR_KEY: 'hide-aggindicator',
  MEDIAPLAYER_POSITION_KEY: 'position',
  MEDIAPLAYER_PLAYLISTS_KEY: 'playlists',
  MEDIAPLAYER_STOP_BUTTON_KEY: 'stop-button',
  MEDIAPLAYER_BUTTON_ICON_STYLE_KEY: 'button-icon-style',
  MEDIAPLAYER_PLAYLIST_TITLE_KEY: 'playlist-title',
  MEDIAPLAYER_TRACKLIST_KEY: 'tracklist',
  MEDIAPLAYER_TRACKLIST_RATING_KEY: 'tracklist-rating',
  MEDIAPLAYER_LOOP_STATUS_KEY: 'loop-status',
  MEDIAPLAYER_RATING_KEY: 'rating',
  MEDIAPLAYER_ENABLE_SCROLL_EVENTS_KEY: 'enable-scroll',
  MEDIAPLAYER_HIDE_STOCK_MPRIS_KEY: 'hide-stockmpris',
  MEDIAPLAYER_KEEP_ACTIVE_OPEN_KEY: 'active-open',
  MEDIAPLAYER_PLAY_STATUS_ICON_KEY: 'playstatus',

  MINOR_VERSION: parseInt(Config.PACKAGE_VERSION.split('.')[1]),

  IndicatorPosition: {
    LEFT: 3,
    CENTER: 0,
    RIGHT: 1,
    VOLUMEMENU: 2
  },

  ButtonIconStyles: {
    CIRCULAR: 0,
    SMALL: 1,
    MEDIUM: 2,
    LARGE: 3
  },

  Status: {
    STOP: 'Stopped',
    PLAY: 'Playing',
    PAUSE: 'Paused'
  },

  ValidPlaybackStatuses: [
    'Stopped',
    'Playing',
    'Paused'
  ],

  SUPPORTS_RATINGS_EXTENSION: [
    'org.mpris.MediaPlayer2.Lollypop'
  ],

  WRONG_VOLUME_SCALING: [
    'org.mpris.MediaPlayer2.quodlibet'
  ],

  ALTERNATIVE_PLAYLIST_TITLES: [
    { 'org.mpris.MediaPlayer2.pithos': _('Stations') }
  ],

  ALTERNATIVE_TRACKLIST_TITLES: [
    { 'org.mpris.MediaPlayer2.pithos': _('Current Playlist') }
  ],

  BROKEN_PLAYERS: [
    'org.mpris.MediaPlayer2.spotify'
  ],

  NO_LOOP_STATUS_SUPPORT: [
    'org.mpris.MediaPlayer2.quodlibet',
    'org.mpris.MediaPlayer2.pithos',
    'org.mpris.MediaPlayer2.spotify'
  ],

  gsettings: null,

  /** Initialize settings provider */
  init() {
    this.gsettings = getSettings(Me);
  }
};

