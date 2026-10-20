// Every piece of text in the game lives here, in English and Vietnamese.
//   t('lamp.label')            -> a string
//   t('laptop.progress', { n }) -> fills in {n}
//   pick('mug.lines')          -> a random entry from a list
// The chosen language is saved in localStorage; things that stay on screen
// (the task board, the settings panel) listen with `onLangChange`.

const KEY = 'cozy-desk.lang';

export const LANGS = { en: 'English', vi: 'Tiếng Việt' };

const STRINGS = {
  en: {
    intro: 'Everything here is interactive. Click around.',

    'lamp.label': 'Desk lamp',
    'lamp.click': '*click*',
    'lamp.off': 'Just me and the moonlight now.',
    'laptop.label': 'Laptop (click to work)',
    'laptop.sounds': ['tap tap', '*click*', 'ctrl+s', 'tap tap tap', '+1 line'],
    'laptop.progress': "That's {n} lines done. Nice.",
    'mug.label': 'Mug of cocoa',
    'mug.sip': '*sip*',
    'mug.empty': 'All gone...',
    'mug.lines': ['Mmm, still warm.', 'Perfect.', 'Cocoa fixes everything.'],
    'mug.refill': 'refilled!',
    'books.label': 'Books',
    'books.titles': ['A Field Guide to Stars', 'Calculus, Gently', 'The Tea Almanac', 'Notes from a Small Town', 'Learning to Draw Cats'],
    'books.reading': 'Reading: "{title}"',
    'radio.label': 'Radio (music on/off)',
    'radio.on': 'lofi radio: on',
    'radio.off': 'radio off',
    'plant.label': 'Little plant (click to water)',
    'plant.happy': '+ happy',
    'plant.bloom': 'it bloomed!',
    'cat.label': 'Cat',
    'cat.purr': ['purrr...', '*slow blink*'],
    'cat.mew': ['mrrp?', 'mew.'],
    'pomodoro.label': 'Pomodoro timer (click to open)',
    'pomodoro.title': 'Pomodoro',
    'pomodoro.close': 'Close',
    'pomodoro.focus': 'Focus',
    'pomodoro.short': 'Short break',
    'pomodoro.long': 'Long break',
    'pomodoro.start': 'Start',
    'pomodoro.pause': 'Pause',
    'pomodoro.resume': 'Resume',
    'pomodoro.reset': 'Reset',
    'pomodoro.skip': 'Skip',
    'pomodoro.ready': 'Ready when you are',
    'pomodoro.focusing': 'Stay focused',
    'pomodoro.resting': 'Rest your eyes',
    'pomodoro.paused': 'Paused',
    'pomodoro.minutes': '{n} min',
    'pomodoro.shorter': 'Shorter',
    'pomodoro.longer': 'Longer',
    'pomodoro.rounds': '{n} of {total} focus rounds done',
    'pomodoro.hint': '+{n} coins for every focus session you finish',
    'pomodoro.focusDone': 'Focus session done! Short break time.',
    'pomodoro.focusDoneLong': '{n} rounds done! Time for a long break.',
    'pomodoro.breakDone': "Break's over. Back to it, one step at a time.",

    'curtain.label': 'Curtain',
    'lights.label': 'Fairy lights (click to change)',
    'lights.warm': 'warm lights',
    'lights.rainbow': 'rainbow lights',
    'lights.off': 'lights off',
    'board.label': 'Task board (click to open)',
    'clock.label': 'Clock',
    'clock.night': 'The quiet hours. Perfect for thinking.',
    'clock.morning': 'Morning already? Where did the night go.',
    'clock.afternoon': 'Afternoon focus mode.',
    'clock.evening': 'Evening. Tea time, maybe?',
    'chair.label': 'Chair',
    'chair.creak': '*creak*',

    'student.label': 'You',
    'student.thoughts': [
      'Just one more chapter...',
      'The city is so quiet tonight.',
      'I should stretch.',
      'Is it too late for more cocoa?',
      "I think I'm finally getting this.",
      'Look at all those stars.',
    ],

    'sky.label': 'Night sky (click to add a star)',
    'sky.wish': 'wish made',
    'sky.hope': 'I hope it comes true.',
    'star.label': 'A star (click stars to connect them)',
    'star.names': ['The Sleepy Cat', 'The Teacup', 'The Night Owl', 'The Little Lamp', 'The Open Book', 'The Paper Crane'],
    'star.named': 'I\'ll call it "{name}".',
    'moon.label': 'The moon',
    'moon.lines': ['The moon is out late too.', 'Same moon, everywhere in the world.', 'Moon check: still there.'],

    'street.apartments': "Apartments (someone's up late too)",
    'street.lightOn': 'light on',
    'street.lightOff': 'light off',
    'street.lamp': 'Street lamp',
    'person.label': 'Someone walking by (click to wave)',
    'person.greetings': ['hi!', 'good night!', 'hey up there!', '*waves*', 'studying late?', 'sweet dreams!'],

    'shop.label': 'Corner shop (click to go shopping)',
    'shop.sign': 'SHOP',
    'shop.title': 'Corner Shop',
    'shop.subtitle': 'Earn coins by finishing tasks (+{task}), pomodoro focus sessions and working on the laptop.',
    'shop.lamp': 'Lamps',
    'shop.clock': 'Clocks',
    'shop.buy': 'Buy',
    'shop.use': 'Use',
    'shop.inUse': 'In use',
    'shop.owned': 'Owned',
    'shop.need': 'Need {n} more',
    'shop.close': 'Close',
    'shop.thanks': 'Ooh, new things. So cozy.',
    'coins.plus': '+{n} coins',
    'coins.hud': '{n} coins, open the shop',
    'item.lamp-classic': 'Classic lamp',
    'item.lamp-mushroom': 'Mushroom lamp',
    'item.lamp-lantern': 'Red lantern',
    'item.lamp-moon': 'Moon lamp',
    'item.clock-classic': 'Wooden clock',
    'item.clock-pastel': 'Pastel clock',
    'item.clock-cat': 'Cat clock',
    'item.clock-cuckoo': 'Cuckoo clock',
    'shop.map': 'Places',
    'item.map-city': 'City room',
    'item.map-countryside': 'Countryside',
    'map.arrive.map-city': 'Back to the city lights.',
    'map.arrive.map-countryside': 'Frogs croaking, a breeze off the fields... lovely.',

    'student.thoughtsCountry': [
      'The frogs are so loud tonight.',
      'It smells like rice fields after rain.',
      'Look at all those stars.',
      'I can see headlamps out in the fields.',
      'Just one more chapter...',
      "It's so peaceful out here.",
    ],
    'country.field': 'Rice paddies (frogs live here)',
    'country.croak': 'ribbit',
    'country.village': 'The village (someone is still up)',
    'country.hat': 'Conical hat',
    'country.shop': 'Old grocery shop (click to go shopping)',
    'country.shopkeeper': ['What can I get you, dear?', 'Come on in!', 'New snacks just came in.', 'Studying late again?'],
    'shop.titleCountry': "Grandma Tư's Grocery",
    'country.hunter': 'Frog hunter (click to cheer them on)',
    'country.hunterLines': ['Got one!', "Shh... it's right there.", 'Good night for frogs!', "That's a big one!", 'Frog porridge tomorrow!'],
    'country.caught': '+1 frog',
    'country.walker': 'A neighbour out for a walk (click to wave)',
    'country.walkerLines': ['Studying late, kid?', 'Evening!', "Don't stay up too late!", 'Nice breeze tonight.'],
    'country.bike': 'Someone cycling home (click to ring the bell)',
    'country.bikeLines': ['*ring ring*', 'Evening!', 'Heading home!'],
    'country.moto': 'A motorbike on the village road',
    'country.motoLines': ['*beep beep*', 'Off to the market early!', 'Hello there!'],

    'tasks.defaults': ['Read one chapter', 'Drink some water', 'Finish the essay outline', 'Stretch for 5 minutes'],
    'tasks.title': 'My tasks',
    'tasks.count': '{done} / {total} done',
    'tasks.none': 'Nothing to do. Nice!',
    'tasks.close': 'Close',
    'tasks.clear': 'Clear finished',
    'tasks.placeholder': 'Write a new task...',
    'tasks.hint': 'Enter to pin it',
    'tasks.markDone': 'Click to mark as done',
    'tasks.markUndone': 'Click to mark as not done',
    'tasks.remove': 'Remove task',
    'tasks.closedEmpty': 'A clean board. Feels good.',
    'tasks.closedAllDone': 'Everything done! Cocoa break.',
    'tasks.closedOneLeft': 'Just one task left. Almost there.',
    'tasks.closedLeft': '{n} tasks to go. One at a time.',

    'settings.title': 'Settings',
    'settings.open': 'Settings',
    'settings.music': 'Music',
    'settings.musicSub': 'The lo-fi radio on the desk',
    'settings.musicToggle': 'Music on/off',
    'settings.musicVolume': 'Music volume',
    'settings.sfx': 'Sound effects',
    'settings.sfxSub': 'When you click things in the room',
    'settings.sfxToggle': 'Sound effects on/off',
    'settings.sfxVolume': 'Sound effects volume',
    'settings.language': 'Language',
    'settings.tutorial': 'Guide',
    'settings.tutorialSub': 'The tour from your first visit',
    'settings.tutorialReplay': 'Replay',

    'tutorial.step': 'Guide {n} / {total}',
    'tutorial.skip': 'Skip',
    'tutorial.back': 'Back',
    'tutorial.next': 'Next',
    'tutorial.done': "Let's go!",
    'tutorial.tasks.title': 'Your task board',
    'tutorial.tasks.body': "Click the cork board to open your to-do list. Write a task and press Enter to pin it. When it's done, click the note to tick it off and earn +{n} coins.",
    'tutorial.shop.body': 'Click the shop to spend your coins on new lamps and clocks, or even move somewhere new.',
    'tutorial.coins.title': 'Your coins',
    'tutorial.coins.body': 'Your coins live here, and clicking them opens the shop too. Earn more by finishing tasks, completing pomodoro sessions and working on the laptop.',
  },

  vi: {
    intro: 'Mọi thứ ở đây đều tương tác được. Bấm thử xem nhé.',

    'lamp.label': 'Đèn bàn',
    'lamp.click': '*tách*',
    'lamp.off': 'Giờ chỉ còn mình với ánh trăng.',
    'laptop.label': 'Laptop (bấm để làm việc)',
    'laptop.sounds': ['lạch cạch', '*tách*', 'ctrl+s', 'gõ gõ gõ', '+1 dòng'],
    'laptop.progress': 'Xong {n} dòng rồi. Giỏi lắm.',
    'mug.label': 'Cốc ca cao',
    'mug.sip': '*nhấp*',
    'mug.empty': 'Hết sạch rồi...',
    'mug.lines': ['Mmm, vẫn còn ấm.', 'Tuyệt vời.', 'Ca cao chữa lành mọi thứ.'],
    'mug.refill': 'rót đầy rồi!',
    'books.label': 'Sách',
    'books.titles': ['Cẩm nang ngắm sao', 'Giải tích nhẹ nhàng', 'Niên giám về trà', 'Ghi chép từ thị trấn nhỏ', 'Học vẽ mèo'],
    'books.reading': 'Đang đọc: "{title}"',
    'radio.label': 'Radio (bật/tắt nhạc)',
    'radio.on': 'radio lofi: bật',
    'radio.off': 'radio: tắt',
    'plant.label': 'Cây nhỏ (bấm để tưới)',
    'plant.happy': '+ vui vẻ',
    'plant.bloom': 'nở hoa rồi!',
    'cat.label': 'Mèo',
    'cat.purr': ['grừ grừ...', '*chớp mắt chậm*'],
    'cat.mew': ['meo?', 'meo.'],
    'pomodoro.label': 'Đồng hồ Pomodoro (bấm để mở)',
    'pomodoro.title': 'Pomodoro',
    'pomodoro.close': 'Đóng',
    'pomodoro.focus': 'Tập trung',
    'pomodoro.short': 'Nghỉ ngắn',
    'pomodoro.long': 'Nghỉ dài',
    'pomodoro.start': 'Bắt đầu',
    'pomodoro.pause': 'Tạm dừng',
    'pomodoro.resume': 'Tiếp tục',
    'pomodoro.reset': 'Đặt lại',
    'pomodoro.skip': 'Bỏ qua',
    'pomodoro.ready': 'Sẵn sàng thì bấm nhé',
    'pomodoro.focusing': 'Tập trung nào',
    'pomodoro.resting': 'Cho mắt nghỉ chút',
    'pomodoro.paused': 'Đang tạm dừng',
    'pomodoro.minutes': '{n} phút',
    'pomodoro.shorter': 'Bớt thời gian',
    'pomodoro.longer': 'Thêm thời gian',
    'pomodoro.rounds': 'Xong {n} / {total} hiệp tập trung',
    'pomodoro.hint': '+{n} xu cho mỗi phiên tập trung hoàn thành',
    'pomodoro.focusDone': 'Xong một phiên tập trung! Nghỉ ngắn chút nhé.',
    'pomodoro.focusDoneLong': 'Xong {n} hiệp rồi! Nghỉ dài một chút thôi.',
    'pomodoro.breakDone': 'Hết giờ nghỉ rồi. Quay lại học từng chút một nào.',

    'curtain.label': 'Rèm cửa',
    'lights.label': 'Đèn dây (bấm để đổi)',
    'lights.warm': 'đèn vàng ấm',
    'lights.rainbow': 'đèn cầu vồng',
    'lights.off': 'tắt đèn',
    'board.label': 'Bảng công việc (bấm để mở)',
    'clock.label': 'Đồng hồ',
    'clock.night': 'Những giờ yên tĩnh. Hợp để suy nghĩ.',
    'clock.morning': 'Sáng rồi à? Đêm trôi đi đâu mất rồi.',
    'clock.afternoon': 'Buổi chiều, tập trung nào.',
    'clock.evening': 'Tối rồi. Pha ấm trà nhỉ?',
    'chair.label': 'Ghế',
    'chair.creak': '*kẽo kẹt*',

    'student.label': 'Bạn',
    'student.thoughts': [
      'Thêm một chương nữa thôi...',
      'Đêm nay thành phố yên ắng quá.',
      'Mình nên vươn vai một chút.',
      'Giờ này uống thêm ca cao có muộn không nhỉ?',
      'Hình như cuối cùng mình cũng hiểu rồi.',
      'Nhìn bao nhiêu là sao kìa.',
    ],

    'sky.label': 'Bầu trời đêm (bấm để thêm sao)',
    'sky.wish': 'đã ước',
    'sky.hope': 'Mong điều ước thành sự thật.',
    'star.label': 'Ngôi sao (bấm các sao để nối lại)',
    'star.names': ['Chú Mèo Ngái Ngủ', 'Tách Trà', 'Cú Đêm', 'Ngọn Đèn Nhỏ', 'Cuốn Sách Mở', 'Hạc Giấy'],
    'star.named': 'Gọi nó là "{name}" nhé.',
    'moon.label': 'Mặt trăng',
    'moon.lines': ['Mặt trăng cũng thức khuya.', 'Cùng một mặt trăng, khắp nơi trên thế giới.', 'Kiểm tra trăng: vẫn còn đó.'],

    'street.apartments': 'Chung cư (cũng có người thức khuya)',
    'street.lightOn': 'bật đèn',
    'street.lightOff': 'tắt đèn',
    'street.lamp': 'Đèn đường',
    'person.label': 'Người đi đường (bấm để vẫy tay)',
    'person.greetings': ['chào!', 'ngủ ngon nhé!', 'chào bạn trên đó!', '*vẫy tay*', 'học khuya à?', 'mơ đẹp nhé!'],

    'shop.label': 'Tiệm góc phố (bấm để mua sắm)',
    'shop.sign': 'TIỆM',
    'shop.title': 'Tiệm Góc Phố',
    'shop.subtitle': 'Kiếm xu bằng cách làm xong việc (+{task}), tập trung với Pomodoro và làm việc trên laptop.',
    'shop.lamp': 'Đèn',
    'shop.clock': 'Đồng hồ',
    'shop.buy': 'Mua',
    'shop.use': 'Dùng',
    'shop.inUse': 'Đang dùng',
    'shop.owned': 'Đã có',
    'shop.need': 'Thiếu {n} xu',
    'shop.close': 'Đóng',
    'shop.thanks': 'Ồ, đồ mới. Ấm cúng ghê.',
    'coins.plus': '+{n} xu',
    'coins.hud': '{n} xu, mở cửa hàng',
    'item.lamp-classic': 'Đèn cổ điển',
    'item.lamp-mushroom': 'Đèn nấm',
    'item.lamp-lantern': 'Đèn lồng đỏ',
    'item.lamp-moon': 'Đèn mặt trăng',
    'item.clock-classic': 'Đồng hồ gỗ',
    'item.clock-pastel': 'Đồng hồ pastel',
    'item.clock-cat': 'Đồng hồ mèo',
    'item.clock-cuckoo': 'Đồng hồ chim cu',
    'shop.map': 'Nơi ở',
    'item.map-city': 'Phòng trên phố',
    'item.map-countryside': 'Đồng quê',
    'map.arrive.map-city': 'Lại về với ánh đèn thành phố.',
    'map.arrive.map-countryside': 'Ếch kêu, gió đồng thổi mát... dễ chịu thật.',

    'student.thoughtsCountry': [
      'Tối nay ếch kêu to ghê.',
      'Thơm mùi lúa sau mưa.',
      'Nhìn bao nhiêu là sao kìa.',
      'Ngoài đồng có người soi ếch kìa.',
      'Thêm một chương nữa thôi...',
      'Ở đây yên bình quá.',
    ],
    'country.field': 'Ruộng lúa (có ếch đấy)',
    'country.croak': 'ộp ộp',
    'country.village': 'Xóm làng (vẫn có nhà còn thức)',
    'country.hat': 'Nón lá',
    'country.shop': 'Tiệm tạp hóa cũ (bấm để mua sắm)',
    'country.shopkeeper': ['Mua gì đó con?', 'Vào đây con!', 'Có bánh kẹo mới về nè.', 'Lại học khuya hả con?'],
    'shop.titleCountry': 'Tiệm Tạp Hóa Bà Tư',
    'country.hunter': 'Người soi ếch (bấm để cổ vũ)',
    'country.hunterLines': ['Được một con!', 'Suỵt... nó ở kia kìa.', 'Tối nay ếch nhiều ghê!', 'Con này to nè!', 'Mai nấu cháo ếch!'],
    'country.caught': '+1 con ếch',
    'country.walker': 'Hàng xóm đi dạo (bấm để vẫy tay)',
    'country.walkerLines': ['Học khuya thế cháu?', 'Chào cháu!', 'Đừng thức khuya quá nhé!', 'Tối nay gió mát ghê.'],
    'country.bike': 'Người đạp xe về nhà (bấm để bấm chuông)',
    'country.bikeLines': ['*kính coong*', 'Chào cháu nhé!', 'Về nhà thôi!'],
    'country.moto': 'Xe máy trên đường làng',
    'country.motoLines': ['*bíp bíp*', 'Đi chợ sớm đây!', 'Chào nhé!'],

    'tasks.defaults': ['Đọc một chương sách', 'Uống nước', 'Làm xong dàn ý bài luận', 'Vươn vai 5 phút'],
    'tasks.title': 'Việc cần làm',
    'tasks.count': 'Xong {done} / {total}',
    'tasks.none': 'Hết việc rồi. Tuyệt!',
    'tasks.close': 'Đóng',
    'tasks.clear': 'Xoá việc đã xong',
    'tasks.placeholder': 'Viết việc mới...',
    'tasks.hint': 'Enter để ghim lên',
    'tasks.markDone': 'Bấm để đánh dấu đã xong',
    'tasks.markUndone': 'Bấm để bỏ đánh dấu',
    'tasks.remove': 'Xoá việc',
    'tasks.closedEmpty': 'Bảng trống trơn. Nhẹ cả người.',
    'tasks.closedAllDone': 'Xong hết rồi! Nghỉ uống ca cao thôi.',
    'tasks.closedOneLeft': 'Còn một việc nữa thôi. Sắp xong rồi.',
    'tasks.closedLeft': 'Còn {n} việc. Từng việc một nhé.',

    'settings.title': 'Cài đặt',
    'settings.open': 'Cài đặt',
    'settings.music': 'Nhạc nền',
    'settings.musicSub': 'Radio lo-fi trên bàn',
    'settings.musicToggle': 'Bật/tắt nhạc nền',
    'settings.musicVolume': 'Âm lượng nhạc nền',
    'settings.sfx': 'Hiệu ứng âm thanh',
    'settings.sfxSub': 'Khi bấm vào đồ vật trong phòng',
    'settings.sfxToggle': 'Bật/tắt hiệu ứng âm thanh',
    'settings.sfxVolume': 'Âm lượng hiệu ứng',
    'settings.language': 'Ngôn ngữ',
    'settings.tutorial': 'Hướng dẫn',
    'settings.tutorialSub': 'Phần hướng dẫn lúc mới vào game',
    'settings.tutorialReplay': 'Xem lại',

    'tutorial.step': 'Hướng dẫn {n} / {total}',
    'tutorial.skip': 'Bỏ qua',
    'tutorial.back': 'Quay lại',
    'tutorial.next': 'Tiếp',
    'tutorial.done': 'Bắt đầu thôi!',
    'tutorial.tasks.title': 'Bảng công việc',
    'tutorial.tasks.body': 'Bấm vào bảng gỗ để mở danh sách việc cần làm. Viết việc mới rồi nhấn Enter để ghim lên. Làm xong thì bấm vào tờ giấy để gạch đi, mỗi việc xong được +{n} xu.',
    'tutorial.shop.body': 'Bấm vào tiệm để dùng xu mua đèn, đồng hồ mới, thậm chí chuyển tới nơi ở mới.',
    'tutorial.coins.title': 'Xu của bạn',
    'tutorial.coins.body': 'Số xu hiện ở đây, bấm vào cũng mở được cửa hàng. Kiếm thêm xu bằng cách làm xong việc, hoàn thành phiên Pomodoro và làm việc trên laptop.',
  },
};

