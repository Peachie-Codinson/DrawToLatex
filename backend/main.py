import base64
from fastapi import FastAPI, File, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",              # for local React dev
        "https://draw-to-latex.vercel.app/",       # your deployed site
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "Backend running successfully!"}


@app.post("/ocr")
async def ocr(
    image: bytes = File(...),
    authorization: str = Header(None)  # Expect: "Bearer <user_api_key>"
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid API key header.")

    api_key = authorization.split(" ")[1]
    client = OpenAI(api_key=api_key)

    b64img = base64.b64encode(image).decode()

    try:
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
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
