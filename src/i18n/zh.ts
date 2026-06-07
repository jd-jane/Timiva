import type { Messages } from "./en";

export const zh: Messages = {
  meta: {
    home: {
      title: "Timiva — 簡單好用的時間與日期工具",
      description:
        "Timiva 提供簡潔、適合手機使用的時間與日期小工具，包含日期倒數、日期區間計算與日常時間規劃。",
    },
    eventCountdown: {
      title: "事件倒數計時器 — Timiva",
      description:
        "建立重要日期或事件的倒數計時，介面簡潔、適合手機使用，快速查看距離目標日還剩多久。",
    },
    dateRangeCalculator: {
      title: "日期區間計算器 — Timiva",
      description:
        "快速計算兩個日期之間相差幾天，適合行程安排、專案規劃與日常日期查詢。",
    },
    privacy: {
      title: "隱私權政策 — Timiva",
      description: "Timiva 如何處理您的資料與隱私。",
    },
    terms: {
      title: "使用條款 — Timiva",
      description: "使用 Timiva 時間工具的相關條款。",
    },
    contact: {
      title: "聯絡我們 — Timiva",
      description: "與 Timiva 團隊取得聯繫。",
    },
    allTools: {
      title: "全部工具 — Timiva",
      description: "瀏覽 Timiva 目前已上線的時間、日期與規劃工具。",
    },
  },
  nav: {
    homeLabel: "Timiva 首頁",
    backToHome: "← Timiva",
    backToHomeAria: "返回 Timiva",
    languageSwitch: "語言",
    english: "English",
    chinese: "中文",
  },
  home: {
    heroTitle: "讓時間被看見，也更好計算",
    heroLead: "簡潔的倒數、日期計算與日常時間工具集合。",
    ctaPrimary: "建立倒數計時",
    ctaSecondary: "計算日期區間",
    toolsSectionLabel: "精選時間工具",
    brandNote:
      "Timiva 專注於把常用的時間操作變得更清楚。沒有複雜設定，也不需要註冊帳號，打開工具就能開始使用。",
    viewAllTools: "查看全部工具",
  },
  footer: {
    navLabel: "網站",
    tagline: "簡單、舒服、手機好用的時間與生活節奏工具。",
    allTools: "全部工具",
    copyright: "© 2026 Timiva",
    privacy: "隱私權政策",
    terms: "使用條款",
    contact: "聯絡我們",
    emailLabel: "Email",
    email: "hello@timiva.app",
  },
  relatedTools: {
    heading: "你可能也會需要",
    viewAllTools: "查看全部工具 →",
  },
  allTools: {
    heading: "全部工具",
    lead: "這裡整理 Timiva 目前已完成的工具，選一個就能立即開始使用。",
    categories: {
      datesEvents: "日期與事件",
      productivity: "效率與計時",
      bodyFlow: "身體與節奏",
      momentum: "長期進度",
    },
  },
  tools: {
    openTool: "開啟工具",
    comingSoon: "即將推出",
    eventCountdown: {
      title: "事件倒數計時器",
      description: "為重要日期或事件建立清楚、專注的倒數計時。",
      compactDescription: "倒數到重要日期。",
      relatedDescription: "查看剩餘天數。",
    },
    dateRange: {
      title: "日期區間計算器",
      description: "快速計算兩個日期之間相差幾天，包含工作日與週末。",
      compactDescription: "計算兩日期間隔。",
      relatedDescription: "計算日期差。",
    },
    ageCalculator: {
      title: "年齡計算器",
      description: "快速計算實際年齡、出生天數與下一次生日倒數。",
      compactDescription: "計算實際年齡與出生天數。",
      relatedDescription: "查看實際年齡。",
    },
    lifeProgress: {
      title: "人生進度條",
      description: "把一年、人生或目標期限變成清楚的時間進度。",
      compactDescription: "視覺化時間進度。",
      relatedDescription: "查看時間進度。",
    },
    timer: {
      title: "計時器",
      description: "專注、烹飪、運動與日常任務的簡潔計時器。",
    },
    timeZone: {
      title: "時區轉換器",
      mobileTitleLines: ["時區", "轉換器"],
      description: "跨城市比對時間，規劃跨時區行程。",
    },
  },
  legal: {
    privacy: {
      heading: "隱私權政策",
      updated: "最後更新：2026 年 5 月",
      paragraphs: [
        "Timiva 提供時間與日期相關小工具。",
        "目前不需要註冊帳號。",
        "工具主要在瀏覽器中運作。",
        "部分設定可能儲存在使用者瀏覽器本機。",
        "未來可能加入流量分析或廣告服務。",
        "聯絡信箱 hello@timiva.app。",
      ],
    },
    terms: {
      heading: "使用條款",
      updated: "最後更新：2026 年 5 月",
      paragraphs: [
        "工具提供一般便利用途。",
        "若用於重要決策，使用者應自行再次確認結果。",
        "Timiva 不對誤用或依賴結果造成的損失負責。",
        "網站可能調整或移除功能。",
      ],
    },
    contact: {
      heading: "聯絡我們",
      intro: "若有錯誤回報、功能建議或其他意見，請寄信至",
      emailLabel: "電子郵件",
      email: "hello@timiva.app",
    },
  },
  dateRangeCalculator: {
    kicker: "日期區間計算器",
    totalDays: "總天數",
    workdays: "工作日",
    weekends: "週末",
    dateRangePlaceholder: "開始日期 — 結束日期",
    startDate: "開始日期",
    endDate: "結束日期",
    clearDates: "清除日期",
    chooseDateRange: "選擇日期區間",
    changeDateRange: "變更日期區間",
    calendarLabel: "日期區間日曆",
    resultsLabel: "日期區間結果",
    previousMonth: "上一個月",
    nextMonth: "下一個月",
    weekdays: ["一", "二", "三", "四", "五", "六", "日"],
    about: {
      heading: "什麼是日期區間計算器？",
      body: "日期區間計算器可以幫你快速計算兩個日期之間相差多久，包含總天數、工作日與週末天數。適合用於旅遊天數、專案時程、截止日期與日常日期查詢。",
    },
    howTo: {
      heading: "如何使用日期區間計算器？",
      body: "選擇開始日期與結束日期後，系統會立即顯示區間內的總天數、工作日與週末天數。手機版可點擊下方日期卡片開啟日曆。",
    },
    commonUses: {
      heading: "常見的日期區間計算",
      items: [
        "旅行天數計算",
        "假期天數計算",
        "專案期限計算",
        "工作日計算",
        "週末天數計算",
        "租期計算",
        "合約期間計算",
        "活動日期規劃",
      ],
    },
    faq: {
      heading: "日期區間計算器 FAQ",
      items: [
        {
          question: "如何計算兩個日期之間的天數？",
          answer:
            "在日曆上選擇開始日期與結束日期。總天數會包含起訖兩天。",
        },
        {
          question: "開始日期與結束日期會被包含在計算內嗎？",
          answer: "會。開始日期與結束日期都會計入總天數。",
        },
        {
          question: "什麼是工作日？",
          answer: "工作日為週一至週五。此工具不會排除國定假日。",
        },
        {
          question: "這個工具會計算週末嗎？",
          answer: "會。所選區間內的週六與週日會另外計算為週末天數。",
        },
        {
          question: "可以用來規劃旅行、專案或截止日嗎？",
          answer:
            "可以。適合用於旅行天數、專案時程、倒數或任何需要快速計算日期區間的情境。",
        },
      ],
    },
  },
  eventCountdown: {
    kicker: "事件倒數計時器",
    daysLeft: "剩餘天數",
    defaultTitle: "我的生日",
    defaultDisplayTitle: "我的活動",
    defaultDateLabel: "2026年12月31日",
    edit: "編輯",
    theme: "主題",
    share: "分享",
    copied: "已複製",
    copyFailed: "複製失敗",
    eventName: "事件名稱",
    eventDate: "事件日期",
    untilLabelPrefix: "直到",
    controlsAriaLabel: "工具控制項",
    editSheetAriaLabel: "編輯事件",
    quickTemplatesAriaLabel: "快速範本",
    inputPrefixTitle: "標題",
    inputPrefixDate: "日期",
    relatedToolsDrawerAriaLabel: "相關工具抽屜",
    toggleRelatedToolsDrawerAriaLabel: "切換相關工具抽屜",
    v2HolidayTemplates: [
      {
        id: "newYear",
        label: "新年",
        title: "2027 新年",
        date: "2027-01-01",
        ariaLabel: "使用新年範本",
      },
      {
        id: "christmas",
        label: "聖誕節",
        title: "2026 聖誕節",
        date: "2026-12-25",
        ariaLabel: "使用聖誕節範本",
      },
      {
        id: "valentinesDay",
        label: "情人節",
        title: "2027 情人節",
        date: "2027-02-14",
        ariaLabel: "使用情人節範本",
      },
    ],
    quickTemplates: {
      birthday: "生日",
      trip: "旅行",
      concert: "演唱會",
      graduation: "畢業",
    },
    templateTitles: {
      birthday: "我的生日",
      trip: "我的旅行",
      concert: "演唱會日",
      graduation: "畢業日",
    },
    about: {
      heading: "什麼是事件倒數計時器？",
      body: "事件倒數計時器可以幫你追蹤距離重要日期還有多久。可用於生日、旅行、婚禮、考試、節日、產品發表或任何個人重要事件。",
    },
    howTo: {
      heading: "如何使用事件倒數計時器？",
      body: "輸入事件名稱、選擇目標日期，倒數就會自動更新。也可使用快速範本，快速開始常見事件如生日、旅行、考試或節日。",
    },
    commonUses: {
      heading: "常見倒數用途",
      items: [
        "生日倒數",
        "旅行倒數",
        "婚禮倒數",
        "考試倒數",
        "聖誕節倒數",
        "跨年倒數",
        "產品發表倒數",
        "週年紀念倒數",
      ],
    },
    faq: {
      heading: "事件倒數計時器 FAQ",
      items: [
        {
          question: "可以用來倒數任何日期嗎？",
          answer:
            "可以。你可以為任何未來日期建立倒數，例如生日、旅行、婚禮、考試、節日或個人活動。",
        },
        {
          question: "倒數會記住我的事件嗎？",
          answer:
            "會。倒數可透過瀏覽器本機儲存記住你上次的事件，資料只保留在你的裝置上。",
        },
        {
          question: "到了事件日期會發生什麼事？",
          answer: "當目標日期到達時，倒數會顯示事件就是今天，或時間已經到了。",
        },
        {
          question: "可以在手機上使用嗎？",
          answer: "可以。Timiva 適合在手機、平板與桌面裝置上使用。",
        },
      ],
    },
  },
};