let lang = load();
const listeners = new Set();
document.documentElement.lang = lang;

function load() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved in STRINGS) return saved;
  } catch {
    // no storage: fall back to the browser's language
  }
  return navigator.language?.toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

export function getLang() {
  return lang;
}

export function setLang(next) {
  if (!(next in STRINGS) || next === lang) return;
  lang = next;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // storage blocked: the language still changes for this session
  }
  listeners.forEach((fn) => fn(lang));
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Unknown keys come back unchanged, so a missing translation shows up as its key.
export function t(key, params) {
  const value = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  if (!params || typeof value !== 'string') return value;
  return value.replace(/\{(\w+)\}/g, (m, name) => (name in params ? params[name] : m));
}

export function pick(key) {
  const list = t(key);
  return list[Math.floor(Math.random() * list.length)];
}

// Fills in HTML marked with data-t (text), data-t-aria (aria-label),
// data-t-title (title) and data-t-placeholder (placeholder).
export function translateDom(root) {
  root.querySelectorAll('[data-t]').forEach((el) => (el.textContent = t(el.dataset.t)));
  root.querySelectorAll('[data-t-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.tAria)));
  root.querySelectorAll('[data-t-title]').forEach((el) => (el.title = t(el.dataset.tTitle)));
  root.querySelectorAll('[data-t-placeholder]').forEach((el) => (el.placeholder = t(el.dataset.tPlaceholder)));
}
