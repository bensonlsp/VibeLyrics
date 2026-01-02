// Global State
let tokenizer = null;
let currentSelectedWord = null;
let vocabularyData = JSON.parse(localStorage.getItem('vibelyrics_vocab') || '[]');
let furiganaVisible = true;
let useHiragana = localStorage.getItem('vibelyrics_hiragana') !== 'false'; // default to hiragana

// Katakana to Hiragana Conversion
function katakanaToHiragana(str) {
    return str.replace(/[\u30a1-\u30f6]/g, match => {
        const chr = match.charCodeAt(0) - 0x60;
        return String.fromCharCode(chr);
    });
}

// Get reading based on user preference
function getReading(reading) {
    if (!reading) return '';
    return useHiragana ? katakanaToHiragana(reading) : reading;
}

// Initialize
async function initialize() {
    try {
        // Load kuromoji tokenizer
        tokenizer = await new Promise((resolve, reject) => {
            kuromoji.builder({
                dicPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/'
            }).build((err, tokenizer) => {
                if (err) reject(err);
                else resolve(tokenizer);
            });
        });

        document.getElementById('loadingIndicator').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');

        renderVocabularyDeck();

        // Update kana type buttons state
        updateKanaButtonsState();
    } catch (error) {
        console.error('初始化失敗:', error);
        document.getElementById('loadingIndicator').innerHTML = `
            <div class="text-center text-red-500">
                <p class="text-xl font-semibold mb-2">載入失敗</p>
                <p class="text-sm">${error.message}</p>
            </div>
        `;
    }
}

// Parse Japanese Text
async function parseLyrics(text) {
    if (!tokenizer) {
        alert('分析引擎尚未載入完成，請稍候...');
        return;
    }

    const tokens = tokenizer.tokenize(text);
    const parsedLyricsDiv = document.getElementById('parsedLyrics');
    parsedLyricsDiv.innerHTML = '';

    const lines = text.split('\n');
    let tokenIndex = 0;

    lines.forEach((line, lineIdx) => {
        if (line.trim() === '') {
            parsedLyricsDiv.innerHTML += '<br>';
            return;
        }

        const lineDiv = document.createElement('div');
        lineDiv.className = 'mb-2';

        const lineTokens = [];
        let lineText = '';

        while (tokenIndex < tokens.length) {
            const token = tokens[tokenIndex];
            lineText += token.surface_form;
            lineTokens.push(token);
            tokenIndex++;

            if (lineText.length >= line.length) break;
        }

        lineTokens.forEach(token => {
            const span = document.createElement('span');
            span.className = 'word-token';
            const displayReading = getReading(token.reading || token.surface_form);

            // Store token data for click handler
            const tokenData = {
                word: token.surface_form,
                reading: displayReading,
                pos: token.pos,
                baseForm: token.basic_form || token.surface_form
            };

            span.dataset.token = JSON.stringify(tokenData);

            if (token.surface_form.match(/^[ぁ-んァ-ヶー一-龯]+$/)) {
                const ruby = document.createElement('ruby');
                ruby.textContent = token.surface_form;

                const rt = document.createElement('rt');
                rt.textContent = displayReading;
                // Store original katakana reading for conversion
                rt.dataset.originalReading = token.reading || token.surface_form;

                ruby.appendChild(rt);
                span.appendChild(ruby);
            } else {
                span.textContent = token.surface_form;
            }

            // Add click event listener - bind to the span element
            span.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                selectWord(this, token);
            });

            lineDiv.appendChild(span);
        });

        parsedLyricsDiv.appendChild(lineDiv);
    });

    document.getElementById('parsedLyricsContainer').classList.remove('hidden');
    document.getElementById('parsedLyricsContainer').scrollIntoView({ behavior: 'smooth' });
}

// Select Word - Show in Modal
async function selectWord(element, token) {
    document.querySelectorAll('.word-token').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');

    const displayReading = getReading(token.reading || token.surface_form);

    currentSelectedWord = {
        word: token.surface_form,
        reading: displayReading,
        pos: token.pos,
        baseForm: token.basic_form || token.surface_form,
        meaning: null // Will be populated after lookup
    };

    // Open modal and populate basic info
    openWordModal();
    document.getElementById('modalWord').textContent = currentSelectedWord.word;
    document.getElementById('modalReading').textContent = displayReading;
    document.getElementById('modalPos').textContent = currentSelectedWord.pos;
    document.getElementById('modalBaseForm').textContent = `原形: ${currentSelectedWord.baseForm}`;

    // Show loading spinner
    document.getElementById('modalMeaning').innerHTML = `
        <div class="flex items-center justify-center py-4">
            <div class="loading-spinner"></div>
        </div>
    `;

    // Lookup word meaning
    const meaning = await lookupWord(currentSelectedWord.baseForm);
    currentSelectedWord.meaning = meaning; // Store the meaning
    document.getElementById('modalMeaning').innerHTML = meaning;
}

