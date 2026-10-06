import { ComponentProps } from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

type IconProps = ComponentProps<typeof Svg> & { name: string; size?: number; color?: string };

// LandWatch uses one small SVG icon system across web and native. This avoids
// browser font loading differences and keeps every icon optically consistent.
function AppIcon({ name, size = 22, color = '#14181A', style }: IconProps) {
  const stroke = { stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let art: any;
  switch (name) {
    case 'notifications-outline': art = <><Path d="M6 17h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v4.5L6 17Z" {...stroke} /><Path d="M10 20h4" {...stroke} /></>; break;
    case 'log-out-outline': case 'arrow-forward': art = <><Path d="M13 5h7v14h-7" {...stroke} /><Line x1="4" y1="12" x2="16" y2="12" {...stroke} /><Polyline points="11,7 16,12 11,17" {...stroke} /></>; break;
    case 'home-outline': art = <><Path d="M3 11.5 12 4l9 7.5" {...stroke} /><Path d="M5.5 10.5V21h13V10.5M9.5 21v-6h5v6" {...stroke} /></>; break;
    case 'person': case 'person-outline': art = <><Circle cx="12" cy="8" r="4" {...stroke} /><Path d="M4.5 21c.7-4.2 3.1-6.3 7.5-6.3s6.8 2.1 7.5 6.3" {...stroke} /></>; break;
    case 'search-outline': art = <><Circle cx="10.5" cy="10.5" r="6.5" {...stroke} /><Line x1="15.5" y1="15.5" x2="21" y2="21" {...stroke} /></>; break;
    case 'settings-outline': art = <><Circle cx="12" cy="12" r="3.2" {...stroke} /><Circle cx="12" cy="12" r="8" {...stroke} /><Line x1="12" y1="2" x2="12" y2="5" {...stroke} /><Line x1="12" y1="19" x2="12" y2="22" {...stroke} /><Line x1="2" y1="12" x2="5" y2="12" {...stroke} /><Line x1="19" y1="12" x2="22" y2="12" {...stroke} /></>; break;
    case 'shield-checkmark-outline': case 'shield-outline': art = <><Path d="M12 3 20 6v5c0 5-3 8.5-8 10-5-1.5-8-5-8-10V6l8-3Z" {...stroke} />{name.includes('checkmark') ? <Polyline points="8,12 11,15 16,9" {...stroke} /> : null}</>; break;
    case 'map-outline': art = <><Path d="M3 6 8 3l8 3 5-3v15l-5 3-8-3-5 3V6Z" {...stroke} /><Line x1="8" y1="3" x2="8" y2="18" {...stroke} /><Line x1="16" y1="6" x2="16" y2="21" {...stroke} /></>; break;
    case 'location': case 'location-outline': art = <><Path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" {...stroke} /><Circle cx="12" cy="10" r="2.5" {...stroke} /></>; break;
    case 'calendar-outline': art = <><Rect x="3" y="5" width="18" height="16" rx="2.5" {...stroke} /><Line x1="3" y1="9" x2="21" y2="9" {...stroke} /><Line x1="8" y1="3" x2="8" y2="7" {...stroke} /><Line x1="16" y1="3" x2="16" y2="7" {...stroke} /></>; break;
    case 'image-outline': art = <><Rect x="3" y="4" width="18" height="16" rx="2" {...stroke} /><Circle cx="8" cy="9" r="1.5" {...stroke} /><Path d="m4 18 5-5 3 3 3-4 5 6" {...stroke} /></>; break;
    case 'document-text-outline': case 'documents-outline': art = <><Path d="M6 3h9l4 4v14H6V3Z" {...stroke} /><Path d="M15 3v5h4M9 12h6M9 16h6" {...stroke} /></>; break;
    case 'add': case 'add-circle-outline': art = <><Circle cx="12" cy="12" r={name === 'add' ? 0 : 9} {...(name === 'add' ? {} : stroke)} /><Line x1="12" y1="6" x2="12" y2="18" {...stroke} /><Line x1="6" y1="12" x2="18" y2="12" {...stroke} /></>; break;
    case 'remove': art = <Line x1="6" y1="12" x2="18" y2="12" {...stroke} />; break;
    case 'close': case 'close-circle': case 'close-circle-outline': art = <>{name !== 'close' ? <Circle cx="12" cy="12" r="9" {...stroke} /> : null}<Line x1="8" y1="8" x2="16" y2="16" {...stroke} /><Line x1="16" y1="8" x2="8" y2="16" {...stroke} /></>; break;
    case 'chevron-forward': art = <Polyline points="9,5 16,12 9,19" {...stroke} />; break;
    case 'chevron-back': art = <Polyline points="15,5 8,12 15,19" {...stroke} />; break;
    case 'chevron-down': art = <Polyline points="5,9 12,16 19,9" {...stroke} />; break;
    case 'chevron-up': art = <Polyline points="5,15 12,8 19,15" {...stroke} />; break;
    case 'checkbox-outline': art = <Rect x="5" y="5" width="14" height="14" rx="1.5" {...stroke} />; break;
    case 'swap-vertical-outline': art = <><Polyline points="8,4 5,7 8,10" {...stroke} /><Line x1="5" y1="7" x2="15" y2="7" {...stroke} /><Polyline points="16,14 19,17 16,20" {...stroke} /><Line x1="19" y1="17" x2="9" y2="17" {...stroke} /></>; break;
    case 'eye-outline': art = <><Path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" {...stroke} /><Circle cx="12" cy="12" r="2.5" {...stroke} /></>; break;
    case 'ellipsis-horizontal': art = <><Circle cx="5" cy="12" r="1" fill={color} /><Circle cx="12" cy="12" r="1" fill={color} /><Circle cx="19" cy="12" r="1" fill={color} /></>; break;
    case 'time-outline': art = <><Circle cx="12" cy="12" r="8.5" {...stroke} /><Line x1="12" y1="7" x2="12" y2="12" {...stroke} /><Line x1="12" y1="12" x2="16" y2="14.5" {...stroke} /></>; break;
    case 'checkmark-circle-outline': art = <><Circle cx="12" cy="12" r="8.5" {...stroke} /><Polyline points="8,12 11,15 16,9" {...stroke} /></>; break;
    case 'options-outline': art = <><Line x1="4" y1="7" x2="20" y2="7" {...stroke} /><Circle cx="9" cy="7" r="2" fill={color} /><Line x1="4" y1="17" x2="20" y2="17" {...stroke} /><Circle cx="15" cy="17" r="2" fill={color} /></>; break;
    case 'alert-circle-outline': case 'information-circle-outline': case 'help-circle-outline': art = <><Circle cx="12" cy="12" r="9" {...stroke} /><Path d={name.startsWith('alert') ? 'M12 7v5M12 16h.01' : name.startsWith('help') ? 'M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 2' : 'M12 10v6M12 7h.01'} {...stroke} /></>; break;
    case 'download-outline': art = <><Path d="M12 3v12M7 10l5 5 5-5M4 20h16" {...stroke} /></>; break;
    case 'menu-outline': art = <><Line x1="4" y1="7" x2="20" y2="7" {...stroke} /><Line x1="4" y1="12" x2="20" y2="12" {...stroke} /><Line x1="4" y1="17" x2="20" y2="17" {...stroke} /></>; break;
    case 'mail-outline': art = <><Rect x="3" y="5" width="18" height="14" rx="2" {...stroke} /><Polyline points="4,7 12,13 20,7" {...stroke} /></>; break;
    default: art = <Circle cx="12" cy="12" r="7" {...stroke} />;
  }
  return <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>{art}</Svg>;
}

const glyphMap: Record<string, number> = {};
export const Ionicons = Object.assign(AppIcon, { glyphMap, font: {}, loadFont: async () => undefined });
