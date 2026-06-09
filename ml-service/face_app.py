import os
import io
import time
import face_recognition
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
CORS(app, origins=["*"])

MATCH_TOLERANCE = 0.45
LIVENESS_THRESHOLD = 10.0
EAR_CLOSED_THRESHOLD = 0.21
EAR_OPEN_THRESHOLD = 0.25
SESSION_TIMEOUT = 60
MIN_FACE_AREA_RATIO = 0.03
RELATIVE_SIZE_FILTER = 0.4

LIVENESS_SESSIONS = {}


def _euclidean(p1, p2):
    return float(np.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2))


def compute_ear(eye_points):
    if len(eye_points) < 6:
        return 0.0
    v1 = _euclidean(eye_points[1], eye_points[5])
    v2 = _euclidean(eye_points[2], eye_points[4])
    h = _euclidean(eye_points[0], eye_points[3])
    if h == 0:
        return 0.0
    return (v1 + v2) / (2.0 * h)


def laplacian_variance(gray_image):
    kernel = np.array([[0,  1, 0],
                       [1, -4, 1],
                       [0,  1, 0]], dtype=np.float32)
    h, w = gray_image.shape
    img = gray_image.astype(np.float32)
    padded = np.pad(img, 1, mode='edge')
    result = (
        kernel[0,0] * padded[0:h,   0:w]   + kernel[0,1] * padded[0:h,   1:w+1] + kernel[0,2] * padded[0:h,   2:w+2] +
        kernel[1,0] * padded[1:h+1, 0:w]   + kernel[1,1] * padded[1:h+1, 1:w+1] + kernel[1,2] * padded[1:h+1, 2:w+2] +
        kernel[2,0] * padded[2:h+2, 0:w]   + kernel[2,1] * padded[2:h+2, 1:w+1] + kernel[2,2] * padded[2:h+2, 2:w+2]
    )
    return float(result.var())


def get_liveness_session(key):
    now = time.time()
    key = key or "default"
    if key in LIVENESS_SESSIONS:
        if now - LIVENESS_SESSIONS[key]["last_seen"] > SESSION_TIMEOUT:
            del LIVENESS_SESSIONS[key]
    if key not in LIVENESS_SESSIONS:
        LIVENESS_SESSIONS[key] = {
            "saw_closed": False,
            "saw_open": False,
            "last_seen": now,
        }
    LIVENESS_SESSIONS[key]["last_seen"] = now
    return LIVENESS_SESSIONS[key]


def reset_liveness_session(key):
    key = key or "default"
    LIVENESS_SESSIONS.pop(key, None)


def l2_distance(a, b):
    a, b = np.array(a, dtype=np.float64), np.array(b, dtype=np.float64)
    return float(np.linalg.norm(a - b))


def decode_image(req):
    img_bytes = None
    if 'image' in req.files:
        img_bytes = req.files['image'].read()
    elif 'file' in req.files:
        img_bytes = req.files['file'].read()
    elif req.data:
        img_bytes = req.data
    if not img_bytes:
        return None
    try:
        image = Image.open(io.BytesIO(img_bytes))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        unknown_image = np.array(image)
        # Upscaling disabled for performance
        return unknown_image
    except Exception as e:
        print(f"[decode_image] error: {e}")
        return None


def detect_faces(unknown_image):
    face_locations = face_recognition.face_locations(
        unknown_image, number_of_times_to_upsample=1
    )
    if len(face_locations) == 0:
        h2, w2 = unknown_image.shape[:2]
        pad = max(h2, w2) // 2
        padded = np.pad(unknown_image, ((pad, pad), (pad, pad), (0, 0)),
                        mode='constant', constant_values=255)
        face_locations = face_recognition.face_locations(
            padded, number_of_times_to_upsample=1
        )
        if len(face_locations) > 0:
            unknown_image = padded
    if len(face_locations) > 1:
        face_areas = [(b - t) * (r - l) for (t, r, b, l) in face_locations]
        max_area = max(face_areas)
        keep_indices = [i for i, a in enumerate(face_areas) if a >= max_area * RELATIVE_SIZE_FILTER]
        face_locations = [face_locations[i] for i in keep_indices]
    img_area = unknown_image.shape[0] * unknown_image.shape[1]
    face_locations = [
        loc for loc in face_locations
        if ((loc[2] - loc[0]) * (loc[1] - loc[3])) >= img_area * MIN_FACE_AREA_RATIO
    ]
    if len(face_locations) > 0:
        landmarks_check = face_recognition.face_landmarks(unknown_image, face_locations)
        real_faces = []
        for loc, lm in zip(face_locations, landmarks_check):
            if lm and 'left_eye' in lm and 'right_eye' in lm \
                    and len(lm['left_eye']) >= 6 and len(lm['right_eye']) >= 6:
                real_faces.append(loc)
        face_locations = real_faces
    return unknown_image, face_locations


