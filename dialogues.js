// Hội thoại nghe hiểu. Mỗi đoạn: lines = [người nói A/B, tiếng Trung, pinyin, nghĩa]; qs = câu hỏi [câu hỏi, [3 đáp án], index đáp án đúng]
const DIALOGUES = [
  {
    id: "airport1", topic: "airport", level: "HSK2", title: "Ký gửi hành lý",
    lines: [
      ["A", "你好，我要托运这个行李。", "nǐ hǎo, wǒ yào tuōyùn zhège xíngli.", "Xin chào, tôi muốn ký gửi hành lý này."],
      ["B", "请把护照给我看一下。", "qǐng bǎ hùzhào gěi wǒ kàn yíxià.", "Xin cho tôi xem hộ chiếu."],
      ["A", "好的，给你。", "hǎo de, gěi nǐ.", "Vâng, đây ạ."],
      ["B", "您的行李有三十公斤，超重了。", "nín de xíngli yǒu sānshí gōngjīn, chāozhòng le.", "Hành lý của bạn nặng 30 ký, bị quá cân."],
      ["A", "啊，那我怎么办？", "ā, nà wǒ zěnme bàn?", "Ôi, vậy tôi phải làm sao?"],
      ["B", "您可以多付一点儿钱。", "nín kěyǐ duō fù yìdiǎnr qián.", "Bạn có thể trả thêm một ít tiền."],
    ],
    qs: [
      ["Hành lý của khách như thế nào?", ["Quá cân", "Bị mất", "Quá nhỏ"], 0],
      ["Nhân viên đề nghị khách làm gì?", ["Đổi chuyến bay", "Trả thêm tiền", "Mở hành lý ra"], 1],
    ],
  },
  {
    id: "airport2", topic: "airport", level: "HSK3", title: "Hỏi cổng lên máy bay",
    lines: [
      ["A", "请问，去上海的航班在哪个登机口？", "qǐngwèn, qù Shànghǎi de hángbān zài nǎge dēngjīkǒu?", "Xin hỏi, chuyến bay đi Thượng Hải ở cổng nào?"],
      ["B", "在八号登机口，九点半起飞。", "zài bā hào dēngjīkǒu, jiǔ diǎn bàn qǐfēi.", "Ở cổng số 8, 9 giờ rưỡi cất cánh."],
      ["A", "现在几点了？", "xiànzài jǐ diǎn le?", "Bây giờ mấy giờ rồi?"],
      ["B", "现在八点，您还有一个半小时。", "xiànzài bā diǎn, nín hái yǒu yí gè bàn xiǎoshí.", "Bây giờ 8 giờ, bạn còn một tiếng rưỡi."],
      ["A", "谢谢，我先去买点儿东西。", "xièxie, wǒ xiān qù mǎi diǎnr dōngxi.", "Cảm ơn, tôi đi mua chút đồ trước."],
    ],
    qs: [
      ["Chuyến bay đi đâu?", ["Bắc Kinh", "Thượng Hải", "Quảng Châu"], 1],
      ["Mấy giờ cất cánh?", ["8:00", "10:30", "9:30"], 2],
    ],
  },
  {
    id: "hotel1", topic: "hotel", level: "HSK2", title: "Nhận phòng",
    lines: [
      ["A", "你好，我想办理入住。", "nǐ hǎo, wǒ xiǎng bànlǐ rùzhù.", "Xin chào, tôi muốn làm thủ tục nhận phòng."],
      ["B", "请问您预订了房间吗？", "qǐngwèn nín yùdìng le fángjiān ma?", "Xin hỏi bạn đã đặt phòng chưa?"],
      ["A", "订了，我叫王明，住两天。", "dìng le, wǒ jiào Wáng Míng, zhù liǎng tiān.", "Rồi, tôi tên Vương Minh, ở hai ngày."],
      ["B", "好的，这是您的房卡，房间在五楼。", "hǎo de, zhè shì nín de fángkǎ, fángjiān zài wǔ lóu.", "Vâng, đây là thẻ phòng, phòng ở tầng 5."],
      ["A", "早饭几点开始？", "zǎofàn jǐ diǎn kāishǐ?", "Bữa sáng mấy giờ bắt đầu?"],
      ["B", "早上七点到九点。", "zǎoshang qī diǎn dào jiǔ diǎn.", "Từ 7 giờ đến 9 giờ sáng."],
    ],
    qs: [
      ["Khách ở mấy ngày?", ["Hai ngày", "Ba ngày", "Một ngày"], 0],
      ["Bữa sáng mấy giờ?", ["6 giờ đến 8 giờ", "7 giờ đến 9 giờ", "8 giờ đến 10 giờ"], 1],
    ],
  },
  {
    id: "hotel2", topic: "hotel", level: "HSK3", title: "Phòng có vấn đề",
    lines: [
      ["A", "你好，我的房间没有热水。", "nǐ hǎo, wǒ de fángjiān méiyǒu rèshuǐ.", "Xin chào, phòng tôi không có nước nóng."],
      ["B", "对不起，我马上让人去看看。", "duìbuqǐ, wǒ mǎshàng ràng rén qù kànkan.", "Xin lỗi, tôi sẽ cho người đến xem ngay."],
      ["A", "空调也有点儿吵。", "kōngtiáo yě yǒudiǎnr chǎo.", "Điều hòa cũng hơi ồn."],
      ["B", "要不要给您换一个房间？", "yào bú yào gěi nín huàn yí gè fángjiān?", "Có cần đổi cho bạn một phòng khác không?"],
      ["A", "好，谢谢你。", "hǎo, xièxie nǐ.", "Vâng, cảm ơn bạn."],
    ],
    qs: [
      ["Phòng có vấn đề gì?", ["Mất chìa khóa", "Không có nước nóng", "Không có giường"], 1],
      ["Khách sạn đề nghị gì?", ["Đổi phòng", "Hoàn tiền", "Trả phòng"], 0],
    ],
  },
  {
    id: "transport1", topic: "transport", level: "HSK2", title: "Hỏi đường đến ga",
    lines: [
      ["A", "请问，火车站怎么走？", "qǐngwèn, huǒchēzhàn zěnme zǒu?", "Xin hỏi, đi đến ga tàu thế nào?"],
      ["B", "一直往前走，到红绿灯往右拐。", "yìzhí wǎng qián zǒu, dào hónglǜdēng wǎng yòu guǎi.", "Cứ đi thẳng, đến đèn giao thông thì rẽ phải."],
      ["A", "远不远？", "yuǎn bù yuǎn?", "Có xa không?"],
      ["B", "不太远，走十分钟就到了。", "bú tài yuǎn, zǒu shí fēnzhōng jiù dào le.", "Không xa lắm, đi mười phút là tới."],
      ["A", "谢谢你！", "xièxie nǐ!", "Cảm ơn bạn!"],
      ["B", "不客气。", "bú kèqi.", "Không có gì."],
    ],
    qs: [
      ["Đến đèn giao thông thì rẽ hướng nào?", ["Trái", "Phải", "Đi thẳng"], 1],
      ["Đi bộ mất bao lâu?", ["10 phút", "30 phút", "1 tiếng"], 0],
    ],
  },
  {
    id: "transport2", topic: "transport", level: "HSK3", title: "Đi taxi",
    lines: [
      ["A", "师傅，请到这个地址。", "shīfu, qǐng dào zhège dìzhǐ.", "Bác tài, xin đến địa chỉ này."],
      ["B", "好的，不过现在堵车。", "hǎo de, búguò xiànzài dǔchē.", "Vâng, nhưng bây giờ đang tắc đường."],
      ["A", "大概要多长时间？", "dàgài yào duō cháng shíjiān?", "Khoảng bao lâu?"],
      ["B", "差不多四十分钟。", "chàbuduō sìshí fēnzhōng.", "Khoảng 40 phút."],
      ["A", "好，请开快一点儿。", "hǎo, qǐng kāi kuài yìdiǎnr.", "Được, xin chạy nhanh một chút."],
    ],
    qs: [
      ["Vì sao đi lâu?", ["Đường xa", "Xe bị hỏng", "Đang tắc đường"], 2],
      ["Khoảng bao lâu thì đến?", ["14 phút", "40 phút", "4 tiếng"], 1],
    ],
  },
  {
    id: "rental1", topic: "rental", level: "HSK3", title: "Thuê xe",
    lines: [
      ["A", "你好，我想租一辆车。", "nǐ hǎo, wǒ xiǎng zū yí liàng chē.", "Xin chào, tôi muốn thuê một chiếc xe."],
      ["B", "请问您租几天？", "qǐngwèn nín zū jǐ tiān?", "Xin hỏi bạn thuê mấy ngày?"],
      ["A", "三天，我要自动挡的。", "sān tiān, wǒ yào zìdòng dǎng de.", "Ba ngày, tôi muốn xe số tự động."],
      ["B", "好的，请给我看一下您的驾照。", "hǎo de, qǐng gěi wǒ kàn yíxià nín de jiàzhào.", "Vâng, xin cho tôi xem bằng lái của bạn."],
      ["A", "这是我的国际驾照。", "zhè shì wǒ de guójì jiàzhào.", "Đây là bằng lái quốc tế của tôi."],
      ["B", "一天三百块，押金两千块。", "yì tiān sānbǎi kuài, yājīn liǎngqiān kuài.", "Một ngày 300 tệ, đặt cọc 2000 tệ."],
    ],
    qs: [
      ["Khách thuê mấy ngày?", ["Một ngày", "Ba ngày", "Một tuần"], 1],
      ["Tiền đặt cọc là bao nhiêu?", ["300 tệ", "3000 tệ", "2000 tệ"], 2],
    ],
  },
  {
    id: "rental2", topic: "rental", level: "HSK4", title: "Trả xe",
    lines: [
      ["A", "先生，请把油加满再还车。", "xiānsheng, qǐng bǎ yóu jiāmǎn zài huán chē.", "Thưa ông, xin đổ đầy xăng rồi hãy trả xe."],
      ["B", "前面有加油站吗？", "qiánmiàn yǒu jiāyóuzhàn ma?", "Phía trước có trạm xăng không?"],
      ["A", "有，过了红绿灯就是。", "yǒu, guò le hónglǜdēng jiù shì.", "Có, qua đèn giao thông là tới."],
      ["B", "车有一点儿问题，刹车不太灵。", "chē yǒu yìdiǎnr wèntí, shāchē bú tài líng.", "Xe có chút vấn đề, phanh không ăn lắm."],
      ["A", "我们会检查一下。", "wǒmen huì jiǎnchá yíxià.", "Chúng tôi sẽ kiểm tra."],
    ],
    qs: [
      ["Khách phải làm gì trước khi trả xe?", ["Rửa xe", "Đổ đầy xăng", "Mua bảo hiểm"], 1],
      ["Xe có vấn đề gì?", ["Phanh", "Lốp xe", "Đèn xe"], 0],
    ],
  },
  {
    id: "food1", topic: "food", level: "HSK2", title: "Gọi món",
    lines: [
      ["A", "服务员，请给我菜单。", "fúwùyuán, qǐng gěi wǒ càidān.", "Phục vụ ơi, cho tôi thực đơn."],
      ["B", "好的。您想喝点儿什么？", "hǎo de. nín xiǎng hē diǎnr shénme?", "Vâng. Bạn muốn uống gì?"],
      ["A", "我要一杯茶，再来一份炒饭。", "wǒ yào yì bēi chá, zài lái yí fèn chǎofàn.", "Tôi muốn một tách trà, thêm một phần cơm chiên."],
      ["B", "辣不辣？", "là bú là?", "Có cay không?"],
      ["A", "不要太辣。", "búyào tài là.", "Đừng cay quá."],
    ],
    qs: [
      ["Khách gọi gì để uống?", ["Trà", "Cà phê", "Bia"], 0],
      ["Khách muốn món ăn thế nào?", ["Rất cay", "Không cay quá", "Rất ngọt"], 1],
    ],
  },
  {
    id: "food2", topic: "food", level: "HSK4", title: "Dị ứng và thanh toán",
    lines: [
      ["A", "你好，我对海鲜过敏，这个菜有海鲜吗？", "nǐ hǎo, wǒ duì hǎixiān guòmǐn, zhège cài yǒu hǎixiān ma?", "Xin chào, tôi dị ứng hải sản, món này có hải sản không?"],
      ["B", "没有，这个菜是素的。", "méiyǒu, zhège cài shì sù de.", "Không, món này là món chay."],
      ["A", "那就点这个。", "nà jiù diǎn zhège.", "Vậy gọi món này."],
      ["B", "好的，请稍等。", "hǎo de, qǐng shāo děng.", "Vâng, xin đợi một chút."],
      ["A", "服务员，买单，请给我发票。", "fúwùyuán, mǎidān, qǐng gěi wǒ fāpiào.", "Phục vụ ơi, tính tiền, cho tôi hóa đơn."],
    ],
    qs: [
      ["Khách bị dị ứng với gì?", ["Sữa", "Hải sản", "Đậu phộng"], 1],
      ["Cuối bữa khách yêu cầu gì?", ["Gói mang về", "Thêm món", "Hóa đơn"], 2],
    ],
  },
  {
    id: "shopping1", topic: "shopping", level: "HSK2", title: "Trả giá mua áo",
    lines: [
      ["A", "请问，这件衣服多少钱？", "qǐngwèn, zhè jiàn yīfu duōshao qián?", "Xin hỏi, chiếc áo này bao nhiêu tiền?"],
      ["B", "三百五十块。", "sānbǎi wǔshí kuài.", "350 tệ."],
      ["A", "太贵了，能便宜一点儿吗？", "tài guì le, néng piányi yìdiǎnr ma?", "Đắt quá, có thể rẻ hơn chút không?"],
      ["B", "那就两百八十块吧。", "nà jiù liǎngbǎi bāshí kuài ba.", "Vậy 280 tệ nhé."],
      ["A", "好，我买了。", "hǎo, wǒ mǎi le.", "Được, tôi mua."],
    ],
    qs: [
      ["Giá ban đầu của chiếc áo?", ["280 tệ", "350 tệ", "500 tệ"], 1],
      ["Giá sau khi trả giá?", ["280 tệ", "350 tệ", "300 tệ"], 0],
    ],
  },
  {
    id: "shopping2", topic: "shopping", level: "HSK3", title: "Thanh toán",
    lines: [
      ["A", "你好，一共两百八十块。", "nǐ hǎo, yígòng liǎngbǎi bāshí kuài.", "Xin chào, tổng cộng 280 tệ."],
      ["B", "可以用支付宝吗？", "kěyǐ yòng Zhīfùbǎo ma?", "Có thể dùng Alipay không?"],
      ["A", "可以，请扫这里。", "kěyǐ, qǐng sǎo zhèlǐ.", "Được, xin quét ở đây."],
      ["B", "好了。请给我一张收据。", "hǎo le. qǐng gěi wǒ yì zhāng shōujù.", "Xong rồi. Xin cho tôi một tờ biên lai."],
      ["A", "给您，欢迎下次再来。", "gěi nín, huānyíng xià cì zài lái.", "Đây ạ, hoan nghênh lần sau lại đến."],
    ],
    qs: [
      ["Khách thanh toán bằng gì?", ["Tiền mặt", "Thẻ tín dụng", "Alipay"], 2],
      ["Khách xin thêm gì?", ["Biên lai", "Một cái túi", "Giảm giá"], 0],
    ],
  },
  {
    id: "money1", topic: "money", level: "HSK3", title: "Đổi tiền",
    lines: [
      ["A", "你好，我想换钱。", "nǐ hǎo, wǒ xiǎng huànqián.", "Xin chào, tôi muốn đổi tiền."],
      ["B", "您想换什么钱？", "nín xiǎng huàn shénme qián?", "Bạn muốn đổi loại tiền nào?"],
      ["A", "我想把越南盾换成人民币。", "wǒ xiǎng bǎ Yuènándùn huànchéng rénmínbì.", "Tôi muốn đổi đồng Việt Nam sang nhân dân tệ."],
      ["B", "您要换多少？", "nín yào huàn duōshao?", "Bạn muốn đổi bao nhiêu?"],
      ["A", "一千块人民币。", "yì qiān kuài rénmínbì.", "1000 tệ."],
      ["B", "请给我看一下护照。", "qǐng gěi wǒ kàn yíxià hùzhào.", "Xin cho tôi xem hộ chiếu."],
    ],
    qs: [
      ["Khách muốn đổi sang tiền gì?", ["Đô la Mỹ", "Nhân dân tệ", "Bảng Anh"], 1],
      ["Nhân viên cần xem gì?", ["Vé máy bay", "Visa", "Hộ chiếu"], 2],
    ],
  },
  {
    id: "money2", topic: "money", level: "HSK4", title: "Máy ATM nuốt thẻ",
    lines: [
      ["A", "不好意思，自动取款机把我的卡吞了。", "bù hǎoyìsi, zìdòng qǔkuǎnjī bǎ wǒ de kǎ tūn le.", "Xin lỗi, máy ATM nuốt thẻ của tôi rồi."],
      ["B", "请不要着急，您的卡是哪家银行的？", "qǐng búyào zháojí, nín de kǎ shì nǎ jiā yínháng de?", "Xin đừng sốt ruột, thẻ của bạn của ngân hàng nào?"],
      ["A", "是越南银行的。", "shì Yuènán yínháng de.", "Của ngân hàng Việt Nam."],
      ["B", "您可以先挂失，再补办一张。", "nín kěyǐ xiān guàshī, zài bǔbàn yì zhāng.", "Bạn có thể báo mất trước, rồi làm lại một thẻ."],
      ["A", "手续费是多少？", "shǒuxùfèi shì duōshao?", "Phí là bao nhiêu?"],
      ["B", "一百块。", "yì bǎi kuài.", "100 tệ."],
    ],
    qs: [
      ["Chuyện gì xảy ra với thẻ?", ["Bị máy nuốt", "Bị mất cắp", "Hết hạn"], 0],
      ["Nhân viên khuyên khách làm gì?", ["Chờ một tuần", "Báo mất rồi làm lại", "Rút ở máy khác"], 1],
    ],
  },
  {
    id: "emergency1", topic: "emergency", level: "HSK3", title: "Đi khám bệnh",
    lines: [
      ["A", "医生，我头疼，还发烧。", "yīshēng, wǒ tóu téng, hái fāshāo.", "Bác sĩ, tôi đau đầu và còn bị sốt."],
      ["B", "你从什么时候开始的？", "nǐ cóng shénme shíhou kāishǐ de?", "Bạn bị từ khi nào?"],
      ["A", "从昨天晚上开始的。", "cóng zuótiān wǎnshang kāishǐ de.", "Từ tối hôm qua."],
      ["B", "你感冒了，要多休息，多喝水。", "nǐ gǎnmào le, yào duō xiūxi, duō hē shuǐ.", "Bạn bị cảm rồi, cần nghỉ nhiều, uống nhiều nước."],
      ["A", "要吃药吗？", "yào chī yào ma?", "Có phải uống thuốc không?"],
      ["B", "要，一天三次，饭后吃。", "yào, yì tiān sān cì, fàn hòu chī.", "Có, ngày 3 lần, uống sau bữa ăn."],
    ],
    qs: [
      ["Khách bị làm sao?", ["Đau bụng", "Đau đầu và sốt", "Gãy tay"], 1],
      ["Uống thuốc thế nào?", ["Ngày 1 lần", "Ngày 3 lần sau bữa ăn", "Trước khi ngủ"], 1],
    ],
  },
  {
    id: "emergency2", topic: "emergency", level: "HSK4", title: "Mất ví",
    lines: [
      ["A", "警察先生，我的钱包丢了。", "jǐngchá xiānsheng, wǒ de qiánbāo diū le.", "Thưa cảnh sát, ví của tôi bị mất."],
      ["B", "您在哪儿丢的？", "nín zài nǎr diū de?", "Bạn mất ở đâu?"],
      ["A", "可能在地铁上。", "kěnéng zài dìtiě shang.", "Có thể ở trên tàu điện ngầm."],
      ["B", "里面有什么？", "lǐmiàn yǒu shénme?", "Bên trong có gì?"],
      ["A", "有护照和一些现金。", "yǒu hùzhào hé yìxiē xiànjīn.", "Có hộ chiếu và một ít tiền mặt."],
      ["B", "请先填表，然后联系大使馆。", "qǐng xiān tiánbiǎo, ránhòu liánxì dàshǐguǎn.", "Xin điền mẫu trước, sau đó liên hệ đại sứ quán."],
    ],
    qs: [
      ["Khách có thể mất ví ở đâu?", ["Trên tàu điện ngầm", "Ở nhà hàng", "Ở khách sạn"], 0],
      ["Sau khi điền mẫu, khách phải làm gì?", ["Về khách sạn", "Liên hệ đại sứ quán", "Mua ví mới"], 1],
    ],
  },
  {
    id: "sight1", topic: "sightseeing", level: "HSK3", title: "Mua vé tham quan",
    lines: [
      ["A", "你好，两张门票多少钱？", "nǐ hǎo, liǎng zhāng ménpiào duōshao qián?", "Xin chào, hai vé vào cửa bao nhiêu tiền?"],
      ["B", "一张六十块，学生半价。", "yì zhāng liùshí kuài, xuésheng bànjià.", "Mỗi vé 60 tệ, sinh viên nửa giá."],
      ["A", "我朋友是学生，我不是。", "wǒ péngyou shì xuésheng, wǒ bú shì.", "Bạn tôi là sinh viên, tôi thì không."],
      ["B", "那一共是九十块。", "nà yígòng shì jiǔshí kuài.", "Vậy tổng cộng là 90 tệ."],
      ["A", "请问几点开门？", "qǐngwèn jǐ diǎn kāimén?", "Xin hỏi mấy giờ mở cửa?"],
      ["B", "早上八点半。", "zǎoshang bā diǎn bàn.", "8 giờ rưỡi sáng."],
    ],
    qs: [
      ["Tổng tiền là bao nhiêu?", ["60 tệ", "120 tệ", "90 tệ"], 2],
      ["Mấy giờ mở cửa?", ["8 giờ rưỡi", "9 giờ", "7 giờ rưỡi"], 0],
    ],
  },
  {
    id: "sight2", topic: "sightseeing", level: "HSK4", title: "Hướng dẫn viên ở Trường Thành",
    lines: [
      ["A", "大家好，欢迎来到长城。", "dàjiā hǎo, huānyíng láidào Chángchéng.", "Chào mọi người, chào mừng đến Vạn Lý Trường Thành."],
      ["A", "长城有两千多年的历史。", "Chángchéng yǒu liǎngqiān duō nián de lìshǐ.", "Trường Thành có hơn 2000 năm lịch sử."],
      ["B", "这里可以拍照吗？", "zhèlǐ kěyǐ pāizhào ma?", "Ở đây chụp ảnh được không?"],
      ["A", "可以，不过要小心，别走太快。", "kěyǐ, búguò yào xiǎoxīn, bié zǒu tài kuài.", "Được, nhưng phải cẩn thận, đừng đi quá nhanh."],
      ["B", "我们大概走多长时间？", "wǒmen dàgài zǒu duō cháng shíjiān?", "Chúng ta đi khoảng bao lâu?"],
      ["A", "差不多两个小时。", "chàbuduō liǎng gè xiǎoshí.", "Khoảng hai tiếng."],
    ],
    qs: [
      ["Trường Thành có lịch sử bao lâu?", ["Hơn 200 năm", "Hơn 2000 năm", "Hơn 20 năm"], 1],
      ["Chuyến đi bộ khoảng bao lâu?", ["1 tiếng", "4 tiếng", "2 tiếng"], 2],
    ],
  },
  {
    id: "house1", topic: "house", level: "HSK3", title: "Đi xem nhà",
    lines: [
      ["A", "你好，我想看一下这个房子。", "nǐ hǎo, wǒ xiǎng kàn yíxià zhège fángzi.", "Xin chào, tôi muốn xem căn nhà này."],
      ["B", "好的，请进。这是客厅，那是卧室。", "hǎo de, qǐng jìn. zhè shì kètīng, nà shì wòshì.", "Vâng, mời vào. Đây là phòng khách, kia là phòng ngủ."],
      ["A", "有洗衣机和冰箱吗？", "yǒu xǐyījī hé bīngxiāng ma?", "Có máy giặt và tủ lạnh không?"],
      ["B", "有，都是新的。房租一个月三千块。", "yǒu, dōu shì xīn de. fángzū yí gè yuè sānqiān kuài.", "Có, đều mới. Tiền thuê một tháng 3000 tệ."],
      ["A", "水电费要自己付吗？", "shuǐdiànfèi yào zìjǐ fù ma?", "Tiền điện nước phải tự trả à?"],
      ["B", "对，水电费自己付。", "duì, shuǐdiànfèi zìjǐ fù.", "Đúng, điện nước tự trả."],
    ],
    qs: [
      ["Tiền thuê một tháng là bao nhiêu?", ["300 tệ", "3000 tệ", "5000 tệ"], 1],
      ["Tiền điện nước ai trả?", ["Chủ nhà", "Chia đôi", "Người thuê tự trả"], 2],
    ],
  },
  {
    id: "house2", topic: "house", level: "HSK4", title: "Ký hợp đồng thuê nhà",
    lines: [
      ["A", "租期是一年，您看一下合同。", "zūqī shì yì nián, nín kàn yíxià hétong.", "Thời hạn thuê là một năm, mời bạn xem hợp đồng."],
      ["B", "押金是多少？", "yājīn shì duōshao?", "Tiền đặt cọc là bao nhiêu?"],
      ["A", "押金是两个月的房租。", "yājīn shì liǎng gè yuè de fángzū.", "Tiền cọc là hai tháng tiền thuê."],
      ["B", "如果东西坏了怎么办？", "rúguǒ dōngxi huài le zěnme bàn?", "Nếu đồ bị hỏng thì sao?"],
      ["A", "您可以找物业，我们负责维修。", "nín kěyǐ zhǎo wùyè, wǒmen fùzé wéixiū.", "Bạn có thể tìm ban quản lý, chúng tôi chịu trách nhiệm sửa."],
      ["B", "好的，我现在就签。", "hǎo de, wǒ xiànzài jiù qiān.", "Được, tôi ký ngay bây giờ."],
    ],
    qs: [
      ["Thời hạn thuê là bao lâu?", ["Sáu tháng", "Một năm", "Hai năm"], 1],
      ["Đồ bị hỏng thì ai chịu trách nhiệm sửa?", ["Người thuê", "Không ai", "Chủ nhà"], 2],
    ],
  },
  {
    id: "weather1", topic: "weather", level: "HSK2", title: "Hỏi thời tiết ngày mai",
    lines: [
      ["A", "明天天气怎么样？", "míngtiān tiānqì zěnmeyàng?", "Ngày mai thời tiết thế nào?"],
      ["B", "天气预报说明天有雨。", "tiānqì yùbào shuō míngtiān yǒu yǔ.", "Dự báo thời tiết nói mai có mưa."],
      ["A", "冷不冷？", "lěng bù lěng?", "Có lạnh không?"],
      ["B", "不太冷，大概十八度。", "bú tài lěng, dàgài shíbā dù.", "Không lạnh lắm, khoảng 18 độ."],
      ["A", "那我要带伞。", "nà wǒ yào dài sǎn.", "Vậy tôi phải mang ô."],
    ],
    qs: [
      ["Ngày mai thời tiết thế nào?", ["Nắng to", "Có mưa", "Có tuyết"], 1],
      ["Nhiệt độ khoảng bao nhiêu?", ["8 độ", "28 độ", "18 độ"], 2],
    ],
  },
  {
    id: "weather2", topic: "weather", level: "HSK4", title: "Bão sắp đến",
    lines: [
      ["A", "你听说了吗？台风马上就要来了。", "nǐ tīngshuō le ma? táifēng mǎshàng jiù yào lái le.", "Bạn nghe nói chưa? Bão sắp đến rồi."],
      ["B", "真的吗？我们明天的飞机会不会取消？", "zhēn de ma? wǒmen míngtiān de fēijī huì bú huì qǔxiāo?", "Thật à? Chuyến bay mai của chúng ta có bị hủy không?"],
      ["A", "有可能，你最好问一下航空公司。", "yǒu kěnéng, nǐ zuìhǎo wèn yíxià hángkōng gōngsī.", "Có thể đấy, tốt nhất bạn hỏi hãng hàng không."],
      ["B", "好的，我马上打电话。", "hǎo de, wǒ mǎshàng dǎ diànhuà.", "Được, tôi gọi điện ngay."],
      ["A", "这几天风很大，出门要小心。", "zhè jǐ tiān fēng hěn dà, chūmén yào xiǎoxīn.", "Mấy ngày nay gió rất lớn, ra ngoài phải cẩn thận."],
    ],
    qs: [
      ["Điều gì sắp đến?", ["Tuyết", "Bão", "Động đất"], 1],
      ["Khách nên làm gì về chuyến bay?", ["Hỏi hãng hàng không", "Đổi khách sạn", "Thuê xe"], 0],
    ],
  },
  {
    id: "urgent1", topic: "urgent", level: "HSK3", title: "Gọi cấp cứu",
    lines: [
      ["A", "喂，这里是急救中心。", "wèi, zhèlǐ shì jíjiù zhōngxīn.", "Alô, đây là trung tâm cấp cứu."],
      ["B", "请快来，我朋友昏倒了！", "qǐng kuài lái, wǒ péngyou hūndǎo le!", "Xin mau đến, bạn tôi ngất rồi!"],
      ["A", "请冷静，他有呼吸吗？", "qǐng lěngjìng, tā yǒu hūxī ma?", "Xin bình tĩnh, anh ấy còn thở không?"],
      ["B", "有，但是很弱。", "yǒu, dànshì hěn ruò.", "Có, nhưng rất yếu."],
      ["A", "你们在哪儿？", "nǐmen zài nǎr?", "Các bạn ở đâu?"],
      ["B", "在人民公园的南门。", "zài Rénmín Gōngyuán de nán mén.", "Ở cổng nam công viên Nhân Dân."],
      ["A", "救护车马上到。", "jiùhùchē mǎshàng dào.", "Xe cứu thương sẽ đến ngay."],
    ],
    qs: [
      ["Chuyện gì xảy ra?", ["Bạn bị ngất", "Nhà bị cháy", "Mất ví"], 0],
      ["Họ đang ở đâu?", ["Cổng bắc công viên", "Ga tàu", "Cổng nam công viên"], 2],
    ],
  },
  {
    id: "urgent2", topic: "urgent", level: "HSK4", title: "Báo bị cướp giật",
    lines: [
      ["A", "警察先生，我刚才被抢劫了！", "jǐngchá xiānsheng, wǒ gāngcái bèi qiǎngjié le!", "Thưa cảnh sát, tôi vừa bị cướp!"],
      ["B", "请冷静，您有受伤吗？", "qǐng lěngjìng, nín yǒu shòushāng ma?", "Xin bình tĩnh, bạn có bị thương không?"],
      ["A", "没有，但是他们抢走了我的手机。", "méiyǒu, dànshì tāmen qiǎngzǒu le wǒ de shǒujī.", "Không, nhưng họ đã cướp điện thoại của tôi."],
      ["B", "请您描述一下他们。", "qǐng nín miáoshù yíxià tāmen.", "Xin hãy mô tả họ."],
      ["A", "两个男的，都很高。", "liǎng gè nán de, dōu hěn gāo.", "Hai người đàn ông, đều rất cao."],
      ["B", "好的，我们马上做记录。", "hǎo de, wǒmen mǎshàng zuò jìlù.", "Được, chúng tôi lập biên bản ngay."],
    ],
    qs: [
      ["Khách bị cướp mất gì?", ["Hộ chiếu", "Điện thoại", "Ví tiền"], 1],
      ["Khách có bị thương không?", ["Không bị thương", "Bị thương nhẹ", "Bị thương nặng"], 0],
    ],
  },
  {
    id: "toilet1", topic: "toilet", level: "HSK2", title: "Hỏi nhà vệ sinh",
    lines: [
      ["A", "请问，洗手间在哪儿？", "qǐngwèn, xǐshǒujiān zài nǎr?", "Xin hỏi, nhà vệ sinh ở đâu?"],
      ["B", "在三楼，电梯旁边。", "zài sān lóu, diàntī pángbiān.", "Ở tầng 3, cạnh thang máy."],
      ["A", "女厕所在左边吗？", "nǚ cèsuǒ zài zuǒbian ma?", "Nhà vệ sinh nữ ở bên trái à?"],
      ["B", "不是，男厕所在左边，女厕所在右边。", "bú shì, nán cèsuǒ zài zuǒbian, nǚ cèsuǒ zài yòubian.", "Không, nam ở bên trái, nữ ở bên phải."],
      ["A", "谢谢！", "xièxie!", "Cảm ơn!"],
    ],
    qs: [
      ["Nhà vệ sinh ở tầng mấy?", ["Tầng 1", "Tầng 3", "Tầng 5"], 1],
      ["Nhà vệ sinh nữ ở bên nào?", ["Bên trái", "Cạnh cầu thang", "Bên phải"], 2],
    ],
  },
  {
    id: "toilet2", topic: "toilet", level: "HSK3", title: "Nhà vệ sinh bị hỏng",
    lines: [
      ["A", "你好，一楼的洗手间暂停使用。", "nǐ hǎo, yī lóu de xǐshǒujiān zàntíng shǐyòng.", "Xin chào, nhà vệ sinh tầng 1 tạm ngừng sử dụng."],
      ["B", "为什么？", "wèishénme?", "Tại sao vậy?"],
      ["A", "抱歉，冲水系统出了故障。", "bàoqiàn, chōngshuǐ xìtǒng chū le gùzhàng.", "Xin lỗi, hệ thống xả nước bị sự cố."],
      ["B", "那哪里还有洗手间？", "nà nǎlǐ hái yǒu xǐshǒujiān?", "Vậy chỗ nào còn nhà vệ sinh?"],
      ["A", "三楼有，请坐电梯上去。", "sān lóu yǒu, qǐng zuò diàntī shàngqù.", "Tầng 3 có, xin đi thang máy lên."],
      ["B", "好的，谢谢。", "hǎo de, xièxie.", "Được, cảm ơn."],
    ],
    qs: [
      ["Vì sao nhà vệ sinh tầng 1 không dùng được?", ["Hết giấy", "Đang sửa trần nhà", "Hệ thống xả nước bị sự cố"], 2],
      ["Khách nên đi đâu?", ["Tầng 3 bằng thang máy", "Ra ngoài đường", "Ở lại tầng 1"], 0],
    ],
  },
  {
    id: "market1", topic: "market", level: "HSK3", title: "Mua trái cây ở chợ",
    lines: [
      ["A", "老板，这个苹果怎么卖？", "lǎobǎn, zhège píngguǒ zěnme mài?", "Chủ ơi, táo này bán sao?"],
      ["B", "八块钱一斤。", "bā kuài qián yì jīn.", "8 tệ một cân."],
      ["A", "太贵了，便宜点儿吧。", "tài guì le, piányi diǎnr ba.", "Đắt quá, rẻ chút đi."],
      ["B", "那七块吧，买五斤送你一根香蕉。", "nà qī kuài ba, mǎi wǔ jīn sòng nǐ yì gēn xiāngjiāo.", "Vậy 7 tệ nhé, mua 5 cân tặng bạn một quả chuối."],
      ["A", "好，我要五斤。", "hǎo, wǒ yào wǔ jīn.", "Được, tôi lấy 5 cân."],
      ["B", "一共三十五块。", "yígòng sānshíwǔ kuài.", "Tổng cộng 35 tệ."],
    ],
    qs: [
      ["Giá táo lúc đầu là bao nhiêu?", ["5 tệ một cân", "7 tệ một cân", "8 tệ một cân"], 2],
      ["Mua 5 cân thì được tặng gì?", ["Một quả chuối", "Một quả dưa hấu", "Một cái túi"], 0],
    ],
  },
  {
    id: "market2", topic: "market", level: "HSK4", title: "Mặc cả mua cá",
    lines: [
      ["A", "老板，这条鱼多少钱一斤？", "lǎobǎn, zhè tiáo yú duōshao qián yì jīn?", "Chủ ơi, con cá này bao nhiêu tiền một cân?"],
      ["B", "三十块一斤，很新鲜。", "sānshí kuài yì jīn, hěn xīnxiān.", "30 tệ một cân, rất tươi."],
      ["A", "能不能便宜一点儿？", "néng bù néng piányi yìdiǎnr?", "Có thể rẻ hơn chút không?"],
      ["B", "不行，这已经是最低价了。", "bù xíng, zhè yǐjīng shì zuìdījià le.", "Không được, đây đã là giá thấp nhất rồi."],
      ["A", "我买三条，可以算批发价吗？", "wǒ mǎi sān tiáo, kěyǐ suàn pīfā jià ma?", "Tôi mua ba con, có thể tính giá sỉ không?"],
      ["B", "好吧，三条一百块，再便宜我就亏本了。", "hǎo ba, sān tiáo yì bǎi kuài, zài piányi wǒ jiù kuīběn le.", "Được rồi, ba con 100 tệ, rẻ hơn nữa tôi lỗ vốn."],
      ["A", "成交！", "chéngjiāo!", "Chốt!"],
    ],
    qs: [
      ["Lần đầu người bán có giảm giá không?", ["Có, giảm ngay một nửa", "Không, nói đây là giá thấp nhất", "Có, giảm 5 tệ"], 1],
      ["Cuối cùng hai bên chốt giá thế nào?", ["Ba con 100 tệ", "Một con 100 tệ", "Ba con 30 tệ"], 0],
    ],
  },
];
