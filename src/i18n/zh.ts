import type { Messages } from "./en";

export const zh: Messages = {
  meta: {
    home: {
      title: "Timiva — 簡單好用的時間與日期工具",
      description:
        "Timiva 提供簡單、舒服、手機好用的時間工具，包含事件倒數、日期區間、倒數計時與人生進度。",
    },
    eventCountdown: {
      title: "事件倒數計時器 — Timiva",
      description:
        "建立重要日期或事件的倒數計時，介面簡潔、適合手機使用，快速查看距離目標日還剩多久。",
    },
    dateRangeCalculator: {
      title: "日期區間計算 — Timiva",
      description:
        "快速計算兩個日期之間相差幾天，適合行程安排、專案規劃與日常日期查詢。",
    },
    countdownTimer: {
      title: "倒數計時器 — Timiva",
      description:
        "設定任意時長的倒數計時，介面簡潔、適合手機使用，快速開始計時。",
    },
    yearProgress: {
      title: "今年進度－查看今年已過與剩餘比例 | Timiva",
      description:
        "快速查看今年已經走過多少、還剩多少天，以及 12 個月份的年度節奏。依照你的本地時間自動更新。",
    },
    ageCalculator: {
      title: "年齡計算｜精準年齡與生活總天數 | Timiva",
      description:
        "輸入出生日期，快速計算完整歲數、精準的年／月／日，以及已走過的總天數。預設以今天計算，也可選擇指定日期。",
    },
    daysBetweenDates: {
      title: "日期差計算｜兩個日期相差幾天｜Timiva",
      description:
        "快速計算兩個日期相差幾天，支援直接輸入日期，也可以選擇是否包含選擇的兩個日期。",
    },
    businessDaysCalculator: {
      title: "工作日計算｜Timiva",
      description:
        "計算兩個日期之間共有多少個工作日，並查看總天數與週末天數。開始日期與結束日期皆納入計算。",
    },
    dateCalculator: {
      title: "日期加減計算｜Timiva",
      description:
        "從起始日期加上或減去年、月、週、日，立即得到新的目標日期。",
    },
    hoursCalculator: {
      title: "時數計算｜Timiva",
      description:
        "計算兩個時間之間相隔的時數與分鐘，並可選填休息時間。跨午夜時段會自動視為隔天。",
    },
    japaneseEraConverter: {
      title: "日本年號換算｜Timiva",
      description:
        "在西元與日本近現代年號（明治、大正、昭和、平成、令和）之間雙向換算，範圍為明治6年（1873年）至西元2100年；改元年份會同時顯示兩個年號。",
    },
    lunarDateConverter: {
      title: "國曆農曆轉換｜Timiva",
      description: "在西曆與農曆日期之間換算。簡單日期轉換，不含農民曆宜忌等內容。",
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
    heroLead: "簡單、舒服、手機好用的時間與生活節奏工具。",
    chipsGroupAriaLabel: "Timiva 工具類別",
    chips: ["重要日期", "日期計算", "年齡計算", "今年進度"],
    featuredTools: {
      "date-range": {
        title: "日期區間計算",
        description: "快速計算兩個日期之間相差幾天、工作日與週末。",
      },
      "age-calculator": {
        title: "年齡計算",
        description:
          "快速計算完整歲數、精準的年／月／日與已走過的總天數，預設以今天或指定日期計算。",
      },
      "event-countdown": {
        title: "事件倒數",
        description: "為生日、旅行、節日或重要日子建立清楚好看的倒數。",
      },
      "year-progress": {
        title: "今年進度",
        description: "快速查看今年已經走過多少、還剩多少，依照你的本地時間自動更新。",
      },
    },
    faq: {
      heading: "常見問題與協助",
      items: [
        {
          question: "Timiva 可以用來做什麼？",
          answer:
            "Timiva 提供簡單、舒服、手機好用的時間工具，可以用來計算日期區間、計算精準年齡、建立事件倒數、設定倒數計時，也能查看今年進度。",
        },
        {
          question: "Timiva 有哪些工具？",
          answer:
            "目前 Timiva 工具包含日期區間計算、年齡計算、事件倒數、今年進度與倒數計時器。這些工具分別對應日期計算、精準年齡、重要日期、長期時間進度，以及專注或日常任務的短計時。",
        },
        {
          question: "如何開始使用 Timiva 的工具？",
          answer:
            "打開你需要的工具即可開始使用。每個工具都以手機優先設計，盡量減少輸入欄位與設定步驟，讓你打開後就能快速完成主要操作。",
        },
        {
          question: "Timiva 可以在手機上使用嗎？",
          answer:
            "可以。Timiva 的工具卡片、輸入欄位、按鈕與結果畫面都優先考慮手機操作，讓你在手機直式或橫式瀏覽時都能清楚使用。",
        },
        {
          question: "Timiva 會儲存我的資料嗎？",
          answer:
            "Timiva 主要在你的瀏覽器中運作。部分工具可能會使用本機儲存記住你上次輸入的內容，但不需要註冊或登入，也不會建立帳號資料庫。",
        },
        {
          question: "為什麼 Timiva 不放很多工具在首頁？",
          answer:
            "Timiva 的理念是少工具，但每個都要簡單、清楚、舒服。首頁固定保留少數主要工具，是為了避免變成傳統工具大全，讓使用者可以更快找到真正需要的入口。",
        },
        {
          question: "Timiva 是免費使用的嗎？",
          answer: "是的，Timiva 目前可以免費使用，不需要註冊帳號。",
        },
      ],
    },
    ctaPrimary: "建立倒數計時",
    ctaSecondary: "計算日期區間",
    toolsSectionLabel: "精選時間工具",
    brandNote:
      "Timiva 專注於把常用的時間操作變得更清楚。沒有複雜設定，也不需要註冊帳號，打開工具就能開始使用。",
    viewAllTools: "查看全部工具",
  },
  footer: {
    navLabel: "網站",
    tagline: "為日期、專注與日常節奏打造的簡單工具。",
    allTools: "全部工具",
    copyright: "© 2026 Timiva",
    privacy: "隱私權政策",
    terms: "使用條款",
    contact: "聯絡我們",
    analyticsSettings: "分析設定",
    emailLabel: "Email",
    email: "hello@timiva.app",
  },
  analytics: {
    bannerRegionLabel: "分析同意提示",
    bannerBody:
      "Timiva 使用可選的分析功能，了解頁面使用情況並改善工具。你可以允許分析，或僅使用必要功能。",
    necessaryOnly: "僅使用必要功能",
    allowAnalytics: "允許分析",
    settingsTitle: "分析設定",
    settingsBody: "選擇是否允許 Timiva 使用 Google Analytics。這不會影響工具的正常使用。",
    privacyLink: "詳見隱私權政策",
    close: "關閉",
    save: "儲存",
  },
  relatedTools: {
    heading: "你可能也會需要",
    viewAllTools: "查看全部工具 →",
  },
  toolAds: {
    sponsored: "廣告",
    ad: "廣告",
  },
  allTools: {
    heading: "全部工具",
    lead: "這裡整理 Timiva 目前已完成的工具，選一個就能立即開始使用。",
    categories: {
      datesEvents: "重要日子",
      productivity: "計時與專注",
      bodyFlow: "日常節奏",
      momentum: "人生進度",
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
      title: "日期區間計算",
      description: "快速計算兩個日期之間相差幾天，包含工作日與週末。",
      compactDescription: "計算兩日期間隔。",
      relatedDescription: "計算日期差。",
    },
    countdownTimer: {
      title: "倒數計時器",
      description: "為專注、料理、運動或休息設定一段清楚的倒數時間。",
      compactDescription: "設定倒數計時。",
      relatedDescription: "專注與日常計時。",
    },
    yearProgress: {
      title: "今年進度",
      description: "快速查看今年已經走過多少、還剩多少，依照你的本地時間自動更新。",
      compactDescription: "查看今年進度。",
      relatedDescription: "一眼看見今年進度。",
    },
    ageCalculator: {
      title: "年齡計算",
      description:
        "快速計算完整歲數、精準的年／月／日與已走過的總天數，預設以今天或指定日期計算。",
      compactDescription: "計算精準年齡與生活總天數。",
      relatedDescription: "查看精準年齡。",
    },
    daysBetweenDates: {
      title: "日期差計算",
      description: "快速計算兩個日期之間相差幾天。",
      compactDescription: "計算兩個日期之間相差幾天。",
      relatedDescription: "查看兩個日期之間相差幾天。",
    },
    businessDaysCalculator: {
      title: "工作日計算",
      description: "計算兩個日期之間的工作日數，排除星期六與星期日。",
      compactDescription: "計算兩個日期之間的平日天數。",
      relatedDescription: "計算兩個日期之間的工作日數。",
    },
    dateCalculator: {
      title: "日期加減計算",
      description: "從起始日期加上或減去年、月、週、日，立即得到新的目標日期。",
      compactDescription: "對日期加減一段時間。",
      relatedDescription: "對日期加上或減去年、月、週、日。",
    },
    hoursCalculator: {
      title: "時數計算",
      description: "計算兩個時間之間相隔的時數與分鐘，並可選填休息時間。",
      compactDescription: "計算兩個時間之間的時數。",
      relatedDescription: "查看兩個時間之間相隔的時數與分鐘。",
    },
    japaneseEraConverter: {
      title: "日本年號換算",
      description:
        "在西元與日本近現代年號之間進行雙向換算，範圍為明治6年（1873年）至西元2100年。",
      compactDescription: "和曆與西元年份換算。",
      relatedDescription: "和曆與西元年份換算。",
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
    kicker: "日期區間計算",
    totalDays: "總天數",
    workdays: "工作日",
    weekends: "週末",
    dateRangePlaceholder: "開始日期 — 結束日期",
    startDate: "開始日期",
    endDate: "結束日期",
    clearDates: "清除日期",
    chooseDateRange: "選擇日期區間",
    changeDateRange: "變更日期區間",
    controlsAriaLabel: "工具控制項",
    calendarLabel: "日期區間日曆",
    resultsLabel: "日期區間結果",
    previousMonth: "上一個月",
    nextMonth: "下一個月",
    weekdays: ["一", "二", "三", "四", "五", "六", "日"],
    about: {
      heading: "什麼是日期區間計算？",
      body: "日期區間計算可以幫你快速計算兩個日期之間相差多久，包含總天數、工作日與週末天數。適合用於旅遊天數、專案時程、截止日期與日常日期查詢。",
    },
    howTo: {
      heading: "如何使用日期區間計算？",
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
    relatedToolsDrawerAriaLabel: "相關工具抽屜",
    toggleRelatedToolsDrawerAriaLabel: "切換相關工具抽屜",
    faq: {
      heading: "日期區間計算 FAQ",
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
  countdownTimer: {
    kicker: "倒數計時器",
    cancel: "取消",
    start: "開始",
    pause: "暫停",
    resume: "繼續",
    done: "完成",
    timesUp: "時間到了",
    last: "上次",
    setTimerDuration: "設定倒數時間",
    setTimerMinutes: "設定倒數分鐘",
    customSheetAriaLabel: "自訂時間",
    hoursLabel: "小時",
    minutesLabel: "分鐘",
    secondsLabel: "秒",
    applyAndStart: "套用並開始",
    maximumDuration: "最長可設定 9:59:59",
    zeroDuration: "請設定大於 0 的時間",
    controlsAriaLabel: "計時器控制項",
    soundOff: "關閉提示音",
    soundOn: "開啟提示音",
    quickStartAriaLabel: "快速開始選項",
    quickStartLabels: ["30秒", "1分", "5分", "10分", "25分", "1小時"],
    relatedToolsDrawerAriaLabel: "相關工具側欄",
    toggleRelatedToolsDrawerAriaLabel: "切換相關工具側欄",
    about: {
      heading: "關於倒數計時器",
      body: "倒數計時器可以用來設定短時間倒數，例如專注、休息、料理、運動，或任何需要清楚看見剩餘時間的情境。",
    },
    howTo: {
      heading: "如何使用倒數計時器",
      steps: [
        "選擇快速時間，或設定自訂時間。",
        "開始倒數。",
        "需要時可以暫停、繼續或取消。",
        "時間到了後，點選「完成」回到初始狀態。",
      ],
    },
    commonUses: {
      heading: "常見倒數計時用途",
      items: [
        "專注計時",
        "休息倒數",
        "料理計時",
        "運動計時",
        "會議計時",
        "讀書計時",
        "小睡倒數",
        "螢幕時間提醒",
      ],
    },
    faq: {
      heading: "倒數計時器 FAQ",
      items: [
        {
          question: "倒數計時器可以用來做什麼？",
          answer:
            "倒數計時器適合短時間倒數，例如專注、休息、料理、運動，或任何需要清楚看見剩餘時間的情境。",
        },
        {
          question: "這和番茄鐘（Pomodoro Timer）有什麼不同？",
          answer:
            "倒數計時器適合設定單次時長並倒數完成。番茄鐘通常包含固定的專注／休息週期與回合流程；這個工具只提供簡單倒數，不是完整的番茄鐘應用。",
        },
        {
          question: "倒數計時器和事件倒數有什麼不同？",
          answer:
            "倒數計時器會倒數你設定的時長，例如 15 分鐘。事件倒數則是倒數到特定日期或事件，例如生日或旅行。",
        },
        {
          question: "離開頁面後倒數還會繼續嗎？",
          answer:
            "若只是切換到其他 App 或分頁後再回來，且頁面未被重新整理，剩餘時間會依結束時間重新計算。重新整理頁面後，進行中的倒數不會恢復。",
        },
        {
          question: "會記住上次使用的時間嗎？",
          answer:
            "會。在你實際開始一次倒數後，該時間可在下次使用時出現在上次快捷按鈕中，並保存在你的裝置上。",
        },
        {
          question: "時間到了會有提示音嗎？",
          answer:
            "提示音預設為關閉。你可以在倒數中開啟提示音，時間到了會依當下的提示音設定顯示。",
        },
      ],
    },
  },
  yearProgress: {
    h1: "今年進度",
    resultPlaceholder: "—",
    staticYearHeadline: "2026 年已經走過",
    staticPercentValue: "46",
    staticPercent: "46%",
    staticDaysPassed: "已過 156 天",
    staticDaysRemaining: "剩餘 209 天",
    staticDaysSeparator: " / ",
    daysPassedLabel: "已過天數",
    daysRemainingLabel: "剩餘天數",
    theme: "主題",
    share: "分享",
    shareTitle: "今年進度 | Timiva",
    copied: "已複製",
    copyFailed: "複製失敗",
    controlsAriaLabel: "工具控制項",
    segmentsAriaLabel: "月份年度進度",
    relatedToolsDrawerAriaLabel: "相關工具抽屜",
    toggleRelatedToolsDrawerAriaLabel: "切換相關工具抽屜",
    about: {
      heading: "關於今年進度",
      body: "今年進度讓你快速看見今年已經走過多少、還剩多少。頁面會依照裝置的本地時間自動更新，不需要輸入日期或設定目標。",
    },
    howTo: {
      heading: "如何使用今年進度",
      body: "打開頁面即可查看今年進度、已過天數與剩餘天數。當月提醒和 12 段月份進度會自動更新。你也可以切換主題，或分享目前的年度進度。",
    },
    tags: {
      heading: "今年進度標籤",
      items: ["年度回顧", "時間感", "輕量提醒"],
    },
    faq: {
      heading: "今年進度 FAQ",
      items: [
        {
          question: "今年進度是怎麼計算的？",
          answer:
            "工具會依照你裝置的本地日期與時間，計算從今年開始到明年開始之間已經經過的比例。",
        },
        {
          question: "閏年會怎麼計算？",
          answer: "閏年會以 366 天計算，2 月使用 29 天。畫面仍維持 12 段月份進度，不會增加第 13 段。",
        },
        {
          question: "為什麼 12 月 31 日不會太早顯示 100%？",
          answer:
            "為了避免在一年真正結束前就顯示完成，工具會讓進度在年末持續接近 100%，並在跨年後切換到新年度。",
        },
        {
          question: "需要輸入個人資料嗎？",
          answer:
            "不需要。工具會直接使用裝置的本地時間計算，不需要生日、帳號或其他個人資料。",
        },
        {
          question: "可以在手機上使用嗎？",
          answer:
            "可以。手機直式會顯示完整年度資訊；手機橫式會保留主要數字與控制，減少畫面擁擠。",
        },
      ],
    },
  },
  ageCalculator: {
    kicker: "年齡計算",
    primaryResultUnit: "歲",
    exactAgeZero: "0 年 0 個月 0 天",
    daysLivedZero: "已走過 0 天",
    birthDateLabel: "出生日期",
    birthDatePlaceholder: "YYYY / MM / DD",
    birthDateDesktopPlaceholder: "點這裡輸入生日 YYYY/MM/DD",
    yearFieldLabel: "年",
    monthFieldLabel: "月",
    dayFieldLabel: "日",
    yearPlaceholder: "YYYY",
    monthPlaceholder: "MM",
    dayPlaceholder: "DD",
    calendarLabel: "出生日期日曆",
    openCalendarAriaLabel: "開啟出生日期日曆",
    previousMonth: "上一個月",
    nextMonth: "下一個月",
    weekdays: ["一", "二", "三", "四", "五", "六", "日"],
    exactAgeTemplate: "{years} 年 {months} 個月 {days} 天",
    daysLivedTemplate: "已走過 {count} 天",
    invalidBirthDate: "請輸入有效日期",
    asOfToday: "截至今天",
    asOfTemplate: "截至 {date}",
    asOfTodaySheetValue: "今天",
    asOfCalendarLabel: "計算日期日曆",
    openAsOfCalendarAriaLabel: "變更計算日期",
    invalidAsOfDate: "請輸入有效計算日期",
    backToTodayAriaLabel: "回到今天",
    startChoosingBirthday: "開始選擇生日",
    sheetAriaLabel: "年齡計算輸入",
    birthDateFieldAriaLabel: "出生日期",
    upperControlsAriaLabel: "年齡計算控制項",
    relatedToolsDrawerAriaLabel: "相關工具側欄",
    toggleRelatedToolsDrawerAriaLabel: "切換相關工具側欄",
    about: {
      heading: "什麼是年齡計算？",
      body: "輸入出生日期，即可查看截至今天或指定日期的年齡。結果包含完整歲數、精準的年／月／日，以及已走過的總天數。",
    },
    howTo: {
      heading: "如何使用這個年齡計算工具",
      steps: [
        "直接輸入出生日期，或使用日曆選擇。",
        "工具預設以今天計算；需要時可以修改計算日期。",
        "查看完整歲數、精準年齡與已走過的總天數。",
      ],
    },
    commonUses: {
      heading: "常見年齡計算用途",
      items: [
        "精準年齡計算",
        "已走過天數",
        "生日年齡",
        "未來日期年齡",
        "過去日期年齡",
        "表單填寫",
        "個人紀錄",
      ],
    },
    faq: {
      heading: "年齡計算 FAQ",
      items: [
        {
          question: "年齡是怎麼計算的？",
          answer:
            "工具會先計算完整年數，再計算完整月數與剩餘天數，顯示精準的年、月、日結果。",
        },
        {
          question: "「已走過的總天數」怎麼計算？",
          answer:
            "總天數是出生日期與計算日期之間實際經過的日曆天數。出生當天為第 0 天，隔天才算走過 1 天。",
        },
        {
          question: "可以計算過去或未來某一天的年齡嗎？",
          answer:
            "可以。工具預設以今天計算，你也可以修改計算日期，查看自己在指定日期的年齡。",
        },
        {
          question: "2 月 29 日出生的人怎麼計算？",
          answer:
            "在閏年以 2 月 29 日作為生日；非閏年則以 3 月 1 日作為生日週年。",
        },
        {
          question: "工具會儲存我的出生日期嗎？",
          answer:
            "不會。出生日期與計算結果只會用於目前頁面的計算，重新整理或離開頁面後不會儲存。",
        },
      ],
    },
  },
  daysBetweenDates: {
    kicker: "日期差計算",
    primaryResultUnit: "天",
    secondaryResultZero: "0 週又 0 天",
    dateRangePlaceholder: "YYYY / MM / DD  —  YYYY / MM / DD",
    mobileSelectDates: "選擇日期",
    includeBothDates: "包含選擇的兩個日期",
    includeBothDatesActive: "✓ 已包含選擇的兩個日期",
    invalidDateMessage: "請輸入 1900–2100 之間的有效日期",
    fromDateLabel: "從",
    toDateLabel: "到",
    fromDateInputAriaLabel: "起始日期",
    toDateInputAriaLabel: "結束日期",
    dateInputPlaceholder: "YYYY / MM / DD",
    sheetAriaLabel: "日期差計算輸入",
    openDateSheetAriaLabel: "編輯日期",
    upperControlsAriaLabel: "日期差計算控制項",
    relatedToolsDrawerAriaLabel: "相關工具側欄",
    toggleRelatedToolsDrawerAriaLabel: "切換相關工具側欄",
    about: {
      heading: "關於日期差計算",
      body: "快速計算兩個日期之間相差幾天。適合旅行規劃、期限、紀念日、事件距離與專案日期等日常情境。",
    },
    howTo: {
      heading: "如何使用日期差計算",
      steps: [
        "輸入第一個日期。",
        "輸入第二個日期。",
        "立即查看兩個日期相差幾天。",
        "如果想把選擇的兩個日期也算進去，可以開啟「包含選擇的兩個日期」。",
      ],
    },
    commonUses: {
      heading: "常見用途",
      items: ["旅行規劃", "專案期限", "活動安排", "紀念日", "日期差"],
    },
    faq: {
      heading: "日期差計算 FAQ",
      items: [
        {
          question: "如何計算兩個日期相差幾天？",
          answer:
            "輸入兩個日期後，結果會自動更新，不需要再按計算按鈕。",
        },
        {
          question: "結果會包含我選擇的兩個日期嗎？",
          answer:
            "預設不會。預設結果是兩個日期之間的差距。如果想把選擇的兩個日期也算進去，可以開啟「包含選擇的兩個日期」。",
        },
        {
          question: "為什麼同一天到同一天是 0 天？",
          answer:
            "因為預設顯示的是兩個日期之間的差距。如果你希望選擇的日期本身也算 1 天，可以開啟「包含選擇的兩個日期」。",
        },
        {
          question: "日期順序會影響結果嗎？",
          answer:
            "不會。這個工具會計算兩個日期的絕對差，所以先輸入較晚日期或較早日期，結果都一樣。",
        },
        {
          question: "可以不開日曆，直接輸入日期嗎？",
          answer:
            "可以。這個工具以快速日期輸入為主，支援純數字日期，也支援斜線或橫線格式。",
        },
        {
          question: "這和日期區間計算有什麼不同？",
          answer:
            "日期差計算適合快速知道兩個日期相差幾天。日期區間計算則適合查看更多區間資訊，例如工作日或週末日。",
        },
      ],
    },
  },
  businessDaysCalculator: {
    kicker: "工作日計算",
    primaryResultUnit: "個工作日",
    totalDaysLabel: "總天數",
    weekendDaysLabel: "週末天數",
    fromDateLabel: "開始日期",
    toDateLabel: "結束日期",
    fromDateInputAriaLabel: "開始日期",
    toDateInputAriaLabel: "結束日期",
    dateInputPlaceholder: "YYYY / MM / DD",
    upperControlsAriaLabel: "工作日計算日期區間控制",
    mobileSelectDates: "選擇日期",
    openDateSheetAriaLabel: "編輯日期",
    sheetAriaLabel: "工作日計算日期輸入",
    yearFieldLabel: "年",
    monthFieldLabel: "月",
    calendarLabel: "工作日計算日期區間日曆",
    openCalendarAriaLabel: "開啟日期區間日曆",
    previousMonth: "上個月",
    nextMonth: "下個月",
    weekdays: ["一", "二", "三", "四", "五", "六", "日"],
    relatedToolsDrawerAriaLabel: "相關工具側欄",
    toggleRelatedToolsDrawerAriaLabel: "切換相關工具側欄",
    about: {
      heading: "關於工作日計算",
      body: "工作日計算可以算出兩個日期之間共有多少個星期一至星期五。開始日期與結束日期若為平日，都會納入計算；星期六與星期日會被排除。目前不扣除國定假日。",
    },
    howTo: {
      heading: "如何使用工作日計算",
      steps: [
        "輸入開始日期與結束日期。",
        "可直接輸入日期，或在桌機使用日曆選擇日期區間。",
        "工具會自動顯示工作日數、總天數與週末天數。",
      ],
    },
    commonUses: {
      heading: "常見用途",
      items: ["專案排程", "交付時程", "工作安排", "期限計算", "商務時程"],
    },
    faq: {
      heading: "工作日計算常見問題",
      items: [
        {
          question: "什麼是工作日？",
          answer:
            "星期一至星期五會計為工作日，星期六與星期日不會列入。",
        },
        {
          question: "開始日期與結束日期會算進去嗎？",
          answer:
            "會。開始日期與結束日期若為平日，都會納入工作日數；若日期落在週末，則不會計為工作日。",
        },
        {
          question: "工作日計算會扣除國定假日嗎？",
          answer:
            "不會。目前只排除星期六與星期日，不會扣除國定假日或其他自訂休假日。",
        },
        {
          question: "如果開始日期晚於結束日期會怎麼處理？",
          answer:
            "工具會自動將較早的日期放在前面，再計算相同的日期區間，不需要重新輸入。",
        },
        {
          question: "可以計算過去或未來的日期嗎？",
          answer:
            "可以。工具支援 1900 年 1 月 1 日至 2100 年 12 月 31 日之間的有效日期區間。",
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
  dateCalculator: {
    kicker: "日期加減計算",
    scaffoldLead: "從起始日期加上或減去年、月、週、日。",
    relatedToolsDrawerAriaLabel: "相關工具側欄",
    toggleRelatedToolsDrawerAriaLabel: "開啟或關閉相關工具側欄",
    upperControlsAriaLabel: "日期與期間操作",
    startDateLabel: "起始日期",
    dateInputPlaceholder: "起始日期 YYYY / MM / DD",
    startDateInputAriaLabel: "起始日期",
    openCalendarAriaLabel: "開啟日曆",
    yearsLabel: "年",
    monthsLabel: "月",
    weeksLabel: "週",
    daysLabel: "日",
    durationZeroPlaceholder: "0",
    directionGroupAriaLabel: "加上或減去",
    directionAddAriaLabel: "加上",
    directionSubtractAriaLabel: "減去",
    resetLabel: "重設",
    setDateAndDuration: "設定日期與期間",
    openSheetAriaLabel: "設定日期與期間",
    sheetAriaLabel: "日期與期間",
    resultInitialSupport: "輸入起始日期，再加上或減去一段時間。",
    summaryStartingDate: "起始日期",
    validationStartDate: "請輸入 1900 至 2200 之間的有效起始日期。",
    validationDuration: "年／月／週／日請輸入非負整數。",
    validationOutOfRange: "計算結果超出支援的日期範圍（1900–2200）。",
    validationUnsafeInteger: "數字過大，請輸入較小的整數。",
    /* 數字與單位以 NBSP 綁定，Portrait 可於組間換行，避免「日」單獨成行 */
    fixtureValidPrimary: "2200\u00A0年\n12\u00A0月 31\u00A0日",
    fixtureValidWeekday: "星期三",
    fixtureValidSupport: "從 2199 年 6 月 16 日起，加上 1 年 5 個月 6 週 3 天。",
    about: {
      heading: "什麼是日期加減計算？",
      body: "日期加減計算可從起始日期加上或減去年、月、週、日，算出新的目標日期。你可以只填一種期間，也可以同時混合多種期間。計算使用自然日，不排除週末或國定假日。它不是用來量測兩個日期之間有多長的日期區間計算，也不是只計算平日的工作日計算。",
    },
    howTo: {
      heading: "如何使用日期加減計算",
      steps: [
        "輸入起始日期。",
        "選擇加上或減去。",
        "輸入年、月、週與／或日。",
        "查看目標日期與星期。",
      ],
    },
    commonUses: {
      heading: "常見用途",
      items: ["加上天數", "減去天數", "日期加減", "未來日期", "過去日期", "混合期間"],
    },
    faq: {
      heading: "日期加減計算 FAQ",
      items: [
        {
          question: "如何計算某日期的幾天後？",
          answer:
            "輸入起始日期，選擇加上，再輸入天數，目標日期會立即更新。",
        },
        {
          question: "可以同時加上年、月、週、日嗎？",
          answer:
            "可以。你可以只填一個單位，也可以同時填多個單位。計算順序固定為：年 → 月 → 週 → 日。",
        },
        {
          question: "月底日期不存在時怎麼計算？",
          answer:
            "加減年或月後，如果目標月份沒有原本的日期，結果會調整為該月最後一個有效日期。閏年也依同樣規則處理。",
        },
        {
          question: "一週是否固定等於七天？",
          answer: "是。一週固定等於 7 個自然日。",
        },
        {
          question: "是否會排除週末或國定假日？",
          answer:
            "不會。日期加減計算只使用自然日，不排除週末或國定假日。若只要計算平日，請使用工作日計算；若要量測兩個日期之間的長度，請使用日期區間計算。",
        },
        {
          question: "可以計算過去的日期嗎？",
          answer: "可以。選擇減去，即可從起始日期往回計算過去的目標日期。",
        },
      ],
    },
  },
  hoursCalculator: {
    kicker: "時數計算",
    scaffoldLead: "計算兩個時間之間相隔的時數與分鐘。",
    relatedToolsDrawerAriaLabel: "相關工具側欄",
    toggleRelatedToolsDrawerAriaLabel: "開啟或關閉相關工具側欄",
    upperControlsAriaLabel: "時間區間操作",
    resultsLabel: "時數計算結果",
    rangePlaceholder: "輸入時間 HH:MM–HH:MM",
    rangeInputAriaLabel: "開始與結束時間",
    breakPlaceholder: "輸入休息時間 HH:MM",
    breakInputAriaLabel: "休息時間",
    addBreakLabel: "＋ 加入休息時間",
    removeBreakAriaLabel: "移除休息時間",
    invalidTimeAriaLabel: "時間格式不正確",
    invalidBreakAriaLabel: "休息時間不正確",
    startTimeLabel: "開始時間",
    endTimeLabel: "結束時間",
    breakTimeLabel: "休息時間",
    capsuleEmptyLabel: "開始時間 — 結束時間",
    capsuleNextDayLabel: "隔天",
    openSheetAriaLabel: "編輯開始、結束與休息時間",
    sheetAriaLabel: "時數計算時間編輯",
    sheetTitle: "設定時間",
    clearTimesLabel: "清除",
    segmentHoursAriaLabel: "小時",
    segmentMinutesAriaLabel: "分鐘",
    segmentHoursPlaceholder: "HH",
    segmentMinutesPlaceholder: "MM",
    resultPrimaryZero: "0 小時 0 分鐘",
    resultSupportZero: "0 小時 · 0 分鐘",
    /* B1B Owner review fixtures（static only） */
    fixtureSameDayPrimary: "8 小時 20 分鐘",
    fixtureSameDaySupport: "8.33 小時 · 500 分鐘",
    fixtureOvernightPrimary: "8 小時",
    fixtureOvernightSupport: "8 小時 · 480 分鐘 · 隔天",
    fixtureWithBreakPrimary: "8 小時 20 分鐘",
    fixtureWithBreakSupportLine1: "8.33 小時 · 500 分鐘 · 隔天",
    fixtureWithBreakSupportLine2: "已扣除 30 分鐘休息時間",
    about: {
      heading: "關於時數計算",
      body: "時數計算用來查看開始時間與結束時間之間相隔多久。支援跨午夜：當結束時間較早時，會自動視為隔天。你也可以選填休息時間，從結果中扣除。結果會顯示一般時長、小數時數與總分鐘數，適合工時、班次、活動或其他單一時段。本工具只處理 24 小時內的一段時間，不處理跨多日區間。",
    },
    howTo: {
      heading: "如何使用時數計算",
      steps: [
        "輸入開始時間與結束時間。",
        "視需要輸入休息時間。",
        "直接查看即時更新的結果。",
      ],
    },
    commonUses: {
      heading: "常見用途",
      items: ["工時", "班次", "休息扣除", "跨午夜時段"],
    },
    faq: {
      heading: "時數計算 FAQ",
      items: [
        {
          question: "時數計算怎麼使用？",
          answer:
            "輸入開始時間與結束時間後，工具會立即計算兩者相隔的時數與分鐘。需要扣除休息時，可再輸入一段休息時間。",
        },
        {
          question: "結束時間比開始時間早，會怎麼計算？",
          answer:
            "工具會自動將結束時間視為隔天。例如 22:00–06:00 會計算為 8 小時，並在結果中顯示「隔天」。",
        },
        {
          question: "可以扣除休息時間嗎？",
          answer:
            "可以。休息時間為選填，輸入有效時會從原始時長中扣除；空白或 00:00 不會扣除。",
        },
        {
          question: "可以計算超過 24 小時的時間嗎？",
          answer:
            "不可以。時數計算只處理 24 小時內的一段時間。跨多日的區間需要搭配日期類工具計算。",
        },
        {
          question: "這個工具會儲存我輸入的時間嗎？",
          answer:
            "不會。本工具不使用 LocalStorage；重新整理頁面後會回到空白狀態。",
        },
      ],
    },
  },
  japaneseEraConverter: {
    kicker: "日本年號換算",
    shortDescription:
      "在西元與日本近現代年號（明治、大正、昭和、平成、令和）之間換算，範圍為明治6年（1873年）至西元2100年。",
    primaryActionLabel: "輸入換算年份",
    relatedToolsDrawerAriaLabel: "相關工具側欄",
    toggleRelatedToolsDrawerAriaLabel: "開啟或關閉相關工具側欄",
    upperControlsAriaLabel: "日本年號換算操作",
    resultsLabel: "日本年號換算結果",
    resetLabel: "重設",
    switchAriaLabel: "切換輸入曆法",
    gregorianPrefix: "西元",
    gregorianPlaceholderPrefix: "這裡填寫西元年份，例如 ",
    gregorianInputAriaLabel: "西元年份",
    eraYearPlaceholderPrefix: "這裡填寫和曆年份，例如 ",
    eraYearInputAriaLabel: "和曆年份",
    eraSelectorAriaLabel: "日本年號",
    assumptionNote: "此結果假設令和年號持續使用",
    sheetAriaLabel: "輸入要換算的年份",
    sheetTitle: "輸入換算年份",
    ameGregorianLabel: "西元",
    ameEraLabel: "年號",
    ameEraYearLabel: "年",
    ameSwitchToEra: "改用和曆輸入",
    ameSwitchToGregorian: "改用西元輸入",
    eraNames: {
      meiji: "明治",
      taisho: "大正",
      showa: "昭和",
      heisei: "平成",
      reiwa: "令和",
    },
    fixtureNormalPrimary: "令和8年",
    fixtureGregorianPrimary: "2026年",
    fixtureTransitionPrimary: "大正15年｜昭和元年",
    fixtureTransitionSupport:
      "大正15年 1月1日－12月24日 / 昭和元年 12月25日－12月31日",
    fixtureTransitionHeiseiPrimary: "平成31年｜令和元年",
    fixtureTransitionHeiseiSupport:
      "平成31年 1月1日－4月30日 / 令和元年 5月1日－12月31日",
    fixturePartialPrimary: "2019年",
    fixturePartialSupport: "1月1日－4月30日",
    fixtureFuturePrimary: "令和82年",
    about: {
      heading: "關於日本年號換算",
      body: "日本年號換算可以快速在西元與日本近現代年號之間進行雙向換算。工具支援明治、大正、昭和、平成與令和，換算範圍從明治6年（1873年）至西元2100年。遇到年號交替的年份時，會同時顯示該年可能對應的兩個年號與日期範圍。",
    },
    howTo: {
      heading: "如何使用日本年號換算",
      steps: [
        "輸入西元年份，即可查看對應的日本年號。",
        "也可以切換輸入方式，選擇日本年號並輸入年份，換算成對應的西元年份。",
        "例如：西元 2026 年 → 令和8年；令和8年 → 西元 2026 年；西元 2019 年 → 平成31年／令和元年。",
        "若輸入的是未來的令和年份，工具會以令和持續使用為前提進行換算，並顯示提示說明。",
      ],
    },
    commonUses: {
      heading: "常見使用情境",
      items: [
        "閱讀日本文件或資料時換算年號",
        "查找日本歷史事件的西元年份",
        "閱讀小說、漫畫或觀看影劇時理解故事年代",
        "查看昭和、平成、令和等年份與西元的對照",
        "在填寫或閱讀日本年份資料時快速確認西元年份",
      ],
    },
    faq: {
      heading: "日本年號換算 FAQ",
      items: [
        {
          question: "為什麼日本年號換算從明治6年開始？",
          answer:
            "日本在明治6年（1873年）開始採用現在使用的太陽曆（Gregorian calendar）。在此之前，日本使用的是太陰太陽曆，因此若要精確處理更早的日期，會涉及舊曆與新曆的轉換。Timiva 將換算範圍從明治6年開始，專注於近現代日本年號與西元之間的簡單換算。",
        },
        {
          question: "為什麼同一個西元年份會出現兩個日本年號？",
          answer:
            "日本年號可能在一年中的某一天更換，因此同一個西元年份可能跨越兩個年號。例如 2019 年的 1 月 1 日至 4 月 30 日屬於平成31年，5 月 1 日起則為令和元年。因為這個工具只輸入年份、沒有輸入月日，所以遇到年號交替年份時，會同時顯示該年可能對應的兩個年號與日期範圍。",
        },
        {
          question: "日本年號中的「元年」是什麼意思？",
          answer:
            "「元年」就是一個新年號開始後的第一年。例如令和自 2019 年開始，因此 2019 年對應令和的部分稱為「令和元年」，下一年才是「令和2年」。",
        },
        {
          question: "可以換算未來的令和年份嗎？",
          answer:
            "可以。Timiva 支援換算至西元 2100 年。若換算超過目前年份的令和年份，結果會以「令和持續使用」為前提計算，並顯示提示說明。未來若日本啟用新的年號，實際年號可能與換算結果不同。",
        },
        {
          question: "這個工具支援更早的日本年號嗎？",
          answer:
            "目前不支援。Timiva 的日本年號換算從明治6年（1873年）開始，支援明治、大正、昭和、平成與令和。更早的日本年號不在這個工具的換算範圍內，讓工具保持簡單，專注於近現代年號與西元之間的快速換算。",
        },
      ],
    },
  },
  lunarDateConverter: {
    kicker: "國曆農曆轉換",
    relatedToolsDrawerAriaLabel: "相關工具側欄",
    toggleRelatedToolsDrawerAriaLabel: "開啟或關閉相關工具側欄",
    relatedToolsHeading: "你可能也會需要",
    mobileControlsAriaLabel: "國曆農曆轉換控制項",
    upperControlsAriaLabel: "國曆農曆轉換控制項",
    resultsLabel: "國曆農曆轉換結果",
    /* B1B：語意兩行（\\n）；仍屬單一 primary，非 primary+detail */
    fixtureDefaultPrimary: "農曆丙午年\n七月初五日",
    fixtureDefaultWeekday: "星期一",
    fixtureDateValue: "2026 / 08 / 17",
    switchToLunarInput: "切換為農曆輸入",
    switchToGregorianInput: "切換為國曆輸入",
    dateLabel: "國曆日期",
    dateInputAriaLabel: "國曆日期",
    dateInputPlaceholder: "YYYY / MM / DD",
    lunarInputPlaceholder: "例：1980/4/14 或 1963閏4月15",
    lunarInputAriaLabel: "農曆日期",
    resetLabel: "重設",
    errorUnrecognizedFormat: "無法辨識的農曆格式",
    errorOutOfRange: "年份須為 1901–2099",
    errorInvalidDate: "日期無效",
    errorInvalidLeapMonth: "閏月無效",
    errorInvalidLunarDay: "此月份無此日期",
    errorUnsupportedLeapTypo: "閏月請使用「閏」，不支援「潤」",
    openCalendarAriaLabel: "開啟日曆",
    calendarLabel: "日期日曆",
    previousMonth: "上一個月",
    nextMonth: "下一個月",
    monthsLabel: "月",
    yearsLabel: "年",
    weekdays: ["一", "二", "三", "四", "五", "六", "日"],
    primaryActionLabel: "輸入要換算的日期",
    capsulePlaceholder: "選擇日期",
    about: {
      heading: "什麼是國曆農曆轉換？",
      body: "國曆農曆轉換可在西曆（國曆）與農曆日期之間雙向換算。預設顯示今天的結果，也可指定 1901 至 2099 年間的任意日期，支援閏月並顯示星期。結果可包含歲次（年干支）。不做農民曆、宜忌、吉日、沖煞、生肖解讀、干支月／日、命理／運勢或二十四節氣。核心原則：換日期，不解讀日期。",
    },
    howTo: {
      heading: "如何使用國曆農曆轉換",
      steps: [
        "開啟工具時，預設以今天的國曆日期顯示對應農曆結果。",
        "選擇或輸入其他日期，即可查看更新後的換算結果。",
        "切換為農曆輸入，可查看對應的國曆日期。",
        "若日期落在閏月，請指定正確的閏月。",
      ],
    },
    commonUses: {
      heading: "常見用途",
      items: ["今天農曆", "國曆轉農曆", "農曆轉國曆", "農曆生日", "閏月日期"],
    },
    faq: {
      heading: "國曆農曆轉換 FAQ",
      items: [
        {
          question: "今天農曆是幾月幾日？",
          answer:
            "開啟工具即可看到今天國曆對應的農曆日期。若要查其他日期，更改日期後農曆結果會立即更新。",
        },
        {
          question: "怎麼把國曆轉成農曆？",
          answer:
            "保持國曆輸入，選擇或輸入要查的日期。工具會顯示對應的農曆日期；若該年有閏月，也會一併處理。",
        },
        {
          question: "怎麼把農曆轉成國曆？",
          answer:
            "切換為農曆輸入，輸入農曆年、月、日；若為閏月，請指定閏月。工具會回傳對應的國曆日期。",
        },
        {
          question: "農曆的閏月是什麼？",
          answer:
            "部分農曆年份會多出一個閏月，名稱與前後某個月份相同。換算閏月日期時，請選擇閏月選項，工具才能對應到正確的日期。",
        },
        {
          question: "這個工具支援哪些年份？",
          answer: "國曆農曆轉換支援 1901 至 2099 年的西曆與農曆日期。",
        },
      ],
    },
  },
};