// Open Word Modal
function openWordModal() {
    const modal = document.getElementById('wordModal');
    modal.classList.add('active');
    document.body.classList.add('modal-open'); // Prevent background scrolling
}

// Close Word Modal
function closeWordModal() {
    const modal = document.getElementById('wordModal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open'); // Restore scrolling

    // Remove selection highlight
    document.querySelectorAll('.word-token').forEach(el => el.classList.remove('selected'));
}

// Expose to global scope
window.closeWordModal = closeWordModal;

// Lookup Word from Jisho - Multiple fallback methods
async function lookupWord(word) {
    console.log('正在查詢單詞:', word);

    // Check basic dictionary first
    const basicResult = searchBasicDictionary(word);
    let hasBasicResult = basicResult !== null;

    const jishoApiUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`;
    const jishoWebUrl = `https://jisho.org/search/${encodeURIComponent(word)}`;

    // Array of CORS proxies to try
    const proxies = [
        '', // Direct call first
        'https://api.allorigins.win/raw?url=',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://corsproxy.io/?'
    ];

    // Try each proxy
    for (let i = 0; i < proxies.length; i++) {
        try {
            const proxy = proxies[i];
            const url = proxy ? proxy + encodeURIComponent(jishoApiUrl) : jishoApiUrl;

            console.log(`嘗試方法 ${i + 1}/${proxies.length}:`, proxy || 'Direct');

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.log(`方法 ${i + 1} HTTP 錯誤:`, response.status);
                continue;
            }

            const result = await response.json();
            console.log(`方法 ${i + 1} 成功:`, result);

            if (result.data && result.data.length > 0) {
                const entry = result.data[0];
                let html = '<div class="space-y-2">';

                // Show basic dictionary first if available
                if (hasBasicResult) {
                    html += basicResult;
                    html += '<div class="border-t border-gray-200 my-3"></div>';
                }

                if (entry.senses && entry.senses.length > 0) {
                    html += '<div class="space-y-2">';
                    entry.senses.slice(0, 3).forEach((sense, idx) => {
                        const pos = sense.parts_of_speech ? sense.parts_of_speech.join(', ') : '';
                        const defs = sense.english_definitions ? sense.english_definitions.join('; ') : '';

                        if (defs) {
                            html += `
                                <div class="border-l-4 border-blue-500 pl-3 py-1 mb-2">
                                    ${pos ? `<p class="font-semibold text-sm text-gray-500 mb-1">${idx + 1}. ${pos}</p>` : ''}
                                    <p class="text-gray-700">${defs}</p>
                                </div>
                            `;
                        }
                    });
                    html += '</div>';
                }

                // Add Jisho link
                html += `
                    <div class="mt-3 pt-3 border-t border-gray-200">
                        <a href="${jishoWebUrl}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1">
                            <span>📖 在 Jisho.org 查看完整資訊</span>
                            <span>↗</span>
                        </a>
                    </div>
                `;

                html += '</div>';
                return html;
            }
        } catch (error) {
            console.log(`方法 ${i + 1} 失敗:`, error.message);
            continue;
        }
    }

    // All methods failed - provide fallback with link
    console.log('所有查詢方法都失敗，顯示備用方案');

    // If we have basic dictionary result, show that
    if (hasBasicResult) {
        return `
            <div class="space-y-3">
                ${basicResult}
                <div class="mt-3 pt-3 border-t border-gray-200">
                    <p class="text-sm text-gray-600 mb-2">在線查詢暫時無法使用，查看更多資訊：</p>
                    <a href="${jishoWebUrl}" target="_blank" class="inline-block bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-all text-sm">
                        在 Jisho.org 查詢「${word}」 ↗
                    </a>
                </div>
            </div>
        `;
    }

    // No results at all
    return `
        <div class="space-y-3">
            <p class="text-gray-600">自動查詢暫時無法使用</p>
            <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-sm text-gray-700 mb-2">請點擊下方連結手動查詢：</p>
                <a href="${jishoWebUrl}" target="_blank" class="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all">
                    在 Jisho.org 查詢「${word}」 ↗
                </a>
            </div>
        </div>
    `;
}

