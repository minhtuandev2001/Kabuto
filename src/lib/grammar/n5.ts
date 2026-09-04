import type { GrammarLesson } from "./types";

export const n5Lessons: GrammarLesson[] = [
  {
    jlpt: "N5",
    lesson: 1,
    title: "です・は・の",
    subtitle: "Câu danh từ, chủ đề, sở hữu",
    points: [
      {
        pattern: "N は N です",
        meaning: "A là B",
        form: "Danh từ + は + danh từ + です",
        note: "は đọc là 「wa」. Thể phủ định: じゃありません / ではありません.",
        examples: [
          { jp: "わたしは学生です。", vi: "Tôi là học sinh." },
          { jp: "ミラーさんはアメリカ人じゃありません。", vi: "Anh Miller không phải người Mỹ." },
        ],
      },
      {
        pattern: "N の N",
        meaning: "Sở hữu / thuộc về",
        examples: [
          { jp: "わたしの本です。", vi: "Đây là sách của tôi." },
          { jp: "大学の先生です。", vi: "Là giáo viên đại học." },
        ],
      },
      {
        pattern: "N は N ですか",
        meaning: "Câu hỏi yes/no",
        note: "Trả lời: はい、そうです。／いいえ、ちがいます。",
        examples: [
          { jp: "あの方はどなたですか。", vi: "Vị kia là ai?" },
          { jp: "それは辞書ですか。", vi: "Cái đó là từ điển à?" },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 2,
    title: "これ・それ・あれ",
    subtitle: "Chỉ đồ vật gần / xa",
    points: [
      {
        pattern: "これ / それ / あれ",
        meaning: "Cái này / cái đó / cái kia",
        note: "これ: gần người nói. それ: gần người nghe. あれ: xa cả hai.",
        examples: [
          { jp: "これは本です。", vi: "Cái này là sách." },
          { jp: "それは何ですか。", vi: "Cái đó là gì?" },
        ],
      },
      {
        pattern: "この / その / あの ＋ N",
        meaning: "Này / đó / kia + danh từ",
        examples: [
          { jp: "この傘はだれのですか。", vi: "Cái ô này là của ai?" },
          { jp: "あの建物はホテルです。", vi: "Tòa nhà kia là khách sạn." },
        ],
      },
      {
        pattern: "そうです / ちがいます",
        meaning: "Đúng vậy / không phải",
        examples: [
          { jp: "はい、そうです。", vi: "Vâng, đúng vậy." },
          { jp: "いいえ、ちがいます。", vi: "Không, không phải." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 3,
    title: "ここ・そこ・あそこ",
    subtitle: "Nơi chốn",
    points: [
      {
        pattern: "ここ / そこ / あそこ / どこ",
        meaning: "Đây / đó / kia / đâu",
        examples: [
          { jp: "トイレはどこですか。", vi: "Nhà vệ sinh ở đâu?" },
          { jp: "あそこに郵便局があります。", vi: "Kia có bưu điện." },
        ],
      },
      {
        pattern: "N の となり / まえ / うしろ",
        meaning: "Bên cạnh / trước / sau",
        examples: [
          { jp: "銀行のとなりです。", vi: "Ở cạnh ngân hàng." },
          { jp: "駅のまえで待ちます。", vi: "Đợi trước ga." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 4,
    title: "います・あります",
    subtitle: "Tồn tại",
    points: [
      {
        pattern: "N が あります / います",
        meaning: "Có (đồ vật / người, động vật)",
        note: "あります: đồ vô tri. います: người, động vật.",
        examples: [
          { jp: "あそこに電話があります。", vi: "Kia có điện thoại." },
          { jp: "公園に子どもがいます。", vi: "Ở công viên có trẻ em." },
        ],
      },
      {
        pattern: "N に N が あります",
        meaning: "Ở nơi A có B",
        form: "Địa điểm に + vật が + あります",
        examples: [
          { jp: "机の上に本があります。", vi: "Trên bàn có sách." },
          { jp: "教室に学生がいます。", vi: "Trong lớp có học sinh." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 5,
    title: "行きます・来ます",
    subtitle: "Di chuyển, đích đến",
    points: [
      {
        pattern: "N へ 行きます / 来ます / 帰ります",
        meaning: "Đi / đến / về",
        note: "へ đọc 「e」. Có thể dùng に thay へ.",
        examples: [
          { jp: "明日京都へ行きます。", vi: "Ngày mai tôi đi Kyoto." },
          { jp: "うちへ帰ります。", vi: "Tôi về nhà." },
        ],
      },
      {
        pattern: "N と 行きます",
        meaning: "Đi cùng với ai",
        examples: [
          { jp: "友達と日本へ行きます。", vi: "Đi Nhật cùng bạn." },
          { jp: "家族と旅行します。", vi: "Du lịch cùng gia đình." },
        ],
      },
      {
        pattern: "N で 行きます",
        meaning: "Đi bằng phương tiện",
        examples: [
          { jp: "電車で行きます。", vi: "Đi bằng tàu." },
          { jp: "歩いて行きます。", vi: "Đi bộ." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 6,
    title: "を・で（hành động）",
    subtitle: "Tân ngữ và nơi làm việc",
    points: [
      {
        pattern: "N を V",
        meaning: "Tân ngữ trực tiếp",
        examples: [
          { jp: "コーヒーを飲みます。", vi: "Uống cà phê." },
          { jp: "本を読みます。", vi: "Đọc sách." },
        ],
      },
      {
        pattern: "N で V",
        meaning: "Nơi diễn ra hành động",
        examples: [
          { jp: "図書館で勉強します。", vi: "Học ở thư viện." },
          { jp: "うちでご飯を食べます。", vi: "Ăn cơm ở nhà." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 7,
    title: "あげます・もらいます",
    subtitle: "Cho và nhận",
    points: [
      {
        pattern: "N に N を あげます",
        meaning: "Cho ai cái gì",
        examples: [
          { jp: "友達に花をあげます。", vi: "Tặng hoa cho bạn." },
          { jp: "妹に本をあげました。", vi: "Đã tặng sách cho em gái." },
        ],
      },
      {
        pattern: "N に N を もらいます",
        meaning: "Nhận cái gì từ ai",
        examples: [
          { jp: "母に時計をもらいました。", vi: "Nhận đồng hồ từ mẹ." },
          { jp: "先生に辞書をもらいます。", vi: "Nhận từ điển từ thầy/cô." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 8,
    title: "い形容詞・な形容詞",
    subtitle: "Tính từ",
    points: [
      {
        pattern: "A-い です",
        meaning: "Tính từ đuôi い",
        note: "Phủ định: 〜くないです。",
        examples: [
          { jp: "この部屋は広いです。", vi: "Phòng này rộng." },
          { jp: "今日は暑くないです。", vi: "Hôm nay không nóng." },
        ],
      },
      {
        pattern: "A-な です / N は A です",
        meaning: "Tính từ đuôi な",
        note: "Phủ định: 〜じゃありません.",
        examples: [
          { jp: "東京はにぎやかです。", vi: "Tokyo náo nhiệt." },
          { jp: "静かじゃありません。", vi: "Không yên tĩnh." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 9,
    title: "あります（sở hữu）・好き",
    subtitle: "Có, thích, hiểu",
    points: [
      {
        pattern: "N が あります",
        meaning: "Có (sở hữu), có lịch",
        examples: [
          { jp: "質問があります。", vi: "Tôi có câu hỏi." },
          { jp: "明日会議があります。", vi: "Ngày mai có họp." },
        ],
      },
      {
        pattern: "N が 好きです / きらいです",
        meaning: "Thích / không thích",
        examples: [
          { jp: "猫が好きです。", vi: "Thích mèo." },
          { jp: "コーヒーがきらいです。", vi: "Không thích cà phê." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 10,
    title: "あります・います（ở đâu）",
    subtitle: "Vị trí người / đồ",
    points: [
      {
        pattern: "N は N に あります / います",
        meaning: "A ở B",
        note: "Chủ đề は, vị trí に.",
        examples: [
          { jp: "郵便局は駅のとなりにあります。", vi: "Bưu điện ở cạnh ga." },
          { jp: "田中さんは事務所にいます。", vi: "Anh Tanaka ở văn phòng." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 11,
    title: "数・つ・人",
    subtitle: "Đếm",
    points: [
      {
        pattern: "〜つ",
        meaning: "Đếm đồ vật chung (1–10)",
        examples: [
          { jp: "りんごを三つください。", vi: "Cho tôi ba quả táo." },
          { jp: "切手を二枚ください。", vi: "Cho tôi hai tem." },
        ],
      },
      {
        pattern: "〜人",
        meaning: "Đếm người",
        note: "ひとり、ふたり, từ 3 trở đi: さんにん…",
        examples: [
          { jp: "家族は四人です。", vi: "Gia đình có bốn người." },
          { jp: "学生が五人います。", vi: "Có năm học sinh." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 12,
    title: "過去形 ました",
    subtitle: "Thì quá khứ lịch sự",
    points: [
      {
        pattern: "V-ました / V-ませんでした",
        meaning: "Đã làm / đã không làm",
        examples: [
          { jp: "きのう映画を見ました。", vi: "Hôm qua xem phim." },
          { jp: "朝ごはんを食べませんでした。", vi: "Không ăn sáng." },
        ],
      },
      {
        pattern: "いつ / 先週 / 去年",
        meaning: "Cụm thời gian quá khứ, không cần に với きのう・きょう…",
        examples: [
          { jp: "先週末に京都へ行きました。", vi: "Cuối tuần trước đi Kyoto." },
          { jp: "きのう何をしましたか。", vi: "Hôm qua làm gì?" },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 13,
    title: "N が ほしい・たい",
    subtitle: "Muốn có, muốn làm",
    points: [
      {
        pattern: "N が ほしいです",
        meaning: "Muốn có N",
        examples: [
          { jp: "新しいパソコンがほしいです。", vi: "Muốn có máy tính mới." },
          { jp: "時間がほしいです。", vi: "Muốn có thời gian." },
        ],
      },
      {
        pattern: "V-ます たいです",
        meaning: "Muốn làm",
        form: "Bỏ ます → たいです",
        examples: [
          { jp: "日本へ行きたいです。", vi: "Muốn đi Nhật." },
          { jp: "寿司を食べたいです。", vi: "Muốn ăn sushi." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 14,
    title: "て形・てください",
    subtitle: "Thể て, nhờ vả",
    points: [
      {
        pattern: "V-て ください",
        meaning: "Hãy làm ~ (nhờ lịch sự)",
        examples: [
          { jp: "ちょっと待ってください。", vi: "Xin hãy đợi một chút." },
          { jp: "名前を書いてください。", vi: "Xin hãy viết tên." },
        ],
      },
      {
        pattern: "V-て も いいです",
        meaning: "Được phép làm",
        examples: [
          { jp: "写真を撮ってもいいですか。", vi: "Chụp ảnh được không?" },
          { jp: "入ってもいいです。", vi: "Vào được." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 15,
    title: "て います",
    subtitle: "Đang diễn ra / trạng thái",
    points: [
      {
        pattern: "V-て います",
        meaning: "Đang làm / đang ở trạng thái",
        examples: [
          { jp: "今、勉強しています。", vi: "Đang học." },
          { jp: "結婚しています。", vi: "Đã kết hôn (trạng thái)." },
        ],
      },
      {
        pattern: "知っています / 住んでいます",
        meaning: "Biết / đang sống (trạng thái, không phải hành động đang xảy ra)",
        examples: [
          { jp: "日本語を少し知っています。", vi: "Biết một chút tiếng Nhật." },
          { jp: "ハノイに住んでいます。", vi: "Đang sống ở Hà Nội." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 16,
    title: "て から・ましょう",
    subtitle: "Sau khi, rủ rê",
    points: [
      {
        pattern: "V-て から",
        meaning: "Sau khi làm A thì B",
        examples: [
          { jp: "手を洗ってから食べます。", vi: "Rửa tay rồi mới ăn." },
          { jp: "日本へ行ってから日本語を勉強しました。", vi: "Sang Nhật rồi mới học tiếng Nhật." },
        ],
      },
      {
        pattern: "V-ましょう / V-ませんか",
        meaning: "Cùng làm nhé / mời cùng làm",
        examples: [
          { jp: "一緒に行きましょう。", vi: "Cùng đi nhé." },
          { jp: "コーヒーを飲みませんか。", vi: "Uống cà phê không?" },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 17,
    title: "ないで ください・なければなりません",
    subtitle: "Đừng, phải",
    points: [
      {
        pattern: "V-ないで ください",
        meaning: "Xin đừng làm",
        examples: [
          { jp: "ここで写真を撮らないでください。", vi: "Xin đừng chụp ảnh ở đây." },
          { jp: "心配しないでください。", vi: "Xin đừng lo." },
        ],
      },
      {
        pattern: "V-なければ なりません",
        meaning: "Phải làm",
        note: "Cũng dùng なくてはいけません.",
        examples: [
          { jp: "薬を飲まなければなりません。", vi: "Phải uống thuốc." },
          { jp: "早く起きなければなりません。", vi: "Phải dậy sớm." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 18,
    title: "辞書形・ことができます",
    subtitle: "Thể từ điển, khả năng",
    points: [
      {
        pattern: "V-辞書形 ことができます",
        meaning: "Có thể làm",
        examples: [
          { jp: "漢字を読むことができます。", vi: "Có thể đọc kanji." },
          { jp: "ピアノを弾くことができます。", vi: "Có thể chơi piano." },
        ],
      },
      {
        pattern: "N が できます",
        meaning: "Làm được N (kỹ năng, môn)",
        examples: [
          { jp: "スポーツができます。", vi: "Chơi được thể thao." },
          { jp: "運転ができません。", vi: "Không lái xe được." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 19,
    title: "た形・た ことがあります",
    subtitle: "Thể た, từng trải",
    points: [
      {
        pattern: "V-た ことがあります",
        meaning: "Đã từng",
        examples: [
          { jp: "富士山に登ったことがあります。", vi: "Đã từng leo núi Phú Sĩ." },
          { jp: "寿司を食べたことがありません。", vi: "Chưa từng ăn sushi." },
        ],
      },
      {
        pattern: "V-た り V-た り します",
        meaning: "Làm A, làm B (liệt kê không hết)",
        examples: [
          { jp: "土曜日は買い物したり、映画を見たりします。", vi: "Thứ bảy thì mua sắm, xem phim…" },
          { jp: "読んだり書いたりします。", vi: "Đọc rồi viết." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 20,
    title: "普通形・と思います",
    subtitle: "Thể thông thường, nghĩ rằng",
    points: [
      {
        pattern: "普通形 と 思います",
        meaning: "Tôi nghĩ rằng",
        examples: [
          { jp: "明日は雨が降ると思います。", vi: "Tôi nghĩ ngày mai sẽ mưa." },
          { jp: "この店は安いと思います。", vi: "Tôi nghĩ quán này rẻ." },
        ],
      },
      {
        pattern: "普通形 と 言っていました",
        meaning: "Đã nói rằng (trần thuật)",
        examples: [
          { jp: "田中さんは来ないと言っていました。", vi: "Anh Tanaka nói là không đến." },
          { jp: "美味しいと言っていました。", vi: "Nói là ngon." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 21,
    title: "たら・ても",
    subtitle: "Nếu, dù",
    points: [
      {
        pattern: "V-た ら",
        meaning: "Nếu / khi (giả định)",
        examples: [
          { jp: "暇だったら、遊びに来てください。", vi: "Nếu rảnh thì đến chơi." },
          { jp: "安かったら、買います。", vi: "Nếu rẻ thì mua." },
        ],
      },
      {
        pattern: "V-て も",
        meaning: "Dù có ~ cũng",
        examples: [
          { jp: "雨が降っても行きます。", vi: "Dù mưa vẫn đi." },
          { jp: "高くても買います。", vi: "Dù đắt vẫn mua." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 22,
    title: "修飾・とき",
    subtitle: "Bổ nghĩa danh từ, khi",
    points: [
      {
        pattern: "普通形 ＋ N",
        meaning: "Mệnh đề bổ nghĩa cho danh từ",
        examples: [
          { jp: "あそこで本を読んでいる人は友達です。", vi: "Người đang đọc sách kia là bạn tôi." },
          { jp: "昨日買った本です。", vi: "Cuốn sách mua hôm qua." },
        ],
      },
      {
        pattern: "V / A とき",
        meaning: "Khi ~",
        examples: [
          { jp: "子ども の とき、よく泳ぎました。", vi: "Khi còn nhỏ hay bơi." },
          { jp: "忙しいとき、手伝ってください。", vi: "Khi bận thì giúp với." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 23,
    title: "と・や・など",
    subtitle: "Điều kiện tự nhiên, liệt kê",
    points: [
      {
        pattern: "V-辞書形 と",
        meaning: "Nếu A thì B (tất yếu, sự thật)",
        examples: [
          { jp: "このボタンを押すと、ドアが開きます。", vi: "Bấm nút này thì cửa mở." },
          { jp: "春になると、暖かくなります。", vi: "Đến xuân thì ấm." },
        ],
      },
      {
        pattern: "N や N など",
        meaning: "A, B, v.v.",
        examples: [
          { jp: "りんごやバナナなどを買いました。", vi: "Mua táo, chuối, v.v." },
          { jp: "京都や大阪へ行きました。", vi: "Đã đi Kyoto, Osaka…" },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 24,
    title: "くれます・て あげます",
    subtitle: "Cho nhận hướng về mình",
    points: [
      {
        pattern: "N が N を くれます",
        meaning: "Ai đó cho tôi",
        examples: [
          { jp: "友達がプレゼントをくれました。", vi: "Bạn tặng tôi quà." },
          { jp: "母がお金をくれます。", vi: "Mẹ cho tôi tiền." },
        ],
      },
      {
        pattern: "V-て あげます / もらいます / くれます",
        meaning: "Làm giúp / được làm giúp",
        examples: [
          { jp: "友達に日本語を教えてあげます。", vi: "Dạy tiếng Nhật cho bạn." },
          { jp: "友達に日本語を教えてもらいます。", vi: "Được bạn dạy tiếng Nhật." },
        ],
      },
    ],
  },
  {
    jlpt: "N5",
    lesson: 25,
    title: "〜んです",
    subtitle: "Giải thích, nhấn mạnh",
    points: [
      {
        pattern: "普通形 んです / のです",
        meaning: "Là vì / thực ra là (giải thích)",
        examples: [
          { jp: "頭が痛いんです。", vi: "Tại vì tôi đau đầu." },
          { jp: "どうしたんですか。", vi: "Có chuyện gì vậy?" },
        ],
      },
      {
        pattern: "どうして 〜んですか",
        meaning: "Tại sao (hỏi nguyên nhân)",
        examples: [
          { jp: "どうして遅れたんですか。", vi: "Sao lại trễ?" },
          { jp: "電車が遅れたんです。", vi: "Tại tàu trễ." },
        ],
      },
    ],
  },
];
