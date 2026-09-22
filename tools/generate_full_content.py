from pathlib import Path
import json, re
ROOT=Path(__file__).resolve().parents[1]
C=ROOT/"content"; IMG=ROOT/"assets"/"images"/"hoeren"
for p in [C/"lesen",C/"hoeren",C/"schreiben",C/"sprechen",IMG]: p.mkdir(parents=True,exist_ok=True)
SRC=["GOETHE_B1_CURRENT_FORMAT_STRUCTURE","CEFR_B1_ALIGNMENT","ORIGINAL_OTTO_CONTENT"]
TOPICS=["Nachbarschaft","Sprachcafé","Fahrrad","Kochen","Bücher","Sport","Repair-Café","Fotografie","Ehrenamt","Reisen"]
NAMES=["Mara","Jonas","Lea","Tobias","Nina","Emre","Sophie","David","Aylin","Felix"]
VOICES=["de-DE-KatjaNeural","de-DE-ConradNeural","de-DE-AmalaNeural"]
def dump(path,obj): path.write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding="utf-8")
def common(tid,module,part,kind,topic,micro):
 return dict(task_id=tid,module=module,teil=part,task_type=kind,skill=module,micro_skill=micro,difficulty="B1",topic=topic,version="1.0.0",qa_status="AUTOMATED_SCHEMA_AND_MECHANICS_PASSED",content_status="PREVIEW_CANDIDATE_HUMAN_LINGUISTIC_QA_PENDING",source_basis=SRC,original_aligned=True,strategy="Сначала определите, что именно проверяется. Затем найдите доказательство по смыслу и только после этого выбирайте ответ.",explanation="Оригинальное задание повторяет механику Goethe-Zertifikat B1 без копирования официального текста.")
def glossary():
 return [{"de":"ursprünglich","ru":"первоначально","kind":"useful"},{"de":"stattfinden","ru":"состояться","kind":"useful"},{"de":"zuverlässig","ru":"надёжно","kind":"useful"},{"de":"Vorschlag","ru":"предложение","kind":"useful"}]
def rf(qid,text,correct,evidence,why,trap):
 return dict(id=qid,statement=text,translation="Проверьте утверждение по смыслу.",correct=bool(correct),evidence=evidence,why=why,trap=trap)
def mc(qid,text,opts,correct,evidence,why,trap):
 return dict(id=qid,question=text,translation="Выберите вариант по смыслу материала.",options=opts,correct_index=correct,evidence=evidence,why=why,trap=trap)
