(function(root,factory){
  const data=factory();
  if(typeof module==='object'&&module.exports)module.exports=data;
  root.OTTO_DIAGNOSTIC_BANK=data;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  return {
  "version": "placement-v1.0.0",
  "bands": [
    "A1.1",
    "A1.2",
    "A2.1",
    "A2.2",
    "B1.1",
    "B1.2"
  ],
  "sources": {
    "CEFR_2020": {
      "id": "CEFR_2020",
      "family": "Council of Europe CEFR Companion Volume / CEFR descriptors",
      "url": "https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions",
      "note": "Primary framework for A1/A2/B1 can-do progression. OTTO sub-bands .1/.2 are internal placement bands, not official CEFR levels."
    },
    "GOETHE_A1": {
      "id": "GOETHE_A1",
      "family": "Goethe-Zertifikat A1 Modellsatz/Übungssätze",
      "url": "https://www.goethe.de/ins/de/de/prf/prf/gzsd1/ueb.html",
      "note": "Primary Goethe practice family used to calibrate lower-end task length, density and communicative functions; no item copied."
    },
    "GOETHE_A2": {
      "id": "GOETHE_A2",
      "family": "Goethe-Zertifikat A2 Modellsatz/Übungssatz",
      "url": "https://www.goethe.de/ins/de/de/prf/prf/gzsd2/ub2.html",
      "note": "Primary Goethe practice family used to calibrate A2 task length, density, distractors and modalities; no item copied."
    },
    "GOETHE_B1": {
      "id": "GOETHE_B1",
      "family": "Goethe-Zertifikat B1 Modellsatz/Übungssatz Erwachsene",
      "url": "https://www.goethe.de/ins/be/de/spr/prf/gzb1/ueb.html",
      "note": "Primary Goethe B1 task-map and difficulty reference; no item copied."
    },
    "GOETHE_B1_RULES": {
      "id": "GOETHE_B1_RULES",
      "family": "Goethe-Zertifikat B1 Durchführungsbestimmungen",
      "url": "https://www.goethe.de/pro/relaunch/prf/id/Durchfuehrungsbestimmungen_B1.pdf",
      "note": "Current exam administration/rules reference (Stand 1 September 2025)."
    }
  },
  "items": [
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A11-V1",
      "modality": "text",
      "skill": "vocabulary",
      "micro_skill": "everyday_signs",
      "target_band": "A1.1",
      "cefr_level": "A1",
      "difficulty_boundary": "within_A1.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Was bedeutet „geschlossen“ an einer Tür?",
      "options": [
        "Man kann jetzt nicht hinein.",
        "Man muss Eintritt bezahlen.",
        "Man soll warten, bis jemand anruft."
      ],
      "correct_answer": 0,
      "grammar_tags": [],
      "vocabulary_function_tags": [
        "public_signs"
      ],
      "cefr_alignment_note": "Can understand very common words and simple notices when the situation is familiar.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 25,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A11-G1",
      "modality": "text",
      "skill": "grammar",
      "micro_skill": "present_tense",
      "target_band": "A1.1",
      "cefr_level": "A1",
      "difficulty_boundary": "within_A1.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Wählen Sie den richtigen Satz.",
      "options": [
        "Ich wohne in Berlin.",
        "Ich wohnen in Berlin.",
        "Ich wohnt in Berlin."
      ],
      "correct_answer": 0,
      "grammar_tags": [
        "praesens",
        "verb_agreement"
      ],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Basic control of simple memorised sentence patterns.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 20,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A11-R1",
      "modality": "text",
      "skill": "Lesen",
      "micro_skill": "detail",
      "target_band": "A1.1",
      "cefr_level": "A1",
      "difficulty_boundary": "A1.1>A1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": "Hallo Lea, der Kurs beginnt morgen nicht um neun, sondern um zehn Uhr. Bis morgen!",
      "audio_script": null,
      "prompt": "Wann soll Lea kommen?",
      "options": [
        "Um 9 Uhr.",
        "Um 10 Uhr.",
        "Am Abend."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can understand very short simple messages and pick out a familiar concrete detail.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 35,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A11-H1",
      "modality": "audio",
      "skill": "Hören",
      "micro_skill": "detail",
      "target_band": "A1.1",
      "cefr_level": "A1",
      "difficulty_boundary": "within_A1.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": "Hallo Paul. Wir treffen uns heute nicht am Bahnhof. Komm bitte um vier Uhr ins Café neben der Schule.",
      "prompt": "Wo treffen sich die Personen?",
      "options": [
        "Am Bahnhof.",
        "Im Café.",
        "In der Schule."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can recognise familiar words and very basic information in clear slow speech.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 35,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A11-V2",
      "modality": "text",
      "skill": "vocabulary",
      "micro_skill": "transactional_language",
      "target_band": "A1.1",
      "cefr_level": "A1",
      "difficulty_boundary": "within_A1.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Welche Antwort passt? „Wie viel kostet das Brot?“",
      "options": [
        "Zwei Euro fünfzig.",
        "Um halb drei.",
        "Im Supermarkt."
      ],
      "correct_answer": 0,
      "grammar_tags": [],
      "vocabulary_function_tags": [
        "shopping",
        "prices"
      ],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 25,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A11-G2",
      "modality": "text",
      "skill": "grammar",
      "micro_skill": "present_tense",
      "target_band": "A1.1",
      "cefr_level": "A1",
      "difficulty_boundary": "within_A1.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Ergänzen Sie: „Maria ___ heute nicht.“",
      "options": [
        "arbeitet",
        "arbeiten",
        "arbeitest"
      ],
      "correct_answer": 0,
      "grammar_tags": [
        "praesens",
        "verb_agreement"
      ],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 20,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A12-V1",
      "modality": "text",
      "skill": "vocabulary",
      "micro_skill": "instructions",
      "target_band": "A1.2",
      "cefr_level": "A1",
      "difficulty_boundary": "within_A1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Was bedeutet „Bitte mitbringen“?",
      "options": [
        "Etwas zu Hause lassen.",
        "Etwas zum Termin dabeihaben.",
        "Etwas im Geschäft kaufen."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [
        "appointments",
        "instructions"
      ],
      "cefr_alignment_note": "Can understand frequently used expressions related to immediate practical needs.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 30,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A12-G1",
      "modality": "text",
      "skill": "grammar",
      "micro_skill": "modal_word_order",
      "target_band": "A1.2",
      "cefr_level": "A1",
      "difficulty_boundary": "within_A1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Wählen Sie den richtigen Satz.",
      "options": [
        "Ich kann heute nicht kommen.",
        "Ich heute kann nicht kommen.",
        "Ich kann nicht heute kommen?"
      ],
      "correct_answer": 0,
      "grammar_tags": [
        "modalverben",
        "satzklammer"
      ],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can use simple sentence patterns with common modal constructions.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 25,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A12-R1",
      "modality": "text",
      "skill": "Lesen",
      "micro_skill": "sequence_change",
      "target_band": "A1.2",
      "cefr_level": "A1",
      "difficulty_boundary": "within_A1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": "Liebe Nina, dein Termin am Donnerstag fällt aus. Bitte komm stattdessen am Freitag um 11 Uhr. Falls das nicht geht, ruf uns morgen an.",
      "audio_script": null,
      "prompt": "Was soll Nina tun?",
      "options": [
        "Heute zum Arzt gehen.",
        "Morgen um 11 Uhr anrufen.",
        "Am Freitag um 11 Uhr kommen."
      ],
      "correct_answer": 2,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can understand short simple personal/practical messages with explicit time information.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 45,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A12-H1",
      "modality": "audio",
      "skill": "Hören",
      "micro_skill": "change_detection",
      "target_band": "A1.2",
      "cefr_level": "A1",
      "difficulty_boundary": "within_A1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": "Achtung, Fahrgäste. Der Bus nach Mainz um acht Uhr dreißig hat heute fünfzehn Minuten Verspätung. Abfahrt ist also um acht Uhr fünfundvierzig.",
      "prompt": "Wann fährt der Bus?",
      "options": [
        "Um 8:15 Uhr.",
        "Um 8:30 Uhr.",
        "Um 8:45 Uhr."
      ],
      "correct_answer": 2,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can catch clearly articulated everyday announcements with familiar numbers/times.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 40,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A12-R2",
      "modality": "text",
      "skill": "Lesen",
      "micro_skill": "purpose",
      "target_band": "A1.2",
      "cefr_level": "A1",
      "difficulty_boundary": "within_A1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": "Hallo Sara, ich schaffe es heute leider nicht. Können wir uns morgen nach der Arbeit treffen? Schreib mir bitte, ob 18 Uhr passt.",
      "audio_script": null,
      "prompt": "Warum schreibt Tom?",
      "options": [
        "Er lädt zu einem Essen ein.",
        "Er sagt ein Treffen ab und schlägt einen neuen Termin vor.",
        "Er fragt nach einer Adresse."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 45,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A12-G2",
      "modality": "text",
      "skill": "grammar",
      "micro_skill": "modal_infinitive",
      "target_band": "A1.2",
      "cefr_level": "A1",
      "difficulty_boundary": "within_A1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Ergänzen Sie: „Am Samstag ___ ich meine Eltern besuchen.“",
      "options": [
        "möchte",
        "möchten",
        "möchtest"
      ],
      "correct_answer": 0,
      "grammar_tags": [
        "modalverben",
        "infinitiv"
      ],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 25,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A21-V1",
      "modality": "text",
      "skill": "vocabulary",
      "micro_skill": "functional_paraphrase",
      "target_band": "A2.1",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Welche Formulierung passt zu „einen Termin vereinbaren“?",
      "options": [
        "einen Termin ausmachen",
        "einen Termin verlieren",
        "einen Termin bezahlen"
      ],
      "correct_answer": 0,
      "grammar_tags": [],
      "vocabulary_function_tags": [
        "appointments",
        "paraphrase"
      ],
      "cefr_alignment_note": "Can understand high-frequency vocabulary related to areas of most immediate relevance.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 30,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A21-G1",
      "modality": "text",
      "skill": "grammar",
      "micro_skill": "perfect_word_order",
      "target_band": "A2.1",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Wählen Sie den richtigen Satz.",
      "options": [
        "Gestern habe ich lange gearbeitet.",
        "Gestern ich habe lange gearbeitet.",
        "Gestern habe lange ich gearbeitet."
      ],
      "correct_answer": 0,
      "grammar_tags": [
        "perfekt",
        "satzklammer",
        "inversion"
      ],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can use simple structures correctly in familiar situations, though with systematic basic errors.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 30,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A21-R1",
      "modality": "text",
      "skill": "Lesen",
      "micro_skill": "matching_constraints",
      "target_band": "A2.1",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": "Computerkurs für Einsteiger: Dienstag und Donnerstag, 18:30–20:00 Uhr. Vorkenntnisse sind nicht nötig. Der Kurs richtet sich an Erwachsene, die Computer im Alltag sicherer nutzen möchten.",
      "audio_script": null,
      "prompt": "Wer kann an dem Kurs teilnehmen?",
      "options": [
        "Nur Personen mit viel Computererfahrung.",
        "Personen ohne Vorkenntnisse, die am Abend Zeit haben.",
        "Nur Studierende unter 25."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can find specific predictable information in simple everyday material and understand short descriptions.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 55,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A21-H1",
      "modality": "audio",
      "skill": "Hören",
      "micro_skill": "reason",
      "target_band": "A2.1",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": "Guten Tag. Die Informationsveranstaltung am Mittwoch muss leider auf Freitag verschoben werden. Unsere Referentin ist krank und kann erst Ende der Woche wieder kommen. Die Uhrzeit bleibt unverändert: neunzehn Uhr.",
      "prompt": "Warum wird die Veranstaltung verschoben?",
      "options": [
        "Weil der Raum nicht frei ist.",
        "Weil die Referentin krank ist.",
        "Weil zu wenige Personen kommen."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can understand the main point in short clear messages and announcements.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 50,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A21-G2",
      "modality": "text",
      "skill": "grammar",
      "micro_skill": "subordinate_clause_reason",
      "target_band": "A2.1",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Ergänzen Sie: „Ich bleibe heute zu Hause, ___ ich Kopfschmerzen habe.“",
      "options": [
        "weil",
        "aber",
        "oder"
      ],
      "correct_answer": 0,
      "grammar_tags": [
        "weil",
        "nebensatz"
      ],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 25,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A21-R2",
      "modality": "text",
      "skill": "Lesen",
      "micro_skill": "detail",
      "target_band": "A2.1",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": "Unser Sportzentrum kann auch von Gästen genutzt werden. Bitte melden Sie sich vor dem ersten Besuch telefonisch an. Am Empfang erhalten Sie dann eine Tageskarte. Mitglieder brauchen keine Tageskarte.",
      "audio_script": null,
      "prompt": "Was ist für Gäste wichtig?",
      "options": [
        "Sie müssen sich vorher telefonisch anmelden.",
        "Sie dürfen nur am Wochenende kommen.",
        "Sie bezahlen immer Eintritt."
      ],
      "correct_answer": 0,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 50,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A22-V1",
      "modality": "text",
      "skill": "vocabulary",
      "micro_skill": "paraphrase",
      "target_band": "A2.2",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Welche Aussage bedeutet ungefähr dasselbe? „Die Teilnahme ist kostenlos.“",
      "options": [
        "Man muss sich nicht anmelden.",
        "Man bezahlt nichts für die Teilnahme.",
        "Man bekommt das Geld später zurück."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [
        "services",
        "cost"
      ],
      "cefr_alignment_note": "Can understand enough to manage routine information with common paraphrases.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 35,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A22-G1",
      "modality": "text",
      "skill": "grammar",
      "micro_skill": "embedded_question",
      "target_band": "A2.2",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Wählen Sie den richtigen Satz.",
      "options": [
        "Ich weiß nicht, ob der Kurs noch Plätze frei hat.",
        "Ich weiß nicht, ob hat der Kurs noch Plätze frei.",
        "Ich weiß nicht, der Kurs ob noch Plätze frei hat."
      ],
      "correct_answer": 0,
      "grammar_tags": [
        "ob_satz",
        "nebensatz"
      ],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can use frequently occurring subordination patterns in predictable situations.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 35,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A22-R1",
      "modality": "text",
      "skill": "Lesen",
      "micro_skill": "purpose_paraphrase",
      "target_band": "A2.2",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": "Seit diesem Monat können Kundinnen und Kunden unsere Energieberatung auch per Video nutzen. Das Angebot richtet sich besonders an Berufstätige, für die ein Termin während der normalen Öffnungszeiten schwer zu organisieren ist. Persönliche Beratung vor Ort bleibt weiterhin möglich.",
      "audio_script": null,
      "prompt": "Warum bietet die Firma die Beratung auch online an?",
      "options": [
        "Weil alle Mitarbeitenden zu Hause arbeiten.",
        "Damit Kundinnen und Kunden mit wenig Zeit leichter teilnehmen können.",
        "Weil persönliche Termine nicht mehr erlaubt sind."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can understand short straightforward factual texts and infer an explicit communicative purpose from familiar context.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 65,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A22-H1",
      "modality": "audio",
      "skill": "Hören",
      "micro_skill": "decision_change",
      "target_band": "A2.2",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": "Frau: Eigentlich wollte ich morgen mit dem Auto nach Köln fahren. Mann: Auf der Autobahn gibt es eine große Baustelle. Warum nimmst du nicht den Zug? Frau: Stimmt, dann kann ich unterwegs noch arbeiten. Gut, ich buche gleich eine Fahrkarte.",
      "prompt": "Was entscheidet die Frau am Ende?",
      "options": [
        "Sie fährt mit dem Zug.",
        "Sie fährt mit dem Auto.",
        "Sie bleibt zu Hause."
      ],
      "correct_answer": 0,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can generally identify the topic and follow changes in simple conversations spoken clearly.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 55,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A22-G2",
      "modality": "text",
      "skill": "grammar",
      "micro_skill": "perfect_auxiliary",
      "target_band": "A2.2",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Ergänzen Sie: „Obwohl es stark geregnet hat, ___ wir spazieren gegangen.“",
      "options": [
        "sind",
        "haben",
        "werden"
      ],
      "correct_answer": 0,
      "grammar_tags": [
        "perfekt",
        "obwohl"
      ],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 30,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A22-R2",
      "modality": "text",
      "skill": "Lesen",
      "micro_skill": "detail_paraphrase",
      "target_band": "A2.2",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": "Die Stadtbibliothek schließt weiterhin um 19 Uhr. Neu ist jedoch ein Rückgabeautomat neben dem Haupteingang. Dort können ausgeliehene Medien täglich bis 23 Uhr zurückgegeben werden. Eine Ausleihe ist am Automaten nicht möglich.",
      "audio_script": null,
      "prompt": "Welche Aussage ist richtig?",
      "options": [
        "Die Bibliothek schließt künftig früher.",
        "Man kann Medien jetzt auch nach der Schließung zurückgeben.",
        "Die Rückgabeautomaten funktionieren nur am Wochenende."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 60,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B11-V1",
      "modality": "text",
      "skill": "vocabulary",
      "micro_skill": "abstract_paraphrase",
      "target_band": "B1.1",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Welche Formulierung passt am besten zu „eine Entscheidung rückgängig machen“?",
      "options": [
        "eine Entscheidung erklären",
        "eine Entscheidung ändern und nicht mehr durchführen",
        "eine Entscheidung sofort veröffentlichen"
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [
        "decisions",
        "paraphrase"
      ],
      "cefr_alignment_note": "Can understand the main points of clear standard input on familiar matters and a wider everyday vocabulary.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 40,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B11-G1",
      "modality": "text",
      "skill": "grammar",
      "micro_skill": "concession_word_order",
      "target_band": "B1.1",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Wählen Sie den Satz mit korrekter Wortstellung.",
      "options": [
        "Obwohl der Weg länger ist, fahre ich mit dem Fahrrad.",
        "Obwohl der Weg ist länger, fahre ich mit dem Fahrrad.",
        "Obwohl länger der Weg ist, ich fahre mit dem Fahrrad."
      ],
      "correct_answer": 0,
      "grammar_tags": [
        "obwohl",
        "nebensatz",
        "inversion"
      ],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can connect a series of shorter discrete elements into a connected sequence and use common subordinate structures.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 40,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B11-R1",
      "modality": "text",
      "skill": "Lesen",
      "micro_skill": "main_idea_purpose",
      "target_band": "B1.1",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": "In der Kleinstadt Lindenau können Einwohner seit Juni an zwölf Stationen kostenlos Lastenräder ausleihen. Das Projekt entstand, weil viele kurze Fahrten zum Einkaufen noch immer mit dem Auto gemacht werden. Die Stadt will zeigen, dass sich auch größere Einkäufe ohne eigenen Wagen transportieren lassen. Nach drei Monaten sind besonders die Stationen in Wohngebieten stark gefragt. Deshalb sollen im nächsten Jahr weitere Räder angeschafft werden.",
      "audio_script": null,
      "prompt": "Was ist das Hauptziel des Projekts?",
      "options": [
        "Mehr Menschen sollen das Auto stehen lassen und kurze Wege anders zurücklegen.",
        "Die Stadt möchte alle Parkplätze durch Fahrradständer ersetzen.",
        "Nur Touristinnen und Touristen sollen Leihräder nutzen."
      ],
      "correct_answer": 0,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can understand straightforward factual texts on subjects related to everyday interests and identify main conclusions/purpose.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 85,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B11-H1",
      "modality": "audio",
      "skill": "Hören",
      "micro_skill": "stance_reason",
      "target_band": "B1.1",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": "Moderatorin: Ihre Firma erlaubt künftig drei Homeoffice-Tage pro Woche. Herr Neumann, was halten Sie davon? Herr Neumann: Für mich ist das sinnvoll. Ich wohne weit außerhalb und verliere jeden Tag fast zwei Stunden im Verkehr. Natürlich möchte ich meine Kollegen weiterhin regelmäßig sehen, aber zwei Bürotage reichen für unsere Teamtreffen völlig aus.",
      "prompt": "Warum unterstützt Herr Neumann die neue Regelung?",
      "options": [
        "Weil er dadurch später anfangen kann.",
        "Weil sie Pendelwege reduzieren kann.",
        "Weil alle Beschäftigten dann zu Hause arbeiten müssen."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can follow clearly articulated standard speech on familiar work/social topics and understand reasons for a viewpoint.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 75,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B11-R2",
      "modality": "text",
      "skill": "Lesen",
      "micro_skill": "stance_inference",
      "target_band": "B1.1",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": "Digitale Fahrkarten sind für mich im Alltag sehr bequem: Ich muss nicht mehr am Automaten warten und kann spontan eine Verbindung auswählen. Trotzdem sollte es weiterhin eine einfache Möglichkeit geben, Tickets ohne Smartphone zu kaufen. Nicht jeder besitzt ein aktuelles Gerät, und auch ein leerer Akku darf nicht bedeuten, dass man nicht mehr mitfahren kann.",
      "audio_script": null,
      "prompt": "Was kann man aus dem Text schließen?",
      "options": [
        "Die Autorin lehnt digitale Tickets grundsätzlich ab.",
        "Die Autorin findet digitale Tickets praktisch, sieht aber ein Problem für manche Fahrgäste.",
        "Die Autorin fordert, Papierfahrkarten sofort abzuschaffen."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can recognise the line of argument and the writer's attitude in straightforward texts on familiar issues.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 80,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B11-G2",
      "modality": "text",
      "skill": "grammar",
      "micro_skill": "relative_clause",
      "target_band": "B1.1",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Ergänzen Sie: „Das ist die Kollegin, ___ mir gestern geholfen hat.“",
      "options": [
        "die",
        "der",
        "den"
      ],
      "correct_answer": 0,
      "grammar_tags": [
        "relativsatz",
        "nominativ"
      ],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 35,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B12-V1",
      "modality": "text",
      "skill": "vocabulary",
      "micro_skill": "abstract_paraphrase",
      "target_band": "B1.2",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Welche Aussage paraphrasiert „Die Maßnahme stößt auf Kritik“ am besten?",
      "options": [
        "Die Maßnahme wird von allen begrüßt.",
        "Einige Menschen äußern Einwände gegen die Maßnahme.",
        "Niemand kennt die Maßnahme."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [
        "public_life",
        "stance"
      ],
      "cefr_alignment_note": "Upper B1 internal band: handles a broader range of everyday/public vocabulary and paraphrase. Internal subdivision, not an official CEFR level.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 40,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B12-G1",
      "modality": "text",
      "skill": "grammar",
      "micro_skill": "discourse_connector",
      "target_band": "B1.2",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Welche Verbindung passt am besten? „Die Miete ist höher geworden. ___ bleibt die Wohnung für uns attraktiv, weil wir kein Auto mehr brauchen.“",
      "options": [
        "Trotzdem",
        "Deshalb",
        "Während"
      ],
      "correct_answer": 0,
      "grammar_tags": [
        "konnektoren",
        "kontrast"
      ],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can link ideas in connected discourse and signal contrast/reason with a range of common connectors.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 40,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B12-R1",
      "modality": "text",
      "skill": "Lesen",
      "micro_skill": "stance_synthesis",
      "target_band": "B1.2",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": "Flexible Arbeitszeiten haben unseren Büroalltag deutlich verbessert. Viele Kolleginnen und Kollegen können Familie und Beruf leichter organisieren, und auch ich arbeite konzentrierter, wenn ich meinen Tag teilweise selbst plane. Ganz ohne gemeinsame Regeln funktioniert es allerdings nicht. Wenn Besprechungen ständig verschoben werden, weil niemand gleichzeitig erreichbar ist, entsteht neuer Stress. Unser Team hat deshalb zwei feste Zeitfenster pro Tag vereinbart, in denen alle erreichbar sein sollen. Für mich ist das ein guter Kompromiss: möglichst viel Freiheit, aber genug Verlässlichkeit für die Zusammenarbeit.",
      "audio_script": null,
      "prompt": "Welche Aussage beschreibt die Haltung der Autorin am besten?",
      "options": [
        "Sie hält flexible Arbeitszeiten für grundsätzlich sinnvoll, fordert aber klare gemeinsame Zeiten im Team.",
        "Sie möchte, dass alle Beschäftigten jederzeit völlig frei arbeiten.",
        "Sie hält feste Arbeitszeiten grundsätzlich für besser als flexible Modelle."
      ],
      "correct_answer": 0,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can follow a straightforward argument and identify the writer's overall stance when advantages and reservations are both expressed.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 105,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B12-H1",
      "modality": "audio",
      "skill": "Hören",
      "micro_skill": "speaker_tracking",
      "target_band": "B1.2",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": "Moderatorin: Unsere Stadtverwaltung testet eine Vier-Tage-Woche. Frau Vogel, Sie arbeiten bereits so. Frau Vogel: Für mich ist das sehr positiv, weil ich meinen freien Tag für Familie und Termine nutzen kann. Herr Kramer: Ich bin noch nicht überzeugt. In meinem Bereich müssen wir eng mit anderen Abteilungen zusammenarbeiten. Wenn die freien Tage unterschiedlich liegen, erreichen wir manche Kollegen zu selten. Moderatorin: Also mehr Freizeit auf der einen Seite, organisatorische Fragen auf der anderen.",
      "prompt": "Wer sieht vor allem ein Problem für die Zusammenarbeit?",
      "options": [
        "Die Moderatorin.",
        "Frau Vogel.",
        "Herr Kramer."
      ],
      "correct_answer": 2,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can follow the main points of extended clear discussion and distinguish speakers' viewpoints on a familiar public/work topic.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 90,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B12-R2",
      "modality": "text",
      "skill": "Lesen",
      "micro_skill": "reference_cohesion",
      "target_band": "B1.2",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": "Ein kleines Elektronikgeschäft in unserer Innenstadt hat sein Konzept verändert. Statt nur neue Geräte zu verkaufen, bietet es jetzt auch Reparaturen und kurze Beratungen an. Kundinnen und Kunden können alte Geräte mitbringen und erfahren, ob sich eine Reparatur noch lohnt. Gleichzeitig erklärt das Team, wie Geräte länger genutzt werden können. Dadurch kommen inzwischen auch Menschen in den Laden, die ursprünglich gar nichts Neues kaufen wollten.",
      "audio_script": null,
      "prompt": "Worauf bezieht sich „dadurch“ im letzten Satz?",
      "options": [
        "Auf die spätere Öffnung am Samstag.",
        "Auf die Kombination aus Beratung und Reparaturangebot.",
        "Auf die niedrigeren Preise im Internet."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Can follow reference and cohesion in connected factual text and understand how ideas relate across sentences.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 90,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B12-G2",
      "modality": "text",
      "skill": "grammar",
      "micro_skill": "counterfactual_condition",
      "target_band": "B1.2",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": null,
      "prompt": "Wählen Sie die passende Formulierung.",
      "options": [
        "Wenn ich früher davon gewusst hätte, wäre ich mitgekommen.",
        "Wenn ich früher davon gewusst habe, komme ich mit.",
        "Wenn ich früher davon wissen würde, bin ich mitgekommen."
      ],
      "correct_answer": 0,
      "grammar_tags": [
        "konjunktiv_ii",
        "plusquamperfekt"
      ],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "Upper B1 internal diagnostic probe of productive/form recognition; not used alone to certify level.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 45,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "screening",
        "boundary"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A11-R3",
      "modality": "text",
      "skill": "Lesen",
      "micro_skill": "detail",
      "target_band": "A1.1",
      "cefr_level": "A1",
      "difficulty_boundary": "within_A1.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": "Heute öffnen wir wegen einer Besprechung erst um 11 Uhr. Ab morgen gelten wieder die normalen Öffnungszeiten.",
      "audio_script": null,
      "prompt": "Was ist heute anders?",
      "options": [
        "Der Laden öffnet später.",
        "Der Laden schließt später.",
        "Der Laden bleibt geschlossen."
      ],
      "correct_answer": 0,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 35,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "boundary",
        "extra"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A12-H2",
      "modality": "audio",
      "skill": "Hören",
      "micro_skill": "detail",
      "target_band": "A1.2",
      "cefr_level": "A1",
      "difficulty_boundary": "within_A1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": "Hallo Ben. Für die Anmeldung brauchen wir morgen noch ein Passfoto von dir. Deinen Ausweis hast du uns schon gezeigt. Geld musst du morgen nicht mitbringen.",
      "prompt": "Was soll Ben mitbringen?",
      "options": [
        "Seinen Pass.",
        "Ein Foto.",
        "Geld."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 40,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "boundary",
        "extra"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A21-H2",
      "modality": "audio",
      "skill": "Hören",
      "micro_skill": "change_detection",
      "target_band": "A2.1",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": "Der Elternabend findet nicht wie geplant im Raum 12 statt, sondern in der Aula. Der Termin bleibt Dienstag um neunzehn Uhr.",
      "prompt": "Was bleibt unverändert?",
      "options": [
        "Der Tag.",
        "Die Uhrzeit.",
        "Der Raum."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 45,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "boundary",
        "extra"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "A22-R3",
      "modality": "text",
      "skill": "Lesen",
      "micro_skill": "matching_constraints",
      "target_band": "A2.2",
      "cefr_level": "A2",
      "difficulty_boundary": "within_A2.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": "Der Haupteingang des Bildungszentrums wird um 18 Uhr geschlossen. Abendkurse finden trotzdem statt. Teilnehmende benutzen danach bitte den Eingang im Innenhof; dort ist die Tür bis 21:30 Uhr geöffnet.",
      "audio_script": null,
      "prompt": "Was muss jemand tun, der erst nach 18 Uhr kommt?",
      "options": [
        "Vorher anrufen.",
        "Den Nebeneingang benutzen.",
        "Bis zum nächsten Tag warten."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 55,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "boundary",
        "extra"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B11-H2",
      "modality": "audio",
      "skill": "Hören",
      "micro_skill": "proposal",
      "target_band": "B1.1",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.1",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": "Mann: Wegen des Streiks kommen morgen wahrscheinlich viele nicht ins Büro. Sollen wir die Besprechung verschieben? Frau: Nächste Woche ist der Terminplan voll. Wir könnten uns stattdessen morgen per Video treffen. Dann müssen wir nicht noch länger warten.",
      "prompt": "Welche Lösung schlägt die Frau vor?",
      "options": [
        "Das Treffen ganz abzusagen.",
        "Das Treffen online durchzuführen.",
        "Das Treffen auf nächste Woche zu verschieben."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 65,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "boundary",
        "extra"
      ]
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "B12-H2",
      "modality": "audio",
      "skill": "Hören",
      "micro_skill": "stance_synthesis",
      "target_band": "B1.2",
      "cefr_level": "B1",
      "difficulty_boundary": "within_B1.2",
      "task_family": "criterion_referenced_diagnostic",
      "text": null,
      "audio_script": "Frau A: Ich finde die neuen autofreien Sonntage interessant. Familien können die Straße ganz anders nutzen, aber der Busverkehr muss an diesen Tagen besser werden. Herr B: Für mich ist die Idee ebenfalls einen Versuch wert. Allerdings sollten Geschäfte beliefert werden können, sonst wird es für kleine Betriebe schwierig.",
      "prompt": "Was ist der gemeinsame Punkt beider Sprecher?",
      "options": [
        "Beide wollen die Maßnahme sofort beenden.",
        "Beide sehen Vorteile, aber unter unterschiedlichen Bedingungen.",
        "Beide finden die Maßnahme ohne Einschränkung gut."
      ],
      "correct_answer": 1,
      "grammar_tags": [],
      "vocabulary_function_tags": [],
      "cefr_alignment_note": "",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 85,
      "scoring_rule": "dichotomous_1_0",
      "contributes_to_placement": true,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true,
      "stage_tags": [
        "boundary",
        "extra"
      ]
    }
  ],
  "productive": [
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "W-A1",
      "modality": "writing",
      "skill": "Schreiben",
      "target_band": "A1.2",
      "cefr_level": "A1",
      "difficulty_boundary": "A1 upper productive probe",
      "task_family": "short_message",
      "prompt": "Sie können morgen nicht zum Deutschkurs kommen. Schreiben Sie Ihrer Lehrerin / Ihrem Lehrer 30–45 Wörter: Entschuldigen Sie sich, nennen Sie kurz den Grund und fragen Sie, was Sie lernen sollen.",
      "grammar_tags": [],
      "vocabulary_function_tags": [
        "apology",
        "reason",
        "request"
      ],
      "cefr_alignment_note": "Short simple message about immediate needs. Internal upper-A1 probe; not an official sublevel.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 360,
      "scoring_rule": "productive_sample_requires_review",
      "contributes_to_placement": false,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "W-A2",
      "modality": "writing",
      "skill": "Schreiben",
      "target_band": "A2.2",
      "cefr_level": "A2",
      "difficulty_boundary": "A2 productive probe",
      "task_family": "personal_email",
      "prompt": "Sie haben am Wochenende einen Ausflug gemacht. Schreiben Sie einer Freundin / einem Freund 60–80 Wörter: Wohin sind Sie gefahren? Was ist passiert? Was hat Ihnen gefallen oder nicht gefallen? Schlagen Sie ein gemeinsames Treffen vor.",
      "grammar_tags": [],
      "vocabulary_function_tags": [
        "narration",
        "evaluation",
        "suggestion"
      ],
      "cefr_alignment_note": "Can write simple connected notes/messages and short descriptions of past events in familiar contexts.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 600,
      "scoring_rule": "productive_sample_requires_review",
      "contributes_to_placement": false,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "W-B1",
      "modality": "writing",
      "skill": "Schreiben",
      "target_band": "B1.1",
      "cefr_level": "B1",
      "difficulty_boundary": "B1 productive probe",
      "task_family": "email_or_opinion",
      "prompt": "Ein Freund überlegt, für den Arbeitsweg nur noch öffentliche Verkehrsmittel zu benutzen. Schreiben Sie 80–100 Wörter: Reagieren Sie auf die Idee, nennen Sie Vor- und Nachteile aus Ihrer Erfahrung und geben Sie einen begründeten Rat.",
      "grammar_tags": [],
      "vocabulary_function_tags": [
        "opinion",
        "reason",
        "advice",
        "advantages_disadvantages"
      ],
      "cefr_alignment_note": "Can write straightforward connected text on familiar topics, describe experiences and give reasons for opinions.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 900,
      "scoring_rule": "productive_sample_requires_review",
      "contributes_to_placement": false,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "S-A1",
      "modality": "speaking",
      "skill": "Sprechen",
      "target_band": "A1.2",
      "cefr_level": "A1",
      "difficulty_boundary": "A1 upper productive probe",
      "task_family": "basic_production",
      "prompt": "Sprechen Sie 30–45 Sekunden: Wie sieht ein normaler Wochentag bei Ihnen aus? Nennen Sie zwei oder drei konkrete Dinge.",
      "grammar_tags": [],
      "vocabulary_function_tags": [
        "routine",
        "time"
      ],
      "cefr_alignment_note": "Can use simple phrases/sentences to describe where one lives and familiar people/things.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A1"
      ],
      "expected_duration_seconds": 90,
      "scoring_rule": "audio_sample_requires_review",
      "contributes_to_placement": false,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "S-A2",
      "modality": "speaking",
      "skill": "Sprechen",
      "target_band": "A2.2",
      "cefr_level": "A2",
      "difficulty_boundary": "A2 productive probe",
      "task_family": "narration_opinion",
      "prompt": "Sprechen Sie 60–90 Sekunden: Erzählen Sie von einem Ausflug oder Besuch, den Sie gut in Erinnerung haben. Was ist passiert und warum war er gut oder nicht gut?",
      "grammar_tags": [],
      "vocabulary_function_tags": [
        "past_event",
        "reason",
        "evaluation"
      ],
      "cefr_alignment_note": "Can describe in simple terms aspects of background, immediate environment and matters of immediate need; can give a short description of an event.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_A2"
      ],
      "expected_duration_seconds": 150,
      "scoring_rule": "audio_sample_requires_review",
      "contributes_to_placement": false,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true
    },
    {
      "diagnostic_version": "placement-v1.0.0",
      "item_id": "S-B1",
      "modality": "speaking",
      "skill": "Sprechen",
      "target_band": "B1.1",
      "cefr_level": "B1",
      "difficulty_boundary": "B1 interactive probe",
      "task_family": "interactive_planning_opinion",
      "prompt": "Interaktive Probe mit Otto: gemeinsam etwas planen, auf einen Gegenvorschlag reagieren, einen Grund nennen und einen Kompromiss formulieren.",
      "grammar_tags": [],
      "vocabulary_function_tags": [
        "planning",
        "proposal",
        "reaction",
        "reason",
        "compromise"
      ],
      "cefr_alignment_note": "Can enter unprepared into conversation on familiar topics, deal with most situations likely to arise, and briefly give reasons/explanations for opinions and plans.",
      "source_basis": [
        "CEFR_2020",
        "GOETHE_B1"
      ],
      "expected_duration_seconds": 240,
      "scoring_rule": "audio_interaction_requires_review",
      "contributes_to_placement": false,
      "contributes_to_b1_exam_gap": true,
      "qa_status": "SOURCE_ALIGNED_SELF_REVIEWED_V1",
      "publish_status": "DIAGNOSTIC_PREVIEW_ONLY",
      "original_aligned": true
    }
  ],
  "screeningSeed": [
    "A21-G1",
    "A21-R1",
    "A22-G1",
    "A22-R1"
  ],
  "pathSeeds": {
    "low": [
      "A11-R1",
      "A11-H1",
      "A12-G1",
      "A12-H1"
    ],
    "middle": [
      "A12-R1",
      "A12-H1",
      "B11-R1",
      "B11-H1"
    ],
    "high": [
      "B11-R1",
      "B11-H1",
      "B12-R1",
      "B12-H1"
    ]
  }
};
});
