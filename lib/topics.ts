export type Language = "en" | "bn" | "ja";
export type Topic = {
  id: string;
  labels: Record<Language, string>;
  aliases: string[];
  terms: string[];
  group: string;
  related: string[];
};
export const topics: Topic[] = [
  {
    id: "backbiting",
    labels: { en: "Backbiting", bn: "গীবত", ja: "陰口" },
    aliases: [
      "backbiting",
      "backbite",
      "ghibah",
      "gheebah",
      "গীবত",
      "গিবত",
      "陰口",
      "غيبة",
    ],
    terms: ["backbit", "backbite", "গীবত", "গিবত", "陰口", "يغتب"],
    group: "Speech & character",
    related: ["slander", "gossip", "repentance"],
  },
  {
    id: "gossip",
    labels: { en: "Gossip & tale-bearing", bn: "চোগলখুরি", ja: "告げ口・噂話" },
    aliases: [
      "gossip",
      "namimah",
      "tale-bearing",
      "talebearing",
      "চোগল",
      "পরনিন্দা",
      "告げ口",
      "噂話",
      "نميمة",
    ],
    terms: [
      "gossip",
      "talebearer",
      "tale-bearing",
      "slander",
      "চোগল",
      "告げ口",
      "نمام",
      "نميم",
    ],
    group: "Speech & character",
    related: ["backbiting", "slander", "honesty"],
  },
  {
    id: "slander",
    labels: {
      en: "Slander & false accusations",
      bn: "অপবাদ",
      ja: "中傷・虚偽の非難",
    },
    aliases: [
      "slander",
      "false accusation",
      "buhtan",
      "অপবাদ",
      "মিথ্যা অভিযোগ",
      "中傷",
      "誹謗",
      "بهتان",
    ],
    terms: ["slander", "accuse", "অপবাদ", "中傷", "بهتان"],
    group: "Speech & character",
    related: ["backbiting", "justice", "repentance"],
  },
  {
    id: "hypocrisy",
    labels: { en: "Hypocrisy", bn: "মুনাফিকি", ja: "偽善" },
    aliases: [
      "hypocrisy",
      "hypocrite",
      "munafiq",
      "nifaq",
      "মুনাফিক",
      "কপটতা",
      "偽善",
      "نفاق",
    ],
    terms: ["hypocrit", "মুনাফিক", "偽善", "منافق"],
    group: "Faith & character",
    related: ["honesty", "believer", "repentance"],
  },
  {
    id: "honesty",
    labels: {
      en: "Honesty & truthfulness",
      bn: "সততা ও সত্যবাদিতা",
      ja: "誠実・正直",
    },
    aliases: [
      "honesty",
      "truthfulness",
      "truthful",
      "সততা",
      "সত্যবাদ",
      "誠実",
      "正直",
      "صدق",
    ],
    terms: ["truthful", "honest", "সত্যবাদ", "誠実", "正直", "صادق"],
    group: "Speech & character",
    related: ["lying", "justice", "believer"],
  },
  {
    id: "lying",
    labels: { en: "Lying", bn: "মিথ্যা", ja: "嘘" },
    aliases: ["lying", "lies", "lie", "মিথ্যা", "嘘", "كذب"],
    terms: ["lies", "lying", "liar", "মিথ্যা", "嘘", "كذب"],
    group: "Speech & character",
    related: ["honesty", "slander", "hypocrisy"],
  },
  {
    id: "charity",
    labels: { en: "Charity & generosity", bn: "দান", ja: "施し・慈善" },
    aliases: [
      "charity",
      "sadaqah",
      "zakat",
      "দান",
      "সদকা",
      "施し",
      "慈善",
      "صدقة",
    ],
    terms: ["charity", "spend", "দান", "施し", "صدقات"],
    group: "Living with others",
    related: ["justice", "gratitude", "believer"],
  },
  {
    id: "justice",
    labels: { en: "Justice", bn: "ন্যায়বিচার", ja: "公正" },
    aliases: ["justice", "fairness", "ন্যায়", "ইনসাফ", "公正", "正義", "عدل"],
    terms: ["justice", "justly", "ন্যায়", "公正", "عدل"],
    group: "Living with others",
    related: ["honesty", "parents", "slander"],
  },
  {
    id: "parents",
    labels: { en: "Parents & family", bn: "পিতা-মাতা", ja: "両親・家族" },
    aliases: [
      "parents",
      "mother",
      "father",
      "পিতা",
      "মাতা",
      "মা বাবা",
      "両親",
      "母親",
      "والدين",
    ],
    terms: ["parents", "mother", "পিতা", "মাতা", "両親", "والدين"],
    group: "Living with others",
    related: ["gratitude", "patience", "justice"],
  },
  {
    id: "patience",
    labels: { en: "Patience", bn: "ধৈর্য", ja: "忍耐" },
    aliases: ["patience", "sabr", "ধৈর্য", "সবর", "忍耐", "صبر"],
    terms: ["patient", "patience", "ধৈর্য", "忍耐", "صبر"],
    group: "The inner life",
    related: ["gratitude", "repentance", "yusuf"],
  },
  {
    id: "gratitude",
    labels: { en: "Gratitude", bn: "কৃতজ্ঞতা", ja: "感謝" },
    aliases: [
      "gratitude",
      "thankful",
      "shukr",
      "কৃতজ্ঞ",
      "শুকর",
      "感謝",
      "شكر",
    ],
    terms: ["grateful", "thankful", "কৃতজ্ঞ", "感謝", "شكر"],
    group: "The inner life",
    related: ["patience", "parents", "charity"],
  },
  {
    id: "repentance",
    labels: {
      en: "Repentance & mercy",
      bn: "তাওবা ও রহমত",
      ja: "悔い改め・慈悲",
    },
    aliases: [
      "repentance",
      "repent",
      "tawbah",
      "তাওবা",
      "ক্ষমা",
      "悔い改め",
      "慈悲",
      "توبة",
    ],
    terms: ["repent", "forgive", "তাওবা", "悔い改め", "توب"],
    group: "The inner life",
    related: ["backbiting", "lying", "gratitude"],
  },
  {
    id: "believer",
    labels: {
      en: "Qualities of a believer",
      bn: "মুমিনের গুণাবলি",
      ja: "信仰者の資質",
    },
    aliases: [
      "believer",
      "mumin",
      "mu’min",
      "mu'min",
      "মুমিন",
      "বিশ্বাসী",
      "信仰者",
      "مؤمن",
    ],
    terms: ["believers", "faithful", "মুমিন", "信仰者", "مؤمن"],
    group: "Faith & character",
    related: ["honesty", "patience", "charity"],
  },
  {
    id: "musa",
    labels: { en: "Musa · Moses", bn: "মূসা", ja: "ムーサー" },
    aliases: ["moses", "musa", "মূসা", "মুসা", "ムーサー", "モーセ", "موسى"],
    terms: ["moses", "মূসা", "ムーサー", "موسى"],
    group: "Prophetic stories",
    related: ["patience", "justice"],
  },
  {
    id: "yusuf",
    labels: { en: "Yusuf · Joseph", bn: "ইউসুফ", ja: "ユースフ" },
    aliases: ["joseph", "yusuf", "ইউসুফ", "ユースフ", "ヨセフ", "يوسف"],
    terms: ["joseph", "ইউসুফ", "ユースフ", "يوسف"],
    group: "Prophetic stories",
    related: ["patience", "repentance"],
  },
  {
    id: "ibrahim",
    labels: { en: "Ibrahim · Abraham", bn: "ইবরাহীম", ja: "イブラーヒーム" },
    aliases: [
      "abraham",
      "ibrahim",
      "ইবরাহীম",
      "イブラーヒーム",
      "アブラハム",
      "ابراهيم",
    ],
    terms: ["abraham", "ইবরাহীম", "イブラーヒーム", "ابراهيم"],
    group: "Prophetic stories",
    related: ["gratitude", "believer"],
  },
  {
    id: "nuh",
    labels: { en: "Nuh · Noah", bn: "নূহ", ja: "ヌーフ" },
    aliases: ["noah", "nuh", "নূহ", "ヌーフ", "ノア", "نوح"],
    terms: ["noah", "নূহ", "ヌーフ", "نوح"],
    group: "Prophetic stories",
    related: ["patience", "believer"],
  },
  {
    id: "isa",
    labels: { en: "Isa · Jesus", bn: "ঈসা", ja: "イーサー" },
    aliases: ["jesus", "isa", "ঈসা", "イーサー", "イエス", "عيسى"],
    terms: ["jesus", "ঈসা", "イーサー", "عيسي"],
    group: "Prophetic stories",
    related: ["believer", "parents"],
  },
];
export function normalize(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06edـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}
export function understand(query: string) {
  const q = normalize(query);
  return topics.filter((t) =>
    t.aliases.some((a) => {
      const n = normalize(a);
      return /[a-z]/.test(n)
        ? new RegExp(
            "(^|[^a-z])" +
              n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
              "([^a-z]|$)",
          ).test(q)
        : q.includes(n);
    }),
  );
}
export function searchTerms(query: string) {
  const ts = understand(query);
  const stop = new Set(
    "i am a an the about find relevant quran hadith talk preparing please what does say and or of in is are to me for with this that".split(
      " ",
    ),
  );
  return [
    ...new Set(
      [...normalize(query)
        .split(/[\s,;?!。？！、]+/u)
        .filter((x) => x.length > 1 && !stop.has(x)),
        ...ts.flatMap((t) => t.terms)],
    ),
  ].slice(0, 40);
}