@app.route('/embed', methods=['POST'])
def embed():
    print(f"\n--- /embed isteği ---")
    unknown_image = decode_image(request)
    if unknown_image is None:
        return jsonify({'detail': 'Could not decode image'}), 400
    print(f"Görüntü çözünürlüğü: {unknown_image.shape}")
    unknown_image, face_locations = detect_faces(unknown_image)
    print(f"Gerçek yüz sayısı: {len(face_locations)}")
    if len(face_locations) == 0:
        return jsonify({'detail': 'No face detected'}), 422
    if len(face_locations) > 1:
        return jsonify({'detail': 'Multiple faces detected'}), 422
    encodings = face_recognition.face_encodings(unknown_image, [face_locations[0]])
    if not encodings:
        return jsonify({'detail': 'Could not extract embedding'}), 422
    embedding = encodings[0].tolist()
    print(f"Embedding çıkarıldı: {len(embedding)} boyutlu")
    return jsonify({'embedding': embedding})


@app.route('/compare', methods=['POST'])
def compare():
    data = request.get_json()
    if not data or 'query' not in data or 'references' not in data:
        return jsonify({'detail': 'Missing query or references'}), 400
    query = data['query']
    references = data['references']
    if not references:
        return jsonify({'similarity': 0.0, 'distance': 999.0, 'is_match': False, 'best_index': -1})
    distances = [l2_distance(query, ref) for ref in references]
    min_distance = min(distances)
    best_index = distances.index(min_distance)
    similarity = max(0.0, 1.0 - min_distance)
    is_match = min_distance < MATCH_TOLERANCE
    print(f"[/compare] {len(references)} reference ile karşılaştırıldı, best distance={min_distance:.4f}, is_match={is_match}")
    return jsonify({
        'similarity': round(similarity, 6),
        'distance':   round(min_distance, 6),
        'is_match':   bool(is_match),
        'best_index': best_index,
    })


@app.route('/liveness', methods=['POST'])
def liveness():
    print(f"\n--- /liveness isteği ---")
    unknown_image = decode_image(request)
    if unknown_image is None:
        return jsonify({'is_live': False, 'reason': 'no_image'})

    unknown_image, face_locations = detect_faces(unknown_image)
    print(f"Gerçek yüz sayısı: {len(face_locations)}")

    if len(face_locations) == 0:
        return jsonify({'is_live': False, 'reason': 'no_face'})
    if len(face_locations) > 1:
        return jsonify({'is_live': False, 'reason': 'multiple_faces'})

    top, right, bottom, left = face_locations[0]
    face_crop = unknown_image[top:bottom, left:right]
    gray_face = np.mean(face_crop, axis=2) if face_crop.ndim == 3 else face_crop
    lap_var = laplacian_variance(gray_face)
    print(f"Liveness (Laplacian variance): {lap_var:.2f}")

    if lap_var < LIVENESS_THRESHOLD:
        return jsonify({'is_live': False, 'reason': 'blur', 'liveness_score': round(lap_var, 2)})

    landmarks_list = face_recognition.face_landmarks(unknown_image, face_locations)
    if not landmarks_list \
       or 'left_eye' not in landmarks_list[0] \
       or 'right_eye' not in landmarks_list[0]:
        return jsonify({'is_live': False, 'reason': 'no_eye_landmarks', 'liveness_score': round(lap_var, 2)})

    lm = landmarks_list[0]
    left_ear = compute_ear(lm['left_eye'])
    right_ear = compute_ear(lm['right_eye'])
    avg_ear = (left_ear + right_ear) / 2.0
    print(f"EAR: {avg_ear:.3f}")

    client_key = request.args.get('client_key', 'default')
    session = get_liveness_session(client_key)

    if avg_ear < EAR_CLOSED_THRESHOLD:
        session["saw_closed"] = True
    if session["saw_closed"] and avg_ear > EAR_OPEN_THRESHOLD:
        session["saw_open"] = True

    if not session["saw_closed"]:
        return jsonify({'is_live': False, 'reason': 'need_blink_close', 'liveness_score': round(lap_var, 2), 'avg_ear': round(avg_ear, 3)})

    if not session["saw_open"]:
        return jsonify({'is_live': False, 'reason': 'need_blink_open', 'liveness_score': round(lap_var, 2), 'avg_ear': round(avg_ear, 3)})

    print("Blink BAŞARILI ✓")
    reset_liveness_session(client_key)
    return jsonify({'is_live': True, 'reason': 'live', 'liveness_score': round(lap_var, 2), 'avg_ear': round(avg_ear, 3)})


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'version': 'v3', 'match_tolerance': MATCH_TOLERANCE, 'liveness_threshold': LIVENESS_THRESHOLD})


if __name__ == '__main__':
    print("[Attendify ML Service v3] Starting on port 5001...")
    print("  POST /embed     → 128-dim face embedding")
    print("  POST /compare   → L2 distance match")
    print("  POST /liveness  → Laplacian + blink")
    print(f"  MATCH_TOLERANCE:    {MATCH_TOLERANCE}")
    print(f"  LIVENESS_THRESHOLD: {LIVENESS_THRESHOLD}")
    app.run(host='0.0.0.0', port=5001, threaded=True)