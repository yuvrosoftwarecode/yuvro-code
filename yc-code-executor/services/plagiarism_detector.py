import difflib
from typing import List, Dict
from models import PeerSubmission


class PlagiarismService:
    """Service for handling plagiarism detection"""
    
    @staticmethod
    def calculate_similarity_for_plagiarism(user_code: str, peer_submissions: List[PeerSubmission]) -> dict:
        """Calculate plagiarism similarity between user code and peer submissions"""
        if not peer_submissions:
            return {
                "flagged": False,
                "max_similarity": 0.0,
                "matches": []
            }
        
        matches = []
        max_similarity = 0.0
        minimum_threshold = 0.5  # Minimum threshold to include in matches
        flagging_threshold = 0.8  # High threshold for flagging as plagiarized
        
        # Normalize user code once
        normalized_user_code = PlagiarismService._normalize_code(user_code)
        
        for peer in peer_submissions:
            # Normalize peer code
            normalized_peer_code = PlagiarismService._normalize_code(peer.code)
            
            # Calculate similarity using SequenceMatcher
            matcher = difflib.SequenceMatcher(None, normalized_user_code, normalized_peer_code)
            similarity = matcher.ratio()
            
            # Only include matches that cross the minimum threshold
            if similarity > minimum_threshold:
                matches.append({
                    "user_id": peer.user_id,
                    "submission_id": peer.submission_id,
                    "similarity_score": round(similarity, 2)
                })
                max_similarity = max(max_similarity, similarity)
        
        return {
            "flagged": max_similarity > flagging_threshold,
            "max_similarity": round(max_similarity, 2),
            "matches": matches
        }

    @staticmethod
    def _normalize_code(code: str) -> str:
        """Normalize code for plagiarism detection"""
        lines = []
        for line in code.split('\n'):
            # Remove comments
            if '//' in line:
                line = line[:line.index('//')]
            if '#' in line and not line.strip().startswith('#'):
                line = line[:line.index('#')]
            
            # Remove extra whitespace
            line = ' '.join(line.split())
            if line:
                lines.append(line.lower())  # Convert to lowercase for better comparison
        
        return '\n'.join(lines)