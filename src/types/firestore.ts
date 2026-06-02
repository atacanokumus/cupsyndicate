import { Timestamp } from 'firebase/firestore';

/**
 * Kullanıcı Profili Arayüzü
 * Firestore Koleksiyonu: `/users/{uid}`
 */
export interface UserProfile {
  uid: string;                 // Kullanıcının benzersiz kimliği (Firebase Auth'tan)
  username: string;            // Kullanıcı adı
  email: string;               // E-posta adresi
  avatarUrl: string | null;    // Profil resmi URL'si
  companyId: string | null;    // Bağlı olduğu şirketin ID'si (B2B Clash için)
  squadId: string | null;      // Bağlı olduğu 20 kişilik squad'ın ID'si
  totalPoints: number;         // Toplam tahmin puanı (Dinamik güncellenir)
  isPremium: boolean;          // Premium profil durumu (Reklamsız ve AI özellikleri için)
  createdAt: Timestamp;        // Hesap oluşturulma tarihi
  updatedAt: Timestamp;        // Son güncelleme tarihi
}

/**
 * Grup Aşaması Tahmini Formatı
 * Her grup için 1. ve 2. seçilen takımların listesi
 */
export interface GroupPrediction {
  top2: string[];              // Seçilen 2 takımın ID'si (Örn: ["mexico", "south_korea"])
  thirdPlaceId: string | null; // Bu grubun 3.sü olarak tahmin edilen takım ID'si
}

/**
 * Eleme (Knockout) Aşaması Eşleşme Yapısı
 */
export interface KnockoutMatchPrediction {
  matchId: number;             // Eşleşme numarası (73 - 104)
  homeTeamId: string | null;   // Ev sahibi takım ID'si (Önceki aşamadan dinamik gelir)
  awayTeamId: string | null;   // Deplasman takım ID'si
  predictionUid: string | null; // Kullanıcının turu geçmesini tahmin ettiği takım ID'si
  scoreHome?: number;          // İsteğe bağlı skor tahmini
  scoreAway?: number;          // İsteğe bağlı skor tahmini
}

/**
 * Kullanıcı Tahminleri Belgesi
 * Firestore Koleksiyonu: `/predictions/{uid}`
 */
export interface UserPredictions {
  uid: string;                                          // Tahmini yapan kullanıcının ID'si
  groupStageData: {
    groups: { [groupId: string]: GroupPrediction };     // Grup A - L arası tahmin verileri
    bestThirdPlaceUids: string[];                       // Seçilen 8 en iyi 3. takım ID'si
  };
  knockoutTreeData: {
    matches: { [matchId: number]: KnockoutMatchPrediction }; // Maç ID'sine göre eleme şablonu
  };
  createdAt: Timestamp;                                 // Tahmin oluşturma tarihi
  updatedAt: Timestamp;                                 // Tahmin güncelleme tarihi
  isLocked: boolean;                                    // Turnuva başladıktan sonra kilitlenir
}

/**
 * Şirket Belgesi (B2B Kurumsal Ligler)
 * Firestore Koleksiyonu: `/companies/{companyId}`
 */
export interface Company {
  companyId: string;           // Şirket benzersiz ID'si
  name: string;                // Şirket adı (Örn: "Google", "Trendyol")
  logoUrl: string | null;      // Premium şirkete ait marka logo URL'si
  isPremiumTier: boolean;      // Şirketin premium özellik paketine sahip olup olmadığı
  paidByUid: string | null;    // Ödemeyi yapan premium kullanıcının UID'si
  createdAt: Timestamp;
}

/**
 * Kadro (Squad) Belgesi
 * Firestore Koleksiyonu: `/squads/{squadId}`
 * Kurallar: En fazla 20 üye barındırabilir.
 */
export interface Squad {
  squadId: string;             // Squad benzersiz ID'si
  companyId: string;           // Bağlı olduğu şirket ID'si
  name: string;                // Squad adı (Örn: "Trendyol Tech", "Trendyol QA")
  memberUids: string[];        // Squad üyelerinin UID listesi (Maksimum 20 üye)
  totalSquadPoints?: number;   // Squad üyelerinin ortalama veya toplam puanı
  createdAt: Timestamp;
}

/**
 * Sosyal Lig Belgesi (Özel Ligler)
 * Firestore Koleksiyonu: `/leagues/{leagueId}`
 */
export interface SocialLeague {
  leagueId: string;            // Lig benzersiz ID'si
  name: string;                // Lig adı
  inviteCode: string;          // 6 haneli benzersiz davet/referans kodu (Büyük harf ve rakamlar)
  creatorUid: string;          // Ligi kuran kullanıcının UID'si
  memberUids: string[];        // Lige katılan kullanıcıların UID listesi
  isCorporate: boolean;        // Kurumsal lige bağlı olup olmadığı
  createdAt: Timestamp;
}
