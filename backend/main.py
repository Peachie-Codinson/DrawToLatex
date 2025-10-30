from fastapi import FastAPI, File, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import OpenAI
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://draw-to-latex.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "Backend running successfully!"}

# ✅ OPTIONS preflight
@app.options("/ocr")
async def options_ocr():
    return JSONResponse(content={"ok": True})

# ✅ Main OCR endpoint
@app.post("/ocr")
async def ocr(image: bytes = File(...), authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid API key header.")
    api_key = authorization.split(" ")[1]
    client = OpenAI(api_key=api_key)
    b64img = base64.b64encode(image).decode()
    result = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an OCR-to-LaTeX assistant. "
                        "Return only the LaTeX equation enclosed in \\[ and \\], "
                        "without any explanation or markdown formatting."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Transcribe this image into LaTeX equation syntax."},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64img}"}},
                    ],
                },
            ],
        )
    return {"latex": result.choices[0].message.content}
