export interface Team {
  id: string;
  name: string;
  flag: string; // Emoji bayrak simgesi
  probability: number; // Turnuvayı kazanma olasılığı (%)
}

export interface GroupData {
  id: string; // 'A' - 'L'
  name: string; // "A Grubu", vb.
  teams: Team[];
}

export const groupsData: GroupData[] = [
  {
    id: 'A',
    name: 'A Grubu',
    teams: [
      { id: 'mexico', name: 'Meksika', flag: '🇲🇽', probability: 10.8 },
      { id: 'south_korea', name: 'Güney Kore', flag: '🇰🇷', probability: 1.4 },
      { id: 'czech_republic', name: 'Çekya', flag: '🇨🇿', probability: 0.4 },
      { id: 'south_africa', name: 'Güney Afrika', flag: '🇿🇦', probability: 0.2 }
    ]
  },
  {
    id: 'B',
    name: 'B Grubu',
    teams: [
      { id: 'switzerland', name: 'İsviçre', flag: '🇨🇭', probability: 3.0 },
      { id: 'canada', name: 'Kanada', flag: '🇨🇦', probability: 2.4 },
      { id: 'bosnia', name: 'Bosna-Hersek', flag: '🇧🇦', probability: 0.3 },
      { id: 'qatar', name: 'Katar', flag: '🇶🇦', probability: 0.2 }
    ]
  },
  {
    id: 'C',
    name: 'C Grubu',
    teams: [
      { id: 'brazil', name: 'Brezilya', flag: '🇧🇷', probability: 9.0 },
      { id: 'morocco', name: 'Fas', flag: '🇲🇦', probability: 7.0 },
      { id: 'scotland', name: 'İskoçya', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', probability: 0.5 },
      { id: 'haiti', name: 'Haiti', flag: '🇭🇹', probability: 0.0 }
    ]
  },
  {
    id: 'D',
    name: 'D Grubu',
    teams: [
      { id: 'usa', name: 'ABD', flag: '🇺🇸', probability: 5.7 },
      { id: 'turkiye', name: 'Türkiye', flag: '🇹🇷', probability: 1.0 },
      { id: 'australia', name: 'Avustralya', flag: '🇦🇺', probability: 1.0 },
      { id: 'paraguay', name: 'Paraguay', flag: '🇵🇾', probability: 0.3 }
    ]
  },
  {
    id: 'E',
    name: 'E Grubu',
    teams: [
      { id: 'germany', name: 'Almanya', flag: '🇩🇪', probability: 8.1 },
      { id: 'ecuador', name: 'Ekvador', flag: '🇪🇨', probability: 1.4 },
      { id: 'ivory_coast', name: 'Fildişi Sahili', flag: '🇨🇮', probability: 0.7 },
      { id: 'curacao', name: 'Curaçao', flag: '🇨🇼', probability: 0.0 }
    ]
  },
  {
    id: 'F',
    name: 'F Grubu',
    teams: [
      { id: 'netherlands', name: 'Hollanda', flag: '🇳🇱', probability: 7.5 },
      { id: 'japan', name: 'Japonya', flag: '🇯🇵', probability: 2.2 },
      { id: 'sweden', name: 'İsveç', flag: '🇸🇪', probability: 0.4 },
      { id: 'tunisia', name: 'Tunus', flag: '🇹🇳', probability: 0.1 }
    ]
  },
  {
    id: 'G',
    name: 'G Grubu',
    teams: [
      { id: 'belgium', name: 'Belçika', flag: '🇧🇪', probability: 5.8 },
      { id: 'iran', name: 'İran', flag: '🇮🇷', probability: 1.4 },
      { id: 'egypt', name: 'Mısır', flag: '🇪🇬', probability: 0.9 },
      { id: 'new_zealand', name: 'Yeni Zelanda', flag: '🇳🇿', probability: 0.0 }
    ]
  },
  {
    id: 'H',
    name: 'H Grubu',
    teams: [
      { id: 'spain', name: 'İspanya', flag: '🇪🇸', probability: 17.9 },
      { id: 'uruguay', name: 'Uruguay', flag: '🇺🇾', probability: 1.6 },
      { id: 'saudi_arabia', name: 'Suudi Arabistan', flag: '🇸🇦', probability: 0.1 },
      { id: 'cape_verde', name: 'Yeşil Burun Adaları', flag: '🇨🇻', probability: 0.1 }
    ]
  },
  {
    id: 'I',
    name: 'I Grubu',
    teams: [
      { id: 'france', name: 'Fransa', flag: '🇫🇷', probability: 1.1 },
      { id: 'senegal', name: 'Senegal', flag: '🇸🇳', probability: 0.9 },
      { id: 'norway', name: 'Norveç', flag: '🇳🇴', probability: 0.4 },
      { id: 'iraq', name: 'Irak', flag: '🇮🇶', probability: 0.1 }
    ]
  },
  {
    id: 'J',
    name: 'J Grubu',
    teams: [
      { id: 'argentina', name: 'Arjantin', flag: '🇦🇷', probability: 0.9 },
      { id: 'austria', name: 'Avusturya', flag: '🇦🇹', probability: 0.5 },
      { id: 'algeria', name: 'Cezayir', flag: '🇩🇿', probability: 0.3 },
      { id: 'jordan', name: 'Ürdün', flag: '🇯🇴', probability: 0.0 }
    ]
  },
  {
    id: 'K',
    name: 'K Grubu',
    teams: [
      { id: 'colombia', name: 'Kolombiya', flag: '🇨🇴', probability: 1.0 },
      { id: 'portugal', name: 'Portekiz', flag: '🇵🇹', probability: 0.8 },
      { id: 'dr_congo', name: 'Kongo DC', flag: '🇨🇩', probability: 0.2 },
      { id: 'uzbekistan', name: 'Özbekistan', flag: '🇺🇿', probability: 0.1 }
    ]
  },
  {
    id: 'L',
    name: 'L Grubu',
    teams: [
      { id: 'england', name: 'İngiltere', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', probability: 1.1 },
      { id: 'croatia', name: 'Hırvatistan', flag: '🇭🇷', probability: 1.0 },
      { id: 'panama', name: 'Panama', flag: '🇵🇦', probability: 0.3 },
      { id: 'ghana', name: 'Gana', flag: '🇬🇭', probability: 0.1 }
    ]
  }
];

export const allTeamsMap = new Map<string, Team>(
  groupsData.flatMap(g => g.teams).map(t => [t.id, t])
);

export const getTeamById = (id: string): Team | undefined => {
  return allTeamsMap.get(id);
};