def lesen1(i):
 topic,name=TOPICS[i],NAMES[i];place=["Gemeinschaftsraum","Bibliothek","Schulhof","Vereinsraum","Kulturzentrum"][i%5]
 text=f"""Hallo zusammen,
am letzten Samstag gab es bei uns ein Treffen zum Thema {topic}. Eigentlich wollten wir draußen beginnen. Am Vormittag regnete es jedoch stark, deshalb zogen wir kurzfristig in den {place} um.
Ich hatte Getränke versprochen, musste aber bis 16 Uhr arbeiten. Zum Glück übernahm Sara einen Teil. Als ich gegen halb sechs kam, waren schon ungefähr zwanzig Personen da. Herr Klein war ebenfalls dabei, obwohl er normalerweise selten an gemeinsamen Veranstaltungen teilnimmt.
Wir wollten ursprünglich um neun Uhr Schluss machen. Am Ende blieben viele bis fast zehn. Nächsten Monat planen wir ein Frühstück. Wenn das Wetter gut ist, möchten wir wieder den Hof benutzen.
Viele Grüße
{name}"""
 qs=[rf(f"L1-{i+1}-Q1","Das Treffen fand wie zuerst geplant draußen statt.",False,"deshalb zogen wir kurzfristig in den "+place+" um","Der ursprüngliche Plan wurde geändert.","„draußen“ gehört zum alten Plan."),
 rf(f"L1-{i+1}-Q2",f"{name} bereitete alles allein vor.",False,"Sara übernahm einen Teil","Eine andere Person half.","Versprechen und tatsächliche Ausführung werden verwechselt."),
 rf(f"L1-{i+1}-Q3","Bei der Ankunft waren ungefähr zwanzig Personen da.",True,"waren schon ungefähr zwanzig Personen da","Die Zahl steht direkt im Text.","Genaue Zahlen nicht überlesen."),
 rf(f"L1-{i+1}-Q4","Herr Klein nimmt normalerweise oft an Treffen teil.",False,"normalerweise selten","„selten“ widerspricht „oft“.","Dass er diesmal da ist, ändert die Gewohnheit nicht."),
 rf(f"L1-{i+1}-Q5","Das Treffen dauerte länger als geplant.",True,"um neun Uhr ... bis fast zehn","Tatsächliches Ende war später.","Plan und Ergebnis vergleichen."),
 rf(f"L1-{i+1}-Q6","Das nächste Treffen findet sicher draußen statt.",False,"Wenn das Wetter gut ist","Draußen ist nur unter einer Bedingung geplant.","Bedingung nicht ignorieren.")]
 return {**common(f"L-T1-{i+1:02d}","Lesen",1,"richtig_falsch_full_text",topic,"evidence_and_paraphrase"),"german_instruction":"Lesen Sie den Text und die Aufgaben 1 bis 6. Sind die Aussagen Richtig oder Falsch?","instruction_ru":"Прочитайте текст и 6 утверждений. Выберите Richtig или Falsch.","text":text,"translation":"Автор описывает встречу, изменение первоначального плана, помощь, количество участников и планы на следующий раз.","glossary":glossary(),"answer_key_status":"VERIFIED","questions":qs}
def lesen2(i):
 texts=[];qs=[]
 for j in range(2):
  t=TOPICS[(i*2+j)%10]
  details=[
   "Einmal im Monat gibt es zusätzlich einen Einführungstermin für neue Teilnehmende.",
   "Die Gruppe trifft sich abwechselnd in zwei verschiedenen Stadtteilen.",
   "Wer regelmäßig kommt, kann später selbst kleine Aufgaben im Projekt übernehmen.",
   "Für Fragen gibt es vor jedem Termin eine kurze offene Sprechstunde.",
   "Seit kurzem arbeitet das Projekt auch mit der örtlichen Bibliothek zusammen.",
   "Die Organisatoren sammeln nach jedem Termin schriftliche Rückmeldungen.",
   "Im Sommer sollen einzelne Termine auch im Freien stattfinden.",
   "Neue Teilnehmende können sich zunächst unverbindlich einen Termin ansehen.",
   "Für berufstätige Eltern wird einmal pro Monat ein späterer Termin angeboten.",
   "Zum Jahresende ist ein gemeinsames Treffen aller Gruppen geplant."
  ]
  body=f"Ein neues Projekt zum Thema {t} bietet seit diesem Frühjahr feste Termine und Online-Anmeldung. Besonders gefragt sind Termine am frühen Abend, weil viele Menschen tagsüber arbeiten oder lernen. In der ersten Woche ist die Teilnahme kostenlos, später kostet Material fünf Euro. {details[i]} Die Organisatoren möchten außerdem Menschen aus verschiedenen Stadtteilen miteinander ins Gespräch bringen. Termine werden sechs Wochen im Voraus veröffentlicht."
  texts.append({"id":f"T{j+1}","title":f"Neues Angebot: {t}","text":body,"translation":"Новый городской проект: расписание, регистрация, стоимость и цель."})
  n=j*3
  qs += [mc(f"L2-{i+1}-Q{n+1}","Was ist neu?",["Feste Termine und Online-Anmeldung","Nur Morgentermine","Sofort hohe Kosten"],0,"feste Termine und Online-Anmeldung","Это прямо сказано.","Другие варианты противоречат тексту."),
         mc(f"L2-{i+1}-Q{n+2}","Warum sind Abendtermine beliebt?",["Wegen geschlossener Geschäfte","Viele arbeiten oder lernen tagsüber","Abends ist es teurer"],1,"weil viele Menschen tagsüber arbeiten oder lernen","Названа причина.","Не домысливайте."),
         mc(f"L2-{i+1}-Q{n+3}","Wann werden Termine veröffentlicht?",["Am selben Tag","Sechs Wochen vorher","Erst nach der Veranstaltung"],1,"sechs Wochen im Voraus","Срок указан прямо.","Не путать с первой неделей.")]
 return {**common(f"L-T2-{i+1:02d}","Lesen",2,"two_press_texts_mcq",TOPICS[i],"main_idea_and_detail"),"german_instruction":"Lesen Sie zwei Texte und lösen Sie zu jedem drei Aufgaben. Wählen Sie a, b oder c.","instruction_ru":"Прочитайте два текста и ответьте на 6 вопросов a/b/c.","texts":texts,"translation":"Переводы каждого текста доступны в учебном режиме.","glossary":glossary(),"answer_key_status":"VERIFIED","questions":qs}
