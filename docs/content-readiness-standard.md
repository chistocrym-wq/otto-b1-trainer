# OTTO B1 — обязательный стандарт готовности контента

Owner requirement. Этот документ обязателен для всех новых learning tasks и mock/exam tasks. Техническая заглушка не считается готовым контентом.

## 1. Глобальное правило CONTENT READY

Задание может получить статус `CONTENT_READY` только если у него есть полный комплект, соответствующий типу задания:

- само задание;
- русский перевод пользовательского учебного материала там, где перевод разрешён;
- подробный разбор;
- словарь / glossary;
- стратегия Otto;
- проверенный answer key или versioned rubric для productive task;
- source/alignment metadata;
- QA status/version;
- аудио, если оно требуется механикой задания;
- изображение/scene image для каждого Hören learning task.

Если хотя бы обязательной части нет, задача остаётся `QA_PENDING` / `INCOMPLETE` и не может отображаться как готовое обучение.

Это правило не означает, что перевод, transcript или glossary показываются во время Exam/Mock. Готовность контент-пакета и доступность подсказок в конкретном режиме — разные вещи.

---

# HÖREN — AUDIO + IMAGE STANDARD

## 2. Нормальное аудио

Browser `speechSynthesis` допустим только как явно помеченная техническая заглушка Preview. Он не является final user audio source.

Финальный Hören asset должен быть versioned и хранить минимум:

- `audio_id`;
- `task_id`;
- `version`;
- `speakers[]`;
- `transcript`;
- `duration_seconds`;
- `playback_rules`;
- `source_status`;
- `production_status`.

Требования к звучанию:

- естественный немецкий;
- темп, соответствующий конкретному Goethe B1 task family;
- естественные паузы и интонация;
- без роботизированного чтения;
- без чрезмерно идеальной дикторской подачи;
- production не должен давать скрытую подсказку к answer key.

## 3. Разные люди = разные голоса

Каждый персонаж имеет стабильные:

- `speaker_id`;
- `voice_id`.

Если один персонаж говорит несколько раз внутри одного задания, его `voice_id` не меняется.

Если в задании участвуют несколько людей, у них должны быть различимые голоса. Нельзя читать Moderatorin, Frau Keller и Herr Brandt одним и тем же голосом.

Для Hören Teil 4 multi-speaker audio обязательно; один `voice_id` для всех участников запрещён.

Голоса должны быть достаточно различимыми для реального speaker tracking, но не карикатурными. Правильный ответ нельзя выделять необычной громкостью, медленностью, акцентом или иным production cue.

## 4. Playback rules

Metadata должна хранить:

- `exam_play_count`;
- `training_play_count` или политику учебных повторов;
- `extra_training_plays_are_assisted: true/false`;
- `segment_replay_after_answer: true/false`.

Exam/Mock строго соблюдает количество воспроизведений соответствующего task family.

Training может разрешать дополнительные учебные прослушивания, но они фиксируются как assisted evidence, если выходят за exam-like allowance.

## 5. Training / Exam separation

### Training — до ответа

Доступны обычные playback controls в рамках учебной политики. Transcript, перевод, разбор и answer evidence не должны автоматически раскрывать ответ до выбора пользователя, если конкретный учебный сценарий не предусматривает explicit assisted mode.

### Training — после ответа

Можно открыть:

- transcript;
- русский перевод transcript;
- подробный разбор;
- glossary;
- отдельные фразы / segments для повторного прослушивания;
- стратегию и error analysis.

### Exam / Mock — во время выполнения

Скрыты:

- transcript;
- перевод;
- glossary;
- разбор;
- answer evidence;
- strategy.

Playback ограничен metadata соответствующего task family.

### Review после Exam / Mock

После завершения Review может открыть весь учебный пакет.

## 6. Изображение обязательно для Hören learning task

Каждый Hören learning task должен иметь `image` metadata и реальный image asset.

Минимум:

- `image_id`;
- `task_id`;
- `version`;
- `src`;
- `alt`;
- `scene_context`;
- `context_only: true`;
- `answer_leak_review: PASSED`;
- `art_direction_version`;
- `source_status`.

Изображение показывает контекст, а не решение вопроса.

Примеры допустимого контекста:

- вокзал;
- кафе;
- несколько людей за столом в офисе;
- радиостудия;
- городской контекст объявления.

Недопустимо изображением сообщать то, что пользователь должен установить из audio.

Если официальный Goethe task не использует картинку как экзаменационный материал, OTTO image остаётся декоративно-контекстным слоем и не участвует в scoring / answer key.

## 7. Art direction

Изображения Hören должны быть частью единой системы, а не смесью stock photo, cartoon, случайных AI render и emoji.

Направление:

- мягкая современная иллюстрация;
- согласование с Otto и голубой визуальной системой продукта;
- достаточно крупный responsive visual;
- без жёсткой обрезки;
- без перекрытия playback controls;
- без перекрытия bottom nav;
- отдельная проверка 390 px.

## 8. Metadata separation

`image` и `audio production metadata` не должны содержать или вычисляться из поля `correct_answer`.

Контекстная картинка, voice assignment, громкость, темп и style не должны зависеть от того, какой вариант является правильным.

## 9. Regression gates

Обязательные проверки:

- multi-speaker task содержит разные `speaker_id`;
- один speaker сохраняет один `voice_id`;
- multi-speaker task не использует один `voice_id` для всех участников;
- Hören Teil 4 содержит multi-speaker audio;
- audio asset metadata существует;
- final audio source != browser `speechSynthesis`;
- transcript скрыт в Exam/Mock;
- translation скрыт в Exam/Mock;
- glossary/strategy скрыты в Exam/Mock;
- playback count ограничен task metadata;
- extra training plays помечаются assisted evidence;
- каждый Hören learning task имеет image;
- image проходит answer-leak review;
- image metadata отделена от answer data;
- 390 px не имеет overflow;
- image не перекрывает playback controls / bottom nav;
- `CONTENT_READY` невозможен без полного bundle.
