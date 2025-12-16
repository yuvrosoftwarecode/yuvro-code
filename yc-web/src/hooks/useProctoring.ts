import { useEffect, useCallback, useRef } from 'react';
import restApiAuthUtil from '../utils/RestApiAuthUtil';

interface ProctoringConfig {
    assessmentId: string;
    assessmentType: 'skill-tests' | 'contests' | 'mock-interviews' | 'job-tests';
    enabled: boolean;
    questionId?: string; // Optional context
}

export const useProctoring = ({ assessmentId, assessmentType, enabled, questionId }: ProctoringConfig) => {
    const lastActiveRef = useRef<number>(Date.now());

    const logActivity = useCallback(async (activityType: string, metaData: any = {}) => {
        if (!enabled) return;

        try {
            // Dynamic URL based on assessment type
            const url = `/${assessmentType}/${assessmentId}/log-activity/`;

            const payload = {
                activity_type: activityType,
                meta_data: metaData,
                timestamp: new Date().toISOString(),
                ...(questionId && { question_id: questionId })
            };

            await restApiAuthUtil.post(url, payload);
        } catch (error) {
            console.error('Proctoring log error:', error);
            // Fail silently to not disrupt user exam
        }
    }, [assessmentId, assessmentType, enabled, questionId]);

    // 1. Visibility Change (Tab Switch)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                logActivity('tab_switched', { type: 'hidden' });
            } else {
                logActivity('tab_switched', { type: 'visible' });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [logActivity]);

    // 2. Window Blur/Focus
    useEffect(() => {
        const handleBlur = () => logActivity('window_blur');
        const handleFocus = () => logActivity('window_focus');

        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [logActivity]);

    // 3. Copy/Paste/Context Menu
    useEffect(() => {
        const handleCopy = () => logActivity('copy_detected');
        const handlePaste = () => logActivity('paste_detected');
        const handleContextMenu = (e: MouseEvent) => {
            // e.preventDefault(); // Optional: block it? user said "detect", not strictly "block" 
            logActivity('right_click_detected', { x: e.clientX, y: e.clientY });
        };

        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [logActivity]);

    // 4. Fullscreen Change
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                logActivity('fullscreen_exit');
            } else {
                logActivity('fullscreen_enter');
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [logActivity]);

    // 5. Keyboard Shortcut Detection
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Common suspicious keys
            if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'p', 's'].includes(e.key.toLowerCase())) {
                logActivity('keyboard_shortcut', { key: `Ctrl+${e.key}` });
            }
            if (e.key === 'PrintScreen') {
                logActivity('keyboard_shortcut', { key: 'PrintScreen' });
            }
            // Alt+Tab usually blurs, but might capture Alt
            if (e.altKey && e.key === 'Tab') {
                logActivity('keyboard_shortcut', { key: 'Alt+Tab' });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [logActivity]);

    return { logActivity };
};