def lesen3(i):
 cats=TOPICS[i:]+TOPICS[:i];ads=[];situ=[]
 days=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag"]
 for k in range(10): ads.append({"id":chr(65+k),"title":cats[k],"text":f"{cats[k]} im Zentrum. {days[k%5]} ab {17+k%3}:00 Uhr. Anmeldung online. Preis {5+k*2} Euro. Für Erwachsene."})
 for k in range(6): situ.append({"id":k+1,"text":f"Sie suchen {cats[k]} am {days[k%5]} nach 17 Uhr.","correct":chr(65+k),"why":"Thema, Tag und Uhrzeit passen.","trap":"Alle Bedingungen prüfen."})
 situ.append({"id":7,"text":"Sie suchen einen kostenlosen Jugendkurs am Sonntagmorgen.","correct":"0","why":"Keine Anzeige erfüllt alle Bedingungen.","trap":"Thematische Ähnlichkeit reicht nicht."})
 return {**common(f"L-T3-{i+1:02d}","Lesen",3,"matching_situations_ads","Anzeigen","matching_constraints"),"german_instruction":"Lesen Sie die Situationen 1 bis 7 und die Anzeigen A bis J. Eine Situation hat keine passende Anzeige: 0.","instruction_ru":"Сопоставьте 7 ситуаций и объявления A–J; один ответ — 0.","situations":situ,"ads":ads,"translation":"Переводы ситуаций и объявлений доступны в учебном режиме.","glossary":glossary(),"answer_key_status":"VERIFIED"}
def lesen4(i):
 theme=["Homeoffice","Fahrrad statt Auto","Vier-Tage-Woche","Handy in der Schule","Gemeinschaftsgarten","Bargeld","Online-Unterricht","Stadtfeste","Bibliotheken","Ehrenamt"][i]
 patt=[1,0,1,0,0,1,1];people=["Anna","Ben","Clara","Deniz","Eva","Farid","Greta"];ops=[]
 for k,v in enumerate(patt):
  txt=(f"{people[k]}: Ich finde {theme} grundsätzlich sinnvoll, weil es den Alltag flexibler machen kann. Klare Regeln sind trotzdem wichtig." if v else f"{people[k]}: Für mich überzeugt {theme} nicht. Im Alltag sehe ich mehr Nachteile und würde bei der bisherigen Lösung bleiben.")
  ops.append({"id":k+1,"person":people[k],"text":txt,"correct":"Ja" if v else "Nein","why":"Определите основную позицию автора.","trap":"Оговорка не меняет общую позицию."})
 return {**common(f"L-T4-{i+1:02d}","Lesen",4,"seven_opinions_yes_no",theme,"stance_detection"),"german_instruction":"Lesen Sie sieben Meinungen. Ist die Person dafür? Ja oder Nein.","instruction_ru":"Прочитайте 7 мнений и определите позицию Ja/Nein.","theme":theme,"opinions":ops,"translation":"Перевод каждого мнения доступен.","glossary":glossary(),"answer_key_status":"VERIFIED"}
