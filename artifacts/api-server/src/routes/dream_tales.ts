import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, dreamTalesTable, memoriesTable, babiesTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";
import { createNotification } from "./notifications";
import { openai } from "@workspace/integrations-openai-ai-server";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";

const router: IRouter = Router();

function computeAge(dob: string): string {
  const birthDate = new Date(dob);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth());
  if (totalMonths < 1) return "a newborn";
  if (totalMonths < 24) return `${totalMonths} months old`;
  const years = Math.floor(totalMonths / 12);
  return `${years} year${years !== 1 ? "s" : ""} old`;
}

const STYLE_DESCRIPTIONS: Record<string, string> = {
  bedtime_calm: "a gentle, soothing bedtime story that helps the child relax and drift peacefully to sleep",
  adventure: "a gentle mini-adventure story with an exciting journey that ends calmly at bedtime",
  gentle_learning: "a sweet educational story that gently introduces simple concepts through playful discovery",
  magical_fantasy: "a magical fairy tale with wonder and enchantment, ending in peaceful dreamy sleep",
  emotional_keepsake: "a tender, heartfelt memory story that lovingly preserves a precious moment in narrative form",
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  english: "Write the entire story in English only.",
  hindi: "Write the entire story in Hindi using Devanagari script only. Every word must be in Hindi.",
  gujarati: "Write the entire story in Gujarati using Gujarati script only. Every word must be in Gujarati.",
};

const VALID_LANGUAGES = ["english", "hindi", "gujarati"];
const VALID_VOICES = ["alloy", "echo", "fable", "nova", "onyx", "shimmer"] as const;
type ValidVoice = typeof VALID_VOICES[number];

// GET /babies/:babyId/dream-tales
router.get(
  "/babies/:babyId/dream-tales",
  requireAuth,
  async (req, res): Promise<void> => {
    const babyId = Array.isArray(req.params.babyId)
      ? req.params.babyId[0]
      : req.params.babyId;

    const tales = await db
      .select()
      .from(dreamTalesTable)
      .where(eq(dreamTalesTable.babyId, babyId))
      .orderBy(desc(dreamTalesTable.createdAt));

    res.json(tales);
  }
);

