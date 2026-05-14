/**
 * Bootstrap → MaterialCommunityIcons shim
 * Maps Bootstrap icon names used in the codebase to MaterialCommunityIcons equivalents.
 * Usage: import { Bootstrap } from '../shared/BootstrapIcon'
 *   <Bootstrap name="music-note-beamed" size={20} color="white" />
 */
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ICON_MAP = {
  // Arrows / Navigation
  'arrow-clockwise': 'refresh',
  'arrow-left': 'arrow-left',
  'arrow-repeat': 'repeat',
  'arrow-right': 'arrow-right',
  'arrow-right-circle-fill': 'arrow-right-circle',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'box-arrow-right': 'logout',
  'box-arrow-up-right': 'open-in-new',

  // Media / Music
  'music-note-beamed': 'music-note',
  'music-note-list': 'playlist-music',
  'play-fill': 'play',
  'play-circle': 'play-circle-outline',
  'play-circle-fill': 'play-circle',
  'mic': 'microphone',
  'camera-video': 'video-outline',
  'camera-video-fill': 'video',
  'broadcast': 'broadcast',
  'image': 'image',

  // Books / Education
  'book': 'book-open-variant',
  'collection': 'folder-multiple',
  'journal-check': 'clipboard-check-outline',
  'journal-text': 'text-box-outline',
  'journal-x': 'clipboard-remove-outline',
  'lightbulb': 'lightbulb-outline',

  // Charts / Data
  'bar-chart-line': 'chart-bar',
  'speedometer2': 'speedometer',
  'bullseye': 'bullseye',
  'target': 'target',

  // Social / People
  'people': 'account-group',
  'person': 'account',
  'person-badge': 'badge-account',
  'person-circle': 'account-circle',
  'person-fill': 'account',
  'person-fill-x': 'account-remove',
  'diagram-3': 'sitemap-outline',

  // Communication
  'chat-dots': 'chat-outline',
  'chat-left-text': 'message-text-outline',
  'chat-square-text': 'message-outline',
  'envelope': 'email-outline',
  'envelope-arrow-up': 'email-send-outline',
  'envelope-open': 'email-open-outline',
  'send-fill': 'send',
  'megaphone': 'bullhorn',

  // Awards / Achievements
  'trophy': 'trophy',
  'trophy-fill': 'trophy',
  'award': 'medal',
  'award-fill': 'medal',
  'star': 'star-outline',
  'star-fill': 'star',
  'heart': 'heart-outline',
  'heart-fill': 'heart',
  'fire': 'fire',
  'flag': 'flag',

  // Calendar
  'calendar3': 'calendar',
  'calendar-check': 'calendar-check',
  'calendar-event': 'calendar-clock',
  'calendar-week': 'calendar-week',
  'calendar-x': 'calendar-remove',
  'clock': 'clock-outline',

  // Actions
  'search': 'magnify',
  'download': 'download',
  'plus-circle': 'plus-circle',
  'check-lg': 'check',
  'check-circle': 'check-circle-outline',
  'check-circle-fill': 'check-circle',
  'x-lg': 'close',
  'link-45deg': 'link',
  'paperclip': 'paperclip',
  'tag': 'tag',
  'list': 'format-list-bulleted',
  'menu': 'menu',
  'emoji-smile': 'emoticon-outline',

  // Security
  'lock': 'lock',
  'lock-fill': 'lock',
  'shield-check': 'shield-check',
  'shield-exclamation': 'shield-alert',
  'shield-lock': 'shield-lock',
  'shield-lock-fill': 'shield-lock',
  'pin-fill': 'pin',

  // Finance / Settings
  'gear': 'cog',
  'credit-card-2-front': 'credit-card',
  'controller': 'gamepad-variant',

  // Info
  'info-circle': 'information',
  'exclamation-circle': 'alert-circle',
  'exclamation-triangle': 'alert',
};

export const Bootstrap = ({ name, size = 20, color = '#000', style }) => {
  const mappedName = ICON_MAP[name] || 'help-circle-outline';
  return <MaterialCommunityIcons name={mappedName} size={size} color={color} style={style} />;
};

export default Bootstrap;
