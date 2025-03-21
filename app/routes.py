from flask import request, jsonify, render_template
from app import app
from app.bot import TafsirChatbot
quran_suras = {
    1: {"arabic": "الفاتحة", "english": "Al-Fatiha"},
    2: {"arabic": "البقرة", "english": "Al-Baqarah"},
    3: {"arabic": "آل عمران", "english": "Aal-E-Imran"},
    4: {"arabic": "النساء", "english": "An-Nisa"},
    5: {"arabic": "المائدة", "english": "Al-Ma'idah"},
    6: {"arabic": "الأنعام", "english": "Al-An'am"},
    7: {"arabic": "الأعراف", "english": "Al-A'raf"},
    8: {"arabic": "الأنفال", "english": "Al-Anfal"},
    9: {"arabic": "التوبة", "english": "At-Tawbah"},
    10: {"arabic": "يونس", "english": "Yunus"},
    11: {"arabic": "هود", "english": "Hud"},
    12: {"arabic": "يوسف", "english": "Yusuf"},
    13: {"arabic": "الرعد", "english": "Ar-Ra'd"},
    14: {"arabic": "إبراهيم", "english": "Ibrahim"},
    15: {"arabic": "الحجر", "english": "Al-Hijr"},
    16: {"arabic": "النحل", "english": "An-Nahl"},
    17: {"arabic": "الإسراء", "english": "Al-Isra"},
    18: {"arabic": "الكهف", "english": "Al-Kahf"},
    19: {"arabic": "مريم", "english": "Maryam"},
    20: {"arabic": "طه", "english": "Taha"},
    21: {"arabic": "الأنبياء", "english": "Al-Anbiya"},
    22: {"arabic": "الحج", "english": "Al-Hajj"},
    23: {"arabic": "المؤمنون", "english": "Al-Mu'minun"},
    24: {"arabic": "النور", "english": "An-Nur"},
    25: {"arabic": "الفرقان", "english": "Al-Furqan"},
    26: {"arabic": "الشعراء", "english": "Ash-Shu'ara"},
    27: {"arabic": "النمل", "english": "An-Naml"},
    28: {"arabic": "القصص", "english": "Al-Qasas"},
    29: {"arabic": "العنكبوت", "english": "Al-Ankabut"},
    30: {"arabic": "الروم", "english": "Ar-Rum"},
    31: {"arabic": "لقمان", "english": "Luqman"},
    32: {"arabic": "السجدة", "english": "As-Sajdah"},
    33: {"arabic": "الأحزاب", "english": "Al-Ahzab"},
    34: {"arabic": "سبأ", "english": "Saba"},
    35: {"arabic": "فاطر", "english": "Fatir"},
    36: {"arabic": "يس", "english": "Ya-Sin"},
    37: {"arabic": "الصافات", "english": "As-Saffat"},
    38: {"arabic": "ص", "english": "Sad"},
    39: {"arabic": "الزمر", "english": "Az-Zumar"},
    40: {"arabic": "غافر", "english": "Ghafir"},
    41: {"arabic": "فصلت", "english": "Fussilat"},
    42: {"arabic": "الشورى", "english": "Ash-Shura"},
    43: {"arabic": "الزخرف", "english": "Az-Zukhruf"},
    44: {"arabic": "الدخان", "english": "Ad-Dukhan"},
    45: {"arabic": "الجاثية", "english": "Al-Jathiya"},
    46: {"arabic": "الأحقاف", "english": "Al-Ahqaf"},
    47: {"arabic": "محمد", "english": "Muhammad"},
    48: {"arabic": "الفتح", "english": "Al-Fath"},
    49: {"arabic": "الحجرات", "english": "Al-Hujurat"},
    50: {"arabic": "ق", "english": "Qaf"},
    51: {"arabic": "الذاريات", "english": "Adh-Dhariyat"},
    52: {"arabic": "الطور", "english": "At-Tur"},
    53: {"arabic": "النجم", "english": "An-Najm"},
    54: {"arabic": "القمر", "english": "Al-Qamar"},
    55: {"arabic": "الرحمن", "english": "Ar-Rahman"},
    56: {"arabic": "الواقعة", "english": "Al-Waqi'a"},
    57: {"arabic": "الحديد", "english": "Al-Hadid"},
    58: {"arabic": "المجادلة", "english": "Al-Mujadila"},
    59: {"arabic": "الحشر", "english": "Al-Hashr"},
    60: {"arabic": "الممتحنة", "english": "Al-Mumtahina"},
    61: {"arabic": "الصف", "english": "As-Saff"},
    62: {"arabic": "الجمعة", "english": "Al-Jumu'a"},
    63: {"arabic": "المنافقون", "english": "Al-Munafiqun"},
    64: {"arabic": "التغابن", "english": "At-Taghabun"},
    65: {"arabic": "الطلاق", "english": "At-Talaq"},
    66: {"arabic": "التحريم", "english": "At-Tahrim"},
    67: {"arabic": "الملك", "english": "Al-Mulk"},
    68: {"arabic": "القلم", "english": "Al-Qalam"},
    69: {"arabic": "الحاقة", "english": "Al-Haqqah"},
    70: {"arabic": "المعارج", "english": "Al-Ma'arij"},
    71: {"arabic": "نوح", "english": "Nuh"},
    72: {"arabic": "الجن", "english": "Al-Jinn"},
    73: {"arabic": "المزمل", "english": "Al-Muzzammil"},
    74: {"arabic": "المدثر", "english": "Al-Muddathir"},
    75: {"arabic": "القيامة", "english": "Al-Qiyama"},
    76: {"arabic": "الإنسان", "english": "Al-Insan"},
    77: {"arabic": "المرسلات", "english": "Al-Mursalat"},
    78: {"arabic": "النبأ", "english": "An-Naba"},
    79: {"arabic": "النازعات", "english": "An-Nazi'at"},
    80: {"arabic": "عبس", "english": "Abasa"},
    81: {"arabic": "التكوير", "english": "At-Takwir"},
    82: {"arabic": "الإنفطار", "english": "Al-Infitar"},
    83: {"arabic": "المطففين", "english": "Al-Mutaffifin"},
    84: {"arabic": "الإنشقاق", "english": "Al-Inshiqaq"},
    85: {"arabic": "البروج", "english": "Al-Buruj"},
    86: {"arabic": "الطارق", "english": "At-Tariq"},
    87: {"arabic": "الأعلى", "english": "Al-A'la"},
    88: {"arabic": "الغاشية", "english": "Al-Ghashiyah"},
    89: {"arabic": "الفجر", "english": "Al-Fajr"},
    90: {"arabic": "البلد", "english": "Al-Balad"},
    91: {"arabic": "الشمس", "english": "Ash-Shams"},
    92: {"arabic": "الليل", "english": "Al-Lail"},
    93: {"arabic": "الضحى", "english": "Adh-Dhuha"},
    94: {"arabic": "الشرح", "english": "Ash-Sharh"},
    95: {"arabic": "التين", "english": "At-Tin"},
    96: {"arabic": "العلق", "english": "Al-Alaq"},
    97: {"arabic": "القدر", "english": "Al-Qadr"},
    98: {"arabic": "البينة", "english": "Al-Bayyina"},
    99: {"arabic": "الزلزلة", "english": "Az-Zalzalah"},
    100: {"arabic": "العاديات", "english": "Al-Adiyat"},
    101: {"arabic": "القارعة", "english": "Al-Qari'ah"},
    102: {"arabic": "التكاثر", "english": "At-Takathur"},
    103: {"arabic": "العصر", "english": "Al-Asr"},
    104: {"arabic": "الهمزة", "english": "Al-Humazah"},
    105: {"arabic": "الفيل", "english": "Al-Fil"},
    106: {"arabic": "قريش", "english": "Quraish"},
    107: {"arabic": "الماعون", "english": "Al-Ma'un"},
    108: {"arabic": "الكوثر", "english": "Al-Kawthar"},
    109: {"arabic": "الكافرون", "english": "Al-Kafirun"},
    110: {"arabic": "النصر", "english": "An-Nasr"},
    111: {"arabic": "المسد", "english": "Al-Masad"},
    112: {"arabic": "الإخلاص", "english": "Al-Ikhlas"},
    113: {"arabic": "الفلق", "english": "Al-Falaq"},
    114: {"arabic": "الناس", "english": "An-Nas"}
}

