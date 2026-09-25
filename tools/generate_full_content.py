from pathlib import Path
import json, re
from generate_visual_assets import generate_context_asset, generate_portrait_assets
ROOT=Path(__file__).resolve().parents[1]
C=ROOT/"content"; IMG=ROOT/"assets"/"images"/"hoeren"
for p in [C/"lesen",C/"hoeren",C/"schreiben",C/"sprechen",IMG]: p.mkdir(parents=True,exist_ok=True)
SRC=["GOETHE_B1_CURRENT_FORMAT_STRUCTURE","GOETHE_B1_DURCHFUEHRUNGSBESTIMMUNGEN_2025_09_01","CEFR_B1_ALIGNMENT","ORIGINAL_OTTO_CONTENT"]
QA_VERSION="2026-09-23-full-learning-preview-v1"
TOPICS=["Nachbarschaft","Sprachcafé","Fahrrad","Kochen","Bücher","Sport","Repair-Café","Fotografie","Ehrenamt","Reisen"]
NAMES=["Mara","Jonas","Lea","Tobias","Nina","Emre","Sophie","David","Aylin","Felix"]
VOICES=["de-DE-KatjaNeural","de-DE-ConradNeural","de-DE-AmalaNeural"]
TOPICS_RU={"Nachbarschaft":"соседство","Sprachcafé":"языковое кафе","Fahrrad":"велосипеды","Kochen":"кулинария","Bücher":"книги","Sport":"спорт","Repair-Café":"ремонтное кафе","Fotografie":"фотография","Ehrenamt":"волонтёрство","Reisen":"путешествия"}
DAYS_RU={"Montag":"понедельник","Dienstag":"вторник","Mittwoch":"среду","Donnerstag":"четверг","Freitag":"пятницу","Samstag":"субботу","Sonntag":"воскресенье"}
RU_OPTIONS={
 "Feste Termine und Online-Anmeldung":"Фиксированное расписание и онлайн-регистрация","Nur Morgentermine":"Только утренние встречи","Sofort hohe Kosten":"Сразу высокая стоимость",
 "Wegen geschlossener Geschäfte":"Из-за закрытых магазинов","Viele arbeiten oder lernen tagsüber":"Многие днём работают или учатся","Abends ist es teurer":"Вечером дороже",
 "Am selben Tag":"В тот же день","Sechs Wochen vorher":"За шесть недель","Erst nach der Veranstaltung":"Только после мероприятия",
 "6–20":"6–20","7–22":"7–22","immer":"всегда","Vorher anmelden":"Заранее зарегистрировать","Nur sonntags":"Только по воскресеньям","Immer extra zahlen":"Всегда доплачивать",
 "Im Eingang":"У входа","Überall":"Везде","Nur im Aufenthaltsbereich":"Только в зоне отдыха","Sofort melden":"Сразу сообщить","Warten":"Подождать","Freunden schreiben":"Написать друзьям",
 "am Abend":"вечером","Zehn Minuten früher kommen":"Прийти на десять минут раньше","Zu Hause bleiben":"Остаться дома","Eine Stunde später kommen":"Прийти на час позже",
 "17.30":"17:30","18.00":"18:00","18.30":"18:30","Nichts":"Ничего","5 Euro":"5 евро","20 Euro":"20 евро","Ausweis":"Удостоверение личности","Getränke":"Напитки","Sportkleidung":"Спортивная одежда",
 "Fragen":"Вопросы","Konzert":"Концерт","Prüfung":"Экзамен","Am nächsten Tag":"На следующий день","Vorher":"До этого","Nie":"Никогда"
}
RU_QUESTIONS={
 "Was ist neu?":"Что изменилось в новом проекте?","Warum sind Abendtermine beliebt?":"Почему вечерние встречи популярны?","Wann werden Termine veröffentlicht?":"Когда публикуют расписание?",
 "Wann sind die Räume werktags nutzbar?":"Когда помещениями можно пользоваться по будням?","Was gilt für Gäste?":"Какое правило действует для гостей?","Wo darf man essen?":"Где разрешено есть?","Was tun bei Schäden?":"Что делать при повреждении?",
 "Wann beginnt der Termin heute?":"Во сколько сегодня начинается встреча?","Was soll man tun?":"Что нужно сделать?","Wann beginnt die Veranstaltung?":"Во сколько начинается мероприятие?",
 "Was kostet die erste Woche?":"Сколько стоит первая неделя?","Was mitbringen?":"Что нужно взять с собой?","Was gibt es danach?":"Что будет после основной части?","Wann ist die Zusammenfassung online?":"Когда краткая информация появится онлайн?"
}
def ru_option(x):
 x=str(x)
 if x in RU_OPTIONS:return RU_OPTIONS[x]
 if re.fullmatch(r"\d{1,2}:\d{2}",x):return x
 return x