// POST /babies/:babyId/dream-tales — generate + save a new story
router.post(
  "/babies/:babyId/dream-tales",
  requireAuth,
  async (req, res): Promise<void> => {
    const babyId = Array.isArray(req.params.babyId)
      ? req.params.babyId[0]
      : req.params.babyId;
    const {
      memoryId,
      storyStyle = "bedtime_calm",
      voiceName = "nova",
      targetMinutes = 3,
      language = "english",
    } = req.body ?? {};

    const safeLanguage = VALID_LANGUAGES.includes(language) ? language : "english";
    const langInstruction = LANGUAGE_INSTRUCTIONS[safeLanguage];

    const [baby] = await db
      .select()
      .from(babiesTable)
      .where(eq(babiesTable.id, babyId));
    if (!baby) {
      res.status(404).json({ error: "Baby not found" });
      return;
    }

    let memory: typeof memoriesTable.$inferSelect | null = null;
    if (memoryId) {
      const [m] = await db
        .select()
        .from(memoriesTable)
        .where(eq(memoriesTable.id, memoryId));
      memory = m ?? null;
    }

    const babyAge = baby.dob ? computeAge(baby.dob) : "a little one";
    const wordTarget = Math.round(Number(targetMinutes) * 150);
    const styleDesc = STYLE_DESCRIPTIONS[storyStyle] ?? STYLE_DESCRIPTIONS.bedtime_calm;

    const contextLines = [
      `Baby's name: ${baby.name}`,
      `Baby's age: ${babyAge}`,
      memory?.caption ? `Memory caption: "${memory.caption}"` : null,
      memory?.category ? `Memory category: ${memory.category}` : null,
      memory?.createdAt
        ? `Memory date: ${new Date(memory.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt =
      "You are a warm, magical bedtime story narrator who creates deeply personalized stories for babies and toddlers. " +
      "Your stories are soothing, imaginative, and personal — weaving the child's real name and memories into beautiful narratives. " +
      "Always write in a gentle, rhythmic prose style that helps children relax. Use soft imagery: moonlight, stars, gentle breezes, cozy blankets, warm hugs. " +
      "Never include scary elements. Build every story toward a peaceful, sleepy ending. " +
      langInstruction;

    const userPrompt =
      `Create ${styleDesc} for a child with these details:\n\n${contextLines}\n\n` +
      `Requirements:\n` +
      `- Approximately ${wordTarget} words\n` +
      `- Mention ${baby.name} by name naturally throughout\n` +
      `- Use soft, flowing, soothing language\n` +
      `- End with ${baby.name} falling peacefully asleep\n` +
      `- Write as flowing prose only (no headings, no bullet points)\n` +
      `- ${langInstruction}\n\n` +
      `After the story, on a new line write exactly: TITLE: [a beautiful story title of 4–7 words in the same language]`;

    type MessageContent =
      | string
      | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;

    let userContent: MessageContent;
    if (
      memory?.mediaUrl &&
      memory.type !== "video" &&
      memory.mediaUrl.startsWith("https://")
    ) {
      userContent = [
        { type: "image_url", image_url: { url: memory.mediaUrl } },
        { type: "text", text: userPrompt },
      ];
    } else {
      userContent = userPrompt;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    const rawOutput = completion.choices[0]?.message?.content ?? "";
    const titleMatch = rawOutput.match(/TITLE:\s*(.+)$/m);
    const title = titleMatch?.[1]?.trim() ?? `${baby.name}'s Dream Tale`;
    const storyText = rawOutput.replace(/\nTITLE:.*$/m, "").trim();

    const safeVoice: ValidVoice = VALID_VOICES.includes(voiceName as ValidVoice)
      ? (voiceName as ValidVoice)
      : "nova";
    const audioBuffer = await textToSpeech(storyText, safeVoice, "mp3");
    const audioBase64 = audioBuffer.toString("base64");
    const wordCount = storyText.split(/\s+/).length;
    const durationSeconds = Math.round(wordCount / 2.5);

    const coverImageUrl =
      memory?.thumbnailUrl ??
      (memory?.mediaUrl && memory.type !== "video" ? memory.mediaUrl : null) ??
      null;

    const [tale] = await db
      .insert(dreamTalesTable)
      .values({
        babyId,
        userId: req.user!.userId,
        memoryId: memory?.id ?? null,
        title,
        storyText,
        storyStyle,
        voiceName: safeVoice,
        language: safeLanguage,
        coverImageUrl,
        durationSeconds,
        isFavorite: false,
        audioBase64,
      })
      .returning();

    req.log.info({ taleId: tale.id }, "Dream tale created");

    createNotification(
      req.user!.userId,
      "dream_tale_ready",
      "Your Dream Tale is ready",
      `"${title}"`,
      { taleId: tale.id, babyId }
    );

    res.status(201).json(tale);
  }
);

// POST /dream-tales/:id/translate — re-narrate in a different language
router.post(
  "/dream-tales/:id/translate",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { language = "english" } = req.body ?? {};

    const safeLanguage = VALID_LANGUAGES.includes(language) ? language : "english";

    const [tale] = await db
      .select()
      .from(dreamTalesTable)
      .where(eq(dreamTalesTable.id, id));
    if (!tale) {
      res.status(404).json({ error: "Dream tale not found" });
      return;
    }

    if (tale.language === safeLanguage) {
      res.json(tale);
      return;
    }

    const langInstruction = LANGUAGE_INSTRUCTIONS[safeLanguage];

    // Translate story text
    const textCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content:
            `You are a skilled children's story translator. Translate the given bedtime story while preserving its gentle, soothing, dreamlike tone. ` +
            langInstruction +
            ` Return only the translated story text, no explanations.`,
        },
        { role: "user", content: tale.storyText },
      ],
    });
    const translatedText = textCompletion.choices[0]?.message?.content?.trim() ?? tale.storyText;

    // Translate title
    const titleCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 64,
      messages: [
        {
          role: "system",
          content: `Translate this children's story title. ${langInstruction} Return only the translated title, nothing else.`,
        },
        { role: "user", content: tale.title },
      ],
    });
    const translatedTitle = titleCompletion.choices[0]?.message?.content?.trim() ?? tale.title;

    // Re-generate TTS in new language
    const safeVoice: ValidVoice = VALID_VOICES.includes(tale.voiceName as ValidVoice)
      ? (tale.voiceName as ValidVoice)
      : "nova";
    const audioBuffer = await textToSpeech(translatedText, safeVoice, "mp3");
    const audioBase64 = audioBuffer.toString("base64");
    const wordCount = translatedText.split(/\s+/).length;
    const durationSeconds = Math.round(wordCount / 2.5);

    const [updated] = await db
      .update(dreamTalesTable)
      .set({ language: safeLanguage, title: translatedTitle, storyText: translatedText, audioBase64, durationSeconds })
      .where(eq(dreamTalesTable.id, id))
      .returning();

    req.log.info({ taleId: id, language: safeLanguage }, "Dream tale translated");
    res.json(updated);
  }
);

// POST /dream-tales/:id/revoice — re-generate TTS with a different narrator voice
router.post(
  "/dream-tales/:id/revoice",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { voiceName } = req.body ?? {};

    const safeVoice: ValidVoice = VALID_VOICES.includes(voiceName as ValidVoice)
      ? (voiceName as ValidVoice)
      : "nova";

    const [tale] = await db
      .select()
      .from(dreamTalesTable)
      .where(eq(dreamTalesTable.id, id));
    if (!tale) {
      res.status(404).json({ error: "Dream tale not found" });
      return;
    }

    if (tale.voiceName === safeVoice) {
      res.json(tale);
      return;
    }

    const audioBuffer = await textToSpeech(tale.storyText, safeVoice, "mp3");
    const audioBase64 = audioBuffer.toString("base64");

    const [updated] = await db
      .update(dreamTalesTable)
      .set({ voiceName: safeVoice, audioBase64 })
      .where(eq(dreamTalesTable.id, id))
      .returning();

    req.log.info({ taleId: id, voiceName: safeVoice }, "Dream tale revoiced");
    res.json(updated);
  }
);

// GET /dream-tales/:id
router.get(
  "/dream-tales/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const [tale] = await db
      .select()
      .from(dreamTalesTable)
      .where(eq(dreamTalesTable.id, id));
    if (!tale) {
      res.status(404).json({ error: "Dream tale not found" });
      return;
    }
    res.json(tale);
  }
);

// PATCH /dream-tales/:id — update isFavorite
router.patch(
  "/dream-tales/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { isFavorite } = req.body ?? {};

    const [updated] = await db
      .update(dreamTalesTable)
      .set({ isFavorite: Boolean(isFavorite) })
      .where(eq(dreamTalesTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Dream tale not found" });
      return;
    }
    res.json(updated);
  }
);

// DELETE /dream-tales/:id
router.delete(
  "/dream-tales/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await db.delete(dreamTalesTable).where(eq(dreamTalesTable.id, id));
    req.log.info({ taleId: id }, "Dream tale deleted");
    res.status(204).send();
  }
);

export default router;