# Initialize the chatbot (this might take a few moments on startup)
tafsir_bot = TafsirChatbot()

@app.route('/')
def home():
    return render_template('index.html', 
                          sources=tafsir_bot.get_available_sources(),
                          quran_suras=quran_suras)


@app.route('/api/browse_surah', methods=['POST'])
def browse_surah():
    data = request.json
    surah_id = data.get('surah_id')
    page = data.get('page', 1)
    verses_per_page = 2  # Show two verses at a time
    preferred_source = data.get('source', None)
    
    if not surah_id or not surah_id.isdigit():
        return jsonify({'error': 'يرجى تحديد رقم السورة'})
    
    surah_id = int(surah_id)
    if surah_id < 1 or surah_id > 114:
        return jsonify({'error': 'رقم السورة غير صحيح'})
    
    # Get all verses for this surah from the dataset
    all_verses = tafsir_bot.get_surah_verses(int(surah_id))
    
    # Calculate total pages
    total_pages = (len(all_verses) + verses_per_page - 1) // verses_per_page
    
    # Ensure page is within bounds
    page = max(1, min(page, total_pages))
    
    # Get verses for current page
    start_idx = (page - 1) * verses_per_page
    end_idx = min(start_idx + verses_per_page, len(all_verses))
    current_verses = all_verses[start_idx:end_idx]
    
    # Get tafsir for each verse
    results = []
    for verse_num in current_verses:
        tafsir = tafsir_bot._get_specific_tafsir(surah_id, verse_num, preferred_source)
        results.append(tafsir)
    
    return jsonify({
        'surah_id': surah_id,
        'surah_name_ar': quran_suras[surah_id]['arabic'],
        'surah_name_en': quran_suras[surah_id]['english'],
        'current_page': page,
        'total_pages': total_pages,
        'verses': results
    })



@app.route('/api/query', methods=['POST'])
def query():
    data = request.json
    user_query = data.get('query', '')
    preferred_source = data.get('source', None)
    
    if not user_query:
        return jsonify({'response': 'الرجاء إدخال سؤال أو رقم آية.'})
    
    response = tafsir_bot.respond(user_query, preferred_source)
    return jsonify({'response': response})


@app.route('/api/get_surah_info', methods=['POST'])
def get_surah_info():
        data = request.json
        surah_id = int(data.get('surah_id'))
        # Get total ayahs for this surah
        total_ayahs = len(tafsir_bot.get_surah_verses(surah_id))
        surah = quran_suras.get(surah_id, None)
        return jsonify({
            'surah_id': surah_id,
            'total_ayahs': total_ayahs,
            'ayahs_per_page': 2,  # Configure based on your pagination
            'surah_name_ar': quran_suras.get(surah_id, None)['arabic'],
            'surah_name_en': quran_suras.get(surah_id, None)['english']
        })

@app.route('/api/sources')
def get_sources():
    return jsonify({'sources': tafsir_bot.get_available_sources()})