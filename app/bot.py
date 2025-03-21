import os
import pickle
import re
import string
import pandas as pd
from datasets import load_dataset
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class ArabicTextPreprocessor:
    def __init__(self):
        # Arabic diacritics (tashkeel) to be removed
        self.arabic_diacritics = re.compile("""
            [\u064B-\u065F\u0670]  # Tashkeel (fatha, damma, kasra, etc.)
        """, re.VERBOSE)
        
        # Additional Arabic normalization patterns
        self.arabic_patterns = {
            # Normalize alef variations to simple alef
            'alef': re.compile(r'[إأآا]'),
            # Normalize teh marbuta and heh
            'heh': re.compile(r'[ةه]'),
            # Normalize yeh variations
            'yeh': re.compile(r'[يىئ]'),
            # Normalize waw variations
            'waw': re.compile(r'[ؤو]')
        }
    
    def remove_diacritics(self, text):
        """Remove Arabic diacritics (tashkeel) from text"""
        if not isinstance(text, str):
            return ""
        return self.arabic_diacritics.sub('', text)
    
    def normalize_arabic_chars(self, text):
        """Normalize Arabic characters to standard forms"""
        if not isinstance(text, str):
            return ""
        text = self.arabic_patterns['alef'].sub('ا', text)
        text = self.arabic_patterns['heh'].sub('ه', text)
        text = self.arabic_patterns['yeh'].sub('ي', text)
        text = self.arabic_patterns['waw'].sub('و', text)
        return text
    
    def remove_punctuation(self, text):
        """Remove punctuation and special characters"""
        if not isinstance(text, str):
            return ""
        arabic_punctuations = '''`÷×؛<>_()*&^%][ـ،/:"؟.,'{}~¦+|!"…"–ـ'''
        english_punctuations = string.punctuation
        punctuations_list = arabic_punctuations + english_punctuations
        translator = str.maketrans('', '', punctuations_list)
        return text.translate(translator)
    
    def normalize_text(self, text):
        """Apply all normalization steps"""
        if not isinstance(text, str):
            return ""
            
        # Remove diacritics
        text = self.remove_diacritics(text)
        
        # Normalize characters
        text = self.normalize_arabic_chars(text)
        
        # Remove punctuation
        text = self.remove_punctuation(text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def preprocess_for_search(self, text):
        """Prepare text for search operations"""
        # Apply normalization
        text = self.normalize_text(text)
        
        # Convert to lowercase (for any non-Arabic text)
        text = text.lower()
        
        return text


class TafsirChatbot:
    def __init__(self):
        # Initialize the Arabic text preprocessor
        self.preprocessor = ArabicTextPreprocessor()
        csv_file_path = "app/static/data/quran_tafseers_dataset.csv"
        if os.path.exists(csv_file_path):
            print("Loading dataset from CSV file...")
            # Load the dataset from CSV with specific dtypes to ensure correct data types
            self.df = pd.read_csv(csv_file_path, dtype={
                'sura_number': str,
                'ayah_number': str,
                'tafsir_name': str,
                'ayah': str,
                'tafsir': str
            })
        else:
            # If CSV does not exist, load dataset from Hugging Face
            print("Loading dataset from Hugging Face (riotu-lab/Quran-Tafseers)...")
            dataset = load_dataset("riotu-lab/Quran-Tafseers")
            
            # Convert the dataset to a pandas DataFrame for easier manipulation
            self.df = pd.DataFrame(dataset['train'])
            
            # Ensure correct data types before saving
            for col in ['sura_number', 'ayah_number']:
                self.df[col] = self.df[col].astype(str)
            
            # Save the DataFrame to a CSV file for future use
            self.df.to_csv(csv_file_path, index=False)
            print(f"Dataset saved to {csv_file_path}")
        
        # Create verse identifiers
        self.df['verse_id'] = self.df['sura_number'].astype(str) + ":" + self.df['ayah_number'].astype(str)

        try:
            print("Attempting to load saved model...")
            with open('app/static/models/chatbot_model.pkl', 'rb') as model_file:
                saved_model = pickle.load(model_file)
                self.vectorizer = saved_model['vectorizer']
                self.tfidf_matrix = saved_model['matrix']
                print("Loaded model from file.")
        except (FileNotFoundError, KeyError):
                    # Clean and preprocess Arabic text
            print("Preprocessing Arabic text...")
            self.df['clean_text'] = self.df['ayah'].apply(self.preprocessor.preprocess_for_search)
            
            # Combine cleaned text for better matching
            self.df['combined_text'] = self.df['clean_text'] 
            
            # Initialize the vectorizer with Arabic-specific settings
            self.vectorizer = TfidfVectorizer(
                analyzer='char_wb',  # Character n-grams within word boundaries
                ngram_range=(2, 4),  # Use 2-4 character sequences
                min_df=2,            # Minimum document frequency
                max_df=0.9,          # Maximum document frequency
                sublinear_tf=True    # Apply sublinear tf scaling
            )
            # Create and save the model if not found
            print("Creating new TF-IDF matrix...")
            self.tfidf_matrix = self.vectorizer.fit_transform(self.df['combined_text'])
            # Save both the vectorizer and matrix
            with open('chatbot_model.pkl', 'wb') as model_file:
                model_data = {
                    'vectorizer': self.vectorizer,
                    'matrix': self.tfidf_matrix
                }
                pickle.dump(model_data, model_file)
                print("Saved model to file.")
        # Get unique tafseer sources
        self.tafseer_sources = self.df['tafsir_name'].unique()
        
        print(f"Chatbot initialized with {len(self.df)} tafsir entries from {len(self.tafseer_sources)} sources.")
        print(f"Available tafseer sources: {', '.join(self.tafseer_sources)}")
    
    def parse_request(self, user_input, preferred_source=None):
        """Parse user input to identify specific verse requests or general queries"""
        # Clean the user input
        clean_input = self.preprocessor.preprocess_for_search(user_input)
        
        # Check for specific verse pattern (e.g., "2:255" or "surah 2 ayah 255")
        surah_ayah_pattern = r'(\d+)[:\s](\d+)'
        match = re.search(surah_ayah_pattern, user_input)

        # Check if a specific tafseer source is mentioned
        source_match = None
        for source in self.tafseer_sources:
            if source.lower() in user_input.lower() or self.preprocessor.normalize_text(source).lower() in clean_input.lower():
                source_match = source
                break
        
        if match:
            surah_num = int(match.group(1).strip())
            ayah_num = int(match.group(2).strip())
            return self._get_specific_tafsir(surah_num, ayah_num, source_match or preferred_source)
        else:
            return self._get_semantic_tafsir(clean_input, source_match or preferred_source)
    
    def _get_specific_tafsir(self, surah_num, ayah_num, preferred_source=None):
        """Retrieve tafsir for a specific verse"""
        # Filter by surah and ayah
        surah_str = str(surah_num)
        ayah_str = str(ayah_num)
        matches = self.df[(self.df['sura_number'] == surah_str) & (self.df['ayah_number'] == ayah_str)].copy()
        
        if len(matches) == 0:
            return f"لم أجد أي تفسير للآية {surah_num}:{ayah_num}."
        
        # Add tafsir length for prioritization
        matches['tafsir_length'] = matches['tafsir'].apply(lambda x: len(x) if isinstance(x, str) else 0)
        
        # Filter by preferred source if specified
        if preferred_source and preferred_source in self.tafseer_sources:
            source_matches = matches[matches['tafsir_name'] == preferred_source]
            if len(source_matches) > 0:
                # Sort by tafsir length and take the top result
                source_matches = source_matches.sort_values('tafsir_length', ascending=False)
                matches = source_matches.head(1)
        else:
            # Exclude Arberry unless explicitly requested
            if preferred_source != "Arberry":
                matches = matches[matches['tafsir_name'] != "Arberry"]
            
            # For each source, select the entry with the longest tafsir (one with highest length)
            matches = matches.sort_values('tafsir_length', ascending=False)
            matches = matches.drop_duplicates(subset=['tafsir_name'], keep='first')
            
        # Get the top result
        top_result = matches.head(1)

        # Convert to dictionary for response
        result = {
            'verse_id': f"{top_result['sura_number'].values[0]}:{top_result['ayah_number'].values[0]}",
            'text': top_result['ayah'].values[0],
            'tafseer_source': top_result['tafsir_name'].values[0],
            'tafseer': top_result['tafsir'].values[0]
        }
        
        return self._format_response([result])

    def _get_semantic_tafsir(self, query, preferred_source=None, top_n=5):
        """Find tafsir based on semantic similarity to the query"""
        # Vectorize the query
        query_vector = self.vectorizer.transform([query])
        
        # Calculate similarity scores
        similarity_scores = cosine_similarity(query_vector, self.tfidf_matrix)[0]
        
        # Create DataFrame with scores and additional data
        score_df = pd.DataFrame({
            'index': range(len(similarity_scores)),
            'score': similarity_scores,
            'tafsir_name': self.df['tafsir_name'].values,
            'sura_number': self.df['sura_number'].values,
            'ayah_number': self.df['ayah_number'].values,
            'tafsir': self.df['tafsir'].values
        })
        
        # Apply threshold filtering
        score_df = score_df[score_df['score'] > 0.2]
        
        # Apply source filtering
        if preferred_source:
            score_df = score_df[score_df['tafsir_name'] == preferred_source]
        else:
            # Exclude Arberry unless explicitly requested
            score_df = score_df[score_df['tafsir_name'] != "Arberry"]
        
        # Add tafsir length for prioritization
        score_df['tafsir_length'] = score_df['tafsir'].apply(lambda x: len(x) if isinstance(x, str) else 0)
        
        # Create a verse_id field for grouping
        score_df['verse_id'] = score_df['sura_number'] + ':' + score_df['ayah_number']
        
        # If no results after filtering, return early
        if len(score_df) == 0:
            return "لم أجد أي تفسير مناسب لسؤالك. حاول السؤال عن آية محددة (مثل ٢:٢٥٥) أو أعد صياغة سؤالك."
        
        # Check if any result has a high confidence score (>= 0.7)
        high_confidence_results = score_df[score_df['score'] >= 0.7]
        
        if len(high_confidence_results) > 0:
            # Return only the highest confidence result
            best_match = high_confidence_results.sort_values('score', ascending=False).iloc[0]
            idx = best_match['index']
            result = {
                'verse_id': f"{self.df.iloc[idx]['sura_number']}:{self.df.iloc[idx]['ayah_number']}",
                'text': self.df.iloc[idx]['ayah'],
                'tafseer_source': self.df.iloc[idx]['tafsir_name'],
                'tafseer': self.df.iloc[idx]['tafsir'],
                'similarity': best_match['score']
            }
            return self._format_response([result])
        
        # If no high confidence match, continue with normal processing
        # For each verse_id, select the source with highest score (prioritizing longer tafsirs in case of ties)
        # First sort by score (descending) and tafsir_length (descending)
        score_df = score_df.sort_values(['score', 'tafsir_length'], ascending=[False, False])
        
        # Group by verse_id and take the first entry (which has highest score and/or longest tafsir)
        score_df = score_df.drop_duplicates('verse_id')
        
        # Take top_n by score
        score_df = score_df.sort_values('score', ascending=False).head(top_n)
        
        # Convert to results format
        results = []
        for _, row in score_df.iterrows():
            idx = row['index']
            results.append({
                'verse_id': f"{self.df.iloc[idx]['sura_number']}:{self.df.iloc[idx]['ayah_number']}",
                'text': self.df.iloc[idx]['ayah'],
                'tafseer_source': self.df.iloc[idx]['tafsir_name'],
                'tafseer': self.df.iloc[idx]['tafsir'],
                'similarity': row['score']
            })
        
        return self._format_response(results)
    

    def _format_response(self, results):
        """Format the response for better readability"""
        if isinstance(results, str):
            return results
            
        response = ""
        for i, result in enumerate(results):
            response += f"الآية {result['verse_id']}\n"
            response += f"نص الآية: {result['text']}\n"
            response += f"المصدر: {result['tafseer_source']}\n"
            response += f"التفسير: {result['tafseer']}\n"
            
            if i < len(results) - 1:
                response += "\n---\n\n"
                
        return response
    
    def get_available_sources(self):
        """Return a list of available tafseer sources"""
        return list(self.tafseer_sources)
    
    def get_surah_verses(self, surah_id):
        """Get all available verse numbers for a specific surah in the dataset"""
        surah_str = str(surah_id)
        # Find all ayahs in this surah in our dataset
        verses = self.df[self.df['sura_number'] == surah_str]['ayah_number'].unique()
        # Convert to integers and sort
        verse_numbers = sorted([int(v) for v in verses])
        return verse_numbers
    def get_surah_verses(self, surah_id):
        """
        Get all unique verse numbers for a specific surah.
        
        Parameters:
        ----------
        surah_id : int or str
            The ID of the surah to get verses for
            
        Returns:
        -------
        list
            A sorted list of unique verse numbers in this surah
        """
        # Convert surah_id to string for consistency with DataFrame storage
        surah_str = str(surah_id)
        
        # Filter the DataFrame to get only the specified surah
        surah_df = self.df[self.df['sura_number'] == surah_str]
        
        # Extract unique ayah numbers
        unique_verses = surah_df['ayah_number'].unique()
        
        # Convert to integers and sort numerically
        verse_numbers = sorted([int(v) for v in unique_verses])
        
        return verse_numbers

    def get_surah_info(self, surah_id):
        """
        Get information about a specific surah including verse count.
        
        Parameters:
        ----------
        surah_id : int or str
            The ID of the surah
            
        Returns:
        -------
        dict
            Dictionary containing surah information including total verses
        """
        surah_str = str(surah_id)
        
        # Check if the surah exists in our dataset
        if surah_str not in self.df['sura_number'].values:
            return {"error": f"Surah {surah_id} not found in the dataset"}
        
        # Get unique verses in this surah
        verses = self.get_surah_verses(surah_id)
        
        # Get the first occurrence of this surah to extract name information
        first_verse = self.df[self.df['sura_number'] == surah_str].iloc[0]
        
        # Sample verse text to extract surah name if available
        # This assumes the verse text contains the surah name in some format
        # You may need to adjust based on your actual data structure
        
        return {
            "surah_id": int(surah_id),
            "verse_count": len(verses),
            "verses": verses,
            "first_verse": min(verses),
            "last_verse": max(verses)
        }
        
    def respond(self, user_input, preferred_source=None):
        """Main method to process user input and generate a response"""
        if not user_input.strip():
            return "من فضلك اسأل عن آية من القرآن وسأقدم لك تفسيرها."
        
        # Clean the input for processing
        clean_input = user_input.lower().strip()
        
        # Explicit command handling with exact matching
        if clean_input == "خروج" or clean_input == "exit":
            return "جزاك الله خيراً لاستخدامك بوت التفسير. بارك الله فيك!"
            
        if clean_input == "مرحبا" or clean_input == "hello":
            return "السلام عليكم! أنا بوت التفسير. اسألني عن أي آية من القرآن الكريم وسأقدم لك تفسيرها."
            
        # Check for command to list sources (keeping this as it's a functional command)
        if clean_input == "المصادر" or clean_input == "sources":
            sources = self.get_available_sources()
            return f"مصادر التفسير المتاحة:\n" + "\n".join(sources)
        
        # For all other inputs, treat as content query
        return self.parse_request(user_input, preferred_source)