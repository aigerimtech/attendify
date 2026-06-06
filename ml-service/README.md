# ML Service — Face Recognition + Liveness Detection

Attendify projesinin yüz tanıma servisi. Flask + `face_recognition` kütüphanesi ile çalışır. Göz kırpma (blink) tespiti ile anti-spoofing yapar — telefon fotoğrafı ile geçilemez.

## Mimari

```
React Frontend (localhost:5173)
        │  POST /recognize?email=...
        ▼
Flask (localhost:5001)
        │  — face_recognition ile yüz eşleştirme
        │  — Eye Aspect Ratio (EAR) ile göz kırpma tespiti
        │  — Başarılı olunca Postgres'e yoklamayı yazar
        ▼
Postgres (Docker, localhost:5432)
```

## Kurulum (Mac/Linux)

### 1. Postgres'i Docker ile başlat

```bash
cd ml-service
docker compose up -d
```

Bu, `attendance-db` adında bir Postgres container başlatır. Port: 5432.

> **Not:** Eğer Homebrew Postgres çalışıyorsa port çakışır. Önce durdur: `brew services stop postgresql`

### 2. Python sanal ortamı oluştur

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

> **Not:** `face-recognition` kütüphanesi `dlib` kullanır ve Mac'te ilk kurulumda biraz zaman alır. Eğer hata alırsan:
> ```bash
> brew install cmake
> pip install dlib
> pip install face-recognition
> ```

### 3. Servisi başlat

```bash
python3 face_app.py
```

Servis `http://localhost:5001` adresinde çalışmaya başlar. İlk çalıştırmada `attendance` tablosu otomatik oluşturulur.

## API

### `POST /recognize?email=<student_email>`

**Form-data:** `file` (jpeg/png)

**Cevaplar:**

- `200 OK` + `{"status": "success", "name": "...", "message": "Welcome, ..."}` → Yüz tanındı, yoklama kaydedildi
- `200 OK` + `{"status": "info", "message": "Canlılık kontrolü: Lütfen göz kırpın..."}` → Göz kırpma bekleniyor
- `400` + `{"status": "fail", "message": "Fotoğrafta yüz bulunamadı"}` → Yüz yok
- `400` + `{"status": "warning", "message": "Birden fazla yüz tespit edildi"}` → Birden fazla insan
- `401` + `{"status": "fail", "message": "Yanlış hesap"}` → Email ile yüz eşleşmiyor

## Kayıtlı Kullanıcılar

Şu an test amaçlı `KNOWN_USERS` dict'i `face_app.py` içinde. İleride backend'den (Ada Berke'nin API'sinden) DB'deki kullanıcıları çekecek.

Her kullanıcı için:
- `email`: "student@test.com"
- `name`: "Orkan Kirdar"
- `image_path`: "orkan_kirdar.jpg"

## Anti-Spoofing (Göz Kırpma)

Telefon fotoğrafı ile geçişi engellemek için **Eye Aspect Ratio (EAR)** bazlı canlılık kontrolü var:

1. Kullanıcının göz kırpması gerekiyor (önce kapalı → sonra açık sırası)
2. EAR < 0.21 → göz kapalı
3. EAR > 0.25 → göz açık
4. Her iki durum da tespit edildikten sonra yüz tanıma geçerli sayılır

Session state `LIVENESS_SESSIONS` dict'inde email bazlı tutulur. 60 saniye timeout'u var.

## Postgres

**Database:** `attendance`
**User:** `n8n` / **Password:** `n8n_password` (lokal dev için — production'da değişecek)

**Tablo:**
```sql
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    arrival_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    distance FLOAT
);
```

Sorgulamak için:
```bash
docker exec -it attendance-db psql -U n8n -d attendance -c "SELECT * FROM attendance ORDER BY arrival_time DESC LIMIT 10;"
```

## Notlar (Ekip için)

- **Önceki sürüm:** FastAPI + InsightFace (antelopev2). Kaldırıldı.
- **Port değişikliği:** 8080 → 5001
- **Backend entegrasyonu:** Ada Berke'nin backend'i (FastAPI) tamamlanınca, `KNOWN_USERS` yerine backend'den kullanıcı embedding'leri çekilecek.
- **Frontend:** `frontend/student/src/pages/Student/FaceVerify.jsx` doğrudan bu servise istek atıyor (`http://localhost:5001/recognize`).
