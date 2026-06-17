export interface LyricLine {
  time: number;
  text: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
  duration: number; // in seconds
  lyrics: LyricLine[];
}

export const MUSIC_LIBRARY: Song[] = [
  {
    id: "song_1",
    title: "Chúng Ta Của Tương Lai",
    artist: "Sơn Tùng M-TP",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=200&auto=format&fit=crop",
    duration: 372,
    lyrics: [
      { time: 0, text: "🎵 Nhạc nền: Chúng Ta Của Tương Lai 🎵" },
      { time: 3, text: "Liệu mai sau ta còn gặp lại nhau?" },
      { time: 8, text: "Nhìn nhau cười cười mà nước mắt rơi." },
      { time: 13, text: "Chúng ta của tương lai xa xôi..." },
      { time: 18, text: "Có nhớ về bóng hình ai ngày ấy?" },
      { time: 23, text: "Mùa thu trôi qua cuốn đi bao lá vàng..." },
      { time: 28, text: "Để lại đây những kỷ niệm khôn nguôi." }
    ]
  },
  {
    id: "song_2",
    title: "Đi Về Nhà",
    artist: "Đen Vâu x JustaTee",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop",
    duration: 423,
    lyrics: [
      { time: 0, text: "🎵 Nhạc nền: Đi Về Nhà 🎵" },
      { time: 3, text: "Đường về nhà là vào tim ta đó." },
      { time: 8, text: "Dù đi muôn nơi vẫn nhớ quê nhà." },
      { time: 13, text: "Đi về nhà, đi về nhà..." },
      { time: 18, text: "Nơi có mẹ cha đợi chờ ta về." },
      { time: 23, text: "Bữa cơm chiều thơm nồng ấm áp..." },
      { time: 28, text: "Xua tan đi bao mệt mỏi cuộc đời." }
    ]
  },
  {
    id: "song_3",
    title: "See Tình",
    artist: "Hoàng Thùy Linh",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&auto=format&fit=crop",
    duration: 302,
    lyrics: [
      { time: 0, text: "🎵 Nhạc nền: See Tình 🎵" },
      { time: 3, text: "Tình tình tình tinh tang tính..." },
      { time: 8, text: "Yêu anh yêu thế này thôi á?" },
      { time: 13, text: "See tình see tình see tình..." },
      { time: 18, text: "Dính bùa yêu của anh mất rồi!" },
      { time: 23, text: "Đêm ngày thương nhớ bóng hình ai..." },
      { time: 28, text: "Mong đôi ta sẽ mãi chung đôi." }
    ]
  },
  {
    id: "song_4",
    title: "Yêu Em Rất Nhiều",
    artist: "Hoàng Yến Chibi",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=200&auto=format&fit=crop",
    duration: 302,
    lyrics: [
      { time: 0, text: "🎵 Nhạc nền: Yêu Em Rất Nhiều 🎵" },
      { time: 3, text: "Yêu em yêu yêu rất nhiều!" },
      { time: 8, text: "Trao trọn con tim này đến bên em." },
      { time: 13, text: "Bờ vai ấm áp che chở cho em..." },
      { time: 18, text: "Qua bao bão giông cuộc đời." },
      { time: 23, text: "Nụ cười rạng rỡ như đóa hoa mai..." },
      { time: 28, text: "Là nguồn sống duy nhất đời anh." }
    ]
  }
];
