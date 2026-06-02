'use client';

import React, { useState, useEffect } from 'react';
import { groupsData, Team, getTeamById } from '../../lib/teamData';
import { 
  saveUserPredictions, 
  getUserPredictions, 
  fetchGlobalLeaderboard, 
  fetchGlobalSquadLeaderboard,
  joinSquadWithTransaction,
  createSquad,
  getSquadDetails
} from '../../lib/dbServices';
import AdSenseWrapper from '../../components/AdSenseWrapper';
import { generateBracketCard } from '../../lib/canvasHelper';
import { fetchTeamAiAnalysis } from '../../lib/geminiService';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signInWithApple, logOut } from '../../lib/firebaseConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, User, LogOut, ChevronRight, ChevronLeft, 
  Globe2, Lock, Camera, Sparkles, CheckCircle2, Play
} from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
};

// --- STATE VE AŞAMA TİPLERİ ---
type AppState = 'LANDING' | 'GROUPS' | 'THIRDS' | 'SIGNUP_FORCE' | 'KNOCKOUTS' | 'SUMMARY' | 'PROFILE' | 'LEADERBOARDS';

// --- EN İYİ 3.LER EŞLEŞTİRME ALGORİTMASI (Bipartite DFS with Fallback) ---
interface ThirdPlaceAssignment {
  [matchId: number]: string; // matchId -> teamId
}

interface ThirdPlaceSlot {
  matchId: number;
  allowed: string[];
}

const THIRD_PLACE_SLOTS: ThirdPlaceSlot[] = [
  { matchId: 74, allowed: ['A', 'B', 'C', 'D', 'F'] },
  { matchId: 77, allowed: ['C', 'D', 'F', 'G', 'H'] },
  { matchId: 79, allowed: ['C', 'E', 'F', 'H', 'I'] },
  { matchId: 80, allowed: ['E', 'H', 'I', 'J', 'K'] },
  { matchId: 81, allowed: ['B', 'E', 'F', 'I', 'J'] },
  { matchId: 82, allowed: ['A', 'E', 'H', 'I', 'J'] },
  { matchId: 85, allowed: ['E', 'F', 'G', 'I', 'J'] },
  { matchId: 87, allowed: ['D', 'E', 'I', 'J', 'L'] },
];

function matchThirdPlaceTeams(
  selected: { groupId: string; teamId: string }[]
): ThirdPlaceAssignment {
  const result: ThirdPlaceAssignment = {};
  const visited = new Set<string>();

  function dfs(slotIndex: number): boolean {
    if (slotIndex === THIRD_PLACE_SLOTS.length) return true;
    const slot = THIRD_PLACE_SLOTS[slotIndex];
    for (const team of selected) {
      if (!visited.has(team.teamId) && slot.allowed.includes(team.groupId)) {
        visited.add(team.teamId);
        result[slot.matchId] = team.teamId;
        if (dfs(slotIndex + 1)) return true;
        visited.delete(team.teamId); // Backtrack
        delete result[slot.matchId];
      }
    }
    return false;
  }

  const success = dfs(0);
  if (success) return result;

  // Bipartite eşleşme bulunamazsa yedek (greedy/fallback) mekanizması
  const fallbackResult: ThirdPlaceAssignment = {};
  const fallbackVisited = new Set<string>();

  for (const slot of THIRD_PLACE_SLOTS) {
    let found = false;
    for (const team of selected) {
      if (!fallbackVisited.has(team.teamId) && slot.allowed.includes(team.groupId)) {
        fallbackVisited.add(team.teamId);
        fallbackResult[slot.matchId] = team.teamId;
        found = true;
        break;
      }
    }
    if (!found) {
      for (const team of selected) {
        if (!fallbackVisited.has(team.teamId)) {
          fallbackVisited.add(team.teamId);
          fallbackResult[slot.matchId] = team.teamId;
          break;
        }
      }
    }
  }
  return fallbackResult;
}

// --- MAÇ EŞLEŞME YAPISI VE TUR TANIMLARI ---
interface KnockoutMatch {
  id: number;
  homeSource: { type: 'group' | 'match'; value: string | number; isLoser?: boolean };
  awaySource: { type: 'group' | 'match'; value: string | number; isLoser?: boolean };
  homeLabel: string;
  awayLabel: string;
  nextMatchId: number;
  isHomeInNext: boolean;
  round: 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL' | 'THIRD';
}

