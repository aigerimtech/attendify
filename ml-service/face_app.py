"""
face_app.py — Attendify ML Service

Exposes 3 endpoints consumed by the backend's ml_client.py:

  POST /embed      multipart image → { embedding: [float x128] }
  POST /compare    JSON { query, references } → { similarity: float }
  POST /liveness   multipart image → { is_live: bool }

The backend orchestrates everything — this service is a pure model server.
No DB writes, no user matching, no session logic here.
"""

import io
import time

import face_recognition
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image

app = Flask(__name__)
CORS(app)

# ── Liveness / blink settings ──────────────────────────────────────────────
LIVENESS_THRESHOLD   = 20.0   # Laplacian variance minimum (below = photo/screen)
EAR_CLOSED_THRESHOLD = 0.21   # Eye Aspect Ratio: below = eyes closed
EAR_OPEN_THRESHOLD   = 0.25   # Eye Aspect Ratio: above = eyes open
SESSION_TIMEOUT      = 60     # seconds before liveness session resets

# Per-client liveness state: { client_key: { saw_closed, saw_open, last_seen } }
LIVENESS_SESSIONS = {}


# ── Helpers ────────────────────────────────────────────────────────────────

def decode_image(request_obj):
    """
    Read image bytes from a multipart 'image' field or raw request body.
    Returns a numpy RGB array ready for face_recognition, or None on failure.
    """
    if 'image' in request_obj.files:
        img_bytes = request_obj.files['image'].read()
    elif request_obj.data:
        img_bytes = request_obj.data
    else:
        return None

    try:
        pil_img = Image.open(io.BytesIO(img_bytes))
        if pil_img.mode != 'RGB':
            pil_img = pil_img.convert('RGB')
        arr = np.array(pil_img)

        # Upscale tiny images so face_recognition has enough pixels
        h, w = arr.shape[:2]
        if max(h, w) < 500:
            scale = 500 / max(h, w)
            new_size = (int(w * scale), int(h * scale))
            arr = np.array(pil_img.resize(new_size, Image.LANCZOS))

        return arr
    except Exception as e:
        print(f"[decode_image] error: {e}")
        return None


def detect_faces(image_arr):
    """
    Detect face locations with fallback padding strategy.
    Returns filtered list of face locations.
    """
    face_locations = face_recognition.face_locations(
        image_arr, number_of_times_to_upsample=2
    )

    # Fallback: pad image and retry if no face found
    if len(face_locations) == 0:
        h, w = image_arr.shape[:2]
        pad = max(h, w) // 2
        padded = np.pad(image_arr, ((pad, pad), (pad, pad), (0, 0)),
                        mode='constant', constant_values=255)
        face_locations = face_recognition.face_locations(
            padded, number_of_times_to_upsample=2
        )
        if len(face_locations) > 0:
            image_arr = padded

    # Filter: keep only faces >= 40% of the largest face area
    if len(face_locations) > 1:
        areas = [(b - t) * (r - l) for (t, r, b, l) in face_locations]
        max_area = max(areas)
        face_locations = [
            loc for loc, a in zip(face_locations, areas)
            if a >= max_area * 0.4
        ]

    # Filter: require valid eye landmarks (removes hands, objects)
    if len(face_locations) > 0:
        landmarks = face_recognition.face_landmarks(image_arr, face_locations)
        face_locations = [
            loc for loc, lm in zip(face_locations, landmarks)
            if lm
            and 'left_eye' in lm and len(lm['left_eye']) >= 6
            and 'right_eye' in lm and len(lm['right_eye']) >= 6
        ]

    return image_arr, face_locations


def laplacian_variance(gray_image):
    """Blur detection — low variance means photo/screen attack."""
    kernel = np.array([[0,  1, 0],
                       [1, -4, 1],
                       [0,  1, 0]], dtype=np.float32)
    h, w = gray_image.shape
    img = gray_image.astype(np.float32)
    padded = np.pad(img, 1, mode='edge')
    result = (
        kernel[0, 0] * padded[0:h,     0:w]   + kernel[0, 1] * padded[0:h,     1:w+1] + kernel[0, 2] * padded[0:h,     2:w+2] +
        kernel[1, 0] * padded[1:h+1,   0:w]   + kernel[1, 1] * padded[1:h+1,   1:w+1] + kernel[1, 2] * padded[1:h+1,   2:w+2] +
        kernel[2, 0] * padded[2:h+2,   0:w]   + kernel[2, 1] * padded[2:h+2,   1:w+1] + kernel[2, 2] * padded[2:h+2,   2:w+2]
    )
    return float(result.var())


def _euclidean(p1, p2):
    return float(np.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2))


