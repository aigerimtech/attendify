from fastapi import FastAPI, File, UploadFile, HTTPException
import uvicorn
import cv2
import numpy as np
from insightface.app import FaceAnalysis
from pydantic import BaseModel
from typing import List

# 1. FastAPI ve InsightFace Modeli Hazırlığı
app = FastAPI()

# Modeli başlat (İlk çalıştırmada model dosyalarını indirebilir, biraz bekletebilir)
face_app = FaceAnalysis(name="antelopev2", providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(640, 640))

# 2. Veri Modelleri (Ada Berke'nin backend'den göndereceği JSON yapısı)
class CompareRequest(BaseModel):
    stored_embedding: List[float]    # Veritabanındaki kayıtlı vktör
    captured_embedding: List[float]  # O an kameradan gelen vktör

# 3. Yardımcı Fonksiyon: Karşılaştırma Matematiği
def verify_faces(embedding1, embedding2, threshold=0.5):
    v1 = np.array(embedding1)
    v2 = np.array(embedding2)
    
    # Cosine Similarity (Açısal Benzerlik) hesaplama
    dot_product = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    similarity = dot_product / (norm1 * norm2)
    
    is_same = bool(similarity > threshold)
    return is_same, float(similarity)

# 4. API Ucu: Fotoğraftan Vktör Çıkarma (Kayıt ve Yoklama için)
@app.post("/embed")
async def get_embedding(image: UploadFile = File(...)):
    # Gelen fotoğrafı oku
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Yüzü analiz et
    faces = face_app.get(img)
    if not faces:
        raise HTTPException(status_code=400, detail="Fotoğrafta yüz bulunamadı!")

    # En belirgin ilk yüzün vktörünü al ve listeye çevir
    embedding = faces[0].normed_embedding.tolist()

    return {
        "embedding": embedding,
        "face_count": len(faces),
        "message": "Yüz başarıyla vktöre dönüştürüldü!"
    }

# 5. API Ucu: İki Vktörü Karşılaştırma (Doğrulama için)
@app.post("/compare")
async def compare_vectors(data: CompareRequest):
    is_same, score = verify_faces(data.stored_embedding, data.captured_embedding)
    
    return {
        "is_same": is_same,
        "confidence_score": score,
        "message": "Eşleşme başarılı!" if is_same else "Yüzler eşleşmiyor."
    }

# 6. Uygulamayı Başlat
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)