const KNOCKOUT_MATCHES_CONFIG: KnockoutMatch[] = [
  // --- ROUND OF 32 (Maç 73 - 88) ---
  { id: 73, homeSource: { type: 'group', value: 'A2' }, awaySource: { type: 'group', value: 'B2' }, homeLabel: 'A Grubu 2.si', awayLabel: 'B Grubu 2.si', nextMatchId: 90, isHomeInNext: true, round: 'R32' },
  { id: 74, homeSource: { type: 'group', value: 'E1' }, awaySource: { type: 'group', value: 'T74' }, homeLabel: 'E Grubu 1.si', awayLabel: 'En İyi 3. (A/B/C/D/F)', nextMatchId: 89, isHomeInNext: true, round: 'R32' },
  { id: 75, homeSource: { type: 'group', value: 'F1' }, awaySource: { type: 'group', value: 'C2' }, homeLabel: 'F Grubu 1.si', awayLabel: 'C Grubu 2.si', nextMatchId: 90, isHomeInNext: false, round: 'R32' },
  { id: 76, homeSource: { type: 'group', value: 'C1' }, awaySource: { type: 'group', value: 'F2' }, homeLabel: 'C Grubu 1.si', awayLabel: 'F Grubu 2.si', nextMatchId: 91, isHomeInNext: true, round: 'R32' },
  { id: 77, homeSource: { type: 'group', value: 'I1' }, awaySource: { type: 'group', value: 'T77' }, homeLabel: 'I Grubu 1.si', awayLabel: 'En İyi 3. (C/D/F/G/H)', nextMatchId: 89, isHomeInNext: false, round: 'R32' },
  { id: 78, homeSource: { type: 'group', value: 'E2' }, awaySource: { type: 'group', value: 'I2' }, homeLabel: 'E Grubu 2.si', awayLabel: 'I Grubu 2.si', nextMatchId: 91, isHomeInNext: false, round: 'R32' },
  { id: 79, homeSource: { type: 'group', value: 'A1' }, awaySource: { type: 'group', value: 'T79' }, homeLabel: 'A Grubu 1.si', awayLabel: 'En İyi 3. (C/E/F/H/I)', nextMatchId: 92, isHomeInNext: true, round: 'R32' },
  { id: 80, homeSource: { type: 'group', value: 'L1' }, awaySource: { type: 'group', value: 'T80' }, homeLabel: 'L Grubu 1.si', awayLabel: 'En İyi 3. (E/H/I/J/K)', nextMatchId: 92, isHomeInNext: false, round: 'R32' },
  { id: 81, homeSource: { type: 'group', value: 'D1' }, awaySource: { type: 'group', value: 'T81' }, homeLabel: 'D Grubu 1.si', awayLabel: 'En İyi 3. (B/E/F/I/J)', nextMatchId: 94, isHomeInNext: true, round: 'R32' },
  { id: 82, homeSource: { type: 'group', value: 'G1' }, awaySource: { type: 'group', value: 'T82' }, homeLabel: 'G Grubu 1.si', awayLabel: 'En İyi 3. (A/E/H/I/J)', nextMatchId: 94, isHomeInNext: false, round: 'R32' },
  { id: 83, homeSource: { type: 'group', value: 'K2' }, awaySource: { type: 'group', value: 'L2' }, homeLabel: 'K Grubu 2.si', awayLabel: 'L Grubu 2.si', nextMatchId: 93, isHomeInNext: true, round: 'R32' },
  { id: 84, homeSource: { type: 'group', value: 'H1' }, awaySource: { type: 'group', value: 'J2' }, homeLabel: 'H Grubu 1.si', awayLabel: 'J Grubu 2.si', nextMatchId: 93, isHomeInNext: false, round: 'R32' },
  { id: 85, homeSource: { type: 'group', value: 'B1' }, awaySource: { type: 'group', value: 'T85' }, homeLabel: 'B Grubu 1.si', awayLabel: 'En İyi 3. (E/F/G/I/J)', nextMatchId: 96, isHomeInNext: true, round: 'R32' },
  { id: 86, homeSource: { type: 'group', value: 'J1' }, awaySource: { type: 'group', value: 'H2' }, homeLabel: 'J Grubu 1.si', awayLabel: 'H Grubu 2.si', nextMatchId: 95, isHomeInNext: true, round: 'R32' },
  { id: 87, homeSource: { type: 'group', value: 'K1' }, awaySource: { type: 'group', value: 'T87' }, homeLabel: 'K Grubu 1.si', awayLabel: 'En İyi 3. (D/E/I/J/L)', nextMatchId: 96, isHomeInNext: false, round: 'R32' },
  { id: 88, homeSource: { type: 'group', value: 'D2' }, awaySource: { type: 'group', value: 'G2' }, homeLabel: 'D Grubu 2.si', awayLabel: 'G Grubu 2.si', nextMatchId: 95, isHomeInNext: false, round: 'R32' },

  // --- ROUND OF 16 (Maç 89 - 96) ---
  { id: 89, homeSource: { type: 'match', value: 74 }, awaySource: { type: 'match', value: 77 }, homeLabel: 'Maç 74 Galibi', awayLabel: 'Maç 77 Galibi', nextMatchId: 97, isHomeInNext: true, round: 'R16' },
  { id: 90, homeSource: { type: 'match', value: 73 }, awaySource: { type: 'match', value: 75 }, homeLabel: 'Maç 73 Galibi', awayLabel: 'Maç 75 Galibi', nextMatchId: 97, isHomeInNext: false, round: 'R16' },
  { id: 91, homeSource: { type: 'match', value: 76 }, awaySource: { type: 'match', value: 78 }, homeLabel: 'Maç 76 Galibi', awayLabel: 'Maç 78 Galibi', nextMatchId: 99, isHomeInNext: true, round: 'R16' },
  { id: 92, homeSource: { type: 'match', value: 79 }, awaySource: { type: 'match', value: 80 }, homeLabel: 'Maç 79 Galibi', awayLabel: 'Maç 80 Galibi', nextMatchId: 99, isHomeInNext: false, round: 'R16' },
  { id: 93, homeSource: { type: 'match', value: 83 }, awaySource: { type: 'match', value: 84 }, homeLabel: 'Maç 83 Galibi', awayLabel: 'Maç 84 Galibi', nextMatchId: 98, isHomeInNext: true, round: 'R16' },
  { id: 94, homeSource: { type: 'match', value: 81 }, awaySource: { type: 'match', value: 82 }, homeLabel: 'Maç 81 Galibi', awayLabel: 'Maç 82 Galibi', nextMatchId: 98, isHomeInNext: false, round: 'R16' },
  { id: 95, homeSource: { type: 'match', value: 86 }, awaySource: { type: 'match', value: 88 }, homeLabel: 'Maç 86 Galibi', awayLabel: 'Maç 88 Galibi', nextMatchId: 100, isHomeInNext: true, round: 'R16' },
  { id: 96, homeSource: { type: 'match', value: 85 }, awaySource: { type: 'match', value: 87 }, homeLabel: 'Maç 85 Galibi', awayLabel: 'Maç 87 Galibi', nextMatchId: 100, isHomeInNext: false, round: 'R16' },

  // --- QUARTER-FINALS (Maç 97 - 100) ---
  { id: 97, homeSource: { type: 'match', value: 89 }, awaySource: { type: 'match', value: 90 }, homeLabel: 'Maç 89 Galibi', awayLabel: 'Maç 90 Galibi', nextMatchId: 101, isHomeInNext: true, round: 'QF' },
  { id: 98, homeSource: { type: 'match', value: 93 }, awaySource: { type: 'match', value: 94 }, homeLabel: 'Maç 93 Galibi', awayLabel: 'Maç 94 Galibi', nextMatchId: 101, isHomeInNext: false, round: 'QF' },
  { id: 99, homeSource: { type: 'match', value: 91 }, awaySource: { type: 'match', value: 92 }, homeLabel: 'Maç 91 Galibi', awayLabel: 'Maç 92 Galibi', nextMatchId: 102, isHomeInNext: true, round: 'QF' },
  { id: 100, homeSource: { type: 'match', value: 95 }, awaySource: { type: 'match', value: 96 }, homeLabel: 'Maç 95 Galibi', awayLabel: 'Maç 96 Galibi', nextMatchId: 102, isHomeInNext: false, round: 'QF' },

  // --- SEMI-FINALS (Maç 101 - 102) ---
  { id: 101, homeSource: { type: 'match', value: 97 }, awaySource: { type: 'match', value: 98 }, homeLabel: 'Maç 97 Galibi', awayLabel: 'Maç 98 Galibi', nextMatchId: 104, isHomeInNext: true, round: 'SF' },
  { id: 102, homeSource: { type: 'match', value: 99 }, awaySource: { type: 'match', value: 100 }, homeLabel: 'Maç 99 Galibi', awayLabel: 'Maç 100 Galibi', nextMatchId: 104, isHomeInNext: false, round: 'SF' },

  // --- FINALS (Maç 103 ve 104) ---
  { id: 103, homeSource: { type: 'match', value: 101, isLoser: true }, awaySource: { type: 'match', value: 102, isLoser: true }, homeLabel: 'Yarı Final 1 Mağlubu', awayLabel: 'Yarı Final 2 Mağlubu', nextMatchId: 0, isHomeInNext: false, round: 'THIRD' },
  { id: 104, homeSource: { type: 'match', value: 101 }, awaySource: { type: 'match', value: 102 }, homeLabel: 'Yarı Final 1 Galibi', awayLabel: 'Yarı Final 2 Galibi', nextMatchId: 0, isHomeInNext: false, round: 'FINAL' }
];