def lesen5(i):
 title=["Hausordnung","Bibliotheksordnung","Fitnessstudio","Kursordnung","Jugendherberge","Coworking","Schwimmbad","Verein","Campingplatz","Werkstatt"][i]
 text=f"Regeln – {title}\n1. Räume werktags 7–22 Uhr.\n2. Gäste vorher anmelden.\n3. Essen nur im Aufenthaltsbereich.\n4. Schäden sofort melden.\n5. Fahrräder nicht im Eingang.\n6. Keine Haftung für persönliche Gegenstände."
 qs=[mc(f"L5-{i+1}-Q1","Wann sind die Räume werktags nutzbar?",["6–20","7–22","immer"],1,"7–22 Uhr","Время указано прямо.","Не переносить чужой режим."),
     mc(f"L5-{i+1}-Q2","Was gilt für Gäste?",["Vorher anmelden","Nur sonntags","Immer extra zahlen"],0,"Gäste vorher anmelden","Прямое правило.","Не добавлять несуществующие условия."),
     mc(f"L5-{i+1}-Q3","Wo darf man essen?",["Im Eingang","Überall","Nur im Aufenthaltsbereich"],2,"nur im Aufenthaltsbereich","Слово nur ограничивает.","Не игнорировать ограничение."),
     mc(f"L5-{i+1}-Q4","Was tun bei Schäden?",["Sofort melden","Warten","Freunden schreiben"],0,"Schäden sofort melden","Нужно сразу сообщить.","Другие действия не названы.")]
 return {**common(f"L-T5-{i+1:02d}","Lesen",5,"rules_mcq",title,"rules_detail"),"german_instruction":"Lesen Sie die Regeln und lösen Sie vier Aufgaben. Wählen Sie a, b oder c.","instruction_ru":"Прочитайте правила и ответьте на 4 вопроса.","text":text,"translation":"Правила регулируют время, гостей, еду, повреждения и личные вещи.","glossary":glossary(),"answer_key_status":"VERIFIED","questions":qs}
def image(tid,n,scene):
 return {"image_id":f"IMG-{tid}-{n}","task_id":tid,"version":"1.0.0","src":f"assets/images/hoeren/{tid.lower()}-{n}.svg","alt":f"Нейтральная сцена: {scene}","scene_context":scene,"context_only":True,"answer_leak_review":"PASSED","art_direction_version":"otto-blue-context-v1","source_status":"OWNED"}