// Add to Vocabulary Deck
function addToDeck() {
    if (!currentSelectedWord) return;

    const exists = vocabularyData.some(item => item.word === currentSelectedWord.word);
    if (exists) {
        alert('此單詞已在生字簿中！');
        return;
    }

    // Ensure we have the meaning
    const meaningHtml = currentSelectedWord.meaning || document.getElementById('modalMeaning').innerHTML;

    vocabularyData.unshift({
        word: currentSelectedWord.word,
        reading: currentSelectedWord.reading,
        pos: currentSelectedWord.pos,
        baseForm: currentSelectedWord.baseForm,
        meaning: meaningHtml,
        addedAt: Date.now()
    });

    localStorage.setItem('vibelyrics_vocab', JSON.stringify(vocabularyData));
    renderVocabularyDeck();

    // Update button feedback in modal
    const button = document.getElementById('modalAddToDeckButton');
    const originalText = button.textContent;
    const originalClass = button.className;
    button.textContent = '✓ 已加入';
    button.className = 'flex-1 bg-gray-400 text-white py-2.5 rounded-lg font-medium cursor-not-allowed';
    button.disabled = true;

    setTimeout(() => {
        button.textContent = originalText;
        button.className = originalClass;
        button.disabled = false;
    }, 1500);
}