def compute_ear(eye_points):
    """Eye Aspect Ratio — open ~0.25-0.35, closed ~0.10-0.18."""
    if len(eye_points) < 6:
        return 0.0
    v1 = _euclidean(eye_points[1], eye_points[5])
    v2 = _euclidean(eye_points[2], eye_points[4])
    h  = _euclidean(eye_points[0], eye_points[3])
    if h == 0:
        return 0.0
    return (v1 + v2) / (2.0 * h)


def get_liveness_session(key):
    now = time.time()
    if key in LIVENESS_SESSIONS:
        if now - LIVENESS_SESSIONS[key]['last_seen'] > SESSION_TIMEOUT:
            del LIVENESS_SESSIONS[key]
    if key not in LIVENESS_SESSIONS:
        LIVENESS_SESSIONS[key] = {
            'saw_closed': False,
            'saw_open':   False,
            'last_seen':  now,
        }
    LIVENESS_SESSIONS[key]['last_seen'] = now
    return LIVENESS_SESSIONS[key]


def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


# ── Endpoints ──────────────────────────────────────────────────────────────

@app.route('/embed', methods=['POST'])
def embed():
    """
    Extract a 128-dim face embedding from the submitted image.

    Request:  multipart/form-data  field name: 'image'
    Response: { embedding: [float x128] }   HTTP 200
              HTTP 422 if no face detected
    """
    image_arr = decode_image(request)
    if image_arr is None:
        return jsonify({'detail': 'Could not decode image'}), 400

    image_arr, face_locations = detect_faces(image_arr)

    if len(face_locations) == 0:
        return jsonify({'detail': 'No face detected'}), 422

    # Use the first (largest) face
    encodings = face_recognition.face_encodings(image_arr, [face_locations[0]])
    if not encodings:
        return jsonify({'detail': 'No face detected'}), 422

    embedding = encodings[0].tolist()  # 128-dim list of floats
    return jsonify({'embedding': embedding})


@app.route('/compare', methods=['POST'])
def compare():
    """
    Compute max cosine similarity between a query embedding and a list of references.

    Request:  JSON { query: [float x128], references: [[float x128], ...] }
    Response: { similarity: float }   range [0, 1]
    """
    data = request.get_json()
    if not data or 'query' not in data or 'references' not in data:
        return jsonify({'detail': 'Missing query or references'}), 400

    query      = data['query']
    references = data['references']

    if not references:
        return jsonify({'similarity': 0.0})

    # face_recognition uses L2 distance; convert to similarity via cosine
    similarities = [cosine_similarity(query, ref) for ref in references]
    best = max(similarities)

    return jsonify({'similarity': round(best, 6)})


@app.route('/liveness', methods=['POST'])
def liveness():
    """
    Anti-spoofing liveness check using Laplacian variance + blink detection.

    Request:  multipart/form-data  field name: 'image'
              optional query param: ?client_key=<student_id or email>
    Response: { is_live: bool }
    """
    image_arr = decode_image(request)
    if image_arr is None:
        return jsonify({'is_live': False})

    image_arr, face_locations = detect_faces(image_arr)

    if len(face_locations) == 0:
        return jsonify({'is_live': False})

    top, right, bottom, left = face_locations[0]
    face_crop = image_arr[top:bottom, left:right]
    gray_face = np.mean(face_crop, axis=2) if face_crop.ndim == 3 else face_crop
    lap_var = laplacian_variance(gray_face)
    print(f"[liveness] Laplacian variance: {lap_var:.2f} (threshold={LIVENESS_THRESHOLD})")

    # Fail fast on blur (photo/screen attack)
    if lap_var < LIVENESS_THRESHOLD:
        return jsonify({'is_live': False})

    # Blink detection
    client_key = request.args.get('client_key', 'default')
    landmarks_list = face_recognition.face_landmarks(image_arr, [face_locations[0]])

    if not landmarks_list:
        # No landmarks — can't verify blink, fail safe
        return jsonify({'is_live': False})

    lm = landmarks_list[0]
    if 'left_eye' not in lm or 'right_eye' not in lm:
        return jsonify({'is_live': False})

    left_ear  = compute_ear(lm['left_eye'])
    right_ear = compute_ear(lm['right_eye'])
    avg_ear   = (left_ear + right_ear) / 2.0
    print(f"[liveness] EAR: {avg_ear:.3f}")

    session = get_liveness_session(client_key)
    if avg_ear < EAR_CLOSED_THRESHOLD:
        session['saw_closed'] = True
    if session['saw_closed'] and avg_ear > EAR_OPEN_THRESHOLD:
        session['saw_open'] = True

    is_live = session['saw_closed'] and session['saw_open']

    # Reset session on success so next attendance attempt starts fresh
    if is_live:
        LIVENESS_SESSIONS.pop(client_key, None)

    return jsonify({'is_live': is_live})


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    print("[Attendify ML Service] Starting on port 5001...")
    print("  POST /embed     — extract face embedding")
    print("  POST /compare   — compare embeddings")
    print("  POST /liveness  — liveness check")
    app.run(host='0.0.0.0', port=5001)