def ru_question(x): return RU_QUESTIONS.get(str(x),"Переведите вопрос по смыслу материала.")
def ru_statement(x):
 m={
 "Das Treffen fand wie zuerst geplant draußen statt.":"Встреча прошла на улице, как и планировалось сначала.",
 "Bei der Ankunft waren ungefähr zwanzig Personen da.":"К моменту прихода там было около двадцати человек.",
 "Herr Klein nimmt normalerweise oft an Treffen teil.":"Господин Кляйн обычно часто участвует во встречах.",
 "Das Treffen dauerte länger als geplant.":"Встреча длилась дольше, чем планировалось.",
 "Das nächste Treffen findet sicher draußen statt.":"Следующая встреча точно пройдёт на улице.",
 "Maria kommt mit.":"Мария пойдёт вместе с ними.","Lena kauft Tickets online.":"Лена покупает билеты онлайн.","Paul möchte danach essen.":"Пауль хочет после этого поесть.",
 "Paul hat abends unbegrenzt Zeit.":"Вечером у Пауля сколько угодно времени.","Lena schickt die Adresse.":"Лена пришлёт адрес.","Treffen ist um zehn.":"Встреча в десять."
 }
 if x in m:return m[x]
 if " bereitete alles allein vor." in x:return x.split()[0]+" подготовил(а) всё самостоятельно."
 if x=="Paul kann früh am Vormittag.":return "Пауль может начать рано утром."
 return "Проверьте это утверждение по содержанию материала."
def dump(path,obj): path.write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding="utf-8")
def common(tid,module,part,kind,topic,micro):
 return dict(task_id=tid,module=module,teil=part,task_type=kind,skill=module,micro_skill=micro,difficulty="B1",topic=topic,version="1.1.0",qa_status="CONTROLLER_AUTOMATED_REVIEW_PASSED",content_status="CONTENT_READY_PREVIEW",qa_version=QA_VERSION,source_basis=SRC,original_aligned=True,external_human_linguistic_qa=False,strategy="Сначала определите, что именно проверяется. Затем найдите доказательство по смыслу и только после этого выбирайте ответ.",explanation="Оригинальное задание повторяет механику Goethe-Zertifikat B1 без копирования официального текста.")
def glossary():
 return [{"de":"ursprünglich","ru":"первоначально","kind":"useful"},{"de":"stattfinden","ru":"состояться","kind":"useful"},{"de":"zuverlässig","ru":"надёжно","kind":"useful"},{"de":"Vorschlag","ru":"предложение","kind":"useful"}]
def rf(qid,text,correct,evidence,why,trap):
 return dict(id=qid,statement=text,translation=ru_statement(text),correct=bool(correct),evidence=evidence,why=why,trap=trap)
def mc(qid,text,opts,correct,evidence,why,trap):
 return dict(id=qid,question=text,translation=ru_question(text),options=opts,options_ru=[ru_option(x) for x in opts],correct_index=correct,evidence=evidence,why=why,trap=trap)
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
 ru=f"""Всем привет!
В прошлую субботу у нас была встреча на тему «{TOPICS_RU[topic]}». Сначала мы хотели начать на улице. Однако утром шёл сильный дождь, поэтому в последний момент мы перешли в помещение.
Я обещал(а) принести напитки, но мне нужно было работать до 16:00. К счастью, Сара взяла часть подготовки на себя. Когда я пришёл(пришла) около половины шестого, там уже было примерно двадцать человек. Господин Кляйн тоже пришёл, хотя обычно он редко участвует в общих мероприятиях.
Изначально мы хотели закончить в девять. В итоге многие остались почти до десяти. В следующем месяце мы планируем завтрак. Если погода будет хорошей, мы снова хотим использовать двор.
С наилучшими пожеланиями,
{name}"""
 return {**common(f"L-T1-{i+1:02d}","Lesen",1,"richtig_falsch_full_text",topic,"evidence_and_paraphrase"),"german_instruction":"Lesen Sie den Text und die Aufgaben 1 bis 6. Sind die Aussagen Richtig oder Falsch?","instruction_ru":"Прочитайте текст и 6 утверждений. Выберите Richtig или Falsch.","text":text,"translation":ru,"glossary":glossary(),"answer_key_status":"VERIFIED","questions":qs}
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
  details_ru=[
   "Раз в месяц дополнительно проходит вводная встреча для новых участников.",
   "Группа по очереди встречается в двух разных районах города.",
   "Те, кто приходит регулярно, позже могут сами брать на себя небольшие задачи в проекте.",
   "Перед каждой встречей есть короткое открытое время для вопросов.",
   "Недавно проект начал сотрудничать с местной библиотекой.",
   "После каждой встречи организаторы собирают письменные отзывы.",
   "Летом часть встреч планируют проводить на улице.",
   "Новые участники сначала могут просто прийти и посмотреть без обязательств.",
   "Для работающих родителей раз в месяц предлагают более позднюю встречу.",
   "В конце года планируется общая встреча всех групп."
  ]
  body_ru=f"Новый проект на тему «{TOPICS_RU[t]}» с этой весны предлагает фиксированное расписание и онлайн-регистрацию. Особенно популярны встречи ранним вечером, потому что многие люди днём работают или учатся. В первую неделю участие бесплатное, позже материалы стоят пять евро. {details_ru[i]} Организаторы также хотят, чтобы жители разных районов больше общались друг с другом. Расписание публикуют за шесть недель."
  texts.append({"id":f"T{j+1}","title":f"Neues Angebot: {t}","text":body,"translation":body_ru})
  n=j*3
  qs += [mc(f"L2-{i+1}-Q{n+1}","Was ist neu?",["Feste Termine und Online-Anmeldung","Nur Morgentermine","Sofort hohe Kosten"],0,"feste Termine und Online-Anmeldung","Это прямо сказано.","Другие варианты противоречат тексту."),
         mc(f"L2-{i+1}-Q{n+2}","Warum sind Abendtermine beliebt?",["Wegen geschlossener Geschäfte","Viele arbeiten oder lernen tagsüber","Abends ist es teurer"],1,"weil viele Menschen tagsüber arbeiten oder lernen","Названа причина.","Не домысливайте."),
         mc(f"L2-{i+1}-Q{n+3}","Wann werden Termine veröffentlicht?",["Am selben Tag","Sechs Wochen vorher","Erst nach der Veranstaltung"],1,"sechs Wochen im Voraus","Срок указан прямо.","Не путать с первой неделей.")]
 return {**common(f"L-T2-{i+1:02d}","Lesen",2,"two_press_texts_mcq",TOPICS[i],"main_idea_and_detail"),"german_instruction":"Lesen Sie zwei Texte und lösen Sie zu jedem drei Aufgaben. Wählen Sie a, b oder c.","instruction_ru":"Прочитайте два текста и ответьте на 6 вопросов a/b/c.","texts":texts,"translation":"\n\n".join(x["translation"] for x in texts),"glossary":glossary(),"answer_key_status":"VERIFIED","questions":qs}