// Render Vocabulary Deck
function renderVocabularyDeck() {
    const deckDiv = document.getElementById('vocabularyDeck');
    const reviewButton = document.getElementById('startReviewButton');
    const reviewCountSpan = document.getElementById('reviewCount');

    if (vocabularyData.length === 0) {
        deckDiv.innerHTML = '<p class="text-gray-500 text-center py-8">尚無收藏的單詞</p>';
        reviewButton.classList.add('hidden');
        return;
    }

    // Show review button and update count
    reviewButton.classList.remove('hidden');
    reviewCountSpan.textContent = vocabularyData.length;

    deckDiv.innerHTML = '';
    vocabularyData.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'flip-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all';
        card.innerHTML = `
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    <div class="text-2xl font-bold text-gray-900 mb-1">${item.word}</div>
                    <div class="text-sm text-gray-500">${item.reading}</div>
                    <div class="text-xs text-blue-600 mt-2">點擊查看釋義</div>
                </div>
                <div class="flip-card-back">
                    <div class="text-lg font-semibold text-gray-900 mb-2">${item.word}</div>
                    ${item.meaning}
                    <div class="mt-3 flex gap-2">
                        <button onclick="speakWord('${item.reading}')" class="flex-1 bg-purple-500 text-white py-1 px-3 rounded text-sm hover:bg-purple-600 transition-all">
                            🔊
                        </button>
                        <button onclick="removeFromDeck(${index})" class="flex-1 bg-red-500 text-white py-1 px-3 rounded text-sm hover:bg-red-600 transition-all">
                            刪除
                        </button>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                const wasFlipped = card.classList.contains('flipped');
                card.classList.toggle('flipped');

                // Adjust card height when flipped
                if (!wasFlipped) {
                    // Card is being flipped to show back
                    const backElement = card.querySelector('.flip-card-back');
                    if (backElement) {
                        // Wait for flip animation to start, then set height
                        setTimeout(() => {
                            const backHeight = backElement.scrollHeight;
                            card.style.minHeight = (backHeight + 32) + 'px'; // 32px for padding
                        }, 50);
                    }
                } else {
                    // Card is being flipped back to front
                    card.style.minHeight = '100px';
                }
            }
        });

        deckDiv.appendChild(card);
    });
}

// Speak Word with proper voice loading
function speakWord(text) {
    if (!('speechSynthesis' in window)) {
        alert('您的瀏覽器不支援語音合成功能');
        return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    // Function to actually speak
    const doSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find and use a Japanese voice
        const voices = speechSynthesis.getVoices();
        const japaneseVoice = voices.find(voice =>
            voice.lang.startsWith('ja') || voice.lang.startsWith('jp')
        );

        if (japaneseVoice) {
            utterance.voice = japaneseVoice;
            console.log('使用日文語音:', japaneseVoice.name);
        } else {
            console.log('未找到日文語音，使用預設語音');
        }

        // Error handling
        utterance.onerror = (event) => {
            console.error('語音合成錯誤:', event);
            alert('發音失敗，請重試');
        };

        utterance.onend = () => {
            console.log('語音播放完成');
        };

        speechSynthesis.speak(utterance);
    };

    // Wait for voices to load if needed
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
        // Voices not loaded yet, wait for them
        speechSynthesis.onvoiceschanged = () => {
            doSpeak();
        };
        // Also try after a short delay as backup
        setTimeout(doSpeak, 100);
    } else {
        doSpeak();
    }
}

// Remove from Deck
function removeFromDeck(index) {
    if (confirm('確定要刪除此單詞？')) {
        vocabularyData.splice(index, 1);
        localStorage.setItem('vibelyrics_vocab', JSON.stringify(vocabularyData));
        renderVocabularyDeck();
    }
}

// Flashcard Review System
let reviewQueue = [];
let currentCardIndex = 0;
let reviewSession = {
    total: 0,
    completed: 0,
    mastered: []
};

// Start Flashcard Review
function startFlashcardReview() {
    if (vocabularyData.length === 0) {
        alert('生字簿中沒有單詞可以複習！');
        return;
    }

    // Prepare review queue
    reviewQueue = [...vocabularyData];
    currentCardIndex = 0;
    reviewSession = {
        total: reviewQueue.length,
        completed: 0,
        mastered: []
    };

    // Open modal and show first card
    openFlashcardModal();
    showCurrentCard();
}

// Open Flashcard Modal
function openFlashcardModal() {
    const modal = document.getElementById('flashcardModal');
    modal.classList.add('active');
    document.body.classList.add('modal-open');
}

// Close Flashcard Modal
function closeFlashcardModal() {
    const modal = document.getElementById('flashcardModal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');

    // Reset flashcard flip state
    document.getElementById('flashcard').classList.remove('flipped');

    // Show completion summary if session completed
    if (reviewSession.completed === reviewSession.total && reviewSession.total > 0) {
        showReviewSummary();
    }
}

// Show Current Card
function showCurrentCard() {
    if (currentCardIndex >= reviewQueue.length) {
        // Review session completed
        reviewSession.completed = reviewQueue.length;
        closeFlashcardModal();
        return;
    }

    const card = reviewQueue[currentCardIndex];
    const flashcard = document.getElementById('flashcard');

    // Reset flip state
    flashcard.classList.remove('flipped');

    // Update card content - Front
    document.getElementById('flashcardWord').textContent = card.word;
    document.getElementById('flashcardReading').textContent = card.reading;

    // Update card content - Back
    document.getElementById('flashcardBackWord').textContent = card.word;
    document.getElementById('flashcardBackReading').textContent = card.reading;
    document.getElementById('flashcardMeaning').innerHTML = card.meaning;

    // Update progress
    document.getElementById('flashcardProgress').textContent =
        `${currentCardIndex + 1}/${reviewQueue.length}`;

    const progressPercent = ((currentCardIndex) / reviewQueue.length) * 100;
    document.getElementById('progressBar').style.width = progressPercent + '%';
}

// Flip Flashcard
function flipFlashcard() {
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.toggle('flipped');
}

// Handle "Again" (再看一次)
function handleAgain() {
    const card = reviewQueue[currentCardIndex];

    // Initialize review stats if not exists
    if (!card.reviewCount) card.reviewCount = 0;
    if (!card.lastReviewed) card.lastReviewed = [];

    // Record review
    card.reviewCount++;
    card.lastReviewed.push({
        date: Date.now(),
        result: 'again'
    });

    // Move card to end of queue for another review
    reviewQueue.push(card);

    // Move to next card
    currentCardIndex++;
    updateVocabularyStorage();
    showCurrentCard();
}

// Handle "Good" (記住了)
function handleGood() {
    const card = reviewQueue[currentCardIndex];

    // Initialize review stats if not exists
    if (!card.reviewCount) card.reviewCount = 0;
    if (!card.masteryLevel) card.masteryLevel = 0;
    if (!card.lastReviewed) card.lastReviewed = [];

    // Record review
    card.reviewCount++;
    card.masteryLevel++;
    card.lastReviewed.push({
        date: Date.now(),
        result: 'good'
    });

    // Check if card is mastered (reviewed successfully 5 times)
    if (card.masteryLevel >= 5) {
        reviewSession.mastered.push(card);
    }

    // Move to next card
    currentCardIndex++;
    updateVocabularyStorage();
    showCurrentCard();
}

// Update vocabulary storage
function updateVocabularyStorage() {
    localStorage.setItem('vibelyrics_vocab', JSON.stringify(vocabularyData));
}

// Show Review Summary
function showReviewSummary() {
    if (reviewSession.mastered.length > 0) {
        const masteredWords = reviewSession.mastered.map(card => card.word).join('、');
        const message = `恭喜！您已經熟練掌握以下單詞：\n\n${masteredWords}\n\n這些單詞已複習 5 次以上，是否要從生字簿中移除？`;

        if (confirm(message)) {
            // Remove mastered words from vocabulary
            reviewSession.mastered.forEach(masteredCard => {
                const index = vocabularyData.findIndex(item => item.word === masteredCard.word);
                if (index > -1) {
                    vocabularyData.splice(index, 1);
                }
            });

            updateVocabularyStorage();
            renderVocabularyDeck();
            alert(`已移除 ${reviewSession.mastered.length} 個已掌握的單詞！`);
        }
    } else {
        alert(`複習完成！繼續加油！`);
    }
}

// Expose functions to global scope for inline event handlers
window.speakWord = speakWord;
window.removeFromDeck = removeFromDeck;
window.closeFlashcardModal = closeFlashcardModal;

// Clear Deck
function clearDeck() {
    if (confirm('確定要清空整個生字簿？')) {
        vocabularyData = [];
        localStorage.setItem('vibelyrics_vocab', JSON.stringify(vocabularyData));
        renderVocabularyDeck();
    }
}

// Toggle Furigana
function toggleFurigana() {
    furiganaVisible = !furiganaVisible;
    const parsedLyrics = document.getElementById('parsedLyrics');

    if (furiganaVisible) {
        parsedLyrics.classList.remove('furigana-hidden');
        document.getElementById('furiganaToggleText').textContent = '隱藏振假名';
    } else {
        parsedLyrics.classList.add('furigana-hidden');
        document.getElementById('furiganaToggleText').textContent = '顯示振假名';
    }
}

// Update Kana Buttons State
function updateKanaButtonsState() {
    const hiraganaBtn = document.getElementById('hiraganaBtn');
    const katakanaBtn = document.getElementById('katakanaBtn');

    if (useHiragana) {
        hiraganaBtn.classList.add('kana-active');
        hiraganaBtn.classList.remove('text-gray-600', 'hover:text-gray-900');
        katakanaBtn.classList.remove('kana-active');
        katakanaBtn.classList.add('text-gray-600', 'hover:text-gray-900');
    } else {
        katakanaBtn.classList.add('kana-active');
        katakanaBtn.classList.remove('text-gray-600', 'hover:text-gray-900');
        hiraganaBtn.classList.remove('kana-active');
        hiraganaBtn.classList.add('text-gray-600', 'hover:text-gray-900');
    }
}

// Set Kana Type
function setKanaType(isHiragana) {
    useHiragana = isHiragana;
    localStorage.setItem('vibelyrics_hiragana', useHiragana);
    updateKanaButtonsState();

    // Update existing parsed lyrics without re-parsing
    updateParsedLyricsKana();
}

// Update the kana display in already parsed lyrics
function updateParsedLyricsKana() {
    const parsedLyrics = document.getElementById('parsedLyrics');
    if (!parsedLyrics || parsedLyrics.children.length === 0) return;

    // Update all ruby/rt elements
    const allRt = parsedLyrics.querySelectorAll('rt');
    allRt.forEach(rt => {
        const originalReading = rt.dataset.originalReading;
        if (!originalReading) return;

        // Convert from original katakana to selected type
        if (useHiragana) {
            rt.textContent = katakanaToHiragana(originalReading);
        } else {
            rt.textContent = originalReading; // Keep as katakana
        }
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('parseButton').addEventListener('click', () => {
        const text = document.getElementById('lyricsInput').value;
        if (text.trim()) {
            parseLyrics(text);
        } else {
            alert('請先輸入日文');
        }
    });

    // Modal button listeners
    document.getElementById('modalAddToDeckButton').addEventListener('click', addToDeck);
    document.getElementById('modalSpeakButton').addEventListener('click', () => {
        if (currentSelectedWord) {
            speakWord(currentSelectedWord.reading);
        }
    });

    // Close modal when clicking overlay
    document.getElementById('wordModal').addEventListener('click', (e) => {
        if (e.target.id === 'wordModal') {
            closeWordModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeWordModal();
        }
    });

    document.getElementById('clearDeckButton').addEventListener('click', clearDeck);
    document.getElementById('furiganaToggle').addEventListener('click', toggleFurigana);
    document.getElementById('hiraganaBtn').addEventListener('click', () => setKanaType(true));
    document.getElementById('katakanaBtn').addEventListener('click', () => setKanaType(false));

    // Flashcard review listeners
    document.getElementById('startReviewButton').addEventListener('click', startFlashcardReview);
    document.getElementById('flashcard').addEventListener('click', flipFlashcard);
    document.getElementById('againButton').addEventListener('click', handleAgain);
    document.getElementById('goodButton').addEventListener('click', handleGood);

    // Close flashcard modal when clicking overlay
    document.getElementById('flashcardModal').addEventListener('click', (e) => {
        if (e.target.id === 'flashcardModal') {
            closeFlashcardModal();
        }
    });

    // Initialize on load
    initialize();
});
