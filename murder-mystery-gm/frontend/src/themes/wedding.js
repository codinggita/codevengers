import { ClipboardList, Flower2, Tag } from 'lucide-react';

const weddingTheme = {
  id: 'wedding',
  colors: {
    accent: '#d4a24c',
    accentSecondary: '#c98c94',
    glow: 'rgba(212, 162, 76, 0.18)',
    floral: 'rgba(201, 140, 148, 0.16)',
  },
  fonts: {
    display: 'font-case',
    label: 'font-typewriter',
  },
  backgroundMotif: 'wedding-hall',
  playerTileSkin: 'place-card',
  characterCardSkin: 'invitation',
  gmTitle: 'The Wedding Planner',
  ambientDecoration: 'petals',
  labels: {
    publicRecord: 'Wedding program',
    evidenceBoard: 'The Gift Table',
  },
  icons: {
    player: Flower2,
    gm: ClipboardList,
    evidence: Tag,
  },
};

export default weddingTheme;
