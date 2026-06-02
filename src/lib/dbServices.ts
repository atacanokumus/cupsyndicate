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

const LOCAL_STORAGE_PRED_KEY = 'cupsyndicate_offline_predictions';

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
      transaction.update(userRef, {
        companyId: companyId,
        squadId: squadId
      });

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
        createdAt: serverTimestamp()
      });

      // Kullanıcı belgesini güncelle
      transaction.update(userRef, {
        companyId,
        squadId
      });
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
          email: 'kullanici@cupsyndicate.com',
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

    return { squad: squadData, members };
  } catch (error) {
    console.error("Kadro detayları çekilemedi:", error);
    return { squad: null, members: [] };
  }
};

