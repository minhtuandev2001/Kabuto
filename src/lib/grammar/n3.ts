import type { GrammarLesson } from "./types";

export const n3Lessons: GrammarLesson[] = [
  {
    jlpt: "N3",
    lesson: 1,
    title: "意向形・うと思う",
    subtitle: "Ý định",
    points: [
      {
        pattern: "V-意向形",
        meaning: "Dự định / rủ rê (thể ý chí)",
        examples: [
          { jp: "明日から毎日走ろう。", vi: "Từ ngày mai chạy mỗi ngày vậy." },
          { jp: "一緒に映画を見よう。", vi: "Cùng xem phim nhé." },
        ],
      },
      {
        pattern: "V-意向形 と 思う / している",
        meaning: "Định làm",
        examples: [
          { jp: "来年留学しようと思っています。", vi: "Định năm sau du học." },
          { jp: "仕事を辞めようかと思っています。", vi: "Đang nghĩ sẽ nghỉ việc." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 2,
    title: "ようだ・みたいだ・らしい",
    subtitle: "Phỏng đoán, giống như",
    points: [
      {
        pattern: "普通形 ようだ",
        meaning: "Hình như (dựa trên cảm nhận)",
        examples: [
          { jp: "熱があるようです。", vi: "Hình như bị sốt." },
          { jp: "誰か来たようです。", vi: "Hình như có ai đến." },
        ],
      },
      {
        pattern: "N / 普通形 みたいだ",
        meaning: "Giống như (thân mật)",
        examples: [
          { jp: "子供みたいだ。", vi: "Giống trẻ con." },
          { jp: "雨が降ったみたいです。", vi: "Hình như đã mưa." },
        ],
      },
      {
        pattern: "普通形 らしい",
        meaning: "Nghe đâu / đúng chất",
        examples: [
          { jp: "彼は転職するらしい。", vi: "Nghe đâu anh ấy đổi việc." },
          { jp: "春らしい天気ですね。", vi: "Thời tiết đúng chất mùa xuân." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 3,
    title: "ことにする・ことになる",
    subtitle: "Quyết định",
    points: [
      {
        pattern: "V-る ことに する",
        meaning: "Tự quyết định làm",
        examples: [
          { jp: "毎日日記を書くことにしました。", vi: "Quyết định viết nhật ký mỗi ngày." },
          { jp: "行かないことにします。", vi: "Quyết định không đi." },
        ],
      },
      {
        pattern: "V-る ことに なる",
        meaning: "Được quyết / thành ra (bên ngoài)",
        examples: [
          { jp: "来月から大阪で働くことになりました。", vi: "Sẽ làm ở Osaka từ tháng sau (đã được quyết)." },
          { jp: "会議は中止することになりました。", vi: "Cuộc họp sẽ bị hủy." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 4,
    title: "ばかり・最中",
    subtitle: "Toàn là, đang lúc",
    points: [
      {
        pattern: "N ばかり",
        meaning: "Toàn là, chỉ toàn",
        examples: [
          { jp: "最近仕事ばかりです。", vi: "Dạo này toàn việc." },
          { jp: "甘いものばかり食べています。", vi: "Toàn ăn đồ ngọt." },
        ],
      },
      {
        pattern: "N の 最中 / V-て いる 最中",
        meaning: "Đúng lúc đang",
        examples: [
          { jp: "会議の最中に電話が鳴った。", vi: "Đúng lúc họp thì điện thoại reo." },
          { jp: "料理している最中です。", vi: "Đang nấu ăn dở." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 5,
    title: "てほしい・てもらう",
    subtitle: "Muốn ai làm",
    points: [
      {
        pattern: "N に V-て ほしい",
        meaning: "Muốn ai đó làm",
        examples: [
          { jp: "誰かに手伝ってほしいです。", vi: "Muốn có ai giúp." },
          { jp: "静かにしてほしい。", vi: "Muốn (bạn) im đi." },
        ],
      },
      {
        pattern: "N に V-て もらう",
        meaning: "Nhờ / được ai làm cho",
        examples: [
          { jp: "友達に荷物を持ってもらいました。", vi: "Nhờ bạn xách đồ." },
          { jp: "先生に作文を直してもらいました。", vi: "Được thầy sửa bài văn." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 6,
    title: "ように・ために（目的）",
    subtitle: "Mục đích N3",
    points: [
      {
        pattern: "V-辞書形 / V-ない ように",
        meaning: "Để (không) xảy ra",
        examples: [
          { jp: "忘れないようにメモします。", vi: "Ghi chú để không quên." },
          { jp: "間に合うように早く出ます。", vi: "Ra sớm để kịp giờ." },
        ],
      },
      {
        pattern: "V-る ために",
        meaning: "Để (mục đích chủ động)",
        examples: [
          { jp: "合格するために毎日勉強しています。", vi: "Học mỗi ngày để đậu." },
          { jp: "健康のために野菜を食べます。", vi: "Ăn rau vì sức khỏe." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 7,
    title: "せい・おかげ",
    subtitle: "Tại vì / nhờ",
    points: [
      {
        pattern: "N の せい / 普通形 せい",
        meaning: "Tại (kết quả xấu)",
        examples: [
          { jp: "雨のせいですべりました。", vi: "Tại mưa nên bị trượt." },
          { jp: "遅れたせいで乗れませんでした。", vi: "Tại trễ nên không lên được." },
        ],
      },
      {
        pattern: "N の おかげで",
        meaning: "Nhờ (kết quả tốt)",
        examples: [
          { jp: "先生のおかげで合格しました。", vi: "Nhờ thầy mà đậu." },
          { jp: "天気のおかげで気持ちよかったです。", vi: "Nhờ trời đẹp nên dễ chịu." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 8,
    title: "かけて・ところだった",
    subtitle: "Đang dở, suýt",
    points: [
      {
        pattern: "V-ます かけて",
        meaning: "Làm dở / sắp hoàn thành thì",
        examples: [
          { jp: "手紙を書きかけてやめた。", vi: "Viết thư dở rồi thôi." },
          { jp: "死にかけて助かりました。", vi: "Suýt chết rồi được cứu." },
        ],
      },
      {
        pattern: "V-る ところだった",
        meaning: "Suýt nữa thì",
        examples: [
          { jp: "電車に乗り遅れるところだった。", vi: "Suýt lỡ tàu." },
          { jp: "忘れるところでした。", vi: "Suýt quên." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 9,
    title: "わけ・はずがない",
    subtitle: "Lý do, không lẽ",
    points: [
      {
        pattern: "普通形 わけだ",
        meaning: "Ra là vậy / đương nhiên",
        examples: [
          { jp: "熱があるから、苦しいわけです。", vi: "Sốt nên đương nhiên khó chịu." },
          { jp: "なるほど、そういうわけですか。", vi: "Ra là vậy à." },
        ],
      },
      {
        pattern: "普通形 はずが ない",
        meaning: "Không thể nào",
        examples: [
          { jp: "彼が嘘をつくはずがない。", vi: "Không lẽ anh ấy nói dối." },
          { jp: "こんなに安いはずがない。", vi: "Không thể nào rẻ vậy." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 10,
    title: "まま・きり",
    subtitle: "Nguyên trạng, từ đó",
    points: [
      {
        pattern: "V-た まま / N の まま",
        meaning: "Giữ nguyên trạng",
        examples: [
          { jp: "電気をつけたまま寝ました。", vi: "Ngủ mà quên tắt đèn." },
          { jp: "座ったまま話してください。", vi: "Cứ ngồi nói cũng được." },
        ],
      },
      {
        pattern: "V-た きり",
        meaning: "Từ lần đó đến nay không",
        examples: [
          { jp: "朝出かけたきり、まだ帰っていません。", vi: "Sáng đi rồi đến giờ chưa về." },
          { jp: "彼とは卒業したきり会っていません。", vi: "Tốt nghiệp xong không gặp lại." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 11,
    title: "さえ・こそ",
    subtitle: "Ngay cả, chính vì",
    points: [
      {
        pattern: "N さえ",
        meaning: "Ngay cả ~ cũng",
        examples: [
          { jp: "水さえ飲めませんでした。", vi: "Ngay cả nước cũng không uống được." },
          { jp: "名前さえ忘れました。", vi: "Đến tên cũng quên." },
        ],
      },
      {
        pattern: "N こそ",
        meaning: "Chính là, mới đúng là",
        examples: [
          { jp: "今年こそ合格したいです。", vi: "Đúng năm nay muốn đậu." },
          { jp: "こちらこそありがとうございます。", vi: "Chính tôi mới phải cảm ơn." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 12,
    title: "につれて・に従って",
    subtitle: "Càng… thì…",
    points: [
      {
        pattern: "N に つれて / V-る に つれて",
        meaning: "Cùng với sự thay đổi A thì B",
        examples: [
          { jp: "年を取るにつれて、忘れっぽくなります。", vi: "Càng lớn tuổi càng hay quên." },
          { jp: "時間がたつにつれて慣れてきました。", vi: "Thời gian trôi, dần quen." },
        ],
      },
      {
        pattern: "N に 従って",
        meaning: "Theo, cùng với",
        examples: [
          { jp: "説明書に従って組み立てます。", vi: "Lắp theo hướng dẫn." },
          { jp: "物価の上昇に従って生活が苦しくなった。", vi: "Giá tăng thì cuộc sống khó hơn." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 13,
    title: "おそれがある・かねない",
    subtitle: "Có nguy cơ",
    points: [
      {
        pattern: "V-る おそれが ある",
        meaning: "Có nguy cơ (văn viết)",
        examples: [
          { jp: "地震の後、津波の恐れがあります。", vi: "Sau động đất có nguy cơ sóng thần." },
          { jp: "失敗する恐れがある。", vi: "Có nguy cơ thất bại." },
        ],
      },
      {
        pattern: "V-ます かねない",
        meaning: "Có thể xảy ra (thường xấu)",
        examples: [
          { jp: "彼は嘘をつきかねない。", vi: "Anh ấy có thể nói dối." },
          { jp: "このままでは事故になりかねない。", vi: "Cứ thế này có thể thành tai nạn." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 14,
    title: "という・とのこと",
    subtitle: "Được biết là",
    points: [
      {
        pattern: "という",
        meaning: "Gọi là / rằng",
        examples: [
          { jp: "田中という人から電話です。", vi: "Điện thoại từ người tên Tanaka." },
          { jp: "明日休みだということです。", vi: "Nghe nói ngày mai nghỉ." },
        ],
      },
      {
        pattern: "とのことです",
        meaning: "Được thông báo là (lịch sự)",
        examples: [
          { jp: "会議は延期だとのことです。", vi: "Được biết cuộc họp hoãn." },
          { jp: "彼は欠席とのことです。", vi: "Được biết anh ấy vắng." },
        ],
      },
    ],
  },
  {
    jlpt: "N3",
    lesson: 15,
    title: "たところ・たとたん",
    subtitle: "Vừa… thì…",
    points: [
      {
        pattern: "V-た ところ",
        meaning: "Vừa làm thì (kết quả)",
        examples: [
          { jp: "先生に聞いたところ、明日休みだそうです。", vi: "Hỏi thầy thì được biết ngày mai nghỉ." },
          { jp: "窓を開けたところ、風が入ってきた。", vi: "Mở cửa sổ thì gió vào." },
        ],
      },
      {
        pattern: "V-た とたん",
        meaning: "Vừa mới… thì ngay lập tức (bất ngờ)",
        examples: [
          { jp: "家を出たとたん、雨が降り出した。", vi: "Vừa ra khỏi nhà thì mưa." },
          { jp: "座ったとたん、電話が鳴った。", vi: "Vừa ngồi thì điện thoại reo." },
        ],
      },
    ],
  },
];