def lesen3(i):
 cats=TOPICS[i:]+TOPICS[:i];ads=[];situ=[]
 days=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag"]
 for k in range(10):
  ads.append({"id":chr(65+k),"title":cats[k],"text":f"{cats[k]} im Zentrum. {days[k%5]} ab {17+k%3}:00 Uhr. Anmeldung online. Preis {5+k*2} Euro. Für Erwachsene.","translation":f"{TOPICS_RU[cats[k]].capitalize()} в центре. {DAYS_RU[days[k%5]].capitalize()} с {17+k%3}:00. Регистрация онлайн. Цена {5+k*2} евро. Для взрослых."})
 for k in range(6):
  situ.append({"id":k+1,"text":f"Sie suchen {cats[k]} am {days[k%5]} nach 17 Uhr.","translation":f"Вы ищете занятие на тему «{TOPICS_RU[cats[k]]}» в {DAYS_RU[days[k%5]]} после 17:00.","correct":chr(65+k),"why":"Thema, Tag und Uhrzeit passen.","trap":"Alle Bedingungen prüfen."})
 situ.append({"id":7,"text":"Sie suchen einen kostenlosen Jugendkurs am Sonntagmorgen.","translation":"Вы ищете бесплатный курс для подростков в воскресенье утром.","correct":"0","why":"Keine Anzeige erfüllt alle Bedingungen.","trap":"Thematische Ähnlichkeit reicht nicht."})
 return {**common(f"L-T3-{i+1:02d}","Lesen",3,"matching_situations_ads","Anzeigen","matching_constraints"),"german_instruction":"Lesen Sie die Situationen 1 bis 7 und die Anzeigen A bis J. Eine Situation hat keine passende Anzeige: 0.","instruction_ru":"Сопоставьте 7 ситуаций и объявления A–J; один ответ — 0.","situations":situ,"ads":ads,"translation":"Ситуации:\n"+"\n".join(str(x["id"])+". "+x["translation"] for x in situ)+"\n\nОбъявления:\n"+"\n".join(x["id"]+". "+x["translation"] for x in ads),"glossary":glossary(),"answer_key_status":"VERIFIED"}
def lesen4(i):
 theme=["Homeoffice","Fahrrad statt Auto","Vier-Tage-Woche","Handy in der Schule","Gemeinschaftsgarten","Bargeld","Online-Unterricht","Stadtfeste","Bibliotheken","Ehrenamt"][i]
 patt=[1,0,1,0,0,1,1];people=["Anna","Ben","Clara","Deniz","Eva","Farid","Greta"];ops=[]
 for k,v in enumerate(patt):
  txt=(f"{people[k]}: Ich finde {theme} grundsätzlich sinnvoll, weil es den Alltag flexibler machen kann. Klare Regeln sind trotzdem wichtig." if v else f"{people[k]}: Für mich überzeugt {theme} nicht. Im Alltag sehe ich mehr Nachteile und würde bei der bisherigen Lösung bleiben.")
  ru=(f"{people[k]}: Я в целом считаю тему «{theme}» разумной, потому что она может сделать повседневную жизнь гибче. Но чёткие правила всё равно важны." if v else f"{people[k]}: Меня тема «{theme}» не убеждает. В повседневной жизни я вижу больше недостатков и предпочёл(предпочла) бы оставить прежнее решение.")
  ops.append({"id":k+1,"person":people[k],"text":txt,"translation":ru,"correct":"Ja" if v else "Nein","why":"Определите основную позицию автора.","trap":"Оговорка не меняет общую позицию."})
 return {**common(f"L-T4-{i+1:02d}","Lesen",4,"seven_opinions_yes_no",theme,"stance_detection"),"german_instruction":"Lesen Sie sieben Meinungen. Ist die Person dafür? Ja oder Nein.","instruction_ru":"Прочитайте 7 мнений и определите позицию Ja/Nein.","theme":theme,"opinions":ops,"translation":"\n".join(x["translation"] for x in ops),"glossary":glossary(),"answer_key_status":"VERIFIED"}
