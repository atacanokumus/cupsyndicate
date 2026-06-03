import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  runTransaction,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserProfile, UserPredictions, Company, Squad, SocialLeague } from '../types/firestore';

const LOCAL_STORAGE_PRED_KEY = 'kupatahmini_offline_predictions';

/**
 * 1. KULLANICI TAHMİNLERİNİ FİRESTORE'A KAYDETME
 * İnternet kesintisi durumunda tarayıcı localStorage'ına yedekleme yapar.
 */
export const saveUserPredictions = async (
  uid: string, 
  groupStageData: any, 
  knockoutTreeData: any
): Promise<void> => {
  // Çevrimdışı durumlar için önce tarayıcı hafızasına yedekle
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_PRED_KEY, JSON.stringify({ groupStageData, knockoutTreeData, timestamp: Date.now() }));
  }

  try {
    const predRef = doc(db, 'predictions', uid);
    await setDoc(predRef, {
      uid,
      groupStageData,
      knockoutTreeData,
      updatedAt: serverTimestamp(),
      isLocked: false // Turnuva başlayana kadar kural seviyesinde güncellenebilir
    }, { merge: true });
    console.log("Tahminler Firestore'a başarıyla kaydedildi.");
  } catch (error) {
    console.error("Firestore tahmin kaydetme hatası (çevrimdışı yedek korundu):", error);
    throw error;
  }
};

/**
 * 2. KULLANICI TAHMİNLERİNİ ÇEKME
 * Firestore'dan tahminleri okur, hata durumunda localStorage yedeğine döner.
 */
export const getUserPredictions = async (uid: string): Promise<any | null> => {
  try {
    const predRef = doc(db, 'predictions', uid);
    const snap = await getDoc(predRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    console.warn("Firestore okunamadı, yerel yedek kontrol ediliyor...", error);
  }

  // Yerel hafıza kontrolü
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(LOCAL_STORAGE_PRED_KEY);
    if (local) {
      return JSON.parse(local);
    }
  }
  return null;
};

/**
 * 2.5 KULLANICI PROFİLİNİ KAYDETME VEYA GÜNCELLEME
 * Kullanıcı giriş yaptığında profil bilgilerini Firestore'a yazar.
 */
export const saveUserProfile = async (
  uid: string,
  username: string,
  email: string,
  avatarUrl: string | null
): Promise<any> => {
  const userRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const currentData = snap.data();
      const updatedFields = {
        username: currentData.username || username,
        email: currentData.email || email,
        avatarUrl: currentData.avatarUrl || avatarUrl,
        updatedAt: serverTimestamp()
      };
      await updateDoc(userRef, updatedFields);
      return { ...currentData, ...updatedFields };
    } else {
      const newProfile = {
        uid,
        username,
        email,
        avatarUrl,
        companyId: null,
        squadId: null,
        totalPoints: 0,
        isPremium: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    console.error("Kullanıcı profili kaydedilemedi:", error);
    throw error;
  }
};

/**
 * 3. GLOBAL LİDERLİK TABLOSUNU ÇEKME
 * totalPoints değerine göre kullanıcıları azalan sırada listeler.
 */
export const fetchGlobalLeaderboard = async (limitCount: number = 50): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('totalPoints', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    
    const leaderboard: UserProfile[] = [];
    snap.forEach((docSnap) => {
      leaderboard.push(docSnap.data() as UserProfile);
    });
    return leaderboard;
  } catch (error) {
    console.error("Liderlik tablosu çekilemedi:", error);
    throw error;
  }
};

/**
 * 3.5 GLOBAL KADRO LİDERLİK TABLOSUNU ÇEKME
 * averagePoints değerine göre kadroları azalan sırada listeler.
 */
export const fetchGlobalSquadLeaderboard = async (limitCount: number = 50): Promise<Squad[]> => {
  try {
    const squadsRef = collection(db, 'squads');
    const q = query(squadsRef, orderBy('averagePoints', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    
    const leaderboard: Squad[] = [];
    snap.forEach((docSnap) => {
      leaderboard.push(docSnap.data() as Squad);
    });
    return leaderboard;
  } catch (error) {
    console.error("Kadro Liderlik tablosu çekilemedi:", error);
    throw error;
  }
};

/**
 * 4. FİRESTORE TRANSACTION İLE SQUAD KILİT KATILIM KONTROLÜ
 * Koşul: Squad üye sayısı tam olarak 20'de durmalıdır.
 * Transaction kullanarak eşzamanlı isteklerde sınır aşımını engeller.
 */
export const joinSquadWithTransaction = async (
  uid: string, 
  companyId: string, 
  squadId: string
): Promise<{ success: boolean; message: string }> => {
  const squadRef = doc(db, 'squads', squadId);
  const userRef = doc(db, 'users', uid);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const squadSnap = await transaction.get(squadRef);
      if (!squadSnap.exists()) {
        throw new Error("Squad bulunamadı.");
      }

      const squadData = squadSnap.data() as Squad;
      const members = squadData.memberUids || [];

      // 1. Zaten üye mi kontrol et
      if (members.includes(uid)) {
        return { success: true, message: "Zaten bu squad'ın üyesisiniz." };
      }

      // 2. 20 Kişi Sınır Kontrolü (B2B Clash Kuralı)
      if (members.length >= 20) {
        throw new Error("Bu squad dolmuştur! Maksimum limit 20 üyedir.");
      }

      // 3. Squad üye listesini güncelle
      const updatedMembers = [...members, uid];
      transaction.update(squadRef, { memberUids: updatedMembers });

      // 4. Kullanıcı profilindeki companyId ve squadId değerlerini güncelle
      transaction.set(userRef, {
        companyId: companyId,
        squadId: squadId
      }, { merge: true });

      return { success: true, message: "Kadroya başarıyla katıldınız!" };
    });

    return result;
  } catch (error: any) {
    console.error("Transaction başarısız oldu:", error);
    return { success: false, message: error.message || "Bilinmeyen bir hata oluştu." };
  }
};

