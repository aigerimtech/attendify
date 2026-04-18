from fastapi import FastAPI, File, UploadFile, HTTPException
import uvicorn
import cv2
import numpy as np
from insightface.app import FaceAnalysis

app = FastAPI(title="Attendify ML Service")

# Modeli hafızaya yükle (İndirdiğin 'buffalo_l' modelini kullanır)
face_app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(640, 640))

@app.get("/")
def home():
    return {"status": "Active", "owner": "Beste", "model": "Buffalo_L Loaded"}

@app.post("/embed")
async def get_embedding(image: UploadFile = File(...)):
    # 1. Gelen fotoğrafı oku
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 2. Yüzü analiz et
    faces = face_app.get(img)
    if not faces:
        raise HTTPException(status_code=400, detail="Fotağrafta yüz bulunamadı!")

    # 3. Yüzün 512 boyutlu matematiksel imzasını (embedding) liste olarak dön
    embedding = faces[0].normed_embedding.tolist()
    
    return {
        "embedding": embedding,
        "face_count": len(faces),
        "message": "Yüz başarıyla vktöre dönüştürüldü!"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)