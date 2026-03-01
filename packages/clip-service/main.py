from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import requests
import base64
import io

app = FastAPI()

# Load model once at startup — ViT-B/32 produces 512-dimension embeddings
MODEL_NAME = 'openai/clip-vit-base-patch32'
model = CLIPModel.from_pretrained(MODEL_NAME)
processor = CLIPProcessor.from_pretrained(MODEL_NAME)
model.eval()


class EmbedRequest(BaseModel):
    url: str | None = None           # Fetch image from URL
    base64_image: str | None = None  # Or pass base64-encoded image bytes


class EmbedResponse(BaseModel):
    embedding: list[float]  # 512 floats, unit-normalised


@app.post('/embed', response_model=EmbedResponse)
async def embed_image(request: EmbedRequest):
    if not request.url and not request.base64_image:
        raise HTTPException(status_code=400, detail='Must provide url or base64_image')

    try:
        if request.url:
            response = requests.get(request.url, timeout=10)
            response.raise_for_status()
            image = Image.open(io.BytesIO(response.content)).convert('RGB')
        else:
            image_bytes = base64.b64decode(request.base64_image)
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    except Exception as e:
        raise HTTPException(status_code=422, detail=f'Could not load image: {e}')

    inputs = processor(images=image, return_tensors='pt')
    with torch.no_grad():
        features = model.get_image_features(**inputs)
        # Normalise to unit vector for cosine similarity
        features = features / features.norm(dim=-1, keepdim=True)

    return EmbedResponse(embedding=features[0].tolist())


@app.get('/health')
async def health():
    return {'status': 'ok'}