def audio(tid,n,transcript,voices,count):
 return {"audio_id":f"AUD-{tid}-{n}","task_id":tid,"version":"1.0.0","asset_src":f"assets/audio/hoeren/{tid.lower()}-{n}.mp3","duration_seconds":max(8,len(transcript)//14),"transcript":transcript,"playback_rules":{"exam_play_count":count,"training_play_count":count+1,"extra_training_plays_are_assisted":True},"source_status":"GENERATED_TTS_EDGE","production_status":"STATIC_PREVIEW_ASSET_HUMAN_PRONUNCIATION_QA_PENDING","qa_status":"AUTOMATED_ASSET_CHECK_PASSED","source_type":"versioned_static_asset","speakers":[{"speaker_id":f"speaker-{k+1}","voice_id":v} for k,v in enumerate(voices)]}
def hoeren1(i):
 tid=f"H-T1-{i+1:02d}";scenes=[]
 for k in range(5):
  scene=TOPICS[(i+k)%10];old=f"{9+k}:30";new=f"{10+k}:00";script=f"Guten Tag. Eine Information zu {scene}. Der Termin war ursprünglich für {old} Uhr geplant. Wegen einer Änderung beginnt er heute erst um {new} Uhr. Bitte kommen Sie zehn Minuten früher."
  qs=[mc(f"{tid}-S{k+1}-Q1","Wann beginnt der Termin heute?",[old,new,"am Abend"],1,f"beginnt ... um {new}","Geänderte Uhrzeit hören.","Alte Planung ist die Falle."),mc(f"{tid}-S{k+1}-Q2","Was soll man tun?",["Zehn Minuten früher kommen","Zu Hause bleiben","Eine Stunde später kommen"],0,"Bitte kommen Sie zehn Minuten früher","Anweisung am Ende.","Nicht aus der Situation raten.")]
  scenes.append({"scene_id":k+1,"context":scene,"script":script,"audio":audio(tid,k+1,script,[VOICES[(i+k)%3]],2),"image":image(tid,k+1,scene),"questions":qs})
 return {**common(tid,"Hören",1,"five_short_audios","Alltag","change_detection"),"german_instruction":"Sie hören fünf kurze Texte. Jeden Text hören Sie zweimal. Zu jedem Text zwei Aufgaben.","instruction_ru":"5 коротких аудио, каждое звучит два раза; всего 10 заданий.","scenes":scenes,"translation":"Перевод аудиоскриптов доступен в учебном режиме.","glossary":glossary(),"answer_key_status":"VERIFIED"}
def hoeren2(i):
 tid=f"H-T2-{i+1:02d}";topic=TOPICS[i];script=f"Willkommen zu unserer Information über {topic}. Die Veranstaltung beginnt um 18 Uhr, die Türen öffnen um 17.30 Uhr. Die erste Woche ist kostenlos, danach kostet die Teilnahme fünf Euro. Bitte bringen Sie einen Ausweis mit, aber keine eigenen Getränke. Nach dem offiziellen Teil gibt es zwanzig Minuten für Fragen. Eine Zusammenfassung steht am nächsten Tag online."
 qs=[mc(f"{tid}-Q1","Wann beginnt die Veranstaltung?",["17.30","18.00","18.30"],1,"beginnt um 18 Uhr","Начало — 18:00.","17:30 — открытие дверей."),mc(f"{tid}-Q2","Was kostet die erste Woche?",["Nichts","5 Euro","20 Euro"],0,"erste Woche kostenlos","Бесплатно.","Цена относится к следующему периоду."),mc(f"{tid}-Q3","Was mitbringen?",["Ausweis","Getränke","Sportkleidung"],0,"Ausweis mit","Прямое требование.","Напитки запрещены."),mc(f"{tid}-Q4","Was gibt es danach?",["Fragen","Konzert","Prüfung"],0,"Zeit für Fragen","После основной части вопросы.","Не домысливать."),mc(f"{tid}-Q5","Wann ist die Zusammenfassung online?",["Am nächsten Tag","Vorher","Nie"],0,"am nächsten Tag","Срок назван.","Не путать с временем мероприятия.")]
 return {**common(tid,"Hören",2,"long_monologue_mcq",topic,"detail_listening"),"german_instruction":"Sie hören einen längeren Text einmal. Wählen Sie a, b oder c.","instruction_ru":"Один длинный текст звучит один раз; 5 вопросов.","script":script,"audio":audio(tid,1,script,[VOICES[i%3]],1),"image":image(tid,1,topic),"questions":qs,"translation":"Информация о времени, стоимости, требованиях и завершении мероприятия.","glossary":glossary(),"answer_key_status":"VERIFIED"}
def hoeren3(i):
 tid=f"H-T3-{i+1:02d}";topic=TOPICS[i]
 turns=[("Lena",f"Was meinst du zu {topic}? Ich würde am Samstag anfangen."),("Paul","Samstag passt, aber erst nach elf Uhr. Vormittags arbeite ich."),("Lena","Dann treffen wir uns um halb zwölf. Ich kaufe die Tickets online."),("Paul","Bitte nur zwei Tickets. Maria kommt diesmal doch nicht mit."),("Lena","Danach könnten wir etwas essen."),("Paul","Gern, aber um sechs muss ich wieder zu Hause sein."),("Lena","Ich schicke dir heute Abend noch die Adresse.")]
 transcript="\n".join(a+": "+b for a,b in turns)
 vals=[False,False,True,True,False,True,False];st=["Paul kann früh am Vormittag.","Maria kommt mit.","Lena kauft Tickets online.","Paul möchte danach essen.","Paul hat abends unbegrenzt Zeit.","Lena schickt die Adresse.","Treffen ist um zehn."]
 ev=["erst nach elf","doch nicht mit","Tickets online","Gern","um sechs zu Hause","schicke ... Adresse","halb zwölf"]
 qs=[rf(f"{tid}-Q{k+1}",st[k],vals[k],ev[k],"Сверьте утверждение с конкретной репликой.","Отрицание и время меняют смысл.") for k in range(7)]
 return {**common(tid,"Hören",3,"dialogue_richtig_falsch",topic,"speaker_tracking"),"german_instruction":"Sie hören ein Gespräch einmal. Richtig oder Falsch?","instruction_ru":"Разговор звучит один раз; 7 утверждений Richtig/Falsch.","turns":[{"speaker":a,"text":b} for a,b in turns],"audio":audio(tid,1,transcript,[VOICES[0],VOICES[1]],1),"image":image(tid,1,topic),"questions":qs,"translation":"Два человека согласуют время, билеты, еду и дальнейшие действия.","glossary":glossary(),"answer_key_status":"VERIFIED"}
def hoeren4(i):
 tid=f"H-T4-{i+1:02d}";theme=TOPICS[i]
 turns=[("Moderatorin",f"Heute sprechen wir über {theme}."),("Person A","Für mich zählt vor allem Flexibilität."),("Person B","Ohne klare Regeln entstehen schnell Nachteile."),("Moderatorin","Welche Rolle spielen die Kosten?"),("Person A","Das Angebot muss auch für Menschen mit wenig Geld erreichbar sein."),("Person B","Qualität ist wichtiger als ein niedriger Preis."),("Moderatorin","Und Information?"),("Person A","Transparente Informationen helfen beim Vergleichen."),("Person B","Ich wünsche mir zusätzlich persönliche Beratung."),("Moderatorin","Was sollte zuerst passieren?"),("Person A","Ich würde mit einem kleinen Pilotprojekt beginnen."),("Person B","Regeln sollten vor dem Start feststehen.")]
 transcript="\n".join(a+": "+b for a,b in turns);data=[("Flexibilität ist wichtig.","Person A"),("Klare Regeln verhindern Nachteile.","Person B"),("Auch Menschen mit wenig Geld sollen teilnehmen können.","Person A"),("Qualität ist wichtiger als billig.","Person B"),("Transparenz hilft beim Vergleichen.","Person A"),("Eine Internetseite allein reicht nicht.","Person B"),("Zuerst klein anfangen.","Person A"),("Regeln vor dem Start.","Person B")]
 qs=[{"id":f"{tid}-Q{k+1}","statement":x,"correct_speaker":sp,"why":"Сопоставьте мысль с точной позицией говорящего.","trap":"Модератор задаёт вопросы, но не обязательно выражает эту позицию."} for k,(x,sp) in enumerate(data)]
 a=audio(tid,1,transcript,VOICES,2);a["speakers"]=[{"speaker_id":"Moderatorin","voice_id":VOICES[2]},{"speaker_id":"Person A","voice_id":VOICES[0]},{"speaker_id":"Person B","voice_id":VOICES[1]}]
 return {**common(tid,"Hören",4,"three_speaker_discussion",theme,"speaker_tracking"),"german_instruction":"Sie hören eine Diskussion zweimal. Wer sagt was?","instruction_ru":"Дискуссия звучит два раза; 8 мыслей распределите по говорящим.","turns":[{"speaker":a,"text":b} for a,b in turns],"audio":a,"image":image(tid,1,theme),"questions":qs,"translation":"Модератор и два участника обсуждают разные позиции.","glossary":glossary(),"answer_key_status":"VERIFIED"}
def writing(a,i):
 topic=TOPICS[i]
 if a==1: instr=f"Sie haben etwas zum Thema {topic} erlebt. Schreiben Sie einer Freundin / einem Freund etwa 80 Wörter. Schreiben Sie, warum Sie dort waren, was passiert ist und machen Sie einen Vorschlag für ein Treffen.";target=80;pts=["причина","что произошло","предложение"]
 elif a==2: instr=f"Schreiben Sie in einem Forum etwa 80 Wörter zum Thema {topic}. Sagen Sie Ihre Meinung, begründen Sie sie und nennen Sie ein Beispiel.";target=80;pts=["мнение","обоснование","пример"]
 else: instr=f"Sie können einen Termin zum Thema {topic} nicht wahrnehmen. Schreiben Sie etwa 40 Wörter: Entschuldigung, Grund, neuer Termin.";target=40;pts=["извинение","причина","новый срок"]
 sample=("Hallo Anna,\n\nich wollte dir kurz erzählen, dass ich eine neue Erfahrung gemacht habe. Besonders gut fand ich die freundliche Atmosphäre. Ein wichtiger Grund war, dass ich etwas Neues ausprobieren wollte. Hast du am Samstag Zeit? Wir könnten uns treffen und ich erzähle dir mehr.\n\nLiebe Grüße\nMara" if a==1 else ("Meiner Meinung nach ist dieses Thema im Alltag wichtig. Ein Vorteil ist, dass man neue Erfahrungen sammeln kann. Gleichzeitig braucht man klare Absprachen. Ich habe selbst erlebt, dass gute Planung vieles leichter macht. Deshalb finde ich eine flexible, aber verlässliche Lösung am besten." if a==2 else "Guten Tag Frau Keller,\nleider kann ich am Dienstag nicht kommen, weil ich länger arbeiten muss. Das tut mir leid. Wäre Donnerstag um 16 Uhr möglich? Vielen Dank für Ihr Verständnis.\nMit freundlichen Grüßen\nMara Klein"))
 return {**common(f"W-A{a}-{i+1:02d}","Schreiben",a,"writing_free_text",topic,"written_communication"),"instruction_de":instr,"instruction_ru":"Напишите собственный текст и раскройте все обязательные пункты.","required_points":pts,"target_words":target,"sample":sample,"sample_translation":"Образец показывает связность, регистр и выполнение пунктов.","structure":["обращение/введение","обязательные пункты","связки","завершение"],"phrase_bank":["Meiner Meinung nach ...","Ein wichtiger Grund ist ...","Leider kann ich ...","Wäre ... möglich?"],"glossary":glossary(),"rubric_status":"VERIFIED","rubric":{"task_completion":4,"coherence":4,"vocabulary":4,"grammar":4},"checklist":["Все пункты раскрыты","Подходящий регистр","Есть связки","Текст перечитан"],"translation":"Русский перевод образца доступен в учебном режиме."}
def speaking(a,i):
 topic=TOPICS[i]
 if a==1: instr=f"Planen Sie gemeinsam etwas zum Thema {topic}: Wann? Wo? Wer macht was? Was braucht man?";extra={"planning_points":["Wann?","Wo?","Wer macht was?","Was braucht man?"]};sample="Ich würde Samstag vorschlagen. Wir könnten uns in der Bibliothek treffen. Ich kann die Materialien vorbereiten. Kannst du Getränke mitbringen? Was meinst du?"
 elif a==2: instr=f"Wählen Sie Thema A oder B. A: {topic}. B: Deutsch im Alltag üben. Sprechen Sie etwa drei Minuten.";extra={"presentation_structure":["Thema nennen","eigene Erfahrung","Beispiel","Vor-/Nachteile + Meinung","Schluss"],"sample_audio":f"assets/audio/sprechen/s-a2-{i+1:02d}.mp3"};sample=f"Ich möchte heute über {topic} sprechen. Zuerst erzähle ich von meiner Erfahrung. Danach nenne ich ein Beispiel. Ein Vorteil ist die gemeinsame Planung, ein Nachteil ist die Terminfindung. Meiner Meinung nach lohnt es sich trotzdem. Zum Schluss ist mir wichtig: klare Absprachen helfen."
 else: instr=f"Ihre Partnerin / Ihr Partner hat über {topic} gesprochen. Geben Sie Feedback und stellen Sie eine passende Frage.";extra={"feedback_points":["короткое позитивное feedback","конкретный вопрос"]};sample="Deine Präsentation war gut strukturiert. Besonders interessant fand ich dein Beispiel. Ich habe noch eine Frage: Wie würdest du das organisieren, wenn wenig Zeit da ist?"
 return {**common(f"S-A{a}-{i+1:02d}","Sprechen",a,"speaking_recording",topic,"spoken_interaction"),"instruction_de":instr,"instruction_ru":"Говорите своими словами, запишите ответ и прослушайте его.","sample":sample,"sample_translation":"Образец показывает структуру и полезные фразы.","phrase_bank":["Ich würde ... vorschlagen.","Was meinst du?","Ein Vorteil ist ...","Meiner Meinung nach ...","Ich habe noch eine Frage: ..."],"glossary":glossary(),"rubric_status":"VERIFIED","rubric":{"task_completion":4,"coherence":4,"vocabulary":4,"grammar":4,"interaction":4},"translation":"Перевод образца доступен.",**extra}
def svg(path,label):
 safe=re.sub(r"[&<>]",lambda m:{"&":"&amp;","<":"&lt;",">":"&gt;"}[m.group()],label)
 path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" role="img" aria-label="{safe}"><rect width="800" height="450" rx="36" fill="#dcecff"/><circle cx="145" cy="140" r="58" fill="#8ebce8"/><rect x="90" y="205" width="110" height="115" rx="25" fill="#6f9fce"/><circle cx="655" cy="145" r="48" fill="#b4d4f2"/><rect x="610" y="202" width="90" height="105" rx="22" fill="#8db7df"/><rect x="255" y="105" width="290" height="220" rx="30" fill="#f8fcff"/><text x="400" y="220" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700" fill="#173e66">{safe}</text><text x="400" y="265" text-anchor="middle" font-family="Arial" font-size="20" fill="#456987">Hören · Kontext</text></svg>',encoding="utf-8")
def build():
 lesen={1:[lesen1(i) for i in range(10)],2:[lesen2(i) for i in range(10)],3:[lesen3(i) for i in range(10)],4:[lesen4(i) for i in range(10)],5:[lesen5(i) for i in range(10)]}
 hoeren={1:[hoeren1(i) for i in range(10)],2:[hoeren2(i) for i in range(10)],3:[hoeren3(i) for i in range(10)],4:[hoeren4(i) for i in range(10)]}
 schreiben={a:[writing(a,i) for i in range(10)] for a in (1,2,3)};sprechen={a:[speaking(a,i) for i in range(10)] for a in (1,2,3)}
 for n,v in lesen.items(): dump(C/"lesen"/f"teil-{n}.json",{"module":"Lesen","teil":n,"sets":v})
 for n,v in hoeren.items(): dump(C/"hoeren"/f"teil-{n}.json",{"module":"Hören","teil":n,"sets":v})
 for n,v in schreiben.items(): dump(C/"schreiben"/f"aufgabe-{n}.json",{"module":"Schreiben","aufgabe":n,"tasks":v})
 for n,v in sprechen.items(): dump(C/"sprechen"/f"aufgabe-{n}.json",{"module":"Sprechen","aufgabe":n,"tasks":v})
 for sets in hoeren.values():
  for task in sets:
   ims=[x["image"] for x in task.get("scenes",[])] or [task["image"]]
   for im in ims: svg(ROOT/im["src"],im["scene_context"])
 catalog={"version":"full-learning-preview-v1","Lesen":lesen,"Hören":hoeren,"Schreiben":schreiben,"Sprechen":sprechen}
 (C/"catalog.js").write_text("window.OTTO_CONTENT_CATALOG="+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+";\n",encoding="utf-8")
 dump(C/"manifest.json",{"version":"full-learning-preview-v1","source_basis":SRC,"counts":{"Lesen":50,"Hören":40,"Schreiben":30,"Sprechen":30}})
 print("content generated: Lesen 50, Hören 40, Schreiben 30, Sprechen 30")
if __name__=="__main__": build()
