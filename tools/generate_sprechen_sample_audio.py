from pathlib import Path
import asyncio,json,re,subprocess
import edge_tts,imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1]
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
OUT=ROOT/"assets"/"audio"/"sprechen"
MANIFEST=OUT/"sample-duration-manifest.json"
RATES=["-35%","-45%","-25%"]

async def synth(text,out,rate):
 out.parent.mkdir(parents=True,exist_ok=True)
 await edge_tts.Communicate(text=text,voice="de-DE-KatjaNeural",rate=rate).save(str(out))

def duration(path):
 p=subprocess.run([FFMPEG,"-i",str(path),"-f","null","-"],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True)
 m=re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)",p.stderr)
 if not m:return 0.0
 return int(m.group(1))*3600+int(m.group(2))*60+float(m.group(3))

async def one(task,sem):
 out=ROOT/task["sample_audio"]
 async with sem:
  best=None
  for rate in RATES:
   await synth(task["sample"],out,rate);sec=duration(out);best=(rate,sec)
   if 150<=sec<=210:break
  return task["task_id"],out,best

async def main():
 data=json.loads((ROOT/"content"/"sprechen"/"aufgabe-2.json").read_text(encoding="utf-8"))
 sem=asyncio.Semaphore(3)
 rows=await asyncio.gather(*(one(t,sem) for t in data["tasks"]))
 manifest={"version":"sprechen-a2-sample-audio-v2","human_listening_qa":"NOT_VERIFIED","target_seconds":[150,210],"items":{}}
 for tid,out,(rate,sec) in rows:
  manifest["items"][tid]={"asset_src":str(out.relative_to(ROOT)).replace("\\","/"),"duration_seconds":round(sec,2),"tts_voice":"de-DE-KatjaNeural","rate":rate}
  print(tid,round(sec,2),rate)
 MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
 if any(not 150<=x["duration_seconds"]<=210 for x in manifest["items"].values()):
  raise SystemExit("Sprechen Aufgabe 2 sample duration outside 150-210 seconds")
 print("Sprechen sample audio duration gate: PASS")
if __name__=="__main__":asyncio.run(main())
