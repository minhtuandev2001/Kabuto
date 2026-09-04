import type { GrammarLesson } from "./types";

export const n4Lessons: GrammarLesson[] = [
  {
    jlpt: "N4",
    lesson: 1,
    title: "ながら・ています（習慣）",
    subtitle: "Vừa… vừa…, thói quen",
    points: [
      {
        pattern: "V-ます ながら",
        meaning: "Vừa làm A vừa làm B",
        examples: [
          { jp: "音楽を聞きながら勉強します。", vi: "Vừa nghe nhạc vừa học." },
          { jp: "歩きながら話しましょう。", vi: "Vừa đi vừa nói nhé." },
        ],
      },
      {
        pattern: "V-て います（習慣）",
        meaning: "Thói quen / việc đang diễn ra dài hạn",
        examples: [
          { jp: "毎朝ジョギングをしています。", vi: "Sáng nào cũng chạy bộ." },
          { jp: "大学で日本語を教えています。", vi: "Đang dạy tiếng Nhật ở đại học." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 2,
    title: "可能形",
    subtitle: "Thể khả năng",
    points: [
      {
        pattern: "V-可能形",
        meaning: "Làm được (chia động từ)",
        note: "Nhóm I: 書きます → 書けます. が thay を.",
        examples: [
          { jp: "漢字が読めます。", vi: "Đọc được kanji." },
          { jp: "ここで写真が撮れます。", vi: "Ở đây chụp được ảnh." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 3,
    title: "見えます・聞こえます",
    subtitle: "Nhìn thấy, nghe thấy",
    points: [
      {
        pattern: "N が 見えます / 聞こえます",
        meaning: "Trông thấy / nghe thấy (tự nhiên vào giác quan)",
        examples: [
          { jp: "山が見えます。", vi: "Nhìn thấy núi." },
          { jp: "波の音が聞こえます。", vi: "Nghe thấy tiếng sóng." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 4,
    title: "つもり・予定",
    subtitle: "Dự định",
    points: [
      {
        pattern: "V-辞書形 つもりです",
        meaning: "Dự định làm",
        examples: [
          { jp: "来年日本へ行くつもりです。", vi: "Năm sau định đi Nhật." },
          { jp: "買わないつもりです。", vi: "Không định mua." },
        ],
      },
      {
        pattern: "N の 予定です",
        meaning: "Dự kiến / lịch",
        examples: [
          { jp: "明日会議の予定です。", vi: "Ngày mai dự kiến họp." },
          { jp: "旅行の予定があります。", vi: "Có lịch du lịch." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 5,
    title: "まだ〜て いません",
    subtitle: "Chưa làm",
    points: [
      {
        pattern: "まだ V-て いません",
        meaning: "Vẫn chưa",
        examples: [
          { jp: "宿題はまだ終わっていません。", vi: "Bài tập vẫn chưa xong." },
          { jp: "まだ食べていません。", vi: "Vẫn chưa ăn." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 6,
    title: "た ほうがいい",
    subtitle: "Nên / không nên",
    points: [
      {
        pattern: "V-た ほうがいいです",
        meaning: "Nên làm",
        examples: [
          { jp: "もっと勉強したほうがいいです。", vi: "Nên học nhiều hơn." },
          { jp: "傘を持っていったほうがいいです。", vi: "Nên mang ô đi." },
        ],
      },
      {
        pattern: "V-ない ほうがいいです",
        meaning: "Không nên",
        examples: [
          { jp: "お酒を飲まないほうがいいです。", vi: "Không nên uống rượu." },
          { jp: "無理をしないほうがいいです。", vi: "Không nên cố quá." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 7,
    title: "でしょう・かもしれない",
    subtitle: "Phỏng đoán",
    points: [
      {
        pattern: "普通形 でしょう",
        meaning: "Chắc là ~ (phỏng đoán)",
        examples: [
          { jp: "明日は晴れるでしょう。", vi: "Ngày mai chắc nắng." },
          { jp: "彼は来ないでしょう。", vi: "Anh ấy chắc không đến." },
        ],
      },
      {
        pattern: "普通形 かもしれません",
        meaning: "Có lẽ, có thể",
        examples: [
          { jp: "雨が降るかもしれません。", vi: "Có lẽ sẽ mưa." },
          { jp: "本当かもしれない。", vi: "Có thể là thật." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 8,
    title: "命令・禁止",
    subtitle: "Mệnh lệnh, cấm",
    points: [
      {
        pattern: "V-なさい",
        meaning: "Hãy (mệnh lệnh, thầy cô / cha mẹ)",
        examples: [
          { jp: "早く寝なさい。", vi: "Đi ngủ sớm đi." },
          { jp: "これを読みなさい。", vi: "Hãy đọc cái này." },
        ],
      },
      {
        pattern: "V-て は いけません",
        meaning: "Không được làm",
        examples: [
          { jp: "ここでタバコを吸ってはいけません。", vi: "Ở đây không được hút thuốc." },
          { jp: "入ってはいけません。", vi: "Không được vào." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 9,
    title: "条件 ば・なら",
    subtitle: "Điều kiện",
    points: [
      {
        pattern: "V-ば",
        meaning: "Nếu (điều kiện)",
        examples: [
          { jp: "時間があれば、行きます。", vi: "Nếu có thời gian thì đi." },
          { jp: "安ければ買います。", vi: "Nếu rẻ thì mua." },
        ],
      },
      {
        pattern: "N / 普通形 なら",
        meaning: "Nếu là trường hợp đó",
        examples: [
          { jp: "日曜日なら、大丈夫です。", vi: "Nếu là Chủ nhật thì được." },
          { jp: "日本へ行くなら、京都がおすすめです。", vi: "Nếu đi Nhật thì nên đến Kyoto." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 10,
    title: "ように する / なる",
    subtitle: "Cố gắng, trở nên",
    points: [
      {
        pattern: "V-辞書形 ように します",
        meaning: "Cố gắng (tạo thói quen)",
        examples: [
          { jp: "毎日運動するようにしています。", vi: "Cố tập thể dục mỗi ngày." },
          { jp: "忘れないようにします。", vi: "Sẽ cố không quên." },
        ],
      },
      {
        pattern: "V-辞書形 ように なりました",
        meaning: "Đã trở nên có thể / thành thói quen",
        examples: [
          { jp: "日本語が話せるようになりました。", vi: "Đã nói được tiếng Nhật." },
          { jp: "お酒を飲まないようになりました。", vi: "Đã không còn uống rượu." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 11,
    title: "そうです（様態）",
    subtitle: "Trông có vẻ",
    points: [
      {
        pattern: "A-い そうです / A-な そうです",
        meaning: "Trông có vẻ (nhìn bề ngoài)",
        note: "Khác そうです truyền văn (nghe nói).",
        examples: [
          { jp: "この料理はおいしそうです。", vi: "Món này trông ngon." },
          { jp: "雨が降りそうです。", vi: "Trông như sắp mưa." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 12,
    title: "そうです（伝聞）",
    subtitle: "Nghe nói",
    points: [
      {
        pattern: "普通形 そうです",
        meaning: "Nghe nói là",
        examples: [
          { jp: "来年結婚するそうです。", vi: "Nghe nói năm sau cưới." },
          { jp: "あの店は高いそうです。", vi: "Nghe nói quán kia đắt." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 13,
    title: "て しまいます",
    subtitle: "Làm hết / lỡ làm",
    points: [
      {
        pattern: "V-て しまいます",
        meaning: "Làm xong hết / tiếc nuối, lỡ",
        examples: [
          { jp: "宿題を全部やってしまいました。", vi: "Làm hết bài tập rồi." },
          { jp: "財布を忘れてしまいました。", vi: "Lỡ quên ví." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 14,
    title: "ば〜ほど・のに",
    subtitle: "Càng… càng…, thế mà",
    points: [
      {
        pattern: "V-ば V-る ほど",
        meaning: "Càng A càng B",
        examples: [
          { jp: "考えれば考えるほどわからなくなります。", vi: "Càng nghĩ càng không hiểu." },
          { jp: "安ければ安いほどいいです。", vi: "Càng rẻ càng tốt." },
        ],
      },
      {
        pattern: "普通形 のに",
        meaning: "Thế mà, mặc dù",
        examples: [
          { jp: "勉強したのに、点が悪かった。", vi: "Học rồi thế mà điểm kém." },
          { jp: "安いのに、美味しくない。", vi: "Rẻ thế mà không ngon." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 15,
    title: "間・間に",
    subtitle: "Trong lúc",
    points: [
      {
        pattern: "N の 間 / V-て いる 間",
        meaning: "Trong suốt khoảng thời gian",
        examples: [
          { jp: "夏休みの間、旅行します。", vi: "Trong hè sẽ đi du lịch." },
          { jp: "待っている間、本を読みます。", vi: "Trong lúc đợi thì đọc sách." },
        ],
      },
      {
        pattern: "V-る / V-て いる 間に",
        meaning: "Trong lúc (làm xong trước khi hết khoảng đó)",
        examples: [
          { jp: "留守の間に荷物が届きました。", vi: "Lúc vắng nhà thì hàng tới." },
          { jp: "日本にいる間に富士山に登りたいです。", vi: "Muốn leo Phú Sĩ khi còn ở Nhật." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 16,
    title: "受身",
    subtitle: "Thể bị động",
    points: [
      {
        pattern: "N は N に V-受身",
        meaning: "Bị / được (bị động)",
        examples: [
          { jp: "私は先生に褒められました。", vi: "Tôi được thầy khen." },
          { jp: "財布を盗まれました。", vi: "Bị mất ví (bị lấy trộm)." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 17,
    title: "使役",
    subtitle: "Thể sai khiến",
    points: [
      {
        pattern: "N に V-使役",
        meaning: "Bắt / để cho ai làm",
        examples: [
          { jp: "母は子どもに野菜を食べさせます。", vi: "Mẹ bắt con ăn rau." },
          { jp: "部長は私に資料を作らせました。", vi: "Trưởng phòng bắt tôi làm tài liệu." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 18,
    title: "使役受け身",
    subtitle: "Bị bắt làm",
    points: [
      {
        pattern: "N は N に V-使役受け身",
        meaning: "Bị bắt phải làm",
        examples: [
          { jp: "私は母に勉強させられました。", vi: "Tôi bị mẹ bắt học." },
          { jp: "嫌な仕事をさせられました。", vi: "Bị bắt làm việc không thích." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 19,
    title: "敬語 ます形丁寧",
    subtitle: "Kính ngữ lịch sự",
    points: [
      {
        pattern: "お V-ます になります",
        meaning: "Tôn kính (hành động của người trên)",
        examples: [
          { jp: "先生がお話しになりました。", vi: "Thầy đã nói." },
          { jp: "社長がお帰りになりました。", vi: "Giám đốc đã về." },
        ],
      },
      {
        pattern: "いらっしゃいます / おっしゃいます",
        meaning: "Động từ tôn kính đặc biệt",
        examples: [
          { jp: "部長はいらっしゃいますか。", vi: "Trưởng phòng có ở đây không?" },
          { jp: "何とおっしゃいましたか。", vi: "Anh/chị đã nói gì ạ?" },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 20,
    title: "謙譲語",
    subtitle: "Khiêm nhường",
    points: [
      {
        pattern: "お V-ます します",
        meaning: "Khiêm nhường (mình làm cho người trên)",
        examples: [
          { jp: "荷物をお持ちします。", vi: "Tôi xin xách hộ hành lý." },
          { jp: "ご案内します。", vi: "Tôi xin hướng dẫn." },
        ],
      },
      {
        pattern: "いたします / いただきます / 参ります",
        meaning: "Động từ khiêm nhường đặc biệt",
        examples: [
          { jp: "明日伺います。", vi: "Ngày mai tôi sẽ đến (thăm)." },
          { jp: "資料をいただきます。", vi: "Tôi xin nhận tài liệu." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 21,
    title: "ところ",
    subtitle: "Sắp / đang / vừa mới",
    points: [
      {
        pattern: "V-る ところです",
        meaning: "Sắp làm",
        examples: [
          { jp: "これから出かけるところです。", vi: "Sắp ra ngoài." },
          { jp: "今から食べるところです。", vi: "Sắp ăn." },
        ],
      },
      {
        pattern: "V-た ところです",
        meaning: "Vừa mới làm xong",
        examples: [
          { jp: "今着いたところです。", vi: "Vừa mới tới." },
          { jp: "食べたところです。", vi: "Vừa mới ăn xong." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 22,
    title: "ばかり・はず",
    subtitle: "Vừa mới, chắc chắn",
    points: [
      {
        pattern: "V-た ばかりです",
        meaning: "Vừa mới (cảm giác còn mới)",
        examples: [
          { jp: "日本へ来たばかりです。", vi: "Mới đến Nhật." },
          { jp: "買ったばかりのスマホです。", vi: "Điện thoại mới mua." },
        ],
      },
      {
        pattern: "普通形 はずです",
        meaning: "Chắc chắn phải là (suy luận logic)",
        examples: [
          { jp: "彼はもう着いているはずです。", vi: "Anh ấy chắc đã tới rồi." },
          { jp: "鍵は机の上にあるはずです。", vi: "Chìa khóa chắc ở trên bàn." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 23,
    title: "ように 言う",
    subtitle: "Bảo ai làm",
    points: [
      {
        pattern: "V-るように / V-ないように 言います",
        meaning: "Bảo / dặn làm hoặc đừng làm",
        examples: [
          { jp: "先生は宿題をするように言いました。", vi: "Thầy bảo làm bài tập." },
          { jp: "母は遅く帰らないように言いました。", vi: "Mẹ dặn đừng về trễ." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 24,
    title: "て おきます・みます",
    subtitle: "Làm sẵn, thử",
    points: [
      {
        pattern: "V-て おきます",
        meaning: "Làm sẵn / để đó",
        examples: [
          { jp: "予約しておきます。", vi: "Đặt chỗ sẵn." },
          { jp: "窓を開けておいてください。", vi: "Hãy mở cửa sổ sẵn." },
        ],
      },
      {
        pattern: "V-て みます",
        meaning: "Thử làm",
        examples: [
          { jp: "着てみてもいいですか。", vi: "Thử mặc được không?" },
          { jp: "日本料理を作ってみます。", vi: "Tôi sẽ thử nấu món Nhật." },
        ],
      },
    ],
  },
  {
    jlpt: "N4",
    lesson: 25,
    title: "のに・ために",
    subtitle: "Để, mục đích",
    points: [
      {
        pattern: "V-辞書形 ために / N の ために",
        meaning: "Để (mục đích)",
        examples: [
          { jp: "日本へ行くために日本語を勉強しています。", vi: "Học tiếng Nhật để đi Nhật." },
          { jp: "健康のために走ります。", vi: "Chạy vì sức khỏe." },
        ],
      },
      {
        pattern: "V-辞書形 のに",
        meaning: "Để dùng cho việc ~ (công cụ, cần thiết)",
        examples: [
          { jp: "このはさみは紙を切るのに使います。", vi: "Kéo này dùng để cắt giấy." },
          { jp: "ビザを取るのに時間がかかります。", vi: "Lấy visa mất thời gian." },
        ],
      },
    ],
  },
];