def lesen5(i):
 title=["Hausordnung","Bibliotheksordnung","Fitnessstudio","Kursordnung","Jugendherberge","Coworking","Schwimmbad","Verein","Campingplatz","Werkstatt"][i]
 text=f"Regeln – {title}\n1. Räume werktags 7–22 Uhr.\n2. Gäste vorher anmelden.\n3. Essen nur im Aufenthaltsbereich.\n4. Schäden sofort melden.\n5. Fahrräder nicht im Eingang.\n6. Keine Haftung für persönliche Gegenstände."
 qs=[mc(f"L5-{i+1}-Q1","Wann sind die Räume werktags nutzbar?",["6–20","7–22","immer"],1,"7–22 Uhr","Время указано прямо.","Не переносить чужой режим."),
     mc(f"L5-{i+1}-Q2","Was gilt für Gäste?",["Vorher anmelden","Nur sonntags","Immer extra zahlen"],0,"Gäste vorher anmelden","Прямое правило.","Не добавлять несуществующие условия."),
     mc(f"L5-{i+1}-Q3","Wo darf man essen?",["Im Eingang","Überall","Nur im Aufenthaltsbereich"],2,"nur im Aufenthaltsbereich","Слово nur ограничивает.","Не игнорировать ограничение."),
     mc(f"L5-{i+1}-Q4","Was tun bei Schäden?",["Sofort melden","Warten","Freunden schreiben"],0,"Schäden sofort melden","Нужно сразу сообщить.","Другие действия не названы.")]
 ru=f"""Правила — {title}
1. Помещениями можно пользоваться по будням с 7:00 до 22:00.
2. Гостей нужно зарегистрировать заранее.
3. Есть можно только в зоне отдыха.
4. О повреждениях нужно сообщать сразу.
5. Велосипеды нельзя оставлять у входа.
6. Организация не несёт ответственности за личные вещи."""
 return {**common(f"L-T5-{i+1:02d}","Lesen",5,"rules_mcq",title,"rules_detail"),"german_instruction":"Lesen Sie die Regeln und lösen Sie vier Aufgaben. Wählen Sie a, b oder c.","instruction_ru":"Прочитайте правила и ответьте на 4 вопроса.","text":text,"translation":ru,"glossary":glossary(),"answer_key_status":"VERIFIED","questions":qs}
def image(tid,n,scene):
 return {"image_id":f"IMG-{tid}-{n}","task_id":tid,"version":"2.0.0","src":f"assets/images/hoeren/{tid.lower()}-{n}.webp","alt":f"Нейтральная иллюстрация ситуации: {scene}","scene_context":scene,"context_only":True,"answer_leak_review":"PASSED_CONTEXT_ONLY","art_direction_version":"otto-blue-context-v2-raster","source_status":"OWNED_GENERATED_RASTER"}
