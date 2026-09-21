# Тренажёр Otto — Goethe-Zertifikat B1

Owner Preview после первого визуального/UX-review.

## Текущий пользовательский сценарий

1. Регистрация: имя + обращение + Email/Telegram + дата экзамена + 10/25/45 минут.
2. Подтверждение (в Preview email-код: `111111`; Telegram — UX-заглушка до backend/Mini App).
3. Обязательный экран «Провести диагностику». До завершения диагностики остальные разделы закрыты.
4. Диагностика: language baseline + Lesen + Hören + Schreiben + Sprechen.
5. Отчёт без фиктивного Goethe-score.
6. Два режима после диагностики:
   - **Otto ведёт меня** — персональный маршрут;
   - **Выбрать самому** — отдельный вход в Lesen / Hören / Schreiben / Sprechen и их Teil/Aufgabe.
7. Ошибка Lesen → объяснение → self-correction → transfer → future review.
8. Weekly checkpoint.
9. Отдельный Exam mode.
10. Otto Personal shell.

## Goethe task map в Preview

- Lesen: 5 Teil.
- Hören: 4 Teil.
- Schreiben: 3 Aufgaben.
- Sprechen: 3 Aufgaben.
- Для каждого task family есть representative original_aligned sample.
- В Training доступны перевод/стратегия; в Exam они скрыты.

## Sprechen

Aufgabe 1 содержит голосовой диалог с Otto: браузерная запись микрофона + Speech Recognition (если браузер поддерживает) + озвученный scripted response Otto. Если распознавание речи недоступно, остаётся реальная запись микрофона. Полноценный AI semantic/pronunciation review пока не подключён.

## Preview boundaries

Это не production и не полный банк:
- регистрация не создаёт реальный серверный аккаунт;
- email/Telegram verification пока preview interaction;
- Hören использует browser de-DE speech synthesis вместо финального versioned audio bank;
- Schreiben не получает финальную AI-rubric assessment;
- Exam mode показывает поведение и структуру, но не выдаётся за полноценный mock.

## Safety

- Branch: `preview/clean-v1`
- Draft PR only
- `main` не изменён
- Production не публикуется без отдельной команды владельца
