// Basic local dictionary for common words (fallback)
const basicDictionary = {
    '私': 'I, me',
    'あなた': 'you',
    '彼': 'he, him, boyfriend',
    '彼女': 'she, her, girlfriend',
    '愛': 'love',
    '恋': 'love, romance',
    '心': 'heart, mind, spirit',
    '君': 'you (casual)',
    '僕': 'I, me (male)',
    '夢': 'dream',
    '空': 'sky',
    '海': 'sea, ocean',
    '花': 'flower',
    '桜': 'cherry blossom',
    '月': 'moon, month',
    '星': 'star',
    '雨': 'rain',
    '雪': 'snow',
    '風': 'wind',
    '光': 'light',
    '影': 'shadow',
    '声': 'voice',
    '涙': 'tears',
    '笑顔': 'smile, smiling face',
    '未来': 'future',
    '過去': 'past',
    '今': 'now, present',
    '明日': 'tomorrow',
    '昨日': 'yesterday',
    '永遠': 'eternity, forever',
    '時間': 'time',
    '世界': 'world',
    '人生': 'life, human life',
    '運命': 'fate, destiny',
    '奇跡': 'miracle',
    '希望': 'hope',
    '願い': 'wish, desire',
    '思い出': 'memory, memories',
    '出会い': 'encounter, meeting',
    '別れ': 'parting, farewell',
    '手': 'hand',
    '目': 'eye',
    '言葉': 'word, language',
    '歌': 'song',
    '夜': 'night',
    '朝': 'morning',
    '春': 'spring',
    '夏': 'summer',
    '秋': 'autumn, fall',
    '冬': 'winter'
};

// Search in basic dictionary
function searchBasicDictionary(word) {
    if (basicDictionary[word]) {
        return `
            <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p class="text-sm text-yellow-800 mb-1">📚 基本字典</p>
                <p class="text-gray-700">${basicDictionary[word]}</p>
            </div>
        `;
    }
    return null;
}
