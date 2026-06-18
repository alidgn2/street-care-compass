# PatiHarita - Sokak Hayvanları Topluluk Uygulaması

Türkiye genelinde sokak sokak hayvan bakımını takip eden, ihbar ve sohbet özellikli topluluk uygulaması.

## Özellikler (İlk Sürüm)

### 1. Harita & Sokak Takibi
- Google Maps üzerinde sokak sokak görünüm
- Bir sokağa tıklayınca: son mama/su verme zamanı, kim verdi, fotoğraflar
- "Mama verdim" / "Su verdim" hızlı bildirim butonları (konum + foto)
- Renk kodu: yeşil (son 12 saat), sarı (12-24 saat), kırmızı (24 saat+)

### 2. Yaralı Hayvan İhbarı
- Aciliyet seviyesi (acil/orta/hafif), foto, açıklama, konum
- Harita üzerinde ayrı pin (kırmızı haç ikonu)
- "Yardım ettim/ilgilendim" durum güncellemesi
- En yakın veteriner önerisi (Google Places)

### 3. Hayvan Profilleri
- Tanıdık sokak hayvanları için kart (isim, foto, tür, mahalle)
- Aşı/kısırlaştırma durumu
- "Bu hayvanı gördüm" check-in

### 4. Sohbet
- Kullanıcılar arası birebir mesajlaşma (realtime)
- Mahalle bazlı grup sohbeti (opsiyonel)
- Yaralı hayvan ihbarı üzerinden direkt iletişim

### 5. Kullanıcı & Gönüllü Sistemi
- E-posta/şifre giriş
- Profil: isim, mahalle, gönüllü sayaçları
- Rozetler: 10 besleme, 50 besleme, ilk kurtarma vb.

## Tasarım Yönü

**Palet**: Krem (#FFF8E7), Turuncu (#FF6B35), Petrol (#1A535C), Şeftali (#F7C59F)
**Tipografi**: Outfit (başlık) + Figtree (gövde) — modern, sıcak, okunabilir
**His**: Canlı, enerjik, şefkatli; yuvarlak köşeler, yumuşak gölgeler, pati/kalp ikonografisi

## Teknik Yapı

- **Backend**: Lovable Cloud (auth, postgres, realtime, storage)
- **Harita**: Google Maps Platform connector
- **Tablolar**: profiles, streets, feedings, injury_reports, animals, animal_sightings, chats, messages, user_badges
- **Realtime**: messages, feedings, injury_reports
- **Storage**: hayvan/ihbar fotoğrafları
- **RLS**: tüm tablolarda; profiller ayrı `user_roles` tablosu

## Aşamalı Uygulama

1. Cloud + Auth + tasarım sistemi + tablolar
2. Harita + besleme bildirimi akışı (ana özellik)
3. Yaralı ihbar akışı
4. Hayvan profilleri
5. Mesajlaşma (realtime)
6. Rozetler + profil sayfası

## Notlar

- Google Maps connector için onay isteyeceğim (harita için şart)
- İlk sürümde Türkiye odaklı; konum izni şart
- İlk versiyonda mobil-öncelikli responsive tasarım

Onaylarsan Cloud + Google Maps kurulumuyla başlıyorum.