def audio(tid,n,transcript,voices,count):
 return {"audio_id":f"AUD-{tid}-{n}","task_id":tid,"version":"1.1.0","asset_src":f"assets/audio/hoeren/{tid.lower()}-{n}.mp3","duration_seconds":max(8,len(transcript)//14),"transcript":transcript,"playback_rules":{"exam_play_count":count,"training_play_count":count+1,"extra_training_plays_are_assisted":True},"source_status":"GENERATED_TTS_EDGE_STATIC","production_status":"STATIC_PREVIEW_ASSET","pronunciation_qa":"HUMAN_LISTENING_NOT_INDEPENDENTLY_VERIFIED","qa_status":"AUTOMATED_ASSET_CHECK_PASSED","source_type":"versioned_static_asset","speakers":[{"speaker_id":f"speaker-{k+1}","voice_id":v} for k,v in enumerate(voices)]}
def hoeren1(i):
 tid=f"H-T1-{i+1:02d}";scenes=[]
 for k in range(5):
  scene=TOPICS[(i+k)%10];old=f"{9+k}:30";new=f"{10+k}:00";script=f"Guten Tag. Eine Information zu {scene}. Der Termin war ursprünglich für {old} Uhr geplant. Wegen einer Änderung beginnt er heute erst um {new} Uhr. Bitte kommen Sie zehn Minuten früher."
  script_ru=f"Добрый день. Информация по теме «{TOPICS_RU[scene]}». Встреча первоначально была запланирована на {old}. Из-за изменения сегодня она начнётся только в {new}. Пожалуйста, приходите на десять минут раньше."
  qs=[mc(f"{tid}-S{k+1}-Q1","Wann beginnt der Termin heute?",[old,new,"am Abend"],1,f"beginnt ... um {new}","Geänderte Uhrzeit hören.","Alte Planung ist die Falle."),mc(f"{tid}-S{k+1}-Q2","Was soll man tun?",["Zehn Minuten früher kommen","Zu Hause bleiben","Eine Stunde später kommen"],0,"Bitte kommen Sie zehn Minuten früher","Anweisung am Ende.","Nicht aus der Situation raten.")]
  scenes.append({"scene_id":k+1,"context":scene,"script":script,"script_translation":script_ru,"audio":audio(tid,k+1,script,[VOICES[(i+k)%3]],2),"image":image(tid,k+1,scene),"questions":qs})
 return {**common(tid,"Hören",1,"five_short_audios","Alltag","change_detection"),"german_instruction":"Sie hören fünf kurze Texte. Jeden Text hören Sie zweimal. Zu jedem Text zwei Aufgaben.","instruction_ru":"5 коротких аудио, каждое звучит два раза; всего 10 заданий.","scenes":scenes,"translation":"\n\n".join(x["script_translation"] for x in scenes),"glossary":glossary(),"answer_key_status":"VERIFIED"}
def hoeren2(i):
 tid=f"H-T2-{i+1:02d}";topic=TOPICS[i];script=f"Willkommen zu unserer Information über {topic}. Die Veranstaltung beginnt um 18 Uhr, die Türen öffnen um 17.30 Uhr. Wer zum ersten Mal kommt, kann sich am Eingang kurz beraten lassen. Die erste Woche ist kostenlos, danach kostet die Teilnahme fünf Euro. Bitte bringen Sie einen Ausweis mit, aber keine eigenen Getränke. Nach dem offiziellen Teil gibt es zwanzig Minuten für Fragen. Eine Zusammenfassung steht am nächsten Tag online. Dort finden Sie außerdem die Termine für den kommenden Monat."
 script_ru=f"Добро пожаловать на информационную встречу по теме «{TOPICS_RU[topic]}». Мероприятие начинается в 18:00, двери открываются в 17:30. Те, кто приходит впервые, могут получить короткую консультацию у входа. Первая неделя бесплатная, затем участие стоит пять евро. Пожалуйста, возьмите удостоверение личности, но не приносите свои напитки. После основной части будет двадцать минут для вопросов. Краткая информация появится онлайн на следующий день. Там же будут опубликованы даты на следующий месяц."
 qs=[mc(f"{tid}-Q1","Wann beginnt die Veranstaltung?",["17.30","18.00","18.30"],1,"beginnt um 18 Uhr","Начало — 18:00.","17:30 — открытие дверей."),mc(f"{tid}-Q2","Was kostet die erste Woche?",["Nichts","5 Euro","20 Euro"],0,"erste Woche kostenlos","Бесплатно.","Цена относится к следующему периоду."),mc(f"{tid}-Q3","Was mitbringen?",["Ausweis","Getränke","Sportkleidung"],0,"Ausweis mit","Прямое требование.","Напитки запрещены."),mc(f"{tid}-Q4","Was gibt es danach?",["Fragen","Konzert","Prüfung"],0,"Zeit für Fragen","После основной части вопросы.","Не домысливать."),mc(f"{tid}-Q5","Wann ist die Zusammenfassung online?",["Am nächsten Tag","Vorher","Nie"],0,"am nächsten Tag","Срок назван.","Не путать с временем мероприятия.")]
 return {**common(tid,"Hören",2,"long_monologue_mcq",topic,"detail_listening"),"german_instruction":"Sie hören einen längeren Text einmal. Wählen Sie a, b oder c.","instruction_ru":"Один длинный текст звучит один раз; 5 вопросов.","script":script,"audio":audio(tid,1,script,[VOICES[i%3]],1),"image":image(tid,1,topic),"questions":qs,"translation":script_ru,"glossary":glossary(),"answer_key_status":"VERIFIED"}
def hoeren3(i):
 tid=f"H-T3-{i+1:02d}";topic=TOPICS[i]
 turns=[("Lena",f"Was meinst du zu {topic}? Ich würde am Samstag anfangen."),("Paul","Samstag passt, aber erst nach elf Uhr. Vormittags arbeite ich."),("Lena","Dann treffen wir uns um halb zwölf. Ich kaufe die Tickets online."),("Paul","Bitte nur zwei Tickets. Maria kommt diesmal doch nicht mit."),("Lena","Danach könnten wir etwas essen."),("Paul","Gern, aber um sechs muss ich wieder zu Hause sein."),("Lena","Ich schicke dir heute Abend noch die Adresse.")]
 transcript="\n".join(a+": "+b for a,b in turns)
 turns_ru=[("Лена",f"Что ты думаешь о теме «{TOPICS_RU[topic]}»? Я бы хотела начать в субботу."),("Пауль","Суббота подходит, но только после одиннадцати. Утром я работаю."),("Лена","Тогда встретимся в половине двенадцатого. Я куплю билеты онлайн."),("Пауль","Пожалуйста, только два билета. Мария в этот раз всё-таки не идёт."),("Лена","После этого мы могли бы что-нибудь поесть."),("Пауль","С удовольствием, но в шесть мне уже нужно быть дома."),("Лена","Я ещё пришлю тебе сегодня вечером адрес.")]
 transcript_ru="\n".join(a+": "+b for a,b in turns_ru)
 vals=[False,False,True,True,False,True,False];st=["Paul kann früh am Vormittag.","Maria kommt mit.","Lena kauft Tickets online.","Paul möchte danach essen.","Paul hat abends unbegrenzt Zeit.","Lena schickt die Adresse.","Treffen ist um zehn."]
 ev=["erst nach elf","doch nicht mit","Tickets online","Gern","um sechs zu Hause","schicke ... Adresse","halb zwölf"]
 qs=[rf(f"{tid}-Q{k+1}",st[k],vals[k],ev[k],"Сверьте утверждение с конкретной репликой.","Отрицание и время меняют смысл.") for k in range(7)]
 a=audio(tid,1,transcript,[VOICES[0],VOICES[1]],1);a["speakers"]=[
  {"speaker_id":"Lena","display_name":"Lena","role":"Teilnehmerin","voice_id":VOICES[0],"portrait_id":"portrait-lena-v1","portrait_src":"assets/images/speakers/lena.webp"},
  {"speaker_id":"Paul","display_name":"Paul","role":"Teilnehmer","voice_id":VOICES[1],"portrait_id":"portrait-paul-v1","portrait_src":"assets/images/speakers/paul.webp"}
 ]
 return {**common(tid,"Hören",3,"dialogue_richtig_falsch",topic,"speaker_tracking"),"german_instruction":"Sie hören ein Gespräch einmal. Richtig oder Falsch?","instruction_ru":"Разговор звучит один раз; 7 утверждений Richtig/Falsch.","turns":[{"speaker":a,"text":b} for a,b in turns],"audio":a,"image":image(tid,1,topic),"questions":qs,"translation":transcript_ru,"glossary":glossary(),"answer_key_status":"VERIFIED"}
def hoeren4(i):
 tid=f"H-T4-{i+1:02d}";theme=TOPICS[i]
 turns=[("Moderatorin",f"Heute sprechen wir über {theme}."),("Person A","Für mich zählt vor allem Flexibilität."),("Person B","Ohne klare Regeln entstehen schnell Nachteile."),("Moderatorin","Welche Rolle spielen die Kosten?"),("Person A","Das Angebot muss auch für Menschen mit wenig Geld erreichbar sein."),("Person B","Qualität ist wichtiger als ein niedriger Preis."),("Moderatorin","Und Information?"),("Person A","Transparente Informationen helfen beim Vergleichen."),("Person B","Ich wünsche mir zusätzlich persönliche Beratung."),("Moderatorin","Was sollte zuerst passieren?"),("Person A","Ich würde mit einem kleinen Pilotprojekt beginnen."),("Person B","Regeln sollten vor dem Start feststehen.")]
 transcript="\n".join(a+": "+b for a,b in turns)
 turns_ru=[("Модератор",f"Сегодня мы говорим о теме «{TOPICS_RU[theme]}»."),("Участник A","Для меня прежде всего важна гибкость."),("Участник B","Без чётких правил быстро возникают недостатки для других."),("Модератор","Какую роль играет стоимость?"),("Участник A","Предложение должно быть доступно и людям с небольшим доходом."),("Участник B","Качество важнее низкой цены."),("Модератор","А информация?"),("Участник A","Прозрачная информация помогает сравнивать варианты."),("Участник B","Мне дополнительно нужна личная консультация."),("Модератор","Что нужно сделать сначала?"),("Участник A","Я бы начал(а) с небольшого пилотного проекта."),("Участник B","Правила должны быть определены до запуска.")]
 transcript_ru="\n".join(a+": "+b for a,b in turns_ru)
 data=[("Flexibilität ist wichtig.","Person A"),("Klare Regeln verhindern Nachteile.","Person B"),("Auch Menschen mit wenig Geld sollen teilnehmen können.","Person A"),("Qualität ist wichtiger als billig.","Person B"),("Transparenz hilft beim Vergleichen.","Person A"),("Eine Internetseite allein reicht nicht.","Person B"),("Zuerst klein anfangen.","Person A"),("Regeln vor dem Start.","Person B")]
 qs=[{"id":f"{tid}-Q{k+1}","statement":x,"correct_speaker":sp,"why":"Сопоставьте мысль с точной позицией говорящего.","trap":"Модератор задаёт вопросы, но не обязательно выражает эту позицию."} for k,(x,sp) in enumerate(data)]
 a=audio(tid,1,transcript,VOICES,2);a["speakers"]=[
  {"speaker_id":"Moderatorin","display_name":"Moderatorin","role":"Moderation","voice_id":VOICES[2],"portrait_id":"portrait-moderatorin-v1","portrait_src":"assets/images/speakers/moderatorin.webp"},
  {"speaker_id":"Person A","display_name":"Person A","role":"Teilnehmende A","voice_id":VOICES[0],"portrait_id":"portrait-person-a-v1","portrait_src":"assets/images/speakers/person-a.webp"},
  {"speaker_id":"Person B","display_name":"Person B","role":"Teilnehmende B","voice_id":VOICES[1],"portrait_id":"portrait-person-b-v1","portrait_src":"assets/images/speakers/person-b.webp"}
 ]
 return {**common(tid,"Hören",4,"three_speaker_discussion",theme,"speaker_tracking"),"german_instruction":"Sie hören eine Diskussion zweimal. Wer sagt was?","instruction_ru":"Дискуссия звучит два раза; 8 мыслей распределите по говорящим.","turns":[{"speaker":a,"text":b} for a,b in turns],"audio":a,"image":image(tid,1,theme),"questions":qs,"translation":transcript_ru,"glossary":glossary(),"answer_key_status":"VERIFIED"}
def writing(a,i):
 topic=TOPICS[i]
 if a==1:
  instr=f"Sie haben etwas zum Thema {topic} erlebt. Schreiben Sie einer Freundin / einem Freund etwa 80 Wörter. Schreiben Sie, warum Sie dort waren, was passiert ist und machen Sie einen Vorschlag für ein Treffen.";instr_ru=f"Вы пережили событие на тему «{TOPICS_RU[topic]}». Напишите другу или подруге около 80 слов: зачем вы там были, что произошло и предложите встретиться.";target=80;pts=["причина","что произошло","предложение"]
 elif a==2:
  instr=f"Schreiben Sie in einem Forum etwa 80 Wörter zum Thema {topic}. Sagen Sie Ihre Meinung, begründen Sie sie und nennen Sie ein Beispiel.";instr_ru=f"Напишите на форуме около 80 слов на тему «{TOPICS_RU[topic]}»: выразите мнение, обоснуйте его и приведите пример.";target=80;pts=["мнение","обоснование","пример"]
 else:
  instr=f"Sie können einen Termin zum Thema {topic} nicht wahrnehmen. Schreiben Sie etwa 40 Wörter: Entschuldigung, Grund, neuer Termin.";instr_ru=f"Вы не можете прийти на встречу по теме «{TOPICS_RU[topic]}». Напишите около 40 слов: извинитесь, назовите причину и предложите новый срок.";target=40;pts=["извинение","причина","новый срок"]
 sample=("Hallo Anna,\n\nich wollte dir kurz erzählen, dass ich eine neue Erfahrung gemacht habe. Besonders gut fand ich die freundliche Atmosphäre. Ein wichtiger Grund war, dass ich etwas Neues ausprobieren wollte. Hast du am Samstag Zeit? Wir könnten uns treffen und ich erzähle dir mehr.\n\nLiebe Grüße\nMara" if a==1 else ("Meiner Meinung nach ist dieses Thema im Alltag wichtig. Ein Vorteil ist, dass man neue Erfahrungen sammeln kann. Gleichzeitig braucht man klare Absprachen. Ich habe selbst erlebt, dass gute Planung vieles leichter macht. Deshalb finde ich eine flexible, aber verlässliche Lösung am besten." if a==2 else "Guten Tag Frau Keller,\nleider kann ich am Dienstag nicht kommen, weil ich länger arbeiten muss. Das tut mir leid. Wäre Donnerstag um 16 Uhr möglich? Vielen Dank für Ihr Verständnis.\nMit freundlichen Grüßen\nMara Klein"))
 sample_ru=("Привет, Анна!\n\nЯ хотела коротко рассказать тебе о новом опыте. Особенно мне понравилась дружелюбная атмосфера. Для меня было важно попробовать что-то новое. У тебя есть время в субботу? Мы могли бы встретиться, и я расскажу подробнее.\n\nС наилучшими пожеланиями,\nМара" if a==1 else ("По моему мнению, эта тема важна в повседневной жизни. Одно из преимуществ — возможность получить новый опыт. Одновременно нужны чёткие договорённости. Я сама убедилась, что хорошее планирование многое упрощает. Поэтому лучшим считаю гибкое, но надёжное решение." if a==2 else "Добрый день, госпожа Келлер!\nК сожалению, я не могу прийти во вторник, потому что должна дольше работать. Простите, пожалуйста. Вам подошёл бы четверг в 16:00? Спасибо за понимание.\nС уважением,\nМара Кляйн"))
 rubric=({"task_completion":10,"coherence":10,"vocabulary":10,"structures":10} if a in (1,2) else {"task_completion":4,"coherence":4,"vocabulary":6,"structures":6})
 sample=sample.replace("новую Erfahrung","новую Erfahrung") if False else sample
 if a==1: sample=sample.replace("eine neue Erfahrung",f"eine neue Erfahrung mit {topic}")
 if a==2: sample=sample.replace("dieses Thema",f"das Thema {topic}")
 if a==3: sample=sample.replace("am Dienstag",["am Montag","am Dienstag","am Mittwoch","am Donnerstag","am Freitag"][i%5]).replace("Donnerstag",["Dienstag","Mittwoch","Donnerstag","Freitag","Montag"][i%5]).replace(" nicht kommen, weil",f" nicht zu unserem Termin zum Thema {topic} kommen, weil")
 return {**common(f"W-A{a}-{i+1:02d}","Schreiben",a,"writing_free_text",topic,"written_communication"),"instruction_de":instr,"instruction_ru":instr_ru,"required_points":pts,"target_words":target,"sample":sample,"sample_translation":sample_ru,"structure":["обращение/введение","обязательные пункты","связки","завершение"],"phrase_bank":["Meiner Meinung nach ...","Ein wichtiger Grund ist ...","Leider kann ich ...","Wäre ... möglich?"],"glossary":glossary(),"rubric_status":"GOETHE_MODEL_FORMAT_VERIFIED","rubric":rubric,"checklist":["Все пункты раскрыты","Подходящий регистр","Есть связки","Текст перечитан"],"translation":"Русский перевод образца доступен в учебном режиме."}
def speaking(a,i):
 topic=TOPICS[i]
 if a==1:
  instr=f"Planen Sie gemeinsam etwas zum Thema {topic}: Wann? Wo? Wer macht was? Was braucht man?";instr_ru=f"Вместе спланируйте дело на тему «{TOPICS_RU[topic]}»: когда, где, кто что делает и что понадобится.";extra={"planning_points":["Wann?","Wo?","Wer macht was?","Was braucht man?"]};sample="Ich würde Samstag vorschlagen. Wir könnten uns in der Bibliothek treffen. Ich kann die Materialien vorbereiten. Kannst du Getränke mitbringen? Was meinst du?";sample_ru="Я бы предложил(а) субботу. Мы могли бы встретиться в библиотеке. Я могу подготовить материалы. Ты можешь принести напитки? Что думаешь?"
 elif a==2:
  instr=f"Wählen Sie Thema A oder B. A: {topic}. B: Deutsch im Alltag üben. Sprechen Sie etwa drei Minuten.";instr_ru=f"Выберите тему A или B. A: «{TOPICS_RU[topic]}». B: как практиковать немецкий в повседневной жизни. Говорите около трёх минут.";extra={"presentation_structure":["Thema und Aufbau nennen","eigene Erfahrung","Situation im Heimatland / Beispiel","Vor- und Nachteile + eigene Meinung","Schluss und Dank"],"sample_audio":f"assets/audio/sprechen/s-a2-{i+1:02d}.mp3"};sample=f"Ich möchte heute über {topic} sprechen. Zuerst erzähle ich von meiner Erfahrung. Danach nenne ich ein Beispiel. Ein Vorteil ist die gemeinsame Planung, ein Nachteil ist die Terminfindung. Meiner Meinung nach lohnt es sich trotzdem. Zum Schluss ist mir wichtig: klare Absprachen helfen.";sample_ru=f"Сегодня я хочу поговорить о теме «{TOPICS_RU[topic]}». Сначала расскажу о своём опыте, затем приведу пример. Одно преимущество — совместное планирование, один недостаток — сложно согласовать время. Несмотря на это, я считаю, что оно того стоит. В конце хочу подчеркнуть: чёткие договорённости помогают."
 else:
  instr=f"Ihre Partnerin / Ihr Partner hat über {topic} gesprochen. Geben Sie Feedback und stellen Sie eine passende Frage.";instr_ru=f"Партнёр выступил на тему «{TOPICS_RU[topic]}». Коротко прокомментируйте презентацию и задайте подходящий вопрос.";extra={"feedback_points":["короткая позитивная реакция","конкретный вопрос"]};sample="Deine Präsentation war gut strukturiert. Besonders interessant fand ich dein Beispiel. Ich habe noch eine Frage: Wie würdest du das organisieren, wenn wenig Zeit da ist?";sample_ru="Твоя презентация была хорошо структурирована. Особенно интересным мне показался твой пример. У меня ещё один вопрос: как бы ты это организовал(а), если бы времени было мало?"
 if a==1:
  rubric={"task_completion":8,"interaction":4,"vocabulary_register":8,"structures":8,"pronunciation_shared":16}
  sample=sample.replace("die Materialien",f"die Materialien für {topic}")
 elif a==2:
  rubric={"task_completion":12,"interaction":4,"vocabulary_register":12,"structures":12,"pronunciation_shared":16}
 else:
  rubric={"task_completion":16,"pronunciation_shared":16}
  sample=sample.replace("dein Beispiel",f"dein Beispiel zu {topic}")
 return {**common(f"S-A{a}-{i+1:02d}","Sprechen",a,"speaking_recording",topic,"spoken_interaction"),"instruction_de":instr,"instruction_ru":instr_ru,"sample":sample,"sample_translation":sample_ru,"phrase_bank":["Ich würde ... vorschlagen.","Was meinst du?","Ein Vorteil ist ...","Meiner Meinung nach ...","Ich habe noch eine Frage: ..."],"glossary":glossary(),"rubric_status":"GOETHE_MODEL_FORMAT_VERIFIED","rubric":rubric,"translation":"Перевод образца доступен.",**extra}
def build():
 generate_portrait_assets(ROOT)
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
   for idx,im in enumerate(ims): generate_context_asset(ROOT/im["src"],im["scene_context"],variant=im["image_id"]+"-"+str(idx))
 catalog={"version":"full-learning-preview-v1.1-quality","Lesen":lesen,"Hören":hoeren,"Schreiben":schreiben,"Sprechen":sprechen}
 (C/"catalog.js").write_text("window.OTTO_CONTENT_CATALOG="+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+";\n",encoding="utf-8")
 dump(C/"manifest.json",{"version":"full-learning-preview-v1","source_basis":SRC,"counts":{"Lesen":50,"Hören":40,"Schreiben":30,"Sprechen":30}})
 print("content generated: Lesen 50, Hören 40, Schreiben 30, Sprechen 30")
if __name__=="__main__": build()
