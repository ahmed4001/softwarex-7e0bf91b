import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { supabase } from "@/integrations/supabase/client";
import en from "./locales/en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

// Dynamically load translation for a language
export async function loadLanguage(langCode: string): Promise<boolean> {
  if (langCode === "en") {
    await i18n.changeLanguage("en");
    return true;
  }

  if (i18n.hasResourceBundle(langCode, "translation")) {
    await i18n.changeLanguage(langCode);
    return true;
  }

  // 1. Try localStorage cache
  const cached = localStorage.getItem(`i18n_${langCode}`);
  if (cached) {
    try {
      const translations = JSON.parse(cached);
      i18n.addResourceBundle(langCode, "translation", translations);
      await i18n.changeLanguage(langCode);
      return true;
    } catch {}
  }

  // 2. Try DB cache (pre-generated translations — instant, no AI call)
  try {
    const { data } = await supabase
      .from("ui_translations")
      .select("translations")
      .eq("lang_code", langCode)
      .single();

    if (data?.translations) {
      const translations = data.translations as Record<string, unknown>;
      localStorage.setItem(`i18n_${langCode}`, JSON.stringify(translations));
      i18n.addResourceBundle(langCode, "translation", translations);
      await i18n.changeLanguage(langCode);
      return true;
    }
  } catch {}

  // 3. Fall back to edge function (generates on-demand + caches to DB)
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-ui`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ targetLang: langCode, sourceTranslations: en }),
      }
    );

    if (!response.ok) throw new Error("Translation failed");

    const result = await response.json();
    const translations = result.translations;

    localStorage.setItem(`i18n_${langCode}`, JSON.stringify(translations));
    i18n.addResourceBundle(langCode, "translation", translations);
    await i18n.changeLanguage(langCode);
    return true;
  } catch (err) {
    console.error("Failed to load language:", langCode, err);
    return false;
  }
}

export default i18n;