/**
 * 5. YEREL YEDEK TAHMİNLERİNİ FİRESTORE İLE SENKRONİZE ETME
 * İnternet geri geldiğinde tarayıcı yedeklerini Firestore'a yükler.
 */
export const syncOfflinePredictions = async (uid: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  const local = localStorage.getItem(LOCAL_STORAGE_PRED_KEY);
  if (!local) return false;

  try {
    const { groupStageData, knockoutTreeData } = JSON.parse(local);
    const predRef = doc(db, 'predictions', uid);
    await setDoc(predRef, {
      uid,
      groupStageData,
      knockoutTreeData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log("Çevrimdışı veriler başarıyla Firestore ile senkronize edildi.");
    return true;
  } catch (error) {
    console.error("Senkronizasyon hatası:", error);
    return false;
  }
};

/**
 * 6. YENİ B2B KADRO (SQUAD) OLUŞTURMA
 * Bir şirket altında yeni bir kadro (squad) oluşturup kullanıcıyı ekler.
 */
export const createSquad = async (
  uid: string,
  companyName: string,
  squadName: string
): Promise<{ success: boolean; squadId: string; companyId: string; message: string }> => {
  const companyId = 'comp_' + Math.random().toString(36).substr(2, 9);
  const squadId = 'sqd_' + Math.random().toString(36).substr(2, 9).toUpperCase(); // Davet kodu olarak kullanılacak benzersiz ID

  const companyRef = doc(db, 'companies', companyId);
  const squadRef = doc(db, 'squads', squadId);
  const userRef = doc(db, 'users', uid);

  try {
    await runTransaction(db, async (transaction) => {
      // Şirket oluştur
      transaction.set(companyRef, {
        companyId,
        name: companyName,
        logoUrl: null,
        isPremiumTier: false,
        paidByUid: uid,
        createdAt: serverTimestamp()
      });

      // Kadro oluştur
      transaction.set(squadRef, {
        squadId,
        companyId,
        name: squadName,
        memberUids: [uid],
        creatorUid: uid,
        createdAt: serverTimestamp()
      });

      // Kullanıcı belgesini güncelle
      transaction.set(userRef, {
        companyId,
        squadId
      }, { merge: true });
    });

    return {
      success: true,
      squadId,
      companyId,
      message: `"${squadName}" kadrosu başarıyla oluşturuldu! Arkadaşlarınızı davet etmek için kod: ${squadId}`
    };
  } catch (error: any) {
    console.error("Kadro oluşturma hatası:", error);
    return {
      success: false,
      squadId: '',
      companyId: '',
      message: error.message || "Kadro oluşturulamadı."
    };
  }
};

/**
 * 7. KADRO DETAYLARINI VE ÜYELERİNİ ÇEKME
 */
export const getSquadDetails = async (
  squadId: string
): Promise<{ squad: Squad | null; members: UserProfile[] }> => {
  try {
    const squadRef = doc(db, 'squads', squadId);
    const squadSnap = await getDoc(squadRef);

    if (!squadSnap.exists()) {
      return { squad: null, members: [] };
    }

    const squadData = squadSnap.data() as Squad;
    const members: UserProfile[] = [];

    // Üye kullanıcı profillerini çek
    for (const memberUid of squadData.memberUids) {
      const userRef = doc(db, 'users', memberUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        members.push(userSnap.data() as UserProfile);
      } else {
        // Mock fallback for dummy users
        members.push({
          uid: memberUid,
          username: memberUid.startsWith('dummy') ? 'Test Kullanıcısı' : 'Kullanıcı',
          email: 'kullanici@kupatahmini.com',
          avatarUrl: null,
          companyId: squadData.companyId,
          squadId: squadId,
          totalPoints: Math.floor(Math.random() * 120) + 10,
          isPremium: false,
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any
        });
      }
    }

    // Puanlara göre sırala
    members.sort((a, b) => b.totalPoints - a.totalPoints);

    // Ortalama Puanı Hesapla ve Güncelle (Bu gerçek projede backend/Cloud Function üzerinden yapılmalıdır)
    const totalPts = members.reduce((sum, m) => sum + m.totalPoints, 0);
    const avgPts = members.length > 0 ? parseFloat((totalPts / members.length).toFixed(1)) : 0;
    
    squadData.totalSquadPoints = totalPts;
    squadData.averagePoints = avgPts;

    // Optional: Update the squad in DB so leaderboard reflects the new average
    try {
      await updateDoc(squadRef, {
        totalSquadPoints: totalPts,
        averagePoints: avgPts
      });
    } catch (e) {
      console.error("Ortalama puan güncellenemedi:", e);
    }

    return { squad: squadData, members };
  } catch (error) {
    console.error("Kadro detayları çekilemedi:", error);
    return { squad: null, members: [] };
  }
};

/**
 * 8. KADRO TEMEL BİLGİLERİNİ ÇEKME (Davet sayfası için)
 */
export const getSquadBasicInfo = async (
  squadId: string
): Promise<{ name: string; memberCount: number } | null> => {
  try {
    const squadRef = doc(db, 'squads', squadId);
    const snap = await getDoc(squadRef);
    if (!snap.exists()) return null;
    const data = snap.data() as Squad;
    return { name: data.name, memberCount: (data.memberUids || []).length };
  } catch (error) {
    console.error("Kadro bilgisi çekilemedi:", error);
    return null;
  }
};

/**
 * 9. KLAN ÜYELERİNİN GRUP TAHMİN İSTATİSTİKLERİNİ ÇEKME
 * Her grup için her takımın kaç kez 1., 2., 3. seçildiğini yüzde olarak döndürür.
 */
export const fetchSquadMemberPredictions = async (
  squadId: string,
  currentUserUid: string
): Promise<any> => {
  try {
    const squadRef = doc(db, 'squads', squadId);
    const squadSnap = await getDoc(squadRef);
    if (!squadSnap.exists()) return {};

    const squadData = squadSnap.data() as Squad;
    const memberUids = (squadData.memberUids || []).filter(uid => uid !== currentUserUid);

    if (memberUids.length === 0) return {};

    // Tüm üyelerin tahminlerini çek
    const allPreds: any[] = [];
    for (const uid of memberUids) {
      try {
        const predRef = doc(db, 'predictions', uid);
        const predSnap = await getDoc(predRef);
        if (predSnap.exists()) {
          allPreds.push(predSnap.data());
        }
      } catch (e) {
        // skip failed fetches
      }
    }

    if (allPreds.length === 0) return {};

    // Grup bazında istatistik hesapla
    const stats: any = {};
    const groupIds = ['A','B','C','D','E','F','G','H','I','J','K','L'];

    for (const gId of groupIds) {
      const counts: { [teamId: string]: { first: number; second: number; third: number } } = {};
      let voters = 0;

      for (const pred of allPreds) {
        const groupData = pred?.groupStageData?.groups?.[gId];
        if (!groupData) continue;
        voters++;
        const first = groupData.first || groupData.top2?.[0];
        const second = groupData.second || groupData.top2?.[1];
        const third = groupData.third || groupData.thirdPlaceId;

        if (first) {
          if (!counts[first]) counts[first] = { first: 0, second: 0, third: 0 };
          counts[first].first++;
        }
        if (second) {
          if (!counts[second]) counts[second] = { first: 0, second: 0, third: 0 };
          counts[second].second++;
        }
        if (third) {
          if (!counts[third]) counts[third] = { first: 0, second: 0, third: 0 };
          counts[third].third++;
        }
      }

      if (voters > 0) {
        const groupStats: any = { _totalVoters: voters };
        for (const teamId of Object.keys(counts)) {
          groupStats[teamId] = {
            firstPct: Math.round((counts[teamId].first / voters) * 100),
            secondPct: Math.round((counts[teamId].second / voters) * 100),
            thirdPct: Math.round((counts[teamId].third / voters) * 100)
          };
        }
        stats[gId] = groupStats;
      }
    }

    return stats;
  } catch (error) {
    console.error("Klan tahmin istatistikleri çekilemedi:", error);
    return {};
  }
};

/**
 * 10. KADRO ADINI GÜNCELLEME
 * Kadroyu kuran kurucu (creator) kadronun adını güncelleyebilir.
 */
export const renameSquad = async (
  squadId: string,
  newSquadName: string,
  userUid: string
): Promise<{ success: boolean; message: string }> => {
  const squadRef = doc(db, 'squads', squadId);
  try {
    const squadSnap = await getDoc(squadRef);
    if (!squadSnap.exists()) {
      return { success: false, message: "Kadro bulunamadı." };
    }
    const squadData = squadSnap.data() as Squad;
    
    // Kurucu kontrolü (creatorUid eşleşmesi veya üye listesindeki ilk eleman olması)
    const isCreator = squadData.creatorUid === userUid || (squadData.memberUids && squadData.memberUids[0] === userUid);
    if (!isCreator) {
      return { success: false, message: "Yalnızca kadroyu kuran kişi ismi değiştirebilir." };
    }
    
    await updateDoc(squadRef, {
      name: newSquadName
    });
    
    return { success: true, message: "Kadro ismi başarıyla güncellendi!" };
  } catch (error: any) {
    console.error("Kadro ismi güncellenirken hata oluştu:", error);
    return { success: false, message: error.message || "İsim güncellenemedi." };
  }
};
