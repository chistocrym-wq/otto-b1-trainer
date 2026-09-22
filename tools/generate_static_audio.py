from pathlib import Path
import asyncio, json, shutil, subprocess, tempfile, os, sys, hashlib
ROOT=Path(__file__).resolve().parents[1]
try:
 import edge_tts
except Exception:
 raise SystemExit("Install once: python -m pip install edge-tts imageio-ffmpeg")
try:
 import imageio_ffmpeg
 FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
 FFMPEG=shutil.which("ffmpeg")
if not FFMPEG: raise SystemExit("ffmpeg is required")
VOICE_FALLBACK={"Moderatorin":"de-DE-AmalaNeural","Person A":"de-DE-KatjaNeural","Person B":"de-DE-ConradNeural","Lena":"de-DE-KatjaNeural","Paul":"de-DE-ConradNeural","narrator":"de-DE-KatjaNeural"}
MANIFEST=ROOT/"assets"/"audio"/"audio-manifest.json"
try: OLD=json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
except Exception: OLD={}
NEW={}
async def tts(text,voice,out):
 out.parent.mkdir(parents=True,exist_ok=True)
 await edge_tts.Communicate(text=text,voice=voice,rate="-5%").save(str(out))
def ffconcat(parts,out):
 with tempfile.TemporaryDirectory() as td:
  lst=Path(td)/"list.txt"
  lst.write_text("\n".join("file '"+str(p).replace("'","'\\''")+"'" for p in parts),encoding="utf-8")
  subprocess.run([FFMPEG,"-y","-f","concat","-safe","0","-i",str(lst),"-ac","1","-ar","24000","-b:a","48k",str(out)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
async def make_audio(meta,turns=None):
 out=ROOT/meta["asset_src"]
 signature=hashlib.sha256(json.dumps({"transcript":meta.get("transcript"),"speakers":meta.get("speakers"),"turns":turns},ensure_ascii=False,sort_keys=True).encode("utf-8")).hexdigest()
 rel=str(out.relative_to(ROOT)).replace("\\","/")
 if out.exists() and out.stat().st_size>1000 and OLD.get(rel)==signature:
  NEW[rel]=signature
  return False
 speakers=meta.get("speakers") or []
 if turns and len(speakers)>1:
  voice_by={s["speaker_id"]:s["voice_id"] for s in speakers}
  with tempfile.TemporaryDirectory() as td:
   parts=[]
   for n,t in enumerate(turns):
    voice=voice_by.get(t["speaker"],VOICE_FALLBACK.get(t["speaker"],speakers[min(n,len(speakers)-1)]["voice_id"]))
    p=Path(td)/f"{n:03d}.mp3";await tts(t["text"],voice,p);parts.append(p)
   out.parent.mkdir(parents=True,exist_ok=True);ffconcat(parts,out)
 else:
  voice=(speakers[0]["voice_id"] if speakers else "de-DE-KatjaNeural")
  await tts(meta["transcript"],voice,out)
 NEW[rel]=signature
 return True
async def main():
 jobs=[]
 for part in range(1,5):
  data=json.loads((ROOT/"content"/"hoeren"/f"teil-{part}.json").read_text(encoding="utf-8"))
  for task in data["sets"]:
   if part==1:
    for scene in task["scenes"]: jobs.append((scene["audio"],None))
   else: jobs.append((task["audio"],task.get("turns")))
 sem=asyncio.Semaphore(5);created=0
 async def worker(meta,turns):
  nonlocal created
  async with sem:
   if await make_audio(meta,turns): created+=1;print("audio",meta["audio_id"])
 await asyncio.gather(*(worker(m,t) for m,t in jobs))
 # Sprechen Aufgabe 2 sample audio: stable female voice for examples.
 data=json.loads((ROOT/"content"/"sprechen"/"aufgabe-2.json").read_text(encoding="utf-8"))
 for task in data["tasks"]:
  out=ROOT/task["sample_audio"]
  if not out.exists() or out.stat().st_size<1000:
   await tts(task["sample"],"de-DE-KatjaNeural",out);created+=1;print("audio",task["task_id"])
 MANIFEST.parent.mkdir(parents=True,exist_ok=True)
 MANIFEST.write_text(json.dumps(NEW,ensure_ascii=False,indent=2,sort_keys=True),encoding="utf-8")
 print("created",created,"static audio assets; manifest entries",len(NEW))
if __name__=="__main__": asyncio.run(main())