export default function RedesignedPredictionWizard() {
  // --- DURUM YÖNETİMİ ---
  const [appState, setAppState] = useState<AppState>('LANDING');
  
  // Üyelik ve Davet Kodları
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isWatermarkRemoved, setIsWatermarkRemoved] = useState<boolean>(false);
  const [shareCardImage, setShareCardImage] = useState<string>('');
  const [rewardedAdPurpose, setRewardedAdPurpose] = useState<'AI_INSIGHT' | 'REMOVE_WATERMARK'>('AI_INSIGHT');
  
  // B2B Kadro Yönetimi State'leri
  const [squadName, setSquadName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [userSquad, setUserSquad] = useState<any>(null);
  const [squadMembers, setSquadMembers] = useState<any[]>([]);
  const [currentSquadId, setCurrentSquadId] = useState<string>('');
  const [showCreateSquad, setShowCreateSquad] = useState<boolean>(false);

  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userUid, setUserUid] = useState<string>('');
  const [isPredictionsLocked, setIsPredictionsLocked] = useState<boolean>(false);

  // Liderlik ve Read-Only Görüntüleme
  const [globalPlayers, setGlobalPlayers] = useState<any[]>([]);
  const [globalSquads, setGlobalSquads] = useState<any[]>([]);
  const [selectedReadOnlyUid, setSelectedReadOnlyUid] = useState<string | null>(null);
  const [readOnlyPredictions, setReadOnlyPredictions] = useState<any>(null);
  const [readOnlyLoading, setReadOnlyLoading] = useState<boolean>(false);

  // Grup Sihirbazı İndeksi (0 - 11)
  const [currentGroupIndex, setCurrentGroupIndex] = useState<number>(0);

  // Eleme Sihirbazı Maç İndeksi (0 - 31)
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // --- TAHMİN VERİLERİ (GRUP AŞAMASI) ---
  const [groupPredictions, setGroupPredictions] = useState<{
    [groupId: string]: { first: string; second: string; third: string };
  }>({});

  // Seçilen 8 en iyi 3.
  const [selectedThirdPlaceUids, setSelectedThirdPlaceUids] = useState<string[]>([]);

  // --- ELEME TAHMİNLERİ (KNOCKOUT BRACKET) ---
  const [knockoutPredictions, setKnockoutPredictions] = useState<{ [matchId: number]: string }>({});

  // --- REKLAM VE MONETIZATION ---
  const [rewardedAdOpen, setRewardedAdOpen] = useState<boolean>(false);
  const [rewardedCountdown, setRewardedCountdown] = useState<number>(15);
  const [interstitialAdOpen, setInterstitialAdOpen] = useState<boolean>(false);
  const [interstitialCountdown, setInterstitialCountdown] = useState<number>(5);
  const [adRewardTeamId, setAdRewardTeamId] = useState<string | null>(null);

  // AI Analizi
  const [aiInsightOpen, setAiInsightOpen] = useState<boolean>(false);
  const [aiInsightText, setAiInsightText] = useState<string>('');
  const [insightLoading, setInsightLoading] = useState<boolean>(false);

  // Paylaşım Modal
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // --- GOOGLE/APPLE GİRİŞ ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsUserLoggedIn(true);
        setUserName(user.displayName || 'Kullanıcı');
        setUserEmail(user.email || '');
        setUserUid(user.uid);

        // Firestore'dan kullanıcının önceki tahminlerini yükleme
        getUserPredictions(user.uid).then((data) => {
          if (data) {
            if (data.groupStageData) {
              const restoredGroups: { [groupId: string]: { first: string; second: string; third: string } } = {};
              if (data.groupStageData.groups) {
                Object.keys(data.groupStageData.groups).forEach((groupId) => {
                  const gPred = data.groupStageData.groups[groupId];
                  restoredGroups[groupId] = {
                    first: gPred.top2?.[0] || '',
                    second: gPred.top2?.[1] || '',
                    third: gPred.thirdPlaceId || ''
                  };
                });
                setGroupPredictions(restoredGroups);
              }
              if (data.groupStageData.bestThirdPlaceUids) {
                setSelectedThirdPlaceUids(data.groupStageData.bestThirdPlaceUids);
              }
            }

            if (data.knockoutTreeData && data.knockoutTreeData.matches) {
              const restoredKnockouts: { [matchId: number]: string } = {};
              Object.keys(data.knockoutTreeData.matches).forEach((matchIdStr) => {
                const matchId = parseInt(matchIdStr);
                const winnerId = data.knockoutTreeData.matches[matchId].predictionUid;
                if (winnerId) restoredKnockouts[matchId] = winnerId;
              });
              setKnockoutPredictions(restoredKnockouts);
            }
          }
        }).catch(err => console.error("Kullanıcı tahmin verisi okuma hatası:", err));
      } else {
        setIsUserLoggedIn(false);
        setUserName('');
        setUserEmail('');
        setUserUid('');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (provider: 'google' | 'apple') => {
    try {
      let loggedInUser = null;
      if (provider === 'google') {
        loggedInUser = await signInWithGoogle();
      } else {
        loggedInUser = await signInWithApple();
      }

      if (loggedInUser && inviteCode) {
        joinSquadWithTransaction(loggedInUser.uid, 'comp_dummy', inviteCode).then((res) => {
          if (res.success) {
            setCurrentSquadId(inviteCode);
            getSquadDetails(inviteCode).then((details) => {
              if (details.squad) {
                setUserSquad(details.squad);
                setSquadMembers(details.members);
              }
            });
          } else {
            alert(res.message);
          }
        }).catch(err => console.error("Kadro katılım hatası:", err));
      }

      // Eğer zorunlu kayıt ekranındaysak kayıt bittikten sonra elemelere geçiş yap
      if (appState === 'SIGNUP_FORCE') {
        alert('Kaydınız başarıyla oluşturuldu! Grup tahminleriniz kaydedildi. Eleme turlarına geçebilirsiniz.');
        setAppState('KNOCKOUTS');
        setCurrentMatchIndex(0);
      }
    } catch (error) {
      alert("Giriş başarısız oldu: " + error);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await logOut();
      setAppState('LANDING');
      setGroupPredictions({});
      setSelectedThirdPlaceUids([]);
      setKnockoutPredictions({});
      setUserSquad(null);
      setSquadMembers([]);
      setCurrentSquadId('');
    } catch (error) {
      console.error(error);
    }
  };

  // --- GRUP SEÇİMLERİ ---
  const handleTeamClick = (groupId: string, teamId: string) => {
    if (isPredictionsLocked) return;

    const current = groupPredictions[groupId] || { first: '', second: '', third: '' };
    let next = { ...current };

    if (current.first === teamId) {
      next.first = '';
      if (!current.second) next.second = teamId;
    } else if (current.second === teamId) {
      next.second = '';
      if (!current.third) next.third = teamId;
    } else if (current.third === teamId) {
      next.third = '';
    } else {
      if (!next.first) {
        next.first = teamId;
      } else if (!next.second) {
        next.second = teamId;
      } else if (!next.third) {
        next.third = teamId;
      } else {
        next.third = next.second;
        next.second = next.first;
        next.first = teamId;
      }
    }

    setGroupPredictions({
      ...groupPredictions,
      [groupId]: next,
    });

    if (selectedThirdPlaceUids.includes(teamId)) {
      setSelectedThirdPlaceUids(selectedThirdPlaceUids.filter((id) => id !== teamId));
    }
  };

  // --- SIRADAKİ GRUBA GEÇİŞ (ADIM ADIM) ---
  const handleNextGroup = () => {
    const activeGroup = groupsData[currentGroupIndex];
    const pred = groupPredictions[activeGroup.id];

    if (!pred || !pred.first || !pred.second) {
      alert('Lütfen bu gruptan çıkacak ilk 2 takımı belirleyin!');
      return;
    }

    if (currentGroupIndex < 11) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else {
      // Bütün gruplar tamamlandıysa En İyi 3.ler Ekranına Geç
      setAppState('THIRDS');
    }
  };

  const handlePrevGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
    } else {
      setAppState('LANDING');
    }
  };

  // --- EN İYİ 3.LER SEÇİMİ ---
  const handleThirdPlaceSelect = (teamId: string) => {
    if (isPredictionsLocked) return;

    if (selectedThirdPlaceUids.includes(teamId)) {
      setSelectedThirdPlaceUids(selectedThirdPlaceUids.filter((id) => id !== teamId));
    } else {
      if (selectedThirdPlaceUids.length >= 8) {
        alert('En fazla 8 adet en iyi 3. takım seçebilirsiniz!');
        return;
      }
      setSelectedThirdPlaceUids([...selectedThirdPlaceUids, teamId]);
    }
  };

  // --- GRUPLARDAN ELEMEYE GEÇİŞ (ZORUNLU KAYIT KONTROLÜ VE INTERSTITIAL REKLAM) ---
  const handleTransitionToKnockouts = () => {
    if (selectedThirdPlaceUids.length !== 8) {
      alert(`Lütfen eleme aşamasına geçmeden önce tam olarak 8 adet en iyi 3. takım seçiniz! (Şu an: ${selectedThirdPlaceUids.length}/8)`);
      return;
    }

    if (!isUserLoggedIn) {
      // Kayıt yapılmadıysa Zorunlu Kayıt ekranına yönlendir
      setAppState('SIGNUP_FORCE');
    } else {
      // Giriş yapılmışsa Interstitial Reklamı göster ve geç
      setInterstitialCountdown(5);
      setInterstitialAdOpen(true);
    }
  };

  // Interstitial Reklam Sayacı
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (interstitialAdOpen && interstitialCountdown > 0) {
      timer = setTimeout(() => setInterstitialCountdown(interstitialCountdown - 1), 1000);
    } else if (interstitialAdOpen && interstitialCountdown === 0) {
      setInterstitialAdOpen(false);
      setAppState('KNOCKOUTS');
      setCurrentMatchIndex(0);
    }
    return () => clearTimeout(timer);
  }, [interstitialAdOpen, interstitialCountdown]);

  // --- DİNAMİK ELEME KADROLARINI HESAPLAMA ---
  const activeThirdPlaceMap = selectedThirdPlaceUids.map((id) => {
    const group = groupsData.find((g) => g.teams.some((t) => t.id === id));
    return { groupId: group?.id || '', teamId: id };
  });

  const matchedThirdPlaces = matchThirdPlaceTeams(activeThirdPlaceMap);

  const getMatchTeams = (
    match: KnockoutMatch
  ): { home: Team | null; away: Team | null } => {
    let home: Team | null = null;
    let away: Team | null = null;

    // Ev Sahibini Çöz
    if (match.homeSource.type === 'group') {
      const val = match.homeSource.value as string;
      const groupLetter = val[0];
      const rank = val[1];
      const pred = groupPredictions[groupLetter];
      if (pred) {
        const teamId = rank === '1' ? pred.first : pred.second;
        home = getTeamById(teamId) || null;
      }
    } else {
      const prevMatchId = match.homeSource.value as number;
      const winnerId = knockoutPredictions[prevMatchId];
      if (winnerId) {
        if (match.homeSource.isLoser) {
          const prevMatchConfig = KNOCKOUT_MATCHES_CONFIG.find(m => m.id === prevMatchId);
          if (prevMatchConfig) {
            const prevTeams = getMatchTeams(prevMatchConfig);
            const loserId = prevTeams.home?.id === winnerId ? prevTeams.away?.id : prevTeams.home?.id;
            home = loserId ? getTeamById(loserId) || null : null;
          }
        } else {
          home = getTeamById(winnerId) || null;
        }
      } else {
        home = null;
      }
    }

    // Deplasmanı Çöz
    if (match.awaySource.type === 'group') {
      const val = match.awaySource.value as string;
      if (val.startsWith('T')) {
        const matchId = parseInt(val.slice(1));
        const teamId = matchedThirdPlaces[matchId];
        away = teamId ? getTeamById(teamId) || null : null;
      } else {
        const groupLetter = val[0];
        const rank = val[1];
        const pred = groupPredictions[groupLetter];
        if (pred) {
          const teamId = rank === '1' ? pred.first : pred.second;
          away = teamId ? getTeamById(teamId) || null : null;
        }
      }
    } else {
      const prevMatchId = match.awaySource.value as number;
      const winnerId = knockoutPredictions[prevMatchId];
      if (winnerId) {
        if (match.awaySource.isLoser) {
          const prevMatchConfig = KNOCKOUT_MATCHES_CONFIG.find(m => m.id === prevMatchId);
          if (prevMatchConfig) {
            const prevTeams = getMatchTeams(prevMatchConfig);
            const loserId = prevTeams.home?.id === winnerId ? prevTeams.away?.id : prevTeams.home?.id;
            away = loserId ? getTeamById(loserId) || null : null;
          }
        } else {
          away = getTeamById(winnerId) || null;
        }
      } else {
        away = null;
      }
    }

    return { home, away };
  };

  // Eleme maçı kazananını kaydetme & Otomatik Sonraki Maça Geçiş
  const handleSelectWinner = (matchId: number, winnerTeamId: string) => {
    if (isPredictionsLocked) return;

    const updated = { ...knockoutPredictions, [matchId]: winnerTeamId };

    // Cascade Reset
    const resetChildPredictions = (mId: number) => {
      const children = KNOCKOUT_MATCHES_CONFIG.filter(
        (m) => m.homeSource.value === mId || m.awaySource.value === mId
      );
      children.forEach((child) => {
        if (updated[child.id]) {
          delete updated[child.id];
          resetChildPredictions(child.id);
        }
      });
    };

    resetChildPredictions(matchId);
    setKnockoutPredictions(updated);

    // Otomatik olarak sonraki maça geçme animasyonu (300ms gecikme ile akıcılık)
    if (currentMatchIndex < 31) {
      setTimeout(() => {
        setCurrentMatchIndex((prev) => prev + 1);
      }, 350);
    } else {
      // Büyük final tamamlandıysa özet ekranına git
      setTimeout(() => {
        setAppState('SUMMARY');
      }, 400);
    }
  };

  // --- REWARDED AD ANALİZ KİLİDİ VE FİLİGRAN ---
  const triggerAiInsight = (team: Team) => {
    setAdRewardTeamId(team.id);
    setRewardedAdPurpose('AI_INSIGHT');
    setRewardedCountdown(15);
    setRewardedAdOpen(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (rewardedAdOpen && rewardedCountdown > 0) {
      timer = setTimeout(() => setRewardedCountdown(rewardedCountdown - 1), 1000);
    } else if (rewardedAdOpen && rewardedCountdown === 0) {
      setRewardedAdOpen(false);
      if (rewardedAdPurpose === 'AI_INSIGHT' && adRewardTeamId) {
        const team = getTeamById(adRewardTeamId);
        if (team) showAiInsight(team);
      } else if (rewardedAdPurpose === 'REMOVE_WATERMARK') {
        setIsWatermarkRemoved(true);
        alert('Tebrikler! Ödüllü reklamı başarıyla izlediniz. Paylaşım kartınızdaki filigran kaldırıldı!');
      }
    }
    return () => clearTimeout(timer);
  }, [rewardedAdOpen, rewardedCountdown, rewardedAdPurpose, adRewardTeamId]);

  const showAiInsight = (team: Team) => {
    setInsightLoading(true);
    setAiInsightOpen(true);

    const group = groupsData.find((g) => g.teams.some((t) => t.id === team.id));
    const groupLetter = group?.id || 'A';

    fetchTeamAiAnalysis(team.id, team.name, team.probability, groupLetter)
      .then((text) => {
        setAiInsightText(text);
        setInsightLoading(false);
      })
      .catch((err) => {
        console.error("AI Analiz yükleme hatası:", err);
        setAiInsightText("Analiz yüklenirken hata oluştu.");
        setInsightLoading(false);
      });
  };

  const getChampion = (): Team | null => {
    const championId = knockoutPredictions[104];
    return championId ? getTeamById(championId) || null : null;
  };

  const getThirdPlace = (): Team | null => {
    const thirdId = knockoutPredictions[103];
    return thirdId ? getTeamById(thirdId) || null : null;
  };

  const handleLockPredictions = () => {
    const dummyUid = isUserLoggedIn ? (userName.includes('Google') ? 'dummy_google_123' : 'dummy_apple_123') : 'guest_user';
    
    // Firestore şemasına uygun veri kümesini derleme
    const dbGroupData: any = {
      groups: {},
      bestThirdPlaceUids: selectedThirdPlaceUids
    };
    groupsData.forEach((g) => {
      const pred = groupPredictions[g.id] || { first: '', second: '', third: '' };
      dbGroupData.groups[g.id] = {
        top2: [pred.first, pred.second].filter(Boolean),
        thirdPlaceId: pred.third || null
      };
    });

    const dbKnockoutData: any = {
      matches: {}
    };
    KNOCKOUT_MATCHES_CONFIG.forEach((match) => {
      const { home, away } = getMatchTeams(match);
      dbKnockoutData.matches[match.id] = {
        matchId: match.id,
        homeTeamId: home?.id || null,
        awayTeamId: away?.id || null,
        predictionUid: knockoutPredictions[match.id] || null
      };
    });

    saveUserPredictions(dummyUid, dbGroupData, dbKnockoutData).then(() => {
      setIsPredictionsLocked(true);
      alert('Tebrikler! 2026 Dünya Kupası tahminleriniz kilitlendi. Sosyal liglerde sıralamanızı takip edebilirsiniz.');
      setAppState('SUMMARY');
    }).catch(err => {
      console.error("Firestore tahmin kaydetme hatası:", err);
      // Hata olsa dahi kullanıcı arayüzünü kilitle, veriler dbServices içinde localStorage'a yedeklendi
      setIsPredictionsLocked(true);
      alert('Tahminleriniz çevrimdışı yerel hafızaya yedeklendi. İnternet bağlantısı sağlandığında otomatik senkronize edilecektir.');
      setAppState('SUMMARY');
    });
  };

  // --- B2B VE PAYLAŞIM EK YARDIMCILARI ---
  const [squadInput, setSquadInput] = useState<string>('');
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newSquadName, setNewSquadName] = useState<string>('');
  const [squadJoinLoading, setSquadJoinLoading] = useState<boolean>(false);

  // Paylaşım görseli tetikleyicisi
  useEffect(() => {
    if (showShareModal) {
      const champ = getChampion();
      const third = getThirdPlace();
      if (champ && third) {
        generateBracketCard({
          userName: userName || 'Konuk Tahminci',
          squadName: userSquad?.name || 'Kadro Dışı',
          championName: champ.name,
          championFlag: champ.flag,
          championProb: champ.probability,
          thirdName: third.name,
          thirdFlag: third.flag,
          isWatermarkRemoved: isWatermarkRemoved
        }).then((imgUrl) => {
          setShareCardImage(imgUrl);
        }).catch((err) => {
          console.error("Canvas paylaşım kartı çizim hatası:", err);
        });
      }
    }
  }, [showShareModal, isWatermarkRemoved, userSquad, userName]);

  const handleOpenLeaderboards = async () => {
    setAppState('LEADERBOARDS');
    try {
      const players = await fetchGlobalLeaderboard(50);
      const squads = await fetchGlobalSquadLeaderboard(50);
      setGlobalPlayers(players);
      setGlobalSquads(squads);
    } catch (e) {
      console.error("Liderlik tabloları yüklenemedi:", e);
    }
  };

  const handleViewUserPredictions = async (uid: string) => {
    setSelectedReadOnlyUid(uid);
    setReadOnlyLoading(true);
    try {
      const preds = await getUserPredictions(uid);
      setReadOnlyPredictions(preds);
    } catch (e) {
      console.error("Kullanıcı tahminleri yüklenemedi:", e);
    } finally {
      setReadOnlyLoading(false);
    }
  };

  const handleJoinSquad = async () => {
    if (!squadInput.trim()) {
      alert("Lütfen davet kodunu girin.");
      return;
    }
    setSquadJoinLoading(true);
    const dummyUid = isUserLoggedIn ? (userName.includes('Google') ? 'dummy_google_123' : 'dummy_apple_123') : 'guest_user';
    try {
      const res = await joinSquadWithTransaction(dummyUid, 'comp_dummy', squadInput.toUpperCase().trim());
      alert(res.message);
      if (res.success) {
        setCurrentSquadId(squadInput.toUpperCase().trim());
        const details = await getSquadDetails(squadInput.toUpperCase().trim());
        if (details.squad) {
          setUserSquad(details.squad);
          setSquadMembers(details.members);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Kadroya katılım hatası.");
    } finally {
      setSquadJoinLoading(false);
    }
  };

  const handleCreateSquad = async () => {
    if (!newCompanyName.trim() || !newSquadName.trim()) {
      alert("Lütfen şirket adı ve kadro adını girin.");
      return;
    }
    const dummyUid = isUserLoggedIn ? (userName.includes('Google') ? 'dummy_google_123' : 'dummy_apple_123') : 'guest_user';
    try {
      const res = await createSquad(dummyUid, newCompanyName.trim(), newSquadName.trim());
      alert(res.message);
      if (res.success) {
        setCurrentSquadId(res.squadId);
        const details = await getSquadDetails(res.squadId);
        if (details.squad) {
          setUserSquad(details.squad);
          setSquadMembers(details.members);
        }
        setShowCreateSquad(false);
      }
    } catch (err) {
      console.error(err);
      alert("Kadro oluşturulamadı.");
    }
  };

  const downloadImage = () => {
    if (!shareCardImage) return;
    const link = document.createElement('a');
    link.download = `cupsyndicate_${userName || 'bracket'}.png`;
    link.href = shareCardImage;
    link.click();
  };

  // Maç Kartı Detayları
  const activeMatchConfig = KNOCKOUT_MATCHES_CONFIG[currentMatchIndex];
  const { home: activeHome, away: activeAway } = activeMatchConfig ? getMatchTeams(activeMatchConfig) : { home: null, away: null };
  const activeWinnerId = activeMatchConfig ? knockoutPredictions[activeMatchConfig.id] : '';

  const getRoundLabel = (round: string, matchId: number) => {
    switch (round) {
      case 'R32': return `Son 32 Turu • Maç ${matchId}`;
      case 'R16': return `Son 16 Turu • Maç ${matchId}`;
      case 'QF': return `Çeyrek Final • Maç ${matchId}`;
      case 'SF': return `Yarı Final • Maç ${matchId}`;
      case 'THIRD': return `🥉 Üçüncülük Maçı`;
      case 'FINAL': return `🏆 BÜYÜK FİNAL`;
      default: return `Maç ${matchId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-slate-100 font-sans pb-16 selection:bg-violet-600 selection:text-white">
      {/* HEADER BANNER */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-4 py-3 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                CupSyndicate
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">WORLD CUP 2026 PREDICTOR</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow-md flex items-center gap-1">
              ⚡ Canlı Simülasyon
            </span>

            {isUserLoggedIn && (
              <button
                onClick={handleLogoutClick}
                className="bg-rose-950/60 border border-rose-800/40 text-rose-300 px-3 py-1.5 rounded-md text-xs hover:bg-rose-900/60 transition"
              >
                Çıkış
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ANA WIZARD ALANI */}
      <main className="max-w-xl mx-auto px-4 mt-12 relative">
        <AnimatePresence mode="wait">

        {/* 1. LANDING STAGE (AÇILIŞ GİRİŞ EKRANI) */}
        {appState === 'LANDING' && (
          <motion.div 
            key="landing"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-card rounded-3xl p-8 shadow-glow-violet border border-white/10 text-center space-y-6 max-w-md mx-auto"
          >
            <div className="space-y-2 flex flex-col items-center">
              <Globe2 className="w-16 h-16 text-violet-400 animate-pulse drop-shadow-[0_0_15px_rgba(124,58,237,0.4)]" />
              <h2 className="text-3xl font-black tracking-tight text-white font-display bg-gradient-to-r from-violet-300 via-pink-300 to-amber-200 bg-clip-text text-transparent glow-text-violet">
                CupSyndicate
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Dünya Kupası 2026 turnuva ağacını grup aşamasından başlayarak tahmin et, rekabetçi PvP liglerinde zirveye oyna!
              </p>
            </div>

            {/* DAVET KODU ALANI */}
            <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl space-y-2">
              <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider text-left">
                Varsa Kadro Davet Kodunuz
              </label>
              <input
                type="text"
                placeholder="Örn: TRY-5A2"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-center tracking-widest text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setAppState('GROUPS')}
                className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-900/20 hover:shadow-violet-900/30 hover:scale-[1.01] transition-all text-xs tracking-wider uppercase font-display"
              >
                Tahmin Yapmaya Başla 🚀 (Üye Olmadan)
              </button>

              <div className="flex items-center gap-3 my-2">
                <hr className="flex-1 border-white/5" />
                <span className="text-[9px] text-slate-500 font-bold tracking-wider">VEYA</span>
                <hr className="flex-1 border-white/5" />
              </div>

              {isUserLoggedIn ? (
                <button
                  onClick={() => setAppState('PROFILE')}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:scale-[1.01] transition-all text-xs tracking-wider uppercase font-display"
                >
                  Profilime Git 🧑‍💻
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleLogin('google')}
                    className="bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-white/15 hover:scale-[1.01] transition"
                  >
                    🌐 Google Giriş
                  </button>
                  <button
                    onClick={() => handleLogin('apple')}
                    className="bg-black/40 border border-white/10 hover:bg-black/60 text-white py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:scale-[1.01] transition"
                  >
                     Apple Giriş
                  </button>
                </div>
              )}
            </div>

            {inviteCode && (
              <p className="text-[10px] text-violet-400 font-medium">
                ✨ Davet kodu girildi: <strong className="text-white">{inviteCode}</strong>. Kayıt olduktan sonra otomatik olarak bu kadroya ekleneceksiniz.
              </p>
            )}
          </motion.div>
        )}

        {/* 2. GROUPS STAGE (ADIM ADIM GRUP SEÇİMLERİ) */}
        {appState === 'GROUPS' && (
          <motion.div 
            key={`group-${currentGroupIndex}`}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            {/* PROGRESS BAR */}
            <div className="glass-card border border-white/5 p-4 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-violet-400 font-display uppercase tracking-wider">Grup Aşaması Tahminleri</span>
                <span className="text-slate-400 font-mono">{currentGroupIndex + 1} / 12</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${((currentGroupIndex + 1) / 12) * 100}%` }}
                />
              </div>
            </div>

            {/* GRUP KARTI */}
            {(() => {
              const group = groupsData[currentGroupIndex];
              const pred = groupPredictions[group.id] || { first: '', second: '', third: '' };

              return (
                <div className="glass-card border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-lg font-bold text-white tracking-wide font-display">{group.name} Tahminleri</span>
                    <div className="flex gap-1.5 text-[9px] font-bold">
                      {pred.first && <span className="bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 px-1.5 py-0.5 rounded">🥇 1.</span>}
                      {pred.second && <span className="bg-slate-350/10 text-slate-300 border border-slate-350/30 px-1.5 py-0.5 rounded">🥈 2.</span>}
                      {pred.third && <span className="bg-amber-700/10 text-amber-400 border border-amber-700/30 px-1.5 py-0.5 rounded">🥉 3.</span>}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-450 leading-relaxed">
                    Sırasıyla tıklayarak grubun en iyi iki takımını (🥇1. ve 🥈2.) ve ardından en iyi 3. adayını (🥉3.) seçin.
                  </p>

                  <div className="space-y-2.5">
                    {group.teams.map((team) => {
                      const isFirst = pred.first === team.id;
                      const isSecond = pred.second === team.id;
                      const isThird = pred.third === team.id;

                      let badge = null;
                      if (isFirst) badge = <span className="bg-yellow-500 text-slate-950 font-black px-1.5 py-0.5 rounded text-[10px] shadow-sm">🥇 1</span>;
                      else if (isSecond) badge = <span className="bg-slate-350 text-slate-950 font-black px-1.5 py-0.5 rounded text-[10px] shadow-sm">🥈 2</span>;
                      else if (isThird) badge = <span className="bg-amber-700 text-white font-black px-1.5 py-0.5 rounded text-[10px] shadow-sm">🥉 3</span>;

                      return (
                        <div
                          key={team.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                            isFirst || isSecond
                              ? 'bg-violet-950/20 border-violet-500/60 text-white shadow-glow-violet scale-[1.01]'
                              : isThird
                              ? 'bg-amber-950/20 border-amber-700/50 text-white shadow-glow-amber'
                              : 'glass-card-hover border-white/5 bg-slate-950/20 hover:bg-slate-950/40 text-slate-300'
                          }`}
                          onClick={() => handleTeamClick(group.id, team.id)}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{team.flag}</span>
                            <span className="text-xs font-semibold">{team.name}</span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="text-[9px] text-slate-500 font-mono">
                              Kazanma Oranı: %{team.probability}
                            </span>
                            {badge}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerAiInsight(team);
                              }}
                              className="p-1 px-2 rounded-lg bg-violet-900/40 hover:bg-violet-850 text-violet-300 hover:text-white transition text-[9px] flex items-center gap-1 border border-violet-750/30 font-bold"
                            >
                              ✨ AI Analiz
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* KONTROL BUTONLARI */}
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <button
                      onClick={handlePrevGroup}
                      className="bg-slate-900/60 hover:bg-slate-800 border border-white/5 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs hover:scale-[0.98] transition-all"
                    >
                      ← Geri
                    </button>
                    <button
                      onClick={handleNextGroup}
                      className="bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md hover:scale-[1.02] transition-all font-display"
                    >
                      {currentGroupIndex === 11 ? 'En İyi 3.ler Ekranına Geç →' : 'Sonraki Grup →'}
                    </button>
                  </div>

                </div>
              );
            })()}
          </motion.div>
        )}

        {/* 3. THIRDS STAGE (EN İYİ 3.LER SEÇİMİ) */}
        {appState === 'THIRDS' && (
          <motion.div 
            key="thirds"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-card border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
          >
            <div className="space-y-2 text-center">
              <span className="text-3xl block filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]">🥉</span>
              <h3 className="text-lg font-bold text-white font-display">8 En İyi 3. Takımı Seçin</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Her grubun 3.sü olarak belirlediğiniz 12 aday aşağıda listelenmiştir. Eleme aşamasına çıkacak olan <strong>8 takımı</strong> seçin.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {groupsData.map((g) => {
                const pred = groupPredictions[g.id];
                const thirdId = pred?.third;
                const thirdTeam = thirdId ? getTeamById(thirdId) : null;

                if (!thirdTeam) {
                  return (
                    <div key={g.id} className="bg-slate-950/10 border border-white/5 text-slate-650 rounded-xl p-4 text-center text-xs border-dashed">
                      {g.id} Grubu 3.sü Seçilmemiş
                    </div>
                  );
                }

                const isSelected = selectedThirdPlaceUids.includes(thirdTeam.id);

                return (
                  <button
                    key={g.id}
                    onClick={() => handleThirdPlaceSelect(thirdTeam.id)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all relative flex flex-col justify-between min-h-[90px] ${
                      isSelected
                        ? 'bg-amber-600/20 border-amber-500 text-amber-200 font-semibold shadow-glow-amber scale-[1.01]'
                        : 'glass-card-hover border-white/5 bg-slate-950/20 hover:bg-slate-950/40 text-slate-350'
                    }`}
                  >
                    <div className="absolute top-1.5 right-2 text-[9px] text-slate-500 font-bold">{g.id} Grubu</div>
                    <span className="text-xl mt-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{thirdTeam.flag}</span>
                    <span className="truncate block mt-1.5 font-bold text-slate-200">{thirdTeam.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <button
                onClick={() => {
                  setAppState('GROUPS');
                  setCurrentGroupIndex(11);
                }}
                className="bg-slate-900/60 hover:bg-slate-800 border border-white/5 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs hover:scale-[0.98] transition-all"
              >
                ← Geri
              </button>
              <button
                onClick={handleTransitionToKnockouts}
                className="bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md hover:scale-[1.02] transition-all font-display"
              >
                Kaydet ve Elemelere Geç ({selectedThirdPlaceUids.length}/8) →
              </button>
            </div>
          </motion.div>
        )}

        {/* 4. SIGNUP FORCE STAGE (ZORUNLU KAYIT OLUŞTURMA MODALI) */}
        {appState === 'SIGNUP_FORCE' && (
          <motion.div 
            key="signup_force"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-card border border-white/10 rounded-3xl p-8 shadow-glow-violet shadow-2xl text-center space-y-6 relative overflow-hidden"
          >
            <div className="h-1.5 bg-gradient-to-r from-violet-600 to-pink-500 absolute top-0 left-0 right-0" />
            
            <div className="space-y-3">
              <span className="text-5xl block filter drop-shadow-[0_0_15px_rgba(124,58,237,0.3)]">🔒</span>
              <h3 className="text-xl font-black text-white font-display">Devam Etmek İçin Üye Olun</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Grup tahminleriniz tamamlandı! Liderlik tablosunda yarışmak ve <strong>Eleme Aşamasına (Knockouts)</strong> geçmek için profilinizi oluşturmanız gerekmektedir.
              </p>
            </div>

            <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl space-y-4">
              <div className="text-left border-b border-white/5 pb-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Tahmin Özeti</span>
                <span className="text-xs text-slate-300 font-medium">12 Grup ve 8 En İyi Üçüncü Seçildi.</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleLogin('google')}
                  className="bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-white/15 hover:scale-[1.01] transition"
                >
                  🌐 Google Giriş
                </button>
                <button
                  onClick={() => handleLogin('apple')}
                  className="bg-black/40 border border-white/10 hover:bg-black/60 text-white py-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:scale-[1.01] transition"
                >
                   Apple Giriş
                </button>
              </div>
            </div>

            <button
              onClick={() => setAppState('THIRDS')}
              className="text-[10px] text-slate-400 underline hover:text-slate-200 block mx-auto transition"
            >
              ← Geri Dön ve Tahminleri Düzenle
            </button>
          </motion.div>
        )}

        {/* 5. KNOCKOUTS STAGE (MAÇ MAÇ TAHMİN KARTI AKIŞI) */}
        {appState === 'KNOCKOUTS' && activeMatchConfig && (
          <motion.div 
            key={`knockout-${currentMatchIndex}`}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            {/* MAÇ İLERLEME SAYACI */}
            <div className="glass-card border border-white/5 p-4 rounded-2xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-indigo-400 font-display uppercase tracking-wider">Eleme Tahmin Akışı</span>
                <span className="text-slate-400 font-mono">{currentMatchIndex + 1} / 32 Maç</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 transition-all duration-300"
                  style={{ width: `${((currentMatchIndex + 1) / 32) * 100}%` }}
                />
              </div>
            </div>

            {/* TEK MAÇ KARTI */}
            <div className="glass-card border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
              
              <div className="text-center space-y-1">
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest block font-display">
                  {getRoundLabel(activeMatchConfig.round, activeMatchConfig.id)}
                </span>
                <span className="text-[10px] text-slate-450">Kazanan takımı seçerek bir sonraki adıma ilerleyin.</span>
              </div>

              {/* EV SAHİBİ VE DEPLASMAN SEÇENEKLERİ */}
              <div className="space-y-3">
                {activeHome ? (
                  <button
                    onClick={() => handleSelectWinner(activeMatchConfig.id, activeHome.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 text-left ${
                      activeWinnerId === activeHome.id
                        ? 'bg-indigo-650/20 border-indigo-500 text-white font-bold scale-[1.01] shadow-glow-violet'
                        : 'glass-card-hover border-white/5 bg-slate-950/20 hover:bg-slate-950/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{activeHome.flag}</span>
                      <span className="text-sm font-semibold">{activeHome.name}</span>
                    </div>
                    {activeWinnerId === activeHome.id ? (
                      <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-bold">
                        Seçildi ✓
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-500 font-mono">Kazanma: %{activeHome.probability}</span>
                    )}
                  </button>
                ) : (
                  <div className="w-full flex items-center p-4 rounded-xl border border-dashed border-white/5 bg-slate-950/10 text-slate-500 text-xs italic">
                    ⏳ {activeMatchConfig.homeLabel} bekleniyor...
                  </div>
                )}

                <div className="text-center text-[10px] text-slate-500 font-bold tracking-wider font-display">VS</div>

                {activeAway ? (
                  <button
                    onClick={() => handleSelectWinner(activeMatchConfig.id, activeAway.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 text-left ${
                      activeWinnerId === activeAway.id
                        ? 'bg-indigo-650/20 border-indigo-500 text-white font-bold scale-[1.01] shadow-glow-violet'
                        : 'glass-card-hover border-white/5 bg-slate-950/20 hover:bg-slate-950/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{activeAway.flag}</span>
                      <span className="text-sm font-semibold">{activeAway.name}</span>
                    </div>
                    {activeWinnerId === activeAway.id ? (
                      <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-bold">
                        Seçildi ✓
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-500 font-mono">Kazanma: %{activeAway.probability}</span>
                    )}
                  </button>
                ) : (
                  <div className="w-full flex items-center p-4 rounded-xl border border-dashed border-white/5 bg-slate-950/10 text-slate-500 text-xs italic">
                    ⏳ {activeMatchConfig.awayLabel} bekleniyor...
                  </div>
                )}
              </div>

              {/* GEÇİŞ VE GERİ DÜĞMELERİ */}
              <div className="flex justify-between items-center pt-3 border-t border-white/5">
                <button
                  onClick={() => {
                    if (currentMatchIndex > 0) {
                      setCurrentMatchIndex(currentMatchIndex - 1);
                    } else {
                      setAppState('THIRDS');
                    }
                  }}
                  className="bg-slate-900/60 hover:bg-slate-800 border border-white/5 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs hover:scale-[0.98] transition-all"
                >
                  ← Önceki Maç
                </button>

                <button
                  disabled={!activeWinnerId}
                  onClick={() => {
                    if (currentMatchIndex < 31) {
                      setCurrentMatchIndex(currentMatchIndex + 1);
                    } else {
                      setAppState('SUMMARY');
                    }
                  }}
                  className={`font-bold px-5 py-2.5 rounded-xl text-xs hover:scale-[1.02] transition-all font-display ${
                    activeWinnerId
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow-md'
                      : 'bg-slate-900/60 text-slate-650 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  Sonraki Maç →
                </button>
              </div>

            </div>
          </motion.div>
        )}

        {/* 6. SUMMARY STAGE (ÖZET VE FİNAL KİLİTLEME PAYLAŞIM EKRANI) */}
        {appState === 'SUMMARY' && (
          <motion.div 
            key="summary"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-card border border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-6"
          >
            <div className="space-y-1">
              <Trophy className="w-16 h-16 mx-auto text-yellow-400 drop-shadow-[0_2px_8px_rgba(250,204,21,0.5)]" />
              <h3 className="text-xl font-black text-white font-display">Tebrikler! Tahminleriniz Tamam</h3>
              <p className="text-xs text-slate-400">
                Dünya Kupası 2026 tüm aşamaları başarıyla tamamlandı!
              </p>
            </div>

            {/* ŞAMPİYON VE ÜÇÜNCÜ ÖZETİ */}
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto bg-slate-950/40 border border-white/5 p-4 rounded-2xl">
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">ŞAMPİYON TAHMİNİ</span>
                <div className="mt-1.5 flex flex-col items-center gap-1">
                  <span className="text-4xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">{getChampion()?.flag}</span>
                  <span className="text-xs font-bold text-amber-400">{getChampion()?.name}</span>
                </div>
              </div>

              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">ÜÇÜNCÜ TAHMİNİ</span>
                <div className="mt-1.5 flex flex-col items-center gap-1">
                  <span className="text-4xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">{getThirdPlace()?.flag}</span>
                  <span className="text-xs font-bold text-slate-300">{getThirdPlace()?.name}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenLeaderboards}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-3 rounded-xl shadow-glow-amber transition transform hover:-translate-y-0.5"
            >
              🏆 Global Liderlik Tablolarını Görüntüle
            </button>

            {/* PVP KADRO YÖNETİMİ ALANI */}
            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 text-left space-y-4">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-white/5 pb-2">
                ⚔️ PvP Kadroları ve Klanlar
              </h4>

              {userSquad ? (
                // Kadro Mevcutsa Üyeleri ve Liderlik Tablosunu Göster
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-violet-950/20 border border-violet-900/30 p-3 rounded-xl">
                    <div>
                      <span className="block text-[8px] text-violet-400 font-bold uppercase tracking-wider">AKTİF KADRONUZ</span>
                      <span className="text-xs font-bold text-white">{userSquad.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] text-slate-500 font-bold uppercase">DAVET KODU</span>
                      <span className="text-xs font-mono font-bold text-amber-400">{userSquad.squadId}</span>
                    </div>
                  </div>

                  {/* Kopyalama ve Paylaşma Butonu */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(userSquad.squadId);
                      alert(`Davet kodu kopyalandı: ${userSquad.squadId}. Arkadaşlarınızı kadroya (Maks 20 kişi) davet edebilirsiniz!`);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-white/5 text-slate-350 text-[10px] py-1.5 rounded-lg text-center font-bold transition"
                  >
                    🔗 Davet Kodunu Kopyala (Üye: {squadMembers.length}/20)
                  </button>

                  {/* Kadro Liderlik Sıralaması */}
                  <div className="space-y-1.5 mt-2">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">KADRO SIRALAMASI</span>
                    <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-none">
                      {squadMembers.map((member, index) => (
                        <div key={member.uid} className="flex justify-between items-center p-2 rounded bg-slate-900/40 text-xs border border-white/3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono font-bold">#{index + 1}</span>
                            <span className="font-semibold text-slate-200">{member.username}</span>
                          </div>
                          <span className="font-mono text-violet-450 font-bold">{member.totalPoints} Puan</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Kadro Yoksa Katılma / Oluşturma Seçeneği Sun
                <div className="space-y-3">
                  {!showCreateSquad ? (
                    <>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Arkadaş grubunuzla veya klanınızla 20 kişilik özel liglerde yarışmak için davet kodu girin veya yeni bir kadro kurun.
                      </p>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Davet Kodu Girin"
                          value={squadInput}
                          onChange={(e) => setSquadInput(e.target.value.toUpperCase())}
                          className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-center tracking-wider text-white focus:outline-none focus:border-violet-500"
                        />
                        <button
                          disabled={squadJoinLoading}
                          onClick={handleJoinSquad}
                          className="bg-violet-650 hover:bg-violet-500 text-white text-[11px] font-bold px-4 rounded-xl transition"
                        >
                          Katıl
                        </button>
                      </div>

                      <button
                        onClick={() => setShowCreateSquad(true)}
                        className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] py-2 rounded-xl text-center border border-white/10 font-bold transition"
                      >
                        ➕ Yeni PvP Kadrosu/Klan Oluşturun
                      </button>
                    </>
                  ) : (
                    // Kadro Oluşturma Formu
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[8px] text-slate-400 font-bold uppercase mb-1">Klan Adı</label>
                        <input
                          type="text"
                          placeholder="Örn: Bordo Bereliler"
                          value={newCompanyName}
                          onChange={(e) => setNewCompanyName(e.target.value)}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] text-slate-400 font-bold uppercase mb-1">Takım Adı</label>
                        <input
                          type="text"
                          placeholder="Örn: A Takımı"
                          value={newSquadName}
                          onChange={(e) => setNewSquadName(e.target.value)}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="flex gap-2 pt-1.5">
                        <button
                          onClick={() => setShowCreateSquad(false)}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-350 text-[10px] font-bold py-2 rounded-xl transition"
                        >
                          İptal
                        </button>
                        <button
                          onClick={handleCreateSquad}
                          className="flex-1 bg-violet-650 hover:bg-violet-500 text-white text-[10px] font-bold py-2 rounded-xl transition"
                        >
                          Kadro Kur 🚀
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                disabled={isPredictionsLocked}
                onClick={handleLockPredictions}
                className={`w-full py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 font-display ${
                  isPredictionsLocked
                    ? 'bg-emerald-800/20 border border-emerald-800/30 text-emerald-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                }`}
              >
                🔒 {isPredictionsLocked ? 'Tahminleriniz Kilitlendi' : 'Tahminlerimi Kaydet ve Kilitle'}
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-violet-850/50 hover:border-violet-700/50 text-violet-200 hover:scale-[1.01] py-3.5 rounded-xl text-xs font-bold transition-all font-display shadow-lg shadow-violet-950/20"
              >
                📸 Brackets Kartı Oluştur & Paylaş
              </button>
              <button
                onClick={() => {
                  setAppState('KNOCKOUTS');
                  setCurrentMatchIndex(0);
                }}
                className="text-[10px] text-slate-500 hover:text-slate-400 underline transition"
              >
                Geri Dön ve Elemeleri Düzenle
              </button>
            </div>
          </motion.div>
        )}

        {/* 6. PROFILE STAGE (KULLANICI PROFİLİ VE TAHMİNLER) */}
        {appState === 'PROFILE' && (
          <motion.div 
            key="profile"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-card border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
          >
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-amber-500 flex items-center justify-center text-2xl shadow-lg border-2 border-white/20">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-display tracking-wider">
                  {userName}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{userEmail}</p>
              </div>
            </div>

            <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-medium">Klan / Kadro:</span>
                <span className="text-white font-bold tracking-widest bg-violet-900/30 px-2 py-1 rounded border border-violet-500/20">
                  {userSquad ? userSquad.name : 'Yok'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-medium">Tahmin Durumu:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  {Object.keys(groupPredictions).length > 0 ? <><CheckCircle2 className="w-4 h-4"/> Aktif Tahminler Var</> : 'Henüz Tahmin Yok'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={() => setAppState('GROUPS')}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-900/20 hover:shadow-violet-900/30 hover:scale-[1.01] transition-all text-xs tracking-wider uppercase font-display"
              >
                Grup Tahminlerimi Düzenle 📝
              </button>
              
              {Object.keys(knockoutPredictions).length > 0 && (
                <button
                  onClick={() => setAppState('SUMMARY')}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold py-3.5 rounded-xl transition text-xs shadow-md tracking-wider uppercase font-display"
                >
                  Tahmin Özetimi Görüntüle 🏆
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* 7. LEADERBOARDS STAGE (GLOBAL LİDERLİK) */}
        {appState === 'LEADERBOARDS' && (
          <motion.div 
            key="leaderboards"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-card border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
          >
            <div className="text-center space-y-2">
              <span className="text-4xl block filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">🏆</span>
              <h3 className="text-xl font-black text-white font-display">Global Sıralama</h3>
              <p className="text-xs text-slate-400">PvP Klanları ve Oyuncuların Puan Durumu</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* KADROLAR TABLOSU */}
              <div className="bg-slate-950/40 rounded-2xl border border-white/5 p-4 space-y-4">
                <h4 className="text-sm font-bold text-amber-400 border-b border-white/5 pb-2">⚔️ En İyi Klanlar</h4>
                <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-none pr-1">
                  {globalSquads.length === 0 && <p className="text-xs text-slate-500 text-center">Henüz klan yok.</p>}
                  {globalSquads.map((sq, idx) => (
                    <div key={sq.squadId} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500 font-bold w-4">{idx + 1}.</span>
                        <span className="text-xs font-semibold text-slate-200">{sq.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">{sq.averagePoints || 0} Puan</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* OYUNCULAR TABLOSU */}
              <div className="bg-slate-950/40 rounded-2xl border border-white/5 p-4 space-y-4">
                <h4 className="text-sm font-bold text-violet-400 border-b border-white/5 pb-2">👤 En İyi Oyuncular</h4>
                <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-none pr-1">
                  {globalPlayers.length === 0 && <p className="text-xs text-slate-500 text-center">Henüz oyuncu yok.</p>}
                  {globalPlayers.map((player, idx) => (
                    <button 
                      key={player.uid} 
                      onClick={() => handleViewUserPredictions(player.uid)}
                      className="w-full flex justify-between items-center p-2.5 rounded-xl bg-slate-900/60 border border-white/5 hover:bg-slate-800 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500 font-bold w-4">{idx + 1}.</span>
                        <span className="text-xs font-semibold text-white underline decoration-violet-500/50 underline-offset-2">{player.username}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-violet-400">{player.totalPoints} Puan</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setAppState('SUMMARY')}
              className="w-full bg-slate-900/60 hover:bg-slate-800 border border-white/5 text-slate-300 font-bold px-4 py-3 rounded-xl text-xs transition"
            >
              ← Özete Dön
            </button>
          </motion.div>
        )}

        {/* READ-ONLY TAHMİN MODALI */}
        <AnimatePresence>
          {selectedReadOnlyUid && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
                <button 
                  onClick={() => { setSelectedReadOnlyUid(null); setReadOnlyPredictions(null); }}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700"
                >
                  ✕
                </button>
                <h3 className="text-lg font-bold text-white mb-4">Oyuncu Tahminleri</h3>
                
                {readOnlyLoading ? (
                  <div className="text-center p-10 text-slate-400 text-xs">Tahminler Yükleniyor...</div>
                ) : readOnlyPredictions ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Şampiyon</span>
                        <span className="text-sm font-bold text-amber-400">
                          {getTeamById(readOnlyPredictions?.knockoutTreeData?.matches?.[104]?.predictionUid)?.name || '?'}
                        </span>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Üçüncü</span>
                        <span className="text-sm font-bold text-slate-300">
                          {getTeamById(readOnlyPredictions?.knockoutTreeData?.matches?.[103]?.predictionUid)?.name || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 italic text-center">
                      Not: Diğer tahminler şifrelenmiştir ve rekabet bütünlüğü için gizli tutulmaktadır. (Sadece şampiyonlar gösterilir)
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-10 text-slate-400 text-xs">Tahmin bulunamadı.</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        </AnimatePresence>
      </main>


      {/* REWARDED AD MODAL */}
      {rewardedAdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="h-1.5 bg-violet-600 absolute top-0 left-0 right-0 animate-pulse" />
            
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-violet-900/30 flex items-center justify-between border border-violet-500/20 mx-auto text-xl">
                📺
              </div>
              <h3 className="text-base font-bold text-white">Yapay Zeka Derin Analizi Yükleniyor</h3>
              <p className="text-xs text-slate-400">
                Premium üye olmayan kullanıcılarımız için maç analizi Google Rewarded Reklamları ile finanse edilmektedir. Analizi açmak için videoyu sonuna kadar izleyin.
              </p>
            </div>

            <div className="bg-black/40 border border-slate-950 p-4 rounded-xl space-y-3">
              <div className="h-3.5 bg-slate-900 rounded animate-pulse w-3/4 mx-auto" />
              <div className="h-3.5 bg-slate-900 rounded animate-pulse w-1/2 mx-auto" />
              <div className="text-2xl font-black text-indigo-400 tracking-widest pt-2">
                {rewardedCountdown} saniye kaldı
              </div>
            </div>

            <button
              onClick={() => setRewardedAdOpen(false)}
              className="w-full bg-slate-950 hover:bg-slate-900 text-slate-450 border border-slate-800 py-3 rounded-xl text-xs font-semibold transition"
            >
              Vazgeç / Kapat
            </button>
          </div>
        </div>
      )}

      {/* INTERSTITIAL AD TRANSITION MODAL (SLOT B) */}
      {interstitialAdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-slate-950 border border-slate-900 rounded-2xl max-w-lg w-full p-6 text-center space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <span className="text-[10px] text-slate-500 border border-slate-900 px-1 py-0.5 rounded bg-slate-950 font-bold">
                AD AD MANAGER
              </span>
              <span className="text-xs text-slate-400">
                {interstitialCountdown > 0 ? `${interstitialCountdown} saniye sonra geçilebilir` : 'Reklamı Kapatabilirsiniz'}
              </span>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 p-8 rounded-xl min-h-[250px] flex flex-col justify-center items-center gap-4 text-center">
              <span className="text-4xl text-slate-700 animate-bounce">📱</span>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Google AdSense (Slot B - Interstitial)</p>
                <p className="text-[10px] text-slate-650 mt-1">Grup Aşaması Bitti - Elemeler Yükleniyor</p>
              </div>
              <div className="h-1.5 w-40 bg-slate-950 rounded overflow-hidden">
                <div className="h-full bg-indigo-600 rounded animate-loadingProgress" />
              </div>
            </div>

            <button
              disabled={interstitialCountdown > 0}
              onClick={() => setInterstitialAdOpen(false)}
              className={`w-full py-3 rounded-xl text-xs font-bold transition ${
                interstitialCountdown > 0
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                  : 'bg-white text-slate-950 hover:bg-slate-200'
              }`}
            >
              {interstitialCountdown > 0 ? 'Lütfen Reklamı İzleyin' : 'Reklamı Kapat ve Devam Et 🡒'}
            </button>
          </div>
        </div>
      )}

      {/* GEMINI AI INSIGHT DISPLAY MODAL */}
      {aiInsightOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setAiInsightOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>
            
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="text-xl">✨</span>
              <div>
                <h3 className="text-sm font-bold text-white">Gemini AI Derin Eşleşme Analizi</h3>
                <p className="text-[9px] text-violet-400 font-semibold tracking-wider uppercase">CupSyndicate AI Engine</p>
              </div>
            </div>

            <div className="min-h-[120px] flex items-center">
              {insightLoading ? (
                <div className="w-full text-center space-y-3">
                  <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4 mx-auto" />
                  <div className="h-4 bg-slate-800 rounded animate-pulse w-5/6 mx-auto" />
                  <div className="h-4 bg-slate-800 rounded animate-pulse w-2/3 mx-auto" />
                  <p className="text-[10px] text-slate-500">Akıllı eşleşme verisi analiz ediliyor...</p>
                </div>
              ) : (
                <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-line">
                  {aiInsightText}
                </p>
              )}
            </div>

            <div className="border-t border-slate-850 pt-3 flex items-center justify-between text-[9px] text-slate-500">
              <span>* Analizler olasılık verilerine dayanır.</span>
              <span className="text-violet-400 font-bold">🤖 CUP SYNDICATE AI</span>
            </div>
          </div>
        </div>
      )}

      {/* SHAREABLE CARD MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">📸 CupSyndicate Paylaşım Kartı</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Kapat
              </button>
            </div>

            {/* Canvas İmaj Alanı */}
            <div className="flex flex-col items-center justify-center">
              {shareCardImage ? (
                <div className="relative">
                  <img
                    src={shareCardImage}
                    alt="CupSyndicate Kartı"
                    className="w-full max-w-[300px] rounded-2xl border border-white/10 shadow-2xl"
                  />
                </div>
              ) : (
                <div className="w-[300px] h-[533px] bg-slate-950/40 animate-pulse rounded-2xl border border-white/5 flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                  <span>Paylaşım kartı çiziliyor...</span>
                </div>
              )}
            </div>

            {/* Ödüllü Reklam ile Filigran Kaldırma */}
            <div className="space-y-3">
              {!isWatermarkRemoved ? (
                <button
                  onClick={() => {
                    setRewardedAdPurpose('REMOVE_WATERMARK');
                    setRewardedCountdown(15);
                    setRewardedAdOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs py-3 rounded-xl shadow-md border border-amber-400 flex items-center justify-center gap-1.5 animate-pulse transition"
                >
                  📺 Reklam İzle & Filigranı Kaldır
                </button>
              ) : (
                <div className="w-full text-center bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-xl text-emerald-450 text-[10px] font-bold">
                  ✨ Kart onaylandı! Filigran başarıyla kaldırıldı.
                </div>
              )}

              <div className="flex gap-2">
                <button
                  disabled={!shareCardImage}
                  onClick={downloadImage}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  📥 PNG Olarak İndir
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Bağlantı kopyalandı! Arkadaşlarınızla paylaşabilirsiniz.');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-3 rounded-xl text-xs font-semibold transition"
                >
                  🔗 Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STICKY AD BANNER SLOT A */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-900 py-1.5 px-4 shadow-2xl flex flex-col items-center justify-center">
        <AdSenseWrapper slot="banner-slot-a" className="max-h-[60px] my-0" />
      </div>
    </div>
  );
}
